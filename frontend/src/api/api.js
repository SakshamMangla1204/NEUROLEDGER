const JSON_HEADERS = {
  "Content-Type": "application/json"
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? JSON_HEADERS : {}),
    ...(options.headers || {})
  };

  const response = await fetch(buildUrl(path), {
    headers,
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail =
      typeof data === "string" ? data : data?.detail || data?.error || JSON.stringify(data);
    throw new Error(detail);
  }

  return data;
}

export async function fetchSystemStatus() {
  return request("/api/system/status");
}

export async function fetchMockProfiles() {
  return request("/api/abha/demo-profiles");
}

export async function registerIdentity(payload) {
  return request("/api/abha/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function verifyIdentity(abhaId) {
  return request("/api/abha/verify", {
    method: "POST",
    body: JSON.stringify({ abhaId })
  });
}

export async function runManualAnalysis(abhaId, metrics) {
  return request(`/api/patients/${encodeURIComponent(abhaId)}/analyze`, {
    method: "POST",
    body: JSON.stringify({ metrics })
  });
}

export async function getDashboard(abhaId) {
  return request(`/api/patients/${encodeURIComponent(abhaId)}/dashboard`);
}

export async function uploadReport(payload) {
  return request("/api/reports/upload", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function finalizeBlockchain(reportId) {
  return request(`/api/reports/${encodeURIComponent(reportId)}/finalize-blockchain`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function verifyReport(reportId) {
  return request(`/api/reports/${encodeURIComponent(reportId)}/verify`);
}

export async function verifyReportHash(hash) {
  return request("/api/reports/verify", {
    method: "POST",
    body: JSON.stringify({ hash })
  });
}

export async function postHealthMetrics(payload) {
  return request("/api/health-metrics", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getHealthSummary(abhaId) {
  return request(`/api/health-summary/${encodeURIComponent(abhaId)}`);
}
