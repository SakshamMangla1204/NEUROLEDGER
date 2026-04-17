const crypto = require("crypto");

const {
  STORE_FILES,
  readJson,
  writeJson,
} = require("./localStoreService");

function listAnchors() {
  return readJson(STORE_FILES.blockchainAnchors, []);
}

function writeAnchors(records) {
  writeJson(STORE_FILES.blockchainAnchors, records);
}

function latestAnchorForReport(reportId) {
  const matches = listAnchors().filter((anchor) => anchor.reportId === reportId);
  return matches.length ? matches[matches.length - 1] : null;
}

function finalizeBlockchainAnchor({ report, verification, prediction, identity }) {
  const payload = {
    reportId: report.reportId,
    abhaId: report.abhaId,
    storedHash: report.sha256,
    verificationStatus: verification.status,
    predictionScore: prediction?.overall_score ?? null,
    riskLevel: prediction?.risk_level ?? null,
    patientName: identity?.name ?? null,
  };

  const payloadDigest = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  const anchor = {
    anchorId: crypto.randomUUID(),
    anchoredAt: new Date().toISOString(),
    mode: "blockchain_final_step_simulation",
    network: "mock-ledger",
    transactionRef: `mock-tx-${payloadDigest.slice(0, 16)}`,
    reportId: report.reportId,
    abhaId: report.abhaId,
    storedHash: report.sha256,
    verificationStatus: verification.status,
    payloadDigest,
    summary: payload,
  };

  const anchors = listAnchors();
  anchors.push(anchor);
  writeAnchors(anchors);
  return anchor;
}

module.exports = {
  finalizeBlockchainAnchor,
  latestAnchorForReport,
};
