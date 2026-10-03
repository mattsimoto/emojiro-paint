# Emojiro Paint 🎨🎵

Emojiro Paint is a touch-friendly browser creativity toy inspired by classic console paint programs. It uses original interface code, browser-synthesized audio, and standard Unicode emoji rather than Nintendo art or audio assets.

## Current build

### 🎨 Paint Studio

- 32 × 24 pixel-cell canvas
- Pencil, eraser, flood fill, line, box, ellipse, spray, and text tools
- 18-color palette
- Solid, checker, dots, and rainbow brush patterns
- Optional filled rectangles and ellipses
- 40 built-in emoji stamps
- **8 × 8 Custom Stamp Workshop**
  - draw reusable pixel stamps
  - create, edit, duplicate, and delete up to 24 custom stamps
  - stamps persist on the device and inside saved projects
- Image import with automatic 32 × 24 palette pixelation
- Undo and redo
- PNG export
- Mouse, pen, and touch input

### 🎞️ Animation

- Add, duplicate, delete, and reorder frames
- Adjustable 1–12 FPS flipbook preview
- Per-frame 1–8 beat timing
- Optional previous-frame onion skin
- Beat-locked animation playback driven by the Emoji Composer timeline
- Frame thumbnails with beat-duration badges
- Animated GIF export
- WebM animation export where browser-supported

### 🎵 Emoji Composer

- 96-beat staff-style composer spanning B3–G5
- 15 emoji instruments with synthesized melodic, animal, percussion, organ, guitar, and bass voices
- Tempo from 40–480 BPM
- 3/4 and 4/4 time signatures
- Up to three simultaneous notes per beat
- Placeable end marker
- Looping and music undo
- Measure selection plus copy, paste, and clear
- Per-instrument volume and mute mixer
- Three original demo songs
- Song save/load in local storage
- JSON song import/export
- Standard MIDI file export

### 💾 Project storage

- Save and restore the complete paint, animation, custom-stamp, and music state locally
- No account or server is required

### 📱 Mobile support

- Large touch controls
- Touch painting and stamp editing
- Horizontally scrollable music staff
- Responsive layouts
- Installable web-app manifest

## Run locally

No dependencies or build step are required.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

Because Emojiro Paint is fully static, it can be hosted directly from the repository root:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main** and **/(root)**.
4. Save.

## Controls

### Paint

Choose a tool and draw directly on the canvas. Selecting an emoji or custom stamp automatically switches to its stamp tool. Line, Box, and Ellipse preview while dragging.

The Custom Stamp Workshop creates reusable 8 × 8 pixel designs. Transparent pixels do not overwrite the painting when the stamp is placed.

### Animation

Use the frame strip to add, duplicate, delete, reorder, or select frames. **Onion skin** shows the previous frame faintly behind the current frame. Set **Frame beats** per frame and enable **Beat-lock animation to composer** to drive the animation directly from the music sequencer's beat clock.

### Music

Choose an emoji instrument, then place it on the staff. Each beat supports up to three simultaneous notes. Selecting the same instrument in the same cell removes it. Tap any beat to select its measure, then copy, paste, or clear the measure. The mixer controls each emoji instrument independently. Press **Space** to play or stop while Music Maker is active.

## Architecture

The project intentionally remains plain HTML, CSS, and JavaScript:

- `index.html` — application structure
- `styles.css` — shared responsive retro UI
- `paint-plus.css` — custom stamp and animation UI
- `composer.css` — expanded music composer UI
- `app.js` — painting, stamps, animation, Web Audio synthesis, sequencing, and persistence
- `manifest.webmanifest` — installable app metadata
- `favicon.svg` — original Emojiro icon
- `.github/workflows/validate.yml` — basic syntax and file validation

## Next milestones

- WAV/audio recording export
- Song sections and section duplication
- Per-instrument solo and pan
- Composer zoom and compact mobile notation view
- Autosave and named project gallery
- Offline service worker support
- Shareable song/project files
- Original mini-games and interactive title-screen toys

## Browser notes

Emoji appearance varies by operating system because Emojiro Paint uses each device's native emoji font. iPhone/iPad, Android, Windows, and macOS may therefore render the same emoji composition slightly differently.
