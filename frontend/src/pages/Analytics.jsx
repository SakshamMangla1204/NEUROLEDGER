import { useEffect, useState } from "react";
import ChartComponent from "../components/ChartComponent";
import { getHealthSummary, postHealthMetrics } from "../api/api";

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
  const [error, setError] = useState("");

  useEffect(() => {
    setMetrics((current) => ({ ...current, abha_id: currentAbhaId }));
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
      setSummary(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchSummary() {
    try {
      setError("");
      const data = await getHealthSummary(metrics.abha_id);
      setSummary(data);
    } catch (err) {
      setError(err.message);
      setSummary(null);
    }
  }

  const chartItems = [
    { label: "Heart rate", value: Math.min(Number(metrics.heart_rate), 100) },
    { label: "Mobility", value: Math.min(Math.round((Number(metrics.steps) / 10000) * 100), 100) },
    { label: "Recovery", value: Math.min(Math.round((Number(metrics.sleep_hours) / 8) * 100), 100) },
    { label: "Glucose", value: Math.min(Number(metrics.glucose), 100) }
  ];

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
                value={metrics.heart_rate}
                onChange={(event) => setMetrics({ ...metrics, heart_rate: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="steps">Steps</label>
              <input
                id="steps"
                type="number"
                value={metrics.steps}
                onChange={(event) => setMetrics({ ...metrics, steps: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="sleep-hours">Sleep hours</label>
              <input
                id="sleep-hours"
                type="number"
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
              Load Latest Summary
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

          <div className="backend-note">Read operation: `GET /api/health-summary/:abha_id`</div>

          {error ? <div className="empty-state">{error}</div> : null}
        </form>

        <div className="col-5">
          <ChartComponent title="Input preview" items={chartItems} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Latest summary</h2>
            <p className="panel-copy">Response from `GET /api/health-summary/:abha_id`.</p>
          </div>
        </div>

        {summary ? (
          <div className="stats-grid">
            <HealthMetric label="Heart rate" value={summary.latest_heart_rate} />
            <HealthMetric label="Sleep" value={summary.sleep_hours} />
            <HealthMetric label="Steps" value={summary.steps} />
            <HealthMetric label="Risk" value={summary.risk_level} />
          </div>
        ) : (
          <div className="empty-state">
            No summary loaded yet. Sync metrics or fetch the latest backend summary.
          </div>
        )}

        {summary ? <div className="code-box">{JSON.stringify(summary, null, 2)}</div> : null}
      </section>
    </div>
  );
}

function HealthMetric({ label, value }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}
