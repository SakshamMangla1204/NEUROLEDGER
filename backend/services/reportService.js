const crypto = require("crypto");

const {
  STORE_FILES,
  ensureStore,
  readJson,
  writeJson,
} = require("./localStoreService");
const { overwriteReportBuffer, persistReportBinary, readReportBuffer } = require("./storageService");

function decodeBase64Payload(contentBase64) {
  const raw = String(contentBase64 || "");
  const encoded = raw.includes(",") ? raw.split(",").pop() : raw;
  return Buffer.from(encoded, "base64");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function normalizeFileName(fileName) {
  return String(fileName || "report.bin").trim().toLowerCase();
}

function normalizeComparableName(fileName) {
  const normalized = normalizeFileName(fileName).replace(/\.[^.]+$/, "");
  return normalized.replace(/[^a-z0-9]/g, "");
}

function listAllReports() {
  return readJson(STORE_FILES.reports, []);
}

function writeReports(records) {
  writeJson(STORE_FILES.reports, records);
}

function persistReportRecord(reportRecord) {
  const reports = listAllReports();
  reports.push(reportRecord);
  writeReports(reports);
  return reportRecord;
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

function findExactFileNameMatch({ abhaId, fileName }) {
  const normalizedName = normalizeFileName(fileName);

  return [...listReportsByAbhaId(abhaId)]
    .reverse()
    .find((report) => normalizeFileName(report.originalFileName) === normalizedName);
}

function findSimilarFileNameMatch({ abhaId, fileName }) {
  const comparableName = normalizeComparableName(fileName);
  if (comparableName.length < 4) {
    return null;
  }

  return [...listReportsByAbhaId(abhaId)]
    .reverse()
    .find((report) => {
      const reportName = normalizeComparableName(report.originalFileName);
      if (!reportName || reportName === comparableName) {
        return false;
      }

      return reportName.includes(comparableName) || comparableName.includes(reportName);
    });
}

function markReportTampered(report, attemptedHash, attemptedFileName) {
  if (!report) {
    return null;
  }

  return updateReport(report.reportId, (current) => ({
    ...current,
    integrityStatus: "tampered",
    blockchainStatus: "tampered",
    previousBlockchainStatus: current.previousBlockchainStatus || current.blockchainStatus,
    tamperDetectedAt: new Date().toISOString(),
    tamperReason: "same_filename_duplicate_upload",
    tamperEvidence: {
      attemptedFileName: attemptedFileName || current.originalFileName,
      storedHash: current.sha256,
      attemptedHash,
    },
  }));
}

function rejectIfExactFileNameExists({ abhaId, fileName, sha256: digest }) {
  const existingReport = findExactFileNameMatch({ abhaId, fileName });

  if (!existingReport) {
    return null;
  }

  const tamperedReport = markReportTampered(existingReport, digest, fileName);
  const error = new Error(
    `A report named "${existingReport.originalFileName}" already exists. Duplicate report name detected: report is tampered.`
  );
  error.statusCode = 409;
  error.code = "REPORT_TAMPERED_DUPLICATE_NAME";
  error.report = tamperedReport || existingReport;
  throw error;
}

async function saveReport({ abhaId, fileName, mimeType, contentBase64, notes }) {
  ensureStore();

  const buffer = decodeBase64Payload(contentBase64);
  if (!buffer.length) {
    throw new Error("Uploaded report content is empty.");
  }

  const digest = sha256(buffer);
  rejectIfExactFileNameExists({ abhaId, fileName, sha256: digest });
  const similarReport = findSimilarFileNameMatch({ abhaId, fileName });

  const reportId = crypto.randomUUID();
  const storageRecord = await persistReportBinary({
    buffer,
    reportId,
    fileName,
    mimeType,
  });

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

  const savedReport = persistReportRecord(reportRecord);
  if (!similarReport) {
    return savedReport;
  }

  return {
    ...savedReport,
    uploadWarning: {
      code: "SIMILAR_REPORT_NAME_FOUND",
      message: `A similar report name already exists: "${similarReport.originalFileName}". This might be tampered; send it for doctor review.`,
      matchedReportId: similarReport.reportId,
      matchedFileName: similarReport.originalFileName,
      doctorReviewRecommended: true,
    },
  };
}

function saveReportHashOnly({ abhaId, fileName, sha256: providedHash, notes }) {
  ensureStore();

  const digest = String(providedHash || "").trim();
  if (!digest) {
    throw new Error("sha256 is required when uploading a hash-only report.");
  }
  const originalFileName = fileName || "report.hash";
  rejectIfExactFileNameExists({ abhaId, fileName: originalFileName, sha256: digest });
  const similarReport = findSimilarFileNameMatch({ abhaId, fileName: originalFileName });

  const reportId = crypto.randomUUID();
  const savedReport = persistReportRecord({
    reportId,
    abhaId,
    originalFileName,
    mimeType: "text/plain",
    sizeBytes: 0,
    uploadedAt: new Date().toISOString(),
    notes: notes || "",
    storedFileName: null,
    filePath: null,
    fileUrl: null,
    storageMode: "hash_only",
    storageKey: null,
    s3Key: null,
    s3Bucket: null,
    sourceUrl: null,
    sha256: digest,
    integrityStatus: "hash_supplied_locally",
    blockchainStatus: "pending_external_sync",
  });

  if (!similarReport) {
    return savedReport;
  }

  return {
    ...savedReport,
    uploadWarning: {
      code: "SIMILAR_REPORT_NAME_FOUND",
      message: `A similar report name already exists: "${similarReport.originalFileName}". This might be tampered; send it for doctor review.`,
      matchedReportId: similarReport.reportId,
      matchedFileName: similarReport.originalFileName,
      doctorReviewRecommended: true,
    },
  };
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

  if (report.storageMode === "hash_only") {
    return {
      reportId: report.reportId,
      originalFileName: report.originalFileName,
      storedHash: report.sha256,
      recomputedHash: report.sha256,
      status: "authentic",
      blockchainStatus: report.blockchainStatus,
      comparedAt: new Date().toISOString(),
    };
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

async function simulateReportTamper(reportId) {
  const report = getReportById(reportId);
  if (!report) {
    return null;
  }

  if (report.storageMode === "hash_only") {
    throw new Error("Hash-only reports cannot simulate file tampering because no file is stored.");
  }

  const originalBuffer = await readReportBuffer(report);
  const tamperMarker = Buffer.from(
    `\n\nNEUROLEDGER_TAMPER_SIMULATION ${new Date().toISOString()}\n`,
    "utf8"
  );
  const tamperedBuffer = Buffer.concat([originalBuffer, tamperMarker]);
  const storageResult = await overwriteReportBuffer(report, tamperedBuffer);

  return {
    report,
    storageResult,
    tamperedBytes: tamperedBuffer.length,
  };
}

module.exports = {
  getReportById,
  listReportsByAbhaId,
  markReportTampered,
  saveReport,
  saveReportHashOnly,
  simulateReportTamper,
  updateReport,
  verifyReportIntegrity,
};
