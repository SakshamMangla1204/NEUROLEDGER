import { NavLink } from "react-router-dom";

const sections = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard" }]
  },
  {
    label: "Operations",
    items: [
      { to: "/identity", label: "Identity" },
      { to: "/analytics", label: "Wearable Sync" },
      { to: "/reports", label: "Report Center" },
      { to: "/verification", label: "Verification" }
    ]
  }
];

export default function Navbar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="brand-mark">N</div>
        <div className="brand-block">
          <span className="brand-title">NeuroLedger</span>
          <span className="brand-copy">Health verification stack</span>
        </div>
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
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="wallet-chip">
          <span className="wallet-status" />
          <span>Backend online</span>
          <span className="wallet-network">Local</span>
        </div>
      </div>
    </aside>
  );
}
