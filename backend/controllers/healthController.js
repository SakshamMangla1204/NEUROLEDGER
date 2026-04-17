const { checkMlHealth, predictHealth } = require("../services/mlService");

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
  postPredict,
};
