const ABI = [
  "function storeReportHash(string memory _fileHash) public",
  "function verifyReportHash(string memory _fileHash) public view returns (bool)",
];

module.exports = {
  ABI,
};
