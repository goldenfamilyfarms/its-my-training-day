"""
Property-based tests for the markdown parser.

Feature: interview-training-platform, Property 5: Study Guide Template Conformance
Validates: Requirements 5.2, 5.3
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from hypothesis import given, strategies as st, settings, assume

from markdown_parser import MarkdownParser, StudyGuideMetadata, QAPair, ParsedStudyGuide


# Strategies for generating valid study guide components
@st.composite
def valid_track(draw):
    """Generate a valid track name."""
    return draw(st.sampled_from([
        "react-nodejs-fullstack",
        "python-backend", 
        "system-design-architecture"
    ]))


@st.composite
def valid_difficulty(draw):
    """Generate a valid difficulty level."""
    return draw(st.sampled_from(["beginner", "intermediate", "advanced"]))


@st.composite
def valid_metadata(draw):
    """Generate valid metadata fields."""
    track = draw(valid_track())
    subdomain = draw(st.text(
        alphabet=st.characters(whitelist_categories=('L', 'N'), whitelist_characters='-_'),
        min_size=3, max_size=20
    ).filter(lambda x: x.strip() and x[0].isalpha()))
    difficulty = draw(valid_difficulty())
    roles = draw(st.lists(
        st.text(alphabet=st.characters(whitelist_categories=('L', 'N', 'Z')), min_size=3, max_size=30)
        .filter(lambda x: x.strip()),
        min_size=1, max_size=3
    ))
    estimated_time = draw(st.integers(min_value=15, max_value=180))
    
    return {
        "track": track,
        "subdomain": subdomain,
        "difficulty": difficulty,
        "roles": roles,
        "estimated_time": f"{estimated_time} minutes"
    }


@st.composite
def valid_question(draw, q_num: int = 1):
    """Generate a valid question text."""
    question = draw(st.text(
        alphabet=st.characters(whitelist_categories=('L', 'N', 'Z', 'P')),
        min_size=10, max_size=200
    ).filter(lambda x: x.strip() and '?' in x or x.endswith('?') == False))
    
    # Ensure it ends with a question mark
    if not question.strip().endswith('?'):
        question = question.strip() + '?'
    
    return question


@st.composite
def valid_answer(draw):
    """Generate a valid answer text."""
    return draw(st.text(
        alphabet=st.characters(whitelist_categories=('L', 'N', 'Z', 'P')),
        min_size=50, max_size=500
    ).filter(lambda x: x.strip()))


@st.composite
def valid_key_concepts(draw):
    """Generate valid key concepts list."""
    return draw(st.lists(
        st.text(
            alphabet=st.characters(whitelist_categories=('L', 'N', 'Z')),
            min_size=3, max_size=50
        ).filter(lambda x: x.strip()),
        min_size=1, max_size=5
    ))


@st.composite
def valid_qa_pair(draw, q_num: int = 1):
    """Generate a valid Q&A pair."""
    question = draw(valid_question(q_num))
    answer = draw(valid_answer())
    key_concepts = draw(valid_key_concepts())
    
    return {
        "number": q_num,
        "question": question,
        "answer": answer,
        "key_concepts": key_concepts
    }


def build_study_guide_markdown(
    title: str,
    metadata: dict,
    overview: str,
    qa_pairs: list
) -> str:
    """Build a valid study guide markdown string from components."""
    roles_str = ", ".join(metadata["roles"])
    
    md = f"""# Study Guide: {title}

## Metadata
- **Track**: {metadata["track"]}
- **Subdomain**: {metadata["subdomain"]}
- **Difficulty**: {metadata["difficulty"]}
- **Target Roles**: {roles_str}
- **Estimated Time**: {metadata["estimated_time"]}

## Overview

{overview}

---

## Questions

"""
    
    for qa in qa_pairs:
        concepts_list = "\n".join([f"- {c}" for c in qa["key_concepts"]])
        md += f"""### Q{qa["number"]}: {qa["question"]}

**Answer:**

{qa["answer"]}

**Key Concepts:**
{concepts_list}

**Follow-up Questions:**
1. Can you explain this further?
2. What are the tradeoffs?

---

"""
    
    md += """## Summary

