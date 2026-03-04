from typing import Dict, List, Optional

from config import (
    GLUCOSE_HIGH_PENALTY,
    GLUCOSE_MODERATE_PENALTY,
    HIGH_GLUCOSE_THRESHOLD,
    MAX_SCORE,
    MIN_SCORE,
    MODERATE_GLUCOSE_THRESHOLD,
)


def compute_glucose_score(glucose: float, glucose_history: Optional[List[float]] = None) -> Dict[str, float]:
    glucose_score = MAX_SCORE

    if glucose > HIGH_GLUCOSE_THRESHOLD:
        glucose_score -= GLUCOSE_HIGH_PENALTY
    elif glucose > MODERATE_GLUCOSE_THRESHOLD:
        glucose_score -= GLUCOSE_MODERATE_PENALTY

    glucose_score = max(MIN_SCORE, min(MAX_SCORE, glucose_score))
    history_avg = 0.0
    if glucose_history:
        history_avg = float(sum(glucose_history) / len(glucose_history))

    return {
        "glucose_score": round(glucose_score, 2),
        "glucose_history_avg": round(history_avg, 2),
    }
