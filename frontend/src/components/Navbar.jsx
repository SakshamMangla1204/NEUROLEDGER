import { NavLink } from "react-router-dom";
import NeuroLedgerLogo from "./NeuroLedgerLogo";

const sections = [
  {
    label: "Command",
    items: [{ to: "/dashboard", label: "Overview", meta: "Live status" }]
  },
  {
    label: "Operations",
    items: [
      { to: "/identity", label: "Identity", meta: "ABHA registry" },
      { to: "/analytics", label: "Signals", meta: "Wearable sync" },
      { to: "/reports", label: "Reports", meta: "Vault + anchor" },
      { to: "/verification", label: "Trust", meta: "Verify + finalize" }
    ]
  }
];

function statusTone(value, positiveValue = "connected") {
  return value === positiveValue || value === "running" || value === "active"
    ? "status-positive"
    : "status-neutral";
}

export default function Navbar({ currentAbhaId, operator, systemStatus, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <NeuroLedgerLogo compact />
        <span className="brand-copy">Clinical trust workspace</span>
      </div>

      <div className="operator-card">
        <span className="patient-chip-label">Signed in as</span>
        <strong>{operator?.operatorName || "Operator"}</strong>
        <span className="operator-meta">{operator?.operatorEmail || "operator@neuroledger.health"}</span>
      </div>

      <div className="patient-chip">
        <span className="patient-chip-label">Active identity</span>
        <strong>{currentAbhaId}</strong>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {sections.map((section) => (
          <div key={section.label} className="nav-section">
            <p className="nav-section-title">{section.label}</p>
            {section.items.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              >
                <span className="sidebar-link-dot" />
                <span className="sidebar-link-copy">
                  <span>{link.label}</span>
                  <small>{link.meta}</small>
                </span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className={`status-card ${statusTone(systemStatus?.blockchain)}`}>
          <span>Blockchain</span>
          <strong>{systemStatus?.blockchain || "syncing"}</strong>
        </div>
        <div className={`status-card ${statusTone(systemStatus?.ml_engine, "running")}`}>
          <span>ML engine</span>
          <strong>{systemStatus?.ml_engine || "starting"}</strong>
        </div>
        <div className={`status-card ${statusTone(systemStatus?.storage, "s3")}`}>
          <span>Storage</span>
          <strong>{systemStatus?.storage || "pending"}</strong>
        </div>
        <button className="secondary-button sidebar-logout" type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
