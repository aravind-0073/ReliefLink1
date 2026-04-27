const express = require("express");
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  updateAssignmentStatus,
} = require("../controllers/assignmentsController");

router.post("/", createAssignment);
router.get("/", getAssignments);
router.patch("/:id/status", updateAssignmentStatus);

module.exports = router;
