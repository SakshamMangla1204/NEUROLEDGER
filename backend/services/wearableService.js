const {
  STORE_FILES,
  readJson,
  writeJson,
} = require("./localStoreService");
const { normalizeAbhaId } = require("./mockAbhaService");

const THRESHOLDS = {
  heartRate: {
    low: 60,
    high: 90,
  },
  sleepHours: {
    poor: 6,
    good: 8,
  },
  steps: {
    sedentary: 3000,
    active: 7000,
  },
  glucose: {
    safe: 100,
    risk: 140,
  },
};

function listWearableRecords() {
  return readJson(STORE_FILES.wearables, []);
}

function writeWearableRecords(records) {
  writeJson(STORE_FILES.wearables, records);
}

function latestWearableRecord(abhaId) {
  const normalized = normalizeAbhaId(abhaId);
  const matches = listWearableRecords().filter(
    (record) => normalizeAbhaId(record.abha_id || record.abhaId) === normalized
  );
  return matches.length ? matches[matches.length - 1] : null;
}

function normalizeHeartRate(heartRate) {
  if (heartRate < THRESHOLDS.heartRate.low) {
    return "LOW";
  }
  if (heartRate > THRESHOLDS.heartRate.high) {
    return "HIGH";
  }
  return "NORMAL";
}

function normalizeSleepHours(sleepHours) {
  if (sleepHours < THRESHOLDS.sleepHours.poor) {
    return "POOR";
  }
  if (sleepHours >= THRESHOLDS.sleepHours.good) {
    return "GOOD";
  }
  return "OK";
}

function normalizeSteps(steps) {
  if (steps < THRESHOLDS.steps.sedentary) {
    return "SEDENTARY";
  }
  if (steps >= THRESHOLDS.steps.active) {
    return "ACTIVE";
  }
  return "MODERATE";
}

function normalizeGlucose(glucose) {
  if (glucose > THRESHOLDS.glucose.risk) {
    return "RISK";
  }
  if (glucose <= THRESHOLDS.glucose.safe) {
    return "SAFE";
  }
  return "ELEVATED";
}

function normalizeMetrics(payload) {
  return {
    heart_rate: normalizeHeartRate(payload.heart_rate),
    sleep_hours: normalizeSleepHours(payload.sleep_hours),
    steps: normalizeSteps(payload.steps),
    glucose: normalizeGlucose(payload.glucose),
  };
}

function calculateRisk(normalizedSignals) {
  let score = 0;

  if (normalizedSignals.heart_rate === "HIGH") {
    score += 2;
  } else if (normalizedSignals.heart_rate === "LOW") {
    score += 1;
  }

  if (normalizedSignals.sleep_hours === "POOR") {
    score += 1;
  }

  if (normalizedSignals.steps === "SEDENTARY") {
    score += 1;
  }

  if (normalizedSignals.glucose === "RISK") {
    score += 2;
  } else if (normalizedSignals.glucose === "ELEVATED") {
    score += 1;
  }

  const riskLevel = score >= 3 ? "HIGH" : score >= 1 ? "MODERATE" : "LOW";

  return {
    risk_score: score,
    risk_level: riskLevel,
  };
}

function ingestHealthMetrics(payload) {
  const normalized = normalizeAbhaId(payload.abha_id);
  const snapshot = {
    abha_id: normalized,
    heart_rate: Number(payload.heart_rate),
    steps: Number(payload.steps),
    sleep_hours: Number(payload.sleep_hours),
    glucose: Number(payload.glucose),
    received_at: new Date().toISOString(),
    source: payload.source || "health_connect_bridge",
  };

  const normalizedSignals = normalizeMetrics(snapshot);
  const risk = calculateRisk(normalizedSignals);
  const wearableRecord = {
    ...snapshot,
    normalized_signals: normalizedSignals,
    ...risk,
  };

  const records = listWearableRecords();
  records.push(wearableRecord);
  writeWearableRecords(records);
  return wearableRecord;
}

function buildHealthSummary(abhaId) {
  const latest = latestWearableRecord(abhaId);
  if (!latest) {
    return null;
  }

  return {
    latest_heart_rate: latest.heart_rate,
    sleep_hours: latest.sleep_hours,
    steps: latest.steps,
    glucose: latest.glucose,
    risk_level: latest.risk_level,
    normalized_signals: latest.normalized_signals,
    received_at: latest.received_at,
  };
}

module.exports = {
  buildHealthSummary,
  calculateRisk,
  ingestHealthMetrics,
  latestWearableRecord,
  normalizeMetrics,
};
