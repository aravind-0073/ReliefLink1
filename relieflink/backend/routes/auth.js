const express = require("express");
const router = express.Router();
const { login, registerVolunteer, registerUser } = require("../controllers/authController");

router.post("/login", login);
router.post("/register", registerVolunteer);
router.post("/register-user", registerUser);

module.exports = router;
