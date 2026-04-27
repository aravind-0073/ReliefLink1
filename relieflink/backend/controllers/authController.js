const { getDb } = require("../config/firebase");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");
const { v4: uuidv4 } = require("uuid");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required." });

    const db = getDb();
    const snapshot = await db.collection("users").where("email", "==", email.trim().toLowerCase()).limit(1).get();
    
    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name || "" },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role, name: user.name || "" } });
  } catch (err) {
    next(err);
  }
}

async function registerVolunteer(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ success: false, message: "Email, password, and name required." });

    const db = getDb();
    
    const existing = await db.collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
    if (!existing.empty) return res.status(400).json({ success: false, message: "Email already exists." });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const userId = uuidv4();
    const user = {
      id: userId,
      email: email.toLowerCase(),
      name,
      role: "volunteer",
      passwordHash,
      createdAt: new Date().toISOString()
    };

    await db.collection("users").doc(userId).set(user);

    // Auto-create a matching volunteers record so the admin can see them
    const volunteerProfile = {
      id: userId,          // same ID as the user so updates stay in sync
      userId,
      name,
      email: email.toLowerCase(),
      skills: [],
      availability: true,
      location: null,
      address: "",
      phone: "",
      createdAt: new Date().toISOString(),
    };
    await db.collection("volunteers").doc(userId).set(volunteerProfile);
    
    res.status(201).json({ success: true, message: "Volunteer registered successfully." });
  } catch (err) {
    next(err);
  }
}

async function registerUser(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ success: false, message: "Email, password, and name required." });

    const db = getDb();
    const existing = await db.collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
    if (!existing.empty) return res.status(400).json({ success: false, message: "Email already exists." });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();
    const user = {
      id: userId,
      email: email.toLowerCase(),
      name,
      role: "user",
      passwordHash,
      createdAt: new Date().toISOString()
    };
    await db.collection("users").doc(userId).set(user);
    res.status(201).json({ success: true, message: "Account created successfully." });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, registerVolunteer, registerUser };
