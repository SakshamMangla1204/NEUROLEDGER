import { useState } from "react";
import { uploadReport, verifyReport } from "../api/api";

export default function Upload() {
  const [abhaId, setAbhaId] = useState("SAKSHAM@ABDM");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");
  const [mimeType, setMimeType] = useState("text/plain");
  const [contentBase64, setContentBase64] = useState("");
  const [result, setResult] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      const data = await uploadReport({
        abhaId,
        notes,
        fileName,
        mimeType,
        contentBase64
      });
      setResult(data);
      setVerificationResult(null);
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  }

  async function verifyUploadedReport() {
    try {
      setError("");
      const reportId = result?.report?.reportId;
      if (!reportId) {
        throw new Error("Upload a report first.");
      }
      const data = await verifyReport(reportId);
      setVerificationResult(data);
    } catch (err) {
      setError(err.message);
      setVerificationResult(null);
    }
  }

  return (
    <div className="page">
      <section className="hero-card">
        <p className="eyebrow">Report Center</p>
        <h1>Upload clinical documents in a dedicated flow instead of mixing report handling into a single prototype page.</h1>
        <p>
          The upload pathway stores the file, generates a hash, and returns the verification-ready
          report object for the current identity.
        </p>
      </section>

      <form className="panel stack" onSubmit={onSubmit}>
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Upload Medical Report</h2>
            <p className="panel-copy">
              Paste a base64 payload or a small text blob encoded as base64 to simulate report
              ingestion before blockchain finalization.
            </p>
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="report-abha">ABHA ID</label>
            <input
              id="report-abha"
              value={abhaId}
              onChange={(event) => setAbhaId(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="report-name">File Name</label>
            <input
              id="report-name"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder="cbc-report.txt"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="report-mime">MIME Type</label>
            <input
              id="report-mime"
              value={mimeType}
              onChange={(event) => setMimeType(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="report-notes">Notes</label>
            <input
              id="report-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="CBC report or discharge summary"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="report-base64">Base64 Content</label>
          <textarea
            id="report-base64"
            value={contentBase64}
            onChange={(event) => setContentBase64(event.target.value)}
            placeholder="VGhpcyBpcyBhIGRlbW8gcmVwb3J0Lg=="
            required
          />
        </div>

        <div className="action-row">
          <button className="primary-button" type="submit">
            Store Report + Hash
          </button>
          <button className="secondary-button" type="button" onClick={verifyUploadedReport}>
            Verify Latest Upload
          </button>
        </div>

        {result ? <div className="code-box">{JSON.stringify(result, null, 2)}</div> : null}
        {verificationResult ? (
          <div className="code-box">{JSON.stringify(verificationResult, null, 2)}</div>
        ) : null}
        {error ? <div className="empty-state">{error}</div> : null}
      </form>
    </div>
  );
}
