const JSON_HEADERS = {
  "Content-Type": "application/json"
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      ...JSON_HEADERS,
      ...(options.headers || {})
    },
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

export async function postHealthMetrics(payload) {
  return request("/api/health-metrics", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getHealthSummary(abhaId) {
  return request(`/api/health-summary/${encodeURIComponent(abhaId)}`);
}
