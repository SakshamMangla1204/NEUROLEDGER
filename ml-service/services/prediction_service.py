import config
from core.baseline import compute_baseline_features
from core.cardio_engine import compute_cardio_score
from core.fatigue_engine import compute_fatigue_score
from core.glucose_engine import compute_glucose_score
from core.normalization import normalize_input
from core.scoring_engine import compute_overall_score
from core.trend_engine import analyze_trends
from services.guardrail_service import enforce_guardrails
from schemas import PredictRequest, PredictResponse
from utils.logger import get_logger, log_event

logger = get_logger("neuroledger.ml.prediction")


def predict_health(health_data: PredictRequest) -> PredictResponse:
    log_event(logger, "predict_started", {"age": health_data.age})
    normalized_features = normalize_input(health_data)
    baseline_features = compute_baseline_features(
        health_data=health_data,
        normalized_features=normalized_features,
    )
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
    scoring_result = compute_overall_score(
        cardio_score=cardio_score,
        glucose_score=glucose_score,
        fatigue_score=fatigue_score,
    )
    overall_score = scoring_result["overall_score"]
    risk_level = scoring_result["risk_level"]

    doctor_review_required = (
        overall_score < config.DOCTOR_REVIEW_SCORE_CUTOFF
        or health_data.spo2 < config.DOCTOR_REVIEW_SPO2_CUTOFF
        or health_data.glucose > config.DOCTOR_REVIEW_GLUCOSE_CUTOFF
        or trend_result["trend_risk"] >= 1.5
        or len(trend_result["trend_flags"]) >= 2
    )

    guardrail_result = enforce_guardrails(
        overall_score=overall_score,
        trend_flags=trend_result["trend_flags"],
    )
    doctor_review_required = (
        doctor_review_required or guardrail_result["doctor_review_required"]
    )

    response = PredictResponse(
        overall_score=overall_score,
        risk_level=risk_level,
        cardio_score=round(cardio_score, 2),
        glucose_score=round(glucose_score, 2),
        fatigue_level=fatigue,
        trend_flags=guardrail_result["trend_flags"],
        recommendation=guardrail_result["recommendation"],
        doctor_review_required=doctor_review_required,
    )
    log_event(
        logger,
        "predict_completed",
        {
            "overall_score": response.overall_score,
            "risk_level": response.risk_level,
            "doctor_review_required": response.doctor_review_required,
        },
    )
    return response
