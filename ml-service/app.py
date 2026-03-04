from fastapi import FastAPI

from schemas import PredictRequest, PredictResponse
from services.prediction_service import predict_health

app = FastAPI(title="NeuroLedger ML Service", version="1.0.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    return predict_health(payload)
