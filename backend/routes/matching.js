const express = require("express");
const router = express.Router();
const { getMatches } = require("../controllers/matchingController");

router.get("/:needId", getMatches);

module.exports = router;
