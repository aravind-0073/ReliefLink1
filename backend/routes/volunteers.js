const express = require("express");
const router = express.Router();
const { authorizeRole } = require("../middleware/authMiddleware");
const {
  createVolunteer,
  getVolunteers,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer,
} = require("../controllers/volunteersController");

// Any authenticated user can read volunteers
router.get("/", getVolunteers);
router.get("/:id", getVolunteerById);

// Only admins can create, update, or delete volunteers
router.post("/", authorizeRole("admin"), createVolunteer);
router.patch("/:id", authorizeRole("admin"), updateVolunteer);
router.delete("/:id", authorizeRole("admin"), deleteVolunteer);

module.exports = router;
