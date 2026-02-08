"""
Parallel Anki Card Generator - Uses multiprocessing for speed.

Processes multiple PDFs concurrently using all available CPU cores.
"""

import os
import sys
import re
import hashlib
import random
import warnings
from pathlib import Path
from typing import List, Tuple, Optional
from dataclasses import dataclass
from multiprocessing import Pool, cpu_count
from functools import partial

# Suppress warnings
warnings.filterwarnings('ignore')

# Install dependencies
def install_deps():
    import subprocess
    deps = ['pypdf', 'genanki']
    for dep in deps:
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


# Technical keywords for extraction
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
    'Git', 'version control', 'branch', 'merge', 'commit', 'repository',
    'testing', 'unit test', 'integration', 'debugging', 'logging',
    'framework', 'library', 'module', 'package', 'dependency',
]

TECH_PATTERN = re.compile(
    r'\b(' + '|'.join(re.escape(k) for k in TECH_KEYWORDS) + r')\b',
    re.IGNORECASE
)

DEFINITION_PATTERNS = [
    r'([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)\s+(?:is|are|refers to|means|describes)\s+([^.]+\.)',
    r'([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)\s*[-–:]\s*([^.]+\.)',
    r'(?:The|A|An)\s+([a-z]+(?:\s+[a-z]+)*)\s+(?:is|are)\s+([^.]+\.)',
]


def extract_text(pdf_path: Path, max_pages: int = 100) -> str:
    """Extract text from PDF."""
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
    """Clean extracted text."""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\b\d+\s*\|\s*', '', text)
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'\S+@\S+\.\S+', '', text)
    return text.strip()


def extract_sentences(text: str) -> List[str]:
    """Split text into valid sentences."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if 30 < len(s.strip()) < 500 and re.search(r'[a-zA-Z]{3,}', s)]


def find_definitions(text: str) -> List[Tuple[str, str]]:
    """Find term-definition pairs."""
    definitions = []
    for pattern in DEFINITION_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            term = match.group(1).strip()
            definition = match.group(0).strip()
            if 3 < len(term) < 50 and len(definition) < 400:
                definitions.append((term, definition))
    return definitions


def find_technical_sentences(sentences: List[str]) -> List[Tuple[str, str]]:
    """Find sentences with technical terms."""
    results = []
    for sentence in sentences:
        matches = list(TECH_PATTERN.finditer(sentence))
        if matches:
            term = matches[0].group(1)
            if len(term) > 2:
                results.append((term, sentence))
    return results


def create_cloze_card(term: str, context: str, book_tag: str, book_name: str) -> Optional[ClozeCard]:
    """Create a cloze card."""
    match = re.search(re.escape(term), context, re.IGNORECASE)
    if not match:
        return None
    actual_term = match.group()
    cloze_text = context[:match.start()] + f"{{{{c1::{actual_term}}}}}" + context[match.end():]
    guid = hashlib.md5(f"{book_name}:{cloze_text}".encode()).hexdigest()[:16]
    return ClozeCard(front=cloze_text, back=actual_term, tags=[book_tag, 'pdf'], guid=guid)


def generate_cards(pdf_path: Path, target_count: int = 125) -> List[ClozeCard]:
    """Generate cloze cards from a PDF."""
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
    """Export cards to APKG format."""
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


# Patterns to skip (non-content sections)
SKIP_PATTERNS = [
    r'table\s*of\s*contents',
    r'appendix',
    r'glossary',
    r'index$',
    r'bibliography',
    r'references$',
    r'acknowledgements',
    r'about\s*the\s*author',
    r'preface',
    r'foreword',
    r'dedication',
    r'copyright',
    r'title\s*page',
]
SKIP_REGEX = re.compile('|'.join(SKIP_PATTERNS), re.IGNORECASE)


def process_single_pdf(args: Tuple[Path, Path, int]) -> Tuple[str, int, bool]:
    """Process a single PDF - worker function for multiprocessing."""
    pdf_path, output_dir, target_cards = args
    pdf_name = pdf_path.stem
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', pdf_name)[:80]
    output_path = output_dir / f"{safe_name}.apkg"
    
    # Skip non-content sections (TOC, appendix, glossary, etc.)
    if SKIP_REGEX.search(pdf_name):
        return (pdf_name, -2, True)  # -2 means skipped (non-content)
    
    # Skip if already processed
    if output_path.exists():
        return (pdf_name, -1, True)  # -1 means skipped (already done)
    
    try:
        cards = generate_cards(pdf_path, target_cards)
        if not cards:
            return (pdf_name, 0, False)
        
        export_to_apkg(cards, output_path, pdf_name)
        return (pdf_name, len(cards), True)
    except Exception as e:
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
    
    total = len(all_pdfs)
    num_workers = min(cpu_count(), 8)  # Use up to 8 cores
    
    print("=" * 60)
    print("Parallel Anki Card Generator")
    print(f"PDFs to process: {total}")
    print(f"Using {num_workers} parallel workers")
    print("=" * 60 + "\n")
    
    # Prepare arguments
    args_list = [(pdf, output_dir, 125) for pdf in all_pdfs]
    
    # Process in parallel
    completed = 0
    skipped_done = 0
    skipped_noncontent = 0
    failed = 0
    total_cards = 0
    
    with Pool(num_workers) as pool:
        for result in pool.imap_unordered(process_single_pdf, args_list):
            pdf_name, card_count, success = result
            completed += 1
            
            if card_count == -1:
                skipped_done += 1
                status = "SKIP (done)"
            elif card_count == -2:
                skipped_noncontent += 1
                status = "SKIP (non-content)"
            elif success:
                total_cards += card_count
                status = f"{card_count} cards"
            else:
                failed += 1
                status = "FAIL"
            
            # Progress update every 10 files
            if completed % 10 == 0 or completed == total:
                pct = (completed / total) * 100
                print(f"[{completed}/{total}] {pct:.1f}% - Cards: {total_cards} | Skip(done): {skipped_done} | Skip(TOC/etc): {skipped_noncontent} | Failed: {failed}")
    
    print("\n" + "=" * 60)
    print(f"Complete! Generated {total_cards} total cards")
    print(f"Processed: {completed - skipped_done - skipped_noncontent - failed} | Skipped: {skipped_done + skipped_noncontent} | Failed: {failed}")
    print(f"Output: {output_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()
