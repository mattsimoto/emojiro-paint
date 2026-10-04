import assert from "node:assert/strict";
import { chromium, devices } from "playwright";

const BASE_URL = process.env.EMOJIRO_URL || "http://127.0.0.1:8000";

function trackErrors(page, bucket, label) {
  page.on("pageerror", (error) => {
    bucket.push(label + " pageerror: " + error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      bucket.push(label + " console: " + message.text());
    }
  });
}

async function controlContrast(page, selector) {
  return page.locator(selector).first().evaluate((el) => {
    const parse = (value) => {
      const match = String(value).match(/[\d.]+/g);
      return match ? match.slice(0, 3).map(Number) : [0, 0, 0];
    };
    const luminance = (rgb) => {
      const channels = rgb.map((value) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const style = getComputedStyle(el);
    const fg = luminance(parse(style.color));
    const bg = luminance(parse(style.backgroundColor));
    return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
  });
}

async function loadApp(page, errors) {
  trackErrors(page, errors, "app");
  const response = await page.goto(BASE_URL, { waitUntil: "networkidle" });
  assert(response && response.ok(), "App did not return a successful HTTP response");
  await page.waitForSelector("#musicPanel.active");
  assert.equal(await page.title(), "Emojiro Paint");
  await page.waitForTimeout(250);
  assert.deepEqual(errors, [], "Startup browser errors occurred:\n" + errors.join("\n"));
}

async function desktopSmoke(browser) {
  const errors = [];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
    permissions: ["clipboard-read", "clipboard-write"]
  });
  const page = await context.newPage();
  await loadApp(page, errors);

  const fullBleedBands = await page.evaluate(() => {
    const header = document.querySelector(".topbar").getBoundingClientRect();
    const nav = document.querySelector(".primary-nav").getBoundingClientRect();
    return {
      viewport: document.documentElement.clientWidth,
      headerLeft: header.left,
      headerRight: header.right,
      navLeft: nav.left,
      navRight: nav.right
    };
  });
  assert(Math.abs(fullBleedBands.headerLeft) <= 1, "Header band should start at the desktop viewport edge");
  assert(Math.abs(fullBleedBands.headerRight - fullBleedBands.viewport) <= 1, "Header band should span the full desktop viewport");
  assert(Math.abs(fullBleedBands.navLeft) <= 1, "Navigation band should start at the desktop viewport edge");
  assert(Math.abs(fullBleedBands.navRight - fullBleedBands.viewport) <= 1, "Navigation band should span the full desktop viewport");

  const headerGeometry = await page.evaluate(() => {
    const theme = document.querySelector("#themeToggleBtn");
    const projects = document.querySelector("#projectsBtn");
    const themeIcon = theme?.querySelector(".theme-toggle-icon");
    const projectIcon = projects?.querySelector(".header-icon-glyph");
    const rect = (el) => el ? el.getBoundingClientRect() : null;
    const centerDelta = (button, icon) => {
      const b = rect(button);
      const i = rect(icon);
      if (!b || !i) return 999;
      const bx = b.left + b.width / 2;
      const by = b.top + b.height / 2;
      const ix = i.left + i.width / 2;
      const iy = i.top + i.height / 2;
      return Math.max(Math.abs(bx - ix), Math.abs(by - iy));
    };
    return {
      theme: rect(theme),
      projects: rect(projects),
      themeCenterDelta: centerDelta(theme, themeIcon),
      projectCenterDelta: centerDelta(projects, projectIcon)
    };
  });
  assert(Math.abs(headerGeometry.theme.width - headerGeometry.projects.width) <= 1, "Header utility buttons should share the same diameter");
  assert(Math.abs(headerGeometry.theme.height - headerGeometry.projects.height) <= 1, "Header utility buttons should share the same height");
  assert(headerGeometry.themeCenterDelta <= 2.5, "Theme icon should be centered in its circle");
  assert(headerGeometry.projectCenterDelta <= 2.5, "Projects icon should be centered in its circle");

  assert.equal(await page.locator("#musicPanel").isVisible(), true, "Music Maker should be the default screen");
  assert.equal(await page.locator("#paintPanel").isVisible(), false, "Visual tools should start out of the way");
  assert.equal(await page.locator("#arrangementOverview").isVisible(), false, "Advanced music cards should start collapsed");

  await page.click("#themeToggleBtn");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark", "Dark mode should apply on desktop");
  assert.equal(await page.locator("#themeToggleBtn").getAttribute("aria-pressed"), "true", "Theme toggle should expose dark state");
  assert.equal(await page.evaluate(() => localStorage.getItem("emojiro-paint-theme-v1")), "dark", "Dark mode should persist locally");
  for (const selector of ["#playMusicBtn", "#undoMusicBtn", "#themeToggleBtn", "#sectionBar .section-button.active", "#instrumentBank .instrument-button"]) {
    assert(
      await controlContrast(page, selector) >= 4.5,
      selector + " should maintain readable dark-mode contrast"
    );
  }
  assert.equal(
    await page.evaluate(() => localStorage.getItem("emojiro-paint-theme-v1")),
    "dark",
    "Persisted dark mode should be available to the next load"
  );

  await page.locator("#moreModeMenu summary").click();
  await page.click('.mode-tab[data-panel="paintPanel"]');
  await page.waitForSelector("#paintPanel.active");
  assert.equal(await page.locator("#paintCanvas").isVisible(), true, "Visual tools should remain available from More");
  assert.equal(await page.locator("#frameList .frame-thumb").count(), 1, "Fresh project should start with one frame");

  const canvas = page.locator("#paintCanvas");
  const box = await canvas.boundingBox();
  assert(box, "Canvas must have a layout box");
  await page.mouse.move(box.x + 40, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 110, box.y + 80, { steps: 6 });
  await page.mouse.up();

  await page.click("#openStampMakerBtn");
  assert.equal(await page.locator("#stampMakerDialog").evaluate((el) => el.open), true, "Stamp workshop should open");
  await page.locator("#stampMakerDialog button[value=cancel]").click();
  assert.equal(await page.locator("#stampMakerDialog").evaluate((el) => el.open), false, "Stamp workshop should close");

  await page.click('.mode-tab[data-panel="musicPanel"]');
  await page.waitForSelector("#musicPanel.active");
  assert.equal(await page.locator("#musicToolsToggle").getAttribute("aria-pressed"), "false", "Advanced tools should start closed");
  await page.click("#musicToolsToggle");
  assert.equal(await page.locator("#musicToolsToggle").getAttribute("aria-pressed"), "true", "Tools button should reveal advanced controls");

  assert.equal(await page.locator("#instrumentBank button").count(), 55, "All 55 instruments should render");
  assert.equal(
    await page.evaluate(() => {
      const grid = document.querySelector("#sequencerScroll");
      const sections = document.querySelector("#sectionBar");
      return Boolean(grid && sections && (grid.compareDocumentPosition(sections) & Node.DOCUMENT_POSITION_FOLLOWING));
    }),
    true,
    "Section buttons should sit below the sequencer grid"
  );
  for (const label of ["Cow Moo", "Ship Horn", "Bell Ring", "Violin Bow", "Vocal Ah", "Laugh", "Scream", "Hmm"]) {
    const instrument = page.locator('#instrumentBank .instrument-button[aria-label="' + label + '"]');
    assert.equal(await instrument.count(), 1, label + " should be available");
    await instrument.click();
    await page.waitForTimeout(40);
  }
  assert.equal(await page.locator("#arrangementOverview .arrangement-card").count(), 4, "Song Map should show four sections");
  assert.equal(await page.locator("#percussionGrid .percussion-cell").count(), 96, "Selected section should show four 24-beat percussion lanes");
  assert.equal(await page.locator("#liveKeyboard .live-key").count(), 13, "Live Keys should span 13 notes");
  assert.equal(await page.locator("#sectionInstrumentPalette .section-palette-chip").count(), 55, "Section palette should show all instruments");

  await page.locator("#sectionInstrumentPalette .section-palette-chip").first().click();
  assert.equal(await page.locator("#instrumentBank .instrument-button").first().isDisabled(), true, "Section palette should constrain the instrument bank");
  await page.click("#sectionPaletteAllBtn");
  assert.equal(await page.locator("#instrumentBank .instrument-button").first().isDisabled(), false, "All instruments should restore the bank");

  await page.click("#saveSectionMixBtn");
  assert.match(await page.locator("#sectionMixStatus").textContent(), /Snapshot active/, "Mixer snapshot should save");
  await page.locator("#instrumentMixer input[type=range]").first().evaluate((el) => {
    el.value = "20";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.click("#recallSectionMixBtn");
  assert.equal(await page.locator("#instrumentMixer input[type=range]").first().inputValue(), "100", "Mixer snapshot should recall saved values");

  assert.equal(await page.locator("#compactShareToggle").isChecked(), true, "Compressed share links should default on");
  await page.click("#shareSongBtn");
  await page.waitForTimeout(250);
  const sharedLink = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(sharedLink, /#songz=|#song=/, "Share button should copy a song link");

  await page.click("#insertChordBtn");
  assert(
    await page.locator("#sequencer .seq-cell").evaluateAll((cells) => cells.some((cell) => cell.textContent.trim().length > 0)),
    "Chord insertion should add notes to the sequencer"
  );

  await page.click("#applyDrumPresetBtn");
  assert(
    await page.locator("#percussionGrid .percussion-cell.active").count() > 0,
    "Drum preset should activate percussion cells"
  );

  await page.check("#sectionTempoToggle");
  await page.locator("#sectionTempoSlider").evaluate((el) => {
    el.value = "90";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  assert.match(await page.locator("#sectionTempoOut").textContent(), /90 BPM/, "Section tempo override should update");

  await page.locator("#humanizeSlider").evaluate((el) => {
    el.value = "18";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  assert.match(await page.locator("#humanizeOut").textContent(), /18 ms/, "Humanize control should update");

  await page.click("#playMusicBtn");
  await page.waitForTimeout(350);
  assert.match(await page.locator("#playMusicBtn").textContent(), /Playing|Section/, "Transport should enter playback state");
  await page.click("#stopMusicBtn");
  assert.match(await page.locator("#playMusicBtn").textContent(), /Play/, "Transport should stop cleanly");

  await page.click("#projectsBtn");
  assert.equal(await page.locator("#projectLibraryDialog").evaluate((el) => el.open), true, "Project library should open");
  await page.fill("#projectNameInput", "Browser Smoke Project");
  await page.locator(".cloud-sync-card summary").click();
  await page.click("#generateCloudCodeBtn");
  assert((await page.locator("#cloudSyncCode").inputValue()).length >= 20, "Cloud sync should generate a strong sync code");
  await page.click("#saveNamedProjectBtn");
  assert.equal(await page.locator("#projectLibraryList .project-entry").count(), 1, "Named project should save locally");
  await page.click("#closeProjectsBtn");

  await page.click("#titleToyBtn");
  assert(await page.locator("#titleToyStage .title-toy-sprite").count() > 0, "Title toy should create emoji sprites");

  await page.locator("#moreModeMenu summary").click();
  await page.click('.mode-tab[data-panel="toyPanel"]');
  await page.waitForSelector("#toyPanel.active");
  assert.equal(await page.locator("#catchGameCanvas").isVisible(), true, "Emoji Catch should be visible");
  await page.click("#startCatchGameBtn");
  await page.waitForTimeout(120);
  assert.match(await page.locator("#catchGameStatus").textContent(), /seconds/, "Emoji Catch should run");

  await page.click("#startRelayBtn");
  await page.waitForTimeout(80);
  const activeRelay = page.locator("#rhythmRelayBoard .relay-pad.active");
  assert.equal(await activeRelay.count(), 1, "Rhythm Relay should light one lane");
  await activeRelay.click();
  assert(Number(await page.locator("#relayScore").textContent()) >= 2, "Rhythm Relay should score a correct hit");

  await page.click('.mode-tab[data-panel="musicPanel"]');
  const duration = await page.locator("#songDurationReadout").textContent();
  assert.match(duration, /^\d+:\d{2}$/, "Song Map should show a duration");

  const swSupported = await page.evaluate(() => "serviceWorker" in navigator);
  if (swSupported) {
    await page.evaluate(async () => {
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Service worker readiness timeout")), 5000))
      ]);
    });
  }

  await page.waitForTimeout(150);
  assert.deepEqual(errors, [], "Browser errors occurred:\n" + errors.join("\n"));

  await context.close();
}

async function mobileSmoke(browser) {
  const errors = [];
  const context = await browser.newContext({
    ...devices["Pixel 7"],
    acceptDownloads: true,
    permissions: ["clipboard-read", "clipboard-write"]
  });
  const page = await context.newPage();
  trackErrors(page, errors, "mobile");

  const response = await page.goto(BASE_URL, { waitUntil: "networkidle" });
  assert(response && response.ok(), "Mobile app load failed");
  await page.waitForSelector("#musicPanel.active");
  const mobileBands = await page.evaluate(() => {
    const header = document.querySelector(".topbar").getBoundingClientRect();
    const nav = document.querySelector(".primary-nav").getBoundingClientRect();
    return {
      viewport: document.documentElement.clientWidth,
      headerLeft: header.left,
      headerRight: header.right,
      navLeft: nav.left,
      navRight: nav.right
    };
  });
  assert(Math.abs(mobileBands.headerLeft) <= 1, "Mobile header band should start at the viewport edge");
  assert(Math.abs(mobileBands.headerRight - mobileBands.viewport) <= 1, "Mobile header band should span the viewport");
  assert(Math.abs(mobileBands.navLeft) <= 1, "Mobile navigation band should start at the viewport edge");
  assert(Math.abs(mobileBands.navRight - mobileBands.viewport) <= 1, "Mobile navigation band should span the viewport");

  const mobileHeaderGeometry = await page.evaluate(() => {
    const header = document.querySelector(".topbar").getBoundingClientRect();
    const actions = document.querySelector(".top-actions").getBoundingClientRect();
    const theme = document.querySelector("#themeToggleBtn").getBoundingClientRect();
    const projects = document.querySelector("#projectsBtn").getBoundingClientRect();
    return {
      headerRight: header.right,
      viewport: document.documentElement.clientWidth,
      actionsTop: actions.top,
      actionsBottom: actions.bottom,
      themeWidth: theme.width,
      themeHeight: theme.height,
      projectsWidth: projects.width,
      projectsHeight: projects.height
    };
  });
  assert(mobileHeaderGeometry.headerRight <= mobileHeaderGeometry.viewport + 1, "Mobile header should fit inside the viewport");
  assert(Math.abs(mobileHeaderGeometry.themeWidth - mobileHeaderGeometry.projectsWidth) <= 1, "Mobile header circles should have equal width");
  assert(Math.abs(mobileHeaderGeometry.themeHeight - mobileHeaderGeometry.projectsHeight) <= 1, "Mobile header circles should have equal height");

  assert.equal(await page.locator("#musicPanel").isVisible(), true, "Mobile should open directly to Music");
  assert.equal(await page.locator("#paintPanel").isVisible(), false, "Mobile visual tools should be secondary");

  await page.click("#themeToggleBtn");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark", "Mobile dark mode should apply");
  assert(
    await controlContrast(page, "#themeToggleBtn") >= 4.5,
    "Mobile theme toggle should maintain readable dark-mode contrast"
  );
  assert(
    await controlContrast(page, "#playMusicBtn") >= 4.5,
    "Mobile play button should maintain readable dark-mode contrast"
  );
  assert.equal(await page.locator("#arrangementOverview .arrangement-card").count(), 4, "Mobile Song Map should render");
  assert.equal(await page.locator("#liveKeyboard .live-key").count(), 13, "Mobile Live Keys should render");
  assert.equal(await page.locator("#arrangementOverview").isVisible(), false, "Mobile advanced cards should stay hidden by default");
  assert.equal(await page.locator("#sequencer").evaluate((el) => el.classList.contains("compact")), true, "Mobile composer should start compact");
  assert.equal(await page.locator("#sequencer .seq-step").count(), 24, "Mobile composer should show one 24-beat section");
  assert.equal(
    await page.evaluate(() => {
      const grid = document.querySelector("#sequencerScroll");
      const sections = document.querySelector("#sectionBar");
      return Boolean(grid && sections && (grid.compareDocumentPosition(sections) & Node.DOCUMENT_POSITION_FOLLOWING));
    }),
    true,
    "Mobile section row should remain below the music grid"
  );

  await page.locator("#sectionBar .section-button").nth(1).click();
  assert.equal(await page.locator("#sequencer .seq-step").count(), 24, "Changing sections should keep the mobile staff at 24 beats");
  assert.equal((await page.locator("#sequencer .seq-step").first().textContent()).trim(), "25", "Section B should start at beat 25");

  await page.locator("#moreModeMenu summary").click();
  await page.click('.mode-tab[data-panel="toyPanel"]');
  await page.waitForSelector("#toyPanel.active");
  assert.equal(await page.locator("#rhythmRelayBoard .relay-pad").count(), 4, "Mobile Rhythm Relay should render four pads");
  await page.click('.mode-tab[data-panel="musicPanel"]');
  await page.waitForSelector("#musicPanel.active");

  const bodyOverflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));
  assert(
    bodyOverflow.scrollWidth <= bodyOverflow.innerWidth + 2,
    "Page body overflows mobile viewport: " + JSON.stringify(bodyOverflow)
  );

  await page.waitForTimeout(100);
  assert.deepEqual(errors, [], "Mobile browser errors occurred:\n" + errors.join("\n"));

  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await desktopSmoke(browser);
  await mobileSmoke(browser);
  console.log("Emojiro browser smoke passed: desktop and Pixel 7 workflows completed without runtime errors.");
} finally {
  await browser.close();
}
