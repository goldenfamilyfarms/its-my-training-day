"""
Anki Card Generator - Generate Anki cloze deletion flashcards from study guides.

This package provides tools to parse study guide markdown files and generate
Anki-compatible .apkg files with cloze deletion cards.
"""

__version__ = "1.0.0"
__author__ = "Interview Training Platform"

from .markdown_parser import MarkdownParser, StudyGuideMetadata, QAPair
from .concept_extractor import ConceptExtractor, Concept
from .cloze_generator import ClozeGenerator, AnkiCard
from .apkg_exporter import APKGExporter

__all__ = [
    "MarkdownParser",
    "StudyGuideMetadata",
    "QAPair",
    "ConceptExtractor",
    "Concept",
    "ClozeGenerator",
    "AnkiCard",
    "APKGExporter",
]
