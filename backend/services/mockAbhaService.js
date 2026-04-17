const { STORE_FILES, readJson, writeJson } = require("./localStoreService");

function normalizeAbhaId(abhaId) {
  return String(abhaId || "").trim().toUpperCase();
}

function listStoredIdentities() {
  return readJson(STORE_FILES.identities, []);
}

function writeStoredIdentities(records) {
  writeJson(STORE_FILES.identities, records);
}

function findIdentityByAbhaId(abhaId) {
  const normalized = normalizeAbhaId(abhaId);
  const identities = listStoredIdentities();
  const identity = identities.find((identity) => identity.abhaId === normalized) || null;
  if (!identity) {
    return null;
  }

  return {
    ...identity,
    linkedReports: Array.isArray(identity.linkedReports) ? identity.linkedReports : [],
    metrics: Array.isArray(identity.metrics) ? identity.metrics : [],
  };
}

function registerIdentity({ name, dob, phone, abhaId }) {
  const normalized = normalizeAbhaId(abhaId);
  const identities = listStoredIdentities();
  const existing = identities.find((identity) => identity.abhaId === normalized);

  if (existing) {
    return existing;
  }

  const identity = {
    name: String(name || "").trim(),
    dob: String(dob || "").trim(),
    phone: String(phone || "").trim(),
    abhaId: normalized,
    linkedReports: [],
    metrics: [],
    createdAt: new Date().toISOString(),
    mode: "simulated_abha_identity",
  };

  identities.push(identity);
  writeStoredIdentities(identities);
  return identity;
}

function appendMetricToIdentity(abhaId, metricRecord) {
  const normalized = normalizeAbhaId(abhaId);
  const identities = listStoredIdentities();
  let updatedIdentity = null;

  const next = identities.map((identity) => {
    if (identity.abhaId !== normalized) {
      return identity;
    }

    const metrics = Array.isArray(identity.metrics) ? identity.metrics : [];
    updatedIdentity = {
      ...identity,
      metrics: [...metrics, metricRecord],
      updatedAt: new Date().toISOString(),
    };
    return updatedIdentity;
  });

  writeStoredIdentities(next);
  return updatedIdentity;
}

function linkReportToIdentity(abhaId, reportId) {
  const normalized = normalizeAbhaId(abhaId);
  const identities = listStoredIdentities();
  const next = identities.map((identity) => {
    if (identity.abhaId !== normalized) {
      return identity;
    }

    const linkedReports = Array.isArray(identity.linkedReports)
      ? identity.linkedReports
      : [];

    if (!linkedReports.includes(reportId)) {
      linkedReports.push(reportId);
    }

    return {
      ...identity,
      linkedReports,
      updatedAt: new Date().toISOString(),
    };
  });

  writeStoredIdentities(next);
}

function verifyAbhaId(abhaId) {
  const normalized = normalizeAbhaId(abhaId);
  const identity = findIdentityByAbhaId(normalized);

  if (!identity) {
    return {
      verified: false,
      mode: "simulated_abha_identity",
      abhaId: normalized,
      message: "ABHA-like ID was not found in the simulated registry.",
    };
  }

  return {
    verified: true,
    mode: "simulated_abha_identity",
    abhaId: normalized,
    patient: identity,
  };
}

function listDemoProfiles() {
  return listStoredIdentities().map((identity) => ({
    abhaId: identity.abhaId,
    fullName: identity.name,
    phone: identity.phone,
    dob: identity.dob,
  }));
}

module.exports = {
  appendMetricToIdentity,
  findIdentityByAbhaId,
  linkReportToIdentity,
  listDemoProfiles,
  normalizeAbhaId,
  registerIdentity,
  verifyAbhaId,
};
