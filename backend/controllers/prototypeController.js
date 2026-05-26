const crypto = require("crypto");

const { predictHealth } = require("../services/mlService");
const {
  STORE_FILES,
  readJson,
  writeJson,
} = require("../services/localStoreService");
const {
  appendMetricToIdentity,
  findIdentityByAbhaId,
  linkReportToIdentity,
  listDemoProfiles,
  normalizeAbhaId,
  registerIdentity,
  verifyAbhaId,
} = require("../services/mockAbhaService");
const {
  getReportById,
  listReportsByAbhaId,
  saveReport,
  saveReportHashOnly,
  simulateReportTamper,
  updateReport,
  verifyReportIntegrity,
} = require("../services/reportService");
const {
  buildHealthSummary,
  ingestHealthMetrics,
  latestWearableRecord,
} = require("../services/wearableService");
const {
  finalizeBlockchainAnchor,
  latestAnchorForReport,
  verifyHashOnBlockchain,
} = require("../services/blockchainService");
const { getReportAccessDescriptor } = require("../services/storageService");

function listPredictions() {
  return readJson(STORE_FILES.predictions, []);
}

function writePredictions(records) {
  writeJson(STORE_FILES.predictions, records);
}

function resolveUploadAbhaId(candidateAbhaId) {
  const normalized = normalizeAbhaId(candidateAbhaId);
  if (normalized) {
    return normalized;
  }

  const profiles = listDemoProfiles();
  if (profiles.length === 1) {
    return normalizeAbhaId(profiles[0].abhaId);
  }

  return normalized;
}

function latestPredictionFor(abhaId) {
  const matches = listPredictions().filter((record) => record.abhaId === abhaId);
  return matches.length ? matches[matches.length - 1] : null;
}

function buildDashboard(abhaId, verification) {
  const reports = listReportsByAbhaId(abhaId);
  const latestPrediction = latestPredictionFor(abhaId);
  const identity = findIdentityByAbhaId(abhaId);
  const wearable = latestWearableRecord(abhaId);
  const enrichedReports = reports.map((report) => ({
    ...report,
    blockchainAnchor: latestAnchorForReport(report.reportId),
  }));
  const anchoredReports = enrichedReports.filter(
    (report) =>
      report.integrityStatus !== "tampered" &&
      (report.blockchainStatus === "anchored_to_mock_chain" || report.blockchainStatus === "anchored_onchain")
  );

  return {
    verification,
    identity,
    wearable,
    wearables: wearable ? [wearable] : [],
    latestPrediction,
    mlRiskScore: latestPrediction?.prediction?.overall_score ?? wearable?.risk_score ?? null,
    blockchain: {
      anchored: anchoredReports.length > 0,
      verified: anchoredReports.length > 0,
    },
    blockchainVerificationStatus: {
      anchoredReports: anchoredReports.length,
      pendingReports: enrichedReports.filter(
        (report) => report.blockchainStatus === "pending_external_sync"
      ).length,
      latestTransactionHash:
        anchoredReports.length > 0
          ? anchoredReports[anchoredReports.length - 1].blockchainTransactionHash || null
          : null,
    },
    reports: enrichedReports,
    reportSummary: {
      totalReports: reports.length,
      authenticReports: reports.filter((report) => report.integrityStatus !== "tampered").length,
      pendingBlockchainSync: enrichedReports.filter(
        (report) => report.blockchainStatus === "pending_external_sync"
      ).length,
      anchoredReports: anchoredReports.length,
    },
  };
}

async function getDemoProfiles(req, res) {
  return res.status(200).json({
    mode: "simulated_abha_identity",
    profiles: listDemoProfiles(),
  });
}

async function registerAbhaIdentity(req, res) {
  const { name, dob, phone, abhaId } = req.body;

  if (!name || !dob || !phone || !abhaId) {
    return res.status(400).json({
      error: "name, dob, phone, and abhaId are required",
    });
  }

  const identity = registerIdentity({ name, dob, phone, abhaId });
  return res.status(201).json({
    mode: "simulated_abha_identity",
    identity,
  });
}

async function verifyAbha(req, res) {
  const verification = verifyAbhaId(req.body.abhaId);
  const status = verification.verified ? 200 : 404;
  return res.status(status).json(verification);
}

async function analyzePatient(req, res) {
  const abhaId = normalizeAbhaId(req.params.abhaId || req.body.abhaId);
  const verification = verifyAbhaId(abhaId);

  if (!verification.verified) {
    return res.status(404).json(verification);
  }

  try {
    const prediction = await predictHealth(req.body.metrics || req.body);
    const predictionRecord = {
      predictionId: crypto.randomUUID(),
      abhaId,
      createdAt: new Date().toISOString(),
      input: req.body.metrics || req.body,
      prediction,
    };

    const predictions = listPredictions();
    predictions.push(predictionRecord);
    writePredictions(predictions);

    return res.status(200).json({
      verification,
      prediction,
      dashboard: buildDashboard(abhaId, verification),
    });
  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json({
      error: "Patient analysis failed",
      detail: error.response?.data || error.message,
    });
  }
}

