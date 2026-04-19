const crypto = require("crypto");

const {
  STORE_FILES,
  ensureStore,
  readJson,
  writeJson,
} = require("./localStoreService");
const { persistReportBinary, readReportBuffer } = require("./storageService");

function decodeBase64Payload(contentBase64) {
  const raw = String(contentBase64 || "");
  const encoded = raw.includes(",") ? raw.split(",").pop() : raw;
  return Buffer.from(encoded, "base64");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function listAllReports() {
  return readJson(STORE_FILES.reports, []);
}

function writeReports(records) {
  writeJson(STORE_FILES.reports, records);
}

function updateReport(reportId, updater) {
  const reports = listAllReports();
  let updatedRecord = null;

  const next = reports.map((report) => {
    if (report.reportId !== reportId) {
      return report;
    }

    updatedRecord = updater(report);
    return updatedRecord;
  });

  if (!updatedRecord) {
    return null;
  }

  writeReports(next);
  return updatedRecord;
}

async function saveReport({ abhaId, fileName, mimeType, contentBase64, notes }) {
  ensureStore();

  const buffer = decodeBase64Payload(contentBase64);
  if (!buffer.length) {
    throw new Error("Uploaded report content is empty.");
  }

  const reportId = crypto.randomUUID();
  const storageRecord = await persistReportBinary({
    buffer,
    reportId,
    fileName,
    mimeType,
  });
  const digest = sha256(buffer);

  const reportRecord = {
    reportId,
    abhaId,
    originalFileName: storageRecord.originalFileName,
    mimeType: mimeType || "application/octet-stream",
    sizeBytes: buffer.length,
    uploadedAt: new Date().toISOString(),
    notes: notes || "",
    storedFileName: storageRecord.storedFileName,
    filePath: storageRecord.filePath,
    fileUrl: `/api/reports/${reportId}/file`,
    storageMode: storageRecord.storageMode,
    storageKey: storageRecord.storageKey,
    s3Key: storageRecord.s3Key,
    s3Bucket: storageRecord.s3Bucket,
    sourceUrl: storageRecord.fileUrl,
    sha256: digest,
    integrityStatus: "hash_recorded_locally",
    blockchainStatus: "pending_external_sync",
  };

  const reports = listAllReports();
  reports.push(reportRecord);
  writeReports(reports);

  return reportRecord;
}

function getReportById(reportId) {
  return listAllReports().find((report) => report.reportId === reportId) || null;
}

function listReportsByAbhaId(abhaId) {
  return listAllReports().filter((report) => report.abhaId === abhaId);
}

async function verifyReportIntegrity(reportId) {
  const report = getReportById(reportId);
  if (!report) {
    return null;
  }

  const buffer = await readReportBuffer(report);
  const recomputedHash = sha256(buffer);
  const isAuthentic = recomputedHash === report.sha256;

  return {
    reportId: report.reportId,
    originalFileName: report.originalFileName,
    storedHash: report.sha256,
    recomputedHash,
    status: isAuthentic ? "authentic" : "tampered",
    blockchainStatus: report.blockchainStatus,
    comparedAt: new Date().toISOString(),
  };
}

module.exports = {
  getReportById,
  listReportsByAbhaId,
  saveReport,
  updateReport,
  verifyReportIntegrity,
};
