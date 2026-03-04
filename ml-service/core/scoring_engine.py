from typing import Dict, Union

from config import CARDIO_WEIGHT, FATIGUE_WEIGHT, GLUCOSE_WEIGHT
from utils.helpers import clamp_score


def _risk_level(overall_score: float) -> str:
    if overall_score > 75:
        return "low"
    if overall_score >= 50:
        return "moderate"
    return "high"


def compute_overall_score(
    cardio_score: float,
    glucose_score: float,
    fatigue_score: float,
) -> Dict[str, Union[float, str]]:
    weighted_score = (
        (cardio_score * CARDIO_WEIGHT)
        + (glucose_score * GLUCOSE_WEIGHT)
        + (fatigue_score * FATIGUE_WEIGHT)
    )
    overall_score = round(clamp_score(weighted_score, 0.0, 100.0), 2)
    return {
        "overall_score": overall_score,
        "risk_level": _risk_level(overall_score),
    }
