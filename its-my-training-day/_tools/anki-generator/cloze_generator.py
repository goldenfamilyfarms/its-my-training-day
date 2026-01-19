"""
Cloze deletion card generator for Anki.

Creates cloze deletion cards with valid Anki syntax from extracted concepts.
"""

import re
import hashlib
from dataclasses import dataclass, field
from typing import List, Optional, Set, Tuple
from enum import Enum

try:
    from .concept_extractor import Concept, ConceptType, ClozeCandidate
    from .config import GeneratorConfig, DEFAULT_CONFIG
except ImportError:
    from concept_extractor import Concept, ConceptType, ClozeCandidate
    from config import GeneratorConfig, DEFAULT_CONFIG


class CardType(Enum):
    """Types of Anki cards."""
    CLOZE = "cloze"
    BASIC = "basic"


@dataclass
class AnkiCard:
    """An Anki flashcard."""
    id: str
    front: str  # Question or cloze text with {{c1::deletions}}
    back: str   # Answer or revealed text
    tags: List[str] = field(default_factory=list)
    source_file: str = ""
    card_type: CardType = CardType.CLOZE
    source_question: Optional[int] = None
    
    def __hash__(self):
        return hash(self.id)
    
    def __eq__(self, other):
        if not isinstance(other, AnkiCard):
            return False
        return self.id == other.id


