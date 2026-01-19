"""
Generate Anki cloze deletion cards from PDF books.

This script:
1. Extracts text from each PDF in book subdirectories
2. Identifies key concepts, definitions, and technical terms
3. Creates 200 cloze deletion cards per book
4. Exports to .apkg format in anki-cards directory
"""

import os
import sys
import re
import hashlib
import random
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

# Install dependencies
def install_deps():
    import subprocess
    deps = ['pypdf', 'genanki']
    for dep in deps:
        try:
            __import__(dep)
        except ImportError:
            print(f"Installing {dep}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep])

install_deps()

from pypdf import PdfReader
import genanki


@dataclass
class ClozeCard:
    """A cloze deletion card."""
    front: str  # Text with {{c1::term}} syntax
    back: str   # The hidden term
    tags: List[str]
    guid: str


class PDFTextExtractor:
    """Extract and clean text from PDFs."""
    
    @staticmethod
    def extract_text(pdf_path: Path, max_pages: int = 100) -> str:
        """Extract text from PDF, limiting to max_pages."""
        try:
            reader = PdfReader(str(pdf_path))
            pages_to_read = min(len(reader.pages), max_pages)
            
            text_parts = []
            for i in range(pages_to_read):
                try:
                    page_text = reader.pages[i].extract_text()
                    if page_text:
                        text_parts.append(page_text)
                except Exception:
                    continue
            
            return "\n".join(text_parts)
        except Exception as e:
            print(f"  Error extracting text: {e}")
            return ""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean extracted text."""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove page numbers and headers
        text = re.sub(r'\b\d+\s*\|\s*', '', text)
        # Remove URLs
        text = re.sub(r'https?://\S+', '', text)
        # Remove email addresses
        text = re.sub(r'\S+@\S+\.\S+', '', text)
        return text.strip()


class ConceptExtractor:
    """Extract key concepts from text for cloze cards."""
    
    # Patterns for finding definitions
    DEFINITION_PATTERNS = [
        r'([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)\s+(?:is|are|refers to|means|describes)\s+([^.]+\.)',
        r'([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)\s*[-–:]\s*([^.]+\.)',
        r'(?:The|A|An)\s+([a-z]+(?:\s+[a-z]+)*)\s+(?:is|are)\s+([^.]+\.)',
    ]
    
    # Technical terms to look for
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
    ]
    
    def __init__(self):
        self.tech_pattern = re.compile(
            r'\b(' + '|'.join(re.escape(k) for k in self.TECH_KEYWORDS) + r')\b',
            re.IGNORECASE
        )
    
    def extract_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Split on sentence boundaries
        sentences = re.split(r'(?<=[.!?])\s+', text)
        # Filter valid sentences
        valid = []
        for s in sentences:
            s = s.strip()
            # Must be reasonable length
            if 30 < len(s) < 500:
                # Must contain some letters
                if re.search(r'[a-zA-Z]{3,}', s):
                    valid.append(s)
        return valid
    
    def find_definitions(self, text: str) -> List[Tuple[str, str]]:
        """Find term-definition pairs."""
        definitions = []
        
        for pattern in self.DEFINITION_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                term = match.group(1).strip()
                definition = match.group(0).strip()
                if 3 < len(term) < 50 and len(definition) < 400:
                    definitions.append((term, definition))
        
        return definitions
    
    def find_technical_sentences(self, sentences: List[str]) -> List[Tuple[str, str]]:
        """Find sentences with technical terms."""
        results = []
        
        for sentence in sentences:
            matches = list(self.tech_pattern.finditer(sentence))
            if matches:
                # Pick the most significant term
                for match in matches:
                    term = match.group(1)
                    if len(term) > 2:
                        results.append((term, sentence))
                        break
        
        return results
    
    def find_key_phrases(self, text: str) -> List[Tuple[str, str]]:
        """Find key phrases worth memorizing."""
        results = []
        
        # Look for "X is important because Y" patterns
        patterns = [
            r'([^.]+)\s+is\s+(?:important|crucial|essential|key|critical)\s+(?:because|since|as)\s+([^.]+\.)',
            r'(?:The\s+)?(?:main|key|primary|important)\s+(?:benefit|advantage|feature|purpose)\s+of\s+([^.]+)\s+is\s+([^.]+\.)',
            r'([^.]+)\s+(?:helps|allows|enables|provides|ensures)\s+([^.]+\.)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                full = match.group(0).strip()
                term = match.group(1).strip()
                if 20 < len(full) < 400 and 3 < len(term) < 100:
                    results.append((term, full))
        
        return results


class ClozeCardGenerator:
    """Generate cloze deletion cards."""
    
    def __init__(self, book_name: str):
        self.book_name = book_name
        self.book_tag = self._create_tag(book_name)
    
    def _create_tag(self, name: str) -> str:
        """Create a valid Anki tag from book name."""
        tag = re.sub(r'[^a-zA-Z0-9]+', '-', name)
        tag = tag.strip('-').lower()
        return tag[:50] if tag else 'book'
    
    def _generate_guid(self, content: str) -> str:
        """Generate unique ID for card."""
        combined = f"{self.book_name}:{content}"
        return hashlib.md5(combined.encode()).hexdigest()[:16]
    
    def create_cloze_card(self, term: str, context: str) -> Optional[ClozeCard]:
        """Create a cloze card hiding the term in context."""
        # Escape special characters
        term_escaped = re.escape(term)
        
        # Find term in context (case-insensitive)
        match = re.search(term_escaped, context, re.IGNORECASE)
        if not match:
            return None
        
        # Get actual term as it appears
        actual_term = match.group()
        
        # Create cloze text
        cloze_text = context[:match.start()] + f"{{{{c1::{actual_term}}}}}" + context[match.end():]
        
        return ClozeCard(
            front=cloze_text,
            back=actual_term,
            tags=[self.book_tag, 'pdf-generated'],
            guid=self._generate_guid(cloze_text)
        )
    
    def create_fill_blank_card(self, term: str, context: str) -> Optional[ClozeCard]:
        """Create a fill-in-the-blank style cloze card."""
        match = re.search(re.escape(term), context, re.IGNORECASE)
        if not match:
            return None
        
        actual_term = match.group()
        blank_text = context[:match.start()] + "_____" + context[match.end():]
        cloze_text = f"Fill in the blank: {blank_text}\n\nAnswer: {{{{c1::{actual_term}}}}}"
        
        return ClozeCard(
            front=cloze_text,
            back=actual_term,
            tags=[self.book_tag, 'fill-blank'],
            guid=self._generate_guid(cloze_text)
        )


def generate_cards_for_book(pdf_path: Path, target_count: int = 200) -> List[ClozeCard]:
    """Generate cloze cards from a PDF."""
    book_name = pdf_path.stem
    
    # Extract text
    extractor = PDFTextExtractor()
    raw_text = extractor.extract_text(pdf_path)
    if not raw_text:
        return []
    
    text = extractor.clean_text(raw_text)
    
    # Extract concepts
    concept_extractor = ConceptExtractor()
    sentences = concept_extractor.extract_sentences(text)
    definitions = concept_extractor.find_definitions(text)
    tech_sentences = concept_extractor.find_technical_sentences(sentences)
    key_phrases = concept_extractor.find_key_phrases(text)
    
    # Generate cards
    generator = ClozeCardGenerator(book_name)
    cards = []
    seen_fronts = set()
    
    def add_card(card: Optional[ClozeCard]):
        if card and card.front not in seen_fronts:
            cards.append(card)
            seen_fronts.add(card.front)
    
    # From definitions
    for term, definition in definitions:
        add_card(generator.create_cloze_card(term, definition))
        if len(cards) >= target_count:
            break
    
    # From technical sentences
    for term, sentence in tech_sentences:
        add_card(generator.create_cloze_card(term, sentence))
        if len(cards) >= target_count:
            break
    
    # From key phrases
    for term, phrase in key_phrases:
        add_card(generator.create_cloze_card(term, phrase))
        if len(cards) >= target_count:
            break
    
    # Fill-blank variations if needed
    if len(cards) < target_count:
        all_pairs = definitions + tech_sentences + key_phrases
        random.shuffle(all_pairs)
        for term, context in all_pairs:
            add_card(generator.create_fill_blank_card(term, context))
            if len(cards) >= target_count:
                break
    
    return cards[:target_count]


def export_to_apkg(cards: List[ClozeCard], output_path: Path, deck_name: str):
    """Export cards to APKG format."""
    # Create cloze model
    model_id = int(hashlib.md5(deck_name.encode()).hexdigest()[:8], 16)
    cloze_model = genanki.Model(
        model_id,
        f'{deck_name} Cloze',
        model_type=genanki.Model.CLOZE,
        fields=[
            {'name': 'Text'},
            {'name': 'Extra'},
        ],
        templates=[{
            'name': 'Cloze Card',
            'qfmt': '{{cloze:Text}}',
            'afmt': '{{cloze:Text}}<br><br>{{Extra}}',
        }],
        css='''
        .card {
            font-family: arial;
            font-size: 18px;
            text-align: left;
            color: black;
            background-color: white;
            padding: 20px;
            max-width: 600px;
            margin: auto;
        }
        .cloze {
            font-weight: bold;
            color: #0066cc;
        }
        '''
    )
    
    # Create deck
    deck_id = int(hashlib.md5(f"deck_{deck_name}".encode()).hexdigest()[:8], 16)
    deck = genanki.Deck(deck_id, f'Books::{deck_name}')
    
    # Add cards
    for card in cards:
        note = genanki.Note(
            model=cloze_model,
            fields=[card.front, card.back],
            tags=card.tags,
            guid=card.guid
        )
        deck.add_note(note)
    
    # Export
    package = genanki.Package(deck)
    package.write_to_file(str(output_path))


def process_all_books(ebooks_dir: Path, output_dir: Path, cards_per_pdf: int = 125):
    """Process all PDFs in book directories, creating one .apkg per PDF."""
    output_dir.mkdir(exist_ok=True)
    
    # Find all book directories
    book_dirs = [d for d in ebooks_dir.iterdir() if d.is_dir()]
    
    # Collect all PDFs from all directories
    all_pdfs = []
    for book_dir in book_dirs:
        pdfs = list(book_dir.glob("*.pdf"))
        all_pdfs.extend(pdfs)
    
    print(f"Found {len(all_pdfs)} PDF files across {len(book_dirs)} directories\n")
    
    results = []
    
    for i, pdf_path in enumerate(all_pdfs, 1):
        pdf_name = pdf_path.stem
        print(f"[{i}/{len(all_pdfs)}] Processing: {pdf_name}")
        
        # Generate cards
        cards = generate_cards_for_book(pdf_path, cards_per_pdf)
        
        if not cards:
            print(f"  Could not extract cards")
            continue
        
        print(f"  Generated {len(cards)} cards")
        
        # Export to APKG - use PDF name for the file
        safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', pdf_name)[:80]
        output_path = output_dir / f"{safe_name}.apkg"
        
        try:
            export_to_apkg(cards, output_path, pdf_name)
            print(f"  Saved: {output_path.name}")
            results.append((pdf_name, len(cards), output_path))
        except Exception as e:
            print(f"  Error exporting: {e}")
    
    return results


def main():
    script_dir = Path(__file__).parent
    ebooks_dir = script_dir / "ebooks"
    output_dir = script_dir / "anki-cards"
    
    print("=" * 60)
    print("Anki Card Generator for PDF Books")
    print("=" * 60 + "\n")
    
    if not ebooks_dir.exists():
        print(f"Error: {ebooks_dir} not found")
        return
    
    results = process_all_books(ebooks_dir, output_dir, cards_per_pdf=125)
    
    print("\n" + "=" * 60)
    print(f"Summary: Generated cards for {len(results)} books")
    print(f"Output directory: {output_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()
