import json
import sys

try:
    import requests
except ImportError:
    print("Error: 'requests' is not installed. Install it with: pip install requests")
    sys.exit(1)

BASE_URL = "http://127.0.0.1:8000"

TEST_CASES = [
    (
        "UPLOADED DATA",
        {
            "resting_heart_rate": 62,
            "spo2": 99,
            "glucose": 88,
            "sleep_hours": 8,
            "workout_minutes": 60,
            "age": 26,
        },
    ),
]


def print_json(data):
    print(json.dumps(data, indent=2, sort_keys=True))


def health_check():
    print("---- HEALTH CHECK ----")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        response.raise_for_status()
        print("Server status: OK")
        print_json(response.json())
        return True
    except requests.exceptions.RequestException as exc:
        print("Server status: DOWN")
        print(f"Error: {exc}")
        return False


def run_test_case(title, payload):
    print(f"\n---- {title} ----")
    try:
        response = requests.post(f"{BASE_URL}/predict", json=payload, timeout=15)
        response.raise_for_status()
        print_json(response.json())
    except requests.exceptions.RequestException as exc:
        print(f"Request failed: {exc}")
        if hasattr(exc, "response") and exc.response is not None:
            try:
                print_json(exc.response.json())
            except Exception:
                print(exc.response.text)


def main():
    if not health_check():
        print("\nServer is not running. Start it with: uvicorn app:app --reload")
        sys.exit(1)

    for title, payload in TEST_CASES:
        run_test_case(title, payload)


if __name__ == "__main__":
    main()
