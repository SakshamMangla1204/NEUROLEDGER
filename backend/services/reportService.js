const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const {
  REPORTS_DIR,
  STORE_FILES,
  ensureStore,
  readJson,
  writeJson,
} = require("./localStoreService");

function decodeBase64Payload(contentBase64) {
  const raw = String(contentBase64 || "");
  const encoded = raw.includes(",") ? raw.split(",").pop() : raw;
  return Buffer.from(encoded, "base64");
}

function sanitizeFilename(fileName) {
  return String(fileName || "report.bin").replace(/[^a-zA-Z0-9._-]/g, "_");
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

function saveReport({ abhaId, fileName, mimeType, contentBase64, notes }) {
  ensureStore();

  const buffer = decodeBase64Payload(contentBase64);
  if (!buffer.length) {
    throw new Error("Uploaded report content is empty.");
  }

  const reportId = crypto.randomUUID();
  const safeName = sanitizeFilename(fileName);
  const storedFileName = `${reportId}-${safeName}`;
  const filePath = path.join(REPORTS_DIR, storedFileName);
  const digest = sha256(buffer);

  fs.writeFileSync(filePath, buffer);

  const reportRecord = {
    reportId,
    abhaId,
    originalFileName: safeName,
    mimeType: mimeType || "application/octet-stream",
    sizeBytes: buffer.length,
    uploadedAt: new Date().toISOString(),
    notes: notes || "",
    storedFileName,
    filePath,
    fileUrl: `/api/reports/${reportId}/file`,
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

function verifyReportIntegrity(reportId) {
  const report = getReportById(reportId);
  if (!report) {
    return null;
  }

  const buffer = fs.readFileSync(report.filePath);
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
