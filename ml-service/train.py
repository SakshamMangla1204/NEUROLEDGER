"""Train and persist a versioned heart-risk model.

Usage:
  python train.py --version v1.0
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from config import ensure_directories, get_model_config


def load_dataset(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    if df.empty:
        raise ValueError(f"Dataset at '{path}' is empty.")
    return df


def build_pipeline(feature_frame: pd.DataFrame) -> Pipeline:
    numeric_cols = feature_frame.select_dtypes(include=["number"]).columns.tolist()
    categorical_cols = [c for c in feature_frame.columns if c not in numeric_cols]

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, numeric_cols),
            ("cat", categorical_pipeline, categorical_cols),
        ]
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", LogisticRegression(max_iter=1000)),
        ]
    )


def train(version: str) -> dict:
    ensure_directories()
    cfg = get_model_config(version)

    df = load_dataset(str(cfg.dataset_path))
    if cfg.target_column not in df.columns:
        raise ValueError(
            f"Target column '{cfg.target_column}' not found in {cfg.dataset_path.name}."
        )

    feature_columns = cfg.feature_columns or [
        c for c in df.columns if c != cfg.target_column
    ]

    missing_features = [c for c in feature_columns if c not in df.columns]
    if missing_features:
        raise ValueError(f"Missing feature columns: {missing_features}")

    X = df[feature_columns]
    y = df[cfg.target_column]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y if y.nunique() > 1 else None,
    )

    pipeline = build_pipeline(X)
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))

    artifact = {
        "model": pipeline,
        "metadata": {
            "model_version": cfg.version,
            "trained_at_utc": datetime.now(timezone.utc).isoformat(),
            "dataset_path": str(cfg.dataset_path),
            "target_column": cfg.target_column,
            "feature_columns": feature_columns,
            "accuracy": accuracy,
        },
    }

    joblib.dump(artifact, cfg.model_path)
    return artifact["metadata"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", default=None, help="Model version to train")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    metadata = train(args.version)
    print("Training complete")
    print(metadata)


if __name__ == "__main__":
    main()
