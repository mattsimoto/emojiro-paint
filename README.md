# Emojiro Paint 🎨🎵

Emojiro Paint is a touch-friendly browser creativity toy inspired by classic console paint programs. It uses original interface code, browser-synthesized audio, and standard Unicode emoji rather than Nintendo art or audio assets.

## Current build

### 🎵 Music-first interface

- Color-blocked Aria-style UI: turquoise page bands, cream work surfaces, pink/purple/mint/orange modules, yellow action accents, thick ink outlines, and monospace display typography
- Persistent light/dark theme toggle with high-contrast dark surfaces, controls, sequencer cells, dialogs, and mobile states
- Song section buttons now live directly beneath the music grid instead of above the instrument/composer workspace

- Music Maker is now the default screen
- Paint/animation tools, Toy Box, and About live under a secondary **More** menu
- The normal composer view shows only transport/tempo, four sections, the instrument strip, and the staff
- One **Tools** button reveals the advanced section editor, mixer, percussion, generators, demos, exports, and other occasional controls
- Play toggles playback on/off, removing the need for a permanent separate Stop control
- On phones, the staff renders one 24-beat section at a time instead of the full 96-beat song
- Selecting Section A–D changes the mobile staff immediately; playback follows sections automatically
- Mobile instruments use a compact horizontally scrollable emoji strip
- The transport stays visible while composing on mobile

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
- Identity-based examples include 🐶 Dog Bark, 🐮 Cow Moo, 🐸 Frog Croak, 🐘 Elephant Trumpet, 🐝 Bee Buzz, 🐺 Wolf Howl, 🚂 Train Chug, 🚁 Helicopter Chop, 🚀 Rocket Launch, 🚢 Ship Horn, 🚗 Car Horn, 🔔 Bell Ring, 🎸 Guitar Strum, 🎹 Piano Key, 🎻 Violin Bow, 🥁 Snare Drum, 👻 Ghost Wail, and 💧 Water Drop
- Face-vocal bank: 😀 Vocal Ah, 😮 Vocal Ooh, 😂 Laugh, 😭 Cry, 😱 Scream, 😴 Snore, 😡 Growl, 🤭 Giggle, 🤧 Sneeze, 😘 Kiss, 🤔 Hmm, and 🥳 Hey!
- 55 emoji instruments with identity-based synthesized voices spanning animals, vehicles, bells, musical instruments, game sounds, effects, and face-emoji vocals
- Tempo from 40–480 BPM
- 3/4 and 4/4 time signatures
- Up to three simultaneous notes per beat
- Placeable end marker
- Looping and music undo
- Measure selection plus copy, paste, and clear
- Four 24-beat song sections with rename, copy/paste, duplicate, variation, clear, and reorder controls
- Interactive Song Map with section tempo, note count, percussion count, duration, and 24-beat activity strips
- Optional 40–480 BPM tempo override for each section
- Section-only playback with optional section looping
- Composer zoom plus compact notation mode for small screens
- Scale guides for natural-note composition
- One-tap natural-note triad insertion using the selected emoji instrument
- Four chord-progression templates with block, ascending-arpeggio, and descending-arpeggio fills
- Optional drag-to-paint note entry for mouse, pen, and touch
- 13-note on-screen Live Keys keyboard spanning B3–G5
- Quantized live recording into the current beat with one-undo take grouping
- Four independent percussion lanes using 🍄 kick, 🥁 snare, ⏰ tick, and 🎮 zap voices, with editable 24-beat section grids and rhythm presets
- Pattern Lab random melody generation using the active scale guide and adjustable density
- Deterministic 0–60 ms humanization applied consistently to playback, MIDI, WAV, and music-video timing
- Per-instrument volume, mute, solo, stereo pan, tone filter, and echo controls
- Section-level instrument palettes that can constrain editing to a focused subset of instruments
- Section-level mixer snapshots that automatically affect live playback, MIDI, WAV, and music-video export
- Three original demo songs
- Song save/load in local storage
- JSON song import/export
- Shareable song links that load directly from the page hash
- Optional gzip-compressed share links for dense songs, with automatic fallback to the older plain format
- Standard MIDI file export
- Offline-rendered stereo WAV export with mixer effects
- Combined animation + soundtrack video export using browser MediaRecorder
- Video export presets for 16:9 landscape, 1:1 square, 9:16 portrait, and the native 4:3 canvas

### 💾 Project storage

- Automatic session autosave and recovery
- Quick save/load slot
- Named on-device project library
- Up to 8 named projects with open, delete, and individual export controls
- Full-project JSON import/export for moving projects between devices
- Optional encrypted Supabase cloud-library sync using a user-owned project, publishable key, and high-entropy sync code
- Cloud pull merges projects by project ID and keeps the newer copy
- Save and restore the complete paint, animation, custom-stamp, mixer, section, and music state locally
- No account or server is required for normal use

