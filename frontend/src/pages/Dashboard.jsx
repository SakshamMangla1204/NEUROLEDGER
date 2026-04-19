import { useEffect, useMemo, useState } from "react";
import HealthCard from "../components/HealthCard";
import ChartComponent from "../components/ChartComponent";
import { getDashboard } from "../api/api";

function prettyStatus(value) {
  return String(value || "pending").replace(/_/g, " ");
}

export default function Dashboard({ abhaId, systemStatus }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setError("");
        const data = await getDashboard(abhaId);
        if (active) {
          setDashboard(data);
        }
      } catch (err) {
        if (active) {
          setDashboard(null);
          setError(err.message);
        }
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [abhaId]);

  const reports = dashboard?.reports || [];
  const latestReport = reports.length ? reports[reports.length - 1] : null;
  const healthSignalChart = useMemo(() => {
    const wearable = dashboard?.wearable;
    if (!wearable) {
      return [];
    }

    return [
      { label: "Cardio stability", value: Math.max(30, 100 - Math.abs((wearable.heart_rate || 0) - 78) * 3) },
      { label: "Sleep reserve", value: Math.min(100, Math.round(((wearable.sleep_hours || 0) / 8) * 100)) },
      { label: "Activity load", value: Math.min(100, Math.round(((wearable.steps || 0) / 10000) * 100)) },
      { label: "Glucose safety", value: wearable.glucose && wearable.glucose > 100 ? 68 : 92 }
    ];
  }, [dashboard]);

  return (
    <div className="page">
      <section className="section-header">
        <span className="section-kicker">Overview</span>
        <h2>Current backend state</h2>
        <p>Single-page summary of the active identity, latest stored records, and service health.</p>
      </section>

      <section className="stats-grid">
        <HealthCard
          label="Active Identity"
          value={abhaId}
          meta="Current working patient context"
          tone="primary"
        />
        <HealthCard
          label="ML Risk Score"
          value={dashboard?.mlRiskScore ?? "--"}
          meta={`ML engine ${systemStatus?.ml_engine || "starting"}`}
          tone="accent"
        />
        <HealthCard
          label="Anchored Reports"
          value={dashboard?.blockchainVerificationStatus?.anchoredReports ?? 0}
          meta={`Latest tx ${dashboard?.blockchainVerificationStatus?.latestTransactionHash ? "available" : "pending"}`}
          tone="success"
        />
        <HealthCard
          label="Storage Mode"
          value={systemStatus?.storage || latestReport?.storageMode || "pending"}
          meta="Live backend storage target"
          tone="secondary"
        />
      </section>

      <section className="page-grid">
        <article className="panel col-8">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Dashboard response</h2>
              <p className="panel-copy">Data from `GET /api/patients/:abhaId/dashboard`.</p>
            </div>
          </div>

          {error ? <div className="empty-state">{error}</div> : null}

          {dashboard ? (
            <div className="operation-grid">
              <div className="metric-pill">
                <span>Patient</span>
                <strong>{dashboard.identity?.name || "Unknown patient"}</strong>
              </div>
              <div className="metric-pill">
                <span>Wearable risk</span>
                <strong>{dashboard.wearable?.risk_level || "Pending"}</strong>
              </div>
              <div className="metric-pill">
                <span>Blockchain</span>
                <strong>{dashboard.blockchain?.verified ? "Verified" : "Pending"}</strong>
              </div>
              <div className="metric-pill">
                <span>Latest file</span>
                <strong>{latestReport?.originalFileName || "No uploads yet"}</strong>
              </div>
              <div className="operation-card">
                <span className="endpoint-label">Endpoint</span>
                <strong>`GET /api/patients/{abhaId}/dashboard`</strong>
              </div>
              <div className="operation-card">
                <span className="endpoint-label">Last response</span>
                <strong>{dashboard.reportSummary?.totalReports ?? 0} reports returned</strong>
              </div>
            </div>
          ) : (
            <div className="empty-state">Loading dashboard state...</div>
          )}
        </article>

        <aside className="panel col-4 panel-highlight">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Services</h2>
              <p className="panel-copy">Latest health check collected by the frontend.</p>
            </div>
          </div>

          <div className="trust-grid">
            <div className="trust-cell">
              <span>Backend</span>
              <strong>{prettyStatus(systemStatus?.wearable_ingestion)}</strong>
            </div>
            <div className="trust-cell">
              <span>Storage</span>
              <strong>{prettyStatus(systemStatus?.storage)}</strong>
            </div>
            <div className="trust-cell">
              <span>Blockchain</span>
              <strong>{prettyStatus(systemStatus?.blockchain)}</strong>
            </div>
            <div className="trust-cell">
              <span>Verification</span>
              <strong>{dashboard?.blockchain?.verified ? "true" : "false"}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="page-grid">
        <div className="col-5">
          <ChartComponent title="Wearable values" items={healthSignalChart} />
        </div>

        <div className="panel col-7">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Recent Reports</h2>
              <p className="panel-copy">Most recent backend report records for the active identity.</p>
            </div>
          </div>

          <div className="list">
            {reports.length ? (
              [...reports].reverse().slice(0, 4).map((report) => (
                <div className="list-item list-item-compact" key={report.reportId}>
                  <div className="list-item-heading">
                    <div>
                      <h3>{report.originalFileName}</h3>
                      <p>{report.reportId}</p>
                    </div>
                    <span className={`badge badge-${report.blockchainStatus?.includes("anchored") ? "success" : "muted"}`}>
                      {prettyStatus(report.blockchainStatus)}
                    </span>
                  </div>
                  <div className="inline-meta">
                    <span>{report.storageMode || "local"}</span>
                    <span>{report.s3Bucket || "local vault"}</span>
                    <span>{report.blockchainTransactionHash || "tx pending"}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No reports have been uploaded for this identity yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
