const express = require("express");
const router = express.Router();
const { authorizeRole } = require("../middleware/authMiddleware");
const { suggestNeed, getPendingTasks, approveTask, rejectTask } = require("../controllers/adminController");

// Volunteer or User: suggest/request a new need
router.post("/suggest", authorizeRole("volunteer", "user"), suggestNeed);

// Admin only: review pending tasks
router.get("/pending-tasks", authorizeRole("admin"), getPendingTasks);
router.patch("/tasks/:id/approve", authorizeRole("admin"), approveTask);
router.patch("/tasks/:id/reject", authorizeRole("admin"), rejectTask);

module.exports = router;
