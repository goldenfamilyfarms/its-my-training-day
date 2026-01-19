# Anki Flashcards - Python Backend

## Overview

Generated Anki flashcard decks for spaced repetition learning of Python Backend concepts.

## How to Use

1. Import `.apkg` files into Anki desktop or mobile app
2. Review cards daily using Anki's spaced repetition algorithm
3. Regenerate decks as you complete new study guides

## Available Decks

| Deck | Source | Cards | Generated |
|------|--------|-------|-----------|
| Coming soon | - | - | - |

## Generating New Decks

Use the Anki generator tool to create decks from study guides:

```bash
python -m anki_generator generate \
    --input "./fundamentals/python-decorators-study-guide.md" \
    --output "./_anki/" \
    --min-cards 100 \
    --tags "python,fundamentals,decorators"
```

## Card Types

- **Cloze Deletion**: Key terms and definitions with blanks
- **Basic Q&A**: Question on front, answer on back
- **Code Cards**: Code snippets with explanations

## Study Tips

- Review new cards within 24 hours of studying the guide
- Keep daily review sessions under 30 minutes
- Use tags to focus on specific topics before interviews
