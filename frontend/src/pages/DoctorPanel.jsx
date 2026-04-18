import { useState } from "react";
import { finalizeBlockchain, getDashboard, verifyReport } from "../api/api";

export default function DoctorPanel() {
  const [abhaId, setAbhaId] = useState("SAKSHAM@ABDM");
  const [dashboard, setDashboard] = useState(null);
  const [finalized, setFinalized] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [error, setError] = useState("");
  const reports = dashboard?.reports || [];

  async function loadPatientDashboard() {
    try {
      setError("");
      const data = await getDashboard(abhaId);
      setDashboard(data);
      setSelectedReportId(data?.reports?.[data.reports.length - 1]?.reportId || "");
    } catch (err) {
      setError(err.message);
      setDashboard(null);
    }
  }

  async function finalizeSelectedReport() {
    try {
      setError("");
      setVerificationResult(null);
      if (!selectedReportId) {
        throw new Error("Load a patient dashboard with at least one report first.");
      }
      const data = await finalizeBlockchain(selectedReportId);
      setFinalized(data);
      const refreshed = await getDashboard(abhaId);
      setDashboard(refreshed);
    } catch (err) {
      setError(err.message);
      setFinalized(null);
    }
  }

  async function verifySelectedReport() {
    try {
      setError("");
      if (!selectedReportId) {
        throw new Error("Choose a report to verify first.");
      }
      const data = await verifyReport(selectedReportId);
      setVerificationResult(data);
    } catch (err) {
      setError(err.message);
      setVerificationResult(null);
    }
  }

  return (
    <div className="page">
      <section className="hero-card">
        <p className="eyebrow">Verification Center</p>
        <h1>Review patient context, finalize authentic reports to Polygon Amoy, and verify on-chain authenticity without touching raw backend routes.</h1>
        <p>
          This page gives the verification workflow its own operational surface instead of sending
          you to low-level API endpoints in the browser.
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
          </div>

          <div className="field">
            <label htmlFor="report-select">Report</label>
            <select
              id="report-select"
              value={selectedReportId}
              onChange={(event) => setSelectedReportId(event.target.value)}
              disabled={!reports.length}
            >
              <option value="">Select a report</option>
              {reports.map((report) => (
                <option key={report.reportId} value={report.reportId}>
                  {report.originalFileName} [{report.blockchainStatus}]
                </option>
              ))}
            </select>
          </div>

          <div className="action-row">
            <button className="secondary-button" type="button" onClick={verifySelectedReport}>
              Verify Selected Report
            </button>
            <button className="primary-button" type="button" onClick={finalizeSelectedReport}>
              Finalize to Polygon
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
          {verificationResult ? (
            <div className="code-box">{JSON.stringify(verificationResult, null, 2)}</div>
          ) : null}
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
