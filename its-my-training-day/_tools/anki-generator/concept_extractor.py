"""
Concept extractor for study guide content.

Identifies key terms, definitions, code patterns, and generates cloze deletion candidates.
"""

import re
from dataclasses import dataclass, field
from typing import List, Optional, Set, Tuple
from enum import Enum

try:
    from .config import TECHNICAL_TERMS
except ImportError:
    from config import TECHNICAL_TERMS


class ConceptType(Enum):
    """Types of concepts that can be extracted."""
    TERM = "term"
    DEFINITION = "definition"
    CODE_PATTERN = "code_pattern"
    KEY_CONCEPT = "key_concept"
    QUESTION = "question"
    ANSWER_POINT = "answer_point"


@dataclass
class Concept:
    """A concept extracted from study guide content."""
    text: str
    concept_type: ConceptType
    context: str  # Surrounding text for context
    source_question: Optional[int] = None  # Q number if from a Q&A pair
    importance: int = 1  # 1-3, higher = more important
    
    def __hash__(self):
        return hash((self.text, self.concept_type, self.source_question))
    
    def __eq__(self, other):
        if not isinstance(other, Concept):
            return False
        return (self.text == other.text and 
                self.concept_type == other.concept_type and
                self.source_question == other.source_question)


@dataclass
class ClozeCandidate:
    """A candidate for cloze deletion card generation."""
    full_text: str  # The complete sentence/context
    cloze_text: str  # The text to be hidden
    cloze_type: ConceptType
    source_question: Optional[int] = None
    hint: Optional[str] = None  # Optional hint for the cloze


