const { getDb } = require("../config/firebase");

// GET /api/profile
async function getProfile(req, res, next) {
  try {
    const db = getDb();
    const doc = await db.collection("users").doc(req.user.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "User not found." });
    const { passwordHash, ...safeUser } = doc.data();
    res.json({ success: true, data: safeUser });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/profile
async function updateProfile(req, res, next) {
  try {
    const db = getDb();
    const { name, skills, phone, address, location } = req.body;
    const updates = {};
    if (name)     updates.name = name;
    if (skills)   updates.skills = Array.isArray(skills) ? skills : [skills];
    if (phone)    updates.phone = phone;
    if (address)  updates.address = address;
    if (location && location.lat && location.lng) updates.location = location;
    updates.updatedAt = new Date().toISOString();

    // Update user record
    await db.collection("users").doc(req.user.id).update(updates);

    // Keep the volunteers collection in sync (same doc ID)
    try {
      await db.collection("volunteers").doc(req.user.id).update(updates);
    } catch {
      // Volunteer doc may not exist for admin users — silently ignore
    }

    res.json({ success: true, message: "Profile updated.", data: updates });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile };
