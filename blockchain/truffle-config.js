require("dotenv").config();

module.exports = {
  networks: {
    development: {
      host: process.env.LOCAL_RPC_HOST || "127.0.0.1",
      port: Number(process.env.LOCAL_RPC_PORT || 8545),
      network_id: "*",
    },
  },
  mocha: {
    timeout: 100000,
  },
  compilers: {
    solc: {
      version: "0.8.21",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
