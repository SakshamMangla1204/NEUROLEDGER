import { useEffect, useState } from "react";
import ChartComponent from "../components/ChartComponent";
import {
  analyzeLatestWearable,
  getDashboard,
  getHealthSummary,
  getWearableMlTrend,
  postHealthMetrics
} from "../api/api";

function average(records, key) {
  const values = records
    .map((record) => Number(record[key]))
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return "--";
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function formatDate(value) {
  if (!value) {
    return "pending";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function buildRecommendations({ history, summary, mlPrediction }) {
  const recommendations = [];
  const avgSleep = average(history, "sleep_hours");
  const avgSteps = average(history, "steps");
  const avgHeart = average(history, "heart_rate");
  const latestGlucose = Number(summary?.glucose);

  if (avgSleep !== "--" && avgSleep < 7) {
    recommendations.push("Recovery is the main improvement area: raise sleep closer to 7-8 hours before increasing workout load.");
  }

  if (avgSteps !== "--" && avgSteps < 7000) {
    recommendations.push("Mobility is moderate: target a gradual step increase toward 7,000+ daily steps.");
  }

  if (avgHeart !== "--" && avgHeart > 90) {
    recommendations.push("Heart-rate trend is elevated: review stress, fever, caffeine, and recent exertion before final clinical action.");
  }

  if (Number.isFinite(latestGlucose) && latestGlucose > 100) {
    recommendations.push("Glucose is above the safe band: keep follow-up testing visible in the report vault.");
  }

  if (mlPrediction?.recommendation) {
    recommendations.push(mlPrediction.recommendation);
  }

  if (!recommendations.length) {
    recommendations.push("Current records look stable: continue routine wearable sync and anchor important reports after upload.");
  }

  return [...new Set(recommendations)].slice(0, 4);
}

function latestActionRecommendation({ summary, mlPrediction }) {
  const heartRate = Number(summary?.latest_heart_rate);
  const sleepHours = Number(summary?.sleep_hours);
  const steps = Number(summary?.steps);
  const glucose = Number(summary?.glucose);

  if (Number.isFinite(glucose) && glucose >= 140) {
    return "Glucose needs attention: keep meals stable, monitor the next readings, and attach follow-up reports if available.";
  }

  if (Number.isFinite(heartRate) && heartRate > 90) {
    return "Heart rate is elevated: prioritize rest, hydration, and avoid heavy exertion until the next reading improves.";
  }

  if (Number.isFinite(steps) && steps < 5000) {
    return "Mobility is the main improvement area: increase daily steps gradually before increasing workout intensity.";
  }

  if (Number.isFinite(sleepHours) && sleepHours < 7) {
    return "Recovery can improve: aim for a consistent 7-8 hour sleep window and recheck fatigue trend.";
  }

  if (mlPrediction?.doctor_review_required) {
    return "ML review is flagged: keep monitoring wearable signals and confirm with a doctor before health decisions.";
  }

  return "Current wearable signals look stable. Keep syncing new readings and anchor important reports after upload.";
}

async function loadWearableOverview(abhaId) {
  const [summaryResult, dashboardResult, trendResult] = await Promise.allSettled([
    getHealthSummary(abhaId),
    getDashboard(abhaId),
    getWearableMlTrend(abhaId)
  ]);

  const summaryData = summaryResult.status === "fulfilled" ? summaryResult.value : null;
  const dashboardData = dashboardResult.status === "fulfilled" ? dashboardResult.value : null;
  const trendData = trendResult.status === "fulfilled" ? trendResult.value : null;

  if (!summaryData && !dashboardData) {
    const reason = summaryResult.reason || dashboardResult.reason;
    throw new Error(reason?.message || "No wearable summary found for this identity.");
  }

  return {
    summaryData,
    dashboardData,
    trendData
  };
}

function healthScore(record) {
  const heart = Math.max(0, 100 - Math.abs((Number(record?.heart_rate) || 78) - 78) * 3);
  const mobility = Math.min(100, Math.round(((Number(record?.steps) || 0) / 10000) * 100));
  const recovery = Math.min(100, Math.round(((Number(record?.sleep_hours) || 0) / 8) * 100));
  const glucose = record?.glucose && Number(record.glucose) > 100 ? 68 : 92;

  return Math.round((heart + mobility + recovery + glucose) / 4);
}

function wearableScores(record) {
  const heart = Math.round(Math.max(0, 100 - Math.abs((Number(record?.heart_rate) || 78) - 78) * 3));
  const mobility = Math.min(100, Math.round(((Number(record?.steps) || 0) / 10000) * 100));
  const recovery = Math.min(100, Math.round(((Number(record?.sleep_hours) || 0) / 8) * 100));
  const glucose = record?.glucose && Number(record.glucose) > 100 ? 68 : 95;

  return {
    heart,
    mobility,
    recovery,
    glucose,
  };
}

export default function Analytics({ currentAbhaId }) {
  const [metrics, setMetrics] = useState({
    abha_id: currentAbhaId,
    heart_rate: 82,
    steps: 5400,
    sleep_hours: 6.4,
    glucose: 95
  });
  const [ingestionResult, setIngestionResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [mlResult, setMlResult] = useState(null);
  const [mlTrend, setMlTrend] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setMetrics((current) => ({ ...current, abha_id: currentAbhaId }));
  }, [currentAbhaId]);

  useEffect(() => {
    let active = true;

    async function loadInitialSummary() {
      try {
        setError("");
        const { summaryData, dashboardData, trendData } = await loadWearableOverview(currentAbhaId);

        if (active) {
          setSummary(summaryData);
          setDashboard(dashboardData);
          setMlTrend(trendData);
        }
      } catch (err) {
        if (active) {
          setSummary(null);
          setDashboard(null);
          setMlTrend(null);
        }
      }
    }

    if (currentAbhaId) {
      loadInitialSummary();
    }

    return () => {
      active = false;
    };
  }, [currentAbhaId]);

  async function onSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      const payload = {
        abha_id: metrics.abha_id,
        heart_rate: Number(metrics.heart_rate),
        steps: Number(metrics.steps),
        sleep_hours: Number(metrics.sleep_hours),
        glucose: Number(metrics.glucose)
      };
      const data = await postHealthMetrics(payload);
      setIngestionResult(data);
      const mlData = await analyzeLatestWearable(metrics.abha_id);
      const { summaryData, dashboardData, trendData } = await loadWearableOverview(metrics.abha_id);
      setSummary(summaryData);
      setDashboard(dashboardData || mlData.dashboard);
      setMlTrend(trendData);
      setMlResult(mlData);
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchSummary() {
    try {
      setError("");
      const { summaryData, dashboardData, trendData } = await loadWearableOverview(metrics.abha_id);
      setSummary(summaryData);
      setDashboard(dashboardData);
      setMlTrend(trendData);
    } catch (err) {
      setError("No wearable summary found yet. Sync Signals first, then load the summary.");
      setSummary(null);
      setDashboard(null);
    }
  }

  async function runMlEngine() {
    try {
      setError("");
      const data = await analyzeLatestWearable(metrics.abha_id);
      const { summaryData, dashboardData, trendData } = await loadWearableOverview(metrics.abha_id);
      setMlResult(data);
      setMlTrend(trendData);
      setDashboard(dashboardData || data.dashboard);
      setSummary(summaryData || (data.wearable ? {
        abha_id: data.wearable.abha_id,
        latest_heart_rate: data.wearable.heart_rate,
        sleep_hours: data.wearable.sleep_hours,
        steps: data.wearable.steps,
        glucose: data.wearable.glucose,
        risk_level: data.wearable.risk_level,
        risk_score: data.wearable.risk_score,
        normalized_signals: data.wearable.normalized_signals,
        received_at: data.wearable.received_at
      } : summary));
    } catch (err) {
      setError("ML analysis could not run. Make sure the ML service and backend are restarted.");
      setMlResult(null);
    }
  }

  const chartItems = [
    { label: "Heart rate", value: Math.min(Number(metrics.heart_rate), 100) },
    { label: "Mobility", value: Math.min(Math.round((Number(metrics.steps) / 10000) * 100), 100) },
    { label: "Recovery", value: Math.min(Math.round((Number(metrics.sleep_hours) / 8) * 100), 100) },
    { label: "Glucose", value: Math.min(Number(metrics.glucose), 100) }
  ];
  const history = dashboard?.identity?.metrics || [];
  const chartHistory = history.length
    ? history
    : [{
        heart_rate: Number(metrics.heart_rate),
        steps: Number(metrics.steps),
        sleep_hours: Number(metrics.sleep_hours),
        glucose: Number(metrics.glucose),
        received_at: new Date().toISOString()
      }];
  const healthTrend = chartHistory.map((record, index) => ({
    label: record.received_at ? formatDate(record.received_at) : `Record ${index + 1}`,
    value: healthScore(record)
  }));
  const mlTrendRows = mlTrend?.trend || [];
  const fallbackTrendRows = chartHistory.map((record, index) => ({
    label: record.received_at ? formatDate(record.received_at) : `Record ${index + 1}`,
    scores: wearableScores(record),
    value: healthScore(record)
  }));
  const trendGroups = [
    {
      label: "Overall",
      color: "#155eef",
      visualOffset: 2,
      values: (mlTrendRows.length ? mlTrendRows : fallbackTrendRows).map((record, index) => ({
        label: record.receivedAt ? formatDate(record.receivedAt) : record.label || `Record ${index + 1}`,
        value: record.ml?.overall_score ?? record.value
      }))
    },
    {
      label: "Cardio",
      color: "#0ea5e9",
      visualOffset: -4,
      values: (mlTrendRows.length ? mlTrendRows : fallbackTrendRows).map((record, index) => ({
        label: record.receivedAt ? formatDate(record.receivedAt) : record.label || `Record ${index + 1}`,
        value: record.ml?.cardio_score ?? record.scores?.heart
      }))
    },
    {
      label: "Glucose",
      color: "#15803d",
      visualOffset: 0,
      values: (mlTrendRows.length ? mlTrendRows : fallbackTrendRows).map((record, index) => ({
        label: record.receivedAt ? formatDate(record.receivedAt) : record.label || `Record ${index + 1}`,
        value: record.ml?.glucose_score ?? record.scores?.glucose
      }))
    },
    {
      label: mlTrendRows.length ? "Fatigue" : "Recovery",
      color: "#9a6700",
      visualOffset: 5,
      values: (mlTrendRows.length ? mlTrendRows : fallbackTrendRows).map((record, index) => ({
        label: record.receivedAt ? formatDate(record.receivedAt) : record.label || `Record ${index + 1}`,
        value: record.ml
          ? record.ml.fatigue_level === "low" ? 95 : record.ml.fatigue_level === "moderate" ? 65 : 35
          : record.scores?.recovery
      }))
    }
  ];
  const latestPrediction = mlTrend?.latestPrediction || mlResult?.prediction || dashboard?.latestPrediction?.prediction;
  const firstRecord = history[0];
  const lastRecord = history[history.length - 1];
  const highOrModerateCount = history.filter((record) => record.risk_level !== "LOW").length;
  const recommendations = buildRecommendations({ history, summary, mlPrediction: latestPrediction });
  const primaryRecommendation = latestActionRecommendation({ summary, mlPrediction: latestPrediction });

  return (
    <div className="page">
      <section className="section-header">
        <span className="section-kicker">Wearables</span>
        <h2>Send metrics to the backend</h2>
        <p>Use this page to post sample wearable data and read back the saved summary.</p>
      </section>

      <section className="page-grid">
        <form className="panel col-7 stack" onSubmit={onSubmit}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Post wearable metrics</h2>
              <p className="panel-copy">Main write operation: `POST /api/health-metrics`.</p>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="wearable-abha">ABHA ID</label>
              <input
                id="wearable-abha"
                value={metrics.abha_id}
                onChange={(event) => setMetrics({ ...metrics, abha_id: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="heart-rate">Heart rate</label>
              <input
                id="heart-rate"
                type="number"
                min="30"
                max="220"
                value={metrics.heart_rate}
                onChange={(event) => setMetrics({ ...metrics, heart_rate: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="steps">Steps</label>
              <input
                id="steps"
                type="number"
                min="0"
                max="200000"
                value={metrics.steps}
                onChange={(event) => setMetrics({ ...metrics, steps: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="sleep-hours">Sleep hours</label>
              <input
                id="sleep-hours"
                type="number"
                min="0"
                max="24"
                step="0.1"
                value={metrics.sleep_hours}
                onChange={(event) => setMetrics({ ...metrics, sleep_hours: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="glucose">Glucose</label>
              <input
                id="glucose"
                type="number"
                min="40"
                max="500"
                value={metrics.glucose}
                onChange={(event) => setMetrics({ ...metrics, glucose: event.target.value })}
              />
            </div>
          </div>

          <div className="action-row">
            <button className="primary-button" type="submit">
              Sync Signals
            </button>
            <button className="secondary-button" type="button" onClick={fetchSummary}>
              Overall Summary
            </button>
            <button className="secondary-button" type="button" onClick={runMlEngine}>
              Run ML Engine
            </button>
          </div>

          {ingestionResult ? (
            <div className="metrics-strip">
              <div className="metric-pill">
                <span>Risk</span>
                <strong>{ingestionResult.risk_level}</strong>
              </div>
              <div className="metric-pill">
                <span>Score</span>
                <strong>{ingestionResult.risk_score}</strong>
              </div>
              <div className="metric-pill">
                <span>Heart</span>
                <strong>{ingestionResult.normalized_signals?.heart_rate}</strong>
              </div>
              <div className="metric-pill">
                <span>Sleep</span>
                <strong>{ingestionResult.normalized_signals?.sleep_hours}</strong>
              </div>
            </div>
          ) : null}

          {error ? <div className="empty-state">{error}</div> : null}
        </form>

        <div className="col-5">
          <ChartComponent title="Health improvement" items={chartItems} series={healthTrend} seriesGroups={trendGroups} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Overall summary till date</h2>
            <p className="panel-copy">Combined view from identity history, wearable records, ML prediction, report vault, and blockchain state.</p>
          </div>
        </div>

        {summary || dashboard ? (
          <div className="stats-grid">
            <HealthMetric label="Records" value={history.length || 1} meta={`${formatDate(firstRecord?.received_at || summary?.received_at)} to ${formatDate(lastRecord?.received_at || summary?.received_at)}`} />
            <HealthMetric label="Avg heart" value={average(history.length ? history : [summary], "heart_rate")} meta={`Latest ${summary?.latest_heart_rate ?? "--"} bpm`} />
            <HealthMetric label="Avg sleep" value={average(history.length ? history : [summary], "sleep_hours")} meta={`Latest ${summary?.sleep_hours ?? "--"} hours`} />
            <HealthMetric label="Avg steps" value={average(history.length ? history : [summary], "steps")} meta={`Latest ${summary?.steps ?? "--"}`} />
            <HealthMetric label="Glucose" value={summary?.glucose ?? "--"} meta={summary?.normalized_signals?.glucose || "pending"} />
            <HealthMetric label="Risk flags" value={highOrModerateCount} meta="moderate/high records" />
            <HealthMetric label="Reports" value={dashboard?.reportSummary?.totalReports ?? 0} meta={`${dashboard?.reportSummary?.anchoredReports ?? 0} anchored`} />
            <HealthMetric label="ML score" value={latestPrediction?.overall_score ?? dashboard?.mlRiskScore ?? "--"} meta={latestPrediction?.risk_level || summary?.risk_level || "pending"} />
          </div>
        ) : (
          <div className="empty-state">
            No summary loaded yet. Sync metrics, load the overall summary, or run the ML engine.
          </div>
        )}

        {(summary || latestPrediction) ? (
          <div className="ml-recommendation-grid">
            <div className="result-card">
              <span className="endpoint-label">ML recommendation</span>
              <strong>{latestPrediction?.doctor_review_required ? "Doctor review required" : "Routine monitoring"}</strong>
              <p>{primaryRecommendation}</p>
            </div>
            <div className="result-card">
              <span className="endpoint-label">Project trust state</span>
              <strong>{dashboard?.blockchain?.verified ? "Ledger-backed reports available" : "Reports pending finalization"}</strong>
              <p>{dashboard?.blockchainVerificationStatus?.latestTransactionHash || "No latest blockchain transaction loaded yet."}</p>
            </div>
          </div>
        ) : null}

        {(summary || latestPrediction) ? (
          <div className="list">
            {recommendations.map((item) => (
              <div className="list-item" key={item}>
                <p>{item}</p>
              </div>
            ))}
          </div>
        ) : null}

      </section>
    </div>
  );
}

function HealthMetric({ label, value, meta }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {meta ? <p className="stat-meta">{meta}</p> : null}
    </div>
  );
}
