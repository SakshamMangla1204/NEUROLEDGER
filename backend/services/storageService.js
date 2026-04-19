const fs = require("fs");
const path = require("path");

const { REPORTS_DIR } = require("./localStoreService");

const STORAGE_MODE = (process.env.REPORT_STORAGE_MODE || "local").toLowerCase();

function sanitizeFilename(fileName) {
  return String(fileName || "report.bin").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function ensureLocalDirectory() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function writeLocalReport({ buffer, storedFileName }) {
  ensureLocalDirectory();
  const filePath = path.join(REPORTS_DIR, storedFileName);
  fs.writeFileSync(filePath, buffer);

  return {
    storageMode: "local",
    storageKey: storedFileName,
    filePath,
    fileUrl: null,
    s3Key: null,
    s3Bucket: null,
  };
}

async function writeS3Report({ buffer, storedFileName, mimeType }) {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  const prefix = process.env.AWS_S3_PREFIX || "reports/";
  const publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;

  if (!bucket || !region) {
    throw new Error("AWS_S3_BUCKET and AWS_REGION are required for REPORT_STORAGE_MODE=s3");
  }

  let s3ClientModule;
  try {
    s3ClientModule = require("@aws-sdk/client-s3");
  } catch (error) {
    throw new Error("Install @aws-sdk/client-s3 to enable S3 storage");
  }

  const { PutObjectCommand, S3Client } = s3ClientModule;
  const s3Key = `${prefix}${storedFileName}`;
  const client = new S3Client({ region });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType || "application/octet-stream",
    })
  );

  return {
    storageMode: "s3",
    storageKey: s3Key,
    filePath: null,
    fileUrl: publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, "")}/${s3Key}` : null,
    s3Key,
    s3Bucket: bucket,
  };
}

async function persistReportBinary({ buffer, reportId, fileName, mimeType }) {
  const safeName = sanitizeFilename(fileName);
  const storedFileName = `${reportId}-${safeName}`;

  if (STORAGE_MODE === "s3") {
    return {
      storedFileName,
      originalFileName: safeName,
      ...(await writeS3Report({ buffer, storedFileName, mimeType })),
    };
  }

  return {
    storedFileName,
    originalFileName: safeName,
    ...writeLocalReport({ buffer, storedFileName }),
  };
}

async function readS3ReportBuffer(report) {
  let s3ClientModule;
  try {
    s3ClientModule = require("@aws-sdk/client-s3");
  } catch (error) {
    throw new Error("Install @aws-sdk/client-s3 to verify S3-backed reports");
  }

  const { GetObjectCommand, S3Client } = s3ClientModule;
  const client = new S3Client({ region: process.env.AWS_REGION });
  const response = await client.send(
    new GetObjectCommand({
      Bucket: report.s3Bucket || process.env.AWS_S3_BUCKET,
      Key: report.s3Key,
    })
  );

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readReportBuffer(report) {
  if (report.storageMode === "s3") {
    return readS3ReportBuffer(report);
  }

  return fs.readFileSync(report.filePath);
}

async function getReportAccessDescriptor(report) {
  if (report.storageMode === "s3") {
    if (report.fileUrl) {
      return { type: "redirect", target: report.fileUrl };
    }

    let s3Modules;
    try {
      s3Modules = {
        client: require("@aws-sdk/client-s3"),
        signer: require("@aws-sdk/s3-request-presigner"),
      };
    } catch (error) {
      throw new Error(
        "Install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner to serve S3-backed reports"
      );
    }

    const { GetObjectCommand, S3Client } = s3Modules.client;
    const { getSignedUrl } = s3Modules.signer;
    const client = new S3Client({ region: process.env.AWS_REGION });
    const target = await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: report.s3Bucket || process.env.AWS_S3_BUCKET,
        Key: report.s3Key,
      }),
      { expiresIn: 900 }
    );

    return { type: "redirect", target };
  }

  return { type: "local", target: report.filePath };
}

module.exports = {
  STORAGE_MODE,
  getReportAccessDescriptor,
  persistReportBinary,
  readReportBuffer,
};
