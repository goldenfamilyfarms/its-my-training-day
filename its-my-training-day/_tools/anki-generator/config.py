"""
Configuration settings for the Anki card generator.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class GeneratorConfig:
    """Configuration for Anki card generation."""
    
    # Minimum number of cards to generate per study guide
    min_cards: int = 100
    
    # Maximum cloze deletions per card
    max_cloze_per_card: int = 3
    
    # Minimum word length for cloze deletion candidates
    min_word_length: int = 4
    
    # Default tags to add to all cards
    default_tags: List[str] = field(default_factory=list)
    
    # Whether to generate reverse cards (definition -> concept)
    generate_reverse_cards: bool = True
    
    # Whether to include code blocks in cloze deletions
    include_code_cloze: bool = True
    
    # Anki deck name prefix
    deck_name_prefix: str = "Interview Training"
    
    # Model ID for genanki (should be unique and consistent)
    model_id: int = 1607392319
    
    # Deck ID base (will be modified per track)
    deck_id_base: int = 2059400110


# Default configuration instance
DEFAULT_CONFIG = GeneratorConfig()


# Track-specific deck IDs
TRACK_DECK_IDS = {
    "react-nodejs-fullstack": 2059400111,
    "python-backend": 2059400112,
    "system-design-architecture": 2059400113,
}


# Difficulty level mappings
DIFFICULTY_LEVELS = {
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3,
}


# Common technical terms that should be preserved in cloze deletions
TECHNICAL_TERMS = {
    # React/JavaScript
    "useState", "useEffect", "useCallback", "useMemo", "useReducer",
    "useContext", "useRef", "React", "JSX", "props", "state",
    "component", "render", "lifecycle", "hooks", "closure",
    
    # Python
    "decorator", "generator", "iterator", "async", "await",
    "coroutine", "GIL", "metaclass", "descriptor", "property",
    "classmethod", "staticmethod", "functools", "wraps",
    
    # System Design
    "CAP", "ACID", "BASE", "sharding", "replication",
    "consistency", "availability", "partition", "latency",
    "throughput", "scalability", "microservices", "monolith",
}