class ConceptExtractor:
    """Extracts concepts and cloze candidates from parsed study guides."""
    
    # Patterns for identifying important content
    BOLD_PATTERN = re.compile(r"\*\*(.+?)\*\*")
    CODE_INLINE_PATTERN = re.compile(r"`([^`]+)`")
    NUMBERED_LIST_PATTERN = re.compile(r"^\s*\d+\.\s*\*\*(.+?)\*\*\s*[-–:]\s*(.+)$", re.MULTILINE)
    BULLET_DEFINITION_PATTERN = re.compile(r"^\s*[-•]\s*\*\*(.+?)\*\*\s*[-–:]\s*(.+)$", re.MULTILINE)
    SENTENCE_PATTERN = re.compile(r"[^.!?]*[.!?]")
    
    def __init__(self, technical_terms: Optional[Set[str]] = None):
        self.technical_terms = technical_terms or TECHNICAL_TERMS
    
    def extract_from_parsed_guide(self, parsed_guide) -> List[Concept]:
        """Extract all concepts from a parsed study guide."""
        concepts = []
        
        # Extract from overview
        if parsed_guide.overview:
            concepts.extend(self._extract_from_text(
                parsed_guide.overview, 
                source_question=None
            ))
        
        # Extract from each Q&A pair
        for qa in parsed_guide.qa_pairs:
            # Question itself is a concept
            concepts.append(Concept(
                text=qa.question,
                concept_type=ConceptType.QUESTION,
                context=qa.question,
                source_question=qa.question_number,
                importance=3
            ))
            
            # Extract from answer
            concepts.extend(self._extract_from_text(
                qa.answer,
                source_question=qa.question_number
            ))
            
            # Key concepts are high-importance
            for kc in qa.key_concepts:
                concepts.append(Concept(
                    text=kc,
                    concept_type=ConceptType.KEY_CONCEPT,
                    context=kc,
                    source_question=qa.question_number,
                    importance=3
                ))
            
            # Extract from code blocks
            for code in qa.code_blocks:
                concepts.extend(self._extract_from_code(
                    code,
                    source_question=qa.question_number
                ))
        
        # Deduplicate while preserving order
        seen = set()
        unique_concepts = []
        for c in concepts:
            if c not in seen:
                seen.add(c)
                unique_concepts.append(c)
        
        return unique_concepts

    def _extract_from_text(self, text: str, source_question: Optional[int] = None) -> List[Concept]:
        """Extract concepts from a text block."""
        concepts = []
        
        # Extract bold terms (usually important)
        for match in self.BOLD_PATTERN.finditer(text):
            term = match.group(1)
            context = self._get_sentence_context(text, match.start())
            concepts.append(Concept(
                text=term,
                concept_type=ConceptType.TERM,
                context=context,
                source_question=source_question,
                importance=2
            ))
        
        # Extract inline code
        for match in self.CODE_INLINE_PATTERN.finditer(text):
            code = match.group(1)
            if len(code) > 2:  # Skip very short code
                context = self._get_sentence_context(text, match.start())
                concepts.append(Concept(
                    text=code,
                    concept_type=ConceptType.CODE_PATTERN,
                    context=context,
                    source_question=source_question,
                    importance=2
                ))
        
        # Extract numbered definitions (e.g., "1. **Term** - definition")
        for match in self.NUMBERED_LIST_PATTERN.finditer(text):
            term = match.group(1)
            definition = match.group(2).strip()
            concepts.append(Concept(
                text=term,
                concept_type=ConceptType.TERM,
                context=f"{term}: {definition}",
                source_question=source_question,
                importance=3
            ))
            concepts.append(Concept(
                text=definition,
                concept_type=ConceptType.DEFINITION,
                context=f"{term}: {definition}",
                source_question=source_question,
                importance=2
            ))
        
        # Extract bullet definitions
        for match in self.BULLET_DEFINITION_PATTERN.finditer(text):
            term = match.group(1)
            definition = match.group(2).strip()
            concepts.append(Concept(
                text=term,
                concept_type=ConceptType.TERM,
                context=f"{term}: {definition}",
                source_question=source_question,
                importance=2
            ))
        
        # Extract technical terms from the text
        for term in self.technical_terms:
            if term.lower() in text.lower():
                # Find the actual occurrence to get context
                pattern = re.compile(re.escape(term), re.IGNORECASE)
                for match in pattern.finditer(text):
                    context = self._get_sentence_context(text, match.start())
                    concepts.append(Concept(
                        text=match.group(),
                        concept_type=ConceptType.TERM,
                        context=context,
                        source_question=source_question,
                        importance=2
                    ))
                    break  # Only first occurrence
        
        return concepts
    
    def _extract_from_code(self, code: str, source_question: Optional[int] = None) -> List[Concept]:
        """Extract concepts from code blocks."""
        concepts = []
        
        # Extract function/method names
        func_pattern = re.compile(r"(?:def|function|const|let|var)\s+(\w+)")
        for match in func_pattern.finditer(code):
            name = match.group(1)
            if len(name) > 2 and not name.startswith("_"):
                concepts.append(Concept(
                    text=name,
                    concept_type=ConceptType.CODE_PATTERN,
                    context=code[:200],  # First 200 chars as context
                    source_question=source_question,
                    importance=1
                ))
        
        # Extract class names
        class_pattern = re.compile(r"class\s+(\w+)")
        for match in class_pattern.finditer(code):
            name = match.group(1)
            concepts.append(Concept(
                text=name,
                concept_type=ConceptType.CODE_PATTERN,
                context=code[:200],
                source_question=source_question,
                importance=2
            ))
        
        return concepts
    
    def _get_sentence_context(self, text: str, position: int) -> str:
        """Get the sentence containing the given position."""
        # Find sentence boundaries
        sentences = list(self.SENTENCE_PATTERN.finditer(text))
        
        for match in sentences:
            if match.start() <= position < match.end():
                return match.group().strip()
        
        # Fallback: return surrounding text
        start = max(0, position - 100)
        end = min(len(text), position + 100)
        return text[start:end].strip()
    
    def generate_cloze_candidates(self, concepts: List[Concept]) -> List[ClozeCandidate]:
        """Generate cloze deletion candidates from extracted concepts."""
        candidates = []
        
        for concept in concepts:
            # Skip very short or very long texts
            if len(concept.text) < 3 or len(concept.text) > 100:
                continue
            
            # Skip if context is too short
            if len(concept.context) < 20:
                continue
            
            # Create cloze candidate
            candidate = ClozeCandidate(
                full_text=concept.context,
                cloze_text=concept.text,
                cloze_type=concept.concept_type,
                source_question=concept.source_question,
                hint=self._generate_hint(concept)
            )
            candidates.append(candidate)
        
        return candidates
    
    def _generate_hint(self, concept: Concept) -> Optional[str]:
        """Generate a hint for a cloze deletion."""
        if concept.concept_type == ConceptType.TERM:
            return f"({len(concept.text)} letters)"
        elif concept.concept_type == ConceptType.CODE_PATTERN:
            return "(code)"
        elif concept.concept_type == ConceptType.DEFINITION:
            return "(definition)"
        return None
