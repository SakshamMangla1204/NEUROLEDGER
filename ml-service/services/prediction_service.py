from config import (
    AGE_PENALTY,
    CARDIO_WEIGHT,
    DOCTOR_REVIEW_GLUCOSE_CUTOFF,
    DOCTOR_REVIEW_SCORE_CUTOFF,
    DOCTOR_REVIEW_SPO2_CUTOFF,
    GLUCOSE_WEIGHT,
    MAX_SCORE,
    MIN_SCORE,
    FATIGUE_WEIGHT,
)
from core.cardio_engine import compute_cardio_score
from core.fatigue_engine import compute_fatigue_score
from core.glucose_engine import compute_glucose_score
from core.trend_engine import analyze_trends
from schemas import PredictRequest, PredictResponse


def predict_health(health_data: PredictRequest) -> PredictResponse:
    normalized_features = {
        "resting_heart_rate": max(MIN_SCORE, min(health_data.resting_heart_rate / MAX_SCORE, 1.5))
    }
    baseline_features = {
        "hr_deviation": 0.0,
        "glucose_history": [],
        "last_7_days_hr": [health_data.resting_heart_rate] * 7,
        "last_7_days_glucose": [health_data.glucose] * 7,
        "last_7_days_workout": [health_data.workout_minutes] * 7,
    }
    cardio_result = compute_cardio_score(
        normalized_features=normalized_features,
        baseline_features=baseline_features,
        spo2=health_data.spo2,
        workout_minutes=health_data.workout_minutes,
    )
    cardio_score = cardio_result["cardio_score"]
    glucose_result = compute_glucose_score(
        glucose=health_data.glucose,
        glucose_history=baseline_features.get("glucose_history"),
    )
    glucose_score = glucose_result["glucose_score"]
    fatigue_result = compute_fatigue_score(
        sleep_hours=health_data.sleep_hours,
        resting_hr=health_data.resting_heart_rate,
        workout_minutes=health_data.workout_minutes,
    )
    fatigue_score = fatigue_result["fatigue_score"]
    fatigue = fatigue_result["fatigue_level"]
    trend_result = analyze_trends(
        last_7_days_hr=baseline_features["last_7_days_hr"],
        last_7_days_glucose=baseline_features["last_7_days_glucose"],
        last_7_days_workout=baseline_features["last_7_days_workout"],
    )
    age_score = max(MIN_SCORE, MAX_SCORE - health_data.age * AGE_PENALTY)
    overall_score = round(
        (cardio_score * CARDIO_WEIGHT)
        + (glucose_score * GLUCOSE_WEIGHT)
        + (fatigue_score * FATIGUE_WEIGHT)
        + (age_score * (1 - CARDIO_WEIGHT - GLUCOSE_WEIGHT - FATIGUE_WEIGHT)),
        2,
    )

    doctor_review_required = (
        overall_score < DOCTOR_REVIEW_SCORE_CUTOFF
        or health_data.spo2 < DOCTOR_REVIEW_SPO2_CUTOFF
        or health_data.glucose > DOCTOR_REVIEW_GLUCOSE_CUTOFF
        or trend_result["trend_risk"] >= 1.5
        or len(trend_result["trend_flags"]) >= 2
    )

    return PredictResponse(
        overall_score=overall_score,
        cardio_score=round(cardio_score, 2),
        glucose_score=round(glucose_score, 2),
        fatigue_level=fatigue,
        recommendation="Increase hydration, improve sleep, and retest key vitals in 72 hours.",
        doctor_review_required=doctor_review_required,
    )
