from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

import joblib
import pandas as pd

from config import get_model_config


def load_artifact(version: Optional[str] = None) -> Dict[str, Any]:
    cfg = get_model_config(version)
    if not cfg.model_path.exists():
        raise FileNotFoundError(
            f"Model file not found: {cfg.model_path}. Train it first for version {cfg.version}."
        )
    return joblib.load(cfg.model_path)


def predict_one(payload: Dict[str, Any], version: Optional[str] = None) -> Dict[str, Any]:
    artifact = load_artifact(version)
    model = artifact["model"]
    metadata = artifact["metadata"]

    input_df = pd.DataFrame([payload])
    prediction = model.predict(input_df)[0]

    response: Dict[str, Any] = {
        "prediction": int(prediction) if str(prediction).isdigit() else prediction,
        "model_version": metadata["model_version"],
    }

    if hasattr(model, "predict_proba"):
        prob = float(model.predict_proba(input_df)[0][1])
        response["risk_probability"] = prob

    return response


def predict_batch(records: Iterable[Dict[str, Any]], version: Optional[str] = None) -> Dict[str, Any]:
    artifact = load_artifact(version)
    model = artifact["model"]
    metadata = artifact["metadata"]

    input_df = pd.DataFrame(records)
    preds = model.predict(input_df).tolist()

    return {
        "predictions": preds,
        "count": len(preds),
        "model_version": metadata["model_version"],
    }
