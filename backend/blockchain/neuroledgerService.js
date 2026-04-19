const { getContract } = require("./contract");
const { BLOCKCHAIN_ENABLED, CONTRACT_ADDRESS, NETWORK_NAME } = require("./config");
const web3 = require("./web3");

function ensureBlockchainReady() {
  if (!BLOCKCHAIN_ENABLED) {
    throw new Error("Blockchain integration is disabled");
  }

  if (!CONTRACT_ADDRESS) {
    throw new Error("BLOCKCHAIN_CONTRACT_ADDRESS is not configured in backend/.env");
  }
}

async function storeHashOnBlockchain(hash) {
  if (!hash) {
    throw new Error("A report hash is required for blockchain finalization");
  }

  ensureBlockchainReady();
  const accounts = await web3.eth.getAccounts();
  const contract = getContract();
  const receipt = await contract.methods.storeReportHash(hash).send({ from: accounts[0] });

  return {
    transactionHash: receipt.transactionHash,
    blockNumber: receipt?.blockNumber ?? null,
    contractAddress: CONTRACT_ADDRESS,
    networkName: NETWORK_NAME,
  };
}

async function verifyHashOnBlockchain(hash) {
  if (!hash) {
    throw new Error("A report hash is required for blockchain verification");
  }

  ensureBlockchainReady();
  const contract = getContract();
  return contract.methods.verifyReportHash(hash).call();
}

module.exports = {
  storeHashOnBlockchain,
  verifyHashOnBlockchain,
};
