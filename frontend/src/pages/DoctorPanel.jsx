import { useEffect, useState } from "react";
import {
  finalizeBlockchain,
  getDashboard,
  simulateReportTamper,
  verifyReport,
  verifyReportHash
} from "../api/api";

function prettyStatus(value) {
  return String(value || "pending").replace(/_/g, " ");
}

function shortHash(value) {
  const text = String(value || "");
  if (text.length <= 18) {
    return text || "pending";
  }

  return `${text.slice(0, 10)}...${text.slice(-8)}`;
}

export default function DoctorPanel({ currentAbhaId, systemStatus }) {
  const [abhaId, setAbhaId] = useState(currentAbhaId);
  const [dashboard, setDashboard] = useState(null);
  const [finalized, setFinalized] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [hashVerification, setHashVerification] = useState(null);
  const [tamperSimulation, setTamperSimulation] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [error, setError] = useState("");
  const reports = dashboard?.reports || [];

  useEffect(() => {
    setAbhaId(currentAbhaId);
  }, [currentAbhaId]);

  async function loadPatientDashboard() {
    try {
      setError("");
      const data = await getDashboard(abhaId);
      setDashboard(data);
      const latestReport = data?.reports?.[data.reports.length - 1];
      setSelectedReportId(latestReport?.reportId || "");
      setHashVerification(null);
      setVerificationResult(null);
      setTamperSimulation(null);
    } catch (err) {
      setError(err.message);
      setDashboard(null);
    }
  }

  async function finalizeSelectedReport() {
    try {
      setError("");
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
      setFinalized(null);
      if (!selectedReportId) {
        throw new Error("Choose a report to verify first.");
      }
      const data = await verifyReport(selectedReportId);
      setVerificationResult(data);
      const hashStatus = await verifyReportHash(data.hashChecked);
      setHashVerification(hashStatus);
    } catch (err) {
      setError(err.message);
      setVerificationResult(null);
      setHashVerification(null);
    }
  }

  async function simulateSelectedReportTamper() {
    try {
      setError("");
      setFinalized(null);
      if (!selectedReportId) {
        throw new Error("Choose a report before simulating tamper.");
      }
      const tamperData = await simulateReportTamper(selectedReportId);
      setTamperSimulation(tamperData);
      const data = await verifyReport(selectedReportId);
      setVerificationResult(data);
      const hashStatus = await verifyReportHash(data.hashChecked);
      setHashVerification(hashStatus);
    } catch (err) {
      setError(err.message);
      setTamperSimulation(null);
    }
  }

  const selectedReport = reports.find((report) => report.reportId === selectedReportId);

  return (
    <div className="page">
      <section className="section-header">
        <span className="section-kicker">Verification</span>
        <h2>Verify hashes and finalize reports</h2>
        <p>Minimal control panel for loading report records and sending blockchain actions.</p>
      </section>

      <section className="page-grid">
        <div className="panel col-4 stack">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Actions</h2>
              <p className="panel-copy">Load dashboard data, verify the selected report, or finalize it on chain.</p>
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
              Load Trust View
            </button>
          </div>

          <div className="field">
            <label htmlFor="report-select">Report</label>
            <select
              id="report-select"
              value={selectedReportId}
              onChange={(event) => {
                setSelectedReportId(event.target.value);
                setVerificationResult(null);
                setHashVerification(null);
                setFinalized(null);
                setTamperSimulation(null);
              }}
              disabled={!reports.length}
            >
              <option value="">Select a report</option>
              {reports.map((report) => (
                <option key={report.reportId} value={report.reportId}>
                  {report.originalFileName} [{report.reportId.slice(0, 8)}] [{prettyStatus(report.blockchainStatus)}]
                </option>
              ))}
            </select>
          </div>

          <div className="action-row">
            <button className="secondary-button" type="button" onClick={verifySelectedReport}>
              Verify Integrity
            </button>
            <button className="secondary-button" type="button" onClick={simulateSelectedReportTamper}>
              Simulate Tamper
            </button>
            <button className="primary-button" type="button" onClick={finalizeSelectedReport}>
              Finalize to Ganache
            </button>
          </div>

          <div className="backend-note">Uses `GET /api/patients/:abhaId/dashboard`, `GET /api/reports/:reportId/verify`, `POST /api/reports/:reportId/finalize-blockchain`</div>

          <div className="trust-grid">
            <div className="trust-cell">
              <span>Blockchain</span>
              <strong>{systemStatus?.blockchain || "syncing"}</strong>
            </div>
            <div className="trust-cell">
              <span>Selected status</span>
              <strong>{prettyStatus(selectedReport?.blockchainStatus)}</strong>
            </div>
          </div>

          {error ? <div className="empty-state">{error}</div> : null}
        </div>

        <div className="panel col-8 stack">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Verification result</h2>
              <p className="panel-copy">Readable integrity status for the selected report.</p>
            </div>
          </div>

          {selectedReport ? (
            <div className="metrics-strip">
              <div className="metric-pill">
                <span>Report</span>
                <strong>{selectedReport.originalFileName}</strong>
              </div>
              <div className="metric-pill">
                <span>Storage</span>
                <strong>{selectedReport.storageMode || "local"}</strong>
              </div>
              <div className="metric-pill">
                <span>Anchored</span>
                <strong>{selectedReport.blockchainStatus?.includes("anchored") ? "true" : "false"}</strong>
              </div>
              <div className="metric-pill">
                <span>Report ID</span>
                <strong>{selectedReport.reportId.slice(0, 8)}</strong>
              </div>
            </div>
          ) : null}

          {verificationResult ? (
            <div
              className={`integrity-result ${
                verificationResult.authentic ? "integrity-result-authentic" : "integrity-result-tampered"
              }`}
            >
              <div>
                <span>Integrity result</span>
                <strong>{verificationResult.authentic ? "REPORT AUTHENTIC" : "REPORT TAMPERED"}</strong>
              </div>
              <div>
                <span>File check</span>
                <strong>{prettyStatus(verificationResult.status)}</strong>
              </div>
              <div>
                <span>Blockchain hash</span>
                <strong>{verificationResult.anchoredOnBlockchain ? "anchored" : "not anchored"}</strong>
              </div>
            </div>
          ) : null}

          {tamperSimulation ? (
            <div className="tamper-demo-note">
              <strong>Tamper simulation applied</strong>
              <p>The stored file was changed after anchoring. The original blockchain hash remains valid, but the current file should now fail integrity verification.</p>
            </div>
          ) : null}

          {verificationResult ? (
            <div className="hash-compare">
              <div>
                <span>Stored original hash</span>
                <strong title={verificationResult.storedHash}>{shortHash(verificationResult.storedHash)}</strong>
              </div>
              <div>
                <span>Current file hash</span>
                <strong title={verificationResult.recomputedHash}>{shortHash(verificationResult.recomputedHash)}</strong>
              </div>
              <div>
                <span>Match</span>
                <strong>{verificationResult.storedHash === verificationResult.recomputedHash ? "yes" : "no"}</strong>
              </div>
            </div>
          ) : null}

          {hashVerification ? (
            <div className="trust-grid">
              <div className="trust-cell">
                <span>Hash found on chain</span>
                <strong>{hashVerification.verified ? "yes" : "no"}</strong>
              </div>
              <div className="trust-cell">
                <span>Blockchain available</span>
                <strong>{hashVerification.blockchainAvailable ? "yes" : "no"}</strong>
              </div>
            </div>
          ) : null}
          {finalized ? (
            <div className="trust-grid">
              <div className="trust-cell">
                <span>Finalize status</span>
                <strong>{prettyStatus(finalized.status)}</strong>
              </div>
              <div className="trust-cell">
                <span>Transaction</span>
                <strong>{shortHash(finalized.txHash || finalized.transaction)}</strong>
              </div>
            </div>
          ) : null}
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
