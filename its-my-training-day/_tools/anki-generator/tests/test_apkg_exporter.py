"""
Property-based tests for the APKG exporter.

Feature: interview-training-platform
Property 2: APKG Export Round-Trip
Property 4: Tag Consistency
Validates: Requirements 11.3, 11.5
"""

import sys
import os
import tempfile
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from hypothesis import given, strategies as st, settings, assume, HealthCheck

# Check if genanki is available
try:
    import genanki
    GENANKI_AVAILABLE = True
except ImportError:
    GENANKI_AVAILABLE = False

from cloze_generator import AnkiCard, CardType
from config import GeneratorConfig, TRACK_DECK_IDS

if GENANKI_AVAILABLE:
    from apkg_exporter import APKGExporter, APKGReader, ExportResult


# Skip all tests if genanki is not available
pytestmark = pytest.mark.skipif(
    not GENANKI_AVAILABLE,
    reason="genanki not installed"
)


# Strategies for generating test data
@st.composite
def valid_anki_card(draw):
    """Generate a valid AnkiCard."""
    card_type = draw(st.sampled_from([CardType.CLOZE, CardType.BASIC]))
    
    if card_type == CardType.CLOZE:
        # Generate valid cloze front
        term = draw(st.text(
            alphabet=st.characters(whitelist_categories=('L',)),
            min_size=3, max_size=15
        ).filter(lambda x: x.strip()))
        
        prefix = draw(st.text(
            alphabet=st.characters(whitelist_categories=('L', 'Z')),
            min_size=5, max_size=30
        ).filter(lambda x: x.strip()))
        
        front = f"{prefix} {{{{c1::{term}}}}}"
        back = term
    else:
        front = draw(st.text(
            alphabet=st.characters(whitelist_categories=('L', 'Z', 'P')),
            min_size=10, max_size=100
        ).filter(lambda x: x.strip()))
        
        back = draw(st.text(
            alphabet=st.characters(whitelist_categories=('L', 'Z', 'P')),
            min_size=10, max_size=200
        ).filter(lambda x: x.strip()))
    
    track = draw(st.sampled_from(list(TRACK_DECK_IDS.keys())))
    subdomain = draw(st.text(
        alphabet=st.characters(whitelist_categories=('L',)),
        min_size=3, max_size=15
    ).filter(lambda x: x.strip()))
    
    tags = [track, subdomain]
    
    card_id = draw(st.text(
        alphabet=st.characters(whitelist_categories=('L', 'N')),
        min_size=8, max_size=16
    ).filter(lambda x: x.strip()))
    
    return AnkiCard(
        id=card_id,
        front=front,
        back=back,
        tags=tags,
        source_file="test.md",
        card_type=card_type
    )


@st.composite
def valid_card_list(draw, min_size=1, max_size=10):
    """Generate a list of valid AnkiCards."""
    size = draw(st.integers(min_value=min_size, max_value=max_size))
    cards = []
    
    for _ in range(size):
        card = draw(valid_anki_card())
        cards.append(card)
    
    return cards


