#!/usr/bin/env python3
"""
Anki Generator - Fast card generation with safe regex patterns.
"""
import os
import sys
import re
import hashlib
import warnings
from pathlib import Path
from typing import List
from dataclasses import dataclass

sys.stdout.reconfigure(line_buffering=True)
warnings.filterwarnings('ignore')

for dep in ['pypdf', 'genanki']:
    try:
        __import__(dep)
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", dep])

from pypdf import PdfReader
import genanki

@dataclass
class ClozeCard:
    front: str
    back: str
    tags: List[str]
    guid: str

PRIORITY_PATTERNS = [
    r'cracking.*coding.*interview', r'aws', r'amazon.*web', r'clean.*code',
    r'grokking.*system.*design', r'system.*design.*interview', r'devops',
    r'docker', r'kubernetes', r'container', r'ci.?cd', r'jenkins', r'terraform',
    r'ansible', r'cloud',
]
PRIORITY_RE = re.compile('|'.join(PRIORITY_PATTERNS), re.IGNORECASE)

SKIP_PATTERNS = [
    r'table\s*of\s*contents', r'appendix', r'glossary', r'index$', r'bibliography',
    r'references$', r'acknowledgements', r'about\s*the\s*author', r'preface',
    r'foreword', r'dedication', r'copyright', r'title\s*page',
]
SKIP_RE = re.compile('|'.join(SKIP_PATTERNS), re.IGNORECASE)

TECH_KW = [
    'algorithm', 'function', 'method', 'class', 'API', 'database', 'server',
    'cache', 'stack', 'queue', 'tree', 'graph', 'docker', 'kubernetes',
    'container', 'REST', 'HTTP', 'SQL', 'NoSQL', 'thread', 'process',
    'scaling', 'sharding', 'replication', 'cluster', 'latency', 'throughput',
    'DevOps', 'CI/CD', 'pipeline', 'AWS', 'EC2', 'S3', 'Lambda', 'IAM',
    'complexity', 'hash', 'binary', 'recursion', 'load balancer', 'microservice',
    'authentication', 'encryption', 'network', 'memory', 'CPU', 'storage',
]
TECH_RE = re.compile(r'\b(' + '|'.join(re.escape(k) for k in TECH_KW) + r')\b', re.IGNORECASE)

def log(msg):
    print(msg, flush=True)


def extract_text(pdf_path, max_pages=80):
    """Extract text from PDF."""
    try:
        reader = PdfReader(str(pdf_path))
        texts = []
        for i in range(min(len(reader.pages), max_pages)):
            try:
                t = reader.pages[i].extract_text()
                if t and len(t.strip()) > 100:
                    texts.append(t)
            except:
                pass
        return "\n".join(texts)
    except:
        return ""


def generate_cards(pdf_path, target=125):
    """Generate cloze cards from PDF - optimized for speed."""
    name = pdf_path.stem
    tag = re.sub(r'[^a-zA-Z0-9]+', '-', name).strip('-').lower()[:50] or 'book'
    
    raw = extract_text(pdf_path)
    if not raw or len(raw) < 500:
        return []
    
    # Clean and split into sentences
    text = re.sub(r'\s+', ' ', raw).strip()
    
    # Simple sentence split - avoid complex regex
    sentences = []
    for part in text.split('. '):
        part = part.strip()
        if 40 < len(part) < 400:
            sentences.append(part + '.')
    
    cards, seen = [], set()
    
    def add_card(term, sentence):
        # Find term in sentence (case insensitive)
        idx = sentence.lower().find(term.lower())
        if idx == -1:
            return False
        
        actual = sentence[idx:idx+len(term)]
        front = sentence[:idx] + f"{{{{c1::{actual}}}}}" + sentence[idx+len(term):]
        
        if front in seen or len(front) > 500:
            return False
        
        seen.add(front)
        guid = hashlib.md5(f"{name}:{front}".encode()).hexdigest()[:16]
        cards.append(ClozeCard(front=front, back=actual, tags=[tag, 'pdf'], guid=guid))
        return True
    
    # Find sentences with tech keywords and create cards
    for sentence in sentences:
        if len(cards) >= target:
            break
        
        matches = TECH_RE.findall(sentence)
        if matches:
            add_card(matches[0], sentence)
    
    # If we need more cards, look for definition patterns (simple version)
    if len(cards) < target:
        for sentence in sentences:
            if len(cards) >= target:
                break
            
            # Simple "X is Y" pattern
            if ' is ' in sentence.lower() and len(sentence) < 300:
                words = sentence.split()
                if len(words) >= 4:
                    # Try first capitalized word as term
                    for w in words[:5]:
                        if w[0].isupper() and len(w) > 2:
                            add_card(w, sentence)
                            break
    
    return cards[:target]


