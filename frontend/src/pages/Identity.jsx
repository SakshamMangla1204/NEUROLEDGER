import { useEffect, useState } from "react";
import { fetchMockProfiles, registerIdentity, verifyIdentity } from "../api/api";

const initialForm = {
  name: "",
  dob: "",
  phone: "",
  abhaId: "SAKSHAM@ABDM"
};

export default function Identity() {
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [verifyAbhaId, setVerifyAbhaId] = useState("SAKSHAM@ABDM");
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

  async function onRegister(event) {
    event.preventDefault();
    try {
      setError("");
      const data = await registerIdentity(form);
      setRegisterResult(data);
      setVerifyAbhaId(data.identity.abhaId);
      setForm((current) => ({ ...current, abhaId: data.identity.abhaId }));
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
    } catch (err) {
      setError(err.message);
      setVerifyResult(null);
    }
  }

  return (
    <div className="page">
      <section className="hero-card">
        <p className="eyebrow">Identity Workflow</p>
        <h1>Register and verify ABHA-linked identities before downstream clinical operations.</h1>
        <p>
          This page isolates identity creation and lookup so patient context is explicit before
          analytics, wearable sync, or report storage begins.
        </p>
      </section>

      <section className="page-grid">
        <form className="panel col-6 stack" onSubmit={onRegister}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Create Mock ABHA Identity</h2>
              <p className="panel-copy">
                Store a local ABHA-style identity that the backend can use across the pipeline.
              </p>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="name">Name</label>
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
              <label htmlFor="dob">DOB</label>
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
                placeholder="SAKSHAM@ABDM"
                required
              />
            </div>
          </div>

          <div className="action-row">
            <button className="primary-button" type="submit">
              Save Identity
            </button>
          </div>

          {registerResult ? (
            <div className="code-box">{JSON.stringify(registerResult, null, 2)}</div>
          ) : null}
        </form>

        <form className="panel col-6 stack" onSubmit={onVerify}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Verify Existing Identity</h2>
              <p className="panel-copy">
                Confirm that the backend recognizes the ABHA ID before running a patient flow.
              </p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="verify-abha">ABHA ID</label>
            <input
              id="verify-abha"
              value={verifyAbhaId}
              onChange={(event) => setVerifyAbhaId(event.target.value)}
              placeholder="SAKSHAM@ABDM"
              required
            />
          </div>

          <div className="action-row">
            <button className="primary-button" type="submit">
              Verify Identity
            </button>
            <button className="secondary-button" type="button" onClick={loadProfiles}>
              Refresh Known Profiles
            </button>
          </div>

          {verifyResult ? <div className="code-box">{JSON.stringify(verifyResult, null, 2)}</div> : null}
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Known Profiles</h2>
            <p className="panel-copy">
              These identities are already persisted in the backend and available for the rest of
              the NeuroLedger workflow.
            </p>
          </div>
        </div>

        {error ? <div className="empty-state">{error}</div> : null}

        <div className="list">
          {profiles.length ? (
            profiles.map((profile) => (
              <div className="list-item" key={profile.abhaId}>
                <h3>{profile.fullName}</h3>
                <div className="inline-meta">
                  <span>{profile.abhaId}</span>
                  <span>{profile.phone}</span>
                  <span>{profile.dob}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No identities have been created yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
