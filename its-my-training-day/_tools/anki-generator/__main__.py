"""
Entry point for running the anki-generator as a module.

Usage:
    python -m anki_generator generate --input <file> --output <dir>
"""

from .cli import main
import sys

if __name__ == "__main__":
    sys.exit(main())
