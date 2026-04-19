const { Web3 } = require("web3");

const { BLOCKCHAIN_ENABLED, RPC_URL } = require("./config");

let web3 = null;

if (BLOCKCHAIN_ENABLED) {
  web3 = new Web3(RPC_URL);
}

module.exports = web3;