def export_apkg(cards, output_path, deck_name):
    mid = int(hashlib.md5(deck_name.encode()).hexdigest()[:8], 16)
    model = genanki.Model(mid, f'{deck_name}', model_type=genanki.Model.CLOZE,
        fields=[{'name': 'Text'}, {'name': 'Extra'}],
        templates=[{'name': 'Cloze', 'qfmt': '{{cloze:Text}}', 'afmt': '{{cloze:Text}}<br>{{Extra}}'}])
    
    did = int(hashlib.md5(f"d_{deck_name}".encode()).hexdigest()[:8], 16)
    deck = genanki.Deck(did, f'Books::{deck_name}')
    
    for c in cards:
        deck.add_note(genanki.Note(model=model, fields=[c.front, c.back], tags=c.tags, guid=c.guid))
    
    genanki.Package(deck).write_to_file(str(output_path))


def main():
    ebooks = Path(__file__).parent / "ebooks"
    output = Path(__file__).parent / "anki-cards"
    output.mkdir(exist_ok=True)
    
    all_pdfs = []
    for d in ebooks.iterdir():
        if d.is_dir():
            all_pdfs.extend(d.glob("*.pdf"))
    
    priority = [p for p in all_pdfs if PRIORITY_RE.search(str(p))]
    other = [p for p in all_pdfs if not PRIORITY_RE.search(str(p))]
    
    log("=" * 60)
    log("ANKI GENERATOR - Fast Mode")
    log(f"Priority: {len(priority)} | Other: {len(other)} | Total: {len(all_pdfs)}")
    log("=" * 60)
    
    done, skip, cards_total = 0, 0, 0
    
    def process(pdf, idx, total, tag):
        nonlocal done, skip, cards_total
        name = pdf.stem
        safe = re.sub(r'[^a-zA-Z0-9_-]', '_', name)[:80]
        out_path = output / f"{safe}.apkg"
        
        short_name = name[:35] + "..." if len(name) > 35 else name
        
        if SKIP_RE.search(name):
            skip += 1
            return
        
        if out_path.exists():
            skip += 1
            return
        
        log(f"[{tag}] {idx}/{total} {short_name}")
        
        try:
            cards = generate_cards(pdf)
            if cards:
                export_apkg(cards, out_path, name)
                done += 1
                cards_total += len(cards)
                log(f"  -> {len(cards)} cards (total: {cards_total})")
            else:
                skip += 1
        except Exception as e:
            log(f"  -> err: {str(e)[:40]}")
            skip += 1
    
    log(f"\n=== PHASE 1: {len(priority)} PRIORITY ===")
    for i, pdf in enumerate(priority, 1):
        process(pdf, i, len(priority), "P")
    
    log(f"\n--- Phase 1 done: {done} files, {cards_total} cards ---")
    
    log(f"\n=== PHASE 2: {len(other)} OTHER ===")
    for i, pdf in enumerate(other, 1):
        process(pdf, i, len(other), "O")
        if i % 100 == 0:
            log(f"  [checkpoint: {done} done, {cards_total} cards]")
    
    log("\n" + "=" * 60)
    log(f"COMPLETE! Files: {done} | Cards: {cards_total} | Skipped: {skip}")
    log(f"Output: {output}")
    log("=" * 60)


if __name__ == "__main__":
    main()
