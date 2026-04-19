const crypto = require("crypto");

const { CONTRACT_ADDRESS, NETWORK_NAME } = require("../blockchain/config");
const {
  storeHashOnBlockchain,
  verifyHashOnBlockchain,
} = require("../blockchain/neuroledgerService");
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

async function finalizeBlockchainAnchor({ report, verification, prediction, identity }) {
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

  const alreadyAnchored = await verifyHashOnBlockchain(report.sha256);
  const blockchainReceipt = alreadyAnchored
    ? {
        transactionHash: null,
        blockNumber: null,
        contractAddress: CONTRACT_ADDRESS,
        networkName: NETWORK_NAME,
        alreadyAnchored: true,
      }
    : await storeHashOnBlockchain(report.sha256);
  const anchor = {
    anchorId: crypto.randomUUID(),
    anchoredAt: new Date().toISOString(),
    mode: blockchainReceipt.alreadyAnchored
      ? "smart_contract_anchor_existing"
      : "smart_contract_anchor",
    network: blockchainReceipt.networkName || NETWORK_NAME,
    contractAddress: blockchainReceipt.contractAddress || CONTRACT_ADDRESS,
    transactionRef: blockchainReceipt.transactionHash,
    transactionHash: blockchainReceipt.transactionHash,
    blockNumber: blockchainReceipt.blockNumber,
    alreadyAnchored: Boolean(blockchainReceipt.alreadyAnchored),
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
  verifyHashOnBlockchain,
};
