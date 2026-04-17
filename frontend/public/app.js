const state = {
  abhaId: "SAKSHAM@ABDM",
  latestReportId: null,
};

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(pretty(data));
  }
  return data;
}

async function fetchDemoProfiles() {
  const data = await api("/api/abha/demo-profiles");
  const container = document.getElementById("profiles");
  container.innerHTML = "";

  if (!data.profiles.length) {
    container.textContent = "No mock identities created yet.";
    return;
  }

  data.profiles.forEach((profile) => {
    const button = document.createElement("button");
    button.className = "profile-card";
    button.innerHTML = `
      <strong>${profile.fullName}</strong>
      <span>${profile.abhaId}</span>
      <span>${profile.phone}</span>
    `;
    button.addEventListener("click", () => {
      state.abhaId = profile.abhaId;
      document.getElementById("abhaId").value = profile.abhaId;
      document.getElementById("verifyAbhaId").value = profile.abhaId;
    });
    container.appendChild(button);
  });
}

async function registerIdentity(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  try {
    const data = await api("/api/abha/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.abhaId = data.identity.abhaId;
    document.getElementById("abhaId").value = data.identity.abhaId;
    document.getElementById("verifyAbhaId").value = data.identity.abhaId;
    document.getElementById("registrationOutput").textContent = pretty(data);
    fetchDemoProfiles();
  } catch (error) {
    document.getElementById("registrationOutput").textContent = error.message;
  }
}

async function verifyIdentity(event) {
  event.preventDefault();
  const abhaId = document.getElementById("verifyAbhaId").value.trim().toUpperCase();
  state.abhaId = abhaId;

  try {
    const data = await api("/api/abha/verify", {
      method: "POST",
      body: JSON.stringify({ abhaId }),
    });
    document.getElementById("verificationOutput").textContent = pretty(data);
  } catch (error) {
    document.getElementById("verificationOutput").textContent = error.message;
  }
}

async function analyzePatient(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const metrics = Object.fromEntries(formData.entries());
  metrics.resting_heart_rate = Number(metrics.resting_heart_rate);
  metrics.spo2 = Number(metrics.spo2);
  metrics.glucose = Number(metrics.glucose);
  metrics.sleep_hours = Number(metrics.sleep_hours);
  metrics.workout_minutes = Number(metrics.workout_minutes);
  metrics.age = Number(metrics.age);

  try {
    const data = await api(`/api/patients/${state.abhaId}/analyze`, {
      method: "POST",
      body: JSON.stringify({ metrics }),
    });
    document.getElementById("analysisOutput").textContent = pretty(data);
  } catch (error) {
    document.getElementById("analysisOutput").textContent = error.message;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadReport(event) {
  event.preventDefault();
  const fileInput = document.getElementById("reportFile");
  const file = fileInput.files[0];

  if (!file) {
    document.getElementById("uploadOutput").textContent = "Select a file first.";
    return;
  }

  try {
    const contentBase64 = await fileToBase64(file);
    const data = await api("/api/reports/upload", {
      method: "POST",
      body: JSON.stringify({
        abhaId: state.abhaId,
        fileName: file.name,
        mimeType: file.type,
        contentBase64,
        notes: document.getElementById("reportNotes").value,
      }),
    });
    state.latestReportId = data.report.reportId;
    document.getElementById("uploadOutput").textContent = pretty(data);
  } catch (error) {
    document.getElementById("uploadOutput").textContent = error.message;
  }
}

async function syncWearableData() {
  try {
    const data = await api(`/api/patients/${state.abhaId}/wearables/sync`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    document.getElementById("wearableOutput").textContent = pretty(data);
  } catch (error) {
    document.getElementById("wearableOutput").textContent = error.message;
  }
}

async function analyzeFromWearable() {
  try {
    const data = await api(`/api/patients/${state.abhaId}/wearables/analyze`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    document.getElementById("wearableOutput").textContent = pretty(data);
  } catch (error) {
    document.getElementById("wearableOutput").textContent = error.message;
  }
}

async function loadDashboard() {
  try {
    const data = await api(`/api/patients/${state.abhaId}/dashboard`);
    const latestReport = data.reports?.[data.reports.length - 1];
    if (latestReport) {
      state.latestReportId = latestReport.reportId;
    }
    document.getElementById("dashboardOutput").textContent = pretty(data);
  } catch (error) {
    document.getElementById("dashboardOutput").textContent = error.message;
  }
}

async function finalizeBlockchainStep() {
  if (!state.latestReportId) {
    document.getElementById("blockchainOutput").textContent =
      "Upload or load a report before finalizing the blockchain step.";
    return;
  }

  try {
    const data = await api(`/api/reports/${state.latestReportId}/finalize-blockchain`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    document.getElementById("blockchainOutput").textContent = pretty(data);
  } catch (error) {
    document.getElementById("blockchainOutput").textContent = error.message;
  }
}

document.getElementById("verificationForm").addEventListener("submit", verifyIdentity);
document.getElementById("registrationForm").addEventListener("submit", registerIdentity);
document.getElementById("analysisForm").addEventListener("submit", analyzePatient);
document.getElementById("uploadForm").addEventListener("submit", uploadReport);
document.getElementById("syncWearable").addEventListener("click", syncWearableData);
document.getElementById("analyzeWearable").addEventListener("click", analyzeFromWearable);
document.getElementById("loadDashboard").addEventListener("click", loadDashboard);
document.getElementById("finalizeBlockchain").addEventListener("click", finalizeBlockchainStep);
document.getElementById("refreshProfiles").addEventListener("click", fetchDemoProfiles);
document.getElementById("abhaId").value = state.abhaId;
document.getElementById("verifyAbhaId").value = state.abhaId;

fetchDemoProfiles().catch((error) => {
  document.getElementById("profiles").textContent = error.message;
});
