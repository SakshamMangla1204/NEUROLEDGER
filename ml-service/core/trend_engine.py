from typing import Dict, List, Optional, Union


def slope(values: List[float]) -> float:
    series = [float(v) for v in values if v is not None]
    n = len(series)
    if n < 2:
        return 0.0
    x_mean = (n - 1) / 2
    y_mean = sum(series) / n
    num = 0.0
    den = 0.0
    for i, y in enumerate(series):
        dx = i - x_mean
        num += dx * (y - y_mean)
        den += dx * dx
    if den == 0:
        return 0.0
    return num / den


def analyze_trends(
    last_7_days_hr: List[float],
    last_7_days_glucose: List[float],
    last_7_days_workout: Optional[List[float]] = None,
) -> Dict[str, Union[float, str, List[str]]]:
    hr_slope = slope(last_7_days_hr)
    glucose_slope = slope(last_7_days_glucose)
    workout_slope = slope(last_7_days_workout or [])

    trend_flags: List[str] = []

    if hr_slope > 1.0:
        trend_flags.append("rising_resting_hr")

    glucose_series = [float(v) for v in last_7_days_glucose if v is not None]
    if glucose_slope > 3.0:
        trend_flags.append("glucose_spike_pattern")
    elif len(glucose_series) >= 2 and (max(glucose_series) - min(glucose_series)) >= 35:
        trend_flags.append("glucose_spike_pattern")

    if last_7_days_workout and workout_slope < -2.0:
        trend_flags.append("declining_workout_capacity")

    trend_risk = 0.0
    trend_risk += min(max(hr_slope, 0.0) / 3.0, 1.0)
    trend_risk += min(max(glucose_slope, 0.0) / 8.0, 1.0)
    if workout_slope < 0:
        trend_risk += min(abs(workout_slope) / 8.0, 1.0)

    return {
        "hr_slope": round(hr_slope, 3),
        "glucose_slope": round(glucose_slope, 3),
        "workout_slope": round(workout_slope, 3),
        "trend_flags": trend_flags,
        "trend_risk": round(min(trend_risk, 3.0), 2),
    }
