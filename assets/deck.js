(() => {
  const config = window.DECK_CONFIG;
  if (!config) throw new Error("Missing window.DECK_CONFIG");

  const INITIAL_CARDS = config.cards;
  const ILLUSTRATIONS = config.illustrations;
  const IS_KANJI = config.type === "kanji";
  const STORAGE_KEY = config.storageKey;
  const ORDER_STORAGE_KEY = config.orderStorageKey;
  const AUDIO_STORAGE_KEY = "est_jp_flashcards_audio_v1";

  document.body.innerHTML = `
  <div class="app">
    <aside class="sidebar" aria-label="Flashcard list">
      <header class="sidebar-header">
        <div class="sidebar-title-row">
          <h1 id="deck-heading"></h1>
          <button class="reset-button" id="reset-button" type="button">Reset All</button>
        </div>
        <p class="active-count" id="active-count" aria-live="polite"></p>
        <label class="random-order-control">
          <input id="random-order-toggle" type="checkbox" aria-label="Random order" title="Shuffle in-scope active cards; each new round gets a different order">
          <span class="random-order-track"></span>
          <span>Random order</span>
        </label>
        <label class="random-order-control">
          <input id="audio-toggle" type="checkbox" role="switch" aria-label="Japanese audio playback" title="Enable or disable Japanese pronunciation playback">
          <span class="random-order-track"></span>
          <span>Audio</span>
        </label>
        <div class="random-range-control" aria-label="Random order card range">
          <label for="random-start-card">Start card
            <select id="random-start-card"></select>
          </label>
          <label for="random-end-card">End card
            <select id="random-end-card"></select>
          </label>
        </div>
        <button class="reactivate-scoped-button" id="reactivate-scoped-button" type="button">Reactivate Scoped Cards</button>
        <p class="storage-message" id="storage-message" role="alert" hidden></p>
      </header>
      <ol class="card-list" id="card-list" aria-label="All flashcards"></ol>
    </aside>

    <main class="main-stage">
      <section class="study-area" id="study-area" aria-live="polite">
        <article class="flashcard" id="flashcard">
          <div class="card-meta">
            <span id="card-position"></span>
            <span class="status-badge" id="main-status"></span>
          </div>
          <div id="front-content">
            <p class="prompt" id="front-prompt"></p>
            <div class="answer-illustration front-illustration" id="front-illustration"></div>
          </div>
          <div class="back-content" id="back-content" hidden>
            <p class="prompt" id="back-prompt"></p>
            <div class="answer-layout">
              <div class="answer-copy">
                <p class="kanji" id="kanji-answer"></p>
                <p class="reading" id="reading-answer"></p>
                <p class="particle-answer" id="particle-answer" hidden></p>
                <button type="button" class="tts-btn" id="replay-button" aria-label="Replay Japanese pronunciation" disabled>🔊 Replay</button>
              </div>
              <div class="answer-illustration" id="answer-illustration"></div>
            </div>
          </div>
        </article>

        <button class="flip-button" id="flip-button" type="button" aria-label="Flip card">
          <svg viewBox="0 0 260 155" role="img" aria-labelledby="cat-title cat-description" xmlns="http://www.w3.org/2000/svg">
            <title id="cat-title">Flip the flashcard</title>
            <desc id="cat-description">A round, rosy-cheeked kitten with soft rounded ears and a speech bubble that says フリップ.</desc>
            <defs>
              <linearGradient id="cat-fur" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#ffe4c9"/>
                <stop offset="1" stop-color="#f6afbf"/>
              </linearGradient>
              <linearGradient id="cat-bubble" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#fff"/>
                <stop offset="1" stop-color="#fff0f8"/>
              </linearGradient>
            </defs>
            <path d="M150 14h91a11 11 0 0 1 11 11v35a11 11 0 0 1-11 11h-39l-13 14-1-14h-38a11 11 0 0 1-11-11V25a11 11 0 0 1 11-11Z" fill="url(#cat-bubble)" stroke="#765c78" stroke-width="2.5"/>
            <text x="194" y="48" text-anchor="middle" fill="#9d4c82" font-size="17" font-weight="700" font-family="sans-serif">フリップ</text>
            <path d="M45 73c-5-12-8-25-6-35 1-8 7-10 13-5l20 19c12-5 28-5 40-1l18-18c6-6 13-4 14 4 2 12-1 25-6 36 11 13 15 30 12 47-4 25-25 39-55 39-33 0-55-15-58-42-2-16 1-32 8-44Z" fill="url(#cat-fur)" stroke="#765c78" stroke-width="3.5" stroke-linejoin="round"/>
            <path d="M48 54c-2-8-3-15-2-20 0-2 2-3 4-1l14 14Zm79 0c2-8 3-15 2-20 0-2-2-3-4-1l-14 14Z" fill="#f4a6b8"/>
            <path d="M48 125c-14-2-21-9-24-18m106 18c14-2 21-9 24-18" fill="none" stroke="#765c78" stroke-width="3.5" stroke-linecap="round"/>
            <ellipse cx="68" cy="93" rx="10" ry="14" fill="#55475d"/>
            <ellipse cx="112" cy="93" rx="10" ry="14" fill="#55475d"/>
            <ellipse cx="71" cy="88" rx="3.5" ry="5" fill="#fff"/>
            <ellipse cx="115" cy="88" rx="3.5" ry="5" fill="#fff"/>
            <circle cx="53" cy="107" r="7" fill="#ef8da7" opacity=".62"/>
            <circle cx="127" cy="107" r="7" fill="#ef8da7" opacity=".62"/>
            <path d="m86 105 8 0-4 5Z" fill="#d87598"/>
            <path d="M90 110c-1 7-10 9-15 3m15-3c1 7 10 9 15 3" fill="none" stroke="#765c78" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M55 150c-8 0-12 6-10 12h33c2-7-7-12-15-12Zm54 0c8 0 12 6 10 12H86c-2-7 7-12 15-12Z" fill="#fff4fa" stroke="#765c78" stroke-width="3"/>
            <path d="M68 157h-9m68 0h-9" stroke="#e887a6" stroke-width="2" stroke-linecap="round"/>
            <path d="m31 66 3 6m126-6-3 6m-69-58 2-6m14 7 3-5" stroke="#e8a4c4" stroke-width="3" stroke-linecap="round"/>
            <path d="m36 120-7 3m125-3 7 3" stroke="#765c78" stroke-width="2" stroke-linecap="round"/>
            <path d="M82 61c4-5 12-5 16 0" fill="none" stroke="#765c78" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>

        <div class="actions" id="actions" hidden>
          <button class="action-button keep-button" id="keep-button" type="button">Keep in Scope &amp; Next</button>
          <button class="action-button deactivate-button" id="deactivate-button" type="button">Deactivate / Memorized &amp; Next</button>
        </div>
      </section>

      <section class="completion" id="completion" hidden aria-live="polite">
        <p class="completion-emoji" aria-hidden="true">🎉</p>
        <h2>All done — great work!</h2>
        <p id="completion-message"></p>
        <button class="completion-button" id="reactivate-button" type="button">Reactivate Scoped Cards</button>
      </section>
    </main>
  </div>`;

  document.getElementById("deck-heading").textContent = config.heading;

  let cards = INITIAL_CARDS.map((card) => ({ ...card, inScope: true }));
  let currentIndex = 0;
  let isFlipped = false;
  let allowManualPreview = false;
  let randomOrderEnabled = false;
  let audioEnabled = false;
  let studyOrder = [];
  let previousRandomOrder = [];
  let randomStartId = INITIAL_CARDS[0].id;
  let randomEndId = INITIAL_CARDS[INITIAL_CARDS.length - 1].id;

  const cardList = document.getElementById("card-list");
  const activeCount = document.getElementById("active-count");
  const randomOrderToggle = document.getElementById("random-order-toggle");
  const audioToggle = document.getElementById("audio-toggle");
  const replayButton = document.getElementById("replay-button");
  const randomStartSelect = document.getElementById("random-start-card");
  const randomEndSelect = document.getElementById("random-end-card");
  const storageMessage = document.getElementById("storage-message");
  const cardPosition = document.getElementById("card-position");
  const mainStatus = document.getElementById("main-status");
  const frontContent = document.getElementById("front-content");
  const backContent = document.getElementById("back-content");
  const frontPrompt = document.getElementById("front-prompt");
  const frontIllustration = document.getElementById("front-illustration");
  const backPrompt = document.getElementById("back-prompt");
  const kanjiAnswer = document.getElementById("kanji-answer");
  const readingAnswer = document.getElementById("reading-answer");
  const particleAnswer = document.getElementById("particle-answer");
  const answerIllustration = document.getElementById("answer-illustration");
  const flipButton = document.getElementById("flip-button");
  const actions = document.getElementById("actions");
  const studyArea = document.getElementById("study-area");
  const completion = document.getElementById("completion");

  function createAnimeIllustration(card) {
    const illustration = ILLUSTRATIONS[card.id - 1];
    const hueOffset = IS_KANJI ? 335 : 28;
    const hue = ((card.id - 1) * 47 + hueOffset) % 360;
    const background = `hsl(${hue} 92% 94%)`;
    const accent = `hsl(${(hue + 40) % 360} 72% 74%)`;
    const rawLabel = `${card.estonian}: ${illustration.description}`;
    const label = rawLabel
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const detail = illustration.detail
      ? `<text x="146" y="151" text-anchor="middle" font-size="34">${illustration.detail}</text>`
      : "";
    const mainImage = illustration.customSvg
      || `<text x="95" y="119" text-anchor="middle" font-size="76">${illustration.symbol}</text>${detail}`;

    if (IS_KANJI) {
      return `<svg viewBox="0 0 190 190" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="182" height="182" rx="30" fill="${background}"/>
        <path d="m28 39 3-7 3 7 7 3-7 3-3 7-3-7-7-3Zm128 108 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" fill="#fff" opacity=".95"/>
        <circle cx="41" cy="117" r="4" fill="${accent}"/>
        <circle cx="151" cy="52" r="5" fill="${accent}"/>
        <path d="M29 91c9-8 17-8 25 0m82 0c8-8 16-8 25 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/>
        <circle cx="95" cy="95" r="63" fill="#fff" opacity=".68"/>
        ${mainImage}
        <path d="M63 157h64" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity=".85"/>
      </svg>`;
    }

    return `<svg viewBox="0 0 190 190" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="182" height="182" rx="24" fill="${background}" stroke="#514352" stroke-width="4"/>
      <path d="M95 95 14 29m81 66L41 8m54 87L83 5m12 90 23-90m-23 90 55-82m-55 82 79-54M95 95l81-4m-81 4 78 47m-78-47 50 82m-50-82 7 88m-7-88-42 79m42-79-78 59m78-59-85 8" fill="none" stroke="#514352" stroke-width="2" opacity=".12"/>
      <path d="m28 39 3-7 3 7 7 3-7 3-3 7-3-7-7-3Zm128 108 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" fill="#fff" stroke="#514352" stroke-width="1.5" opacity=".95"/>
      <circle cx="41" cy="117" r="4" fill="${accent}"/>
      <circle cx="151" cy="52" r="5" fill="${accent}"/>
      <circle cx="95" cy="95" r="62" fill="#fff" opacity=".76" stroke="#514352" stroke-width="2.5"/>
      ${mainImage}
      <path d="M63 157h64" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
      <path d="M12 12h24M154 178h24" stroke="#514352" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  function showStorageError(message) {
    storageMessage.textContent = message;
    storageMessage.hidden = false;
  }

  function loadProgress() {
    let saved;
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      if (value === null) return;
      saved = JSON.parse(value);
    } catch (error) {
      showStorageError(`Saved progress could not be loaded: ${error.message}`);
      return;
    }

    const valid = Array.isArray(saved)
      && saved.length === INITIAL_CARDS.length
      && saved.every((item, index) => item
        && item.id === INITIAL_CARDS[index].id
        && typeof item.active === "boolean"
        && (item.inScope === undefined || typeof item.inScope === "boolean"));

    if (!valid) {
      showStorageError("Saved progress has an unexpected format. Starting with all cards active.");
      return;
    }

    cards = cards.map((card, index) => ({
      ...card,
      active: saved[index].active,
      inScope: saved[index].inScope !== false
    }));
    const initialActiveIndex = cards.findIndex((card) => card.inScope && card.active);
    if (initialActiveIndex !== -1) currentIndex = initialActiveIndex;
  }

  function saveOrderSettings() {
    try {
      window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify({
        enabled: randomOrderEnabled,
        startId: randomStartId,
        endId: randomEndId,
        previousOrder: previousRandomOrder
      }));
    } catch (error) {
      showStorageError(`Random order preference could not be saved: ${error.message}`);
    }
  }

  function createRandomOrder(selectFirst = true) {
    studyOrder = cards
      .map((card, index) => card.inScope && card.active
        && card.id >= randomStartId && card.id <= randomEndId ? index : -1)
      .filter((index) => index !== -1);

    for (let index = studyOrder.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [studyOrder[index], studyOrder[swapIndex]] = [studyOrder[swapIndex], studyOrder[index]];
    }

    const newOrder = studyOrder.map((index) => cards[index].id);
    const sameCards = newOrder.length === previousRandomOrder.length
      && newOrder.every((id) => previousRandomOrder.includes(id));
    const sameOrder = sameCards && newOrder.every((id, index) => id === previousRandomOrder[index]);

    if (sameOrder && studyOrder.length > 1) {
      studyOrder.push(studyOrder.shift());
    }

    if (studyOrder.length > 1 && studyOrder[0] === currentIndex) {
      [studyOrder[0], studyOrder[1]] = [studyOrder[1], studyOrder[0]];
    }

    previousRandomOrder = studyOrder.map((index) => cards[index].id);
    if (selectFirst && studyOrder.length > 0) currentIndex = studyOrder[0];
    saveOrderSettings();
  }

  function initializeRandomRangeSelectors() {
    for (const card of INITIAL_CARDS) {
      const label = `#${card.id} ${card.estonian}`;
      randomStartSelect.add(new Option(label, String(card.id)));
      randomEndSelect.add(new Option(label, String(card.id)));
    }

    randomStartSelect.value = String(randomStartId);
    randomEndSelect.value = String(randomEndId);
  }

  function appendEligibleCardsToRandomOrder() {
    studyOrder = studyOrder.filter((index) => cards[index].inScope && cards[index].active
      && cards[index].id >= randomStartId && cards[index].id <= randomEndId);
    const alreadyOrdered = new Set(studyOrder);
    const additions = cards
      .map((card, index) => card.inScope && card.active
        && card.id >= randomStartId && card.id <= randomEndId
        && !alreadyOrdered.has(index) ? index : -1)
      .filter((index) => index !== -1);

    for (let index = additions.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [additions[index], additions[swapIndex]] = [additions[swapIndex], additions[index]];
    }

    studyOrder.push(...additions);
  }

  function loadOrderSettings() {
    let saved;
    try {
      const value = window.localStorage.getItem(ORDER_STORAGE_KEY);
      if (value === null) return;
      saved = JSON.parse(value);
    } catch (error) {
      showStorageError(`Random order preference could not be loaded: ${error.message}`);
      return;
    }

    const savedStartId = saved?.startId ?? INITIAL_CARDS[0].id;
    const savedEndId = saved?.endId ?? INITIAL_CARDS[INITIAL_CARDS.length - 1].id;
    const valid = saved
      && typeof saved.enabled === "boolean"
      && Number.isInteger(savedStartId)
      && Number.isInteger(savedEndId)
      && savedStartId >= INITIAL_CARDS[0].id
      && savedEndId <= INITIAL_CARDS[INITIAL_CARDS.length - 1].id
      && savedStartId <= savedEndId
      && Array.isArray(saved.previousOrder)
      && saved.previousOrder.every((id) => INITIAL_CARDS.some((card) => card.id === id));
    if (!valid) {
      showStorageError("Saved random order preference has an unexpected format.");
      return;
    }

    randomOrderEnabled = saved.enabled;
    randomStartId = savedStartId;
    randomEndId = savedEndId;
    randomStartSelect.value = String(randomStartId);
    randomEndSelect.value = String(randomEndId);
    previousRandomOrder = saved.previousOrder;
    randomOrderToggle.checked = randomOrderEnabled;
    if (randomOrderEnabled) createRandomOrder();
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(cards.map(({ id, active, inScope }) => ({ id, active, inScope })))
      );
      storageMessage.hidden = true;
      storageMessage.textContent = "";
    } catch (error) {
      showStorageError(`Progress could not be saved: ${error.message}`);
    }
  }

  function buildSidebar() {
    cardList.replaceChildren(...cards.map((card, index) => {
      const row = document.createElement("li");
      row.className = "card-row";
      row.dataset.index = String(index);

      const select = document.createElement("button");
      select.className = "card-select";
      select.type = "button";
      select.setAttribute("aria-label", `Load card ${card.id}: ${card.estonian}`);

      const top = document.createElement("span");
      top.className = "card-row-top";
      const number = document.createElement("span");
      number.className = "card-number";
      number.textContent = `#${card.id}`;
      const badge = document.createElement("span");
      badge.className = "status-badge";
      const scopeBadge = document.createElement("span");
      scopeBadge.className = "scope-badge";
      top.append(number, badge, scopeBadge);

      const estonian = document.createElement("span");
      estonian.className = "card-estonian";
      estonian.textContent = card.estonian;
      select.append(top, estonian);

      const toggleStack = document.createElement("span");
      toggleStack.className = "toggle-stack";

      const activeControl = document.createElement("label");
      activeControl.className = "toggle-control active-toggle";
      activeControl.append(document.createTextNode("Study"));
      const activeToggle = document.createElement("input");
      activeToggle.type = "checkbox";
      activeToggle.dataset.index = String(index);
      activeToggle.dataset.kind = "active";
      const activeTrack = document.createElement("span");
      activeTrack.className = "switch-track";
      const activeLabel = document.createElement("span");
      activeLabel.className = "toggle-label";
      activeLabel.append(activeToggle, activeTrack);
      activeControl.append(activeLabel);

      const scopeControl = document.createElement("label");
      scopeControl.className = "toggle-control scope-toggle";
      scopeControl.append(document.createTextNode("Scope"));
      const scopeToggle = document.createElement("input");
      scopeToggle.type = "checkbox";
      scopeToggle.dataset.index = String(index);
      scopeToggle.dataset.kind = "scope";
      const scopeTrack = document.createElement("span");
      scopeTrack.className = "switch-track";
      const scopeLabel = document.createElement("span");
      scopeLabel.className = "toggle-label";
      scopeLabel.append(scopeToggle, scopeTrack);
      scopeControl.append(scopeLabel);

      toggleStack.append(activeControl, scopeControl);
      row.append(select, toggleStack);
      return row;
    }));
  }

  function updateSidebar(scrollIntoView = false) {
    const inScopeTotal = cards.filter((card) => card.inScope).length;
    const activeTotal = cards.filter((card) => card.inScope && card.active).length;
    activeCount.textContent = `Active: ${activeTotal} / ${inScopeTotal} · In scope: ${inScopeTotal} / ${cards.length}`;
    document.getElementById("reactivate-scoped-button").disabled = inScopeTotal === 0;

    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index];
      const row = cardList.children[index];
      const isCurrent = index === currentIndex;
      row.classList.toggle("is-inactive", !card.active);
      row.classList.toggle("is-out-of-scope", !card.inScope);
      row.classList.toggle("is-current", isCurrent);

      const select = row.querySelector(".card-select");
      select.setAttribute("aria-current", isCurrent ? "true" : "false");

      const badge = row.querySelector(".status-badge");
      badge.textContent = card.active ? "Active" : "Memorized";

      const scopeBadge = row.querySelector(".scope-badge");
      scopeBadge.textContent = card.inScope ? "In scope" : "Out of scope";
      scopeBadge.classList.toggle("is-out-of-scope", !card.inScope);

      const activeToggle = row.querySelector('input[data-kind="active"]');
      activeToggle.checked = card.active;
      activeToggle.setAttribute("aria-label", `${card.active ? "Deactivate" : "Reactivate"} card ${card.id}`);

      const scopeToggle = row.querySelector('input[data-kind="scope"]');
      scopeToggle.checked = card.inScope;
      scopeToggle.setAttribute("aria-label", `${card.inScope ? "Descope" : "Rescope"} card ${card.id}`);

      if (isCurrent && scrollIntoView) {
        const rowRect = row.getBoundingClientRect();
        const listRect = cardList.getBoundingClientRect();
        if (rowRect.top < listRect.top) cardList.scrollTop += rowRect.top - listRect.top;
        if (rowRect.bottom > listRect.bottom) cardList.scrollTop += rowRect.bottom - listRect.bottom;
        if (rowRect.left < listRect.left) cardList.scrollLeft += rowRect.left - listRect.left;
        if (rowRect.right > listRect.right) cardList.scrollLeft += rowRect.right - listRect.right;
      }
    }
  }

  let japaneseVoice = null;

  function updateJapaneseVoice() {
    const synthesis = window.speechSynthesis;
    if (!synthesis) return;

    const preferredVoiceName = /kyoko|otoya|nanami|haruka|ichiro|google.*日本語/iu;
    const voiceScore = (voice) => (voice.localService ? 100 : 0)
      + (voice.lang.toLowerCase() === "ja-jp" ? 40 : 0)
      + (preferredVoiceName.test(voice.name) ? 20 : 0);
    japaneseVoice = synthesis.getVoices()
      .filter((voice) => /^ja(?:-|$)/iu.test(voice.lang))
      .sort((left, right) => voiceScore(right) - voiceScore(left))[0] || null;
  }

  if (typeof window.speechSynthesis !== "undefined") {
    updateJapaneseVoice();
    if (typeof window.speechSynthesis.addEventListener === "function") {
      window.speechSynthesis.addEventListener("voiceschanged", updateJapaneseVoice);
    } else {
      window.speechSynthesis.onvoiceschanged = updateJapaneseVoice;
    }
  }

  const SPEECH_OVERRIDES = {
    "放っておく": "ほうっておく",
    "表⇄裏(うら)": "おもて うら",
    "一歩・二歩": "いっぽ にほ",
    "宿": "やど",
    "角": "かど",
    "内": "うち"
  };

  function getJapaneseSpeechText(card) {
    if (typeof card.speech === "string" && card.speech.trim()) {
      return card.speech.trim();
    }
    const rawSource = typeof card.kanji === "string" && card.kanji.trim()
      ? card.kanji.trim()
      : card.reading;
    const source = SPEECH_OVERRIDES[rawSource] || rawSource;
    return source
      .split(/\bNB!/iu, 1)[0]
      .replace(/[(（](?:する|な|の)[)）]/gu, (match) => match.slice(1, -1))
      .replace(/(?<=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー])[(（][^()（）]*[)）]/gu, "")
      .replace(/[()[\]{}（）［］｛｝]/gu, "")
      .replace(/[〜～~]/gu, "")
      .replace(/\bX\b/gu, "")
      .replace(/[\/／|・、，,;；⇄]/gu, " ")
      .replace(/\s+/gu, " ")
      .trim();
  }

  function speakJapanese(text) {
    if (!audioEnabled || typeof window.speechSynthesis === "undefined"
      || typeof SpeechSynthesisUtterance === "undefined") return;
    const spokenText = String(text || "").trim();
    if (!spokenText) return;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.95;
    updateJapaneseVoice();
    if (japaneseVoice) utterance.voice = japaneseVoice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function renderMain() {
    const activeInScope = cards.some((card) => card.inScope && card.active
      && (!randomOrderEnabled || (card.id >= randomStartId && card.id <= randomEndId)));
    const inScopeTotal = cards.filter((card) => card.inScope).length;
    const scopedInActivePool = cards.filter((card) => card.inScope
      && (!randomOrderEnabled || (card.id >= randomStartId && card.id <= randomEndId))).length;
    const showStudyArea = activeInScope || allowManualPreview;
    studyArea.hidden = !showStudyArea;
    completion.hidden = showStudyArea;
    document.getElementById("completion-message").textContent = inScopeTotal === 0
      ? "No cards are currently in scope. Use the Scope switches in the list to choose which cards you want to study."
      : randomOrderEnabled && !activeInScope
        ? `No active in-scope cards between #${randomStartId} and #${randomEndId}. Adjust the random range or reactivate scoped cards.`
        : "You have memorized every card in your study scope. Reactivate scoped cards whenever you are ready for another round.";
    document.getElementById("reactivate-button").hidden = scopedInActivePool === 0;
    if (!showStudyArea) return;

    const card = cards[currentIndex];
    cardPosition.textContent = `Card #${card.id} of ${cards.length}`;
    mainStatus.textContent = card.active ? "Active" : "Deactivated";
    mainStatus.className = `status-badge${card.active ? "" : " is-inactive"}`;
    if (!card.inScope) {
      mainStatus.textContent = "Out of scope";
      mainStatus.className = "scope-badge is-out-of-scope";
    }
    frontPrompt.textContent = card.estonian;
    backPrompt.textContent = card.estonian;
    kanjiAnswer.textContent = card.kanji;
    readingAnswer.textContent = card.reading;
    particleAnswer.textContent = card.particles || "";
    particleAnswer.hidden = !card.particles;
    const illustration = createAnimeIllustration(card);
    frontIllustration.innerHTML = illustration;
    answerIllustration.innerHTML = illustration;
    frontContent.hidden = isFlipped;
    backContent.hidden = !isFlipped;
    flipButton.hidden = isFlipped;
    actions.hidden = !isFlipped;
  }

  function render(scrollIntoView = false) {
    updateSidebar(scrollIntoView);
    renderMain();
  }

  function loadCard(index) {
    currentIndex = index;
    isFlipped = false;
    allowManualPreview = true;
    render(true);
  }

  function advanceToNextActive() {
    allowManualPreview = false;
    isFlipped = false;
    if (randomOrderEnabled) {
      appendEligibleCardsToRandomOrder();
      const orderPosition = studyOrder.indexOf(currentIndex);
      if (orderPosition === -1) {
        const nextEligibleIndex = studyOrder.find((index) => cards[index].inScope && cards[index].active);
        if (nextEligibleIndex !== undefined) {
          currentIndex = nextEligibleIndex;
          render(true);
          return;
        }
      } else {
        for (let nextPosition = orderPosition + 1; nextPosition < studyOrder.length; nextPosition += 1) {
          const nextIndex = studyOrder[nextPosition];
          if (cards[nextIndex].inScope && cards[nextIndex].active) {
            currentIndex = nextIndex;
            render(true);
            return;
          }
        }
      }

      createRandomOrder();
      render(true);
      return;
    }

    for (let offset = 1; offset <= cards.length; offset += 1) {
      const nextIndex = (currentIndex + offset) % cards.length;
      if (cards[nextIndex].inScope && cards[nextIndex].active) {
        currentIndex = nextIndex;
        render(true);
        return;
      }
    }
    render();
  }

  function resetAllCards() {
    cards = INITIAL_CARDS.map((card) => ({ ...card, active: true, inScope: true }));
    currentIndex = 0;
    isFlipped = false;
    allowManualPreview = false;
    saveProgress();
    if (randomOrderEnabled) createRandomOrder();
    render(true);
  }

  function reactivateScopedCards() {
    cards = cards.map((card) => ({
      ...card,
      active: card.inScope ? true : card.active
    }));
    currentIndex = cards.findIndex((card) => card.inScope);
    if (currentIndex === -1) currentIndex = 0;
    isFlipped = false;
    allowManualPreview = false;
    saveProgress();
    if (randomOrderEnabled) createRandomOrder();
    render(true);
  }

  cardList.addEventListener("click", (event) => {
    const select = event.target.closest(".card-select");
    if (!select) return;
    const row = select.closest(".card-row");
    select.blur();
    loadCard(Number(row.dataset.index));
  });

  cardList.addEventListener("change", (event) => {
    const toggle = event.target.closest('input[type="checkbox"]');
    if (!toggle) return;
    const index = Number(toggle.dataset.index);
    if (toggle.dataset.kind === "scope") {
      cards[index].inScope = toggle.checked;
    } else {
      cards[index].active = toggle.checked;
    }
    saveProgress();
    if (randomOrderEnabled) appendEligibleCardsToRandomOrder();
    render();
  });

  randomOrderToggle.addEventListener("change", () => {
    randomOrderEnabled = randomOrderToggle.checked;
    if (randomOrderEnabled) {
      createRandomOrder();
    } else {
      studyOrder = [];
      saveOrderSettings();
    }
    isFlipped = false;
    render(true);
  });

  randomStartSelect.addEventListener("change", () => {
    randomStartId = Number(randomStartSelect.value);
    if (randomStartId > randomEndId) {
      randomEndId = randomStartId;
      randomEndSelect.value = String(randomEndId);
    }
    if (randomOrderEnabled) createRandomOrder();
    else saveOrderSettings();
    isFlipped = false;
    render(true);
  });

  randomEndSelect.addEventListener("change", () => {
    randomEndId = Number(randomEndSelect.value);
    if (randomEndId < randomStartId) {
      randomStartId = randomEndId;
      randomStartSelect.value = String(randomStartId);
    }
    if (randomOrderEnabled) createRandomOrder();
    else saveOrderSettings();
    isFlipped = false;
    render(true);
  });

  document.getElementById("reset-button").addEventListener("click", resetAllCards);
  document.getElementById("reactivate-scoped-button").addEventListener("click", reactivateScopedCards);
  document.getElementById("reactivate-button").addEventListener("click", reactivateScopedCards);

  function revealCurrentCard() {
    if (isFlipped || studyArea.hidden) return;
    isFlipped = true;
    renderMain();
    speakJapanese(getJapaneseSpeechText(cards[currentIndex]));
  }

  flipButton.addEventListener("click", revealCurrentCard);
  audioToggle.addEventListener("change", () => {
    audioEnabled = audioToggle.checked;
    replayButton.disabled = !audioEnabled;
    try {
      window.localStorage.setItem(AUDIO_STORAGE_KEY, String(audioEnabled));
    } catch {}
    if (!audioEnabled && typeof window.speechSynthesis !== "undefined") {
      window.speechSynthesis.cancel();
    }
  });

  replayButton.addEventListener("click", () => {
    if (isFlipped && !studyArea.hidden) {
      speakJapanese(getJapaneseSpeechText(cards[currentIndex]));
    }
  });

  document.getElementById("keep-button").addEventListener("click", () => {
    cards[currentIndex].active = true;
    cards[currentIndex].inScope = true;
    saveProgress();
    if (randomOrderEnabled) appendEligibleCardsToRandomOrder();
    advanceToNextActive();
  });

  document.getElementById("deactivate-button").addEventListener("click", () => {
    cards[currentIndex].active = false;
    saveProgress();
    advanceToNextActive();
  });

  window.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea, select, [contenteditable='true']")) return;
    if (event.key.toLowerCase() === "r" && isFlipped && !studyArea.hidden) {
      event.preventDefault();
      speakJapanese(getJapaneseSpeechText(cards[currentIndex]));
      return;
    }
    if (event.target.matches("button") || studyArea.hidden) return;

    if (event.code === "Space" && !isFlipped) {
      event.preventDefault();
      revealCurrentCard();
    } else if (isFlipped && (event.key === "1" || event.key === "ArrowRight")) {
      event.preventDefault();
      document.getElementById("keep-button").click();
    } else if (isFlipped && (event.key === "2" || event.key === "Enter")) {
      event.preventDefault();
      document.getElementById("deactivate-button").click();
    }
  });

  buildSidebar();
  initializeRandomRangeSelectors();
  loadProgress();
  loadOrderSettings();
  try {
    audioEnabled = window.localStorage.getItem(AUDIO_STORAGE_KEY) === "true";
  } catch {}
  audioToggle.checked = audioEnabled;
  replayButton.disabled = !audioEnabled;
  render(true);
})();
