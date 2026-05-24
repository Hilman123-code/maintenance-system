const express = require("express");
const cors = require("cors");

require("dotenv").config();

const pool = require("./db");
const assetRoutes = require("./routes/assetRoutes");
const requestRoutes = require("./routes/requestRoutes");
const actionRoutes = require("./routes/actionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const sparePartRoutes = require("./routes/sparePartRoutes");
const pmRoutes = require("./routes/pmRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Maintenance System Backend is running");
});

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database connected successfully",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

app.use("/api/assets", assetRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/actions", actionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/spare-parts", sparePartRoutes);
app.use("/api/pm", pmRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});