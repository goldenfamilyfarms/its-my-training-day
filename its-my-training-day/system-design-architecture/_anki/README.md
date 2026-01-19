# Anki Flashcards - System Design & Architecture

## Overview

This directory contains generated Anki flashcard decks (.apkg files) for spaced repetition review of system design concepts.

## How to Use

1. Download the .apkg file for your topic
2. Open Anki and select File → Import
3. Select the .apkg file
4. Cards will be added to your collection with appropriate tags

## Available Decks

| Deck | Cards | Topics | Last Updated |
|------|-------|--------|--------------|
| Coming soon | - | - | - |

## Card Types

- **Cloze Deletions**: Fill-in-the-blank for key terms and definitions
- **Basic Q&A**: Question on front, detailed answer on back
- **Diagram Recognition**: Identify components and patterns

## Tags Structure

Cards are tagged with:
- `system-design-architecture` - Track identifier
- `{subdomain}` - Topic area (fundamentals, observability, etc.)
- `{specific-topic}` - Individual concept

## Recommended Review Schedule

- **New cards**: 20-30 per day
- **Review**: Daily, following Anki's spaced repetition algorithm
- **Before interviews**: Increase new cards to 50/day for 2 weeks

## Generating New Decks

Use the Anki generator tool to create decks from study guides:

```bash
python -m anki_generator generate \
    --input "../fundamentals/cap-theorem-study-guide.md" \
    --output "./" \
    --min-cards 100 \
    --tags "system-design-architecture,fundamentals,cap-theorem"
```