class TestAPKGExporterProperties:
    """Property-based tests for APKGExporter.
    
    Feature: interview-training-platform
    Property 2: APKG Export Round-Trip
    Property 4: Tag Consistency
    Validates: Requirements 11.3, 11.5
    """
    
    @given(cards=valid_card_list(min_size=1, max_size=5))
    @settings(max_examples=100)
    def test_apkg_export_round_trip_property(self, cards):
        """
        Property 2: APKG Export Round-Trip
        For any generated Anki card set, exporting to .apkg and re-importing
        SHALL preserve all card content, tags, and metadata.
        Validates: Requirements 11.3
        """
        exporter = APKGExporter()
        reader = APKGReader()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, "test_deck.apkg")
            
            # Export cards
            result = exporter.export(cards, output_path, track="python-backend")
            
            assert result.success, f"Export should succeed: {result.error_message}"
            assert os.path.exists(output_path), "APKG file should be created"
            
            # Read back the exported file
            read_result = reader.read_apkg(output_path)
            
            # Verify card count matches
            assert read_result["card_count"] == len(cards), \
                f"Card count should match: expected {len(cards)}, got {read_result['card_count']}"
            
            # Verify tags are preserved
            original_tags = set()
            for card in cards:
                original_tags.update(card.tags)
            
            read_tags = set(read_result["tags"])
            
            # All original tags should be in read tags
            for tag in original_tags:
                assert tag in read_tags, f"Tag '{tag}' should be preserved"
    
    @given(cards=valid_card_list(min_size=1, max_size=5))
    @settings(max_examples=100, deadline=None)
    def test_tag_consistency_property(self, cards):
        """
        Property 4: Tag Consistency
        For any generated Anki card, the tags SHALL include the correct
        training track and topic matching the source study guide's metadata.
        Validates: Requirements 11.5
        """
        # Ensure all cards have the same track for this test
        track = "react-nodejs-fullstack"
        subdomain = "fundamentals"
        
        # Update cards to have consistent tags
        for card in cards:
            card.tags = [track, subdomain, "test-tag"]
        
        exporter = APKGExporter()
        
        # Verify tags match metadata
        assert exporter.verify_tags_match_metadata(cards, track, subdomain), \
            "All cards should have tags matching the expected track and subdomain"
        
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, "test_deck.apkg")
            
            # Export and verify
            result = exporter.export(cards, output_path, track=track)
            assert result.success, "Export should succeed"
            
            # Read back and verify tags
            reader = APKGReader()
            read_result = reader.read_apkg(output_path)
            
            # Track should be in tags
            assert track in read_result["tags"], \
                f"Track '{track}' should be in exported tags"
    
    @given(
        track=st.sampled_from(list(TRACK_DECK_IDS.keys())),
        subdomain=st.text(
            alphabet=st.characters(whitelist_categories=('L',)),
            min_size=3, max_size=15
        ).filter(lambda x: x.strip())
    )
    @settings(max_examples=100)
    def test_tags_include_track_and_subdomain(self, track, subdomain):
        """
        Property 4: Tag Consistency (comprehensive)
        Tags must include both track and subdomain.
        Validates: Requirements 11.5
        """
        cards = [
            AnkiCard(
                id="test123",
                front="Test {{c1::question}}",
                back="question",
                tags=[track, subdomain],
                source_file="test.md",
                card_type=CardType.CLOZE
            )
        ]
        
        exporter = APKGExporter()
        
        # Verify tag consistency
        assert exporter.verify_tags_match_metadata(cards, track, subdomain)
        
        # Get tags and verify
        for card in cards:
            tags = exporter.get_card_tags(card)
            assert track in tags, f"Track '{track}' should be in tags"
            assert subdomain in tags, f"Subdomain '{subdomain}' should be in tags"


class TestAPKGExporterUnit:
    """Unit tests for specific APKG exporter behaviors."""
    
    def test_export_creates_file(self):
        """Test that export creates an .apkg file."""
        exporter = APKGExporter()
        
        cards = [
            AnkiCard(
                id="test1",
                front="What is {{c1::React}}?",
                back="React",
                tags=["react-nodejs-fullstack", "fundamentals"],
                source_file="test.md",
                card_type=CardType.CLOZE
            )
        ]
        
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, "test.apkg")
            result = exporter.export(cards, output_path)
            
            assert result.success
            assert os.path.exists(output_path)
            assert result.card_count == 1
    
    def test_export_empty_cards_fails(self):
        """Test that exporting empty cards returns failure."""
        exporter = APKGExporter()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, "test.apkg")
            result = exporter.export([], output_path)
            
            assert not result.success
            assert "No cards" in result.error_message
    
    def test_deck_name_generation(self):
        """Test deck name generation from track."""
        exporter = APKGExporter()
        
        cards = [
            AnkiCard(
                id="test1",
                front="Test",
                back="Answer",
                tags=["python-backend"],
                source_file="test.md",
                card_type=CardType.BASIC
            )
        ]
        
        deck_name = exporter._generate_deck_name("python-backend", cards)
        assert "Python Backend" in deck_name
    
    def test_verify_tags_match_metadata_success(self):
        """Test tag verification with matching tags."""
        exporter = APKGExporter()
        
        cards = [
            AnkiCard(
                id="test1",
                front="Test",
                back="Answer",
                tags=["react-nodejs-fullstack", "fundamentals"],
                source_file="test.md",
                card_type=CardType.BASIC
            )
        ]
        
        assert exporter.verify_tags_match_metadata(
            cards, "react-nodejs-fullstack", "fundamentals"
        )
    
    def test_verify_tags_match_metadata_failure(self):
        """Test tag verification with non-matching tags."""
        exporter = APKGExporter()
        
        cards = [
            AnkiCard(
                id="test1",
                front="Test",
                back="Answer",
                tags=["python-backend"],  # Wrong track
                source_file="test.md",
                card_type=CardType.BASIC
            )
        ]
        
        assert not exporter.verify_tags_match_metadata(
            cards, "react-nodejs-fullstack"
        )
