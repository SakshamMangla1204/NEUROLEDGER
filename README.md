## NeuroLedger

NeuroLedger is currently aligned as a local prototype with four main flows:

1. simulated ABHA-compatible identity registration through user-entered mock IDs
2. wearable data sync through a simulated wearable API
3. backend health-risk analysis through the ML service
4. report upload with SHA-256 hashing, S3-backed file storage, and local-chain integrity verification
5. dashboard aggregation and blockchain-final-step handoff

### Current Architecture

- `ml-service/`: FastAPI service for normalization, baseline comparison, cardio/glucose/fatigue scoring, trend analysis, and guardrailed recommendations
- `backend/`: Express orchestration layer for mock ABHA-compatible identity storage, wearable sync, patient dashboard aggregation, report storage, and blockchain-final-step handoff
- `frontend/public/`: lightweight frontend for exercising the prototype flow
- `blockchain/`: locally hosted Truffle-based smart-contract workspace for anchoring and verifying report hashes

### Repository Structure

```text
NEUROLEDGER/
|
|-- backend/
|   |-- routes/
|   |-- controllers/
|   |-- services/
|   `-- blockchain/   <- Web3 integration used by the backend
|
|-- frontend/
|
|-- blockchain/
|   |-- contracts/
|   |   `-- Neuroledger.sol
|   |-- migrations/
|   |   `-- 1_deploy_neuroledger.js
|   |-- test/
|   |   `-- neuroledger.test.js
|   |-- build/            <- generated after `truffle compile`
|   |-- .env.example
|   |-- package.json
|   `-- truffle-config.js
|
`-- README.md
```

### Blockchain Run Order

1. Start a local EVM node such as Ganache on `http://127.0.0.1:8545`
2. In `blockchain/`, install deps and compile:
   `npm install && npm run compile`
3. Deploy the contract locally:
   `npm run deploy`
4. Copy the deployed contract address into `backend/.env`
5. In `backend/`, install deps and start the API:
   `npm install && npm run dev`

The blockchain hash ledger is intended to stay local. If you want S3-backed medical-report storage, set `REPORT_STORAGE_MODE=s3` and fill in the AWS variables from [backend/.env.example](/c:/Users/saksh/NEUROLEDGER/backend/.env.example).

### Local Run Order

1. Start the ML service from `ml-service/`
   `uvicorn app:app --reload`
2. Start the backend from `backend/`
   `node server.js`
3. Open `http://127.0.0.1:5000/app/index.html`

### Example Mock ID

- `saksham@abdm`

### Target Flow

`ABHA simulation -> wearable data API -> backend integration -> S3 report storage -> local blockchain hash anchor -> verification`
