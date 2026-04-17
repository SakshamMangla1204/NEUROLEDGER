require("dotenv").config();
const cors = require("cors");
const express = require("express");
const healthRoutes = require("./routes/healthRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({ message: "NeuroLedger backend is running" });
});
app.use("/", healthRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
