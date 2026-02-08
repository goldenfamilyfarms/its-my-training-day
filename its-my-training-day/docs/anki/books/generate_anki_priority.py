"""
Priority Anki Card Generator - Process high-priority books first.

Focuses on: Cracking the Coding Interview, AWS, Clean Code, Grokking System Design, DevOps, Docker
"""

import os
import sys
import re
import hashlib
import warnings
from pathlib import Path
from typing import List, Tuple, Optional
from dataclasses import dataclass
from multiprocessing import Pool, cpu_count

warnings.filterwarnings('ignore')

def install_deps():
    import subprocess
    for dep in ['pypdf', 'genanki']:
        try:
            __import__(dep)
        except ImportError:
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep], 
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

install_deps()

from pypdf import PdfReader
import genanki


@dataclass
class ClozeCard:
    front: str
    back: str
    tags: List[str]
    guid: str


# Priority patterns - books to process first
PRIORITY_PATTERNS = [
    r'cracking.*coding.*interview',
    r'aws',
    r'amazon.*web.*service',
    r'clean.*code',
    r'grokking.*system.*design',
    r'system.*design.*interview',
    r'devops',
    r'docker',
    r'kubernetes',
    r'container',
    r'ci.?cd',
    r'jenkins',
    r'terraform',
    r'ansible',
    r'cloud',
]
PRIORITY_REGEX = re.compile('|'.join(PRIORITY_PATTERNS), re.IGNORECASE)

# Skip patterns
SKIP_PATTERNS = [
    r'table\s*of\s*contents', r'appendix', r'glossary', r'index$',
    r'bibliography', r'references$', r'acknowledgements', r'about\s*the\s*author',
    r'preface', r'foreword', r'dedication', r'copyright', r'title\s*page',
]
SKIP_REGEX = re.compile('|'.join(SKIP_PATTERNS), re.IGNORECASE)

# Technical keywords
TECH_KEYWORDS = [
    'algorithm', 'function', 'method', 'class', 'object', 'variable',
    'database', 'server', 'client', 'API', 'protocol', 'network',
    'memory', 'cache', 'buffer', 'stack', 'queue', 'tree', 'graph',
    'encryption', 'authentication', 'authorization', 'security',
    'container', 'docker', 'kubernetes', 'microservice', 'monolith',
    'REST', 'HTTP', 'TCP', 'UDP', 'DNS', 'IP', 'SSL', 'TLS',
    'SQL', 'NoSQL', 'index', 'query', 'transaction', 'ACID',
    'thread', 'process', 'concurrency', 'parallelism', 'async',
    'load balancer', 'proxy', 'firewall', 'gateway', 'router',
    'scaling', 'sharding', 'replication', 'partition', 'cluster',
    'latency', 'throughput', 'bandwidth', 'availability', 'reliability',
    'DevOps', 'CI/CD', 'pipeline', 'deployment', 'monitoring',
    'Python', 'JavaScript', 'Java', 'Linux', 'AWS', 'Azure', 'GCP',
    'EC2', 'S3', 'Lambda', 'IAM', 'VPC', 'ECS', 'EKS', 'RDS',
    'big O', 'complexity', 'hash', 'binary', 'recursion', 'dynamic programming',
]
TECH_PATTERN = re.compile(r'\b(' + '|'.join(re.escape(k) for k in TECH_KEYWORDS) + r')\b', re.IGNORECASE)

DEFINITION_PATTERNS = [
    r'([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)\s+(?:is|are|refers to|means|describes)\s+([^.]+\.)',
    r'([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)\s*[-–:]\s*([^.]+\.)',
    r'(?:The|A|An)\s+([a-z]+(?:\s+[a-z]+)*)\s+(?:is|are)\s+([^.]+\.)',
]


def extract_text(pdf_path: Path, max_pages: int = 100) -> str:
    try:
        reader = PdfReader(str(pdf_path))
        pages_to_read = min(len(reader.pages), max_pages)
        text_parts = []
        for i in range(pages_to_read):
            try:
                page_text = reader.pages[i].extract_text()
                if page_text:
                    text_parts.append(page_text)
            except:
                continue
        return "\n".join(text_parts)
    except:
        return ""


def clean_text(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\b\d+\s*\|\s*', '', text)
    text = re.sub(r'https?://\S+', '', text)
    return text.strip()


def extract_sentences(text: str) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if 30 < len(s.strip()) < 500 and re.search(r'[a-zA-Z]{3,}', s)]


def find_definitions(text: str) -> List[Tuple[str, str]]:
    definitions = []
    for pattern in DEFINITION_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            term = match.group(1).strip()
            definition = match.group(0).strip()
            if 3 < len(term) < 50 and len(definition) < 400:
                definitions.append((term, definition))
    return definitions


def find_technical_sentences(sentences: List[str]) -> List[Tuple[str, str]]:
    results = []
    for sentence in sentences:
        matches = list(TECH_PATTERN.finditer(sentence))
        if matches:
            term = matches[0].group(1)
            if len(term) > 2:
                results.append((term, sentence))
    return results


def create_cloze_card(term: str, context: str, book_tag: str, book_name: str) -> Optional[ClozeCard]:
    match = re.search(re.escape(term), context, re.IGNORECASE)
    if not match:
        return None
    actual_term = match.group()
    cloze_text = context[:match.start()] + f"{{{{c1::{actual_term}}}}}" + context[match.end():]
    guid = hashlib.md5(f"{book_name}:{cloze_text}".encode()).hexdigest()[:16]
    return ClozeCard(front=cloze_text, back=actual_term, tags=[book_tag, 'pdf'], guid=guid)


