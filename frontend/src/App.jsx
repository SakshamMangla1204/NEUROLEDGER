import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Upload from "./pages/Upload";
import DoctorPanel from "./pages/DoctorPanel";
import Identity from "./pages/Identity";

const titles = {
  "/dashboard": "Command Center",
  "/identity": "Identity Registry",
  "/analytics": "Wearable Ingestion",
  "/reports": "Report Operations",
  "/verification": "Verification Review"
};

export default function App() {
  const location = useLocation();
  const title = titles[location.pathname] || "NeuroLedger";

  return (
    <div className="app-shell">
      <Navbar />
      <div className="workspace">
        <header className="workspace-topbar">
          <div>
            <p className="workspace-kicker">NeuroLedger Platform</p>
            <h1 className="workspace-title">{title}</h1>
          </div>
          <div className="workspace-actions">
            <div className="chip">Polygon handoff ready</div>
            <div className="chip chip-strong">Clinical workflow active</div>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/identity" element={<Identity />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Upload />} />
            <Route path="/verification" element={<DoctorPanel />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
