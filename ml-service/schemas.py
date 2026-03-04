from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    resting_heart_rate: float = Field(..., gt=0)
    spo2: float = Field(..., ge=0, le=100)
    glucose: float = Field(..., gt=0)
    sleep_hours: float = Field(..., ge=0, le=24)
    workout_minutes: int = Field(..., ge=0)
    age: int = Field(..., gt=0)


class PredictResponse(BaseModel):
    overall_score: float
    cardio_score: float
    glucose_score: float
    fatigue_level: str
    recommendation: str
    doctor_review_required: bool
