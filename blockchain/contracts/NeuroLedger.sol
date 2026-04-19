// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract Neuroledger {
    struct ReportAnchor {
        string fileHash;
        uint256 timestamp;
        address uploader;
        bool exists;
    }

    mapping(bytes32 => ReportAnchor) private anchorsByHash;

    event ReportHashStored(
        bytes32 indexed anchorKey,
        string fileHash,
        address uploader,
        uint256 timestamp
    );

    function storeReportHash(string memory fileHash) external {
        require(bytes(fileHash).length > 0, "fileHash required");

        bytes32 anchorKey = keccak256(bytes(fileHash));
        require(!anchorsByHash[anchorKey].exists, "hash already anchored");

        anchorsByHash[anchorKey] = ReportAnchor({
            fileHash: fileHash,
            timestamp: block.timestamp,
            uploader: msg.sender,
            exists: true
        });

        emit ReportHashStored(anchorKey, fileHash, msg.sender, block.timestamp);
    }

    function getReportHash(
        string memory fileHash
    ) external view returns (string memory storedFileHash, uint256 timestamp, address uploader, bool exists) {
        bytes32 anchorKey = keccak256(bytes(fileHash));
        ReportAnchor memory anchor = anchorsByHash[anchorKey];

        return (
            anchor.fileHash,
            anchor.timestamp,
            anchor.uploader,
            anchor.exists
        );
    }

    function verifyReportHash(string memory fileHash) external view returns (bool) {
        bytes32 anchorKey = keccak256(bytes(fileHash));
        ReportAnchor memory anchor = anchorsByHash[anchorKey];

        return anchor.exists && keccak256(bytes(anchor.fileHash)) == keccak256(bytes(fileHash));
    }
}
