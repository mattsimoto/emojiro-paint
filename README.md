# Emojiro Paint 🎨🎵

Emojiro Paint is a touch-friendly browser creativity toy inspired by the spirit of classic console paint programs. It uses original interface code, browser-synthesized audio, and standard Unicode emoji rather than Nintendo art or audio assets.

## Milestone 1

The first working version includes:

- **Paint Studio**
  - 32 × 24 pixel-cell canvas
  - Pencil, emoji stamp, eraser, flood fill, line, and box tools
  - 18-color palette
  - 40 emoji stamps
  - Undo and redo
  - PNG export
- **Animation**
  - Add, duplicate, delete, and switch frames
  - Adjustable 1–12 FPS flipbook preview
- **Music Maker**
  - 96-beat staff-style composer spanning B3–G5
  - 15 emoji instruments with synthesized melodic, animal, percussion, organ, guitar, and bass voices
  - Browser-generated lead, bass, pluck, whistle, bell, pad, beep, robot, drum, and clap sounds
  - Tempo from 40–480 BPM
  - 3/4 and 4/4 time signatures
  - Up to three simultaneous notes per beat
  - Placeable end marker, looping, undo, and three original demo songs\n  - Song save/load in local storage
  - JSON song import/export
- **Project storage**
  - Save and restore the complete paint/animation/music project locally
- **Mobile support**
  - Touch painting
  - Large controls
  - Scrollable sequencer
  - Installable web-app manifest

## Run locally

No dependencies or build step are required.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

You can also open `index.html` directly, although a local web server is preferable for install/PWA behavior.

## GitHub Pages

Because the app is fully static, it can be hosted directly from the repository root using GitHub Pages:

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main** and **/(root)**.
4. Save.

## Controls

### Paint

Choose a tool, then draw directly on the canvas. Choosing an emoji stamp automatically switches to the Stamp tool. Line and Box tools preview while dragging.

### Music

Choose an emoji instrument, then place it anywhere on the note grid. Selecting an occupied cell replaces its instrument; selecting the same instrument again removes the note. Press **Space** to play/stop while Music Maker is active.

## Architecture

The project intentionally starts with plain HTML, CSS, and JavaScript:

- `index.html` — interface structure
- `styles.css` — responsive retro UI
- `app.js` — drawing, animation, Web Audio synth, sequencing, and persistence
- `manifest.webmanifest` — installable app metadata
- `favicon.svg` — original Emojiro icon

That keeps GitHub Pages deployment simple and makes the app easy to run on old or low-powered hardware.

## Planned expansion

The next milestones can add a more complete console-toy feel:

- staff-style music notation mode
- longer songs and song sections
- copy/paste measures and notes
- per-instrument volume and mute
- octave and scale controls
- MIDI export
- WAV recording/export
- animation onion skinning
- shape tools and patterned brushes
- custom emoji/sticker favorites
- image import and pixelation
- animated GIF/WebM export
- autosave and named project gallery
- classic-style easter eggs and mini-games built from original assets
- offline service worker support
- shareable song/project URLs

## Browser notes

Emoji appearance varies by operating system because the app uses each device's native emoji font. That is intentional: iPhone/iPad, Android, Windows, and macOS may render the same composition slightly differently.
