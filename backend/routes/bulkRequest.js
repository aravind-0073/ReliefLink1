const express = require("express");
const router = express.Router();
const { authorizeRole } = require("../middleware/authMiddleware");
const { submitBulkRequest, getBulkRequests, approveBulkRequest, rejectBulkRequest } = require("../controllers/bulkRequestController");

// Any authenticated user (admin, volunteer, user) can submit
router.post("/", submitBulkRequest);

// Admin only
router.get("/", authorizeRole("admin"), getBulkRequests);
router.post("/:id/approve", authorizeRole("admin"), approveBulkRequest);
router.post("/:id/reject", authorizeRole("admin"), rejectBulkRequest);

module.exports = router;
