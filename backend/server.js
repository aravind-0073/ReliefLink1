require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initFirebase } = require("./config/firebase");
const errorHandler = require("./middleware/errorHandler");

const needsRouter = require("./routes/needs");
const volunteersRouter = require("./routes/volunteers");
const matchingRouter = require("./routes/matching");
const assignmentsRouter = require("./routes/assignments");
const analyticsRouter = require("./routes/analytics");
const seedRouter = require("./routes/seed");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const adminRouter = require("./routes/admin");
const bulkRequestRouter = require("./routes/bulkRequest");
const { authenticateUser, authorizeRole } = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// Init Firestore
initFirebase();

// Middleware
app.use(cors({
  origin:
    "https://relieflink.netlify.app",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/profile", authenticateUser, profileRouter);
app.use("/api/admin", authenticateUser, adminRouter);
app.use("/api/needs", authenticateUser, needsRouter);
app.use("/api/volunteers", authenticateUser, volunteersRouter);
app.use("/api/match", authenticateUser, authorizeRole("admin"), matchingRouter);
app.use("/api/assignments", authenticateUser, assignmentsRouter);
app.use("/api/analytics", authenticateUser, authorizeRole("admin"), analyticsRouter);
app.use("/api/seed", authenticateUser, authorizeRole("admin"), seedRouter);
app.use("/api/bulk-request", authenticateUser, bulkRequestRouter);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found." }));

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ReliefLink backend running on http://localhost:${PORT}`);
});
