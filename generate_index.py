from __future__ import annotations

import argparse
import html
import re
import shutil
import sys
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parent
DECK_FILENAME_PATTERN = re.compile(r"chapter(\d+)_(kanji|words)\.html")


def extract_config_array(source: str, key: str) -> str | None:
    match = re.search(
        rf"^[ \t]*{re.escape(key)}:\s*\[(.*?)^[ \t]*\],?",
        source,
        re.MULTILINE | re.DOTALL,
    )
    return match.group(1) if match else None


def japanese_speech_target(source: str) -> str:
    target = source.split("NB!", maxsplit=1)[0]
    target = re.sub(r"[(（](?:する|な|の)[)）]", lambda match: match.group()[1:-1], target)
    target = re.sub(
        r"(?<=[一-龯々〆ヶぁ-ゖァ-ヺー])[(（][^()（）]*[)）]",
        "",
        target,
    )
    target = re.sub(r"[()[\]{}（）［］｛｝〜～~]", "", target)
    target = re.sub(r"\bX\b", "", target)
    target = re.sub(r"[/／|・、，,;；⇄]", " ", target)
    return " ".join(target.split())


def validate_decks(pages: list[Path]) -> None:
    errors: list[str] = []
    seen_storage_keys: dict[str, Path] = {}

    if not (ROOT / "assets" / "styles.css").is_file():
        errors.append("assets/styles.css is missing")
    if not (ROOT / "assets" / "deck.js").is_file():
        errors.append("assets/deck.js is missing")

    for page in pages:
        filename_match = DECK_FILENAME_PATTERN.fullmatch(page.name)
        if not filename_match:
            errors.append(f"{page.name}: filename must match chapter<N>_(kanji|words).html")
            continue

        chapter, deck_type = filename_match.groups()
        source = page.read_text(encoding="utf-8")
        expected_title = f"Chapter {chapter} {deck_type.title()} · Estonian to Japanese Flashcards"
        expected_heading = (
            f"Estonian → Japanese · Chapter {chapter} Kanji"
            if deck_type == "kanji"
            else f"Chapter {chapter} Words"
        )

        title_match = re.search(r"<title>(.*?)</title>", source, re.DOTALL)
        if not title_match or html.unescape(title_match.group(1).strip()) != expected_title:
            errors.append(f"{page.name}: <title> must be {expected_title!r}")

        if 'href="assets/styles.css"' not in source:
            errors.append(f"{page.name}: must link assets/styles.css")
        if 'src="assets/deck.js"' not in source:
            errors.append(f"{page.name}: must load assets/deck.js")

        type_match = re.search(r'\btype:\s*"([^"]*)"', source)
        if not type_match or type_match.group(1) != deck_type:
            errors.append(f"{page.name}: DECK_CONFIG.type must be {deck_type!r}")

        heading_match = re.search(r'\bheading:\s*"([^"]*)"', source)
        if not heading_match or html.unescape(heading_match.group(1).strip()) != expected_heading:
            errors.append(f"{page.name}: DECK_CONFIG.heading must be {expected_heading!r}")

        expected_storage_keys = {
            "storageKey": f"est_jp_flashcards_ch{chapter}_{deck_type}_v1",
            "orderStorageKey": f"est_jp_flashcards_ch{chapter}_{deck_type}_order_v1",
        }
        for key_name, expected_key in expected_storage_keys.items():
            key_match = re.search(
                rf'\b{key_name}:\s*"([^"]*)"',
                source,
            )
            if not key_match or key_match.group(1) != expected_key:
                errors.append(f"{page.name}: {key_name} must be {expected_key!r}")
                continue
            previous_page = seen_storage_keys.get(expected_key)
            if previous_page:
                errors.append(
                    f"{page.name}: storage key {expected_key!r} is also used by {previous_page.name}"
                )
            else:
                seen_storage_keys[expected_key] = page

        cards = extract_config_array(source, "cards")
        illustrations = extract_config_array(source, "illustrations")
        if cards is None:
            errors.append(f"{page.name}: DECK_CONFIG.cards array was not found")
        if illustrations is None:
            errors.append(f"{page.name}: DECK_CONFIG.illustrations array was not found")
        if cards is not None and illustrations is not None:
            card_ids = [
                int(card_id)
                for card_id in re.findall(r"^\s*\{\s*id:\s*(\d+)\b", cards, re.MULTILINE)
            ]
            card_matches = list(re.finditer(
                r'^\s*\{\s*id:\s*(\d+)\b[^\r\n]*?\bkanji:\s*"((?:\\.|[^"\\])*)"',
                cards,
                re.MULTILINE,
            ))
            if len(card_matches) != len(card_ids):
                errors.append(f"{page.name}: every card must have a kanji speech target")
            for card_match in card_matches:
                card_id, kanji = card_match.groups()
                if not japanese_speech_target(kanji):
                    errors.append(
                        f"{page.name}: card {card_id} kanji has no speech text after cleanup"
                    )
            illustration_count = len(
                re.findall(
                    r"^[ \t]*\{",
                    illustrations,
                    re.MULTILINE,
                )
            )
            expected_ids = list(range(1, len(card_ids) + 1))
            if card_ids != expected_ids:
                errors.append(f"{page.name}: card ids must be sequential from 1")
            if len(card_ids) != illustration_count:
                errors.append(
                    f"{page.name}: {len(card_ids)} cards but {illustration_count} illustrations"
                )

    deck_js_path = ROOT / "assets" / "deck.js"
    if deck_js_path.is_file():
        deck_js = deck_js_path.read_text(encoding="utf-8")
        if "card.kanji" not in deck_js or "⇄" not in deck_js:
            errors.append("assets/deck.js: getJapaneseSpeechText must use card.kanji and include ⇄")

    if errors:
        print("Deck validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        raise SystemExit(1)


def natural_key(value: str) -> list[int | str]:
    return [int(part) if part.isdigit() else part.casefold()
            for part in re.split(r"(\d+)", value)]


def page_title(path: Path) -> str:
    chapter = re.fullmatch(r"chapter[-_ ]?(\d+)(?:_(kanji|words))?", path.stem, re.IGNORECASE)
    if chapter:
        suffix = f" {chapter.group(2).title()}" if chapter.group(2) else ""
        return f"Chapter {chapter.group(1)}{suffix}"
    return path.stem.replace("-", " ").replace("_", " ").title()


def chapter_pages() -> list[Path]:
    return sorted(
        (path for path in ROOT.glob("*.html") if path.name.casefold() != "index.html"),
        key=lambda path: natural_key(path.name),
    )


def build_index(pages: list[Path]) -> str:
    page_links = "\n".join(
        f'        <a class="chapter" href="{quote(path.name)}">'
        f'<span>{html.escape(page_title(path))}</span>'
        '<span class="arrow" aria-hidden="true">→</span></a>'
        for path in pages
    )
    empty_message = (
        ""
        if pages
        else '<p class="empty">Add HTML flashcard pages to this repository to list them here.</p>'
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#fff1f7">
  <title>Japanese Flashcards · Chapters</title>
  <style>
    :root {{
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #3b3044;
      background: #fff1f7;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      display: grid;
      min-height: 100vh;
      min-height: 100dvh;
      margin: 0;
      padding: 28px 18px;
      place-items: center;
      background:
        radial-gradient(circle at 12% 18%, #f8d8e8 0 2px, transparent 3px),
        radial-gradient(circle at 88% 76%, #e8defa 0 3px, transparent 4px),
        radial-gradient(ellipse at 50% 42%, #fff 0, #fff8fc 48%, #f9eaf4 100%);
    }}
    main {{
      width: min(100%, 560px);
      padding: clamp(24px, 6vw, 44px);
      border: 2px solid #f0d5e4;
      border-radius: 28px;
      background: #fff;
      box-shadow: 0 18px 55px #743b5a15;
    }}
    h1 {{ margin: 0; font-size: clamp(1.7rem, 6vw, 2.3rem); }}
    .intro {{ margin: 10px 0 24px; color: #817588; line-height: 1.5; }}
    nav {{ display: grid; gap: 10px; }}
    .chapter {{
      display: flex;
      min-height: 58px;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 17px;
      border: 1px solid #f0dce8;
      border-radius: 14px;
      background: #fffafd;
      color: #554258;
      font-weight: 700;
      text-decoration: none;
      transition: border-color 130ms ease, transform 130ms ease, background 130ms ease;
    }}
    .chapter:hover {{ transform: translateY(-2px); border-color: #e595b8; background: #fff0f6; }}
    .chapter:focus-visible {{ outline: 3px solid #eca5c3; outline-offset: 3px; }}
    .arrow {{ color: #b94178; font-size: 1.3rem; }}
    .empty {{ color: #817588; }}
    @media (prefers-reduced-motion: reduce) {{
      *, *::before, *::after {{ scroll-behavior: auto !important; transition-duration: 0.01ms !important; }}
    }}
  </style>
</head>
<body>
  <main>
    <h1>Japanese Flashcards</h1>
    <p class="intro">Choose a chapter to start studying.</p>
    <nav aria-label="Flashcard chapters">
{page_links}
    </nav>
{empty_message}
  </main>
</body>
</html>
"""


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate an index of the repository's HTML pages.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=ROOT,
        help="Output directory (HTML pages and assets are copied here alongside the generated index).",
    )
    args = parser.parse_args()
    pages = chapter_pages()
    validate_decks(pages)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    if args.output_dir.resolve() != ROOT:
        shutil.copytree(ROOT / "assets", args.output_dir / "assets", dirs_exist_ok=True)
        for page in pages:
            shutil.copy2(page, args.output_dir / page.name)
    (args.output_dir / "index.html").write_bytes(build_index(pages).encode("utf-8"))
    print(f"Generated index.html with {len(pages)} chapter page(s) in {args.output_dir}.")
