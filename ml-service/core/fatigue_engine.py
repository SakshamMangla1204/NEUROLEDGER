from typing import Dict, Union

from config import (
    FATIGUE_HIGH_CUTOFF,
    FATIGUE_HIGH_HR_LOW_SLEEP_ADDITIONAL_PENALTY,
    FATIGUE_LOW_SLEEP_PENALTY,
    FATIGUE_LOW_SLEEP_THRESHOLD,
    FATIGUE_MODERATE_CUTOFF,
    HIGH_HR_THRESHOLD,
    MAX_SCORE,
    MIN_SCORE,
)


def compute_fatigue_score(
    sleep_hours: float,
    resting_hr: float,
    workout_minutes: int,
) -> Dict[str, Union[float, str]]:
    fatigue_score = MAX_SCORE

    low_sleep = sleep_hours < FATIGUE_LOW_SLEEP_THRESHOLD
    high_hr = resting_hr > HIGH_HR_THRESHOLD

    if low_sleep:
        fatigue_score -= FATIGUE_LOW_SLEEP_PENALTY

    if high_hr and low_sleep:
        fatigue_score -= FATIGUE_HIGH_HR_LOW_SLEEP_ADDITIONAL_PENALTY

    if workout_minutes <= 0:
        fatigue_score -= 5.0

    fatigue_score = max(MIN_SCORE, min(MAX_SCORE, fatigue_score))
    fatigue_index = (MAX_SCORE - fatigue_score) / 20
    fatigue_level = (
        "high"
        if fatigue_index >= FATIGUE_HIGH_CUTOFF
        else "moderate"
        if fatigue_index >= FATIGUE_MODERATE_CUTOFF
        else "low"
    )

    return {
        "fatigue_score": round(fatigue_score, 2),
        "fatigue_level": fatigue_level,
    }
