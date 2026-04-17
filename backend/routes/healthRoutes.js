const express = require("express");
const { getHealth, postPredict } = require("../controllers/healthController");

const router = express.Router();

router.get("/health", getHealth);
router.post("/predict", postPredict);
router.post("/api/health/analyze", postPredict);

module.exports = router;
