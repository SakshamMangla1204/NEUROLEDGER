import { useState } from "react";
import ChartComponent from "../components/ChartComponent";
import { getHealthSummary, postHealthMetrics } from "../api/api";

const initialMetrics = {
  abha_id: "SAKSHAM@ABDM",
  heart_rate: 82,
  steps: 5400,
  sleep_hours: 6.4
};

export default function Analytics() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [ingestionResult, setIngestionResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      const payload = {
        abha_id: metrics.abha_id,
        heart_rate: Number(metrics.heart_rate),
        steps: Number(metrics.steps),
        sleep_hours: Number(metrics.sleep_hours)
      };
      const data = await postHealthMetrics(payload);
      setIngestionResult(data);
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
    { label: "Heart Rate", value: Math.min(Number(metrics.heart_rate), 100) },
    { label: "Activity", value: Math.min(Math.round((Number(metrics.steps) / 10000) * 100), 100) },
    { label: "Sleep", value: Math.min(Math.round((Number(metrics.sleep_hours) / 8) * 100), 100) }
  ];

  return (
    <div className="page">
      <section className="hero-card">
        <p className="eyebrow">Wearable Ingestion</p>
        <h1>Push Health Connect-style metrics into the backend scoring pipeline with a dedicated clinical workflow.</h1>
        <p>
          This page replaces the previous single prototype section with a focused ingestion and
          summary page for wearable-derived signals.
        </p>
      </section>

      <section className="page-grid">
        <form className="panel col-7 stack" onSubmit={onSubmit}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">POST /api/health-metrics</h2>
              <p className="panel-copy">
                Simulate the Android gateway by sending the exact payload structure the wearable
                backend expects.
              </p>
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
              <label htmlFor="heart-rate">Heart Rate</label>
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
              <label htmlFor="sleep-hours">Sleep Hours</label>
              <input
                id="sleep-hours"
                type="number"
                step="0.1"
                value={metrics.sleep_hours}
                onChange={(event) => setMetrics({ ...metrics, sleep_hours: event.target.value })}
              />
            </div>
          </div>

          <div className="action-row">
            <button className="primary-button" type="submit">
              Sync With NeuroLedger
            </button>
            <button className="secondary-button" type="button" onClick={fetchSummary}>
              Load Latest Summary
            </button>
          </div>

          {ingestionResult ? <div className="code-box">{JSON.stringify(ingestionResult, null, 2)}</div> : null}
          {error ? <div className="empty-state">{error}</div> : null}
        </form>

        <div className="col-5">
          <ChartComponent title="Signal Normalization View" items={chartItems} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Latest Wearable Summary</h2>
            <p className="panel-copy">
              The backend returns the latest signal snapshot for the current ABHA-linked identity.
            </p>
          </div>
        </div>

        {summary ? (
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Heart Rate</p>
              <p className="stat-value">{summary.latest_heart_rate}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Sleep Hours</p>
              <p className="stat-value">{summary.sleep_hours}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Steps</p>
              <p className="stat-value">{summary.steps}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Risk Level</p>
              <p className="stat-value">{summary.risk_level}</p>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            No summary loaded yet. Sync metrics or fetch the latest stored summary.
          </div>
        )}
      </section>
    </div>
  );
}
