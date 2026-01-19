"""
Command-line interface for the Anki card generator.

Usage:
    python -m anki_generator generate --input <file> --output <dir> [options]
"""

import argparse
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import List, Optional

try:
    from .markdown_parser import MarkdownParser
    from .concept_extractor import ConceptExtractor
    from .cloze_generator import ClozeGenerator
    from .apkg_exporter import APKGExporter
    from .config import GeneratorConfig, DEFAULT_CONFIG
except ImportError:
    from markdown_parser import MarkdownParser
    from concept_extractor import ConceptExtractor
    from cloze_generator import ClozeGenerator
    from apkg_exporter import APKGExporter
    from config import GeneratorConfig, DEFAULT_CONFIG


def create_parser() -> argparse.ArgumentParser:
    """Create the argument parser."""
    parser = argparse.ArgumentParser(
        prog="anki-generator",
        description="Generate Anki cloze deletion flashcards from study guides."
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Generate command
    gen_parser = subparsers.add_parser(
        "generate",
        help="Generate Anki cards from a study guide"
    )
    
    gen_parser.add_argument(
        "--input", "-i",
        required=True,
        help="Path to the study guide markdown file"
    )
    
    gen_parser.add_argument(
        "--output", "-o",
        required=True,
        help="Output directory for the .apkg file"
    )
    
    gen_parser.add_argument(
        "--min-cards",
        type=int,
        default=100,
        help="Minimum number of cards to generate (default: 100)"
    )
    
    gen_parser.add_argument(
        "--tags",
        type=str,
        default="",
        help="Comma-separated list of additional tags"
    )
    
    gen_parser.add_argument(
        "--deck-name",
        type=str,
        default=None,
        help="Custom deck name (default: auto-generated from metadata)"
    )
    
    gen_parser.add_argument(
        "--no-reverse",
        action="store_true",
        help="Disable generation of reverse cards"
    )
    
    gen_parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    # Info command
    info_parser = subparsers.add_parser(
        "info",
        help="Show information about a study guide"
    )
    
    info_parser.add_argument(
        "--input", "-i",
        required=True,
        help="Path to the study guide markdown file"
    )
    
    return parser


def print_progress(message: str, verbose: bool = True):
    """Print a progress message."""
    if verbose:
        print(f"[*] {message}")


def print_error(message: str):
    """Print an error message."""
    print(f"[ERROR] {message}", file=sys.stderr)


def print_success(message: str):
    """Print a success message."""
    print(f"[✓] {message}")


def cmd_generate(args) -> int:
    """Execute the generate command."""
    verbose = args.verbose
    
    # Validate input file
    input_path = Path(args.input)
    if not input_path.exists():
        print_error(f"Input file not found: {args.input}")
        return 1
    
    if not input_path.suffix == ".md":
        print_error(f"Input file must be a markdown file (.md): {args.input}")
        return 1
    
    # Create output directory if needed
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Parse additional tags
    additional_tags = [t.strip() for t in args.tags.split(",") if t.strip()]
    
    # Configure generator
    config = GeneratorConfig(
        min_cards=args.min_cards,
        generate_reverse_cards=not args.no_reverse,
        default_tags=additional_tags
    )
    
    print_progress(f"Parsing study guide: {input_path.name}", verbose)
    
    try:
        # Parse the study guide
        parser = MarkdownParser()
        parsed = parser.parse_file(str(input_path))
        
        print_progress(f"Found {len(parsed.qa_pairs)} Q&A pairs", verbose)
        print_progress(f"Track: {parsed.metadata.track}", verbose)
        print_progress(f"Subdomain: {parsed.metadata.subdomain}", verbose)
        
        # Extract concepts
        print_progress("Extracting concepts...", verbose)
        extractor = ConceptExtractor()
        concepts = extractor.extract_from_parsed_guide(parsed)
        print_progress(f"Extracted {len(concepts)} concepts", verbose)
        
        # Generate cloze candidates
        candidates = extractor.generate_cloze_candidates(concepts)
        print_progress(f"Generated {len(candidates)} cloze candidates", verbose)
        
        # Generate cards
        print_progress("Generating Anki cards...", verbose)
        generator = ClozeGenerator(config)
        
        metadata = {
            "track": parsed.metadata.track,
            "subdomain": parsed.metadata.subdomain,
            "difficulty": parsed.metadata.difficulty
        }
        
        cards = generator.generate_cards(
            candidates,
            metadata,
            str(input_path)
        )
        
        print_progress(f"Generated {len(cards)} cards", verbose)
        
        # Validate cards
        valid_cards = []
        invalid_count = 0
        for card in cards:
            if generator.validate_cloze_syntax(card):
                valid_cards.append(card)
            else:
                invalid_count += 1
        
        if invalid_count > 0:
            print_progress(f"Filtered {invalid_count} invalid cards", verbose)
        
        if len(valid_cards) < config.min_cards:
            print_error(
                f"Could only generate {len(valid_cards)} valid cards "
                f"(minimum: {config.min_cards}). "
                "Consider adding more content to the study guide."
            )
            # Continue anyway with what we have
        
        # Export to APKG
        print_progress("Exporting to APKG format...", verbose)
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d")
        topic_name = parsed.metadata.title.lower().replace(" ", "-")
        output_filename = f"{topic_name}-{timestamp}.apkg"
        output_path = output_dir / output_filename
        
        exporter = APKGExporter(config)
        result = exporter.export(
            valid_cards,
            str(output_path),
            deck_name=args.deck_name,
            track=parsed.metadata.track
        )
        
        if result.success:
            print_success(f"Created {output_path}")
            print_success(f"Total cards: {result.card_count}")
            return 0
        else:
            print_error(f"Export failed: {result.error_message}")
            return 1
            
    except FileNotFoundError as e:
        print_error(str(e))
        return 1
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        if verbose:
            import traceback
            traceback.print_exc()
        return 1


def cmd_info(args) -> int:
    """Execute the info command."""
    input_path = Path(args.input)
    
    if not input_path.exists():
        print_error(f"Input file not found: {args.input}")
        return 1
    
    try:
        parser = MarkdownParser()
        parsed = parser.parse_file(str(input_path))
        
        print(f"\n{'='*50}")
        print(f"Study Guide: {parsed.metadata.title}")
        print(f"{'='*50}\n")
        
        print(f"Track:          {parsed.metadata.track}")
        print(f"Subdomain:      {parsed.metadata.subdomain}")
        print(f"Difficulty:     {parsed.metadata.difficulty}")
        print(f"Target Roles:   {', '.join(parsed.metadata.target_roles)}")
        print(f"Estimated Time: {parsed.metadata.estimated_time}")
        print(f"Q&A Pairs:      {len(parsed.qa_pairs)}")
        
        print(f"\nQuestions:")
        for qa in parsed.qa_pairs:
            print(f"  Q{qa.question_number}: {qa.question[:60]}...")
            print(f"    - Key concepts: {len(qa.key_concepts)}")
            print(f"    - Code blocks: {len(qa.code_blocks)}")
            print(f"    - Follow-ups: {len(qa.follow_up_questions)}")
        
        # Estimate card count
        extractor = ConceptExtractor()
        concepts = extractor.extract_from_parsed_guide(parsed)
        candidates = extractor.generate_cloze_candidates(concepts)
        
        print(f"\nEstimated Cards:")
        print(f"  Concepts extracted: {len(concepts)}")
        print(f"  Cloze candidates:   {len(candidates)}")
        print(f"  Est. total cards:   ~{len(candidates) * 2} (with reverse)")
        
        return 0
        
    except Exception as e:
        print_error(f"Error parsing file: {e}")
        return 1


def main(argv: Optional[List[str]] = None) -> int:
    """Main entry point."""
    parser = create_parser()
    args = parser.parse_args(argv)
    
    if args.command is None:
        parser.print_help()
        return 0
    
    if args.command == "generate":
        return cmd_generate(args)
    elif args.command == "info":
        return cmd_info(args)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
