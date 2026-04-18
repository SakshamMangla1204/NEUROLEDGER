import { useState } from "react";
import { finalizeBlockchain, getDashboard } from "../api/api";

export default function DoctorPanel() {
  const [abhaId, setAbhaId] = useState("SAKSHAM@ABDM");
  const [dashboard, setDashboard] = useState(null);
  const [finalized, setFinalized] = useState(null);
  const [error, setError] = useState("");

  async function loadPatientDashboard() {
    try {
      setError("");
      const data = await getDashboard(abhaId);
      setDashboard(data);
    } catch (err) {
      setError(err.message);
      setDashboard(null);
    }
  }

  async function finalizeLatestReport() {
    try {
      setError("");
      const latestReport = dashboard?.reports?.[dashboard.reports.length - 1];
      if (!latestReport) {
        throw new Error("Load a patient dashboard with at least one report first.");
      }
      const data = await finalizeBlockchain(latestReport.reportId);
      setFinalized(data);
    } catch (err) {
      setError(err.message);
      setFinalized(null);
    }
  }

  return (
    <div className="page">
      <section className="hero-card">
        <p className="eyebrow">Verification Center</p>
        <h1>Review patient context, inspect report integrity, and finalize the latest authentic report into the blockchain handoff state.</h1>
        <p>
          This page gives the verification workflow its own operational surface instead of burying it
          at the bottom of a single long page.
        </p>
      </section>

      <section className="page-grid">
        <div className="panel col-4 stack">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Patient Lookup</h2>
              <p className="panel-copy">Load a dashboard snapshot using the patient ABHA ID.</p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="doctor-abha">ABHA ID</label>
            <input
              id="doctor-abha"
              value={abhaId}
              onChange={(event) => setAbhaId(event.target.value)}
            />
          </div>

          <div className="action-row">
            <button className="primary-button" type="button" onClick={loadPatientDashboard}>
              Load Dashboard
            </button>
            <button className="secondary-button" type="button" onClick={finalizeLatestReport}>
              Finalize Latest Report
            </button>
          </div>

          {error ? <div className="empty-state">{error}</div> : null}
        </div>

        <div className="panel col-8 stack">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Verification Snapshot</h2>
              <p className="panel-copy">
                Dashboard and finalization responses appear here for audit-friendly review.
              </p>
            </div>
          </div>

          {dashboard ? <div className="code-box">{JSON.stringify(dashboard, null, 2)}</div> : null}
          {finalized ? <div className="code-box">{JSON.stringify(finalized, null, 2)}</div> : null}
          {!dashboard && !finalized ? (
            <div className="empty-state">
              Load a patient dashboard to inspect reports, wearable state, and blockchain readiness.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