async function syncWearable(req, res) {
  const abhaId = normalizeAbhaId(req.params.abhaId || req.body.abhaId);
  const verification = verifyAbhaId(abhaId);

  if (!verification.verified) {
    return res.status(404).json(verification);
  }

  return res.status(410).json({
    error: "Use POST /api/health-metrics to ingest phone wearable data.",
  });
}

async function ingestWearableMetrics(req, res) {
  const {
    abha_id: abhaId,
    heart_rate: heartRate,
    steps,
    sleep_hours: sleepHours,
    glucose,
  } = req.body;

  if (!abhaId || heartRate === undefined || steps === undefined || sleepHours === undefined) {
    return res.status(400).json({
      error: "abha_id, heart_rate, steps, and sleep_hours are required",
    });
  }

  const validationError = validateWearableMetricInput({
    heartRate,
    steps,
    sleepHours,
    glucose,
  });
  if (validationError) {
    return res.status(400).json({
      error: validationError,
    });
  }

  const verification = verifyAbhaId(abhaId);
  if (!verification.verified) {
    return res.status(404).json(verification);
  }

  const wearableRecord = ingestHealthMetrics(req.body);
  appendMetricToIdentity(wearableRecord.abha_id, wearableRecord);

  return res.status(200).json({
    verification,
    wearable: wearableRecord,
    normalized_signals: wearableRecord.normalized_signals,
    risk_level: wearableRecord.risk_level,
    risk_score: wearableRecord.risk_score,
  });
}

async function analyzeFromWearable(req, res) {
  const abhaId = normalizeAbhaId(req.params.abhaId || req.body.abhaId);
  const verification = verifyAbhaId(abhaId);

  if (!verification.verified) {
    return res.status(404).json(verification);
  }

  const identity = verification.patient;
  const wearable = latestWearableRecord(abhaId);
  if (!wearable) {
    return res.status(404).json({
      error: "No wearable metrics found. Ingest data through POST /api/health-metrics first.",
    });
  }
  const metrics = {
    resting_heart_rate: boundedMetric(wearable.heart_rate, 30, 220, 78),
    spo2: boundedMetric(wearable.spo2, 50, 100, 98),
    glucose: boundedMetric(wearable.glucose, 40, 500, 95),
    sleep_hours: boundedMetric(wearable.sleep_hours, 0, 24, 7),
    workout_minutes: boundedMetric(estimateWorkoutMinutes(wearable.steps), 0, 300, 0),
    age: identity.dob ? calculateAge(identity.dob) : req.body.age,
  };

  try {
    const prediction = await predictHealth(metrics);
    const predictionRecord = {
      predictionId: crypto.randomUUID(),
      abhaId,
      createdAt: new Date().toISOString(),
      input: metrics,
      source: "simulated_wearable_api",
      wearableSyncId: wearable.syncId,
      prediction,
    };

    const predictions = listPredictions();
    predictions.push(predictionRecord);
    writePredictions(predictions);

    return res.status(200).json({
      verification,
      wearable,
      prediction,
      dashboard: buildDashboard(abhaId, verification),
    });
  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json({
      error: "Wearable-based analysis failed",
      detail: error.response?.data || error.message,
    });
  }
}

