import { Link } from "react-router-dom";
import HealthCard from "../components/HealthCard";

export default function Dashboard() {
  return (
    <div className="page">
      <section className="hero-card">
        <p className="eyebrow">Clinical Verification Platform</p>
        <h1>Multi-step health identity, wearable, and report verification in one operational front end.</h1>
        <p>
          NeuroLedger now runs as a proper React workspace with dedicated pages for identity
          management, wearable ingestion, report handling, and blockchain-style verification flow.
        </p>
      </section>

      <section className="stats-grid">
        <HealthCard label="Frontend Mode" value="React Multipage" tone="primary" />
        <HealthCard label="Identity Layer" value="ABHA Simulation" tone="secondary" />
        <HealthCard label="Wearable Path" value="Health Connect Ready" tone="accent" />
        <HealthCard label="Report Trust" value="Hash Verified" tone="success" />
      </section>

      <section className="page-grid">
        <article className="panel col-7">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Operational Overview</h2>
              <p className="panel-copy">
                The frontend is now split into clear clinical workflows instead of one long prototype
                page, so each stage feels more deliberate and enterprise-ready.
              </p>
            </div>
          </div>

          <div className="list">
            <div className="list-item">
              <h3>Identity</h3>
              <p>Register and verify ABHA-style identities before any downstream action.</p>
            </div>
            <div className="list-item">
              <h3>Wearables</h3>
              <p>Post Health Connect-style payloads into the backend ingestion and scoring pipeline.</p>
            </div>
            <div className="list-item">
              <h3>Reports</h3>
              <p>Upload medical records, generate hashes, and monitor report integrity status.</p>
            </div>
            <div className="list-item">
              <h3>Verification</h3>
              <p>Finalize the latest authentic report into the blockchain handoff state.</p>
            </div>
          </div>
        </article>

        <aside className="panel col-5">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Quick Actions</h2>
              <p className="panel-copy">Jump straight into the workflow you want to operate.</p>
            </div>
          </div>

          <div className="stack">
            <Link className="primary-button" to="/identity">
              Open Identity Workflow
            </Link>
            <Link className="secondary-button nav-linkish" to="/analytics">
              Open Wearable Sync
            </Link>
            <Link className="secondary-button nav-linkish" to="/reports">
              Open Report Center
            </Link>
            <Link className="secondary-button nav-linkish" to="/verification">
              Open Verification Center
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
