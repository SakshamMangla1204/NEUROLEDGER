from typing import Dict, List, Optional, Union

from schemas import PredictRequest


def _mean(values: List[float]) -> float:
    if not values:
        return 0.0
    return float(sum(values) / len(values))


def compute_baseline_features(
    health_data: PredictRequest,
    normalized_features: Dict[str, float],
    last_14_days_hr: Optional[List[float]] = None,
    last_14_days_glucose: Optional[List[float]] = None,
    last_7_days_hr: Optional[List[float]] = None,
    last_7_days_glucose: Optional[List[float]] = None,
    last_7_days_workout: Optional[List[float]] = None,
) -> Dict[str, Union[float, List[float]]]:
    hr_14 = [float(v) for v in (last_14_days_hr or [health_data.resting_heart_rate] * 14)]
    glucose_14 = [float(v) for v in (last_14_days_glucose or [health_data.glucose] * 14)]

    baseline_hr = _mean(hr_14)
    baseline_glucose = _mean(glucose_14)

    return {
        "baseline_hr": round(baseline_hr, 2),
        "baseline_glucose": round(baseline_glucose, 2),
        "hr_deviation": round(health_data.resting_heart_rate - baseline_hr, 2),
        "glucose_deviation": round(health_data.glucose - baseline_glucose, 2),
        "glucose_history": glucose_14,
        "last_7_days_hr": [float(v) for v in (last_7_days_hr or [health_data.resting_heart_rate] * 7)],
        "last_7_days_glucose": [float(v) for v in (last_7_days_glucose or [health_data.glucose] * 7)],
        "last_7_days_workout": [float(v) for v in (last_7_days_workout or [health_data.workout_minutes] * 7)],
        "normalized_features": normalized_features,
    }
