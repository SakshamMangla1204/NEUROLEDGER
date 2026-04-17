## NeuroLedger

NeuroLedger is currently aligned as a local prototype with four main flows:

1. simulated ABHA-compatible identity registration through user-entered mock IDs
2. wearable data sync through a simulated wearable API
3. backend health-risk analysis through the ML service
4. report upload with local SHA-256 hashing and integrity verification
5. dashboard aggregation and blockchain-final-step handoff

### Current Architecture

- `ml-service/`: FastAPI service for normalization, baseline comparison, cardio/glucose/fatigue scoring, trend analysis, and guardrailed recommendations
- `backend/`: Express orchestration layer for mock ABHA-compatible identity storage, wearable sync, patient dashboard aggregation, report storage, and blockchain-final-step handoff
- `frontend/public/`: lightweight frontend for exercising the prototype flow
- `blockchain/`: reserved for reconnecting the existing blockchain work

### Local Run Order

1. Start the ML service from `ml-service/`
   `uvicorn app:app --reload`
2. Start the backend from `backend/`
   `node server.js`
3. Open `http://127.0.0.1:5000/app/index.html`

### Example Mock ID

- `saksham@abdm`

### Target Flow

`ABHA simulation -> wearable data API -> backend integration -> dashboard -> blockchain final step`
