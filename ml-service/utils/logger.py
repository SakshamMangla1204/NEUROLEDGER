import logging
import sys
from typing import Any, Dict


def get_logger(name: str = "neuroledger.ml") -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    logger.addHandler(handler)
    logger.propagate = False
    return logger


def log_event(logger: logging.Logger, event: str, payload: Dict[str, Any]) -> None:
    logger.info("%s %s", event, payload)


def log_prediction_request_received(logger: logging.Logger, payload: Dict[str, Any]) -> None:
    logger.info("prediction_request_received %s", payload)


def log_ml_pipeline_executed(logger: logging.Logger, payload: Dict[str, Any]) -> None:
    logger.info("ml_pipeline_executed %s", payload)


def log_abnormal_health_metrics_detected(logger: logging.Logger, payload: Dict[str, Any]) -> None:
    logger.warning("abnormal_health_metrics_detected %s", payload)


def log_error_occurred(logger: logging.Logger, error: Exception, payload: Dict[str, Any]) -> None:
    logger.exception("error_occurred %s error=%s", payload, str(error))
