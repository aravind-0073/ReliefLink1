const express = require("express");
const router = express.Router();
const { authorizeRole } = require("../middleware/authMiddleware");
const {
  createNeed,
  getNeeds,
  getPrioritizedNeeds,
  getNeedById,
  updateNeedStatus,
  deleteNeed,
  acceptTask,
} = require("../controllers/needsController");

// Admin only: create and delete
router.post("/", authorizeRole("admin"), createNeed);
router.delete("/:id", authorizeRole("admin"), deleteNeed);

// Authenticated users (admin + volunteer)
router.get("/", getNeeds);
router.get("/prioritized", getPrioritizedNeeds);
router.get("/:id", getNeedById);
router.patch("/:id/status", updateNeedStatus);
router.post("/:id/accept", acceptTask);

module.exports = router;
