from typing import Dict

from config import (
    CARDIO_BASELINE_HR_DEVIATION_FACTOR,
    CARDIO_HIGH_HR_PENALTY,
    CARDIO_LOW_SPO2_PENALTY,
    CARDIO_LOW_WORKOUT_BASE_PENALTY,
    HIGH_HR_THRESHOLD,
    LOW_SPO2_THRESHOLD,
    SAFE_WORKOUT_MINUTES,
    MAX_SCORE,
    MIN_SCORE,
)


def compute_cardio_score(
    normalized_features: Dict[str, float],
    baseline_features: Dict[str, float],
    spo2: float,
    workout_minutes: int,
) -> Dict[str, float]:
    normalized_hr = normalized_features.get("resting_heart_rate", 0.0)
    current_hr = normalized_hr * MAX_SCORE
    hr_deviation = baseline_features.get("hr_deviation", 0.0)

    cardio_score = MAX_SCORE

    if current_hr > HIGH_HR_THRESHOLD:
        cardio_score -= CARDIO_HIGH_HR_PENALTY
        cardio_score -= abs(hr_deviation) * CARDIO_BASELINE_HR_DEVIATION_FACTOR

    if spo2 < LOW_SPO2_THRESHOLD:
        cardio_score -= CARDIO_LOW_SPO2_PENALTY

    if workout_minutes < SAFE_WORKOUT_MINUTES:
        workout_deficit_ratio = (SAFE_WORKOUT_MINUTES - max(workout_minutes, 0)) / SAFE_WORKOUT_MINUTES
        cardio_score -= CARDIO_LOW_WORKOUT_BASE_PENALTY * workout_deficit_ratio

    cardio_score = max(MIN_SCORE, min(MAX_SCORE, cardio_score))

    return {
        "cardio_score": round(cardio_score, 2),
        "high_hr_risk": float(current_hr > HIGH_HR_THRESHOLD),
        "low_spo2_risk": float(spo2 < LOW_SPO2_THRESHOLD),
    }
