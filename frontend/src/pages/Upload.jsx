import { useEffect, useState } from "react";
import { uploadReport, verifyReport } from "../api/api";

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

export default function Upload({ currentAbhaId }) {
  const [abhaId, setAbhaId] = useState(currentAbhaId);
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAbhaId(currentAbhaId);
  }, [currentAbhaId]);

  async function onSubmit(event) {
    event.preventDefault();
    try {
      setBusy(true);
      setError("");
      if (!selectedFile) {
        throw new Error("Choose a report file first.");
      }

      const contentBase64 = await readFileAsBase64(selectedFile);
      const data = await uploadReport({
        abhaId,
        notes,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || "application/octet-stream",
        contentBase64
      });
      setResult(data);
      setVerificationResult(null);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setBusy(false);
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
      <section className="section-header">
        <span className="section-kicker">Reports</span>
        <h2>Upload and verify report files</h2>
        <p>Upload a file, let the backend hash it, then inspect the raw response.</p>
      </section>

      <section className="page-grid">
        <form className="panel col-7 stack" onSubmit={onSubmit}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Upload report</h2>
              <p className="panel-copy">Writes to `POST /api/reports/upload`.</p>
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
              <label htmlFor="report-notes">Clinical notes</label>
              <input
                id="report-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="CBC report, discharge summary, imaging note"
              />
            </div>
          </div>

          <label className="file-dropzone" htmlFor="report-file">
            <input
              id="report-file"
              type="file"
              accept=".pdf,.txt,.png,.jpg,.jpeg"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
            <span className="file-dropzone-kicker">Select medical report</span>
            <strong>{selectedFile ? selectedFile.name : "Drop or choose a report file"}</strong>
            <small>
              {selectedFile
                ? `${selectedFile.type || "unknown type"} | ${selectedFile.size} bytes`
                : "PDF, text, or image documents supported through the current backend flow"}
            </small>
          </label>

          <div className="action-row">
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? "Uploading..." : "Upload to S3 + Anchor"}
            </button>
            <button className="secondary-button" type="button" onClick={verifyUploadedReport}>
              Verify Latest Upload
            </button>
          </div>

          <div className="backend-note">Verification operation: `GET /api/reports/:reportId/verify`</div>

          {error ? <div className="empty-state">{error}</div> : null}
        </form>

        <aside className="panel col-5">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Upload Result</h2>
              <p className="panel-copy">Backend response and verification output.</p>
            </div>
          </div>

          {result ? (
            <div className="stack">
              <div className="metrics-strip metrics-strip-vertical">
                <div className="metric-pill metric-pill-wide">
                  <span>Storage mode</span>
                  <strong>{result.report?.storageMode}</strong>
                </div>
                <div className="metric-pill metric-pill-wide">
                  <span>S3 bucket</span>
                  <strong>{result.report?.s3Bucket || "local"}</strong>
                </div>
                <div className="metric-pill metric-pill-wide">
                  <span>Blockchain status</span>
                  <strong>{result.report?.blockchainStatus}</strong>
                </div>
                <div className="metric-pill metric-pill-wide">
                  <span>Transaction</span>
                  <strong>{result.report?.blockchainTransactionHash || "pending"}</strong>
                </div>
              </div>
              <div className="code-box">{JSON.stringify(result, null, 2)}</div>
            </div>
          ) : (
            <div className="empty-state">
              Upload a report to inspect the S3 metadata, SHA-256 digest, and blockchain anchor.
            </div>
          )}

          {verificationResult ? (
            <div className="code-box">{JSON.stringify(verificationResult, null, 2)}</div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
