const Neuroledger = artifacts.require("Neuroledger");

module.exports = async function deploy(deployer) {
  await deployer.deploy(Neuroledger);
};
