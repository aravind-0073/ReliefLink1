const express = require("express");
const router = express.Router();
const { seedDatabase } = require("../controllers/seedController");

router.post("/", seedDatabase);
router.get("/", (req, res) => {
    res.send("Seed route GET working");
});

module.exports = router;
