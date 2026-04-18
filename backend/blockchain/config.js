const { ethers } = require("ethers");
const dotenv = require("dotenv");

dotenv.config();

const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology/");

const CONTRACT_ADDRESS = "0x52BF71938a8f5dE1788939b5bCc8F09Fcd99Ea4C";

function getWallet() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is not configured in backend/.env");
  }

  return new ethers.Wallet(privateKey, provider);
}

module.exports = {
  provider,
  getWallet,
  CONTRACT_ADDRESS,
};
