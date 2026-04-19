const express = require("express");
const {
  getHealth,
  getSystemStatus,
  postPredict,
} = require("../controllers/healthController");

const router = express.Router();

router.get("/health", getHealth);
router.get("/api/system/status", getSystemStatus);
router.post("/predict", postPredict);
router.post("/api/health/analyze", postPredict);

module.exports = router;