def generate_cards(pdf_path: Path, target_count: int = 125) -> List[ClozeCard]:
    book_name = pdf_path.stem
    book_tag = re.sub(r'[^a-zA-Z0-9]+', '-', book_name).strip('-').lower()[:50] or 'book'
    
    raw_text = extract_text(pdf_path)
    if not raw_text:
        return []
    
    text = clean_text(raw_text)
    sentences = extract_sentences(text)
    definitions = find_definitions(text)
    tech_sentences = find_technical_sentences(sentences)
    
    cards = []
    seen = set()
    
    def add(card):
        if card and card.front not in seen:
            cards.append(card)
            seen.add(card.front)
    
    for term, definition in definitions:
        add(create_cloze_card(term, definition, book_tag, book_name))
        if len(cards) >= target_count:
            break
    
    for term, sentence in tech_sentences:
        add(create_cloze_card(term, sentence, book_tag, book_name))
        if len(cards) >= target_count:
            break
    
    return cards[:target_count]


def export_to_apkg(cards: List[ClozeCard], output_path: Path, deck_name: str):
    model_id = int(hashlib.md5(deck_name.encode()).hexdigest()[:8], 16)
    cloze_model = genanki.Model(
        model_id, f'{deck_name} Cloze',
        model_type=genanki.Model.CLOZE,
        fields=[{'name': 'Text'}, {'name': 'Extra'}],
        templates=[{'name': 'Cloze', 'qfmt': '{{cloze:Text}}', 'afmt': '{{cloze:Text}}<br>{{Extra}}'}],
    )
    deck_id = int(hashlib.md5(f"deck_{deck_name}".encode()).hexdigest()[:8], 16)
    deck = genanki.Deck(deck_id, f'Books::{deck_name}')
    for card in cards:
        note = genanki.Note(model=cloze_model, fields=[card.front, card.back], tags=card.tags, guid=card.guid)
        deck.add_note(note)
    genanki.Package(deck).write_to_file(str(output_path))


def process_single_pdf(args: Tuple[Path, Path, int]) -> Tuple[str, int, bool]:
    pdf_path, output_dir, target_cards = args
    pdf_name = pdf_path.stem
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', pdf_name)[:80]
    output_path = output_dir / f"{safe_name}.apkg"
    
    if SKIP_REGEX.search(pdf_name):
        return (pdf_name, -2, True)
    
    if output_path.exists():
        return (pdf_name, -1, True)
    
    try:
        cards = generate_cards(pdf_path, target_cards)
        if not cards:
            return (pdf_name, 0, False)
        export_to_apkg(cards, output_path, pdf_name)
        return (pdf_name, len(cards), True)
    except:
        return (pdf_name, 0, False)


def main():
    script_dir = Path(__file__).parent
    ebooks_dir = script_dir / "ebooks"
    output_dir = script_dir / "anki-cards"
    output_dir.mkdir(exist_ok=True)
    
    # Collect all PDFs
    all_pdfs = []
    for book_dir in ebooks_dir.iterdir():
        if book_dir.is_dir():
            all_pdfs.extend(book_dir.glob("*.pdf"))
    
    # Separate priority and non-priority
    priority_pdfs = []
    other_pdfs = []
    
    for pdf in all_pdfs:
        # Check both filename and parent directory name
        full_path_str = str(pdf)
        if PRIORITY_REGEX.search(full_path_str):
            priority_pdfs.append(pdf)
        else:
            other_pdfs.append(pdf)
    
    print("=" * 60)
    print("Priority Anki Card Generator")
    print(f"Priority PDFs: {len(priority_pdfs)}")
    print(f"Other PDFs: {len(other_pdfs)}")
    print("=" * 60 + "\n")
    
    num_workers = min(cpu_count(), 8)
    
    # Process priority first
    print(f"[PHASE 1] Processing {len(priority_pdfs)} PRIORITY PDFs with {num_workers} workers...\n")
    
    args_list = [(pdf, output_dir, 125) for pdf in priority_pdfs]
    
    completed = 0
    total_cards = 0
    skipped = 0
    
    with Pool(num_workers) as pool:
        for result in pool.imap_unordered(process_single_pdf, args_list):
            pdf_name, card_count, success = result
            completed += 1
            
            if card_count == -1 or card_count == -2:
                skipped += 1
            elif success:
                total_cards += card_count
            
            if completed % 5 == 0 or completed == len(priority_pdfs):
                pct = (completed / len(priority_pdfs)) * 100
                print(f"[Priority {completed}/{len(priority_pdfs)}] {pct:.1f}% - Cards: {total_cards}")
    
    print(f"\n{'=' * 60}")
    print(f"PRIORITY COMPLETE! Generated {total_cards} cards from priority books")
    print(f"{'=' * 60}\n")
    
    # Ask to continue with others
    print(f"[PHASE 2] Processing {len(other_pdfs)} remaining PDFs...\n")
    
    args_list = [(pdf, output_dir, 125) for pdf in other_pdfs]
    completed = 0
    
    with Pool(num_workers) as pool:
        for result in pool.imap_unordered(process_single_pdf, args_list):
            pdf_name, card_count, success = result
            completed += 1
            
            if card_count > 0:
                total_cards += card_count
            
            if completed % 50 == 0 or completed == len(other_pdfs):
                pct = (completed / len(other_pdfs)) * 100
                print(f"[Other {completed}/{len(other_pdfs)}] {pct:.1f}% - Total Cards: {total_cards}")
    
    print(f"\n{'=' * 60}")
    print(f"ALL COMPLETE! Total cards generated: {total_cards}")
    print(f"Output: {output_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()
