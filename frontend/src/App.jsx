import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Upload from "./pages/Upload";
import DoctorPanel from "./pages/DoctorPanel";
import Identity from "./pages/Identity";
import Login from "./pages/Login";
import { fetchSystemStatus } from "./api/api";

const titles = {
  "/login": "Sign In",
  "/dashboard": "Overview",
  "/identity": "Identity",
  "/analytics": "Wearables",
  "/reports": "Reports",
  "/verification": "Verification"
};

const SESSION_KEY = "neuroledger.session";

function readSession() {
  try {
    const rawValue = window.localStorage.getItem(SESSION_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    return null;
  }
}

function writeSession(session) {
  try {
    if (!session) {
      window.localStorage.removeItem(SESSION_KEY);
      return;
    }

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    // Ignore local storage failures and keep the in-memory session.
  }
}

function formatStatusLabel(value, fallback) {
  if (!value) {
    return fallback;
  }

  return String(value).replace(/_/g, " ");
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = titles[location.pathname] || "NeuroLedger";
  const [session, setSession] = useState(() => readSession());
  const [currentAbhaId, setCurrentAbhaId] = useState(() => readSession()?.currentAbhaId || "SAKSHAM@ABDM");
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

  useEffect(() => {
    if (!session) {
      writeSession(null);
      return;
    }

    writeSession({
      ...session,
      currentAbhaId
    });
  }, [currentAbhaId, session]);

  function handleLogin(nextSession) {
    setSession(nextSession);
    setCurrentAbhaId(nextSession.currentAbhaId || "SAKSHAM@ABDM");
    navigate("/dashboard", { replace: true });
  }

  function handleLogout() {
    setSession(null);
    writeSession(null);
    navigate("/login", { replace: true });
  }

  function handleAbhaChange(nextAbhaId) {
    setCurrentAbhaId(nextAbhaId);
    setSession((current) =>
      current
        ? {
            ...current,
            currentAbhaId: nextAbhaId
          }
        : current
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} systemStatus={systemStatus} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Navbar
        currentAbhaId={currentAbhaId}
        operator={session}
        systemStatus={systemStatus}
        onLogout={handleLogout}
      />
      <div className="workspace">
        <header className="workspace-topbar">
          <div>
            <p className="workspace-kicker">{session.operatorName}</p>
            <h1 className="workspace-title">{title}</h1>
            <p className="workspace-subtitle">
              Manage identity verification, wearable ingestion, report handling, and blockchain
              trust checks from one signed-in workspace.
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
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={<Dashboard abhaId={currentAbhaId} systemStatus={systemStatus} />}
            />
            <Route
              path="/identity"
              element={
                <Identity currentAbhaId={currentAbhaId} onAbhaChange={handleAbhaChange} />
              }
            />
            <Route path="/analytics" element={<Analytics currentAbhaId={currentAbhaId} />} />
            <Route path="/reports" element={<Upload currentAbhaId={currentAbhaId} />} />
            <Route
              path="/verification"
              element={<DoctorPanel currentAbhaId={currentAbhaId} systemStatus={systemStatus} />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
