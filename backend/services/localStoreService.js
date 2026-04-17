const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve(__dirname, "../data");
const STORAGE_DIR = path.resolve(__dirname, "../storage");
const REPORTS_DIR = path.join(STORAGE_DIR, "reports");

const STORE_FILES = {
  identities: path.join(DATA_DIR, "identities.json"),
  reports: path.join(DATA_DIR, "reports.json"),
  predictions: path.join(DATA_DIR, "predictions.json"),
  wearables: path.join(DATA_DIR, "wearables.json"),
  blockchainAnchors: path.join(DATA_DIR, "blockchain_anchors.json"),
};

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  for (const filePath of Object.values(STORE_FILES)) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]\n", "utf8");
    }
  }
}

function readJson(filePath, fallback) {
  ensureStore();

  try {
    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureStore();
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

module.exports = {
  DATA_DIR,
  REPORTS_DIR,
  STORE_FILES,
  ensureStore,
  readJson,
  writeJson,
};
