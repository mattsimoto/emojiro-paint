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

async function loadApp(page, errors) {
  trackErrors(page, errors, "app");
  const response = await page.goto(BASE_URL, { waitUntil: "networkidle" });
  assert(response && response.ok(), "App did not return a successful HTTP response");
  await page.waitForSelector("#paintCanvas");
  assert.equal(await page.title(), "Emojiro Paint");
  await page.waitForTimeout(250);
  assert.deepEqual(errors, [], "Startup browser errors occurred:\n" + errors.join("\n"));
}

async function desktopSmoke(browser) {
  const errors = [];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true
  });
  const page = await context.newPage();
  await loadApp(page, errors);

  assert.equal(await page.locator("#paintCanvas").isVisible(), true, "Paint canvas should be visible");
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

  assert.equal(await page.locator("#instrumentBank button").count(), 15, "All 15 instruments should render");
  assert.equal(await page.locator("#arrangementOverview .arrangement-card").count(), 4, "Song Map should show four sections");
  assert.equal(await page.locator("#percussionGrid .percussion-cell").count(), 96, "Selected section should show four 24-beat percussion lanes");
  assert.equal(await page.locator("#liveKeyboard .live-key").count(), 13, "Live Keys should span 13 notes");

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
  await page.click("#saveNamedProjectBtn");
  assert.equal(await page.locator("#projectLibraryList .project-entry").count(), 1, "Named project should save locally");
  await page.click("#closeProjectsBtn");

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
    acceptDownloads: true
  });
  const page = await context.newPage();
  trackErrors(page, errors, "mobile");

  const response = await page.goto(BASE_URL, { waitUntil: "networkidle" });
  assert(response && response.ok(), "Mobile app load failed");
  await page.waitForSelector("#paintCanvas");

  await page.click('.mode-tab[data-panel="musicPanel"]');
  await page.waitForSelector("#musicPanel.active");
  assert.equal(await page.locator("#arrangementOverview .arrangement-card").count(), 4, "Mobile Song Map should render");
  assert.equal(await page.locator("#liveKeyboard .live-key").count(), 13, "Mobile Live Keys should render");

  const bodyOverflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));
  assert(
    bodyOverflow.scrollWidth <= bodyOverflow.innerWidth + 2,
    "Page body overflows mobile viewport: " + JSON.stringify(bodyOverflow)
  );

  await page.click("#compactComposerToggle");
  assert.equal(await page.locator("#sequencer").evaluate((el) => el.classList.contains("compact")), true, "Compact composer should activate");

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
