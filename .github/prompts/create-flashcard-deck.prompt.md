---
description: "Create a new Japanese Estonian words or kanji flashcard deck"
name: "Create Flashcard Deck"
agent: "agent"
argument-hint: "Chapter number, deck type, and raw vocabulary or kanji list"
---

Create a new flashcard deck file named `chapter<N>_<words|kanji>.html` in the repository root from the raw list provided below.

Fill in these values before creating the file:

- `<N>`: chapter number
- `<words|kanji>`: deck type, either `words` or `kanji`
- `<heading>`: use `Chapter <N> Words · Estonian → Japanese` for words or `Chapter <N> Kanji · Estonian → Japanese` for kanji

Do NOT read or modify any existing `chapter*.html`, CSS, or JavaScript files. The repository instruction file [vocabulary-decks.instructions.md](../instructions/vocabulary-decks.instructions.md) defines source fidelity and validation rules. Follow this exact deck-file template directly:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#fff1f7">
  <title>Chapter <N> <Words|Kanji> · Estonian to Japanese Flashcards</title>
  <link rel="stylesheet" href="assets/styles.css">
</head>
<body>
  <script>
    window.DECK_CONFIG = {
      chapter: <N>,
      type: "<words|kanji>",
      heading: "<Chapter <N> Words | Estonian → Japanese · Chapter <N> Kanji>",
      storageKey: "est_jp_flashcards_ch<N>_<words|kanji>_v1",
      orderStorageKey: "est_jp_flashcards_ch<N>_<words|kanji>_order_v1",
      cards: [
        // Each card:
        // {
        //   id: 1,
        //   kanji: "...",
        //   reading: "...",
        //   estonian: "...",
        //   particles: "...", // optional; back side only
        //   speech: "..." // optional; Japanese ja-JP pronunciation override
        // }
      ],
      illustrations: [
        // One matching, original, accessible illustration object per card,
        // in exactly the same order as cards.
      ]
    };
  </script>
  <script src="assets/deck.js"></script>
</body>
</html>
```

Apply these rules:

1. Create only `chapter<N>_<words|kanji>.html` in the repository root.
2. Preserve source order and Japanese spelling/readings exactly.
3. If the supplied kanji field is blank, use the supplied kana for both `kanji` and `reading`.
4. Keep particle hints in optional `particles`, never in `estonian`.
5. Use an optional `speech` override for polyphonic or otherwise ambiguous readings when kana or normalization would produce the wrong pronunciation.
6. Keep Estonian wording unchanged unless a disambiguation is appended in square brackets.
7. Give every card exactly one matching illustration in `illustrations`; use original emoji or inline SVG, never copyrighted artwork or hotlinks.
8. Keep IDs sequential from 1.
9. Use the deck-specific storage keys shown in the template.
10. Validate card count, card order, ID sequence, illustration count, particle placement, and JavaScript syntax. Run `python generate_index.py` after creating the deck.

Raw deck list:

