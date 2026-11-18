---
description: "Use when creating or updating Japanese Estonian vocabulary or kanji flashcard decks from a pasted list. Covers source-faithful card data, back-only particle hints, original illustrations, Japanese text-to-speech, unique study storage, validation, and publishing."
---

# Japanese deck workflow

- Read [README.md](../../README.md) for the student-facing behavior and publishing overview.
- Use [chapter23_words.html](../../chapter23_words.html) as the template for a new words deck and [chapter23_kanji.html](../../chapter23_kanji.html) as the template for a new kanji deck.
- All layout, styling, UI rendering, and TTS logic live in [assets/styles.css](../../assets/styles.css) and [assets/deck.js](../../assets/deck.js). Each `chapter<N>_<type>.html` file only defines `<title>`, links `assets/styles.css`, sets `window.DECK_CONFIG`, and loads `assets/deck.js`.
- Create a separate root-level file named `chapter<N>_words.html` or `chapter<N>_kanji.html`. Update `<title>` and `DECK_CONFIG` (`chapter`, `type`, `heading`, `storageKey`, `orderStorageKey`, `cards`, `illustrations`). Leave existing decks untouched.

## Vocabulary and source fidelity

- Convert each supplied row into one `DECK_CONFIG.cards` entry in the supplied order. Keep IDs sequential starting at 1.
- Preserve the teacher-supplied Japanese form, kana reading, and Estonian wording exactly. Do not normalize spellings or readings.
- Ignore a separate English-translation column; do not put it in a card. If an English note is embedded in the supplied Estonian text, retain that source text rather than silently rewriting it.
- If the kanji field is blank, use its supplied kana form for both `kanji` and `reading`.
- For words and kanji decks, keep particle hints out of `estonian` and put them in the optional `particles` property so they appear only on the answer side below the reading. When a supplied Japanese form uses an argument placeholder directly with a particle (such as `〜を〜と結ぶ`), remove the complete placeholder-particle part from both `kanji` and `reading`, leaving the core Japanese form and its particle hint separate. Preserve ordinary Japanese particles that are part of a fixed expression, and keep the particle element hidden when there is no hint.
- Do not silently correct a supplied Estonian gloss. If a clarification is useful (or needed to disambiguate identical Estonian prompts within the same deck), append it in square brackets after the complete original gloss, for example `original wording [clarification]`.

## Illustrations and card behavior

- Add exactly one matching, original illustration to `DECK_CONFIG.illustrations` for every card, in the same order. Check that the actual symbols and accessible `description` convey the card's meaning, not merely a loosely related theme.
- Keep art self-contained as emoji (`symbol` + `detail`) or inline SVG (`customSvg`). Do not hotlink images or use copyrighted manga/anime artwork.
- Give each deck unique `storageKey` (`est_jp_flashcards_ch<N>_<type>_v1`) and `orderStorageKey` (`est_jp_flashcards_ch<N>_<type>_order_v1`) values so study progress remains independent.

## Validation and publishing

Before finishing:

1. Compare card count, order, Japanese forms/readings, and Estonian wording against the supplied list. Check sequential IDs, one illustration per card, and particle hints absent from front-side meanings.
2. Run `python generate_index.py` from the repository root; it validates deck filenames, titles, `DECK_CONFIG` keys, card IDs, illustration counts, and speech targets before regenerating `index.html`. Do not edit `index.html` manually.
3. Commit and push only when the user asks to upload, publish, or otherwise requests it.