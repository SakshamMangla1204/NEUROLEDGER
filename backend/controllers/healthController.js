const { checkMlHealth, predictHealth } = require("../services/mlService");
const { BLOCKCHAIN_ENABLED } = require("../blockchain/config");
const web3 = require("../blockchain/web3");
const { STORAGE_MODE } = require("../services/storageService");

async function getHealth(req, res) {
  try {
    const data = await checkMlHealth();
    return res.status(200).json({
      backend: "ok",
      mlService: data,
    });
  } catch (error) {
    return res.status(503).json({
      backend: "ok",
      mlService: "down",
      error: error.message,
    });
  }
}

async function getSystemStatus(req, res) {
  const status = {
    blockchain: "disconnected",
    ml_engine: "down",
    wearable_ingestion: "active",
    storage: STORAGE_MODE,
  };

  try {
    if (BLOCKCHAIN_ENABLED && web3) {
      const listening = await web3.eth.net.isListening();
      status.blockchain = listening ? "connected" : "disconnected";
    } else {
      status.blockchain = "disabled";
    }
  } catch (error) {
    status.blockchain = "disconnected";
  }

  try {
    await checkMlHealth();
    status.ml_engine = "running";
  } catch (error) {
    status.ml_engine = "down";
  }

  return res.status(200).json(status);
}

async function postPredict(req, res) {
  try {
    const prediction = await predictHealth(req.body);
    return res.status(200).json(prediction);
  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json({
      error: "Prediction request failed",
      detail: error.response?.data || error.message,
    });
  }
}

module.exports = {
  getHealth,
  getSystemStatus,
  postPredict,
};
