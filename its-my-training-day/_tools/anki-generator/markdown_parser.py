"""
Markdown parser for study guide files.

Extracts metadata, questions, answers, and key concepts from study guide markdown files.
"""

import re
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from pathlib import Path


@dataclass
class StudyGuideMetadata:
    """Metadata extracted from a study guide."""
    track: str = ""
    subdomain: str = ""
    difficulty: str = "intermediate"
    target_roles: List[str] = field(default_factory=list)
    source_jd: Optional[str] = None
    estimated_time: str = ""
    created: Optional[str] = None
    last_modified: Optional[str] = None
    title: str = ""


@dataclass
class QAPair:
    """A question-answer pair from a study guide."""
    question_number: int
    question: str
    answer: str
    key_concepts: List[str] = field(default_factory=list)
    follow_up_questions: List[str] = field(default_factory=list)
    code_blocks: List[str] = field(default_factory=list)


@dataclass
class ParsedStudyGuide:
    """Complete parsed study guide."""
    metadata: StudyGuideMetadata
    overview: str
    qa_pairs: List[QAPair]
    summary: str
    source_file: str


class MarkdownParser:
    """Parser for study guide markdown files."""
    
    # Regex patterns for parsing
    METADATA_PATTERN = re.compile(r"^\s*-\s*\*\*(.+?)\*\*:\s*(.+)$", re.MULTILINE)
    QUESTION_HEADER_PATTERN = re.compile(r"^###\s*Q(\d+):\s*(.+)$", re.MULTILINE)
    CODE_BLOCK_PATTERN = re.compile(r"```[\w]*\n(.*?)```", re.DOTALL)
    KEY_CONCEPTS_PATTERN = re.compile(r"\*\*Key Concepts:\*\*\s*((?:\n\s*-\s*.+)+)", re.MULTILINE)
    FOLLOW_UP_PATTERN = re.compile(r"\*\*Follow-up Questions:\*\*\s*((?:\n\s*\d+\.\s*.+)+)", re.MULTILINE)
    LIST_ITEM_PATTERN = re.compile(r"^\s*[-\d.]+\s*(.+)$", re.MULTILINE)
    
    def __init__(self):
        pass
    
    def parse_file(self, file_path: str) -> ParsedStudyGuide:
        """Parse a study guide markdown file."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Study guide not found: {file_path}")
        
        content = path.read_text(encoding="utf-8")
        return self.parse_content(content, str(path))
    
    def parse_content(self, content: str, source_file: str = "") -> ParsedStudyGuide:
        """Parse study guide content from a string."""
        # Extract title from first H1
        title = self._extract_title(content)
        
        # Extract metadata section
        metadata = self._extract_metadata(content)
        metadata.title = title
        
        # Extract overview section
        overview = self._extract_overview(content)
        
        # Extract Q&A pairs
        qa_pairs = self._extract_qa_pairs(content)
        
        # Extract summary section
        summary = self._extract_summary(content)
        
        return ParsedStudyGuide(
            metadata=metadata,
            overview=overview,
            qa_pairs=qa_pairs,
            summary=summary,
            source_file=source_file
        )
    
    def _extract_title(self, content: str) -> str:
        """Extract the title from the first H1 header."""
        match = re.search(r"^#\s+(?:Study Guide:\s*)?(.+)$", content, re.MULTILINE)
        return match.group(1).strip() if match else ""
    
    def _extract_metadata(self, content: str) -> StudyGuideMetadata:
        """Extract metadata from the Metadata section."""
        metadata = StudyGuideMetadata()
        
        # Find metadata section
        metadata_section = re.search(
            r"##\s*Metadata\s*\n(.*?)(?=\n##|\Z)",
            content,
            re.DOTALL | re.IGNORECASE
        )
        
        if not metadata_section:
            return metadata
        
        section_text = metadata_section.group(1)
        
        # Parse each metadata field
        for match in self.METADATA_PATTERN.finditer(section_text):
            key = match.group(1).strip().lower()
            value = match.group(2).strip()
            
            if key == "track":
                metadata.track = value
            elif key == "subdomain":
                metadata.subdomain = value
            elif key == "difficulty":
                metadata.difficulty = value.lower()
            elif key == "target roles":
                metadata.target_roles = [r.strip() for r in value.split(",")]
            elif key == "source jd":
                metadata.source_jd = value if value.lower() != "n/a" else None
            elif key == "estimated time":
                metadata.estimated_time = value
            elif key == "created":
                metadata.created = value
            elif key == "last modified":
                metadata.last_modified = value
        
        return metadata

    def _extract_overview(self, content: str) -> str:
        """Extract the overview section."""
        match = re.search(
            r"##\s*Overview\s*\n(.*?)(?=\n---|\n##|\Z)",
            content,
            re.DOTALL | re.IGNORECASE
        )
        return match.group(1).strip() if match else ""
    
    def _extract_qa_pairs(self, content: str) -> List[QAPair]:
        """Extract all question-answer pairs from the content."""
        qa_pairs = []
        
        # Find the Questions section
        questions_section = re.search(
            r"##\s*Questions\s*\n(.*?)(?=\n##\s*Summary|\n##\s*Practice|\Z)",
            content,
            re.DOTALL | re.IGNORECASE
        )
        
        if not questions_section:
            return qa_pairs
        
        section_text = questions_section.group(1)
        
        # Split by question headers
        question_splits = re.split(r"(###\s*Q\d+:)", section_text)
        
        # Process pairs (header, content)
        i = 1
        while i < len(question_splits):
            if not question_splits[i].startswith("###"):
                i += 1
                continue
            
            header = question_splits[i]
            content_part = question_splits[i + 1] if i + 1 < len(question_splits) else ""
            
            # Extract question number and text
            q_match = re.match(r"###\s*Q(\d+):", header)
            if not q_match:
                i += 2
                continue
            
            q_num = int(q_match.group(1))
            
            # Get question text (first line after header)
            lines = content_part.strip().split("\n")
            question_text = lines[0].strip() if lines else ""
            
            # Get the rest of the content
            rest_content = "\n".join(lines[1:]) if len(lines) > 1 else ""
            
            # Extract answer
            answer = self._extract_answer(rest_content)
            
            # Extract key concepts
            key_concepts = self._extract_key_concepts(rest_content)
            
            # Extract follow-up questions
            follow_ups = self._extract_follow_ups(rest_content)
            
            # Extract code blocks
            code_blocks = self._extract_code_blocks(rest_content)
            
            qa_pairs.append(QAPair(
                question_number=q_num,
                question=question_text,
                answer=answer,
                key_concepts=key_concepts,
                follow_up_questions=follow_ups,
                code_blocks=code_blocks
            ))
            
            i += 2
        
        return qa_pairs
    
    def _extract_answer(self, content: str) -> str:
        """Extract the answer section from Q&A content."""
        # Find content between **Answer:** and **Key Concepts:** or **Follow-up**
        match = re.search(
            r"\*\*Answer:\*\*\s*(.*?)(?=\*\*Key Concepts:\*\*|\*\*Follow-up|\n---|\Z)",
            content,
            re.DOTALL | re.IGNORECASE
        )
        return match.group(1).strip() if match else ""
    
    def _extract_key_concepts(self, content: str) -> List[str]:
        """Extract key concepts from Q&A content."""
        match = self.KEY_CONCEPTS_PATTERN.search(content)
        if not match:
            return []
        
        concepts_text = match.group(1)
        concepts = []
        for item_match in self.LIST_ITEM_PATTERN.finditer(concepts_text):
            concept = item_match.group(1).strip()
            # Remove bold markers
            concept = re.sub(r"\*\*(.+?)\*\*", r"\1", concept)
            if concept:
                concepts.append(concept)
        
        return concepts
    
    def _extract_follow_ups(self, content: str) -> List[str]:
        """Extract follow-up questions from Q&A content."""
        match = self.FOLLOW_UP_PATTERN.search(content)
        if not match:
            return []
        
        follow_ups_text = match.group(1)
        follow_ups = []
        for item_match in re.finditer(r"^\s*\d+\.\s*(.+)$", follow_ups_text, re.MULTILINE):
            follow_up = item_match.group(1).strip()
            if follow_up:
                follow_ups.append(follow_up)
        
        return follow_ups
    
    def _extract_code_blocks(self, content: str) -> List[str]:
        """Extract code blocks from content."""
        code_blocks = []
        for match in self.CODE_BLOCK_PATTERN.finditer(content):
            code = match.group(1).strip()
            if code:
                code_blocks.append(code)
        return code_blocks
    
    def _extract_summary(self, content: str) -> str:
        """Extract the summary section."""
        match = re.search(
            r"##\s*Summary\s*\n(.*?)(?=\n##\s*Practice|\Z)",
            content,
            re.DOTALL | re.IGNORECASE
        )
        return match.group(1).strip() if match else ""
