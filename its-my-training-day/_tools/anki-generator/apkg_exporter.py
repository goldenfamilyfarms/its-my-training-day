"""
APKG exporter for Anki cards.

Exports generated cards to .apkg format using genanki library.
"""

import os
import random
from pathlib import Path
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

try:
    import genanki
    GENANKI_AVAILABLE = True
except ImportError:
    GENANKI_AVAILABLE = False

try:
    from .cloze_generator import AnkiCard, CardType
    from .config import GeneratorConfig, DEFAULT_CONFIG, TRACK_DECK_IDS
except ImportError:
    from cloze_generator import AnkiCard, CardType
    from config import GeneratorConfig, DEFAULT_CONFIG, TRACK_DECK_IDS


@dataclass
class ExportResult:
    """Result of an APKG export operation."""
    success: bool
    output_path: str
    card_count: int
    error_message: Optional[str] = None


class APKGExporter:
    """Exports Anki cards to .apkg format."""
    
    # Cloze model template
    CLOZE_MODEL_ID = 1607392319
    BASIC_MODEL_ID = 1607392320
    
    def __init__(self, config: Optional[GeneratorConfig] = None):
        self.config = config or DEFAULT_CONFIG
        
        if not GENANKI_AVAILABLE:
            raise ImportError(
                "genanki is required for APKG export. "
                "Install it with: pip install genanki"
            )
        
        # Create Anki models
        self._cloze_model = self._create_cloze_model()
        self._basic_model = self._create_basic_model()
    
    def _create_cloze_model(self) -> 'genanki.Model':
        """Create the cloze deletion model for Anki."""
        return genanki.Model(
            self.CLOZE_MODEL_ID,
            'Interview Training Cloze',
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
                font-size: 20px;
                text-align: center;
                color: black;
                background-color: white;
            }
            .cloze {
                font-weight: bold;
                color: blue;
            }
            code {
                background-color: #f4f4f4;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: monospace;
            }
            '''
        )
    
    def _create_basic_model(self) -> 'genanki.Model':
        """Create the basic Q&A model for Anki."""
        return genanki.Model(
            self.BASIC_MODEL_ID,
            'Interview Training Basic',
            fields=[
                {'name': 'Front'},
                {'name': 'Back'},
            ],
            templates=[{
                'name': 'Basic Card',
                'qfmt': '{{Front}}',
                'afmt': '{{FrontSide}}<hr id="answer">{{Back}}',
            }],
            css='''
            .card {
                font-family: arial;
                font-size: 20px;
                text-align: center;
                color: black;
                background-color: white;
            }
            code {
                background-color: #f4f4f4;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: monospace;
            }
            '''
        )

    def export(
        self,
        cards: List[AnkiCard],
        output_path: str,
        deck_name: Optional[str] = None,
        track: Optional[str] = None
    ) -> ExportResult:
        """Export cards to an .apkg file."""
        if not cards:
            return ExportResult(
                success=False,
                output_path=output_path,
                card_count=0,
                error_message="No cards to export"
            )
        
        try:
            # Determine deck ID and name
            deck_id = self._get_deck_id(track)
            if deck_name is None:
                deck_name = self._generate_deck_name(track, cards)
            
            # Create deck
            deck = genanki.Deck(deck_id, deck_name)
            
            # Add cards to deck
            for card in cards:
                note = self._create_note(card)
                if note:
                    deck.add_note(note)
            
            # Ensure output directory exists
            output_dir = Path(output_path).parent
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Create package and write to file
            package = genanki.Package(deck)
            package.write_to_file(output_path)
            
            return ExportResult(
                success=True,
                output_path=output_path,
                card_count=len(cards)
            )
            
        except Exception as e:
            return ExportResult(
                success=False,
                output_path=output_path,
                card_count=0,
                error_message=str(e)
            )
    
    def _get_deck_id(self, track: Optional[str]) -> int:
        """Get the deck ID for a track."""
        if track and track in TRACK_DECK_IDS:
            return TRACK_DECK_IDS[track]
        return self.config.deck_id_base
    
    def _generate_deck_name(self, track: Optional[str], cards: List[AnkiCard]) -> str:
        """Generate a deck name from track and cards."""
        prefix = self.config.deck_name_prefix
        
        if track:
            track_name = track.replace("-", " ").title()
            return f"{prefix}::{track_name}"
        
        # Try to get track from card tags
        if cards and cards[0].tags:
            for tag in cards[0].tags:
                if tag in TRACK_DECK_IDS:
                    track_name = tag.replace("-", " ").title()
                    return f"{prefix}::{track_name}"
        
        return prefix
    
    def _create_note(self, card: AnkiCard) -> Optional['genanki.Note']:
        """Create a genanki Note from an AnkiCard."""
        if card.card_type == CardType.CLOZE:
            return genanki.Note(
                model=self._cloze_model,
                fields=[card.front, card.back],
                tags=card.tags,
                guid=card.id
            )
        else:
            return genanki.Note(
                model=self._basic_model,
                fields=[card.front, card.back],
                tags=card.tags,
                guid=card.id
            )
    
    def get_card_tags(self, card: AnkiCard) -> List[str]:
        """Get the tags for a card."""
        return card.tags
    
    def verify_tags_match_metadata(
        self,
        cards: List[AnkiCard],
        expected_track: str,
        expected_subdomain: Optional[str] = None
    ) -> bool:
        """Verify that all cards have tags matching the expected metadata."""
        for card in cards:
            if expected_track not in card.tags:
                return False
            if expected_subdomain and expected_subdomain not in card.tags:
                return False
        return True


class APKGReader:
    """Reader for .apkg files (for testing round-trip)."""
    
    def __init__(self):
        if not GENANKI_AVAILABLE:
            raise ImportError("genanki is required")
    
    def read_apkg(self, file_path: str) -> Dict[str, Any]:
        """
        Read an .apkg file and extract card information.
        
        Note: genanki doesn't have built-in read support, so this uses
        the underlying SQLite database structure.
        """
        import sqlite3
        import zipfile
        import tempfile
        import os
        
        result = {
            "cards": [],
            "tags": set(),
            "deck_name": None,
            "card_count": 0
        }
        
        try:
            # Extract the .apkg (it's a zip file)
            with tempfile.TemporaryDirectory() as temp_dir:
                with zipfile.ZipFile(file_path, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
                
                # Read the SQLite database
                db_path = os.path.join(temp_dir, 'collection.anki2')
                if not os.path.exists(db_path):
                    return result
                
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                # Get notes (cards)
                cursor.execute("SELECT flds, tags FROM notes")
                for row in cursor.fetchall():
                    fields = row[0].split('\x1f')  # Anki field separator
                    tags = row[1].split() if row[1] else []
                    
                    result["cards"].append({
                        "fields": fields,
                        "tags": tags
                    })
                    result["tags"].update(tags)
                
                result["card_count"] = len(result["cards"])
                result["tags"] = list(result["tags"])
                
                conn.close()
                
        except Exception as e:
            result["error"] = str(e)
        
        return result
