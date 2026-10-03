import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const js = fs.readFileSync("app.js", "utf8");

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const idSet = new Set(ids);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

if (duplicates.length) {
  throw new Error("Duplicate HTML ids: " + [...new Set(duplicates)].join(", "));
}

const idRefs = [...js.matchAll(/(?<!\$)\$\("#([A-Za-z][\w:-]*)"\)/g)].map((match) => match[1]);
const missingIds = [...new Set(idRefs.filter((id) => !idSet.has(id)))];

if (missingIds.length) {
  throw new Error("JavaScript references missing HTML ids: " + missingIds.join(", "));
}

const singleHelperCollections = js.match(/(?<!\$)\$\([^\n;]+\)\.forEach/g) || [];
if (singleHelperCollections.length) {
  throw new Error("Single-element $ helper used as a collection: " + singleHelperCollections.join(" | "));
}

const requiredIds = [
  "paintCanvas",
  "stampMakerDialog",
  "importImageInput",
  "frameBeats",
  "exportGifBtn",
  "exportWebmBtn",
  "instrumentMixer",
  "copyMeasureBtn",
  "pasteMeasureBtn",
  "exportMidiBtn",
  "sectionBar",
  "sectionNameInput",
  "copySectionBtn",
  "instrumentMixer",
  "exportWavBtn",
  "playSectionBtn",
  "loopSectionBtn",
  "composerZoom",
  "compactComposerToggle",
  "jumpToSectionBtn",
  "exportMusicVideoBtn",
  "projectLibraryDialog",
  "projectNameInput",
  "projectLibraryList",
  "saveNamedProjectBtn",
  "importProjectInput",
  "sequencer"
];

const missingRequired = requiredIds.filter((id) => !idSet.has(id));
if (missingRequired.length) {
  throw new Error("Required milestone controls missing: " + missingRequired.join(", "));
}

console.log(
  "Emojiro validation passed:",
  idSet.size + " unique ids,",
  new Set(idRefs).size + " JavaScript id references checked."
);
