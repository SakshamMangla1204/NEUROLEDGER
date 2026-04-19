const Neuroledger = artifacts.require("Neuroledger");

contract("Neuroledger", (accounts) => {
  const [uploader] = accounts;

  it("stores and verifies a report hash", async () => {
    const contract = await Neuroledger.deployed();
    const fileHash = "abc123hash";

    await contract.storeReportHash(fileHash, { from: uploader });

    const exists = await contract.verifyReportHash(fileHash);
    assert.equal(exists, true);

    const anchor = await contract.getReportHash(fileHash);
    assert.equal(anchor.storedFileHash, fileHash);
    assert.equal(anchor.uploader, uploader);
    assert.equal(anchor.exists, true);
  });

  it("rejects duplicate hashes", async () => {
    const contract = await Neuroledger.deployed();

    try {
      await contract.storeReportHash("abc123hash", { from: uploader });
      assert.fail("expected revert for duplicate hash");
    } catch (error) {
      assert.include(error.message, "hash already anchored");
    }
  });
});
