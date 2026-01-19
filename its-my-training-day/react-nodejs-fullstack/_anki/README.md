# Anki Flashcards - React/Node.js Full Stack

## Overview

This directory contains generated Anki flashcard decks (.apkg files) for spaced repetition review of React and Node.js concepts.

## How to Use

1. Import the .apkg file into Anki (File → Import)
2. Review cards daily using Anki's spaced repetition algorithm
3. Regenerate cards after completing new study guides

## Generated Decks

| Deck | Source | Cards | Generated |
|------|--------|-------|-----------|
| _No decks generated yet_ | - | - | - |

## Generating New Decks

Use the Anki generator tool:

```bash
python -m anki_generator generate \
    --input "./react-nodejs-fullstack/fundamentals/react-hooks-study-guide.md" \
    --output "./react-nodejs-fullstack/_anki/" \
    --min-cards 100 \
    --tags "react,fundamentals,hooks"
```

## Card Types

- **Cloze deletions**: Key terms and definitions with blanks
- **Forward cards**: Concept → Definition
- **Reverse cards**: Definition → Concept

## Tags

All cards are tagged with:
- Training track: `react-nodejs-fullstack`
- Subdomain: e.g., `fundamentals`, `automation`
- Topic: e.g., `hooks`, `state-management`
