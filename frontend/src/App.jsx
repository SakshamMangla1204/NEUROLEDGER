import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Upload from "./pages/Upload";
import DoctorPanel from "./pages/DoctorPanel";
import Identity from "./pages/Identity";
import { fetchSystemStatus } from "./api/api";

const titles = {
  "/dashboard": "Overview",
  "/identity": "Identity",
  "/analytics": "Wearables",
  "/reports": "Reports",
  "/verification": "Verification"
};

function formatStatusLabel(value, fallback) {
  if (!value) {
    return fallback;
  }

  return String(value).replace(/_/g, " ");
}

export default function App() {
  const location = useLocation();
  const title = titles[location.pathname] || "NeuroLedger";
  const [currentAbhaId, setCurrentAbhaId] = useState("SAKSHAM@ABDM");
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const data = await fetchSystemStatus();
        if (active) {
          setSystemStatus(data);
        }
      } catch (error) {
        if (active) {
          setSystemStatus({
            blockchain: "offline",
            ml_engine: "offline",
            wearable_ingestion: "offline",
            storage: "unavailable"
          });
        }
      }
    }

    loadStatus();
    const interval = window.setInterval(loadStatus, 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const headlineChips = useMemo(
    () => [
      {
        label: `Blockchain ${formatStatusLabel(systemStatus?.blockchain, "syncing")}`,
        tone: systemStatus?.blockchain === "connected" ? "positive" : "neutral"
      },
      {
        label: `ML ${formatStatusLabel(systemStatus?.ml_engine, "starting")}`,
        tone: systemStatus?.ml_engine === "running" ? "positive" : "neutral"
      },
      {
        label: `Storage ${formatStatusLabel(systemStatus?.storage, "pending")}`,
        tone: systemStatus?.storage === "s3" ? "accent" : "neutral"
      }
    ],
    [systemStatus]
  );

  return (
    <div className="app-shell">
      <Navbar currentAbhaId={currentAbhaId} systemStatus={systemStatus} />
      <div className="workspace">
        <header className="workspace-topbar">
          <div>
            <p className="workspace-kicker">NeuroLedger Health Integrity Suite</p>
            <h1 className="workspace-title">{title}</h1>
            <p className="workspace-subtitle">
              Simple controls for identity, wearable ingestion, report upload, and blockchain
              verification.
            </p>
          </div>
          <div className="workspace-actions">
            {headlineChips.map((chip) => (
              <div key={chip.label} className={`chip chip-${chip.tone}`}>
                <span className="chip-label">{chip.label.split(" ")[0]}</span>
                <span className="chip-value">{chip.label.split(" ").slice(1).join(" ")}</span>
              </div>
            ))}
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={<Dashboard abhaId={currentAbhaId} systemStatus={systemStatus} />}
            />
            <Route
              path="/identity"
              element={
                <Identity currentAbhaId={currentAbhaId} onAbhaChange={setCurrentAbhaId} />
              }
            />
            <Route path="/analytics" element={<Analytics currentAbhaId={currentAbhaId} />} />
            <Route path="/reports" element={<Upload currentAbhaId={currentAbhaId} />} />
            <Route
              path="/verification"
              element={<DoctorPanel currentAbhaId={currentAbhaId} systemStatus={systemStatus} />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