### 🕹️ Toy Box

- Clickable title-logo toy that bursts emoji across the header
- **Emoji Catch** — a 30-second pointer/touch catch game with local best score
- **Rhythm Relay** — a four-lane reflex/rhythm game using Emojiro instrument sounds
- Mini-game scores are local-only and do not modify projects

### 📱 Mobile support

- Large touch controls
- Touch painting and stamp editing
- 24-beat section-focused music staff on phones
- Responsive layouts
- Installable web-app manifest
- Offline app-shell caching through a service worker

## Run locally

No dependencies or build step are required.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

Emojiro Paint includes a ready-to-run GitHub Pages deployment workflow.

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open **Actions → Deploy Emojiro Paint to GitHub Pages**.
4. Choose **Run workflow** on `main`.

After that first deployment, the site URL will be shown in the workflow's `github-pages` deployment environment. The repository's Chromium runtime validation is separate, so app tests remain green even before Pages is enabled.

## Controls

### Paint

Choose a tool and draw directly on the canvas. Selecting an emoji or custom stamp automatically switches to its stamp tool. Line, Box, and Ellipse preview while dragging.

The Custom Stamp Workshop creates reusable 8 × 8 pixel designs. Transparent pixels do not overwrite the painting when the stamp is placed.

### Animation

Use the frame strip to add, duplicate, delete, reorder, or select frames. **Onion skin** shows the previous frame faintly behind the current frame. Set **Frame beats** per frame and enable **Beat-lock animation to composer** to drive the animation directly from the music sequencer's beat clock.

### Music

Emojiro opens directly to Music Maker. Choose an emoji instrument, then place it on the staff. On phones, use the four section buttons to move through the 96-beat song in compact 24-beat pages. The default view keeps only the essential composition controls visible; tap **Tools** when you need arrangement, mixer, percussion, generation, or export controls. Each beat supports up to three simultaneous notes. Selecting the same instrument in the same cell removes it. Tap any beat to select its measure, then copy, paste, or clear the measure. The 96-beat song is also organized into four editable 24-beat sections that can be renamed, duplicated, moved, copied, pasted, or cleared. The mixer controls volume, mute, solo, stereo pan, tone filtering, and echo for each emoji instrument. Each section can also define its own instrument palette and save a mixer snapshot that automatically takes over for that section during playback and export. Sections can be auditioned independently, looped while editing, and assigned their own tempo. Copying, moving, duplicating, or creating a variation carries the section's melody, percussion pattern, and tempo together. Scale guides can dim notes outside the selected natural-note scale, chord helpers insert a triad at the selected beat, and **Drag to paint notes** turns the sequencer into a touch-friendly note brush. Progression templates can fill the selected section with block chords or arpeggios, while **Live Keys** can be played from the on-screen keyboard or A/W/S/E/D/F/T/G/Y/H/U/J/K computer keys and quantized directly into the active beat. Press **Space** to play or stop while Music Maker is active.

## Optional cloud sync setup

Cloud sync is deliberately opt-in. Emojiro does not need a backend for local use.

1. Choose or create a Supabase project.
2. Run `supabase-cloud-sync.sql` once in that project's SQL Editor.
3. In Emojiro Paint, open **Projects → Cloud Sync**.
4. Enter the project's URL and **publishable** key.
5. Generate a sync code, then use **Push library**.
6. On another device, enter the same URL, publishable key, and sync code, then choose **Pull & merge**.

The sync code is hashed for row access, and the project-library payload is encrypted in the browser with AES-GCM before upload. Do not use a Supabase secret/service-role key in the browser.

## Architecture

The project intentionally remains plain HTML, CSS, and JavaScript:

- `index.html` — application structure
- `styles.css` — shared responsive retro UI
- `paint-plus.css` — custom stamp and animation UI
- `composer.css` — expanded music composer UI
- `project-library.css` — named project, autosave, and optional cloud-sync UI
- `toybox.css` — title toy and mini-game UI
- `app.js` — painting, stamps, animation, Web Audio synthesis, sequencing, persistence, cloud encryption/sync, and mini-games
- `manifest.webmanifest` — installable app metadata
- `favicon.svg` — original Emojiro icon
- `sw.js` — offline service worker
- `supabase-cloud-sync.sql` — optional encrypted cloud-sync table, grants, and RLS setup
- `tests/validate.mjs` — DOM/control smoke validation
- `.github/workflows/validate.yml` — syntax, smoke, and required-file validation

## Next milestones

- Per-section automation curves for mixer/effects
- More Toy Box games and unlockable cosmetic toys
- Project thumbnails and search/filtering in the library
- Optional authenticated cloud accounts in addition to sync-code mode
- Shareable full-project links for small projects

## Browser notes

Emoji appearance varies by operating system because Emojiro Paint uses each device's native emoji font. iPhone/iPad, Android, Windows, and macOS may therefore render the same emoji composition slightly differently.
