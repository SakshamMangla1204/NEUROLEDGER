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
} = require("../services/blockchainService");

function listPredictions() {
  return readJson(STORE_FILES.predictions, []);
}

function writePredictions(records) {
  writeJson(STORE_FILES.predictions, records);
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

  return {
    verification,
    identity,
    wearable,
    latestPrediction,
    reports: enrichedReports,
    reportSummary: {
      totalReports: reports.length,
      authenticReports: reports.filter((report) => report.integrityStatus !== "tampered").length,
      pendingBlockchainSync: reports.filter(
        (report) => report.blockchainStatus === "pending_external_sync"
      ).length,
      anchoredReports: reports.filter(
        (report) => report.blockchainStatus === "anchored_to_mock_chain"
      ).length,
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

  if (
    !abhaId ||
    heartRate === undefined ||
    steps === undefined ||
    sleepHours === undefined ||
    glucose === undefined
  ) {
    return res.status(400).json({
      error: "abha_id, heart_rate, steps, sleep_hours, and glucose are required",
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
    resting_heart_rate: wearable.heart_rate,
    spo2: 98,
    glucose: wearable.glucose,
    sleep_hours: wearable.sleep_hours,
    workout_minutes: estimateWorkoutMinutes(wearable.steps),
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
  const abhaId = normalizeAbhaId(req.body.abhaId);
  const verification = verifyAbhaId(abhaId);

  if (!verification.verified) {
    return res.status(404).json(verification);
  }

  try {
    const report = saveReport({
      abhaId,
      fileName: req.body.fileName,
      mimeType: req.body.mimeType,
      contentBase64: req.body.contentBase64,
      notes: req.body.notes,
    });
    linkReportToIdentity(abhaId, report.reportId);

    return res.status(201).json({
      verification,
      report,
      dashboard: buildDashboard(abhaId, verification),
    });
  } catch (error) {
    return res.status(400).json({
      error: "Report upload failed",
      detail: error.message,
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

  return res.sendFile(report.filePath);
}

async function verifyReport(req, res) {
  const result = verifyReportIntegrity(req.params.reportId);
  if (!result) {
    return res.status(404).json({ error: "Report not found" });
  }

  return res.status(200).json(result);
}

async function finalizeReportOnBlockchain(req, res) {
  const report = getReportById(req.params.reportId);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  const verification = verifyReportIntegrity(report.reportId);
  const identity = findIdentityByAbhaId(report.abhaId);
  const prediction = latestPredictionFor(report.abhaId)?.prediction || null;

  if (!verification || verification.status !== "authentic") {
    return res.status(400).json({
      error: "Only authentic reports can be finalized on blockchain",
      verification,
    });
  }

  const anchor = finalizeBlockchainAnchor({
    report,
    verification,
    prediction,
    identity,
  });

  const updatedReport = updateReport(report.reportId, (current) => ({
    ...current,
    blockchainStatus: "anchored_to_mock_chain",
    blockchainAnchorId: anchor.anchorId,
    finalizedAt: anchor.anchoredAt,
  }));

  return res.status(200).json({
    anchor,
    report: updatedReport,
  });
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

module.exports = {
  analyzePatient,
  analyzeFromWearable,
  finalizeReportOnBlockchain,
  getDashboard,
  getDemoProfiles,
  getHealthSummary,
  getReportFile,
  ingestWearableMetrics,
  listReports,
  registerAbhaIdentity,
  syncWearable,
  uploadReport,
  verifyAbha,
  verifyReport,
};
