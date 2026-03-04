from config import (
    DOCTOR_REVIEW_GLUCOSE_CUTOFF,
    DOCTOR_REVIEW_SPO2_CUTOFF,
)
from core.baseline import compute_baseline_features
from core.cardio_engine import compute_cardio_score
from core.fatigue_engine import compute_fatigue_score
from core.glucose_engine import compute_glucose_score
from core.normalization import normalize_input
from core.scoring_engine import compute_overall_score
from core.trend_engine import analyze_trends
from services.guardrail_service import enforce_guardrails
from schemas import PredictRequest, PredictResponse
from utils.logger import (
    get_logger,
    log_abnormal_health_metrics_detected,
    log_error_occurred,
    log_ml_pipeline_executed,
    log_prediction_request_received,
)

logger = get_logger("neuroledger.ml.prediction")


def predict_health(health_data: PredictRequest) -> PredictResponse:
    log_prediction_request_received(
        logger,
        {
            "age": health_data.age,
            "resting_heart_rate": health_data.resting_heart_rate,
            "spo2": health_data.spo2,
            "glucose": health_data.glucose,
        },
    )
    try:
        normalized_data = normalize_input(health_data)
        baseline_data = compute_baseline_features(
            health_data=health_data,
            normalized_features=normalized_data,
        )
        cardio_output = compute_cardio_score(
            normalized_features=normalized_data,
            baseline_features=baseline_data,
            spo2=health_data.spo2,
            workout_minutes=health_data.workout_minutes,
        )
        glucose_output = compute_glucose_score(
            glucose=health_data.glucose,
            glucose_history=baseline_data.get("glucose_history"),
        )
        fatigue_output = compute_fatigue_score(
            sleep_hours=health_data.sleep_hours,
            resting_hr=health_data.resting_heart_rate,
            workout_minutes=health_data.workout_minutes,
        )
        trend_output = analyze_trends(
            last_7_days_hr=baseline_data["last_7_days_hr"],
            last_7_days_glucose=baseline_data["last_7_days_glucose"],
            last_7_days_workout=baseline_data["last_7_days_workout"],
        )
        scoring_output = compute_overall_score(
            cardio_score=cardio_output["cardio_score"],
            glucose_score=glucose_output["glucose_score"],
            fatigue_score=fatigue_output["fatigue_score"],
        )
        overall_score = scoring_output["overall_score"]
        risk_level = scoring_output["risk_level"]

        guardrail_output = enforce_guardrails(
            overall_score=overall_score,
            trend_flags=trend_output["trend_flags"],
        )

        doctor_review_required = (
            guardrail_output["doctor_review_required"]
            or health_data.spo2 < DOCTOR_REVIEW_SPO2_CUTOFF
            or health_data.glucose > DOCTOR_REVIEW_GLUCOSE_CUTOFF
            or trend_output["trend_risk"] >= 1.5
        )

        if doctor_review_required:
            log_abnormal_health_metrics_detected(
                logger,
                {
                    "overall_score": overall_score,
                    "spo2": health_data.spo2,
                    "glucose": health_data.glucose,
                    "trend_flags": trend_output["trend_flags"],
                },
            )

        response = PredictResponse(
            overall_score=overall_score,
            risk_level=risk_level,
            cardio_score=round(cardio_output["cardio_score"], 2),
            glucose_score=round(glucose_output["glucose_score"], 2),
            fatigue_level=fatigue_output["fatigue_level"],
            trend_flags=trend_output["trend_flags"],
            recommendation=guardrail_output["recommendation"],
            doctor_review_required=doctor_review_required,
        )
        log_ml_pipeline_executed(
            logger,
            {
                "overall_score": response.overall_score,
                "risk_level": response.risk_level,
                "doctor_review_required": response.doctor_review_required,
            },
        )
        return response
    except Exception as error:
        log_error_occurred(
            logger,
            error,
            {
                "age": health_data.age,
                "resting_heart_rate": health_data.resting_heart_rate,
                "spo2": health_data.spo2,
                "glucose": health_data.glucose,
            },
        )
        raise