### Key Takeaways
- Important point 1
- Important point 2
"""
    
    return md


class TestMarkdownParserProperties:
    """Property-based tests for MarkdownParser.
    
    Feature: interview-training-platform, Property 5: Study Guide Template Conformance
    For any study guide file, parsing the markdown SHALL successfully extract 
    all required metadata fields and Q&A sections.
    Validates: Requirements 5.2, 5.3
    """
    
    @given(
        title=st.text(alphabet=st.characters(whitelist_categories=('L', 'N', 'Z')), min_size=5, max_size=50).filter(lambda x: x.strip()),
        metadata=valid_metadata(),
        overview=st.text(alphabet=st.characters(whitelist_categories=('L', 'N', 'Z', 'P')), min_size=20, max_size=200).filter(lambda x: x.strip()),
    )
    @settings(max_examples=100)
    def test_metadata_extraction_preserves_all_fields(self, title, metadata, overview):
        """
        Property 5: Study Guide Template Conformance
        For any valid study guide, parsing SHALL extract all metadata fields.
        Validates: Requirements 5.2, 5.3
        """
        # Build a minimal study guide with just metadata
        qa_pairs = [{
            "number": 1,
            "question": "What is the main concept?",
            "answer": "This is a detailed answer explaining the concept thoroughly.",
            "key_concepts": ["concept1", "concept2"]
        }]
        
        md_content = build_study_guide_markdown(title, metadata, overview, qa_pairs)
        
        parser = MarkdownParser()
        result = parser.parse_content(md_content)
        
        # Verify all metadata fields are extracted
        assert result.metadata.track == metadata["track"], "Track should be extracted"
        assert result.metadata.subdomain == metadata["subdomain"], "Subdomain should be extracted"
        assert result.metadata.difficulty == metadata["difficulty"].lower(), "Difficulty should be extracted"
        assert result.metadata.estimated_time == metadata["estimated_time"], "Estimated time should be extracted"
        assert len(result.metadata.target_roles) == len(metadata["roles"]), "All roles should be extracted"
    
    @given(
        num_questions=st.integers(min_value=1, max_value=10)
    )
    @settings(max_examples=100)
    def test_qa_pairs_count_matches_input(self, num_questions):
        """
        Property 5: Study Guide Template Conformance
        For any study guide with N questions, parsing SHALL extract exactly N Q&A pairs.
        Validates: Requirements 5.2, 5.3
        """
        metadata = {
            "track": "python-backend",
            "subdomain": "fundamentals",
            "difficulty": "intermediate",
            "roles": ["Backend Engineer"],
            "estimated_time": "45 minutes"
        }
        
        qa_pairs = []
        for i in range(1, num_questions + 1):
            qa_pairs.append({
                "number": i,
                "question": f"What is concept number {i}?",
                "answer": f"This is the detailed answer for question {i} with enough content.",
                "key_concepts": [f"concept_{i}_a", f"concept_{i}_b"]
            })
        
        md_content = build_study_guide_markdown(
            "Test Topic",
            metadata,
            "This is an overview of the test topic.",
            qa_pairs
        )
        
        parser = MarkdownParser()
        result = parser.parse_content(md_content)
        
        assert len(result.qa_pairs) == num_questions, f"Should extract exactly {num_questions} Q&A pairs"
    
    @given(
        key_concepts=valid_key_concepts()
    )
    @settings(max_examples=100)
    def test_key_concepts_extraction(self, key_concepts):
        """
        Property 5: Study Guide Template Conformance
        For any Q&A pair with key concepts, parsing SHALL extract all concepts.
        Validates: Requirements 5.2, 5.3
        """
        assume(len(key_concepts) > 0)
        assume(all(c.strip() for c in key_concepts))
        
        metadata = {
            "track": "react-nodejs-fullstack",
            "subdomain": "fundamentals",
            "difficulty": "beginner",
            "roles": ["Frontend Engineer"],
            "estimated_time": "30 minutes"
        }
        
        qa_pairs = [{
            "number": 1,
            "question": "What are the key concepts?",
            "answer": "Here is a detailed explanation of the concepts.",
            "key_concepts": key_concepts
        }]
        
        md_content = build_study_guide_markdown(
            "Concepts Test",
            metadata,
            "Overview text here.",
            qa_pairs
        )
        
        parser = MarkdownParser()
        result = parser.parse_content(md_content)
        
        assert len(result.qa_pairs) == 1, "Should have one Q&A pair"
        extracted_concepts = result.qa_pairs[0].key_concepts
        assert len(extracted_concepts) == len(key_concepts), "Should extract all key concepts"


class TestMarkdownParserUnit:
    """Unit tests for edge cases and specific behaviors."""
    
    def test_parse_real_study_guide_format(self):
        """Test parsing a study guide in the actual format used in the repo."""
        content = """# Study Guide: React Hooks

## Metadata
- **Track**: react-nodejs-fullstack
- **Subdomain**: fundamentals
- **Difficulty**: intermediate
- **Target Roles**: Frontend Engineer, Full Stack Engineer
- **Estimated Time**: 90 minutes

## Overview

React Hooks revolutionized how we write React components.

---

## Questions

### Q1: Can you explain the rules of hooks?

**Answer:**

React enforces two fundamental rules for hooks:
1. Only call hooks at the top level
2. Only call hooks from React functions

**Key Concepts:**
- Hook call order
- Consistent rendering

**Follow-up Questions:**
1. What happens internally when you violate the rules?
2. How does the ESLint plugin detect violations?

---

### Q2: What's the difference between useState and useReducer?

**Answer:**

Both manage state, but they're optimized for different scenarios.

**Key Concepts:**
- Reducer pattern
- Dispatch stability

**Follow-up Questions:**
1. Can you use useReducer with useContext?

---

## Summary

### Key Takeaways
- Hooks rely on call order
"""
        
        parser = MarkdownParser()
        result = parser.parse_content(content)
        
        # Verify metadata
        assert result.metadata.track == "react-nodejs-fullstack"
        assert result.metadata.subdomain == "fundamentals"
        assert result.metadata.difficulty == "intermediate"
        assert "Frontend Engineer" in result.metadata.target_roles
        assert result.metadata.estimated_time == "90 minutes"
        
        # Verify Q&A pairs
        assert len(result.qa_pairs) == 2
        assert result.qa_pairs[0].question_number == 1
        assert "rules of hooks" in result.qa_pairs[0].question
        assert len(result.qa_pairs[0].key_concepts) == 2
        assert len(result.qa_pairs[0].follow_up_questions) == 2
    
    def test_empty_content_returns_empty_result(self):
        """Test that empty content returns empty but valid result."""
        parser = MarkdownParser()
        result = parser.parse_content("")
        
        assert result.metadata.track == ""
        assert len(result.qa_pairs) == 0
        assert result.overview == ""
