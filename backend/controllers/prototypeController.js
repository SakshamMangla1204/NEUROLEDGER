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
    (report) => report.blockchainStatus === "anchored_to_mock_chain" || report.blockchainStatus === "anchored_onchain"
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
      blockchainAnchor: anchor,
      blockchainSync,
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
    const anchoredOnBlockchain = await verifyHashOnBlockchain(hashToVerify);
    const authentic =
      localVerification.status === "authentic" && Boolean(anchoredOnBlockchain);

    return res.status(200).json({
      ...localVerification,
      hashChecked: hashToVerify,
      anchoredOnBlockchain,
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
    return res.status(200).json({ verified, hash });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
  verifyReportHash,
};
