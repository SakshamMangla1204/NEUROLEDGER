const axios = require("axios");

const ML_BASE_URL = process.env.ML_BASE_URL || "http://127.0.0.1:8000";

async function checkMlHealth() {
  const response = await axios.get(`${ML_BASE_URL}/health`, { timeout: 10000 });
  return response.data;
}

async function predictHealth(payload) {
  const response = await axios.post(`${ML_BASE_URL}/predict`, { features: payload }, {
    timeout: 15000,
  });
  return response.data;
}

module.exports = {
  checkMlHealth,
  predictHealth,
};
