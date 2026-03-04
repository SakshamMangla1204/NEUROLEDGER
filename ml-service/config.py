from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"


@dataclass(frozen=True)
class ModelConfig:
    version: str
    dataset_path: Path
    model_path: Path
    target_column: str
    feature_columns: Optional[List[str]] = None


MODEL_VERSION = "v1.0"
MODEL_PATH = "models/fatigue_model.pkl"

HIGH_HR_THRESHOLD = 90.0
LOW_SPO2_THRESHOLD = 94.0
MODERATE_GLUCOSE_THRESHOLD = 140.0
HIGH_GLUCOSE_THRESHOLD = 180.0
CARDIO_HIGH_HR_PENALTY = 20.0
CARDIO_LOW_SPO2_PENALTY = 25.0
CARDIO_LOW_WORKOUT_BASE_PENALTY = 15.0
CARDIO_BASELINE_HR_DEVIATION_FACTOR = 0.2
GLUCOSE_MODERATE_PENALTY = 10.0
GLUCOSE_HIGH_PENALTY = 20.0

CARDIO_WEIGHT = 0.4
GLUCOSE_WEIGHT = 0.3
FATIGUE_WEIGHT = 0.3

DOCTOR_REVIEW_SCORE_CUTOFF = 55.0
DOCTOR_REVIEW_SPO2_CUTOFF = 92.0
DOCTOR_REVIEW_GLUCOSE_CUTOFF = 180.0

SAFE_WORKOUT_MINUTES = 45
MAX_SAFE_WORKOUT_MINUTES = 120
MIN_SLEEP_HOURS = 4.0
MAX_SLEEP_HOURS = 10.0

MIN_SCORE = 0.0
MAX_SCORE = 100.0
IDEAL_RESTING_HEART_RATE = 70.0
IDEAL_GLUCOSE = 100.0
SPO2_PENALTY_START = 95.0
HEART_RATE_DEVIATION_PENALTY = 1.2
SPO2_PENALTY = 5.0
GLUCOSE_DEVIATION_PENALTY = 0.7
AGE_PENALTY = 0.2

FATIGUE_SLEEP_TARGET_HOURS = 8.0
FATIGUE_SLEEP_WEIGHT = 0.6
FATIGUE_LOW_SLEEP_THRESHOLD = 6.0
FATIGUE_LOW_SLEEP_PENALTY = 20.0
FATIGUE_HIGH_HR_LOW_SLEEP_ADDITIONAL_PENALTY = 10.0
FATIGUE_HIGH_CUTOFF = 2.0
FATIGUE_MODERATE_CUTOFF = 1.0


MODEL_REGISTRY: Dict[str, ModelConfig] = {
    "v1.0": ModelConfig(
        version="v1.0",
        dataset_path=RAW_DATA_DIR / "dataset.csv",
        model_path=MODEL_DIR / "fatigue_model.pkl",
        target_column="risk",
        feature_columns=None,
    ),
}


def get_model_config(version: Optional[str] = None) -> ModelConfig:
    resolved_version = version or os.getenv("MODEL_VERSION", MODEL_VERSION)
    if resolved_version not in MODEL_REGISTRY:
        available = ", ".join(sorted(MODEL_REGISTRY.keys()))
        raise ValueError(
            f"Unknown model version '{resolved_version}'. Available: {available}"
        )
    return MODEL_REGISTRY[resolved_version]


def ensure_directories() -> None:
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


def available_versions() -> List[str]:
    return sorted(MODEL_REGISTRY.keys())
