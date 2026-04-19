const path = require("path");

const { CONTRACT_ADDRESS } = require("./config");
const web3 = require("./web3");

function getContract() {
  if (!web3) {
    throw new Error("Blockchain integration is disabled");
  }

  if (!CONTRACT_ADDRESS) {
    throw new Error("BLOCKCHAIN_CONTRACT_ADDRESS is not configured in backend/.env");
  }

  const artifactPath = path.resolve(
    __dirname,
    process.env.BLOCKCHAIN_ARTIFACT_PATH || "../../blockchain/build/contracts/Neuroledger.json"
  );
  const contractJson = require(artifactPath);

  return new web3.eth.Contract(contractJson.abi, CONTRACT_ADDRESS);
}

module.exports = {
  getContract,
};
