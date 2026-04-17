require("dotenv").config();
const cors = require("cors");
const express = require("express");
const path = require("path");
const healthRoutes = require("./routes/healthRoutes");
const prototypeRoutes = require("./routes/prototypeRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_DIR = path.resolve(__dirname, "../frontend/public");

let authRoutes = null;

if (process.env.MONGO_URI) {
  try {
    const connectDB = require("./src/config/db");
    authRoutes = require("./src/routes/authRoutes");
    connectDB().catch((error) => {
      console.error("Database connection failed:", error.message);
    });
  } catch (error) {
    console.warn(`Auth modules unavailable: ${error.message}`);
  }
} else {
  console.warn("MONGO_URI is not set. Auth persistence is disabled.");
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/app", express.static(FRONTEND_DIR));
app.get("/", (req, res) => {
  res.status(200).json({
    message: "NeuroLedger backend is running",
    appUrl: "/app/index.html",
  });
});
app.use("/", healthRoutes);
if (authRoutes) {
  app.use("/api/auth", authRoutes);
}
app.use("/api", prototypeRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
