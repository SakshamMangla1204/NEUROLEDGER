from typing import Iterable, List


def clamp_score(value: float, lower: float = 0.0, upper: float = 100.0) -> float:
    return max(lower, min(upper, float(value)))


def normalize_range(
    value: float,
    source_min: float = 0.0,
    source_max: float = 100.0,
    target_min: float = 0.0,
    target_max: float = 1.0,
) -> float:
    if source_max == source_min:
        return target_min
    ratio = (float(value) - source_min) / (source_max - source_min)
    return target_min + ratio * (target_max - target_min)


def safe_average(values: Iterable[float], default: float = 0.0) -> float:
    series = [float(v) for v in values if v is not None]
    if not series:
        return float(default)
    return float(sum(series) / len(series))


def safe_mean(values: Iterable[float], default: float = 0.0) -> float:
    return safe_average(values, default=default)


def calculate_slope(values: List[float]) -> float:
    series = [float(v) for v in values if v is not None]
    n = len(series)
    if n < 2:
        return 0.0
    x_mean = (n - 1) / 2
    y_mean = safe_average(series, default=0.0)
    numerator = 0.0
    denominator = 0.0
    for idx, point in enumerate(series):
        dx = idx - x_mean
        numerator += dx * (point - y_mean)
        denominator += dx * dx
    if denominator == 0:
        return 0.0
    return float(numerator / denominator)
