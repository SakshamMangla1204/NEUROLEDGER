from typing import Dict, List

from config import DOCTOR_REVIEW_SCORE_CUTOFF


def enforce_guardrails(
    overall_score: float,
    trend_flags: List[str],
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
    if not recommendations:
        recommendations.append("Increase sleep recovery.")
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
