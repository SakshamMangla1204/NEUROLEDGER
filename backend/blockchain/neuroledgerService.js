const { ethers } = require("ethers");

const { provider, getWallet, CONTRACT_ADDRESS } = require("./config");
const { ABI } = require("./abi");

function getReadContract() {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
}

function getWriteContract() {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, getWallet());
}

async function storeHashOnBlockchain(hash) {
  if (!hash) {
    throw new Error("A report hash is required for blockchain finalization");
  }

  const contract = getWriteContract();
  const tx = await contract.storeReportHash(hash);
  const receipt = await tx.wait();

  return {
    transactionHash: tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
    contractAddress: CONTRACT_ADDRESS,
  };
}

async function verifyHashOnBlockchain(hash) {
  if (!hash) {
    throw new Error("A report hash is required for blockchain verification");
  }

  const contract = getReadContract();
  return contract.verifyReportHash(hash);
}

module.exports = {
  storeHashOnBlockchain,
  verifyHashOnBlockchain,
};
