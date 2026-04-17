const express = require("express");

const {
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
} = require("../controllers/prototypeController");

const router = express.Router();

router.get("/abha/demo-profiles", getDemoProfiles);
router.post("/abha/register", registerAbhaIdentity);
router.post("/abha/verify", verifyAbha);
router.post("/health-metrics", ingestWearableMetrics);
router.get("/health-summary/:abha_id", getHealthSummary);
router.post("/patients/:abhaId/wearables/sync", syncWearable);
router.post("/patients/:abhaId/wearables/analyze", analyzeFromWearable);
router.post("/patients/:abhaId/analyze", analyzePatient);
router.get("/patients/:abhaId/dashboard", getDashboard);
router.get("/reports", listReports);
router.post("/reports/upload", uploadReport);
router.get("/reports/:reportId/file", getReportFile);
router.get("/reports/:reportId/verify", verifyReport);
router.post("/reports/:reportId/finalize-blockchain", finalizeReportOnBlockchain);

module.exports = router;
