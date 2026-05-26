from typing import Dict, List

from config import DOCTOR_REVIEW_SCORE_CUTOFF


def enforce_guardrails(
    overall_score: float,
    trend_flags: List[str],
    cardio_score: float = 100.0,
    glucose_score: float = 100.0,
    fatigue_score: float = 100.0,
    sleep_hours: float = 8.0,
    workout_minutes: int = 45,
    glucose: float = 95.0,
    resting_hr: float = 78.0,
) -> Dict[str, object]:
    dangerous_trends = {
        "rising_resting_hr",
        "glucose_spike_pattern",
        "declining_workout_capacity",
    }
    dangerous_trend_detected = any(flag in dangerous_trends for flag in trend_flags)
    doctor_review_required = overall_score < DOCTOR_REVIEW_SCORE_CUTOFF or dangerous_trend_detected

    recommendations: List[str] = []
    if "declining_workout_capacity" in trend_flags:
        recommendations.append("Reduce workout intensity temporarily.")
    if "rising_resting_hr" in trend_flags:
        recommendations.append("Increase sleep recovery and hydration.")
    if "glucose_spike_pattern" in trend_flags:
        recommendations.append("Prioritize stable meals and monitor glucose trend.")

    if fatigue_score < 80 or sleep_hours < 7:
        recommendations.append("Improve recovery with a consistent 7-8 hour sleep target.")
    if cardio_score < 80 or resting_hr > 90:
        recommendations.append("Keep cardio load light and monitor resting heart rate.")
    if glucose_score < 90 or glucose > 120:
        recommendations.append("Track glucose more closely and keep meals stable.")
    if workout_minutes < 35:
        recommendations.append("Increase daily movement gradually before increasing intensity.")

    if not recommendations:
        recommendations.append("Current signals look stable. Maintain routine wearable sync and periodic report review.")
    recommendations.append("Consult doctor if symptoms persist.")
    recommendations.append("Doctor confirmation is required before acting on this output.")

    safe_recommendation = " ".join(recommendations)
    blocked_terms = ["diagnosis", "diagnose", "prescription", "medication", "drug"]
    lowered = safe_recommendation.lower()
    if any(term in lowered for term in blocked_terms):
        safe_recommendation = "Health signals detected. Doctor confirmation is required before any health decision."

    return {
        "recommendation": safe_recommendation,
        "doctor_review_required": doctor_review_required,
        "trend_flags": trend_flags,
    }
