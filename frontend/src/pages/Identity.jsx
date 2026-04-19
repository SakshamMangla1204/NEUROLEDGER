import { useEffect, useState } from "react";
import { fetchMockProfiles, registerIdentity, verifyIdentity } from "../api/api";

const initialForm = {
  name: "",
  dob: "",
  phone: "",
  abhaId: "SAKSHAM@ABDM"
};

export default function Identity({ currentAbhaId, onAbhaChange }) {
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState({ ...initialForm, abhaId: currentAbhaId });
  const [verifyAbhaId, setVerifyAbhaId] = useState(currentAbhaId);
  const [registerResult, setRegisterResult] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [error, setError] = useState("");

  async function loadProfiles() {
    try {
      setError("");
      const data = await fetchMockProfiles();
      setProfiles(data.profiles || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    setForm((current) => ({ ...current, abhaId: currentAbhaId }));
    setVerifyAbhaId(currentAbhaId);
  }, [currentAbhaId]);

  async function onRegister(event) {
    event.preventDefault();
    try {
      setError("");
      const data = await registerIdentity(form);
      setRegisterResult(data);
      setVerifyAbhaId(data.identity.abhaId);
      onAbhaChange(data.identity.abhaId);
      await loadProfiles();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onVerify(event) {
    event.preventDefault();
    try {
      setError("");
      const data = await verifyIdentity(verifyAbhaId);
      setVerifyResult(data);
      if (data?.verified) {
        onAbhaChange(data.abhaId);
      }
    } catch (err) {
      setError(err.message);
      setVerifyResult(null);
    }
  }

  return (
    <div className="page">
      <section className="section-header">
        <span className="section-kicker">Identity</span>
        <h2>Register and verify ABHA records</h2>
        <p>Simple frontend controls for the identity endpoints used by the rest of the app.</p>
      </section>

      <section className="page-grid">
        <form className="panel col-7 stack" onSubmit={onRegister}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Create identity</h2>
              <p className="panel-copy">Calls `POST /api/abha/register` and stores a new mock ABHA record.</p>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="name">Patient name</label>
              <input
                id="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Saksham Mangla"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="9876543210"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="dob">Date of birth</label>
              <input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(event) => setForm({ ...form, dob: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="abha">ABHA ID</label>
              <input
                id="abha"
                value={form.abhaId}
                onChange={(event) => setForm({ ...form, abhaId: event.target.value })}
                required
              />
            </div>
          </div>

          <div className="action-row">
            <button className="primary-button" type="submit">
              Save Identity
            </button>
          </div>

          <div className="backend-note">Backend operation: `POST /api/abha/register`</div>

          {registerResult ? (
            <div className="result-card">
              <span className="result-card-label">Identity saved</span>
              <strong>{registerResult.identity?.abhaId}</strong>
              <p>{registerResult.identity?.name}</p>
            </div>
          ) : null}
        </form>

        <form className="panel col-5 stack" onSubmit={onVerify}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Verify identity</h2>
              <p className="panel-copy">Calls `POST /api/abha/verify` and switches the active context.</p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="verify-abha">ABHA ID</label>
            <input
              id="verify-abha"
              value={verifyAbhaId}
              onChange={(event) => setVerifyAbhaId(event.target.value)}
              required
            />
          </div>

          <div className="action-row">
            <button className="primary-button" type="submit">
              Verify & Activate
            </button>
            <button className="secondary-button" type="button" onClick={loadProfiles}>
              Refresh Profiles
            </button>
          </div>

          <div className="metric-pill metric-pill-wide">
            <span>Current active identity</span>
            <strong>{currentAbhaId}</strong>
          </div>

          <div className="backend-note">Backend operation: `POST /api/abha/verify`</div>

          {verifyResult ? (
            <div className="result-card">
              <span className="result-card-label">Verification result</span>
              <strong>{verifyResult.verified ? "Identity confirmed" : "Not found"}</strong>
              <p>{verifyResult.abhaId}</p>
            </div>
          ) : null}
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Registered Profiles</h2>
            <p className="panel-copy">Profiles returned by `GET /api/abha/demo-profiles`.</p>
          </div>
        </div>

        {error ? <div className="empty-state">{error}</div> : null}

        <div className="profile-grid">
          {profiles.length ? (
            profiles.map((profile) => (
              <button
                key={profile.abhaId}
                type="button"
                className={`profile-card${currentAbhaId === profile.abhaId ? " active" : ""}`}
                onClick={() => {
                  setVerifyAbhaId(profile.abhaId);
                  onAbhaChange(profile.abhaId);
                }}
              >
                <span>{profile.abhaId}</span>
                <strong>{profile.fullName}</strong>
                <small>{profile.phone}</small>
              </button>
            ))
          ) : (
            <div className="empty-state">No profiles registered yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
