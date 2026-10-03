(() => {
  "use strict";

  const COLS = 32;
  const ROWS = 24;
  const CELL_W = 20;
  const CELL_H = 20;
  const MAX_UNDO = 40;
  const PROJECT_KEY = "emojiro-paint-project-v1";
  const SONG_KEY = "emojiro-paint-song-v1";

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
    { id: "cat", emoji: "🐱", name: "Cat Lead", type: "square" },
    { id: "dog", emoji: "🐶", name: "Dog Bass", type: "bass" },
    { id: "frog", emoji: "🐸", name: "Frog Pluck", type: "pluck" },
    { id: "bird", emoji: "🐦", name: "Bird Whistle", type: "bird" },
    { id: "star", emoji: "⭐", name: "Star Bell", type: "bell" },
    { id: "heart", emoji: "❤️", name: "Heart Pad", type: "pad" },
    { id: "car", emoji: "🚗", name: "Car Beep", type: "beep" },
    { id: "robot", emoji: "🤖", name: "Robot", type: "robot" },
    { id: "drum", emoji: "🥁", name: "Drum", type: "drum" },
    { id: "clap", emoji: "👏", name: "Clap", type: "clap" }
  ];

  const PITCHES = ["C6", "B5", "A5", "G5", "F5", "E5", "D5", "C5", "B4", "A4", "G4", "F4"];
  const SEQ_STEPS = 32;

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

  // -----------------------------
  // Main navigation
  // -----------------------------

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
  // Music Maker
  // -----------------------------

  let audioCtx = null;
  let selectedInstrument = INSTRUMENTS[0].id;
  let sequence = makeSequence();
  let currentStep = 0;
  let musicTimer = null;
  let isMusicPlaying = false;

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
    gain.gain.exponentialRampToValueAtTime(gainValue, when + Math.min(.02, duration * .2));
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    gain.connect(ac.destination);
    return gain;
  }

  function tone(wave, frequency, when, duration, gainValue, detune = 0) {
    const ac = ensureAudio();
    const osc = ac.createOscillator();
    const gain = connectGain(gainValue, when, duration);
    osc.type = wave;
    osc.frequency.setValueAtTime(frequency, when);
    osc.detune.setValueAtTime(detune, when);
    osc.connect(gain);
    osc.start(when);
    osc.stop(when + duration + .03);
    return osc;
  }

  function noiseBurst(when, duration, gainValue, highpass) {
    const ac = ensureAudio();
    const buffer = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * duration)), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const gain = connectGain(gainValue, when, duration);
    if (highpass) {
      const filter = ac.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = highpass;
      src.connect(filter);
      filter.connect(gain);
    } else {
      src.connect(gain);
    }
    src.start(when);
  }

  function playInstrument(id, frequency, duration = .18, when) {
    const ac = ensureAudio();
    const start = when == null ? ac.currentTime : when;
    const instrument = instrumentById(id);
    if (!instrument) return;

    switch (instrument.type) {
      case "square":
        tone("square", frequency, start, duration, .10);
        tone("sine", frequency * 2, start, duration * .7, .025);
        break;
      case "bass":
        tone("sawtooth", frequency / 2, start, duration * 1.2, .11);
        break;
      case "pluck": {
        const osc = tone("triangle", frequency * 1.15, start, duration * .65, .12);
        osc.frequency.exponentialRampToValueAtTime(Math.max(50, frequency * .82), start + duration * .65);
        break;
      }
      case "bird": {
        const osc = tone("sine", frequency * 1.8, start, duration * .65, .075);
        osc.frequency.exponentialRampToValueAtTime(frequency * 2.45, start + duration * .32);
        osc.frequency.exponentialRampToValueAtTime(frequency * 1.9, start + duration * .65);
        break;
      }
      case "bell":
        tone("sine", frequency, start, duration * 1.8, .085);
        tone("sine", frequency * 2.01, start, duration * 1.3, .045);
        tone("sine", frequency * 3.98, start, duration, .018);
        break;
      case "pad":
        tone("triangle", frequency, start, duration * 1.8, .055, -7);
        tone("triangle", frequency, start, duration * 1.8, .055, 7);
        break;
      case "beep":
        tone("square", frequency * 1.25, start, duration * .55, .07);
        break;
      case "robot":
        tone("sawtooth", frequency, start, duration * .75, .065, -14);
        tone("square", frequency / 2, start, duration * .75, .045, 14);
        break;
      case "drum": {
        const kick = tone("sine", Math.max(65, frequency / 4), start, .18, .18);
        kick.frequency.exponentialRampToValueAtTime(42, start + .18);
        break;
      }
      case "clap":
        noiseBurst(start, .12, .13, 900);
        noiseBurst(start + .035, .08, .07, 1300);
        break;
      default:
        tone("sine", frequency, start, duration, .08);
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
        playInstrument(instrument.id, 440, .2);
      });
      bank.appendChild(button);
    });
  }

  function renderSequencer() {
    const sequencer = $("#sequencer");
    sequencer.innerHTML = "";

    const corner = document.createElement("div");
    corner.className = "seq-corner";
    sequencer.appendChild(corner);

    for (let step = 0; step < SEQ_STEPS; step += 1) {
      const header = document.createElement("div");
      header.className = "seq-step" + (step % 4 === 0 ? " measure" : "") + (isMusicPlaying && step === currentStep ? " playing" : "");
      header.textContent = step + 1;
      header.dataset.step = step;
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
        cell.className = "seq-cell" + (step % 4 === 0 ? " measure" : "") + (isMusicPlaying && step === currentStep ? " playing" : "");
        cell.dataset.row = row;
        cell.dataset.step = step;
        const id = sequence[row][step];
        const instrument = id ? instrumentById(id) : null;
        cell.textContent = instrument ? instrument.emoji : "";
        cell.setAttribute("aria-label", pitch + ", step " + (step + 1) + (instrument ? ", " + instrument.name : ", empty"));
        cell.addEventListener("click", () => {
          const old = sequence[row][step];
          sequence[row][step] = old === selectedInstrument ? null : selectedInstrument;
          const chosen = sequence[row][step];
          cell.textContent = chosen ? instrumentById(chosen).emoji : "";
          if (chosen) playInstrument(chosen, noteToFrequency(pitch), .2);
        });
        sequencer.appendChild(cell);
      }
    });
  }

  function refreshPlayhead() {
    $$(".seq-step").forEach((el) => {
      el.classList.toggle("playing", isMusicPlaying && Number(el.dataset.step) === currentStep);
    });
    $$(".seq-cell").forEach((el) => {
      el.classList.toggle("playing", isMusicPlaying && Number(el.dataset.step) === currentStep);
    });
  }

  function playStep(step) {
    const bpm = Number($("#tempoSlider").value);
    const stepDuration = (60 / bpm) / 4;
    const ac = ensureAudio();
    const now = ac.currentTime + .01;

    PITCHES.forEach((pitch, row) => {
      const id = sequence[row][step];
      if (id) playInstrument(id, noteToFrequency(pitch), Math.min(.36, stepDuration * .9), now);
    });
  }

  function scheduleNextStep() {
    if (!isMusicPlaying) return;
    const bpm = Number($("#tempoSlider").value);
    const baseMs = 60000 / bpm / 4;
    const swing = Number($("#swingSlider").value) / 100;
    const delay = currentStep % 2 === 0 ? baseMs * (1 + swing) : baseMs * (1 - swing);

    musicTimer = setTimeout(() => {
      currentStep = (currentStep + 1) % SEQ_STEPS;
      playStep(currentStep);
      refreshPlayhead();
      scheduleNextStep();
    }, delay);
  }

  function startMusic() {
    if (isMusicPlaying) return;
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

  $("#auditionBtn").addEventListener("click", () => {
    playInstrument(selectedInstrument, 440, .35);
  });

  $("#tempoSlider").addEventListener("input", (event) => {
    $("#tempoOut").textContent = event.target.value + " BPM";
    $("#tempoReadout").textContent = event.target.value;
  });

  $("#swingSlider").addEventListener("input", (event) => {
    $("#swingOut").textContent = event.target.value + "%";
  });

  $("#clearMusicBtn").addEventListener("click", () => {
    stopMusic();
    sequence = makeSequence();
    renderSequencer();
    toast("Song cleared");
  });

  $("#randomMusicBtn").addEventListener("click", () => {
    stopMusic();
    sequence = makeSequence();
    const melodic = INSTRUMENTS.filter((i) => !["drum", "clap"].includes(i.id));
    for (let step = 0; step < SEQ_STEPS; step += 1) {
      if (Math.random() < .68) {
        const row = Math.floor(Math.random() * PITCHES.length);
        sequence[row][step] = melodic[Math.floor(Math.random() * melodic.length)].id;
      }
      if (step % 4 === 0 && Math.random() < .9) {
        sequence[PITCHES.length - 1][step] = "drum";
      }
      if (step % 8 === 4 && Math.random() < .75) {
        sequence[PITCHES.length - 2][step] = "clap";
      }
    }
    renderSequencer();
    toast("New emoji remix");
  });

  function songPayload() {
    return {
      format: "emojiro-paint-song",
      version: 1,
      name: $("#songName").value || "My Emoji Song",
      tempo: Number($("#tempoSlider").value),
      swing: Number($("#swingSlider").value),
      pitches: PITCHES,
      steps: SEQ_STEPS,
      sequence
    };
  }

  function applySong(song) {
    if (!song || !Array.isArray(song.sequence)) throw new Error("Invalid song");
    stopMusic();
    sequence = song.sequence.map((row) => Array.from({ length: SEQ_STEPS }, (_, i) => row[i] || null));
    while (sequence.length < PITCHES.length) sequence.push(Array(SEQ_STEPS).fill(null));
    sequence = sequence.slice(0, PITCHES.length);
    $("#songName").value = song.name || "My Emoji Song";
    $("#tempoSlider").value = Math.max(60, Math.min(220, Number(song.tempo) || 120));
    $("#swingSlider").value = Math.max(0, Math.min(45, Number(song.swing) || 0));
    $("#tempoOut").textContent = $("#tempoSlider").value + " BPM";
    $("#tempoReadout").textContent = $("#tempoSlider").value;
    $("#swingOut").textContent = $("#swingSlider").value + "%";
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
      version: 1,
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
      if (event.shiftKey) $("#redoBtn").click();
      else $("#undoBtn").click();
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
  renderSequencer();
})();