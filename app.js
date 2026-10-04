(async () => {
  "use strict";

  const COLS = 32;
  const ROWS = 24;
  const CELL_W = 20;
  const CELL_H = 20;
  const MAX_UNDO = 40;
  const PROJECT_KEY = "emojiro-paint-project-v1";
  const SONG_KEY = "emojiro-paint-song-v2";
  const CUSTOM_STAMPS_KEY = "emojiro-paint-custom-stamps-v1";
  const AUTOSAVE_KEY = "emojiro-paint-autosave-v1";
  const PROJECT_LIBRARY_KEY = "emojiro-paint-library-v1";
  const CLOUD_CONFIG_KEY = "emojiro-paint-cloud-config-v1";
  const MAX_LIBRARY_PROJECTS = 8;

  const COLORS = [
    "#2d2a32", "#ffffff", "#e45b5b", "#f28c45", "#f7d25c", "#74b86f",
    "#43a88d", "#55a9d6", "#4f72c8", "#7d63bf", "#d56ca6", "#9d6549",
    "#f1b9a6", "#b7dd90", "#9ddbd9", "#d9c8a9", "#888888", "#ffd8e5"
  ];

  const STAMPS = [
    "😀", "😎", "🥳", "🤖", "👻", "👽", "💀", "❤️", "⭐", "✨",
    "🔥", "🌈", "☀️", "🌙", "☁️", "🌸", "🌻", "🌵", "🌳", "🍄",
    "🍎", "🍕", "🍩", "🍓", "🐱", "🐶", "🐸", "🐙", "🐟", "🦋",
    "🚗", "🚀", "🏠", "🎈", "🎁", "⚽", "🎮", "🎸", "🎺", "🥁"
  ];

  const INSTRUMENTS = [
    { id: "kalimba", emoji: "🙂", name: "Smile Pluck", type: "kalimba" },
    { id: "drum", emoji: "🍄", name: "Mushroom Thump", type: "drum" },
    { id: "lizard", emoji: "🦎", name: "Lizard Chirp", type: "lizard" },
    { id: "star", emoji: "⭐", name: "Star Twinkle", type: "star" },
    { id: "trumpet", emoji: "🌼", name: "Flower Chime", type: "flower" },
    { id: "game", emoji: "🎮", name: "8-Bit Beep", type: "game" },
    { id: "dog", emoji: "🐶", name: "Dog Bark", type: "dog" },
    { id: "cat", emoji: "🐱", name: "Cat Meow", type: "cat" },
    { id: "pig", emoji: "🐷", name: "Pig Oink", type: "pig" },
    { id: "duck", emoji: "🦆", name: "Duck Quack", type: "duck" },
    { id: "baby", emoji: "👶", name: "Baby Hiccup", type: "baby" },
    { id: "plane", emoji: "✈️", name: "Plane Engine", type: "plane" },
    { id: "ship", emoji: "🚢", name: "Ship Horn", type: "ship" },
    { id: "car", emoji: "🚗", name: "Car Horn", type: "car" },
    { id: "heart", emoji: "❤️", name: "Heartbeat", type: "heart" },

    { id: "frog", emoji: "🐸", name: "Frog Croak", type: "frog" },
    { id: "cow", emoji: "🐮", name: "Cow Moo", type: "cow" },
    { id: "chicken", emoji: "🐔", name: "Chicken Cluck", type: "chicken" },
    { id: "horse", emoji: "🐴", name: "Horse Neigh", type: "horse" },
    { id: "monkey", emoji: "🐵", name: "Monkey Chatter", type: "monkey" },
    { id: "lion", emoji: "🦁", name: "Lion Roar", type: "lion" },
    { id: "elephant", emoji: "🐘", name: "Elephant Trumpet", type: "elephant" },
    { id: "bee", emoji: "🐝", name: "Bee Buzz", type: "bee" },
    { id: "owl", emoji: "🦉", name: "Owl Hoot", type: "owl" },
    { id: "bird", emoji: "🐦", name: "Bird Chirp", type: "bird" },
    { id: "wolf", emoji: "🐺", name: "Wolf Howl", type: "wolf" },
    { id: "dolphin", emoji: "🐬", name: "Dolphin Whistle", type: "dolphin" },
    { id: "whale", emoji: "🐋", name: "Whale Song", type: "whale" },

    { id: "train", emoji: "🚂", name: "Train Chug", type: "train" },
    { id: "helicopter", emoji: "🚁", name: "Helicopter Chop", type: "helicopter" },
    { id: "rocket", emoji: "🚀", name: "Rocket Launch", type: "rocket" },
    { id: "clock", emoji: "⏰", name: "Alarm Clock", type: "clock" },
    { id: "bell", emoji: "🔔", name: "Bell Ring", type: "bell" },

    { id: "guitar", emoji: "🎸", name: "Guitar Strum", type: "guitar" },
    { id: "piano", emoji: "🎹", name: "Piano Key", type: "piano" },
    { id: "sax", emoji: "🎷", name: "Saxophone", type: "sax" },
    { id: "brass", emoji: "🎺", name: "Trumpet", type: "brass" },
    { id: "violin", emoji: "🎻", name: "Violin Bow", type: "violin" },
    { id: "snare", emoji: "🥁", name: "Snare Drum", type: "snare" },

    { id: "ghost", emoji: "👻", name: "Ghost Wail", type: "ghost" },
    { id: "robot", emoji: "🤖", name: "Robot Blip", type: "robot" },
    { id: "water", emoji: "💧", name: "Water Drop", type: "water" },
    { id: "fire", emoji: "🔥", name: "Fire Crackle", type: "fire" }
  ];

  const PITCHES = ["G5", "F5", "E5", "D5", "C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4", "B3"];
  const SEQ_STEPS = 96;
  const MAX_LAYERS = 3;
  const SECTION_LENGTH = 24;
  const SECTION_COUNT = 4;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  let toastTimer = 0;
  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1700);
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type: type || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function safeFilename(name) {
    return (name || "emojiro-song")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "emojiro-song";
  }

  function encodeBase64Url(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeBase64Url(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function bytesToBase64Url(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlToBytes(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }

  async function gzipText(text) {
    if (typeof CompressionStream === "undefined") return null;
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function gunzipText(bytes) {
    if (typeof DecompressionStream === "undefined") throw new Error("Compressed links are not supported in this browser");
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  $$(".mode-tab[data-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".mode-tab[data-panel]").forEach((tab) => tab.classList.toggle("active", tab === button));
      $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === button.dataset.panel));
      const moreMenu = $("#moreModeMenu");
      if (moreMenu) moreMenu.open = false;
      if (button.dataset.panel !== "musicPanel") stopMusic();
      if (button.dataset.panel !== "toyPanel") stopToyGames();
    });
  });

  $("#mobileProjectsBtn").addEventListener("click", () => {
    const moreMenu = $("#moreModeMenu");
    if (moreMenu) moreMenu.open = false;
    $("#projectsBtn").click();
  });

  // -----------------------------
  // Title Toy + Mini-games
  // -----------------------------

  const TITLE_TOY_EMOJIS = ["🎨","🎵","⭐","✨","🌈","🐶","🐱","🍄","🎮","🦆","🚀","❤️"];
  let catchGameFrame = 0;
  let catchGameRunning = false;
  let catchGameStart = 0;
  let catchLastSpawn = 0;
  let catchLastTime = 0;
  let catchBasketX = 320;
  let catchDrops = [];
  let catchScore = 0;
  let relayTimer = 0;
  let relayRunning = false;
  let relayRound = 0;
  let relayTarget = -1;
  let relayScore = 0;
  let relayHitThisRound = false;

  function spawnTitleBurst(count = 12) {
    const stage = $("#titleToyStage");
    for (let i = 0; i < count; i += 1) {
      const sprite = document.createElement("span");
      sprite.className = "title-toy-sprite";
      sprite.textContent = TITLE_TOY_EMOJIS[Math.floor(Math.random() * TITLE_TOY_EMOJIS.length)];
      sprite.style.setProperty("--tx", (Math.random() * 260 - 70).toFixed(0) + "px");
      sprite.style.setProperty("--ty", (Math.random() * 130 - 75).toFixed(0) + "px");
      sprite.style.setProperty("--rot", (Math.random() * 540 - 270).toFixed(0) + "deg");
      stage.appendChild(sprite);
      setTimeout(() => sprite.remove(), 1500);
    }
  }

  function clearTitleToy() {
    $("#titleToyStage").innerHTML = "";
  }

  function shuffleTitleToy() {
    $("#titleToyBtn").textContent = TITLE_TOY_EMOJIS[Math.floor(Math.random() * TITLE_TOY_EMOJIS.length)];
    spawnTitleBurst(8);
  }

  $("#titleToyBtn").addEventListener("click", () => spawnTitleBurst(14));
  $("#titleBurstBtn").addEventListener("click", () => spawnTitleBurst(22));
  $("#titleShuffleBtn").addEventListener("click", shuffleTitleToy);
  $("#titleClearBtn").addEventListener("click", clearTitleToy);

  function catchBestScore() {
    return Math.max(0, Number(localStorage.getItem("emojiro-catch-best") || 0));
  }

  function updateCatchBest() {
    const best = Math.max(catchBestScore(), catchScore);
    localStorage.setItem("emojiro-catch-best", String(best));
    $("#catchBest").textContent = best;
  }

  function drawCatchGame() {
    const canvas = $("#catchGameCanvas");
    const gameCtx = canvas.getContext("2d");
    gameCtx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = gameCtx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#dff2ff");
    gradient.addColorStop(1, "#fff0c9");
    gameCtx.fillStyle = gradient;
    gameCtx.fillRect(0, 0, canvas.width, canvas.height);

    gameCtx.fillStyle = "rgba(255,255,255,.65)";
    for (let i = 0; i < 5; i += 1) {
      gameCtx.beginPath();
      gameCtx.arc(70 + i * 145, 52 + (i % 2) * 25, 26, 0, Math.PI * 2);
      gameCtx.arc(95 + i * 145, 52 + (i % 2) * 25, 20, 0, Math.PI * 2);
      gameCtx.fill();
    }

    gameCtx.textAlign = "center";
    gameCtx.textBaseline = "middle";
    gameCtx.font = '34px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
    catchDrops.forEach((drop) => gameCtx.fillText(drop.emoji, drop.x, drop.y));

    gameCtx.fillStyle = "#2d2a32";
    gameCtx.fillRect(catchBasketX - 50, canvas.height - 42, 100, 13);
    gameCtx.fillStyle = "#f2a65a";
    gameCtx.fillRect(catchBasketX - 43, canvas.height - 55, 86, 14);
    gameCtx.font = '28px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
    gameCtx.fillText("🧺", catchBasketX, canvas.height - 32);
  }

  function finishCatchGame() {
    catchGameRunning = false;
    cancelAnimationFrame(catchGameFrame);
    catchGameFrame = 0;
    updateCatchBest();
    $("#startCatchGameBtn").textContent = "▶ Play again";
    $("#catchGameStatus").textContent = "Finished — score " + catchScore;
    drawCatchGame();
  }

  function catchGameLoop(now) {
    if (!catchGameRunning) return;
    const canvas = $("#catchGameCanvas");
    const dt = Math.min(.04, Math.max(.001, (now - catchLastTime) / 1000));
    catchLastTime = now;

    if (now - catchGameStart >= 30000) {
      finishCatchGame();
      return;
    }

    if (now - catchLastSpawn > Math.max(250, 650 - (now - catchGameStart) / 100)) {
      const bad = Math.random() < .18;
      const goodEmoji = ["⭐","🍎","🍓","🌸","🎁","🦋","🍩","🌈"];
      const badEmoji = ["💀","💣","🕳️"];
      catchDrops.push({
        emoji: (bad ? badEmoji : goodEmoji)[Math.floor(Math.random() * (bad ? badEmoji : goodEmoji).length)],
        bad,
        x: 30 + Math.random() * (canvas.width - 60),
        y: -25,
        speed: 90 + Math.random() * 95 + (now - catchGameStart) / 800
      });
      catchLastSpawn = now;
    }

    catchDrops.forEach((drop) => { drop.y += drop.speed * dt; });
    catchDrops = catchDrops.filter((drop) => {
      if (drop.y > canvas.height - 72 && drop.y < canvas.height - 18 && Math.abs(drop.x - catchBasketX) < 58) {
        catchScore += drop.bad ? -2 : 1;
        catchScore = Math.max(0, catchScore);
        $("#catchScore").textContent = catchScore;
        return false;
      }
      return drop.y < canvas.height + 35;
    });

    const secondsLeft = Math.max(0, Math.ceil((30000 - (now - catchGameStart)) / 1000));
    $("#catchGameStatus").textContent = secondsLeft + " seconds";
    drawCatchGame();
    catchGameFrame = requestAnimationFrame(catchGameLoop);
  }

  function startCatchGame() {
    stopCatchGame();
    catchScore = 0;
    catchDrops = [];
    catchBasketX = 320;
    catchGameRunning = true;
    catchGameStart = performance.now();
    catchLastSpawn = catchGameStart;
    catchLastTime = catchGameStart;
    $("#catchScore").textContent = "0";
    $("#startCatchGameBtn").textContent = "■ Restart";
    catchGameFrame = requestAnimationFrame(catchGameLoop);
  }

  function stopCatchGame() {
    catchGameRunning = false;
    if (catchGameFrame) cancelAnimationFrame(catchGameFrame);
    catchGameFrame = 0;
  }

  function moveCatchBasket(event) {
    const canvas = $("#catchGameCanvas");
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * canvas.width;
    catchBasketX = Math.max(55, Math.min(canvas.width - 55, x));
    if (!catchGameRunning) drawCatchGame();
  }

  $("#catchGameCanvas").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    moveCatchBasket(event);
    $("#catchGameCanvas").setPointerCapture?.(event.pointerId);
  });
  $("#catchGameCanvas").addEventListener("pointermove", (event) => {
    if (event.buttons || event.pointerType === "touch") moveCatchBasket(event);
  });
  $("#startCatchGameBtn").addEventListener("click", startCatchGame);

  function relayBestScore() {
    return Math.max(0, Number(localStorage.getItem("emojiro-relay-best") || 0));
  }

  function finishRelayGame() {
    relayRunning = false;
    clearTimeout(relayTimer);
    relayTimer = 0;
    $$(".relay-pad").forEach((pad) => pad.classList.remove("active","hit","miss"));
    $("#relayMeter").style.width = "0";
    const best = Math.max(relayBestScore(), relayScore);
    localStorage.setItem("emojiro-relay-best", String(best));
    $("#relayBest").textContent = best;
    $("#startRelayBtn").textContent = "▶ Play again";
    $("#relayStatus").textContent = "Finished — score " + relayScore;
  }

  function relayNextRound() {
    if (!relayRunning) return;
    if (relayRound >= 30) {
      finishRelayGame();
      return;
    }

    if (relayRound > 0 && !relayHitThisRound) {
      relayScore = Math.max(0, relayScore - 1);
      $("#relayScore").textContent = relayScore;
    }

    relayRound += 1;
    relayHitThisRound = false;
    relayTarget = Math.floor(Math.random() * 4);
    $$(".relay-pad").forEach((pad, index) => {
      pad.classList.remove("hit","miss");
      pad.classList.toggle("active", index === relayTarget);
    });

    const pace = Math.max(360, 760 - relayRound * 10);
    $("#relayStatus").textContent = "Round " + relayRound + " / 30";
    const meter = $("#relayMeter");
    meter.style.transition = "none";
    meter.style.width = "100%";
    requestAnimationFrame(() => {
      meter.style.transition = "width " + pace + "ms linear";
      meter.style.width = "0%";
    });
    relayTimer = setTimeout(relayNextRound, pace);
  }

  function startRelayGame() {
    stopRelayGame();
    ensureAudio();
    relayScore = 0;
    relayRound = 0;
    relayTarget = -1;
    relayHitThisRound = false;
    relayRunning = true;
    $("#relayScore").textContent = "0";
    $("#startRelayBtn").textContent = "■ Restart";
    relayNextRound();
  }

  function stopRelayGame() {
    relayRunning = false;
    clearTimeout(relayTimer);
    relayTimer = 0;
    $$(".relay-pad").forEach((pad) => pad.classList.remove("active","hit","miss"));
  }

  $$(".relay-pad").forEach((pad) => {
    pad.addEventListener("click", () => {
      if (!relayRunning || relayHitThisRound) return;
      const lane = Number(pad.dataset.lane);
      relayHitThisRound = true;
      if (lane === relayTarget) {
        relayScore += 2;
        pad.classList.add("hit");
        const sounds = ["star","dog","duck","game"];
        const pitches = ["C5","G4","D5","E5"];
        playInstrument(sounds[lane], noteToFrequency(pitches[lane]), .18);
      } else {
        relayScore = Math.max(0, relayScore - 1);
        pad.classList.add("miss");
      }
      $("#relayScore").textContent = relayScore;
    });
  });
  $("#startRelayBtn").addEventListener("click", startRelayGame);

  function stopToyGames() {
    stopCatchGame();
    stopRelayGame();
  }

  $("#catchBest").textContent = catchBestScore();
  $("#relayBest").textContent = relayBestScore();
  drawCatchGame();

  // -----------------------------
  // Paint Studio
  // -----------------------------

  const paintCanvas = $("#paintCanvas");
  const ctx = paintCanvas.getContext("2d");
  let activeTool = "pencil";
  let activeColor = COLORS[0];
  let activeStamp = STAMPS[0];
  let isDrawing = false;
  let dragStart = null;
  let dragBase = null;
  let undoStack = [];
  let redoStack = [];
  let frames = [blankFrame()];
  let frameBeats = [1];
  let activeFrameIndex = 0;
  let previewTimer = null;
  let previewOrigin = 0;
  let syncedAnimationPreview = false;
  let onionSkin = false;
  let syncMusic = false;
  let customStamps = loadCustomStamps();
  let activeCustomStampId = customStamps[0] ? customStamps[0].id : null;
  let stampEditorPixels = Array(64).fill(null);
  let stampEditorColor = COLORS[2];
  let stampEditorPainting = false;
  let stampEditorPaintValue = null;
  let editingStampId = null;
  let brushPattern = "solid";
  let fillShapes = false;

  function loadCustomStamps() {
    try {
      const stored = JSON.parse(localStorage.getItem(CUSTOM_STAMPS_KEY) || "[]");
      if (!Array.isArray(stored)) return [];
      return stored
        .filter((stamp) => stamp && Array.isArray(stamp.pixels) && stamp.pixels.length === 64)
        .slice(0, 24);
    } catch (error) {
      return [];
    }
  }

  function persistCustomStamps() {
    localStorage.setItem(CUSTOM_STAMPS_KEY, JSON.stringify(customStamps));
  }

  function activeCustomStamp() {
    return customStamps.find((stamp) => stamp.id === activeCustomStampId) || null;
  }

  function blankCell() {
    return { color: null, emoji: null };
  }

  function blankFrame() {
    return Array.from({ length: COLS * ROWS }, blankCell);
  }

  function cellIndex(x, y) {
    return y * COLS + x;
  }

  function sameCell(a, b) {
    return (a && a.color) === (b && b.color) && (a && a.emoji) === (b && b.emoji);
  }

  function currentFrame() {
    return frames[activeFrameIndex];
  }

  function drawFrameToContext(targetCtx, frame, width, height, background = "#fffdf7") {
    const cellWidth = width / COLS;
    const cellHeight = height / ROWS;
    targetCtx.clearRect(0, 0, width, height);
    targetCtx.fillStyle = background;
    targetCtx.fillRect(0, 0, width, height);

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const cell = frame[cellIndex(x, y)];
        if (!cell) continue;
        if (cell.color) {
          targetCtx.fillStyle = cell.color;
          targetCtx.fillRect(x * cellWidth, y * cellHeight, cellWidth + .5, cellHeight + .5);
        }
        if (cell.emoji) {
          targetCtx.font = Math.max(8, Math.floor(cellHeight * .84)) + "px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif";
          targetCtx.textAlign = "center";
          targetCtx.textBaseline = "middle";
          targetCtx.fillText(cell.emoji, x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2 + 1);
        }
      }
    }
  }

  function videoPresetDimensions() {
    return VIDEO_PRESETS[videoPreset] || VIDEO_PRESETS.landscape;
  }

  function drawFrameToVideoContext(targetCtx, frame, width, height) {
    targetCtx.clearRect(0, 0, width, height);
    targetCtx.fillStyle = "#f6ead4";
    targetCtx.fillRect(0, 0, width, height);

    const source = document.createElement("canvas");
    source.width = 640;
    source.height = 480;
    drawFrameToContext(source.getContext("2d"), frame, source.width, source.height);

    const safeWidth = width * .92;
    const safeHeight = height * .82;
    const scale = Math.min(safeWidth / source.width, safeHeight / source.height);
    const drawWidth = source.width * scale;
    const drawHeight = source.height * scale;
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;

    targetCtx.save();
    targetCtx.shadowColor = "rgba(45,42,50,.22)";
    targetCtx.shadowBlur = Math.max(8, Math.round(Math.min(width, height) * .018));
    targetCtx.shadowOffsetY = Math.max(4, Math.round(Math.min(width, height) * .008));
    targetCtx.drawImage(source, x, y, drawWidth, drawHeight);
    targetCtx.restore();

    const margin = Math.min(width, height) * .025;
    targetCtx.fillStyle = "#2d2a32";
    targetCtx.textBaseline = "top";
    targetCtx.font = "900 " + Math.max(15, Math.round(Math.min(width, height) * .026)) + "px system-ui, sans-serif";
    targetCtx.fillText("Emojiro Paint", margin, margin);

    const songName = ($("#songName") && $("#songName").value) || "";
    if (songName) {
      targetCtx.textAlign = "right";
      targetCtx.font = "800 " + Math.max(12, Math.round(Math.min(width, height) * .019)) + "px system-ui, sans-serif";
      targetCtx.fillText(songName.slice(0, 40), width - margin, margin);
      targetCtx.textAlign = "left";
    }
  }

  function renderCanvas(frame = currentFrame(), showGrid = true) {
    ctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);

    if (onionSkin && !previewTimer && activeFrameIndex > 0 && frame === currentFrame()) {
      const previous = frames[activeFrameIndex - 1];
      ctx.save();
      ctx.globalAlpha = 0.18;
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          const ghost = previous[cellIndex(x, y)];
          if (!ghost) continue;
          if (ghost.color) {
            ctx.fillStyle = ghost.color;
            ctx.fillRect(x * CELL_W, y * CELL_H, CELL_W, CELL_H);
          }
          if (ghost.emoji) {
            ctx.font = "17px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(ghost.emoji, x * CELL_W + CELL_W / 2, y * CELL_H + CELL_H / 2 + 1);
          }
        }
      }
      ctx.restore();
    }

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const cell = frame[cellIndex(x, y)];
        if (!cell) continue;

        if (cell.color) {
          ctx.fillStyle = cell.color;
          ctx.fillRect(x * CELL_W, y * CELL_H, CELL_W, CELL_H);
        }

        if (cell.emoji) {
          ctx.font = "17px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(cell.emoji, x * CELL_W + CELL_W / 2, y * CELL_H + CELL_H / 2 + 1);
        }
      }
    }

    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = "rgba(45,42,50,.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x += 1) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_W + .5, 0);
        ctx.lineTo(x * CELL_W + .5, paintCanvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y += 1) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_H + .5);
        ctx.lineTo(paintCanvas.width, y * CELL_H + .5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function renderPaintPalettes() {
    const colorPalette = $("#colorPalette");
    colorPalette.innerHTML = "";
    COLORS.forEach((color) => {
      const button = document.createElement("button");
      button.className = "color-swatch" + (color === activeColor ? " active" : "");
      button.type = "button";
      button.style.background = color;
      button.title = color;
      button.setAttribute("aria-label", "Use color " + color);
      button.addEventListener("click", () => {
        activeColor = color;
        $$(".color-swatch").forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
      });
      colorPalette.appendChild(button);
    });

    const stampPalette = $("#stampPalette");
    stampPalette.innerHTML = "";
    STAMPS.forEach((stamp) => {
      const button = document.createElement("button");
      button.className = "stamp-button" + (stamp === activeStamp ? " active" : "");
      button.type = "button";
      button.textContent = stamp;
      button.setAttribute("aria-label", "Use stamp " + stamp);
      button.addEventListener("click", () => {
        activeStamp = stamp;
        activeTool = "stamp";
        syncToolButtons();
        $$(".stamp-button").forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
      });
      stampPalette.appendChild(button);
    });
  }

  function syncCustomStampActions() {
    const hasStamp = Boolean(activeCustomStamp());
    $("#editCustomStampBtn").disabled = !hasStamp;
    $("#duplicateCustomStampBtn").disabled = !hasStamp;
    $("#deleteCustomStampBtn").disabled = !hasStamp;
  }

  function renderCustomStampPalette() {
    const palette = $("#customStampPalette");
    if (!palette) return;
    palette.innerHTML = "";

    if (!customStamps.length) {
      activeCustomStampId = null;
      syncCustomStampActions();
      const empty = document.createElement("span");
      empty.className = "stamp-help";
      empty.textContent = "No custom stamps yet.";
      palette.appendChild(empty);
      return;
    }

    customStamps.forEach((stamp) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "custom-stamp-button" + (stamp.id === activeCustomStampId ? " active" : "");
      button.title = stamp.name || "Custom stamp";
      button.setAttribute("aria-label", "Use custom stamp " + (stamp.name || "Custom stamp"));

      const preview = document.createElement("span");
      preview.className = "custom-stamp-preview";
      stamp.pixels.forEach((color) => {
        const pixel = document.createElement("i");
        if (color) pixel.style.background = color;
        preview.appendChild(pixel);
      });
      button.appendChild(preview);

      button.addEventListener("click", () => {
        activeCustomStampId = stamp.id;
        activeTool = "customstamp";
        syncToolButtons();
        renderCustomStampPalette();
      });

      palette.appendChild(button);
    });
    syncCustomStampActions();
  }

  function syncToolButtons() {
    $$("#paintTools .tool-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.tool === activeTool);
    });
  }

  $$("#paintTools .tool-button").forEach((button) => {
    button.addEventListener("click", () => {
      activeTool = button.dataset.tool;
      syncToolButtons();
    });
  });

  function pointerCell(event) {
    const rect = paintCanvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * paintCanvas.width / rect.width / CELL_W);
    const y = Math.floor((event.clientY - rect.top) * paintCanvas.height / rect.height / CELL_H);
    return {
      x: Math.max(0, Math.min(COLS - 1, x)),
      y: Math.max(0, Math.min(ROWS - 1, y))
    };
  }

  function pushUndo() {
    undoStack.push(deepClone(currentFrame()));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
  }

  function setCell(x, y, value, frame = currentFrame()) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    frame[cellIndex(x, y)] = value;
  }

  function patternedColorAt(x, y) {
    if (brushPattern === "checker") return (x + y) % 2 === 0 ? activeColor : null;
    if (brushPattern === "dots") return (x % 2 === 0 && y % 2 === 0) ? activeColor : null;
    if (brushPattern === "rainbow") {
      const rainbow = ["#e45b5b", "#f28c45", "#f7d25c", "#74b86f", "#55a9d6", "#7d63bf", "#d56ca6"];
      return rainbow[Math.abs(x + y) % rainbow.length];
    }
    return activeColor;
  }

  function paintColorCell(x, y, frame = currentFrame()) {
    const color = patternedColorAt(x, y);
    if (!color) return;
    setCell(x, y, { color, emoji: null }, frame);
  }

  function paintAt(x, y) {
    if (activeTool === "pencil") {
      paintColorCell(x, y);
    } else if (activeTool === "stamp") {
      setCell(x, y, { color: null, emoji: activeStamp });
    } else if (activeTool === "eraser") {
      setCell(x, y, blankCell());
    } else if (activeTool === "fill") {
      floodFill(x, y);
    } else if (activeTool === "spray") {
      for (let i = 0; i < 9; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 2.7;
        const sx = Math.round(x + Math.cos(angle) * radius);
        const sy = Math.round(y + Math.sin(angle) * radius);
        if (sx >= 0 && sx < COLS && sy >= 0 && sy < ROWS) {
          paintColorCell(sx, sy);
        }
      }
    } else if (activeTool === "text") {
      const text = Array.from($("#paintTextInput").value || "");
      text.forEach((char, index) => {
        const tx = x + index;
        if (tx >= COLS) return;
        if (char !== " ") setCell(tx, y, { color: null, emoji: char });
      });
    } else if (activeTool === "customstamp") {
      const stamp = activeCustomStamp();
      if (!stamp) {
        toast("Make or select a custom stamp first");
        return;
      }
      const originX = x - 3;
      const originY = y - 3;
      stamp.pixels.forEach((color, index) => {
        if (!color) return;
        const px = index % 8;
        const py = Math.floor(index / 8);
        setCell(originX + px, originY + py, { color, emoji: null });
      });
    }
  }

  function floodFill(startX, startY) {
    const frame = currentFrame();
    const target = deepClone(frame[cellIndex(startX, startY)]);
    const replacement = { color: activeColor, emoji: null };
    if (sameCell(target, replacement)) return;

    const stack = [[startX, startY]];
    const seen = new Set();

    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue;
      const key = x + "," + y;
      if (seen.has(key)) continue;
      seen.add(key);

      const idx = cellIndex(x, y);
      if (!sameCell(frame[idx], target)) continue;
      frame[idx] = deepClone(replacement);
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  function plotLine(x0, y0, x1, y1, frame) {
    let dx = Math.abs(x1 - x0);
    let sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0);
    let sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    while (true) {
      paintColorCell(x0, y0, frame);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  function plotRect(x0, y0, x1, y1, frame) {
    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    const top = Math.min(y0, y1);
    const bottom = Math.max(y0, y1);

    if (fillShapes) {
      for (let y = top; y <= bottom; y += 1) {
        for (let x = left; x <= right; x += 1) paintColorCell(x, y, frame);
      }
      return;
    }

    for (let x = left; x <= right; x += 1) {
      paintColorCell(x, top, frame);
      paintColorCell(x, bottom, frame);
    }
    for (let y = top; y <= bottom; y += 1) {
      paintColorCell(left, y, frame);
      paintColorCell(right, y, frame);
    }
  }

  function plotEllipse(x0, y0, x1, y1, frame) {
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const rx = Math.max(.5, Math.abs(x1 - x0) / 2);
    const ry = Math.max(.5, Math.abs(y1 - y0) / 2);

    if (fillShapes) {
      const left = Math.floor(cx - rx);
      const right = Math.ceil(cx + rx);
      const top = Math.floor(cy - ry);
      const bottom = Math.ceil(cy + ry);
      for (let y = top; y <= bottom; y += 1) {
        for (let x = left; x <= right; x += 1) {
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1) paintColorCell(x, y, frame);
        }
      }
      return;
    }

    const samples = Math.max(24, Math.ceil(Math.PI * (rx + ry) * 2.2));
    for (let i = 0; i < samples; i += 1) {
      const angle = (i / samples) * Math.PI * 2;
      const x = Math.round(cx + Math.cos(angle) * rx);
      const y = Math.round(cy + Math.sin(angle) * ry);
      paintColorCell(x, y, frame);
    }
  }

  paintCanvas.addEventListener("pointerdown", (event) => {
    stopFramePreview();
    paintCanvas.setPointerCapture(event.pointerId);
    const pos = pointerCell(event);
    isDrawing = true;
    dragStart = pos;
    pushUndo();

    if (activeTool === "line" || activeTool === "rect" || activeTool === "ellipse") {
      dragBase = deepClone(currentFrame());
    } else {
      paintAt(pos.x, pos.y);
      renderCanvas();
      renderFrameList();
    }
  });

  paintCanvas.addEventListener("pointermove", (event) => {
    if (!isDrawing) return;
    const pos = pointerCell(event);

    if (activeTool === "pencil" || activeTool === "stamp" || activeTool === "eraser" || activeTool === "spray") {
      paintAt(pos.x, pos.y);
      renderCanvas();
    } else if ((activeTool === "line" || activeTool === "rect" || activeTool === "ellipse") && dragBase) {
      frames[activeFrameIndex] = deepClone(dragBase);
      if (activeTool === "line") plotLine(dragStart.x, dragStart.y, pos.x, pos.y, currentFrame());
      if (activeTool === "rect") plotRect(dragStart.x, dragStart.y, pos.x, pos.y, currentFrame());
      if (activeTool === "ellipse") plotEllipse(dragStart.x, dragStart.y, pos.x, pos.y, currentFrame());
      renderCanvas();
    }
  });

  function endPaint(event) {
    if (!isDrawing) return;
    isDrawing = false;
    dragBase = null;
    if (event && paintCanvas.hasPointerCapture(event.pointerId)) {
      paintCanvas.releasePointerCapture(event.pointerId);
    }
    renderCanvas();
    renderFrameList();
  }

  paintCanvas.addEventListener("pointerup", endPaint);
  paintCanvas.addEventListener("pointercancel", endPaint);

  $("#undoBtn").addEventListener("click", () => {
    if (!undoStack.length) return toast("Nothing to undo");
    redoStack.push(deepClone(currentFrame()));
    frames[activeFrameIndex] = undoStack.pop();
    renderCanvas();
    renderFrameList();
  });

  $("#redoBtn").addEventListener("click", () => {
    if (!redoStack.length) return toast("Nothing to redo");
    undoStack.push(deepClone(currentFrame()));
    frames[activeFrameIndex] = redoStack.pop();
    renderCanvas();
    renderFrameList();
  });

  $("#clearCanvasBtn").addEventListener("click", () => {
    pushUndo();
    frames[activeFrameIndex] = blankFrame();
    renderCanvas();
    renderFrameList();
    toast("Canvas cleared");
  });

  function hexToRgb(hex) {
    const value = hex.replace("#", "");
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  const PALETTE_RGB = COLORS.map((color) => ({ color, ...hexToRgb(color) }));

  function nearestPaletteColor(r, g, b) {
    let best = PALETTE_RGB[0];
    let bestDistance = Infinity;
    PALETTE_RGB.forEach((entry) => {
      const dr = r - entry.r;
      const dg = g - entry.g;
      const db = b - entry.b;
      const distance = dr * dr + dg * dg + db * db;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = entry;
      }
    });
    return best.color;
  }

  async function imageSourceFromFile(file) {
    if ("createImageBitmap" in window) return createImageBitmap(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image could not be decoded"));
      };
      img.src = url;
    });
  }

  $("#importImageInput").addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const frameStrip = $(".frame-strip");
    frameStrip.classList.add("importing");
    try {
      const image = await imageSourceFromFile(file);
      const sourceWidth = image.width || image.naturalWidth;
      const sourceHeight = image.height || image.naturalHeight;
      const temp = document.createElement("canvas");
      temp.width = COLS;
      temp.height = ROWS;
      const tctx = temp.getContext("2d", { willReadFrequently: true });
      tctx.clearRect(0, 0, COLS, ROWS);
      tctx.imageSmoothingEnabled = true;

      const scale = Math.min(COLS / sourceWidth, ROWS / sourceHeight);
      const width = sourceWidth * scale;
      const height = sourceHeight * scale;
      const dx = (COLS - width) / 2;
      const dy = (ROWS - height) / 2;
      tctx.drawImage(image, dx, dy, width, height);

      const pixels = tctx.getImageData(0, 0, COLS, ROWS).data;
      const imported = blankFrame();
      for (let i = 0; i < COLS * ROWS; i += 1) {
        const p = i * 4;
        if (pixels[p + 3] < 32) continue;
        imported[i] = {
          color: nearestPaletteColor(pixels[p], pixels[p + 1], pixels[p + 2]),
          emoji: null
        };
      }

      pushUndo();
      frames[activeFrameIndex] = imported;
      renderCanvas();
      renderFrameList();
      toast("Image pixelated to 32 × 24");
      if (typeof image.close === "function") image.close();
    } catch (error) {
      toast("Image could not be imported");
    } finally {
      frameStrip.classList.remove("importing");
      event.target.value = "";
    }
  });

  $("#exportCanvasBtn").addEventListener("click", () => {
    renderCanvas(currentFrame(), false);
    const url = paintCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "emojiro-paint.png";
    a.click();
    renderCanvas();
    toast("PNG exported");
  });

  function frameThumbnail(frame) {
    const temp = document.createElement("canvas");
    temp.width = 320;
    temp.height = 240;
    drawFrameToContext(temp.getContext("2d"), frame, temp.width, temp.height);
    return temp.toDataURL("image/png");
  }

  function syncFrameTimingUi() {
    while (frameBeats.length < frames.length) frameBeats.push(1);
    frameBeats = frameBeats.slice(0, frames.length);
    const beats = Math.max(1, Math.min(8, Number(frameBeats[activeFrameIndex]) || 1));
    frameBeats[activeFrameIndex] = beats;
    $("#frameBeats").value = beats;
    $("#frameBeatsOut").textContent = beats + (beats === 1 ? " beat" : " beats");
  }

  function renderFrameList() {
    const list = $("#frameList");
    list.innerHTML = "";
    frames.forEach((frame, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "frame-thumb" + (index === activeFrameIndex ? " active" : "");
      button.style.backgroundImage = "url(" + frameThumbnail(frame) + ")";
      button.setAttribute("aria-label", "Open animation frame " + (index + 1));
      const label = document.createElement("span");
      label.textContent = index + 1;
      button.appendChild(label);
      const beats = document.createElement("span");
      beats.className = "beat-badge";
      const beatCount = Math.max(1, Number(frameBeats[index]) || 1);
      beats.textContent = beatCount + "b";
      button.appendChild(beats);
      button.addEventListener("click", () => {
        stopFramePreview();
        activeFrameIndex = index;
        undoStack = [];
        redoStack = [];
        syncFrameTimingUi();
        renderCanvas();
        renderFrameList();
      });
      list.appendChild(button);
    });
  }

  $("#addFrameBtn").addEventListener("click", () => {
    stopFramePreview();
    frames.push(blankFrame());
    frameBeats.push(1);
    activeFrameIndex = frames.length - 1;
    undoStack = [];
    redoStack = [];
    syncFrameTimingUi();
    renderCanvas();
    renderFrameList();
  });

  $("#duplicateFrameBtn").addEventListener("click", () => {
    stopFramePreview();
    frames.splice(activeFrameIndex + 1, 0, deepClone(currentFrame()));
    frameBeats.splice(activeFrameIndex + 1, 0, frameBeats[activeFrameIndex] || 1);
    activeFrameIndex += 1;
    undoStack = [];
    redoStack = [];
    syncFrameTimingUi();
    renderCanvas();
    renderFrameList();
  });

  $("#deleteFrameBtn").addEventListener("click", () => {
    stopFramePreview();
    if (frames.length === 1) return toast("Keep at least one frame");
    frames.splice(activeFrameIndex, 1);
    frameBeats.splice(activeFrameIndex, 1);
    activeFrameIndex = Math.max(0, activeFrameIndex - 1);
    undoStack = [];
    redoStack = [];
    syncFrameTimingUi();
    renderCanvas();
    renderFrameList();
  });

  $("#brushPatternSelect").addEventListener("change", (event) => {
    brushPattern = event.target.value;
  });

  $("#fillShapeToggle").addEventListener("change", (event) => {
    fillShapes = event.target.checked;
  });

  function moveActiveFrame(direction) {
    stopFramePreview();
    const nextIndex = activeFrameIndex + direction;
    if (nextIndex < 0 || nextIndex >= frames.length) return;
    const temp = frames[activeFrameIndex];
    frames[activeFrameIndex] = frames[nextIndex];
    frames[nextIndex] = temp;
    const beatTemp = frameBeats[activeFrameIndex];
    frameBeats[activeFrameIndex] = frameBeats[nextIndex];
    frameBeats[nextIndex] = beatTemp;
    activeFrameIndex = nextIndex;
    syncFrameTimingUi();
    renderCanvas();
    renderFrameList();
  }

  $("#moveFrameLeftBtn").addEventListener("click", () => moveActiveFrame(-1));
  $("#moveFrameRightBtn").addEventListener("click", () => moveActiveFrame(1));

  $("#onionSkinToggle").addEventListener("change", (event) => {
    onionSkin = event.target.checked;
    renderCanvas();
  });

  $("#syncMusicToggle").addEventListener("change", (event) => {
    syncMusic = event.target.checked;
  });

  $("#frameBeats").addEventListener("input", (event) => {
    frameBeats[activeFrameIndex] = Number(event.target.value);
    $("#frameBeatsOut").textContent = event.target.value + (event.target.value === "1" ? " beat" : " beats");
    renderFrameList();
  });

  $("#frameSpeed").addEventListener("input", (event) => {
    $("#frameSpeedOut").textContent = event.target.value + " fps";
    if (previewTimer) startFramePreview();
  });

  function animationFrameForBeat(beat) {
    const total = frameBeats.reduce((sum, value) => sum + Math.max(1, Number(value) || 1), 0) || 1;
    let position = ((beat % total) + total) % total;
    for (let i = 0; i < frames.length; i += 1) {
      const duration = Math.max(1, Number(frameBeats[i]) || 1);
      if (position < duration) return i;
      position -= duration;
    }
    return 0;
  }

  function updateSyncedAnimationForBeat(beat) {
    if (!syncedAnimationPreview) return;
    const nextIndex = animationFrameForBeat(beat);
    if (nextIndex !== activeFrameIndex) {
      activeFrameIndex = nextIndex;
      syncFrameTimingUi();
      renderCanvas();
      renderFrameList();
    }
  }

  function startFramePreview() {
    stopFramePreview(false);
    previewOrigin = activeFrameIndex;
    $("#playFramesBtn").textContent = "■ Stop";

    if (syncMusic) {
      syncedAnimationPreview = true;
      previewTimer = "music-sync";
      currentStep = 0;
      activeFrameIndex = animationFrameForBeat(0);
      syncFrameTimingUi();
      renderCanvas();
      renderFrameList();
      if (!isMusicPlaying) startMusic();
      return;
    }

    let index = activeFrameIndex;
    const tick = () => {
      if (!previewTimer || syncedAnimationPreview) return;
      index = (index + 1) % frames.length;
      activeFrameIndex = index;
      syncFrameTimingUi();
      renderCanvas();
      renderFrameList();
      previewTimer = setTimeout(tick, 1000 / Number($("#frameSpeed").value));
    };
    previewTimer = setTimeout(tick, 1000 / Number($("#frameSpeed").value));
  }

  function stopFramePreview(restore = true) {
    if (!previewTimer && !syncedAnimationPreview) return;
    if (syncedAnimationPreview) {
      syncedAnimationPreview = false;
      previewTimer = null;
      if (isMusicPlaying) stopMusic(true);
    } else {
      clearTimeout(previewTimer);
      previewTimer = null;
    }
    $("#playFramesBtn").textContent = "▶ Preview";
    if (restore) {
      activeFrameIndex = Math.min(previewOrigin, frames.length - 1);
      syncFrameTimingUi();
      renderCanvas();
      renderFrameList();
    }
  }

  $("#playFramesBtn").addEventListener("click", () => {
    if (previewTimer) stopFramePreview();
    else startFramePreview();
  });

  // -----------------------------
  // Custom Stamp Workshop
  // -----------------------------

  function renderStampEditor() {
    const grid = $("#stampEditorGrid");
    grid.innerHTML = "";
    stampEditorPixels.forEach((color, index) => {
      const pixel = document.createElement("button");
      pixel.type = "button";
      pixel.className = "stamp-pixel" + (color ? " filled" : "");
      pixel.dataset.index = index;
      if (color) pixel.style.background = color;
      pixel.setAttribute("aria-label", "Stamp pixel " + (index + 1));
      grid.appendChild(pixel);
    });
  }

  function renderStampEditorColors() {
    const palette = $("#stampEditorColors");
    palette.innerHTML = "";
    COLORS.forEach((color) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "color-swatch" + (color === stampEditorColor ? " active" : "");
      button.style.background = color;
      button.setAttribute("aria-label", "Use stamp color " + color);
      button.addEventListener("click", () => {
        stampEditorColor = color;
        renderStampEditorColors();
      });
      palette.appendChild(button);
    });
  }

  function stampEditorIndexFromPointer(event) {
    const grid = $("#stampEditorGrid");
    const rect = grid.getBoundingClientRect();
    const x = Math.max(0, Math.min(7, Math.floor((event.clientX - rect.left) / rect.width * 8)));
    const y = Math.max(0, Math.min(7, Math.floor((event.clientY - rect.top) / rect.height * 8)));
    return y * 8 + x;
  }

  function applyStampEditorPointer(event, starting) {
    const index = stampEditorIndexFromPointer(event);
    if (starting) {
      stampEditorPaintValue = stampEditorPixels[index] === stampEditorColor ? null : stampEditorColor;
    }
    stampEditorPixels[index] = stampEditorPaintValue;
    renderStampEditor();
  }

  $("#stampEditorGrid").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    stampEditorPainting = true;
    $("#stampEditorGrid").setPointerCapture(event.pointerId);
    applyStampEditorPointer(event, true);
  });

  $("#stampEditorGrid").addEventListener("pointermove", (event) => {
    if (!stampEditorPainting) return;
    event.preventDefault();
    applyStampEditorPointer(event, false);
  });

  $("#stampEditorGrid").addEventListener("pointerup", (event) => {
    stampEditorPainting = false;
    if ($("#stampEditorGrid").hasPointerCapture(event.pointerId)) {
      $("#stampEditorGrid").releasePointerCapture(event.pointerId);
    }
  });

  $("#stampEditorGrid").addEventListener("pointercancel", () => {
    stampEditorPainting = false;
  });

  function openStampEditor(stamp = null) {
    editingStampId = stamp ? stamp.id : null;
    stampEditorPixels = stamp ? stamp.pixels.slice() : Array(64).fill(null);
    $("#customStampName").value = stamp ? stamp.name : "My Stamp";
    $("#saveCustomStampBtn").textContent = stamp ? "💾 Update stamp" : "💾 Save stamp";
    renderStampEditor();
    renderStampEditorColors();
    $("#stampMakerDialog").showModal();
  }

  $("#openStampMakerBtn").addEventListener("click", () => openStampEditor());

  $("#editCustomStampBtn").addEventListener("click", () => {
    const stamp = activeCustomStamp();
    if (!stamp) return toast("Select a custom stamp first");
    openStampEditor(stamp);
  });

  $("#duplicateCustomStampBtn").addEventListener("click", () => {
    const stamp = activeCustomStamp();
    if (!stamp) return toast("Select a custom stamp first");
    const copy = {
      id: "stamp-" + Date.now().toString(36),
      name: (stamp.name + " Copy").slice(0, 24),
      pixels: stamp.pixels.slice()
    };
    customStamps.push(copy);
    if (customStamps.length > 24) customStamps.shift();
    activeCustomStampId = copy.id;
    persistCustomStamps();
    renderCustomStampPalette();
    toast("Custom stamp duplicated");
  });

  $("#deleteCustomStampBtn").addEventListener("click", () => {
    const stamp = activeCustomStamp();
    if (!stamp) return toast("Select a custom stamp first");
    customStamps = customStamps.filter((item) => item.id !== stamp.id);
    activeCustomStampId = customStamps[0] ? customStamps[0].id : null;
    persistCustomStamps();
    renderCustomStampPalette();
    if (!activeCustomStampId && activeTool === "customstamp") {
      activeTool = "pencil";
      syncToolButtons();
    }
    toast("Custom stamp deleted");
  });

  $("#clearStampEditorBtn").addEventListener("click", () => {
    stampEditorPixels = Array(64).fill(null);
    renderStampEditor();
  });

  $("#saveCustomStampBtn").addEventListener("click", () => {
    if (!stampEditorPixels.some(Boolean)) return toast("Draw something before saving the stamp");
    const name = ($("#customStampName").value || "My Stamp").trim().slice(0, 24);

    if (editingStampId) {
      const stamp = customStamps.find((item) => item.id === editingStampId);
      if (stamp) {
        stamp.name = name;
        stamp.pixels = stampEditorPixels.slice();
        activeCustomStampId = stamp.id;
      }
    } else {
      const stamp = {
        id: "stamp-" + Date.now().toString(36),
        name,
        pixels: stampEditorPixels.slice()
      };
      customStamps.push(stamp);
      if (customStamps.length > 24) customStamps.shift();
      activeCustomStampId = stamp.id;
    }

    editingStampId = null;
    persistCustomStamps();
    renderCustomStampPalette();
    activeTool = "customstamp";
    syncToolButtons();
    $("#stampMakerDialog").close();
    toast("Custom stamp saved");
  });

  // -----------------------------
  // Emoji Composer
  // -----------------------------

  let audioCtx = null;
  let selectedInstrument = INSTRUMENTS[0].id;
  let sequence = makeSequence();
  let currentStep = 0;
  let highlightedStep = -1;
  let musicTimer = null;
  let isMusicPlaying = false;
  let loopMusic = true;
  let timeSignature = 4;
  let songEndStep = SEQ_STEPS;
  let endMarkerMode = false;
  let musicHistory = [];
  let measureEditStep = 0;
  let measureClipboard = null;
  let selectedSection = 0;
  let sectionNames = ["Section A", "Section B", "Section C", "Section D"];
  let sectionTempoOverrides = Array(SECTION_COUNT).fill(null);
  let sectionInstrumentPalettes = Array(SECTION_COUNT).fill(null);
  let sectionMixerSnapshots = Array(SECTION_COUNT).fill(null);
  let humanizeMs = 0;
  let percussionPattern = null;
  let sectionClipboard = null;
  let activeMixMultiplier = 1;
  let activeMixPan = 0;
  let activeMixFilter = 0;
  let activeMixDelay = 0;
  let captureDestination = null;
  let suppressLiveOutput = false;
  let sectionLoopEnabled = false;
  let playbackMode = "song";
  let playbackStartStep = 0;
  let playbackEndStep = SEQ_STEPS;
  let composerZoom = 38;
  let composerCompact = window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
  let scaleAssist = "all";
  let notePaintMode = false;
  let notePaintDragging = false;
  let notePaintPointerId = null;
  let notePaintAction = "paint";
  let notePaintLastKey = "";
  let suppressNotePaintClick = false;
  let videoPreset = "landscape";
  const VIDEO_PRESETS = {
    landscape: { width: 1280, height: 720, label: "16:9" },
    square: { width: 720, height: 720, label: "1:1" },
    portrait: { width: 720, height: 1280, label: "9:16" },
    canvas: { width: 640, height: 480, label: "4:3" }
  };
  const SCALE_GUIDES = {
    all: ["A","B","C","D","E","F","G"],
    "c-major": ["C","D","E","F","G","A","B"],
    "g-major": ["G","A","B","C","D","E"],
    "f-major": ["F","G","A","C","D","E"],
    "c-pentatonic": ["C","D","E","G","A"],
    "e-pentatonic": ["E","G","A","B","D"]
  };
  const CHORD_GUIDES = {
    "C-E-G": ["C4","E4","G4"],
    "D-F-A": ["D4","F4","A4"],
    "E-G-B": ["E4","G4","B4"],
    "F-A-C": ["F4","A4","C5"],
    "G-B-D": ["G4","B4","D5"],
    "A-C-E": ["A4","C5","E5"],
    "B-D-F": ["B4","D5","F5"]
  };
  const PROGRESSION_GUIDES = {
    "I-V-vi-IV": ["C-E-G","G-B-D","A-C-E","F-A-C"],
    "I-IV-V-I": ["C-E-G","F-A-C","G-B-D","C-E-G"],
    "vi-IV-I-V": ["A-C-E","F-A-C","C-E-G","G-B-D"],
    "ii-V-I-I": ["D-F-A","G-B-D","C-E-G","C-E-G"]
  };
  const LIVE_KEYBOARD_KEYS = ["a","w","s","e","d","f","t","g","y","h","u","j","k"];
  const PERCUSSION_LANES = [
    { id: "kick", emoji: "🍄", name: "Kick", instrument: "drum", pitch: "B3", midi: 36 },
    { id: "clack", emoji: "🚢", name: "Clack", instrument: "ship", pitch: "C4", midi: 38 },
    { id: "duck", emoji: "🦆", name: "Duck", instrument: "duck", pitch: "G4", midi: 42 },
    { id: "zap", emoji: "🎮", name: "Zap", instrument: "game", pitch: "C5", midi: 46 }
  ];
  percussionPattern = makePercussionPattern();
  let liveRecordEnabled = false;
  let liveRecordTakeStarted = false;
  let instrumentMix = Object.fromEntries(
    INSTRUMENTS.map((instrument) => [instrument.id, {
      volume: 1, mute: false, solo: false, pan: 0, filter: 0, delay: 0
    }])
  );

  function makeSequence() {
    return Array.from({ length: PITCHES.length }, () => Array(SEQ_STEPS).fill(null));
  }

  function makePercussionPattern() {
    return Array.from({ length: PERCUSSION_LANES.length }, () => Array(SEQ_STEPS).fill(false));
  }

  function normalizePercussion(input) {
    const out = makePercussionPattern();
    if (!Array.isArray(input)) return out;
    for (let lane = 0; lane < Math.min(PERCUSSION_LANES.length, input.length); lane += 1) {
      if (!Array.isArray(input[lane])) continue;
      for (let step = 0; step < Math.min(SEQ_STEPS, input[lane].length); step += 1) {
        out[lane][step] = Boolean(input[lane][step]);
      }
    }
    return out;
  }

  function effectiveTempoAtStep(step) {
    const section = Math.max(0, Math.min(SECTION_COUNT - 1, Math.floor(step / SECTION_LENGTH)));
    const override = Number(sectionTempoOverrides[section]);
    return override >= 40 && override <= 480 ? override : Number($("#tempoSlider").value);
  }

  function humanizeOffsetMs(index, step) {
    if (!humanizeMs) return 0;
    const raw = Math.sin((step + 1) * 12.9898 + (index + 1) * 78.233) * 43758.5453;
    const unit = raw - Math.floor(raw);
    return Math.round(unit * humanizeMs);
  }

  function songDurationSeconds() {
    let seconds = 0;
    for (let step = 0; step < songEndStep; step += 1) {
      seconds += 60 / effectiveTempoAtStep(step);
    }
    return seconds;
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(total / 60);
    return minutes + ":" + String(total % 60).padStart(2, "0");
  }

  function renderArrangementOverview() {
    const overview = $("#arrangementOverview");
    if (!overview) return;
    overview.innerHTML = "";
    $("#songDurationReadout").textContent = formatDuration(songDurationSeconds());

    for (let section = 0; section < SECTION_COUNT; section += 1) {
      const start = sectionStart(section);
      const end = Math.min(songEndStep, start + SECTION_LENGTH);
      let noteCount = 0;
      let drumCount = 0;
      let seconds = 0;

      for (let step = start; step < end; step += 1) {
        seconds += 60 / effectiveTempoAtStep(step);
        for (let row = 0; row < PITCHES.length; row += 1) {
          if (sequence[row][step]) noteCount += 1;
        }
        for (let lane = 0; lane < PERCUSSION_LANES.length; lane += 1) {
          if (percussionPattern[lane][step]) drumCount += 1;
        }
      }

      const card = document.createElement("button");
      card.type = "button";
      card.className = "arrangement-card" +
        (section === selectedSection ? " active" : "") +
        (start >= songEndStep ? " after-end" : "");

      const title = document.createElement("div");
      title.className = "arrangement-card-title";
      const name = document.createElement("strong");
      name.textContent = sectionNames[section] || ("Section " + String.fromCharCode(65 + section));
      const bpm = document.createElement("span");
      bpm.textContent = effectiveTempoAtStep(start) + " BPM";
      title.append(name, bpm);

      const meta = document.createElement("div");
      meta.className = "arrangement-card-meta";
      [
        noteCount + " notes",
        drumCount + " hits",
        formatDuration(seconds)
      ].forEach((value) => {
        const pill = document.createElement("span");
        pill.textContent = value;
        meta.appendChild(pill);
      });

      const activity = document.createElement("div");
      activity.className = "arrangement-activity";
      for (let offset = 0; offset < SECTION_LENGTH; offset += 1) {
        const step = start + offset;
        const beat = document.createElement("span");
        beat.className = "arrangement-beat";
        const melody = step < songEndStep && sequence.some((row) => Boolean(row[step]));
        const drums = step < songEndStep && percussionPattern.some((lane) => Boolean(lane[step]));
        if (melody && drums) beat.classList.add("both");
        else if (melody) beat.classList.add("melody");
        else if (drums) beat.classList.add("drums");
        activity.appendChild(beat);
      }

      card.append(title, meta, activity);
      card.addEventListener("click", () => {
        selectedSection = section;
        measureEditStep = start;
        renderSectionBar();
        renderPercussionGrid();
        if (mobileSectionComposer()) renderSequencer();
        refreshSectionSelection();
        refreshMeasureSelection();
        const header = $('.seq-step[data-step="' + start + '"]');
        if (header) header.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: window.innerWidth <= 640 ? "center" : "start"
        });
      });

      overview.appendChild(card);
    }
  }

  function sectionPaletteAllows(id, section = selectedSection) {
    const palette = sectionInstrumentPalettes[section];
    return !Array.isArray(palette) || palette.includes(id);
  }

  function mixerForStep(step) {
    const section = Math.max(0, Math.min(SECTION_COUNT - 1, Math.floor(step / SECTION_LENGTH)));
    const snapshot = sectionMixerSnapshots[section];
    return snapshot && typeof snapshot === "object" ? snapshot : instrumentMix;
  }

  function mixerState(mixer, id) {
    const source = mixer || instrumentMix;
    const mix = source[id] || {
      volume: 1, mute: false, solo: false, pan: 0, filter: 0, delay: 0
    };
    const anySolo = Object.values(source).some((entry) => entry && entry.solo);
    return {
      mix,
      audible: !mix.mute && (!anySolo || mix.solo) && Number(mix.volume) > 0
    };
  }

  function normalizeMixerSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return null;
    const out = {};
    INSTRUMENTS.forEach((instrument) => {
      const saved = snapshot[instrument.id] || {};
      out[instrument.id] = {
        volume: Number.isFinite(Number(saved.volume)) ? Math.max(0, Math.min(1, Number(saved.volume))) : 1,
        mute: Boolean(saved.mute),
        solo: Boolean(saved.solo),
        pan: Number.isFinite(Number(saved.pan)) ? Math.max(-1, Math.min(1, Number(saved.pan))) : 0,
        filter: Number.isFinite(Number(saved.filter)) ? Math.max(0, Math.min(1, Number(saved.filter))) : 0,
        delay: Number.isFinite(Number(saved.delay)) ? Math.max(0, Math.min(1, Number(saved.delay))) : 0
      };
    });
    return out;
  }

  function instrumentById(id) {
    return INSTRUMENTS.find((instrument) => instrument.id === id);
  }

  function ensureAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function noteToFrequency(note) {
    const match = /^([A-G])(#?)(\d)$/.exec(note);
    if (!match) return 440;
    const semis = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const midi = (Number(match[3]) + 1) * 12 + semis[match[1]] + (match[2] ? 1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function connectAudioOutputs(node) {
    const ac = ensureAudio();
    if (!suppressLiveOutput) node.connect(ac.destination);
    if (captureDestination) node.connect(captureDestination);
  }

  function connectGain(gainValue, when, duration) {
    const ac = ensureAudio();
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, gainValue * activeMixMultiplier),
      when + Math.min(.02, Math.max(.005, duration * .18))
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    let output = gain;

    if (activeMixFilter > .005) {
      const filter = ac.createBiquadFilter();
      filter.type = "lowpass";
      const cutoff = 19000 * Math.pow(0.055, activeMixFilter);
      filter.frequency.setValueAtTime(Math.max(450, cutoff), when);
      filter.Q.setValueAtTime(.7 + activeMixFilter * 2.5, when);
      output.connect(filter);
      output = filter;
    }

    if (typeof ac.createStereoPanner === "function") {
      const panner = ac.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, activeMixPan)), when);
      output.connect(panner);
      output = panner;
    }

    connectAudioOutputs(output);

    if (activeMixDelay > .005) {
      const delay = ac.createDelay(1);
      const feedback = ac.createGain();
      const wet = ac.createGain();
      delay.delayTime.setValueAtTime(.14 + activeMixDelay * .34, when);
      feedback.gain.setValueAtTime(.12 + activeMixDelay * .5, when);
      wet.gain.setValueAtTime(.08 + activeMixDelay * .32, when);
      output.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      connectAudioOutputs(wet);
    }

    return gain;
  }

  function tone(wave, frequency, when, duration, gainValue, detune = 0) {
    const ac = ensureAudio();
    const osc = ac.createOscillator();
    const gain = connectGain(gainValue, when, duration);
    osc.type = wave;
    osc.frequency.setValueAtTime(Math.max(25, frequency), when);
    osc.detune.setValueAtTime(detune, when);
    osc.connect(gain);
    osc.start(when);
    osc.stop(when + duration + .03);
    return osc;
  }

  function noiseBurst(when, duration, gainValue, filterType, filterFrequency) {
    const ac = ensureAudio();
    const buffer = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * duration)), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const gain = connectGain(gainValue, when, duration);
    if (filterType) {
      const filter = ac.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = filterFrequency || 1000;
      src.connect(filter);
      filter.connect(gain);
    } else {
      src.connect(gain);
    }
    src.start(when);
  }

  function playInstrument(id, frequency, duration = .28, when, mixerOverride = null) {
    const ac = ensureAudio();
    const start = when == null ? ac.currentTime : when;
    const instrument = instrumentById(id);
    if (!instrument) return;
    const mixer = mixerOverride || instrumentMix;
    const mix = mixer[id] || {
      volume: 1, mute: false, solo: false, pan: 0, filter: 0, delay: 0
    };
    const anySolo = Object.values(mixer).some((entry) => entry && entry.solo);
    if (mix.mute || (anySolo && !mix.solo) || Number(mix.volume) <= 0) return;
    const previousMixMultiplier = activeMixMultiplier;
    const previousMixPan = activeMixPan;
    const previousMixFilter = activeMixFilter;
    const previousMixDelay = activeMixDelay;
    activeMixMultiplier = Math.max(0, Math.min(1, Number(mix.volume) || 0));
    activeMixPan = Math.max(-1, Math.min(1, Number(mix.pan) || 0));
    activeMixFilter = Math.max(0, Math.min(1, Number(mix.filter) || 0));
    activeMixDelay = Math.max(0, Math.min(1, Number(mix.delay) || 0));

    switch (instrument.type) {
      case "kalimba": {
        tone("triangle", frequency * 2, start, duration * .65, .075);
        tone("sine", frequency * 4, start, duration * .42, .025);
        break;
      }
      case "drum": {
        const kick = tone("sine", 125, start, .18, .18);
        kick.frequency.exponentialRampToValueAtTime(42, start + .18);
        noiseBurst(start, .055, .04, "lowpass", 900);
        break;
      }
      case "lizard": {
        const osc = tone("square", frequency * 1.25, start, duration * .42, .055);
        osc.frequency.exponentialRampToValueAtTime(frequency * 2.1, start + duration * .2);
        osc.frequency.exponentialRampToValueAtTime(frequency * 1.4, start + duration * .42);
        break;
      }
      case "star":
        tone("sine", frequency * 4, start, duration * 1.4, .055);
        tone("sine", frequency * 8.02, start, duration, .022);
        break;
      case "flower":
        tone("sine", frequency * 2, start, duration * .9, .05);
        tone("sine", frequency * 3.01, start + .015, duration * .7, .025);
        break;
      case "game":
        tone("square", frequency, start, duration * .65, .075);
        break;
      case "dog": {
        const bark = tone("sawtooth", Math.max(65, frequency / 2), start, duration * .44, .065);
        bark.frequency.exponentialRampToValueAtTime(Math.max(45, frequency / 3), start + duration * .44);
        noiseBurst(start, duration * .28, .035, "bandpass", 550);
        break;
      }
      case "cat": {
        const meow = tone("sawtooth", frequency, start, duration * .8, .045);
        meow.frequency.exponentialRampToValueAtTime(frequency * 1.35, start + duration * .35);
        meow.frequency.exponentialRampToValueAtTime(frequency * .82, start + duration * .8);
        break;
      }
      case "pig": {
        const oink = tone("square", Math.max(55, frequency * .62), start, duration * .55, .055);
        oink.frequency.exponentialRampToValueAtTime(Math.max(42, frequency * .42), start + duration * .55);
        noiseBurst(start, duration * .35, .028, "lowpass", 650);
        break;
      }
      case "duck": {
        const quack = tone("sawtooth", Math.max(120, frequency * .7), start, duration * .32, .07);
        quack.frequency.exponentialRampToValueAtTime(Math.max(95, frequency * .48), start + duration * .32);
        noiseBurst(start, duration * .16, .025, "bandpass", 1050);
        break;
      }
      case "baby": {
        const hic = tone("sine", frequency * 1.5, start, duration * .3, .055);
        hic.frequency.exponentialRampToValueAtTime(frequency * 2.3, start + duration * .12);
        hic.frequency.exponentialRampToValueAtTime(frequency * 1.45, start + duration * .3);
        break;
      }
      case "plane": {
        tone("sawtooth", Math.max(55, frequency / 4), start, duration * 1.15, .055);
        tone("sine", Math.max(90, frequency / 2), start, duration * 1.1, .035);
        noiseBurst(start, duration * .9, .018, "lowpass", 700);
        break;
      }
      case "ship":
        tone("sine", Math.max(65, frequency / 3), start, duration * 1.25, .095);
        tone("sine", Math.max(95, frequency / 2), start, duration * 1.15, .055);
        break;
      case "car":
        tone("square", Math.max(180, frequency * .9), start, duration * .45, .055);
        tone("square", Math.max(240, frequency * 1.2), start + .03, duration * .4, .035);
        break;
      case "heart":
        tone("sine", Math.max(42, frequency / 5), start, .11, .12);
        tone("sine", Math.max(38, frequency / 5.5), start + .16, .14, .09);
        break;

      case "frog": {
        const croak = tone("square", Math.max(70, frequency / 2.5), start, duration * .55, .065);
        croak.frequency.exponentialRampToValueAtTime(Math.max(50, frequency / 3.6), start + duration * .55);
        noiseBurst(start, duration * .3, .02, "lowpass", 500);
        break;
      }
      case "cow": {
        const moo = tone("sawtooth", Math.max(65, frequency / 2.4), start, duration * 1.05, .065);
        moo.frequency.exponentialRampToValueAtTime(Math.max(55, frequency / 2.8), start + duration * 1.05);
        tone("sine", Math.max(95, frequency / 1.7), start, duration * .95, .025);
        break;
      }
      case "chicken":
        noiseBurst(start, .055, .055, "bandpass", 1800);
        tone("square", frequency * 1.8, start, .06, .035);
        tone("square", frequency * 2.2, start + .075, .055, .03);
        break;
      case "horse": {
        const neigh = tone("sawtooth", frequency * .85, start, duration * .85, .05);
        neigh.frequency.exponentialRampToValueAtTime(frequency * 1.55, start + duration * .35);
        neigh.frequency.exponentialRampToValueAtTime(frequency * .72, start + duration * .85);
        break;
      }
      case "monkey":
        tone("square", frequency * 1.45, start, .09, .045);
        tone("square", frequency * 1.8, start + .11, .08, .04);
        tone("square", frequency * 1.25, start + .22, .1, .04);
        break;
      case "lion": {
        const roar = tone("sawtooth", Math.max(48, frequency / 4), start, duration * .95, .09);
        roar.frequency.exponentialRampToValueAtTime(Math.max(36, frequency / 6), start + duration * .95);
        noiseBurst(start, duration * .75, .055, "lowpass", 420);
        break;
      }
      case "elephant": {
        const trumpet = tone("sawtooth", Math.max(110, frequency * .7), start, duration * .8, .065);
        trumpet.frequency.exponentialRampToValueAtTime(Math.max(190, frequency * 1.35), start + duration * .55);
        break;
      }
      case "bee":
        tone("sawtooth", 190 + frequency * .18, start, duration * .85, .045);
        tone("square", 235 + frequency * .12, start, duration * .8, .022);
        break;
      case "owl":
        tone("sine", Math.max(105, frequency / 2), start, duration * .5, .07);
        tone("sine", Math.max(85, frequency / 2.6), start + .18, duration * .48, .06);
        break;
      case "bird": {
        const chirp = tone("sine", frequency * 2.2, start, duration * .28, .055);
        chirp.frequency.exponentialRampToValueAtTime(frequency * 3.3, start + duration * .14);
        chirp.frequency.exponentialRampToValueAtTime(frequency * 2.55, start + duration * .28);
        break;
      }
      case "wolf": {
        const howl = tone("sine", frequency * .55, start, duration * 1.35, .065);
        howl.frequency.exponentialRampToValueAtTime(frequency * .95, start + duration * .7);
        howl.frequency.exponentialRampToValueAtTime(frequency * .72, start + duration * 1.35);
        break;
      }
      case "dolphin": {
        const whistle = tone("sine", frequency * 3, start, duration * .5, .05);
        whistle.frequency.exponentialRampToValueAtTime(frequency * 5.5, start + duration * .22);
        whistle.frequency.exponentialRampToValueAtTime(frequency * 3.8, start + duration * .5);
        break;
      }
      case "whale":
        tone("sine", Math.max(45, frequency / 5), start, duration * 1.8, .085);
        tone("sine", Math.max(70, frequency / 3.5), start + .12, duration * 1.5, .035);
        break;

      case "train":
        tone("square", 85, start, .11, .075);
        tone("square", 85, start + .16, .11, .065);
        noiseBurst(start, duration * .5, .035, "lowpass", 900);
        break;
      case "helicopter":
        noiseBurst(start, duration * .75, .055, "lowpass", 700);
        tone("square", 42, start, duration * .75, .045);
        break;
      case "rocket": {
        const launch = tone("sawtooth", 55, start, duration * 1.2, .055);
        launch.frequency.exponentialRampToValueAtTime(260, start + duration * 1.2);
        noiseBurst(start, duration, .06, "highpass", 1200);
        break;
      }
      case "clock":
        tone("square", 880, start, .08, .055);
        tone("square", 880, start + .13, .08, .045);
        break;
      case "bell":
        tone("sine", frequency * 2, start, duration * 1.5, .07);
        tone("sine", frequency * 3.01, start, duration * 1.25, .035);
        tone("sine", frequency * 4.1, start, duration, .018);
        break;

      case "guitar":
        tone("triangle", frequency, start, duration * .9, .065);
        tone("sine", frequency * 2, start + .008, duration * .6, .025);
        noiseBurst(start, .025, .018, "highpass", 2600);
        break;
      case "piano":
        tone("triangle", frequency, start, duration * 1.05, .07);
        tone("sine", frequency * 2, start, duration * .65, .03);
        tone("sine", frequency * 3, start, duration * .4, .015);
        break;
      case "sax":
        tone("sawtooth", frequency, start, duration * .9, .05);
        tone("square", frequency * 2, start, duration * .72, .018);
        break;
      case "brass":
        tone("sawtooth", frequency, start, duration * .82, .065);
        tone("triangle", frequency * 2, start, duration * .7, .03);
        break;
      case "violin":
        tone("sawtooth", frequency, start, duration * 1.15, .045);
        tone("triangle", frequency * 2, start, duration * 1.05, .02);
        break;
      case "snare":
        noiseBurst(start, .14, .11, "highpass", 1200);
        tone("triangle", 175, start, .1, .045);
        break;

      case "ghost": {
        const wail = tone("sine", frequency * .7, start, duration * 1.25, .055);
        wail.frequency.exponentialRampToValueAtTime(frequency * 1.25, start + duration * .55);
        wail.frequency.exponentialRampToValueAtTime(frequency * .62, start + duration * 1.25);
        break;
      }
      case "robot":
        tone("square", frequency * 1.5, start, .12, .055);
        tone("square", frequency * 2.25, start + .1, .1, .04);
        tone("square", frequency * 1.1, start + .2, .12, .035);
        break;
      case "water":
        tone("sine", frequency * 2.8, start, duration * .35, .04);
        tone("sine", frequency * 1.4, start + .08, duration * .45, .025);
        break;
      case "fire":
        noiseBurst(start, duration * .75, .065, "bandpass", 1500);
        noiseBurst(start + .08, duration * .45, .035, "highpass", 2800);
        break;
      default:
        tone("sine", frequency, start, duration, .07);
    }
    activeMixMultiplier = previousMixMultiplier;
    activeMixPan = previousMixPan;
    activeMixFilter = previousMixFilter;
    activeMixDelay = previousMixDelay;
  }

  function renderInstrumentMixer() {
    const mixer = $("#instrumentMixer");
    mixer.innerHTML = "";
    INSTRUMENTS.forEach((instrument) => {
      const mix = instrumentMix[instrument.id] || {
        volume: 1, mute: false, solo: false, pan: 0, filter: 0, delay: 0
      };
      const channel = document.createElement("div");
      channel.className = "mixer-channel";

      const label = document.createElement("div");
      label.className = "mixer-channel-label";
      label.innerHTML = '<span class="emoji">' + instrument.emoji + '</span><span>' + instrument.name + "</span>";

      const volumeWrap = document.createElement("label");
      volumeWrap.className = "mixer-control";
      volumeWrap.textContent = "Volume";
      const volume = document.createElement("input");
      volume.type = "range";
      volume.min = "0";
      volume.max = "100";
      volume.value = String(Math.round(Math.max(0, Math.min(1, Number(mix.volume) || 0)) * 100));
      volume.setAttribute("aria-label", instrument.name + " volume");
      const volumeOut = document.createElement("output");
      volumeOut.textContent = volume.value + "%";
      volume.addEventListener("input", () => {
        instrumentMix[instrument.id].volume = Number(volume.value) / 100;
        volumeOut.textContent = volume.value + "%";
      });
      volumeWrap.append(volume, volumeOut);

      const panWrap = document.createElement("label");
      panWrap.className = "mixer-control";
      panWrap.textContent = "Pan";
      const pan = document.createElement("input");
      pan.type = "range";
      pan.min = "-100";
      pan.max = "100";
      pan.value = String(Math.round(Math.max(-1, Math.min(1, Number(mix.pan) || 0)) * 100));
      pan.setAttribute("aria-label", instrument.name + " pan");
      const panOut = document.createElement("output");
      const panLabel = () => pan.value === "0"
        ? "Center"
        : (Number(pan.value) < 0 ? "L " + Math.abs(Number(pan.value)) : "R " + pan.value);
      panOut.textContent = panLabel();
      pan.addEventListener("input", () => {
        instrumentMix[instrument.id].pan = Number(pan.value) / 100;
        panOut.textContent = panLabel();
      });
      panWrap.append(pan, panOut);

      const buttons = document.createElement("div");
      buttons.className = "mixer-buttons";

      const solo = document.createElement("button");
      solo.type = "button";
      solo.className = "solo-button" + (mix.solo ? " active" : "");
      solo.textContent = mix.solo ? "Soloed" : "Solo";
      solo.addEventListener("click", () => {
        instrumentMix[instrument.id].solo = !instrumentMix[instrument.id].solo;
        renderInstrumentMixer();
      });

      const mute = document.createElement("button");
      mute.type = "button";
      mute.className = "mute-button" + (mix.mute ? " active" : "");
      mute.textContent = mix.mute ? "Muted" : "Mute";
      mute.addEventListener("click", () => {
        instrumentMix[instrument.id].mute = !instrumentMix[instrument.id].mute;
        renderInstrumentMixer();
      });

      buttons.append(solo, mute);

      const effects = document.createElement("div");
      effects.className = "mixer-effect-row";

      const makeEffect = (name, field) => {
        const wrap = document.createElement("label");
        wrap.className = "mixer-effect";
        const title = document.createElement("span");
        title.textContent = name;
        const input = document.createElement("input");
        input.type = "range";
        input.min = "0";
        input.max = "100";
        input.value = String(Math.round(Math.max(0, Math.min(1, Number(mix[field]) || 0)) * 100));
        input.setAttribute("aria-label", instrument.name + " " + name.toLowerCase());
        const out = document.createElement("output");
        out.textContent = input.value + "%";
        input.addEventListener("input", () => {
          instrumentMix[instrument.id][field] = Number(input.value) / 100;
          out.textContent = input.value + "%";
        });
        wrap.append(title, input, out);
        return wrap;
      };

      effects.append(makeEffect("Tone", "filter"), makeEffect("Echo", "delay"));
      channel.append(label, volumeWrap, panWrap, buttons, effects);
      mixer.appendChild(channel);
    });
  }

  function renderInstrumentBank() {
    const bank = $("#instrumentBank");
    bank.innerHTML = "";

    if (!sectionPaletteAllows(selectedInstrument)) {
      const firstAllowed = INSTRUMENTS.find((instrument) => sectionPaletteAllows(instrument.id));
      if (firstAllowed) selectedInstrument = firstAllowed.id;
    }

    INSTRUMENTS.forEach((instrument) => {
      const allowed = sectionPaletteAllows(instrument.id);
      const button = document.createElement("button");
      button.type = "button";
      button.disabled = !allowed;
      button.className = "instrument-button" +
        (instrument.id === selectedInstrument ? " active" : "") +
        (!allowed ? " section-disabled" : "");
      button.innerHTML = '<span class="emoji">' + instrument.emoji + '</span><span class="instrument-name">' + instrument.name + '</span>';
      button.setAttribute("aria-label", instrument.name);
      button.title = instrument.name;
      button.addEventListener("click", () => {
        if (!sectionPaletteAllows(instrument.id)) return;
        selectedInstrument = instrument.id;
        renderInstrumentBank();
        playInstrument(instrument.id, 440, .22);
      });
      bank.appendChild(button);
    });
  }

  function renderSectionSoundSettings() {
    const palette = $("#sectionInstrumentPalette");
    if (!palette) return;
    palette.innerHTML = "";
    const configured = sectionInstrumentPalettes[selectedSection];

    INSTRUMENTS.forEach((instrument) => {
      const active = !Array.isArray(configured) || configured.includes(instrument.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "section-palette-chip" + (active ? " active" : "");
      button.innerHTML = '<span class="emoji">' + instrument.emoji + "</span>" + instrument.name;
      button.setAttribute("aria-pressed", String(active));
      button.addEventListener("click", () => {
        pushMusicHistory();
        let next = Array.isArray(sectionInstrumentPalettes[selectedSection])
          ? sectionInstrumentPalettes[selectedSection].slice()
          : INSTRUMENTS.map((item) => item.id);

        if (next.includes(instrument.id)) {
          if (next.length <= 1) return toast("A section palette needs at least one instrument");
          next = next.filter((id) => id !== instrument.id);
        } else {
          next.push(instrument.id);
        }
        sectionInstrumentPalettes[selectedSection] = next;
        renderSectionSoundSettings();
        renderInstrumentBank();
      });
      palette.appendChild(button);
    });

    const snapshot = sectionMixerSnapshots[selectedSection];
    $("#sectionMixStatus").textContent = snapshot ? "Snapshot active for this section" : "Using global mixer";
    $("#recallSectionMixBtn").disabled = !snapshot;
    $("#clearSectionMixBtn").disabled = !snapshot;
  }

  $("#sectionPaletteAllBtn").addEventListener("click", () => {
    pushMusicHistory();
    sectionInstrumentPalettes[selectedSection] = null;
    renderSectionSoundSettings();
    renderInstrumentBank();
  });

  $("#saveSectionMixBtn").addEventListener("click", () => {
    pushMusicHistory();
    sectionMixerSnapshots[selectedSection] = deepClone(instrumentMix);
    renderSectionSoundSettings();
    renderSectionBar();
    toast("Mixer snapshot saved for section");
  });

  $("#recallSectionMixBtn").addEventListener("click", () => {
    const snapshot = sectionMixerSnapshots[selectedSection];
    if (!snapshot) return;
    pushMusicHistory();
    instrumentMix = deepClone(snapshot);
    renderInstrumentMixer();
    toast("Section mixer recalled");
  });

  $("#clearSectionMixBtn").addEventListener("click", () => {
    if (!sectionMixerSnapshots[selectedSection]) return;
    pushMusicHistory();
    sectionMixerSnapshots[selectedSection] = null;
    renderSectionSoundSettings();
    renderSectionBar();
    toast("Section mixer snapshot cleared");
  });

  function noteCountAtStep(step) {
    let count = 0;
    for (let row = 0; row < PITCHES.length; row += 1) {
      if (sequence[row][step]) count += 1;
    }
    return count;
  }

  function pushMusicHistory() {
    musicHistory.push({
      sequence: deepClone(sequence),
      endStep: songEndStep,
      timeSignature,
      loopMusic,
      sectionNames: sectionNames.slice(),
      sectionTempoOverrides: sectionTempoOverrides.slice(),
      sectionInstrumentPalettes: deepClone(sectionInstrumentPalettes),
      sectionMixerSnapshots: deepClone(sectionMixerSnapshots),
      percussionPattern: deepClone(percussionPattern),
      humanizeMs,
      instrumentMix: deepClone(instrumentMix)
    });
    if (musicHistory.length > MAX_UNDO) musicHistory.shift();
  }

  function updateComposerButtons() {
    $("#loopMusicBtn").classList.toggle("active", loopMusic);
    $("#loopMusicBtn").setAttribute("aria-pressed", String(loopMusic));
    $$(".time-button").forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.time) === timeSignature);
    });
    $("#endMarkerBtn").classList.toggle("active", endMarkerMode);
    $("#endMarkerHelp").hidden = !endMarkerMode;
    $("#endMarkerReadout").textContent = "End: beat " + songEndStep;
  }

  function sectionStart(index = selectedSection) {
    return Math.max(0, Math.min(SECTION_COUNT - 1, index)) * SECTION_LENGTH;
  }

  function syncSectionTempoUi() {
    const override = sectionTempoOverrides[selectedSection];
    const enabled = Number(override) >= 40;
    const value = enabled ? Number(override) : Number($("#tempoSlider").value);
    $("#sectionTempoToggle").checked = enabled;
    $("#sectionTempoSlider").disabled = !enabled;
    $("#sectionTempoSlider").value = value;
    $("#sectionTempoOut").textContent = enabled ? value + " BPM" : "Global " + $("#tempoSlider").value;
  }

  function renderSectionBar() {
    const bar = $("#sectionBar");
    bar.innerHTML = "";
    for (let index = 0; index < SECTION_COUNT; index += 1) {
      const start = sectionStart(index);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "section-button" + (index === selectedSection ? " active" : "");

      const title = document.createElement("strong");
      title.textContent = sectionNames[index] || ("Section " + String.fromCharCode(65 + index));
      const beats = document.createElement("span");
      beats.textContent = "beats " + (start + 1) + "–" + (start + SECTION_LENGTH);
      button.append(title, beats);

      if (Number(sectionTempoOverrides[index]) >= 40) {
        const tempo = document.createElement("span");
        tempo.className = "tempo-badge";
        tempo.textContent = sectionTempoOverrides[index] + " BPM";
        button.appendChild(tempo);
      }

      button.addEventListener("click", () => {
        selectedSection = index;
        measureEditStep = start;
        $("#sectionNameInput").value = sectionNames[index];
        renderSectionBar();
        renderPercussionGrid();
        syncSectionTempoUi();
        if (mobileSectionComposer()) renderSequencer();
        refreshSectionSelection();
        refreshMeasureSelection();
        const header = $('.seq-step[data-step="' + start + '"]');
        if (header) header.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      });
      bar.appendChild(button);
    }

    $("#sectionNameInput").value = sectionNames[selectedSection];
    $("#moveSectionLeftBtn").disabled = selectedSection === 0;
    $("#moveSectionRightBtn").disabled = selectedSection === SECTION_COUNT - 1;
    $("#duplicateSectionBtn").disabled = selectedSection === SECTION_COUNT - 1;
    $("#variationSectionBtn").disabled = selectedSection === SECTION_COUNT - 1;
    syncSectionTempoUi();
    renderSectionSoundSettings();
    renderInstrumentBank();
    renderArrangementOverview();
  }

  function refreshSectionSelection() {
    const start = sectionStart();
    const end = start + SECTION_LENGTH;
    $$("#sequencer [data-step]").forEach((el) => {
      const step = Number(el.dataset.step);
      el.classList.toggle("section-selected", step >= start && step < end);
      el.classList.toggle("section-boundary", step % SECTION_LENGTH === 0);
    });
  }

  function copySectionData(index) {
    const start = sectionStart(index);
    return {
      rows: sequence.map((row) => row.slice(start, start + SECTION_LENGTH)),
      percussion: percussionPattern.map((lane) => lane.slice(start, start + SECTION_LENGTH)),
      tempo: sectionTempoOverrides[index],
      palette: deepClone(sectionInstrumentPalettes[index]),
      mixerSnapshot: deepClone(sectionMixerSnapshots[index]),
      name: sectionNames[index]
    };
  }

  function pasteSectionData(index, data) {
    const start = sectionStart(index);
    const rows = data && data.rows ? data.rows : data;
    for (let row = 0; row < PITCHES.length; row += 1) {
      for (let offset = 0; offset < SECTION_LENGTH; offset += 1) {
        sequence[row][start + offset] = (rows && rows[row] && rows[row][offset]) || null;
      }
    }
    if (data && data.percussion) {
      for (let lane = 0; lane < PERCUSSION_LANES.length; lane += 1) {
        for (let offset = 0; offset < SECTION_LENGTH; offset += 1) {
          percussionPattern[lane][start + offset] = Boolean(data.percussion[lane] && data.percussion[lane][offset]);
        }
      }
    }
    if (data && Object.prototype.hasOwnProperty.call(data, "tempo")) {
      sectionTempoOverrides[index] = data.tempo == null ? null : Number(data.tempo);
    }
    if (data && Object.prototype.hasOwnProperty.call(data, "palette")) {
      sectionInstrumentPalettes[index] = Array.isArray(data.palette) ? data.palette.filter((id) => instrumentById(id)) : null;
    }
    if (data && Object.prototype.hasOwnProperty.call(data, "mixerSnapshot")) {
      sectionMixerSnapshots[index] = normalizeMixerSnapshot(data.mixerSnapshot);
    }
  }

  function swapSections(a, b) {
    if (a === b || a < 0 || b < 0 || a >= SECTION_COUNT || b >= SECTION_COUNT) return;
    const aData = copySectionData(a);
    const bData = copySectionData(b);
    pasteSectionData(a, bData);
    pasteSectionData(b, aData);
    sectionNames[a] = bData.name;
    sectionNames[b] = aData.name;
  }

  $("#sectionNameInput").addEventListener("input", (event) => {
    sectionNames[selectedSection] = (event.target.value || ("Section " + String.fromCharCode(65 + selectedSection))).slice(0, 16);
    renderSectionBar();
  });

  $("#copySectionBtn").addEventListener("click", () => {
    sectionClipboard = deepClone(copySectionData(selectedSection));
    $("#pasteSectionBtn").disabled = false;
    toast("Section copied");
  });

  $("#pasteSectionBtn").addEventListener("click", () => {
    if (!sectionClipboard) return;
    pushMusicHistory();
    pasteSectionData(selectedSection, sectionClipboard);
    if (sectionClipboard.name) sectionNames[selectedSection] = sectionClipboard.name.slice(0, 16);
    renderSectionBar();
    renderPercussionGrid();
    renderSequencer();
    toast("Section pasted");
  });

  $("#duplicateSectionBtn").addEventListener("click", () => {
    if (selectedSection >= SECTION_COUNT - 1) return;
    pushMusicHistory();
    const target = selectedSection + 1;
    const copy = copySectionData(selectedSection);
    pasteSectionData(target, copy);
    sectionNames[target] = (sectionNames[selectedSection] + " Copy").slice(0, 16);
    selectedSection = target;
    measureEditStep = sectionStart(target);
    renderSectionBar();
    renderPercussionGrid();
    renderSequencer();
    toast("Section duplicated");
  });

  $("#moveSectionLeftBtn").addEventListener("click", () => {
    if (selectedSection <= 0) return;
    pushMusicHistory();
    swapSections(selectedSection, selectedSection - 1);
    selectedSection -= 1;
    measureEditStep = sectionStart();
    renderSectionBar();
    renderPercussionGrid();
    renderSequencer();
  });

  $("#moveSectionRightBtn").addEventListener("click", () => {
    if (selectedSection >= SECTION_COUNT - 1) return;
    pushMusicHistory();
    swapSections(selectedSection, selectedSection + 1);
    selectedSection += 1;
    measureEditStep = sectionStart();
    renderSectionBar();
    renderPercussionGrid();
    renderSequencer();
  });

  $("#clearSectionBtn").addEventListener("click", () => {
    pushMusicHistory();
    pasteSectionData(selectedSection, {
      rows: Array.from({ length: PITCHES.length }, () => Array(SECTION_LENGTH).fill(null)),
      percussion: Array.from({ length: PERCUSSION_LANES.length }, () => Array(SECTION_LENGTH).fill(false)),
      tempo: sectionTempoOverrides[selectedSection],
      palette: deepClone(sectionInstrumentPalettes[selectedSection]),
      mixerSnapshot: deepClone(sectionMixerSnapshots[selectedSection])
    });
    renderPercussionGrid();
    renderSequencer();
    toast("Section cleared");
  });

  $("#sectionTempoToggle").addEventListener("change", (event) => {
    pushMusicHistory();
    sectionTempoOverrides[selectedSection] = event.target.checked
      ? Number($("#tempoSlider").value)
      : null;
    renderSectionBar();
  });

  $("#sectionTempoSlider").addEventListener("input", (event) => {
    sectionTempoOverrides[selectedSection] = Number(event.target.value);
    $("#sectionTempoOut").textContent = event.target.value + " BPM";
    renderSectionBar();
  });

  $("#variationSectionBtn").addEventListener("click", () => {
    if (selectedSection >= SECTION_COUNT - 1) return;
    pushMusicHistory();
    const source = copySectionData(selectedSection);
    const target = selectedSection + 1;
    pasteSectionData(target, source);
    sectionNames[target] = (sectionNames[selectedSection] + " Var").slice(0, 16);

    const start = sectionStart(target);
    for (let step = start; step < start + SECTION_LENGTH; step += 1) {
      if (Math.random() < .22) {
        const occupied = [];
        for (let row = 0; row < PITCHES.length; row += 1) {
          if (sequence[row][step]) occupied.push(row);
        }
        if (occupied.length && Math.random() < .65) {
          const row = occupied[Math.floor(Math.random() * occupied.length)];
          const id = sequence[row][step];
          const direction = Math.random() < .5 ? -1 : 1;
          const nextRow = Math.max(0, Math.min(PITCHES.length - 1, row + direction));
          if (!sequence[nextRow][step]) {
            sequence[row][step] = null;
            sequence[nextRow][step] = id;
          }
        }
      }
    }

    for (let lane = 0; lane < PERCUSSION_LANES.length; lane += 1) {
      for (let offset = 0; offset < SECTION_LENGTH; offset += 1) {
        if (Math.random() < .09) {
          percussionPattern[lane][start + offset] = !percussionPattern[lane][start + offset];
        }
      }
    }

    selectedSection = target;
    measureEditStep = start;
    renderSectionBar();
    renderPercussionGrid();
    renderSequencer();
    toast("Variation created");
  });

  function renderPercussionGrid() {
    const grid = $("#percussionGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const corner = document.createElement("div");
    corner.className = "percussion-label";
    corner.textContent = "Lane";
    grid.appendChild(corner);

    for (let offset = 0; offset < SECTION_LENGTH; offset += 1) {
      const header = document.createElement("div");
      header.className = "percussion-step";
      header.textContent = offset + 1;
      grid.appendChild(header);
    }

    const start = sectionStart();
    PERCUSSION_LANES.forEach((lane, laneIndex) => {
      const label = document.createElement("div");
      label.className = "percussion-label";
      label.textContent = lane.emoji + " " + lane.name;
      grid.appendChild(label);

      for (let offset = 0; offset < SECTION_LENGTH; offset += 1) {
        const step = start + offset;
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "percussion-cell" +
          (percussionPattern[laneIndex][step] ? " active" : "") +
          (offset % timeSignature === 0 ? " measure" : "");
        cell.dataset.lane = laneIndex;
        cell.dataset.step = step;
        cell.textContent = percussionPattern[laneIndex][step] ? lane.emoji : "";
        cell.setAttribute("aria-label", lane.name + ", beat " + (step + 1));
        cell.addEventListener("click", () => {
          pushMusicHistory();
          percussionPattern[laneIndex][step] = !percussionPattern[laneIndex][step];
          renderPercussionGrid();
          if (percussionPattern[laneIndex][step]) {
            playInstrument(lane.instrument, noteToFrequency(lane.pitch), .22);
          }
        });
        grid.appendChild(cell);
      }
    });
    renderArrangementOverview();
  }

  function applyDrumPreset(name) {
    const start = sectionStart();
    for (let lane = 0; lane < PERCUSSION_LANES.length; lane += 1) {
      for (let offset = 0; offset < SECTION_LENGTH; offset += 1) {
        percussionPattern[lane][start + offset] = false;
      }
    }

    for (let offset = 0; offset < SECTION_LENGTH; offset += 1) {
      const beat = offset % Math.max(1, timeSignature);
      if (name === "four") {
        percussionPattern[0][start + offset] = true;
        if (beat === 1 || beat === 3) percussionPattern[1][start + offset] = true;
      } else if (name === "backbeat") {
        if (beat === 0) percussionPattern[0][start + offset] = true;
        if (beat === 1 || beat === 3) percussionPattern[1][start + offset] = true;
        if (offset % 2 === 1) percussionPattern[2][start + offset] = true;
      } else if (name === "bounce") {
        if (offset % 2 === 0) percussionPattern[0][start + offset] = true;
        if (offset % 4 === 2) percussionPattern[1][start + offset] = true;
        if (offset % 3 === 1) percussionPattern[2][start + offset] = true;
        if (offset % 6 === 5) percussionPattern[3][start + offset] = true;
      } else {
        if (offset % Math.max(2, timeSignature) === 0) percussionPattern[0][start + offset] = true;
        if (offset % 8 === 4) percussionPattern[1][start + offset] = true;
      }
    }
  }

  $("#applyDrumPresetBtn").addEventListener("click", () => {
    pushMusicHistory();
    applyDrumPreset($("#drumPresetSelect").value);
    renderPercussionGrid();
    toast("Percussion preset applied");
  });

  $("#clearDrumsBtn").addEventListener("click", () => {
    pushMusicHistory();
    const start = sectionStart();
    for (let lane = 0; lane < PERCUSSION_LANES.length; lane += 1) {
      for (let offset = 0; offset < SECTION_LENGTH; offset += 1) {
        percussionPattern[lane][start + offset] = false;
      }
    }
    renderPercussionGrid();
  });

  $("#randomDensity").addEventListener("input", (event) => {
    $("#randomDensityOut").textContent = event.target.value + "%";
  });

  $("#humanizeSlider").addEventListener("input", (event) => {
    humanizeMs = Number(event.target.value);
    $("#humanizeOut").textContent = event.target.value + " ms";
  });

  $("#randomizeSectionBtn").addEventListener("click", () => {
    pushMusicHistory();
    const density = Number($("#randomDensity").value) / 100;
    const allowed = new Set(SCALE_GUIDES[scaleAssist] || SCALE_GUIDES.all);
    const rows = PITCHES.map((pitch, row) => ({ pitch, row }))
      .filter((entry) => allowed.has(noteClass(entry.pitch)));
    const start = sectionStart();
    const end = Math.min(songEndStep, start + SECTION_LENGTH);
    let added = 0;

    for (let step = start; step < end; step += 1) {
      if (Math.random() > density || noteCountAtStep(step) >= MAX_LAYERS || !rows.length) continue;
      const pick = rows[Math.floor(Math.random() * rows.length)];
      if (!sequence[pick.row][step]) {
        sequence[pick.row][step] = selectedInstrument;
        added += 1;
      }
    }
    renderSequencer();
    toast(added ? "Random melody added" : "No notes added");
  });

  function currentMeasureStart() {
    return Math.floor(Math.max(0, measureEditStep) / timeSignature) * timeSignature;
  }

  function refreshMeasureSelection() {
    const start = currentMeasureStart();
    const end = Math.min(SEQ_STEPS, start + timeSignature);
    $$("#sequencer [data-step]").forEach((el) => {
      const step = Number(el.dataset.step);
      el.classList.toggle("edit-measure", step >= start && step < end);
    });
    $("#measureReadout").textContent = "Measure " + (Math.floor(start / timeSignature) + 1) + " · beats " + (start + 1) + "–" + end;
  }

  function noteClass(note) {
    return String(note || "").charAt(0).toUpperCase();
  }

  function refreshScaleGuide() {
    const allowed = new Set(SCALE_GUIDES[scaleAssist] || SCALE_GUIDES.all);
    $("#sequencer").classList.toggle("note-paint-mode", notePaintMode);
    $$("#sequencer .seq-label").forEach((label) => {
      const active = allowed.has(noteClass(label.textContent));
      label.classList.toggle("scale-active", active && scaleAssist !== "all");
      label.classList.toggle("scale-muted", !active);
    });
    $$("#sequencer .seq-cell").forEach((cell) => {
      const row = Number(cell.dataset.row);
      const pitch = PITCHES[row];
      cell.classList.toggle("scale-muted", !allowed.has(noteClass(pitch)));
      cell.classList.toggle("note-paint-ready", notePaintMode);
    });
  }

  function setSequenceCell(row, step, mode, cell = null, audition = true) {
    if (row < 0 || row >= PITCHES.length || step < 0 || step >= songEndStep) return false;
    const old = sequence[row][step];

    if (mode === "paint") {
      if (old !== selectedInstrument && !old && noteCountAtStep(step) >= MAX_LAYERS) return false;
      sequence[row][step] = selectedInstrument;
    } else if (mode === "erase") {
      if (!old) return false;
      sequence[row][step] = null;
    } else {
      sequence[row][step] = old === selectedInstrument ? null : selectedInstrument;
    }

    const target = cell || $('.seq-cell[data-row="' + row + '"][data-step="' + step + '"]');
    const chosen = sequence[row][step];
    if (target) {
      const instrument = chosen ? instrumentById(chosen) : null;
      target.textContent = instrument ? instrument.emoji : "";
      target.setAttribute(
        "aria-label",
        PITCHES[row] + ", beat " + (step + 1) + (instrument ? ", " + instrument.name : ", empty")
      );
    }
    if (audition && chosen) playInstrument(chosen, noteToFrequency(PITCHES[row]), .18);
    renderArrangementOverview();
    return true;
  }

  function setupNotePaintEvents() {
    const sequencer = $("#sequencer");

    sequencer.addEventListener("pointerdown", (event) => {
      if (!notePaintMode) return;
      const cell = event.target.closest(".seq-cell");
      if (!cell || !sequencer.contains(cell)) return;
      event.preventDefault();

      const row = Number(cell.dataset.row);
      const step = Number(cell.dataset.step);
      if (step >= songEndStep) return toast("Move the end marker later to use this beat");

      notePaintDragging = true;
      notePaintPointerId = event.pointerId;
      notePaintLastKey = row + ":" + step;
      notePaintAction = sequence[row][step] === selectedInstrument ? "erase" : "paint";
      pushMusicHistory();
      setSequenceCell(row, step, notePaintAction, cell);
      suppressNotePaintClick = true;

      if (typeof sequencer.setPointerCapture === "function") {
        try { sequencer.setPointerCapture(event.pointerId); } catch (error) {}
      }
    });

    sequencer.addEventListener("pointermove", (event) => {
      if (!notePaintMode || !notePaintDragging || event.pointerId !== notePaintPointerId) return;
      event.preventDefault();
      const under = document.elementFromPoint(event.clientX, event.clientY);
      const cell = under && under.closest ? under.closest(".seq-cell") : null;
      if (!cell || !sequencer.contains(cell)) return;

      const row = Number(cell.dataset.row);
      const step = Number(cell.dataset.step);
      const key = row + ":" + step;
      if (key === notePaintLastKey || step >= songEndStep) return;
      notePaintLastKey = key;
      setSequenceCell(row, step, notePaintAction, cell, false);
    });

    const finish = (event) => {
      if (!notePaintDragging) return;
      notePaintDragging = false;
      notePaintPointerId = null;
      notePaintLastKey = "";
      setTimeout(() => { suppressNotePaintClick = false; }, 0);
      if (event && typeof sequencer.releasePointerCapture === "function") {
        try { sequencer.releasePointerCapture(event.pointerId); } catch (error) {}
      }
    };

    sequencer.addEventListener("pointerup", finish);
    sequencer.addEventListener("pointercancel", finish);
  }

  function placeHelperNote(note, step) {
    const row = PITCHES.indexOf(note);
    if (row < 0 || step < 0 || step >= songEndStep) return false;
    if (sequence[row][step]) return false;
    if (noteCountAtStep(step) >= MAX_LAYERS) return false;
    sequence[row][step] = selectedInstrument;
    return true;
  }

  function fillSelectedSectionProgression() {
    const progression = PROGRESSION_GUIDES[$("#progressionSelect").value] || PROGRESSION_GUIDES["I-V-vi-IV"];
    const style = $("#progressionStyleSelect").value;
    const start = sectionStart();
    const end = Math.min(songEndStep, start + SECTION_LENGTH);
    if (end <= start) return toast("This section is beyond the song end marker");

    pushMusicHistory();
    let added = 0;
    let measureIndex = 0;

    for (let beat = start; beat < end; beat += timeSignature) {
      const chordKey = progression[measureIndex % progression.length];
      let notes = (CHORD_GUIDES[chordKey] || []).slice();
      if (style === "down") notes.reverse();

      if (style === "block") {
        notes.forEach((note) => {
          if (placeHelperNote(note, beat)) added += 1;
        });
      } else {
        notes.forEach((note, offset) => {
          const step = beat + offset;
          if (step < Math.min(end, beat + timeSignature) && placeHelperNote(note, step)) added += 1;
        });
      }
      measureIndex += 1;
    }

    renderSequencer();
    toast(added ? "Progression added to section" : "No open note slots for progression");
  }

  function livePitchTrigger(pitch, button = null) {
    const row = PITCHES.indexOf(pitch);
    if (row < 0) return;

    if (button) {
      button.classList.add("active");
      setTimeout(() => button.classList.remove("active"), 120);
    }

    playInstrument(selectedInstrument, noteToFrequency(pitch), .32);

    if (!liveRecordEnabled) return;

    const step = isMusicPlaying
      ? Math.max(0, Math.min(songEndStep - 1, currentStep))
      : Math.max(0, Math.min(songEndStep - 1, measureEditStep));

    const existing = sequence[row][step];
    if (!existing && noteCountAtStep(step) >= MAX_LAYERS) {
      toast("Only 3 notes can play on one beat");
      return;
    }

    if (!liveRecordTakeStarted) {
      pushMusicHistory();
      liveRecordTakeStarted = true;
    }

    if (existing !== selectedInstrument) {
      sequence[row][step] = selectedInstrument;
      const cell = $('.seq-cell[data-row="' + row + '"][data-step="' + step + '"]');
      if (cell) {
        const instrument = instrumentById(selectedInstrument);
        cell.textContent = instrument ? instrument.emoji : "";
        cell.setAttribute("aria-label", pitch + ", beat " + (step + 1) + ", " + (instrument ? instrument.name : "note"));
      }
    }

    measureEditStep = step;
    selectedSection = Math.floor(step / SECTION_LENGTH);
    refreshMeasureSelection();
    refreshSectionSelection();
    renderSectionBar();
    renderPercussionGrid();
    renderArrangementOverview();
  }

  function renderLiveKeyboard() {
    const keyboard = $("#liveKeyboard");
    keyboard.innerHTML = "";
    const pitches = PITCHES.slice().reverse();

    pitches.forEach((pitch, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "live-key";
      button.dataset.pitch = pitch;
      button.innerHTML = pitch + "<span>" + LIVE_KEYBOARD_KEYS[index].toUpperCase() + "</span>";
      button.setAttribute("aria-label", "Play " + pitch);
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        livePitchTrigger(pitch, button);
      });
      keyboard.appendChild(button);
    });
  }

  $("#fillProgressionBtn").addEventListener("click", fillSelectedSectionProgression);

  $("#liveRecordBtn").addEventListener("click", () => {
    liveRecordEnabled = !liveRecordEnabled;
    liveRecordTakeStarted = false;
    $("#liveRecordBtn").classList.toggle("active", liveRecordEnabled);
    $("#liveRecordBtn").setAttribute("aria-pressed", String(liveRecordEnabled));
    $("#liveRecordBtn").textContent = liveRecordEnabled ? "⏺ Recording" : "⏺ Record off";
  });

  function mobileSectionComposer() {
    return window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
  }

  function applyComposerView(visibleSteps = SEQ_STEPS) {
    const sequencer = $("#sequencer");
    sequencer.classList.toggle("compact", composerCompact);
    sequencer.style.setProperty("--cell", composerCompact ? "30px" : composerZoom + "px");
    sequencer.style.setProperty("--visible-steps", String(visibleSteps));
    sequencer.style.gridTemplateColumns = (composerCompact ? "52px" : "66px") +
      " repeat(" + visibleSteps + ", var(--cell))";
    $("#composerZoom").value = composerZoom;
    $("#composerZoom").disabled = composerCompact;
    $("#composerZoomOut").textContent = composerCompact ? "Compact" : composerZoom + " px";
    $("#compactComposerToggle").checked = composerCompact;
  }

  function renderSequencer() {
    const sequencer = $("#sequencer");
    sequencer.innerHTML = "";
    const visibleStart = mobileSectionComposer() ? sectionStart() : 0;
    const visibleEnd = mobileSectionComposer()
      ? Math.min(SEQ_STEPS, visibleStart + SECTION_LENGTH)
      : SEQ_STEPS;
    applyComposerView(visibleEnd - visibleStart);

    const corner = document.createElement("div");
    corner.className = "seq-corner";
    sequencer.appendChild(corner);

    for (let step = visibleStart; step < visibleEnd; step += 1) {
      const header = document.createElement("button");
      header.type = "button";
      header.className = "seq-step" + (step % timeSignature === 0 ? " measure" : "") + (step === songEndStep - 1 ? " end-step" : "");
      header.textContent = step + 1;
      header.dataset.step = step;
      header.title = "Beat " + (step + 1);
      header.addEventListener("click", () => {
        if (!endMarkerMode) {
          measureEditStep = step;
          selectedSection = Math.floor(step / SECTION_LENGTH);
          renderSectionBar();
          renderPercussionGrid();
          refreshSectionSelection();
          refreshMeasureSelection();
          return;
        }
        pushMusicHistory();
        songEndStep = step + 1;
        endMarkerMode = false;
        updateComposerButtons();
        renderSequencer();
        toast("Song ends at beat " + songEndStep);
      });
      sequencer.appendChild(header);
    }

    PITCHES.forEach((pitch, row) => {
      const label = document.createElement("div");
      label.className = "seq-label";
      label.textContent = pitch;
      sequencer.appendChild(label);

      for (let step = visibleStart; step < visibleEnd; step += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "seq-cell" + (step % timeSignature === 0 ? " measure" : "") + ((row + 1) % 2 === 0 ? " staff-line" : "") + (step >= songEndStep ? " after-end" : "");
        cell.dataset.row = row;
        cell.dataset.step = step;
        const id = sequence[row][step];
        const instrument = id ? instrumentById(id) : null;
        cell.textContent = instrument ? instrument.emoji : "";
        cell.setAttribute("aria-label", pitch + ", beat " + (step + 1) + (instrument ? ", " + instrument.name : ", empty"));

        cell.addEventListener("click", () => {
          if (notePaintMode || suppressNotePaintClick) return;
          measureEditStep = step;
          selectedSection = Math.floor(step / SECTION_LENGTH);
          renderSectionBar();
          renderPercussionGrid();
          refreshSectionSelection();
          refreshMeasureSelection();
          if (step >= songEndStep) {
            toast("Move the end marker later to use this beat");
            return;
          }

          const old = sequence[row][step];
          if (!old && noteCountAtStep(step) >= MAX_LAYERS) {
            toast("Only 3 notes can play on one beat");
            return;
          }

          pushMusicHistory();
          setSequenceCell(row, step, "toggle", cell);
        });

        sequencer.appendChild(cell);
      }
    });

    highlightedStep = -1;
    refreshPlayhead(true);
    refreshSectionSelection();
    refreshMeasureSelection();
    refreshScaleGuide();
    renderArrangementOverview();
  }

  function refreshPlayhead(force = false) {
    const sequencer = $("#sequencer");
    if (highlightedStep >= 0) {
      $$('[data-step="' + highlightedStep + '"]', sequencer).forEach((el) => el.classList.remove("playing"));
    }
    if (isMusicPlaying || force) {
      $$('[data-step="' + currentStep + '"]', sequencer).forEach((el) => {
        if (isMusicPlaying) el.classList.add("playing");
      });
      highlightedStep = isMusicPlaying ? currentStep : -1;
    }

    const runner = $("#runner");
    if (mobileSectionComposer()) {
      const start = sectionStart();
      const local = Math.max(0, Math.min(SECTION_LENGTH - 1, currentStep - start));
      runner.style.left = "calc(" + ((local / Math.max(1, SECTION_LENGTH - 1)) * 100) + "% - 14px)";
    } else {
      const denom = Math.max(1, songEndStep - 1);
      runner.style.left = "calc(" + ((currentStep / denom) * 100) + "% - 14px)";
    }

    $$("#percussionGrid .percussion-cell").forEach((cell) => {
      cell.classList.toggle("playing", isMusicPlaying && Number(cell.dataset.step) === currentStep);
    });

    if (isMusicPlaying && currentStep % timeSignature === 0) {
      const header = $('.seq-step[data-step="' + currentStep + '"]', sequencer);
      if (header) header.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }

  function playStep(step) {
    if (mobileSectionComposer()) {
      const playbackSection = Math.max(0, Math.min(SECTION_COUNT - 1, Math.floor(step / SECTION_LENGTH)));
      if (playbackSection !== selectedSection) {
        selectedSection = playbackSection;
        measureEditStep = step;
        renderSectionBar();
        renderPercussionGrid();
        renderSequencer();
      }
    }
    updateSyncedAnimationForBeat(step);
    const bpm = effectiveTempoAtStep(step);
    const beatDuration = 60 / bpm;
    const ac = ensureAudio();
    const now = ac.currentTime + .01;
    const stepMixer = mixerForStep(step);
    $("#tempoReadout").textContent = bpm;

    PITCHES.forEach((pitch, row) => {
      const id = sequence[row][step];
      if (id) {
        const when = now + humanizeOffsetMs(row, step) / 1000;
        playInstrument(id, noteToFrequency(pitch), Math.min(.55, beatDuration * .82), when, stepMixer);
      }
    });

    PERCUSSION_LANES.forEach((lane, laneIndex) => {
      if (!percussionPattern[laneIndex][step]) return;
      const when = now + humanizeOffsetMs(PITCHES.length + laneIndex, step) / 1000;
      playInstrument(lane.instrument, noteToFrequency(lane.pitch), Math.min(.45, beatDuration * .72), when, stepMixer);
    });
  }

  function scheduleNextStep() {
    if (!isMusicPlaying) return;
    const delay = 60000 / effectiveTempoAtStep(currentStep);

    musicTimer = setTimeout(() => {
      const next = currentStep + 1;
      if (next >= playbackEndStep) {
        const shouldLoop = playbackMode === "section" ? sectionLoopEnabled : loopMusic;
        if (shouldLoop) {
          currentStep = playbackStartStep;
        } else {
          stopMusic();
          if (syncedAnimationPreview) stopFramePreview();
          return;
        }
      } else {
        currentStep = next;
      }
      playStep(currentStep);
      refreshPlayhead();
      scheduleNextStep();
    }, delay);
  }

  function startMusic(mode = "song") {
    if (isMusicPlaying) return;
    playbackMode = mode === "section" ? "section" : "song";
    playbackStartStep = playbackMode === "section" ? sectionStart() : 0;
    playbackEndStep = playbackMode === "section"
      ? Math.min(songEndStep, sectionStart() + SECTION_LENGTH)
      : songEndStep;

    if (playbackEndStep <= playbackStartStep) {
      toast("This section is beyond the song end marker");
      return;
    }

    currentStep = playbackStartStep;
    ensureAudio();
    isMusicPlaying = true;
    $("#playMusicBtn").textContent = playbackMode === "section" ? "▶ Section" : "▶ Playing";
    playStep(currentStep);
    refreshPlayhead();
    scheduleNextStep();
  }

  function stopMusic(fromAnimation = false) {
    isMusicPlaying = false;
    clearTimeout(musicTimer);
    musicTimer = null;
    currentStep = 0;
    $("#playMusicBtn").textContent = "▶ Play";
    $("#tempoReadout").textContent = $("#tempoSlider").value;
    refreshPlayhead();
    if (syncedAnimationPreview && !fromAnimation) {
      syncedAnimationPreview = false;
      previewTimer = null;
      $("#playFramesBtn").textContent = "▶ Preview";
      activeFrameIndex = Math.min(previewOrigin, frames.length - 1);
      syncFrameTimingUi();
      renderCanvas();
      renderFrameList();
    }
  }

  $("#musicToolsToggle").addEventListener("click", () => {
    const panel = $("#musicPanel");
    const open = !panel.classList.contains("show-advanced");
    panel.classList.toggle("show-advanced", open);
    $("#musicToolsToggle").setAttribute("aria-pressed", String(open));
    $("#musicToolsToggle").textContent = open ? "✕ Done" : "☰ Tools";
    if (open) {
      const firstAdvanced = $(".section-editor-head");
      if (firstAdvanced && window.innerWidth <= 640) {
        firstAdvanced.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  });

  $("#copyMeasureBtn").addEventListener("click", () => {
    const start = currentMeasureStart();
    measureClipboard = {
      length: timeSignature,
      rows: sequence.map((row) => row.slice(start, start + timeSignature))
    };
    $("#pasteMeasureBtn").disabled = false;
    toast("Measure copied");
  });

  $("#pasteMeasureBtn").addEventListener("click", () => {
    if (!measureClipboard) return;
    const start = currentMeasureStart();
    pushMusicHistory();
    for (let row = 0; row < PITCHES.length; row += 1) {
      for (let offset = 0; offset < timeSignature; offset += 1) {
        const step = start + offset;
        if (step >= SEQ_STEPS || step >= songEndStep) continue;
        sequence[row][step] = offset < measureClipboard.length
          ? (measureClipboard.rows[row][offset] || null)
          : null;
      }
    }
    renderSequencer();
    toast("Measure pasted");
  });

  $("#clearMeasureBtn").addEventListener("click", () => {
    const start = currentMeasureStart();
    pushMusicHistory();
    for (let row = 0; row < PITCHES.length; row += 1) {
      for (let offset = 0; offset < timeSignature; offset += 1) {
        const step = start + offset;
        if (step < SEQ_STEPS && step < songEndStep) sequence[row][step] = null;
      }
    }
    renderSequencer();
    toast("Measure cleared");
  });

  $("#playMusicBtn").addEventListener("click", () => {
    if (isMusicPlaying) stopMusic();
    else startMusic("song");
  });
  $("#stopMusicBtn").addEventListener("click", () => stopMusic());

  $("#playSectionBtn").addEventListener("click", () => {
    stopMusic();
    startMusic("section");
  });

  $("#loopSectionBtn").addEventListener("click", () => {
    sectionLoopEnabled = !sectionLoopEnabled;
    $("#loopSectionBtn").classList.toggle("active", sectionLoopEnabled);
    $("#loopSectionBtn").setAttribute("aria-pressed", String(sectionLoopEnabled));
  });

  $("#loopMusicBtn").addEventListener("click", () => {
    loopMusic = !loopMusic;
    updateComposerButtons();
  });

  $("#undoMusicBtn").addEventListener("click", () => {
    const previous = musicHistory.pop();
    if (!previous) return toast("Nothing to undo");
    stopMusic();
    sequence = previous.sequence;
    songEndStep = previous.endStep;
    timeSignature = previous.timeSignature;
    loopMusic = previous.loopMusic;
    if (Array.isArray(previous.sectionNames)) sectionNames = previous.sectionNames.slice(0, SECTION_COUNT);
    if (Array.isArray(previous.sectionTempoOverrides)) sectionTempoOverrides = previous.sectionTempoOverrides.slice(0, SECTION_COUNT);
    if (Array.isArray(previous.sectionInstrumentPalettes)) {
      sectionInstrumentPalettes = Array.from({ length: SECTION_COUNT }, (_, index) => {
        const value = previous.sectionInstrumentPalettes[index];
        return Array.isArray(value) ? value.filter((id) => instrumentById(id)) : null;
      });
    }
    if (Array.isArray(previous.sectionMixerSnapshots)) {
      sectionMixerSnapshots = Array.from({ length: SECTION_COUNT }, (_, index) =>
        normalizeMixerSnapshot(previous.sectionMixerSnapshots[index])
      );
    }
    if (Array.isArray(previous.percussionPattern)) percussionPattern = normalizePercussion(previous.percussionPattern);
    if (Number.isFinite(previous.humanizeMs)) humanizeMs = previous.humanizeMs;
    if (previous.instrumentMix) instrumentMix = deepClone(previous.instrumentMix);
    $("#humanizeSlider").value = humanizeMs;
    $("#humanizeOut").textContent = humanizeMs + " ms";
    renderSectionBar();
    renderPercussionGrid();
    renderInstrumentMixer();
    updateComposerButtons();
    renderSequencer();
  });

  $("#endMarkerBtn").addEventListener("click", () => {
    endMarkerMode = !endMarkerMode;
    updateComposerButtons();
  });

  $$(".time-button").forEach((button) => {
    button.addEventListener("click", () => {
      const next = Number(button.dataset.time);
      if (next === timeSignature) return;
      pushMusicHistory();
      timeSignature = next;
      updateComposerButtons();
      renderPercussionGrid();
      renderSequencer();
    });
  });

  $("#auditionBtn").addEventListener("click", () => {
    playInstrument(selectedInstrument, 440, .35);
  });

  $("#tempoSlider").addEventListener("input", (event) => {
    $("#tempoOut").textContent = event.target.value + " BPM";
    $("#tempoReadout").textContent = event.target.value;
    syncSectionTempoUi();
  });

  $("#scaleAssistSelect").addEventListener("change", (event) => {
    scaleAssist = event.target.value;
    refreshScaleGuide();
  });

  $("#insertChordBtn").addEventListener("click", () => {
    const notes = CHORD_GUIDES[$("#chordAssistSelect").value] || [];
    const step = Math.max(0, Math.min(songEndStep - 1, measureEditStep));
    if (!notes.length) return;

    pushMusicHistory();
    for (let row = 0; row < PITCHES.length; row += 1) sequence[row][step] = null;

    const ac = ensureAudio();
    const when = ac.currentTime + .02;
    notes.forEach((note) => {
      const row = PITCHES.indexOf(note);
      if (row < 0) return;
      sequence[row][step] = selectedInstrument;
      playInstrument(selectedInstrument, noteToFrequency(note), .38, when);
    });
    renderSequencer();
    toast("Chord inserted at beat " + (step + 1));
  });

  $("#notePaintToggle").addEventListener("change", (event) => {
    notePaintMode = event.target.checked;
    refreshScaleGuide();
  });

  $("#composerZoom").addEventListener("input", (event) => {
    composerZoom = Number(event.target.value);
    applyComposerView();
  });

  $("#compactComposerToggle").addEventListener("change", (event) => {
    composerCompact = event.target.checked;
    applyComposerView();
  });

  $("#jumpToSectionBtn").addEventListener("click", () => {
    const header = $('.seq-step[data-step="' + sectionStart() + '"]');
    if (header) header.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  });

  $("#clearMusicBtn").addEventListener("click", () => {
    pushMusicHistory();
    stopMusic();
    sequence = makeSequence();
    songEndStep = SEQ_STEPS;
    renderSequencer();
    updateComposerButtons();
    toast("Song cleared");
  });

  function putDemoNote(seq, beat, pitch, instrument) {
    const row = PITCHES.indexOf(pitch);
    if (row < 0 || beat < 0 || beat >= SEQ_STEPS) return;
    if (seq[row][beat]) return;
    if (seq.reduce((n, r) => n + (r[beat] ? 1 : 0), 0) >= MAX_LAYERS) return;
    seq[row][beat] = instrument;
  }

  function loadDemo(number) {
    pushMusicHistory();
    stopMusic();
    sequence = makeSequence();
    timeSignature = number === 2 ? 3 : 4;
    songEndStep = number === 1 ? 32 : number === 2 ? 36 : 40;
    loopMusic = true;

    if (number === 1) {
      const melody = ["C5", "E5", "G5", "E5", "D5", "F5", "G5", "F5"];
      for (let i = 0; i < songEndStep; i += 1) {
        putDemoNote(sequence, i, melody[i % melody.length], i % 2 ? "kalimba" : "star");
        if (i % 4 === 0) putDemoNote(sequence, i, "C4", "heart");
        if (i % 4 === 2) putDemoNote(sequence, i, "G4", "ship");
      }
      $("#songName").value = "Sparkle Walk";
    } else if (number === 2) {
      const melody = ["G4", "A4", "C5", "A4", "G4", "E4"];
      for (let i = 0; i < songEndStep; i += 1) {
        putDemoNote(sequence, i, melody[i % melody.length], i % 6 < 3 ? "cat" : "dog");
        if (i % 3 === 0) putDemoNote(sequence, i, "C4", "drum");
        if (i % 6 === 4) putDemoNote(sequence, i, "E4", "pig");
      }
      $("#songName").value = "Pet Parade";
    } else {
      const melody = ["C4", "G4", "C5", "E5", "D5", "A4", "F4", "G4"];
      for (let i = 0; i < songEndStep; i += 1) {
        putDemoNote(sequence, i, melody[i % melody.length], i % 4 < 2 ? "game" : "car");
        if (i % 4 === 0) putDemoNote(sequence, i, "C4", "heart");
        if (i % 8 === 6) putDemoNote(sequence, i, "G5", "lizard");
      }
      $("#songName").value = "Moon Hop";
    }

    updateComposerButtons();
    renderSequencer();
    toast("Demo loaded");
  }

  $$(".demo-song").forEach((button) => {
    button.addEventListener("click", () => loadDemo(Number(button.dataset.demo)));
  });

  function compactSongForShare() {
    const placements = [];
    sequence.forEach((row, rowIndex) => {
      row.slice(0, songEndStep).forEach((id, step) => {
        if (!id) return;
        const instrumentIndex = INSTRUMENTS.findIndex((instrument) => instrument.id === id);
        if (instrumentIndex >= 0) placements.push([rowIndex, step, instrumentIndex]);
      });
    });

    const mixer = INSTRUMENTS.map((instrument) => {
      const mix = instrumentMix[instrument.id] || {};
      return [
        Math.round((Number(mix.volume) || 0) * 100),
        mix.mute ? 1 : 0,
        mix.solo ? 1 : 0,
        Math.round((Number(mix.pan) || 0) * 100),
        Math.round((Number(mix.filter) || 0) * 100),
        Math.round((Number(mix.delay) || 0) * 100)
      ];
    });

    const percussion = [];
    percussionPattern.forEach((lane, laneIndex) => {
      lane.slice(0, songEndStep).forEach((active, step) => {
        if (active) percussion.push([laneIndex, step]);
      });
    });

    const compactPalettes = sectionInstrumentPalettes.map((palette) =>
      Array.isArray(palette)
        ? palette.map((id) => INSTRUMENTS.findIndex((instrument) => instrument.id === id)).filter((index) => index >= 0)
        : null
    );
    const compactSnapshots = sectionMixerSnapshots.map((snapshot) => {
      if (!snapshot) return null;
      return INSTRUMENTS.map((instrument) => {
        const mix = snapshot[instrument.id] || {};
        return [
          Math.round((Number(mix.volume) || 0) * 100),
          mix.mute ? 1 : 0,
          mix.solo ? 1 : 0,
          Math.round((Number(mix.pan) || 0) * 100),
          Math.round((Number(mix.filter) || 0) * 100),
          Math.round((Number(mix.delay) || 0) * 100)
        ];
      });
    });

    return {
      v: 3,
      n: ($("#songName").value || "My Emoji Song").slice(0, 40),
      t: Number($("#tempoSlider").value),
      m: timeSignature,
      e: songEndStep,
      l: loopMusic ? 1 : 0,
      sl: sectionLoopEnabled ? 1 : 0,
      s: sectionNames.slice(),
      st: sectionTempoOverrides.map((value) => value == null ? 0 : Number(value)),
      sp: compactPalettes,
      sm: compactSnapshots,
      h: humanizeMs,
      p: percussion,
      x: placements,
      z: mixer
    };
  }

  function songFromCompactShare(compact) {
    if (!compact || !Array.isArray(compact.x)) throw new Error("Invalid shared song");
    const sharedSequence = makeSequence();
    compact.x.forEach((entry) => {
      if (!Array.isArray(entry) || entry.length < 3) return;
      const row = Number(entry[0]);
      const step = Number(entry[1]);
      const instrument = INSTRUMENTS[Number(entry[2])];
      if (instrument && row >= 0 && row < PITCHES.length && step >= 0 && step < SEQ_STEPS) {
        sharedSequence[row][step] = instrument.id;
      }
    });

    const sharedPercussion = makePercussionPattern();
    if (Array.isArray(compact.p)) {
      compact.p.forEach((entry) => {
        if (!Array.isArray(entry) || entry.length < 2) return;
        const lane = Number(entry[0]);
        const step = Number(entry[1]);
        if (lane >= 0 && lane < PERCUSSION_LANES.length && step >= 0 && step < SEQ_STEPS) {
          sharedPercussion[lane][step] = true;
        }
      });
    }

    const mixer = {};
    INSTRUMENTS.forEach((instrument, index) => {
      const saved = Array.isArray(compact.z) ? compact.z[index] : null;
      mixer[instrument.id] = {
        volume: saved ? Math.max(0, Math.min(1, Number(saved[0]) / 100)) : 1,
        mute: Boolean(saved && saved[1]),
        solo: Boolean(saved && saved[2]),
        pan: saved ? Math.max(-1, Math.min(1, Number(saved[3]) / 100)) : 0,
        filter: saved ? Math.max(0, Math.min(1, Number(saved[4]) / 100)) : 0,
        delay: saved ? Math.max(0, Math.min(1, Number(saved[5]) / 100)) : 0
      };
    });

    return {
      format: "emojiro-paint-song",
      version: 8,
      name: String(compact.n || "Shared Emoji Song").slice(0, 40),
      tempo: Math.max(40, Math.min(480, Number(compact.t) || 120)),
      timeSignature: Number(compact.m) === 3 ? 3 : 4,
      endStep: Math.max(1, Math.min(SEQ_STEPS, Number(compact.e) || SEQ_STEPS)),
      loop: compact.l !== 0,
      sectionLoop: Boolean(compact.sl),
      sections: Array.isArray(compact.s) ? compact.s.slice(0, SECTION_COUNT) : undefined,
      sectionTempoOverrides: Array.isArray(compact.st)
        ? compact.st.slice(0, SECTION_COUNT).map((value) => Number(value) >= 40 ? Number(value) : null)
        : Array(SECTION_COUNT).fill(null),
      sectionInstrumentPalettes: Array.from({ length: SECTION_COUNT }, (_, section) => {
        const palette = Array.isArray(compact.sp) ? compact.sp[section] : null;
        return Array.isArray(palette)
          ? palette.map((index) => INSTRUMENTS[Number(index)]?.id).filter(Boolean)
          : null;
      }),
      sectionMixerSnapshots: Array.from({ length: SECTION_COUNT }, (_, section) => {
        const savedSnapshot = Array.isArray(compact.sm) ? compact.sm[section] : null;
        if (!Array.isArray(savedSnapshot)) return null;
        const snapshot = {};
        INSTRUMENTS.forEach((instrument, index) => {
          const saved = savedSnapshot[index] || [];
          snapshot[instrument.id] = {
            volume: Math.max(0, Math.min(1, Number(saved[0]) / 100 || 0)),
            mute: Boolean(saved[1]),
            solo: Boolean(saved[2]),
            pan: Math.max(-1, Math.min(1, Number(saved[3]) / 100 || 0)),
            filter: Math.max(0, Math.min(1, Number(saved[4]) / 100 || 0)),
            delay: Math.max(0, Math.min(1, Number(saved[5]) / 100 || 0))
          };
        });
        return snapshot;
      }),
      percussion: sharedPercussion,
      humanizeMs: Math.max(0, Math.min(60, Number(compact.h) || 0)),
      steps: SEQ_STEPS,
      mixer,
      sequence: sharedSequence
    };
  }

  async function sharedSongUrl() {
    const json = JSON.stringify(compactSongForShare());
    const url = new URL(location.href);
    const wantsCompression = $("#compactShareToggle").checked;

    if (wantsCompression) {
      const compressed = await gzipText(json);
      if (compressed && compressed.length < new TextEncoder().encode(json).length) {
        url.hash = "songz=" + bytesToBase64Url(compressed);
        return url.toString();
      }
    }

    url.hash = "song=" + encodeBase64Url(json);
    return url.toString();
  }

  async function loadSongFromHash() {
    const compressed = location.hash.startsWith("#songz=");
    const plain = location.hash.startsWith("#song=");
    if (!compressed && !plain) return false;

    try {
      let json;
      if (compressed) {
        json = await gunzipText(base64UrlToBytes(location.hash.slice(7)));
      } else {
        json = decodeBase64Url(location.hash.slice(6));
      }
      const compact = JSON.parse(json);
      applySong(songFromCompactShare(compact));
      toast(compressed ? "Compressed shared song loaded" : "Shared song loaded");
      return true;
    } catch (error) {
      toast("Shared song link could not be loaded");
      return false;
    }
  }

  function songPayload() {
    return {
      format: "emojiro-paint-song",
      version: 8,
      name: $("#songName").value || "My Emoji Song",
      tempo: Number($("#tempoSlider").value),
      timeSignature,
      endStep: songEndStep,
      loop: loopMusic,
      pitches: PITCHES,
      steps: SEQ_STEPS,
      maxLayersPerBeat: MAX_LAYERS,
      sections: sectionNames.slice(),
      sectionTempoOverrides: sectionTempoOverrides.slice(),
      sectionInstrumentPalettes: deepClone(sectionInstrumentPalettes),
      sectionMixerSnapshots: deepClone(sectionMixerSnapshots),
      percussion: percussionPattern,
      humanizeMs,
      sectionLoop: sectionLoopEnabled,
      view: {
        zoom: composerZoom,
        compact: composerCompact,
        scaleAssist,
        notePaintMode,
        videoPreset
      },
      mixer: instrumentMix,
      sequence
    };
  }

  function normalizeSequence(input) {
    const out = makeSequence();
    if (!Array.isArray(input)) return out;
    for (let row = 0; row < Math.min(PITCHES.length, input.length); row += 1) {
      if (!Array.isArray(input[row])) continue;
      for (let step = 0; step < Math.min(SEQ_STEPS, input[row].length); step += 1) {
        const value = input[row][step];
        if (value && instrumentById(value)) out[row][step] = value;
      }
    }
    return out;
  }

  function applySong(song) {
    if (!song || !Array.isArray(song.sequence)) throw new Error("Invalid song");
    stopMusic();
    musicHistory = [];
    sequence = normalizeSequence(song.sequence);
    $("#songName").value = song.name || "My Emoji Song";
    $("#tempoSlider").value = Math.max(40, Math.min(480, Number(song.tempo) || 120));
    timeSignature = Number(song.timeSignature) === 3 ? 3 : 4;
    songEndStep = Math.max(1, Math.min(SEQ_STEPS, Number(song.endStep) || Math.min(SEQ_STEPS, (song.steps || 32))));
    loopMusic = song.loop !== false;
    endMarkerMode = false;
    measureEditStep = 0;
    selectedSection = 0;
    sectionNames = Array.isArray(song.sections)
      ? Array.from({ length: SECTION_COUNT }, (_, index) => String(song.sections[index] || ("Section " + String.fromCharCode(65 + index))).slice(0, 16))
      : ["Section A", "Section B", "Section C", "Section D"];
    sectionTempoOverrides = Array.isArray(song.sectionTempoOverrides)
      ? Array.from({ length: SECTION_COUNT }, (_, index) => {
          const value = Number(song.sectionTempoOverrides[index]);
          return value >= 40 && value <= 480 ? value : null;
        })
      : Array(SECTION_COUNT).fill(null);
    sectionInstrumentPalettes = Array.from({ length: SECTION_COUNT }, (_, index) => {
      const value = Array.isArray(song.sectionInstrumentPalettes) ? song.sectionInstrumentPalettes[index] : null;
      return Array.isArray(value) ? value.filter((id) => instrumentById(id)) : null;
    });
    sectionMixerSnapshots = Array.from({ length: SECTION_COUNT }, (_, index) => {
      const value = Array.isArray(song.sectionMixerSnapshots) ? song.sectionMixerSnapshots[index] : null;
      return normalizeMixerSnapshot(value);
    });
    percussionPattern = normalizePercussion(song.percussion);
    humanizeMs = Math.max(0, Math.min(60, Number(song.humanizeMs) || 0));
    $("#humanizeSlider").value = humanizeMs;
    $("#humanizeOut").textContent = humanizeMs + " ms";
    if (song.mixer && typeof song.mixer === "object") {
      INSTRUMENTS.forEach((instrument) => {
        const saved = song.mixer[instrument.id];
        instrumentMix[instrument.id] = {
          volume: saved ? Math.max(0, Math.min(1, Number(saved.volume) || 0)) : 1,
          mute: Boolean(saved && saved.mute),
          solo: Boolean(saved && saved.solo),
          pan: saved ? Math.max(-1, Math.min(1, Number(saved.pan) || 0)) : 0,
          filter: saved ? Math.max(0, Math.min(1, Number(saved.filter) || 0)) : 0,
          delay: saved ? Math.max(0, Math.min(1, Number(saved.delay) || 0)) : 0
        };
      });
    } else {
      instrumentMix = Object.fromEntries(
        INSTRUMENTS.map((instrument) => [instrument.id, {
          volume: 1, mute: false, solo: false, pan: 0, filter: 0, delay: 0
        }])
      );
    }
    sectionLoopEnabled = Boolean(song.sectionLoop);
    $("#loopSectionBtn").classList.toggle("active", sectionLoopEnabled);
    $("#loopSectionBtn").setAttribute("aria-pressed", String(sectionLoopEnabled));
    composerZoom = song.view ? Math.max(28, Math.min(58, Number(song.view.zoom) || 38)) : 38;
    composerCompact = Boolean(song.view && song.view.compact);
    scaleAssist = song.view && SCALE_GUIDES[song.view.scaleAssist] ? song.view.scaleAssist : "all";
    notePaintMode = Boolean(song.view && song.view.notePaintMode);
    videoPreset = song.view && VIDEO_PRESETS[song.view.videoPreset] ? song.view.videoPreset : "landscape";
    $("#scaleAssistSelect").value = scaleAssist;
    $("#notePaintToggle").checked = notePaintMode;
    $("#videoPresetSelect").value = videoPreset;
    $("#tempoOut").textContent = $("#tempoSlider").value + " BPM";
    $("#tempoReadout").textContent = $("#tempoSlider").value;
    applyComposerView();
    updateComposerButtons();
    renderSectionBar();
    renderPercussionGrid();
    renderInstrumentMixer();
    renderSequencer();
  }

  function noteToMidi(note) {
    const match = /^([A-G])(#?)(\d)$/.exec(note);
    if (!match) return 60;
    const semis = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    return (Number(match[3]) + 1) * 12 + semis[match[1]] + (match[2] ? 1 : 0);
  }

  function midiVlq(value) {
    let buffer = value & 0x7F;
    const bytes = [];
    while ((value >>= 7)) {
      buffer <<= 8;
      buffer |= ((value & 0x7F) | 0x80);
    }
    while (true) {
      bytes.push(buffer & 0xFF);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
    return bytes;
  }

  function pushBe16(bytes, value) {
    bytes.push((value >> 8) & 255, value & 255);
  }

  function pushBe32(bytes, value) {
    bytes.push((value >> 24) & 255, (value >> 16) & 255, (value >> 8) & 255, value & 255);
  }

  function midiTrackChunk(events, endTick) {
    events.sort((a, b) => a.tick - b.tick || a.order - b.order);
    const body = [];
    let lastTick = 0;
    events.forEach((event) => {
      body.push(...midiVlq(Math.max(0, event.tick - lastTick)), ...event.bytes);
      lastTick = event.tick;
    });
    body.push(...midiVlq(Math.max(0, endTick - lastTick)), 0xFF, 0x2F, 0x00);
    const out = [];
    ["M","T","r","k"].forEach((c) => out.push(c.charCodeAt(0)));
    pushBe32(out, body.length);
    out.push(...body);
    return out;
  }

  function exportMidi() {
    const PPQ = 480;
    const noteLength = Math.round(PPQ * .82);
    const endTick = songEndStep * PPQ;
    const tracks = [];

    const tempoBytes = (bpm) => {
      const tempo = Math.max(1, Math.round(60000000 / bpm));
      return [0xFF, 0x51, 0x03, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255];
    };

    const metaEvents = [
      { tick: 0, order: 0, bytes: tempoBytes(effectiveTempoAtStep(0)) },
      { tick: 0, order: 1, bytes: [0xFF, 0x58, 0x04, timeSignature, 0x02, 24, 8] }
    ];

    let previousTempo = effectiveTempoAtStep(0);
    for (let section = 1; section < SECTION_COUNT; section += 1) {
      const step = section * SECTION_LENGTH;
      if (step >= songEndStep) break;
      const bpm = effectiveTempoAtStep(step);
      if (bpm !== previousTempo) {
        metaEvents.push({ tick: step * PPQ, order: 0, bytes: tempoBytes(bpm) });
        previousTempo = bpm;
      }
    }
    tracks.push(midiTrackChunk(metaEvents, endTick));

    const channels = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15];
    const programMap = {
      kalimba:108, lizard:80, star:9, trumpet:10, game:81, dog:79, cat:79,
      pig:80, duck:81, baby:52, plane:96, ship:60, car:61, heart:33,
      frog:79, cow:58, chicken:80, horse:60, monkey:78, lion:58, elephant:56,
      bee:86, owl:78, bird:79, wolf:53, dolphin:79, whale:53,
      train:55, helicopter:96, rocket:96, clock:14, bell:14,
      guitar:25, piano:0, sax:65, brass:56, violin:40, snare:115,
      ghost:52, robot:81, water:98, fire:127
    };
    let melodicChannelIndex = 0;

    INSTRUMENTS.forEach((instrument) => {
      const used = sequence.some((row) => row.slice(0, songEndStep).includes(instrument.id));
      if (!used) return;

      const channel = instrument.id === "drum" || instrument.id === "snare"
        ? 9
        : channels[(melodicChannelIndex++) % channels.length];
      const events = [];
      for (let section = 0; section < SECTION_COUNT; section += 1) {
        const step = sectionStart(section);
        if (step >= songEndStep) break;
        const state = mixerState(mixerForStep(step), instrument.id);
        const volume = state.audible
          ? Math.round(Math.max(0, Math.min(1, Number(state.mix.volume) || 0)) * 127)
          : 0;
        const pan = Math.round((Math.max(-1, Math.min(1, Number(state.mix.pan) || 0)) + 1) * 63.5);
        events.push({ tick: step * PPQ, order: 0, bytes: [0xB0 | channel, 7, volume] });
        events.push({ tick: step * PPQ, order: 1, bytes: [0xB0 | channel, 10, pan] });
      }
      if (instrument.id !== "drum") {
        events.push({ tick: 0, order: 1, bytes: [0xC0 | channel, programMap[instrument.id] ?? 0] });
      }

      PITCHES.forEach((pitch, row) => {
        for (let step = 0; step < songEndStep; step += 1) {
          if (sequence[row][step] !== instrument.id) continue;
          const beatMs = 60000 / effectiveTempoAtStep(step);
          const humanTicks = Math.round((humanizeOffsetMs(row, step) / beatMs) * PPQ);
          const tick = step * PPQ + humanTicks;
          const midiNote = instrument.id === "drum"
            ? 36 + ((PITCHES.length - 1 - row) % 12)
            : noteToMidi(pitch);
          events.push({ tick, order: 3, bytes: [0x90 | channel, midiNote, 100] });
          events.push({ tick: tick + noteLength, order: 2, bytes: [0x80 | channel, midiNote, 0] });
        }
      });

      tracks.push(midiTrackChunk(events, endTick + PPQ));
    });

    const percussionEvents = [];
    for (let laneIndex = 0; laneIndex < PERCUSSION_LANES.length; laneIndex += 1) {
      const lane = PERCUSSION_LANES[laneIndex];
      for (let step = 0; step < songEndStep; step += 1) {
        if (!percussionPattern[laneIndex][step]) continue;
        const state = mixerState(mixerForStep(step), lane.instrument);
        if (!state.audible) continue;
        const beatMs = 60000 / effectiveTempoAtStep(step);
        const humanTicks = Math.round((humanizeOffsetMs(PITCHES.length + laneIndex, step) / beatMs) * PPQ);
        const tick = step * PPQ + humanTicks;
        const velocity = Math.max(1, Math.round(Math.max(0, Math.min(1, Number(state.mix.volume) || 0)) * 110));
        percussionEvents.push({ tick, order: 3, bytes: [0x99, lane.midi, velocity] });
        percussionEvents.push({ tick: tick + Math.round(PPQ * .3), order: 2, bytes: [0x89, lane.midi, 0] });
      }
    }
    if (percussionEvents.length) tracks.push(midiTrackChunk(percussionEvents, endTick + PPQ));

    const bytes = [];
    ["M","T","h","d"].forEach((c) => bytes.push(c.charCodeAt(0)));
    pushBe32(bytes, 6);
    pushBe16(bytes, 1);
    pushBe16(bytes, tracks.length);
    pushBe16(bytes, PPQ);
    tracks.forEach((track) => bytes.push(...track));

    const blob = new Blob([new Uint8Array(bytes)], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFilename($("#songName").value || "emojiro-song") + ".mid";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $("#exportMidiBtn").addEventListener("click", () => {
    exportMidi();
    toast("MIDI exported");
  });

  function offlineWave(type, phase) {
    const cycle = phase / (Math.PI * 2);
    if (type === "square") return Math.sin(phase) >= 0 ? 1 : -1;
    if (type === "sawtooth") return 2 * (cycle - Math.floor(cycle + .5));
    if (type === "triangle") return 2 * Math.abs(2 * (cycle - Math.floor(cycle + .5))) - 1;
    return Math.sin(phase);
  }

  function offlineVoiceConfig(id, frequency) {
    switch (id) {
      case "kalimba": return { wave: "triangle", frequency: frequency * 2, gain: .22, duration: .34, harmonic: 2 };
      case "drum": return { wave: "sine", frequency: 72, gain: .45, duration: .22, noise: .12 };
      case "lizard": return { wave: "square", frequency: frequency * 1.4, gain: .16, duration: .22, bend: 1.45 };
      case "star": return { wave: "sine", frequency: frequency * 4, gain: .16, duration: .65, harmonic: 2 };
      case "trumpet": return { wave: "sine", frequency: frequency * 2, gain: .15, duration: .5, harmonic: 1.5 };
      case "game": return { wave: "square", frequency, gain: .18, duration: .34 };
      case "dog": return { wave: "sawtooth", frequency: Math.max(65, frequency / 2), gain: .17, duration: .24, bend: .72, noise: .05 };
      case "cat": return { wave: "sawtooth", frequency, gain: .13, duration: .36, bend: 1.25 };
      case "pig": return { wave: "square", frequency: Math.max(55, frequency * .62), gain: .15, duration: .27, bend: .72, noise: .05 };
      case "duck": return { wave: "sawtooth", frequency, gain: .14, duration: .2, harmonic: 2 };
      case "baby": return { wave: "sine", frequency: frequency * 1.5, gain: .16, duration: .2, bend: 1.5 };
      case "plane": return { wave: "triangle", frequency: frequency / 2, gain: .2, duration: .48, harmonic: 2 };
      case "ship": return { wave: frequency < 440 ? "square" : "sine", frequency: frequency < 440 ? 170 : frequency * 2, gain: .16, duration: .18, noise: frequency < 440 ? .02 : .18 };
      case "car": return { wave: "square", frequency: frequency * 2, gain: .12, duration: .42, harmonic: 2 };
      case "heart": return { wave: "sine", frequency: Math.max(42, frequency / 5), gain: .28, duration: .34, harmonic: 1.15 };
      case "frog": return { wave: "square", frequency: Math.max(70, frequency / 2.5), gain: .17, duration: .3, bend: .72, noise: .04 };
      case "cow": return { wave: "sawtooth", frequency: Math.max(65, frequency / 2.4), gain: .16, duration: .62, bend: .82, harmonic: 1.5 };
      case "chicken": return { wave: "square", frequency: frequency * 1.9, gain: .13, duration: .16, noise: .1 };
      case "horse": return { wave: "sawtooth", frequency: frequency * .85, gain: .14, duration: .58, bend: 1.5 };
      case "monkey": return { wave: "square", frequency: frequency * 1.45, gain: .14, duration: .28, harmonic: 1.3 };
      case "lion": return { wave: "sawtooth", frequency: Math.max(48, frequency / 4), gain: .2, duration: .62, bend: .72, noise: .12 };
      case "elephant": return { wave: "sawtooth", frequency: Math.max(110, frequency * .7), gain: .18, duration: .52, bend: 1.7 };
      case "bee": return { wave: "sawtooth", frequency: 190 + frequency * .18, gain: .13, duration: .5, harmonic: 1.2 };
      case "owl": return { wave: "sine", frequency: Math.max(95, frequency / 2.2), gain: .18, duration: .48, harmonic: .8 };
      case "bird": return { wave: "sine", frequency: frequency * 2.4, gain: .15, duration: .24, bend: 1.45 };
      case "wolf": return { wave: "sine", frequency: frequency * .55, gain: .17, duration: .88, bend: 1.5 };
      case "dolphin": return { wave: "sine", frequency: frequency * 3.2, gain: .14, duration: .36, bend: 1.65 };
      case "whale": return { wave: "sine", frequency: Math.max(45, frequency / 5), gain: .2, duration: 1.1, harmonic: 1.6 };
      case "train": return { wave: "square", frequency: 85, gain: .2, duration: .3, noise: .08 };
      case "helicopter": return { wave: "square", frequency: 42, gain: .17, duration: .5, noise: .14 };
      case "rocket": return { wave: "sawtooth", frequency: 55, gain: .16, duration: .72, bend: 4.2, noise: .16 };
      case "clock": return { wave: "square", frequency: 880, gain: .16, duration: .18 };
      case "bell": return { wave: "sine", frequency: frequency * 2, gain: .2, duration: .9, harmonic: 1.5 };
      case "guitar": return { wave: "triangle", frequency, gain: .18, duration: .55, harmonic: 2, noise: .025 };
      case "piano": return { wave: "triangle", frequency, gain: .2, duration: .65, harmonic: 2 };
      case "sax": return { wave: "sawtooth", frequency, gain: .15, duration: .55, harmonic: 2 };
      case "brass": return { wave: "sawtooth", frequency, gain: .18, duration: .52, harmonic: 2 };
      case "violin": return { wave: "sawtooth", frequency, gain: .13, duration: .72, harmonic: 2 };
      case "snare": return { wave: "triangle", frequency: 175, gain: .2, duration: .17, noise: .28 };
      case "ghost": return { wave: "sine", frequency: frequency * .7, gain: .14, duration: .85, bend: 1.65 };
      case "robot": return { wave: "square", frequency: frequency * 1.5, gain: .16, duration: .28, harmonic: 1.5 };
      case "water": return { wave: "sine", frequency: frequency * 2.8, gain: .13, duration: .32, bend: .7 };
      case "fire": return { wave: "sine", frequency: frequency * .5, gain: .09, duration: .5, noise: .32 };
      default: return { wave: "sine", frequency, gain: .15, duration: .3 };
    }
  }

  async function exportWav() {
    const sampleRate = 22050;
    const tailSeconds = 2.2;
    const stepStarts = [0];
    for (let step = 0; step < songEndStep; step += 1) {
      stepStarts.push(stepStarts[step] + 60 / effectiveTempoAtStep(step));
    }

    const durationSeconds = stepStarts[songEndStep] + tailSeconds + humanizeMs / 1000;
    const sampleCount = Math.ceil(durationSeconds * sampleRate);
    const left = new Float32Array(sampleCount);
    const right = new Float32Array(sampleCount);

    const mixVoice = (id, frequency, startSample, mixer) => {
      const state = mixerState(mixer, id);
      const mix = state.mix;
      if (!state.audible) return;

      const config = offlineVoiceConfig(id, frequency);
      const voiceSamples = Math.min(sampleCount - startSample, Math.ceil(config.duration * sampleRate));
      if (voiceSamples <= 0) return;

      const pan = Math.max(-1, Math.min(1, Number(mix.pan) || 0));
      const leftPan = Math.cos((pan + 1) * Math.PI / 4);
      const rightPan = Math.sin((pan + 1) * Math.PI / 4);
      const volume = Math.max(0, Math.min(1, Number(mix.volume) || 0));
      const filterAmount = Math.max(0, Math.min(1, Number(mix.filter) || 0));
      const delayAmount = Math.max(0, Math.min(1, Number(mix.delay) || 0));
      const cutoff = Math.max(450, 19000 * Math.pow(0.055, filterAmount));
      const rc = 1 / (Math.PI * 2 * cutoff);
      const alpha = (1 / sampleRate) / (rc + (1 / sampleRate));
      const delaySamples = Math.round((.14 + delayAmount * .34) * sampleRate);
      let filteredSample = 0;

      const addStereo = (index, sample, amount = 1) => {
        if (index < 0 || index >= sampleCount) return;
        left[index] += sample * leftPan * amount;
        right[index] += sample * rightPan * amount;
      };

      for (let i = 0; i < voiceSamples; i += 1) {
        const t = i / sampleRate;
        const progress = i / Math.max(1, voiceSamples - 1);
        const envelope = Math.pow(1 - progress, id === "drum" ? 3.8 : 2.1) * Math.min(1, t / .008);
        const bend = config.bend ? 1 + (config.bend - 1) * progress : 1;
        const phase = Math.PI * 2 * config.frequency * bend * t;
        let sample = offlineWave(config.wave, phase);
        if (config.harmonic) sample += .28 * offlineWave("sine", phase * config.harmonic);
        if (config.noise) sample += (Math.random() * 2 - 1) * config.noise;
        sample *= config.gain * volume * envelope;

        if (filterAmount > .005) {
          filteredSample += alpha * (sample - filteredSample);
          sample = filteredSample;
        }

        const index = startSample + i;
        addStereo(index, sample);

        if (delayAmount > .005) {
          const wet = .12 + delayAmount * .38;
          addStereo(index + delaySamples, sample, wet);
          addStereo(index + delaySamples * 2, sample, wet * (.25 + delayAmount * .25));
        }
      }
    };

    for (let step = 0; step < songEndStep; step += 1) {
      const baseSample = Math.floor(stepStarts[step] * sampleRate);
      const stepMixer = mixerForStep(step);

      for (let row = 0; row < PITCHES.length; row += 1) {
        const id = sequence[row][step];
        if (!id) continue;
        const humanSamples = Math.round(humanizeOffsetMs(row, step) / 1000 * sampleRate);
        mixVoice(id, noteToFrequency(PITCHES[row]), baseSample + humanSamples, stepMixer);
      }

      for (let laneIndex = 0; laneIndex < PERCUSSION_LANES.length; laneIndex += 1) {
        if (!percussionPattern[laneIndex][step]) continue;
        const lane = PERCUSSION_LANES[laneIndex];
        const humanSamples = Math.round(
          humanizeOffsetMs(PITCHES.length + laneIndex, step) / 1000 * sampleRate
        );
        mixVoice(lane.instrument, noteToFrequency(lane.pitch), baseSample + humanSamples, stepMixer);
      }

      if (step % 8 === 7) await new Promise((resolve) => setTimeout(resolve, 0));
    }

    let peak = .001;
    for (let i = 0; i < sampleCount; i += 1) {
      peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
    }
    const scale = peak > .95 ? .95 / peak : 1;
    const buffer = new ArrayBuffer(44 + sampleCount * 4);
    const view = new DataView(buffer);

    const writeAscii = (offset, value) => {
      for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
    };

    writeAscii(0, "RIFF");
    view.setUint32(4, 36 + sampleCount * 4, true);
    writeAscii(8, "WAVE");
    writeAscii(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 2, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    writeAscii(36, "data");
    view.setUint32(40, sampleCount * 4, true);

    let offset = 44;
    for (let i = 0; i < sampleCount; i += 1) {
      const l = Math.max(-1, Math.min(1, left[i] * scale));
      const r = Math.max(-1, Math.min(1, right[i] * scale));
      view.setInt16(offset, Math.round(l * 32767), true);
      view.setInt16(offset + 2, Math.round(r * 32767), true);
      offset += 4;
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFilename($("#songName").value || "emojiro-song") + ".wav";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $("#exportWavBtn").addEventListener("click", async () => {
    $("#exportWavBtn").disabled = true;
    toast("Rendering WAV…");
    try {
      await exportWav();
      toast("WAV exported");
    } catch (error) {
      toast("WAV export failed");
    } finally {
      $("#exportWavBtn").disabled = false;
    }
  });

  $("#shareSongBtn").addEventListener("click", async () => {
    try {
      const url = await sharedSongUrl();
      await copyText(url);
      toast("Shareable song link copied");
    } catch (error) {
      toast("Song link could not be copied");
    }
  });

  $("#saveSongBtn").addEventListener("click", () => {
    localStorage.setItem(SONG_KEY, JSON.stringify(songPayload()));
    toast("Song saved on this device");
  });

  $("#loadSongBtn").addEventListener("click", () => {
    const raw = localStorage.getItem(SONG_KEY);
    if (!raw) return toast("No saved song yet");
    try {
      applySong(JSON.parse(raw));
      toast("Song loaded");
    } catch (error) {
      toast("Saved song could not be loaded");
    }
  });

  $("#exportSongBtn").addEventListener("click", () => {
    const song = songPayload();
    downloadText(safeFilename(song.name) + ".json", JSON.stringify(song, null, 2), "application/json");
    toast("Song JSON exported");
  });

  $("#importSongInput").addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      applySong(JSON.parse(await file.text()));
      toast("Song imported");
    } catch (error) {
      toast("That file is not an Emojiro song");
    } finally {
      event.target.value = "";
    }
  });

  // -----------------------------
  // Animation export
  // -----------------------------

  function animationFrameDurationMs(index) {
    if (syncMusic) {
      return Math.max(1, Number(frameBeats[index]) || 1) * (60000 / Number($("#tempoSlider").value));
    }
    return 1000 / Number($("#frameSpeed").value);
  }

  function make332Palette() {
    const palette = [];
    for (let r = 0; r < 8; r += 1) {
      for (let g = 0; g < 8; g += 1) {
        for (let b = 0; b < 4; b += 1) {
          palette.push(Math.round(r * 255 / 7), Math.round(g * 255 / 7), Math.round(b * 255 / 3));
        }
      }
    }
    return palette;
  }

  function gifIndexForRgb(r, g, b) {
    return ((r >> 5) << 5) | ((g >> 5) << 2) | (b >> 6);
  }

  function gifLzwEncode(indices, minCodeSize = 8) {
    const clearCode = 1 << minCodeSize;
    const endCode = clearCode + 1;
    let nextCode;
    let codeSize;
    let dictionary;
    const output = [];
    let bitBuffer = 0;
    let bitCount = 0;

    const writeCode = (code) => {
      bitBuffer |= code << bitCount;
      bitCount += codeSize;
      while (bitCount >= 8) {
        output.push(bitBuffer & 255);
        bitBuffer >>= 8;
        bitCount -= 8;
      }
    };

    const resetDictionary = () => {
      dictionary = new Map();
      nextCode = endCode + 1;
      codeSize = minCodeSize + 1;
    };

    resetDictionary();
    writeCode(clearCode);

    if (indices.length) {
      let prefix = indices[0];
      for (let i = 1; i < indices.length; i += 1) {
        const value = indices[i];
        const key = prefix + "," + value;
        if (dictionary.has(key)) {
          prefix = dictionary.get(key);
        } else {
          writeCode(prefix);
          if (nextCode < 4096) {
            dictionary.set(key, nextCode);
            nextCode += 1;
            if (nextCode === (1 << codeSize) && codeSize < 12) codeSize += 1;
          } else {
            writeCode(clearCode);
            resetDictionary();
          }
          prefix = value;
        }
      }
      writeCode(prefix);
    }

    writeCode(endCode);
    if (bitCount > 0) output.push(bitBuffer & 255);
    return output;
  }

  function pushWord(bytes, value) {
    bytes.push(value & 255, (value >> 8) & 255);
  }

  function pushAscii(bytes, value) {
    for (let i = 0; i < value.length; i += 1) bytes.push(value.charCodeAt(i) & 255);
  }

  async function exportAnimationGif() {
    const width = 320;
    const height = 240;
    const temp = document.createElement("canvas");
    temp.width = width;
    temp.height = height;
    const tctx = temp.getContext("2d", { willReadFrequently: true });
    const bytes = [];
    const palette = make332Palette();

    pushAscii(bytes, "GIF89a");
    pushWord(bytes, width);
    pushWord(bytes, height);
    bytes.push(0xF7, 0, 0);
    bytes.push(...palette);
    bytes.push(0x21, 0xFF, 0x0B);
    pushAscii(bytes, "NETSCAPE2.0");
    bytes.push(0x03, 0x01, 0x00, 0x00, 0x00);

    for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
      drawFrameToContext(tctx, frames[frameIndex], width, height);
      const rgba = tctx.getImageData(0, 0, width, height).data;
      const indexed = new Uint8Array(width * height);
      for (let i = 0; i < indexed.length; i += 1) {
        const p = i * 4;
        indexed[i] = gifIndexForRgb(rgba[p], rgba[p + 1], rgba[p + 2]);
      }

      const delay = Math.max(1, Math.round(animationFrameDurationMs(frameIndex) / 10));
      bytes.push(0x21, 0xF9, 0x04, 0x04);
      pushWord(bytes, Math.min(65535, delay));
      bytes.push(0x00, 0x00);
      bytes.push(0x2C);
      pushWord(bytes, 0);
      pushWord(bytes, 0);
      pushWord(bytes, width);
      pushWord(bytes, height);
      bytes.push(0x00);
      bytes.push(8);

      const compressed = gifLzwEncode(indexed, 8);
      for (let offset = 0; offset < compressed.length; offset += 255) {
        const block = compressed.slice(offset, offset + 255);
        bytes.push(block.length, ...block);
      }
      bytes.push(0x00);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    bytes.push(0x3B);
    const blob = new Blob([new Uint8Array(bytes)], { type: "image/gif" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "emojiro-animation.gif";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function exportAnimationWebm() {
    if (!HTMLCanvasElement.prototype.captureStream || typeof MediaRecorder === "undefined") {
      throw new Error("WebM export is not supported in this browser");
    }

    const preset = videoPresetDimensions();
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = preset.width;
    exportCanvas.height = preset.height;
    const exportCtx = exportCanvas.getContext("2d");
    const stream = exportCanvas.captureStream(30);
    const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    const mimeType = types.find((type) => !MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(type)) || "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    });

    const stopped = new Promise((resolve) => recorder.addEventListener("stop", resolve, { once: true }));
    recorder.start();

    for (let i = 0; i < frames.length; i += 1) {
      drawFrameToVideoContext(exportCtx, frames[i], exportCanvas.width, exportCanvas.height);
      await new Promise((resolve) => setTimeout(resolve, animationFrameDurationMs(i)));
    }

    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    const blob = new Blob(chunks, { type: mimeType || "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "emojiro-animation-" + videoPreset + ".webm";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function exportMusicVideo() {
    if (!HTMLCanvasElement.prototype.captureStream || typeof MediaRecorder === "undefined") {
      throw new Error("Music-video export is not supported in this browser");
    }

    stopFramePreview();
    stopMusic();

    const ac = ensureAudio();
    captureDestination = ac.createMediaStreamDestination();
    suppressLiveOutput = true;

    const preset = videoPresetDimensions();
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = preset.width;
    exportCanvas.height = preset.height;
    const exportCtx = exportCanvas.getContext("2d");
    const videoStream = exportCanvas.captureStream(30);
    const combined = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...captureDestination.stream.getAudioTracks()
    ]);

    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4"
    ];
    const mimeType = types.find((type) =>
      !MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(type)
    ) || "";
    const extension = mimeType.includes("mp4") ? "mp4" : "webm";
    const recorder = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
    const chunks = [];

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    });

    const stopped = new Promise((resolve) =>
      recorder.addEventListener("stop", resolve, { once: true })
    );

    try {
      recorder.start(250);
      for (let step = 0; step < songEndStep; step += 1) {
        const beatMs = 60000 / effectiveTempoAtStep(step);
        const frameIndex = animationFrameForBeat(step);
        drawFrameToVideoContext(exportCtx, frames[frameIndex] || frames[0], exportCanvas.width, exportCanvas.height);

        const baseWhen = ac.currentTime + .015;
        const stepMixer = mixerForStep(step);
        PITCHES.forEach((pitch, row) => {
          const id = sequence[row][step];
          if (!id) return;
          const when = baseWhen + humanizeOffsetMs(row, step) / 1000;
          playInstrument(id, noteToFrequency(pitch), Math.min(.55, beatMs / 1000 * .82), when, stepMixer);
        });

        PERCUSSION_LANES.forEach((lane, laneIndex) => {
          if (!percussionPattern[laneIndex][step]) return;
          const when = baseWhen + humanizeOffsetMs(PITCHES.length + laneIndex, step) / 1000;
          playInstrument(lane.instrument, noteToFrequency(lane.pitch), Math.min(.45, beatMs / 1000 * .72), when, stepMixer);
        });

        await new Promise((resolve) => setTimeout(resolve, beatMs));
      }

      await new Promise((resolve) => setTimeout(resolve, 900));
      recorder.stop();
      await stopped;

      const blob = new Blob(chunks, { type: mimeType || "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = safeFilename($("#songName").value || "emojiro-music-video") + "-" + videoPreset + "." + extension;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
    } finally {
      suppressLiveOutput = false;
      captureDestination = null;
      combined.getTracks().forEach((track) => track.stop());
      videoStream.getTracks().forEach((track) => track.stop());
    }
  }

  $("#exportMusicVideoBtn").addEventListener("click", async () => {
    $("#exportMusicVideoBtn").disabled = true;
    toast("Recording music video…");
    try {
      await exportMusicVideo();
      toast("Music video exported");
    } catch (error) {
      toast(error.message || "Music video export failed");
    } finally {
      $("#exportMusicVideoBtn").disabled = false;
    }
  });

  $("#videoPresetSelect").addEventListener("change", (event) => {
    videoPreset = VIDEO_PRESETS[event.target.value] ? event.target.value : "landscape";
  });

  $("#exportGifBtn").addEventListener("click", async () => {
    $("#exportGifBtn").disabled = true;
    toast("Building GIF…");
    try {
      await exportAnimationGif();
      toast("GIF exported");
    } catch (error) {
      toast("GIF export failed");
    } finally {
      $("#exportGifBtn").disabled = false;
    }
  });

  $("#exportWebmBtn").addEventListener("click", async () => {
    $("#exportWebmBtn").disabled = true;
    toast("Recording animation…");
    try {
      await exportAnimationWebm();
      toast("WebM exported");
    } catch (error) {
      toast(error.message || "WebM export failed");
    } finally {
      $("#exportWebmBtn").disabled = false;
    }
  });

  // -----------------------------
  // Project save/load
  // -----------------------------

  function projectPayload() {
    return {
      format: "emojiro-paint-project",
      version: 8,
      name: ($("#projectNameInput").value || "Untitled Emojiro Project").trim().slice(0, 40),
      savedAt: new Date().toISOString(),
      paint: {
        frames,
        frameBeats,
        activeFrameIndex,
        frameSpeed: Number($("#frameSpeed").value),
        onionSkin,
        syncMusic,
        brushPattern,
        fillShapes,
        paintText: $("#paintTextInput").value,
        customStamps,
        activeCustomStampId
      },
      music: songPayload()
    };
  }

  let activeProjectId = null;
  let projectLibrary = [];
  let lastAutosaveSerialized = "";

  function loadProjectLibrary() {
    try {
      const stored = JSON.parse(localStorage.getItem(PROJECT_LIBRARY_KEY) || "[]");
      projectLibrary = Array.isArray(stored)
        ? stored.filter((entry) => entry && entry.id && entry.payload).slice(0, MAX_LIBRARY_PROJECTS)
        : [];
    } catch (error) {
      projectLibrary = [];
    }
  }

  function persistProjectLibrary() {
    localStorage.setItem(PROJECT_LIBRARY_KEY, JSON.stringify(projectLibrary));
  }

  function applyProjectPayload(project) {
    if (!project || !project.paint || !Array.isArray(project.paint.frames) || !project.paint.frames.length) {
      throw new Error("Invalid Emojiro project");
    }

    stopFramePreview();
    stopMusic();

    frames = project.paint.frames;
    frameBeats = Array.isArray(project.paint.frameBeats)
      ? project.paint.frameBeats.slice(0, frames.length).map((value) => Math.max(1, Math.min(8, Number(value) || 1)))
      : frames.map(() => 1);
    while (frameBeats.length < frames.length) frameBeats.push(1);

    activeFrameIndex = Math.max(0, Math.min(Number(project.paint.activeFrameIndex) || 0, frames.length - 1));
    $("#frameSpeed").value = Math.max(1, Math.min(12, Number(project.paint.frameSpeed) || 4));
    $("#frameSpeedOut").textContent = $("#frameSpeed").value + " fps";

    onionSkin = Boolean(project.paint.onionSkin);
    syncMusic = Boolean(project.paint.syncMusic);
    brushPattern = ["solid", "checker", "dots", "rainbow"].includes(project.paint.brushPattern)
      ? project.paint.brushPattern
      : "solid";
    fillShapes = Boolean(project.paint.fillShapes);

    $("#onionSkinToggle").checked = onionSkin;
    $("#syncMusicToggle").checked = syncMusic;
    $("#brushPatternSelect").value = brushPattern;
    $("#fillShapeToggle").checked = fillShapes;
    if (typeof project.paint.paintText === "string") {
      $("#paintTextInput").value = project.paint.paintText.slice(0, 24);
    }

    if (Array.isArray(project.paint.customStamps)) {
      customStamps = project.paint.customStamps
        .filter((stamp) => stamp && Array.isArray(stamp.pixels) && stamp.pixels.length === 64)
        .slice(0, 24);
      activeCustomStampId = project.paint.activeCustomStampId || (customStamps[0] ? customStamps[0].id : null);
      persistCustomStamps();
    }

    undoStack = [];
    redoStack = [];
    musicHistory = [];

    syncFrameTimingUi();
    renderCustomStampPalette();
    syncCustomStampActions();
    renderCanvas();
    renderFrameList();

    if (project.music) {
      applySong(project.music);
    } else {
      sequence = makeSequence();
      renderSequencer();
    }

    $("#projectNameInput").value = String(project.name || "Untitled Emojiro Project").slice(0, 40);
    lastAutosaveSerialized = "";
  }

  function blankProjectPayload() {
    const mix = Object.fromEntries(
      INSTRUMENTS.map((instrument) => [instrument.id, { volume: 1, mute: false, solo: false, pan: 0, filter: 0, delay: 0 }])
    );
    return {
      format: "emojiro-paint-project",
      version: 8,
      name: "Untitled Emojiro Project",
      savedAt: new Date().toISOString(),
      paint: {
        frames: [blankFrame()],
        frameBeats: [1],
        activeFrameIndex: 0,
        frameSpeed: 4,
        onionSkin: false,
        syncMusic: false,
        brushPattern: "solid",
        fillShapes: false,
        paintText: "HELLO",
        customStamps: deepClone(customStamps),
        activeCustomStampId
      },
      music: {
        format: "emojiro-paint-song",
        version: 8,
        name: "My Emoji Song",
        tempo: 120,
        timeSignature: 4,
        endStep: SEQ_STEPS,
        loop: true,
        pitches: PITCHES,
        steps: SEQ_STEPS,
        maxLayersPerBeat: MAX_LAYERS,
        sections: ["Section A", "Section B", "Section C", "Section D"],
        sectionTempoOverrides: [null, null, null, null],
        sectionInstrumentPalettes: [null, null, null, null],
        sectionMixerSnapshots: [null, null, null, null],
        percussion: makePercussionPattern(),
        humanizeMs: 0,
        sectionLoop: false,
        view: {
          zoom: 38,
          compact: false,
          scaleAssist: "all",
          notePaintMode: false,
          videoPreset: "landscape"
        },
        mixer: mix,
        sequence: makeSequence()
      }
    };
  }

  function exportProjectFile(payload, name) {
    downloadText(
      safeFilename(name || payload.name || "emojiro-project") + ".emojiro.json",
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  }

  function cloudConfigFromUi() {
    return {
      url: ($("#cloudProjectUrl").value || "").trim().replace(/\/+$/, ""),
      key: ($("#cloudPublishableKey").value || "").trim(),
      code: ($("#cloudSyncCode").value || "").trim()
    };
  }

  function saveCloudConfig() {
    const config = cloudConfigFromUi();
    try {
      localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {}
    return config;
  }

  function loadCloudConfig() {
    let config = {};
    try {
      config = JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY) || "{}");
    } catch (error) {}
    $("#cloudProjectUrl").value = config.url || "";
    $("#cloudPublishableKey").value = config.key || "";
    $("#cloudSyncCode").value = config.code || "";
    $("#cloudSyncStatus").textContent = config.url && config.key && config.code ? "Configured" : "Not configured";
  }

  async function sha256Bytes(text) {
    const bytes = new TextEncoder().encode(text);
    return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  }

  async function cloudSyncId(code) {
    const bytes = await sha256Bytes("emojiro-sync-id:" + code);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }

  async function cloudEncryptionKey(code) {
    const raw = await sha256Bytes("emojiro-cloud-library:" + code);
    return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  }

  async function encryptCloudPayload(value, code) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await cloudEncryptionKey(code);
    const plain = new TextEncoder().encode(JSON.stringify(value));
    const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
    return "v1." + bytesToBase64Url(iv) + "." + bytesToBase64Url(encrypted);
  }

  async function decryptCloudPayload(payload, code) {
    const parts = String(payload || "").split(".");
    if (parts.length !== 3 || parts[0] !== "v1") throw new Error("Unsupported cloud payload");
    const key = await cloudEncryptionKey(code);
    const iv = base64UrlToBytes(parts[1]);
    const encrypted = base64UrlToBytes(parts[2]);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
    return JSON.parse(new TextDecoder().decode(plain));
  }

  function validateCloudConfig(config) {
    if (!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(config.url)) {
      throw new Error("Enter a valid Supabase project URL");
    }
    if (!config.key || (!config.key.startsWith("sb_publishable_") && config.key.length < 30)) {
      throw new Error("Enter a Supabase publishable key");
    }
    if (config.code.length < 20) throw new Error("Use a generated sync code or a strong existing code");
  }

  async function cloudRequest(method, config, syncId, query, body) {
    const response = await fetch(
      config.url + "/rest/v1/emojiro_cloud_libraries" + (query || ""),
      {
        method,
        headers: {
          apikey: config.key,
          "Content-Type": "application/json",
          "x-emojiro-sync": syncId,
          ...(method === "POST" ? { Prefer: "resolution=merge-duplicates,return=minimal" } : {})
        },
        body: body == null ? undefined : JSON.stringify(body)
      }
    );
    if (!response.ok) {
      let detail = "";
      try { detail = (await response.json()).message || ""; } catch (error) {}
      throw new Error(detail || ("Cloud request failed (" + response.status + ")"));
    }
    if (response.status === 204) return null;
    return response.json();
  }

  function mergeCloudProjects(remoteProjects) {
    const byId = new Map();
    [...projectLibrary, ...(Array.isArray(remoteProjects) ? remoteProjects : [])].forEach((entry) => {
      if (!entry || !entry.id || !entry.payload) return;
      const existing = byId.get(entry.id);
      if (!existing || Number(entry.updatedAt) > Number(existing.updatedAt)) byId.set(entry.id, entry);
    });
    projectLibrary = [...byId.values()]
      .sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))
      .slice(0, MAX_LIBRARY_PROJECTS);
  }

  $("#generateCloudCodeBtn").addEventListener("click", () => {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    $("#cloudSyncCode").value = bytesToBase64Url(bytes);
    saveCloudConfig();
    $("#cloudSyncStatus").textContent = "New sync code generated";
  });

  $("#pushCloudLibraryBtn").addEventListener("click", async () => {
    const button = $("#pushCloudLibraryBtn");
    button.disabled = true;
    $("#cloudSyncStatus").textContent = "Encrypting…";
    try {
      const config = saveCloudConfig();
      validateCloudConfig(config);
      const syncId = await cloudSyncId(config.code);
      const payload = await encryptCloudPayload({
        version: 1,
        pushedAt: new Date().toISOString(),
        projects: projectLibrary
      }, config.code);
      await cloudRequest("POST", config, syncId, "?on_conflict=sync_id", {
        sync_id: syncId,
        payload,
        updated_at: new Date().toISOString()
      });
      $("#cloudSyncStatus").textContent = "Cloud library updated";
      toast("Encrypted project library pushed");
    } catch (error) {
      $("#cloudSyncStatus").textContent = error.message || "Cloud push failed";
      toast("Cloud push failed");
    } finally {
      button.disabled = false;
    }
  });

  $("#pullCloudLibraryBtn").addEventListener("click", async () => {
    const button = $("#pullCloudLibraryBtn");
    button.disabled = true;
    $("#cloudSyncStatus").textContent = "Downloading…";
    try {
      const config = saveCloudConfig();
      validateCloudConfig(config);
      const syncId = await cloudSyncId(config.code);
      const rows = await cloudRequest(
        "GET",
        config,
        syncId,
        "?select=payload,updated_at&sync_id=eq." + encodeURIComponent(syncId),
        null
      );
      if (!Array.isArray(rows) || !rows.length) {
        $("#cloudSyncStatus").textContent = "No cloud library found";
        return;
      }
      const decoded = await decryptCloudPayload(rows[0].payload, config.code);
      mergeCloudProjects(decoded.projects);
      persistProjectLibrary();
      renderProjectLibrary();
      $("#cloudSyncStatus").textContent = "Cloud library merged";
      toast("Cloud projects merged onto this device");
    } catch (error) {
      $("#cloudSyncStatus").textContent = error.message || "Cloud pull failed";
      toast("Cloud pull failed");
    } finally {
      button.disabled = false;
    }
  });

  $("#forgetCloudConfigBtn").addEventListener("click", () => {
    localStorage.removeItem(CLOUD_CONFIG_KEY);
    $("#cloudProjectUrl").value = "";
    $("#cloudPublishableKey").value = "";
    $("#cloudSyncCode").value = "";
    $("#cloudSyncStatus").textContent = "Not configured";
    toast("Cloud configuration forgotten");
  });

  ["cloudProjectUrl", "cloudPublishableKey", "cloudSyncCode"].forEach((id) => {
    $("#" + id).addEventListener("change", saveCloudConfig);
  });

  function renderProjectLibrary() {
    const list = $("#projectLibraryList");
    list.innerHTML = "";
    const sorted = projectLibrary.slice().sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt));
    $("#projectCount").textContent = sorted.length + (sorted.length === 1 ? " project" : " projects");

    if (!sorted.length) {
      const empty = document.createElement("div");
      empty.className = "project-empty";
      empty.textContent = "No named projects yet. Save the current project to build your library.";
      list.appendChild(empty);
      return;
    }

    sorted.forEach((entry) => {
      const card = document.createElement("div");
      card.className = "project-entry" + (entry.id === activeProjectId ? " active" : "");

      const info = document.createElement("div");
      info.className = "project-entry-info";
      const name = document.createElement("div");
      name.className = "project-entry-name";
      name.textContent = entry.name;
      const meta = document.createElement("div");
      meta.className = "project-entry-meta";
      const updated = new Date(entry.updatedAt);
      meta.textContent = "Updated " + (Number.isNaN(updated.getTime()) ? "recently" : updated.toLocaleString());
      info.append(name, meta);

      const actions = document.createElement("div");
      actions.className = "project-entry-actions";

      const load = document.createElement("button");
      load.type = "button";
      load.className = "button small primary";
      load.textContent = "Open";
      load.addEventListener("click", () => {
        try {
          applyProjectPayload(deepClone(entry.payload));
          activeProjectId = entry.id;
          $("#projectNameInput").value = entry.name;
          $("#projectLibraryDialog").close();
          saveAutosave(true);
          toast("Project opened");
        } catch (error) {
          toast("Project could not be opened");
        }
      });

      const exportButton = document.createElement("button");
      exportButton.type = "button";
      exportButton.className = "button small";
      exportButton.textContent = "Export";
      exportButton.addEventListener("click", () => exportProjectFile(entry.payload, entry.name));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "button small danger";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        projectLibrary = projectLibrary.filter((item) => item.id !== entry.id);
        if (activeProjectId === entry.id) activeProjectId = null;
        try {
          persistProjectLibrary();
          renderProjectLibrary();
          toast("Project deleted");
        } catch (error) {
          toast("Project library could not be updated");
        }
      });

      actions.append(load, exportButton, remove);
      card.append(info, actions);
      list.appendChild(card);
    });
  }

  function saveNamedProject() {
    const name = ($("#projectNameInput").value || "Untitled Emojiro Project").trim().slice(0, 40);
    const payload = projectPayload();
    payload.name = name;
    const now = Date.now();

    if (activeProjectId) {
      const existing = projectLibrary.find((entry) => entry.id === activeProjectId);
      if (existing) {
        existing.name = name;
        existing.updatedAt = now;
        existing.payload = payload;
      } else {
        activeProjectId = null;
      }
    }

    if (!activeProjectId) {
      activeProjectId = "project-" + now.toString(36);
      projectLibrary.push({ id: activeProjectId, name, updatedAt: now, payload });
    }

    projectLibrary.sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt));
    projectLibrary = projectLibrary.slice(0, MAX_LIBRARY_PROJECTS);
    try {
      persistProjectLibrary();
      renderProjectLibrary();
      saveAutosave(true);
      toast("Project saved to library");
    } catch (error) {
      toast("Project library is full on this device");
    }
  }

  function saveAutosave(force = false) {
    try {
      const serialized = JSON.stringify(projectPayload());
      if (!force && serialized === lastAutosaveSerialized) return;
      localStorage.setItem(AUTOSAVE_KEY, serialized);
      lastAutosaveSerialized = serialized;
      const now = new Date();
      $("#autosaveStatus").textContent = "Saved " + now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch (error) {
      $("#autosaveStatus").textContent = "Autosave unavailable";
    }
  }

  function recoverAutosave() {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return false;
    try {
      const project = JSON.parse(raw);
      applyProjectPayload(project);
      lastAutosaveSerialized = raw;
      $("#autosaveStatus").textContent = "Autosave recovered";
      return true;
    } catch (error) {
      return false;
    }
  }

  $("#saveProjectBtn").addEventListener("click", () => {
    try {
      const payload = projectPayload();
      localStorage.setItem(PROJECT_KEY, JSON.stringify(payload));
      saveAutosave(true);
      toast("Quick save complete");
    } catch (error) {
      toast("Project could not be saved");
    }
  });

  $("#loadProjectBtn").addEventListener("click", () => {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return toast("No quick save yet");
    try {
      applyProjectPayload(JSON.parse(raw));
      activeProjectId = null;
      saveAutosave(true);
      toast("Quick save loaded");
    } catch (error) {
      toast("Saved project could not be loaded");
    }
  });

  $("#projectsBtn").addEventListener("click", () => {
    loadProjectLibrary();
    loadCloudConfig();
    renderProjectLibrary();
    $("#projectLibraryDialog").showModal();
  });

  $("#closeProjectsBtn").addEventListener("click", () => {
    $("#projectLibraryDialog").close();
  });

  $("#saveNamedProjectBtn").addEventListener("click", saveNamedProject);

  $("#newProjectBtn").addEventListener("click", () => {
    try {
      applyProjectPayload(blankProjectPayload());
      activeProjectId = null;
      $("#projectNameInput").value = "Untitled Emojiro Project";
      $("#projectLibraryDialog").close();
      saveAutosave(true);
      toast("New project started");
    } catch (error) {
      toast("New project could not be created");
    }
  });

  $("#exportProjectBtn").addEventListener("click", () => {
    const payload = projectPayload();
    exportProjectFile(payload, payload.name);
    toast("Project exported");
  });

  $("#importProjectInput").addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const project = JSON.parse(await file.text());
      if (project.format !== "emojiro-paint-project") throw new Error("Wrong project type");
      applyProjectPayload(project);
      activeProjectId = null;
      $("#projectLibraryDialog").close();
      saveAutosave(true);
      toast("Project imported");
    } catch (error) {
      toast("That file is not an Emojiro project");
    } finally {
      event.target.value = "";
    }
  });

  loadProjectLibrary();
  loadCloudConfig();

  // -----------------------------
  // Keyboard helpers
  // -----------------------------

  window.addEventListener("keydown", (event) => {
    const tag = document.activeElement && document.activeElement.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    const liveKeyIndex = LIVE_KEYBOARD_KEYS.indexOf(event.key.toLowerCase());
    if (
      liveKeyIndex >= 0 &&
      !typing &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      $("#musicPanel").classList.contains("active")
    ) {
      event.preventDefault();
      if (!event.repeat) {
        const pitch = PITCHES.slice().reverse()[liveKeyIndex];
        const button = $('.live-key[data-pitch="' + pitch + '"]');
        livePitchTrigger(pitch, button);
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if ($("#musicPanel").classList.contains("active")) {
        $("#undoMusicBtn").click();
      } else if (event.shiftKey) {
        $("#redoBtn").click();
      } else {
        $("#undoBtn").click();
      }
    }

    if (event.code === "Space" && $("#musicPanel").classList.contains("active") && document.activeElement.tagName !== "INPUT") {
      event.preventDefault();
      if (isMusicPlaying) stopMusic();
      else startMusic("song");
    }
  });

  // -----------------------------
  // Init
  // -----------------------------

  const mobileComposerMedia = window.matchMedia ? window.matchMedia("(max-width: 640px)") : null;
  if (mobileComposerMedia && mobileComposerMedia.addEventListener) {
    mobileComposerMedia.addEventListener("change", () => {
      composerCompact = mobileComposerMedia.matches ? true : composerCompact;
      renderSequencer();
    });
  }

  setupNotePaintEvents();
  renderLiveKeyboard();
  $("#scaleAssistSelect").value = scaleAssist;
  $("#notePaintToggle").checked = notePaintMode;
  $("#videoPresetSelect").value = videoPreset;
  renderPaintPalettes();
  renderCustomStampPalette();
  renderStampEditor();
  renderStampEditorColors();
  $("#onionSkinToggle").checked = onionSkin;
  $("#syncMusicToggle").checked = syncMusic;
  $("#brushPatternSelect").value = brushPattern;
  $("#fillShapeToggle").checked = fillShapes;
  syncFrameTimingUi();
  syncCustomStampActions();
  renderCanvas();
  renderFrameList();
  renderInstrumentBank();
  renderSectionBar();
  renderSectionSoundSettings();
  renderPercussionGrid();
  renderInstrumentMixer();
  updateComposerButtons();
  renderSequencer();

  const sharedSongLoaded = await loadSongFromHash();
  const recovered = sharedSongLoaded ? false : recoverAutosave();
  if (!recovered) saveAutosave(true);
  setInterval(() => saveAutosave(), 7000);
  window.addEventListener("pagehide", () => saveAutosave(true));

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
})();