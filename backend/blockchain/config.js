const dotenv = require("dotenv");

dotenv.config();

const BLOCKCHAIN_ENABLED = process.env.BLOCKCHAIN_ENABLED !== "false";
const NETWORK_NAME = process.env.BLOCKCHAIN_NETWORK_NAME || "ganache-local";
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || "";

module.exports = {
  BLOCKCHAIN_ENABLED,
  NETWORK_NAME,
  RPC_URL,
  CONTRACT_ADDRESS,
};
