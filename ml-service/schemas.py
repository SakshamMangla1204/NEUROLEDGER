from pydantic import BaseModel, Field
from typing import List


class PredictRequest(BaseModel):
    resting_heart_rate: float = Field(..., gt=0)
    spo2: float = Field(..., ge=0, le=100)
    glucose: float = Field(..., gt=0)
    sleep_hours: float = Field(..., ge=0, le=24)
    workout_minutes: int = Field(..., ge=0)
    age: int = Field(..., gt=0)


class PredictResponse(BaseModel):
    overall_score: float
    risk_level: str
    cardio_score: float
    glucose_score: float
    fatigue_level: str
    trend_flags: List[str]
    recommendation: str
    doctor_review_required: bool