async function analyzeWearableHistory(req, res) {
  const abhaId = normalizeAbhaId(req.params.abhaId || req.body.abhaId);
  const verification = verifyAbhaId(abhaId);

  if (!verification.verified) {
    return res.status(404).json(verification);
  }

  const identity = verification.patient;
  const history = identity.metrics || [];

  if (!history.length) {
    return res.status(404).json({
      error: "No wearable metrics found. Ingest data through POST /api/health-metrics first.",
    });
  }

  try {
    const age = identity.dob ? calculateAge(identity.dob) : Number(req.body.age) || 30;
    const trend = [];

    for (const record of history) {
      const input = {
        resting_heart_rate: boundedMetric(record.heart_rate, 30, 220, 78),
        spo2: boundedMetric(record.spo2, 50, 100, 98),
        glucose: boundedMetric(record.glucose, 40, 500, 95),
        sleep_hours: boundedMetric(record.sleep_hours, 0, 24, 7),
        workout_minutes: boundedMetric(estimateWorkoutMinutes(record.steps), 0, 300, 0),
        age,
      };
      const prediction = await predictHealth(input);

      trend.push({
        receivedAt: record.received_at,
        source: record.source || "health_connect_bridge",
        input,
        ml: prediction,
        normalizedSignals: record.normalized_signals,
      });
    }

    const latest = trend[trend.length - 1];

    return res.status(200).json({
      abhaId,
      generatedAt: new Date().toISOString(),
      recordsAnalyzed: trend.length,
      dateRange: {
        from: trend[0]?.receivedAt || null,
        to: latest?.receivedAt || null,
      },
      latestPrediction: latest?.ml || null,
      trend,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json({
      error: "Wearable history ML analysis failed",
      detail: error.response?.data || error.message,
    });
  }
}

async function getHealthSummary(req, res) {
  const abhaId = normalizeAbhaId(req.params.abhaId || req.params.abha_id);
  const verification = verifyAbhaId(abhaId);
  if (!verification.verified) {
    return res.status(404).json(verification);
  }

  const summary = buildHealthSummary(abhaId);
  if (!summary) {
    return res.status(404).json({
      error: "No wearable history found for this ABHA ID",
    });
  }

  return res.status(200).json(summary);
}

async function uploadReport(req, res) {
  const abhaId = resolveUploadAbhaId(req.body.abhaId);
  const isHashOnlyUpload = Boolean(req.body.sha256);
  const verification = verifyAbhaId(abhaId);

  if (!verification.verified) {
    return res.status(404).json(verification);
  }

  try {
    const report = req.body.sha256
      ? saveReportHashOnly({
          abhaId,
          fileName: req.body.fileName,
          sha256: req.body.sha256,
          notes: req.body.notes,
        })
      : await saveReport({
          abhaId,
          fileName: req.body.fileName,
          mimeType: req.body.mimeType,
          contentBase64: req.body.contentBase64,
          notes: req.body.notes,
        });
    linkReportToIdentity(abhaId, report.reportId);

    let anchoredReport = report;
    let anchor = null;
    let blockchainSync = {
      success: false,
      mode: "deferred",
    };

    if (!isHashOnlyUpload) {
      try {
        const anchored = await finalizeBlockchainAnchor({
          report,
          verification: {
            status: "authentic",
          },
          prediction: latestPredictionFor(abhaId)?.prediction || null,
          identity: verification.patient,
        });

        anchor = anchored;
        anchoredReport = updateReport(report.reportId, (current) => ({
          ...current,
          blockchainStatus: "anchored_onchain",
          blockchainAnchorId: anchored.anchorId,
          blockchainTransactionHash: anchored.transactionHash,
          finalizedAt: anchored.anchoredAt,
        }));
        blockchainSync = {
          success: true,
          mode: "anchored_on_upload",
          transactionHash: anchored.transactionHash,
        };
      } catch (blockchainError) {
        blockchainSync = {
          success: false,
          mode: "deferred",
          error: blockchainError.message,
        };
      }
    }

    return res.status(201).json({
      reportId: anchoredReport.reportId,
      verification,
      report: anchoredReport,
      warning: report.uploadWarning || null,
      blockchainAnchor: anchor,
      blockchainSync,
      dashboard: buildDashboard(abhaId, verification),
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      error: error.code === "REPORT_TAMPERED_DUPLICATE_NAME" ? "Report tampering detected" : "Report upload failed",
      detail: error.message,
      report: error.report || null,
    });
  }
}

async function getDashboard(req, res) {
  const abhaId = normalizeAbhaId(req.params.abhaId);
  const verification = verifyAbhaId(abhaId);

  if (!verification.verified) {
    return res.status(404).json(verification);
  }

  return res.status(200).json(buildDashboard(abhaId, verification));
}

async function listReports(req, res) {
  const abhaId = normalizeAbhaId(req.query.abhaId);
  const verification = verifyAbhaId(abhaId);

  if (!verification.verified) {
    return res.status(404).json(verification);
  }

  return res.status(200).json({
    verification,
    reports: listReportsByAbhaId(abhaId),
  });
}

async function getReportFile(req, res) {
  const report = getReportById(req.params.reportId);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  try {
    const descriptor = await getReportAccessDescriptor(report);
    if (descriptor.type === "redirect") {
      return res.redirect(descriptor.target);
    }

    return res.sendFile(descriptor.target);
  } catch (error) {
    return res.status(500).json({
      error: "Unable to retrieve report file",
      detail: error.message,
    });
  }
}

async function verifyReport(req, res) {
  const report = getReportById(req.params.reportId);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  try {
    const localVerification = await verifyReportIntegrity(req.params.reportId);
    const hashToVerify = req.query.hash || report.sha256;
    let anchoredOnBlockchain = false;
    let blockchainCheck = {
      available: true,
      status: "checked",
      error: null,
    };

    try {
      anchoredOnBlockchain = await verifyHashOnBlockchain(hashToVerify);
    } catch (blockchainError) {
      blockchainCheck = {
        available: false,
        status: "unavailable",
        error: blockchainError.message,
      };
    }

    const authentic = localVerification.status === "authentic";

    return res.status(200).json({
      ...localVerification,
      hashChecked: hashToVerify,
      anchoredOnBlockchain,
      blockchainCheck,
      authentic,
      status: authentic ? "authentic" : "tampered",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function verifyReportHash(req, res) {
  const hash = req.body.hash;

  if (!hash) {
    return res.status(400).json({
      error: "hash is required",
    });
  }

  try {
    const verified = await verifyHashOnBlockchain(hash);
    return res.status(200).json({
      verified,
      hash,
      blockchainAvailable: true,
    });
  } catch (error) {
    return res.status(200).json({
      verified: false,
      hash,
      blockchainAvailable: false,
      error: error.message,
    });
  }
}

async function simulateTamperedReport(req, res) {
  const report = getReportById(req.params.reportId);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  try {
    const tamperResult = await simulateReportTamper(report.reportId);
    const verification = await verifyReportIntegrity(report.reportId);
    const updatedReport = updateReport(report.reportId, (current) => ({
      ...current,
      integrityStatus: "tampered",
      blockchainStatus: "tampered",
      previousBlockchainStatus: current.previousBlockchainStatus || current.blockchainStatus,
      tamperDetectedAt: new Date().toISOString(),
      tamperReason: "stored_file_modified",
      tamperEvidence: {
        storedHash: verification.storedHash,
        recomputedHash: verification.recomputedHash,
      },
    }));

    return res.status(200).json({
      success: true,
      status: "tampered",
      message: "Stored report content was modified for tamper simulation.",
      reportId: report.reportId,
      originalFileName: report.originalFileName,
      storageMode: report.storageMode,
      storageKey: report.s3Key || report.storageKey || report.filePath,
      tamperedBytes: tamperResult.tamperedBytes,
      verification,
      report: updatedReport,
    });
  } catch (error) {
    return res.status(400).json({
      error: "Unable to simulate report tampering",
      detail: error.message,
    });
  }
}

async function finalizeReportOnBlockchain(req, res) {
  const report = getReportById(req.params.reportId);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  const verification = await verifyReportIntegrity(report.reportId);
  const identity = findIdentityByAbhaId(report.abhaId);
  const prediction = latestPredictionFor(report.abhaId)?.prediction || null;

  if (!verification || verification.status !== "authentic") {
    return res.status(400).json({
      error: "Only authentic reports can be finalized on blockchain",
      verification,
    });
  }

  try {
    const anchor = await finalizeBlockchainAnchor({
      report,
      verification,
      prediction,
      identity,
    });

    const updatedReport = updateReport(report.reportId, (current) => ({
      ...current,
      blockchainStatus: "anchored_onchain",
      blockchainAnchorId: anchor.anchorId,
      blockchainTransactionHash: anchor.transactionHash,
      finalizedAt: anchor.anchoredAt,
    }));

    return res.status(200).json({
      success: true,
      status: "anchored",
      txHash: anchor.transactionHash,
      transaction: anchor.transactionHash,
      anchor,
      report: updatedReport,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

function calculateAge(dob) {
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) {
    return 30;
  }

  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasBirthdayPassed =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() >= birthDate.getUTCDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return Math.max(age, 1);
}

function estimateWorkoutMinutes(steps) {
  const value = Number(steps) || 0;
  return Math.max(0, Math.round(value / 120));
}

function boundedMetric(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

function validateWearableMetricInput({ heartRate, steps, sleepHours, glucose }) {
  const checks = [
    ["heart_rate", heartRate, 30, 220],
    ["steps", steps, 0, 200000],
    ["sleep_hours", sleepHours, 0, 24],
  ];

  if (glucose !== undefined && glucose !== null && glucose !== "") {
    checks.push(["glucose", glucose, 40, 500]);
  }

  for (const [field, value, min, max] of checks) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
      return `${field} must be a number between ${min} and ${max}`;
    }
  }

  return null;
}

module.exports = {
  analyzePatient,
  analyzeFromWearable,
  analyzeWearableHistory,
  finalizeReportOnBlockchain,
  getDashboard,
  getDemoProfiles,
  getHealthSummary,
  getReportFile,
  ingestWearableMetrics,
  listReports,
  registerAbhaIdentity,
  simulateTamperedReport,
  syncWearable,
  uploadReport,
  verifyAbha,
  verifyReport,
  verifyReportHash,
};
