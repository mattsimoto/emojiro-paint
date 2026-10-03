(() => {
  "use strict";

  const COLS = 32;
  const ROWS = 24;
  const CELL_W = 20;
  const CELL_H = 20;
  const MAX_UNDO = 40;
  const PROJECT_KEY = "emojiro-paint-project-v1";
  const SONG_KEY = "emojiro-paint-song-v2";

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
    { id: "kalimba", emoji: "🙂", name: "Smile Keys", type: "kalimba" },
    { id: "drum", emoji: "🍄", name: "Mushroom Drum", type: "drum" },
    { id: "lizard", emoji: "🦎", name: "Lizard Zip", type: "lizard" },
    { id: "star", emoji: "⭐", name: "Star Bells", type: "star" },
    { id: "trumpet", emoji: "🌼", name: "Flower Horn", type: "trumpet" },
    { id: "game", emoji: "🎮", name: "Game Wave", type: "game" },
    { id: "dog", emoji: "🐶", name: "Dog Bark", type: "dog" },
    { id: "cat", emoji: "🐱", name: "Cat Meow", type: "cat" },
    { id: "pig", emoji: "🐷", name: "Pig Oink", type: "pig" },
    { id: "duck", emoji: "🦆", name: "Duck Hit", type: "duck" },
    { id: "baby", emoji: "👶", name: "Baby Hiccup", type: "baby" },
    { id: "plane", emoji: "✈️", name: "Plane Guitar", type: "plane" },
    { id: "ship", emoji: "🚢", name: "Ship Percussion", type: "ship" },
    { id: "car", emoji: "🚗", name: "Car Organ", type: "car" },
    { id: "heart", emoji: "❤️", name: "Heart Bass", type: "heart" }
  ];

  const PITCHES = ["G5", "F5", "E5", "D5", "C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4", "B3"];
  const SEQ_STEPS = 96;
  const MAX_LAYERS = 3;

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

  $$(".mode-tab").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".mode-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
      $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === button.dataset.panel));
      if (button.dataset.panel !== "musicPanel") stopMusic();
    });
  });

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
  let activeFrameIndex = 0;
  let previewTimer = null;
  let previewOrigin = 0;

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

  function renderCanvas(frame = currentFrame(), showGrid = true) {
    ctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);

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

  function paintAt(x, y) {
    if (activeTool === "pencil") {
      setCell(x, y, { color: activeColor, emoji: null });
    } else if (activeTool === "stamp") {
      setCell(x, y, { color: null, emoji: activeStamp });
    } else if (activeTool === "eraser") {
      setCell(x, y, blankCell());
    } else if (activeTool === "fill") {
      floodFill(x, y);
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
      setCell(x0, y0, { color: activeColor, emoji: null }, frame);
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

    for (let x = left; x <= right; x += 1) {
      setCell(x, top, { color: activeColor, emoji: null }, frame);
      setCell(x, bottom, { color: activeColor, emoji: null }, frame);
    }
    for (let y = top; y <= bottom; y += 1) {
      setCell(left, y, { color: activeColor, emoji: null }, frame);
      setCell(right, y, { color: activeColor, emoji: null }, frame);
    }
  }

  paintCanvas.addEventListener("pointerdown", (event) => {
    stopFramePreview();
    paintCanvas.setPointerCapture(event.pointerId);
    const pos = pointerCell(event);
    isDrawing = true;
    dragStart = pos;
    pushUndo();

    if (activeTool === "line" || activeTool === "rect") {
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

    if (activeTool === "pencil" || activeTool === "stamp" || activeTool === "eraser") {
      paintAt(pos.x, pos.y);
      renderCanvas();
    } else if ((activeTool === "line" || activeTool === "rect") && dragBase) {
      frames[activeFrameIndex] = deepClone(dragBase);
      if (activeTool === "line") plotLine(dragStart.x, dragStart.y, pos.x, pos.y, currentFrame());
      if (activeTool === "rect") plotRect(dragStart.x, dragStart.y, pos.x, pos.y, currentFrame());
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
    const tctx = temp.getContext("2d");
    tctx.fillStyle = "#fffdf7";
    tctx.fillRect(0, 0, temp.width, temp.height);

    const scaleX = temp.width / COLS;
    const scaleY = temp.height / ROWS;

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const cell = frame[cellIndex(x, y)];
        if (cell.color) {
          tctx.fillStyle = cell.color;
          tctx.fillRect(x * scaleX, y * scaleY, scaleX, scaleY);
        }
        if (cell.emoji) {
          tctx.font = "9px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif";
          tctx.textAlign = "center";
          tctx.textBaseline = "middle";
          tctx.fillText(cell.emoji, x * scaleX + scaleX / 2, y * scaleY + scaleY / 2);
        }
      }
    }
    return temp.toDataURL("image/png");
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
      button.addEventListener("click", () => {
        stopFramePreview();
        activeFrameIndex = index;
        undoStack = [];
        redoStack = [];
        renderCanvas();
        renderFrameList();
      });
      list.appendChild(button);
    });
  }

  $("#addFrameBtn").addEventListener("click", () => {
    stopFramePreview();
    frames.push(blankFrame());
    activeFrameIndex = frames.length - 1;
    undoStack = [];
    redoStack = [];
    renderCanvas();
    renderFrameList();
  });

  $("#duplicateFrameBtn").addEventListener("click", () => {
    stopFramePreview();
    frames.splice(activeFrameIndex + 1, 0, deepClone(currentFrame()));
    activeFrameIndex += 1;
    undoStack = [];
    redoStack = [];
    renderCanvas();
    renderFrameList();
  });

  $("#deleteFrameBtn").addEventListener("click", () => {
    stopFramePreview();
    if (frames.length === 1) return toast("Keep at least one frame");
    frames.splice(activeFrameIndex, 1);
    activeFrameIndex = Math.max(0, activeFrameIndex - 1);
    undoStack = [];
    redoStack = [];
    renderCanvas();
    renderFrameList();
  });

  $("#frameSpeed").addEventListener("input", (event) => {
    $("#frameSpeedOut").textContent = event.target.value + " fps";
    if (previewTimer) startFramePreview();
  });

  function startFramePreview() {
    stopFramePreview(false);
    previewOrigin = activeFrameIndex;
    let index = activeFrameIndex;
    const fps = Number($("#frameSpeed").value);
    $("#playFramesBtn").textContent = "■ Stop";
    previewTimer = setInterval(() => {
      index = (index + 1) % frames.length;
      activeFrameIndex = index;
      renderCanvas();
      renderFrameList();
    }, 1000 / fps);
  }

  function stopFramePreview(restore = true) {
    if (!previewTimer) return;
    clearInterval(previewTimer);
    previewTimer = null;
    $("#playFramesBtn").textContent = "▶ Preview";
    if (restore) {
      activeFrameIndex = Math.min(previewOrigin, frames.length - 1);
      renderCanvas();
      renderFrameList();
    }
  }

  $("#playFramesBtn").addEventListener("click", () => {
    if (previewTimer) stopFramePreview();
    else startFramePreview();
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

  function makeSequence() {
    return Array.from({ length: PITCHES.length }, () => Array(SEQ_STEPS).fill(null));
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

  function connectGain(gainValue, when, duration) {
    const ac = ensureAudio();
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(gainValue, when + Math.min(.02, Math.max(.005, duration * .18)));
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    gain.connect(ac.destination);
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

  function playInstrument(id, frequency, duration = .28, when) {
    const ac = ensureAudio();
    const start = when == null ? ac.currentTime : when;
    const instrument = instrumentById(id);
    if (!instrument) return;

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
      case "trumpet":
        tone("sawtooth", frequency, start, duration * .82, .055);
        tone("triangle", frequency * 2, start, duration * .72, .035);
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
      case "duck":
        tone("sawtooth", frequency, start, duration * .35, .045);
        tone("square", frequency * 2, start, duration * .25, .035);
        tone("triangle", frequency / 2, start, duration * .42, .035);
        break;
      case "baby": {
        const hic = tone("sine", frequency * 1.5, start, duration * .3, .055);
        hic.frequency.exponentialRampToValueAtTime(frequency * 2.3, start + duration * .12);
        hic.frequency.exponentialRampToValueAtTime(frequency * 1.45, start + duration * .3);
        break;
      }
      case "plane":
        tone("triangle", frequency / 2, start, duration * .85, .075);
        tone("sine", frequency, start, duration * .5, .024);
        break;
      case "ship":
        if (frequency < 440) {
          tone("square", 155 + frequency * .08, start, .09, .07);
          tone("square", 225 + frequency * .05, start + .018, .07, .04);
        } else {
          noiseBurst(start, .18, .075, "highpass", 3200);
        }
        break;
      case "car":
        tone("square", frequency * 2, start, duration * .8, .04, -6);
        tone("square", frequency * 4, start, duration * .8, .026, 6);
        break;
      case "heart":
        tone("sawtooth", frequency / 4, start, duration * .95, .085);
        tone("sine", frequency / 2, start, duration * .8, .03);
        break;
      default:
        tone("sine", frequency, start, duration, .07);
    }
  }

  function renderInstrumentBank() {
    const bank = $("#instrumentBank");
    bank.innerHTML = "";
    INSTRUMENTS.forEach((instrument) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "instrument-button" + (instrument.id === selectedInstrument ? " active" : "");
      button.innerHTML = '<span class="emoji">' + instrument.emoji + "</span>" + instrument.name;
      button.addEventListener("click", () => {
        selectedInstrument = instrument.id;
        renderInstrumentBank();
        playInstrument(instrument.id, 440, .22);
      });
      bank.appendChild(button);
    });
  }

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
      loopMusic
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

  function renderSequencer() {
    const sequencer = $("#sequencer");
    sequencer.innerHTML = "";
    sequencer.style.gridTemplateColumns = "66px repeat(" + SEQ_STEPS + ", var(--cell))";

    const corner = document.createElement("div");
    corner.className = "seq-corner";
    sequencer.appendChild(corner);

    for (let step = 0; step < SEQ_STEPS; step += 1) {
      const header = document.createElement("button");
      header.type = "button";
      header.className = "seq-step" + (step % timeSignature === 0 ? " measure" : "") + (step === songEndStep - 1 ? " end-step" : "");
      header.textContent = step + 1;
      header.dataset.step = step;
      header.title = "Beat " + (step + 1);
      header.addEventListener("click", () => {
        if (!endMarkerMode) return;
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

      for (let step = 0; step < SEQ_STEPS; step += 1) {
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
          sequence[row][step] = old === selectedInstrument ? null : selectedInstrument;
          const chosen = sequence[row][step];
          cell.textContent = chosen ? instrumentById(chosen).emoji : "";
          cell.setAttribute("aria-label", pitch + ", beat " + (step + 1) + (chosen ? ", " + instrumentById(chosen).name : ", empty"));
          if (chosen) playInstrument(chosen, noteToFrequency(pitch), .24);
        });

        sequencer.appendChild(cell);
      }
    });

    highlightedStep = -1;
    refreshPlayhead(true);
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
    const denom = Math.max(1, songEndStep - 1);
    runner.style.left = "calc(" + ((currentStep / denom) * 100) + "% - 14px)";

    if (isMusicPlaying && currentStep % timeSignature === 0) {
      const header = $('.seq-step[data-step="' + currentStep + '"]', sequencer);
      if (header) header.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }

  function playStep(step) {
    const bpm = Number($("#tempoSlider").value);
    const beatDuration = 60 / bpm;
    const ac = ensureAudio();
    const now = ac.currentTime + .01;

    PITCHES.forEach((pitch, row) => {
      const id = sequence[row][step];
      if (id) playInstrument(id, noteToFrequency(pitch), Math.min(.55, beatDuration * .82), now);
    });
  }

  function scheduleNextStep() {
    if (!isMusicPlaying) return;
    const bpm = Number($("#tempoSlider").value);
    const delay = 60000 / bpm;

    musicTimer = setTimeout(() => {
      const next = currentStep + 1;
      if (next >= songEndStep) {
        if (loopMusic) {
          currentStep = 0;
        } else {
          stopMusic();
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

  function startMusic() {
    if (isMusicPlaying) return;
    if (currentStep >= songEndStep) currentStep = 0;
    ensureAudio();
    isMusicPlaying = true;
    $("#playMusicBtn").textContent = "▶ Playing";
    playStep(currentStep);
    refreshPlayhead();
    scheduleNextStep();
  }

  function stopMusic() {
    isMusicPlaying = false;
    clearTimeout(musicTimer);
    musicTimer = null;
    currentStep = 0;
    $("#playMusicBtn").textContent = "▶ Play";
    refreshPlayhead();
  }

  $("#playMusicBtn").addEventListener("click", startMusic);
  $("#stopMusicBtn").addEventListener("click", stopMusic);

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
      renderSequencer();
    });
  });

  $("#auditionBtn").addEventListener("click", () => {
    playInstrument(selectedInstrument, 440, .35);
  });

  $("#tempoSlider").addEventListener("input", (event) => {
    $("#tempoOut").textContent = event.target.value + " BPM";
    $("#tempoReadout").textContent = event.target.value;
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

  function songPayload() {
    return {
      format: "emojiro-paint-song",
      version: 2,
      name: $("#songName").value || "My Emoji Song",
      tempo: Number($("#tempoSlider").value),
      timeSignature,
      endStep: songEndStep,
      loop: loopMusic,
      pitches: PITCHES,
      steps: SEQ_STEPS,
      maxLayersPerBeat: MAX_LAYERS,
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
    $("#tempoOut").textContent = $("#tempoSlider").value + " BPM";
    $("#tempoReadout").textContent = $("#tempoSlider").value;
    updateComposerButtons();
    renderSequencer();
  }

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
  // Project save/load
  // -----------------------------

  function projectPayload() {
    return {
      format: "emojiro-paint-project",
      version: 2,
      savedAt: new Date().toISOString(),
      paint: {
        frames,
        activeFrameIndex,
        frameSpeed: Number($("#frameSpeed").value)
      },
      music: songPayload()
    };
  }

  $("#saveProjectBtn").addEventListener("click", () => {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(projectPayload()));
    toast("Project saved on this device");
  });

  $("#loadProjectBtn").addEventListener("click", () => {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return toast("No saved project yet");
    try {
      const project = JSON.parse(raw);
      stopFramePreview();
      if (project.paint && Array.isArray(project.paint.frames) && project.paint.frames.length) {
        frames = project.paint.frames;
        activeFrameIndex = Math.min(project.paint.activeFrameIndex || 0, frames.length - 1);
        $("#frameSpeed").value = project.paint.frameSpeed || 4;
        $("#frameSpeedOut").textContent = $("#frameSpeed").value + " fps";
        undoStack = [];
        redoStack = [];
        renderCanvas();
        renderFrameList();
      }
      if (project.music) applySong(project.music);
      toast("Project loaded");
    } catch (error) {
      toast("Saved project could not be loaded");
    }
  });

  // -----------------------------
  // Keyboard helpers
  // -----------------------------

  window.addEventListener("keydown", (event) => {
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
      else startMusic();
    }
  });

  // -----------------------------
  // Init
  // -----------------------------

  renderPaintPalettes();
  renderCanvas();
  renderFrameList();
  renderInstrumentBank();
  updateComposerButtons();
  renderSequencer();
})();