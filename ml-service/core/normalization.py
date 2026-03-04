from typing import Dict

from config import MAX_SAFE_WORKOUT_MINUTES
from schemas import PredictRequest


def normalize_input(health_data: PredictRequest) -> Dict[str, float]:
    return {
        "resting_heart_rate": max(0.0, min(health_data.resting_heart_rate / 100.0, 2.0)),
        "spo2": max(0.0, min(health_data.spo2 / 100.0, 1.0)),
        "glucose": max(0.0, min(health_data.glucose / 300.0, 2.0)),
        "sleep_hours": max(0.0, min(health_data.sleep_hours / 24.0, 1.0)),
        "workout_minutes": max(0.0, min(health_data.workout_minutes / MAX_SAFE_WORKOUT_MINUTES, 2.0)),
        "age": max(0.0, min(health_data.age / 100.0, 1.2)),
    }