class ClozeGenerator:
    """Generates Anki cloze deletion cards from concepts."""
    
    # Anki cloze syntax pattern
    CLOZE_PATTERN = re.compile(r"\{\{c(\d+)::([^}]+)\}\}")
    
    def __init__(self, config: Optional[GeneratorConfig] = None):
        self.config = config or DEFAULT_CONFIG
    
    def generate_cards(
        self,
        candidates: List[ClozeCandidate],
        metadata: dict,
        source_file: str = ""
    ) -> List[AnkiCard]:
        """Generate Anki cards from cloze candidates."""
        cards = []
        seen_fronts: Set[str] = set()
        
        # Build base tags from metadata
        base_tags = self._build_tags(metadata)
        
        # Generate cards from candidates
        for candidate in candidates:
            # Generate forward card (concept hidden)
            forward_card = self._create_cloze_card(
                candidate, 
                base_tags, 
                source_file,
                is_reverse=False
            )
            if forward_card and forward_card.front not in seen_fronts:
                cards.append(forward_card)
                seen_fronts.add(forward_card.front)
            
            # Generate reverse card if enabled
            if self.config.generate_reverse_cards:
                reverse_card = self._create_reverse_card(
                    candidate,
                    base_tags,
                    source_file
                )
                if reverse_card and reverse_card.front not in seen_fronts:
                    cards.append(reverse_card)
                    seen_fronts.add(reverse_card.front)
        
        # If we don't have enough cards, generate additional variations
        if len(cards) < self.config.min_cards:
            additional = self._generate_additional_cards(
                candidates, 
                base_tags, 
                source_file,
                seen_fronts,
                self.config.min_cards - len(cards)
            )
            cards.extend(additional)
        
        return cards
    
    def _build_tags(self, metadata: dict) -> List[str]:
        """Build tags from metadata."""
        tags = list(self.config.default_tags)
        
        if metadata.get("track"):
            tags.append(metadata["track"])
        if metadata.get("subdomain"):
            tags.append(metadata["subdomain"])
        if metadata.get("difficulty"):
            tags.append(f"difficulty::{metadata['difficulty']}")
        
        return tags
    
    def _create_cloze_card(
        self,
        candidate: ClozeCandidate,
        tags: List[str],
        source_file: str,
        is_reverse: bool = False
    ) -> Optional[AnkiCard]:
        """Create a cloze deletion card from a candidate."""
        # Escape special characters in cloze text
        cloze_text = self._escape_cloze_text(candidate.cloze_text)
        full_text = candidate.full_text
        
        # Check if cloze text exists in full text
        if cloze_text.lower() not in full_text.lower():
            return None
        
        # Create cloze deletion
        cloze_front = self._apply_cloze_deletion(full_text, cloze_text, 1)
        
        if not cloze_front:
            return None
        
        # Generate unique ID
        card_id = self._generate_card_id(cloze_front, source_file)
        
        # Add type-specific tag
        card_tags = tags + [f"type::{candidate.cloze_type.value}"]
        if candidate.source_question:
            card_tags.append(f"q{candidate.source_question}")
        
        return AnkiCard(
            id=card_id,
            front=cloze_front,
            back=candidate.cloze_text,
            tags=card_tags,
            source_file=source_file,
            card_type=CardType.CLOZE,
            source_question=candidate.source_question
        )

    def _create_reverse_card(
        self,
        candidate: ClozeCandidate,
        tags: List[str],
        source_file: str
    ) -> Optional[AnkiCard]:
        """Create a reverse card (definition -> concept)."""
        # Only create reverse for terms and definitions
        if candidate.cloze_type not in [ConceptType.TERM, ConceptType.DEFINITION]:
            return None
        
        # For reverse, we show the definition and ask for the term
        if candidate.cloze_type == ConceptType.TERM:
            # Find definition in context
            context = candidate.full_text
            term = candidate.cloze_text
            
            # Create a "What is this?" style card
            front = f"What concept is described by: {context.replace(term, '___')}"
            back = term
        else:
            # Definition type - ask for the definition
            front = f"Define: {candidate.cloze_text}"
            back = candidate.full_text
        
        card_id = self._generate_card_id(front, source_file + "_reverse")
        card_tags = tags + ["reverse", f"type::{candidate.cloze_type.value}"]
        
        return AnkiCard(
            id=card_id,
            front=front,
            back=back,
            tags=card_tags,
            source_file=source_file,
            card_type=CardType.BASIC,
            source_question=candidate.source_question
        )
    
    def _apply_cloze_deletion(self, text: str, cloze_text: str, cloze_num: int) -> Optional[str]:
        """Apply cloze deletion syntax to text."""
        # Find the cloze text in the full text (case-insensitive)
        pattern = re.compile(re.escape(cloze_text), re.IGNORECASE)
        match = pattern.search(text)
        
        if not match:
            return None
        
        # Replace with cloze syntax
        actual_text = match.group()
        cloze_syntax = f"{{{{c{cloze_num}::{actual_text}}}}}"
        
        result = text[:match.start()] + cloze_syntax + text[match.end():]
        return result
    
    def _escape_cloze_text(self, text: str) -> str:
        """Escape special characters for cloze text."""
        # Remove any existing cloze syntax
        text = re.sub(r"\{\{c\d+::", "", text)
        text = text.replace("}}", "")
        return text.strip()
    
    def _generate_card_id(self, content: str, source: str) -> str:
        """Generate a unique ID for a card."""
        combined = f"{source}:{content}"
        return hashlib.md5(combined.encode()).hexdigest()[:16]
    
    def _generate_additional_cards(
        self,
        candidates: List[ClozeCandidate],
        tags: List[str],
        source_file: str,
        seen_fronts: Set[str],
        needed: int
    ) -> List[AnkiCard]:
        """Generate additional cards to meet minimum count."""
        additional = []
        
        # Strategy 1: Create multi-cloze cards (multiple deletions in one card)
        for i in range(0, len(candidates) - 1, 2):
            if len(additional) >= needed:
                break
            
            c1 = candidates[i]
            c2 = candidates[i + 1] if i + 1 < len(candidates) else None
            
            if c2:
                # Create multi-cloze even with different contexts
                multi_card = self._create_multi_cloze_card(
                    [c1, c2], tags, source_file
                )
                if multi_card and multi_card.front not in seen_fronts:
                    additional.append(multi_card)
                    seen_fronts.add(multi_card.front)
                    seen_fronts.add(multi_card.front)
        
        # Strategy 2: Create fill-in-the-blank variations
        for candidate in candidates:
            if len(additional) >= needed:
                break
            
            fill_card = self._create_fill_blank_card(
                candidate, tags, source_file
            )
            if fill_card and fill_card.front not in seen_fronts:
                additional.append(fill_card)
                seen_fronts.add(fill_card.front)
        
        # Strategy 3: Create question-answer cards from context
        for candidate in candidates:
            if len(additional) >= needed:
                break
            
            qa_card = self._create_qa_card(candidate, tags, source_file)
            if qa_card and qa_card.front not in seen_fronts:
                additional.append(qa_card)
                seen_fronts.add(qa_card.front)
        
        # Strategy 4: Create "True or False" style cards
        for candidate in candidates:
            if len(additional) >= needed:
                break
            
            tf_card = self._create_true_false_card(candidate, tags, source_file)
            if tf_card and tf_card.front not in seen_fronts:
                additional.append(tf_card)
                seen_fronts.add(tf_card.front)
        
        # Strategy 5: Create "Complete the sentence" cards
        for candidate in candidates:
            if len(additional) >= needed:
                break
            
            complete_card = self._create_complete_sentence_card(candidate, tags, source_file)
            if complete_card and complete_card.front not in seen_fronts:
                additional.append(complete_card)
                seen_fronts.add(complete_card.front)
        
        return additional
    
    def _create_multi_cloze_card(
        self,
        candidates: List[ClozeCandidate],
        tags: List[str],
        source_file: str
    ) -> Optional[AnkiCard]:
        """Create a card with multiple cloze deletions."""
        if not candidates:
            return None
        
        text = candidates[0].full_text
        
        for i, candidate in enumerate(candidates, 1):
            cloze_text = self._escape_cloze_text(candidate.cloze_text)
            text = self._apply_cloze_deletion(text, cloze_text, i) or text
        
        card_id = self._generate_card_id(text, source_file + "_multi")
        
        return AnkiCard(
            id=card_id,
            front=text,
            back=", ".join(c.cloze_text for c in candidates),
            tags=tags + ["multi-cloze"],
            source_file=source_file,
            card_type=CardType.CLOZE
        )
    
    def _create_fill_blank_card(
        self,
        candidate: ClozeCandidate,
        tags: List[str],
        source_file: str
    ) -> Optional[AnkiCard]:
        """Create a fill-in-the-blank style card."""
        context = candidate.full_text
        term = candidate.cloze_text
        
        # Replace term with blank
        front = context.replace(term, "_____")
        if front == context:  # No replacement made
            return None
        
        front = f"Fill in the blank: {front}"
        
        card_id = self._generate_card_id(front, source_file + "_fill")
        
        return AnkiCard(
            id=card_id,
            front=front,
            back=term,
            tags=tags + ["fill-blank"],
            source_file=source_file,
            card_type=CardType.BASIC,
            source_question=candidate.source_question
        )
    
    def _create_qa_card(
        self,
        candidate: ClozeCandidate,
        tags: List[str],
        source_file: str
    ) -> Optional[AnkiCard]:
        """Create a question-answer card from context."""
        if candidate.cloze_type == ConceptType.TERM:
            front = f"What is {candidate.cloze_text}?"
            back = candidate.full_text
        elif candidate.cloze_type == ConceptType.CODE_PATTERN:
            front = f"What does `{candidate.cloze_text}` do?"
            back = candidate.full_text
        else:
            return None
        
        card_id = self._generate_card_id(front, source_file + "_qa")
        
        return AnkiCard(
            id=card_id,
            front=front,
            back=back,
            tags=tags + ["qa"],
            source_file=source_file,
            card_type=CardType.BASIC,
            source_question=candidate.source_question
        )
    
    def validate_cloze_syntax(self, card: AnkiCard) -> bool:
        """Validate that a card has valid Anki cloze syntax."""
        if card.card_type != CardType.CLOZE:
            return True  # Non-cloze cards don't need cloze syntax
        
        # Check for valid cloze pattern
        matches = self.CLOZE_PATTERN.findall(card.front)
        
        if not matches:
            return False
        
        # Verify cloze numbers are sequential starting from 1
        cloze_nums = sorted(int(m[0]) for m in matches)
        expected = list(range(1, len(cloze_nums) + 1))
        
        return cloze_nums == expected
    
    def get_cloze_content(self, card: AnkiCard) -> List[str]:
        """Extract the content hidden by cloze deletions."""
        if card.card_type != CardType.CLOZE:
            return []
        
        matches = self.CLOZE_PATTERN.findall(card.front)
        return [m[1] for m in matches]

    def _create_true_false_card(
        self,
        candidate: ClozeCandidate,
        tags: List[str],
        source_file: str
    ) -> Optional[AnkiCard]:
        """Create a true/false style card."""
        context = candidate.full_text
        term = candidate.cloze_text
        
        # Create a statement that is true
        front = f"True or False: The following statement contains '{term}': {context}"
        back = "True"
        
        card_id = self._generate_card_id(front, source_file + "_tf")
        
        return AnkiCard(
            id=card_id,
            front=front,
            back=back,
            tags=tags + ["true-false"],
            source_file=source_file,
            card_type=CardType.BASIC,
            source_question=candidate.source_question
        )
    
    def _create_complete_sentence_card(
        self,
        candidate: ClozeCandidate,
        tags: List[str],
        source_file: str
    ) -> Optional[AnkiCard]:
        """Create a complete-the-sentence style card."""
        context = candidate.full_text
        term = candidate.cloze_text
        
        # Split context at the term
        parts = context.split(term, 1)
        if len(parts) != 2:
            return None
        
        front = f"Complete: {parts[0]}..."
        back = f"{term}{parts[1]}"
        
        card_id = self._generate_card_id(front, source_file + "_complete")
        
        return AnkiCard(
            id=card_id,
            front=front,
            back=back,
            tags=tags + ["complete-sentence"],
            source_file=source_file,
            card_type=CardType.BASIC,
            source_question=candidate.source_question
        )
