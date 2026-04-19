import { useEffect, useState } from "react";
import { fetchMockProfiles } from "../api/api";
import NeuroLedgerLogo from "../components/NeuroLedgerLogo";

const initialForm = {
  name: "",
  email: "",
  abhaId: "SAKSHAM@ABDM"
};

function prettyStatus(value, fallback) {
  return String(value || fallback).replace(/_/g, " ");
}

export default function Login({ onLogin, systemStatus }) {
  const [form, setForm] = useState(initialForm);
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfiles() {
      try {
        const data = await fetchMockProfiles();
        if (!active) {
          return;
        }

        const nextProfiles = data.profiles || [];
        setProfiles(nextProfiles);
        if (nextProfiles.length) {
          setForm((current) => ({
            ...current,
            abhaId: current.abhaId || nextProfiles[0].abhaId
          }));
        }
      } catch (loadError) {
        if (active) {
          setProfiles([]);
        }
      }
    }

    loadProfiles();

    return () => {
      active = false;
    };
  }, []);

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const selectedAbhaId = form.abhaId || profiles[0]?.abhaId || "SAKSHAM@ABDM";
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      setBusy(false);
      return;
    }

    onLogin({
      operatorName: form.name.trim(),
      operatorEmail: form.email.trim(),
      currentAbhaId: selectedAbhaId
    });
  }

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div className="login-hero-copy">
          <NeuroLedgerLogo className="brand-hero" />
          <p className="login-hero-tagline">
            Secure clinical records, wearable signals, and blockchain verification in one
            workspace.
          </p>
          <p>
            Start with your operator profile, select the patient context, and continue into the
            monitoring dashboard.
          </p>
        </div>

        <div className="login-status-grid">
          <div className="login-status-card">
            <span>Blockchain</span>
            <strong>{prettyStatus(systemStatus?.blockchain, "syncing")}</strong>
          </div>
          <div className="login-status-card">
            <span>ML engine</span>
            <strong>{prettyStatus(systemStatus?.ml_engine, "starting")}</strong>
          </div>
          <div className="login-status-card">
            <span>Storage</span>
            <strong>{prettyStatus(systemStatus?.storage, "pending")}</strong>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="section-header">
            <span className="section-kicker">Sign In</span>
            <h2>Open your operator workspace</h2>
            <p>Use a simple operator profile for this demo and choose the patient record to load.</p>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="login-name">Full name</label>
                <input
                  id="login-name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Saksham Mangla"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="login-email">Work email</label>
                <input
                  id="login-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="operator@neuroledger.health"
                  required
                />
              </div>
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="login-abha">Patient ABHA ID</label>
                <input
                  id="login-abha"
                  value={form.abhaId}
                  onChange={(event) => updateField("abhaId", event.target.value)}
                  placeholder="SAKSHAM@ABDM"
                />
              </div>
            </div>

            {profiles.length ? (
              <div className="stack">
                <div className="backend-note">Quick patient selection from `GET /api/abha/demo-profiles`</div>
                <div className="profile-grid">
                  {profiles.slice(0, 4).map((profile) => (
                    <button
                      key={profile.abhaId}
                      type="button"
                      className={`profile-card${form.abhaId === profile.abhaId ? " active" : ""}`}
                      onClick={() => updateField("abhaId", profile.abhaId)}
                    >
                      <span>{profile.abhaId}</span>
                      <strong>{profile.fullName}</strong>
                      <small>{profile.phone}</small>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? <div className="empty-state">{error}</div> : null}

            <div className="action-row">
              <button className="primary-button login-button" type="submit" disabled={busy}>
                {busy ? "Opening..." : "Open Dashboard"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
