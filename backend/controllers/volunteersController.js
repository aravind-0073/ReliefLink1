const { getDb } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

// POST /api/volunteers
async function createVolunteer(req, res, next) {
  try {
    const db = getDb();
    const { name, skills, availability, location, address } = req.body;
    if (!name || !skills || !location) {
      return res.status(400).json({ success: false, message: "Name, skills, and location are required." });
    }
    const volunteer = {
      id: uuidv4(),
      name,
      skills: Array.isArray(skills) ? skills : [skills],
      availability: availability !== undefined ? Boolean(availability) : true,
      location,
      address: address || "",
      createdAt: new Date().toISOString(),
    };
    await db.collection("volunteers").doc(volunteer.id).set(volunteer);
    res.status(201).json({ success: true, data: volunteer });
  } catch (err) {
    next(err);
  }
}

// GET /api/volunteers
async function getVolunteers(req, res, next) {
  try {
    const db = getDb();
    const { availability } = req.query;
    let query = db.collection("volunteers");
    if (availability !== undefined) {
      query = query.where("availability", "==", availability === "true");
    }
    const snapshot = await query.get();
    const volunteers = snapshot.docs.map((d) => d.data());
    res.json({ success: true, data: volunteers });
  } catch (err) {
    next(err);
  }
}

// GET /api/volunteers/:id
async function getVolunteerById(req, res, next) {
  try {
    const db = getDb();
    const doc = await db.collection("volunteers").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Volunteer not found." });
    res.json({ success: true, data: doc.data() });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/volunteers/:id
async function updateVolunteer(req, res, next) {
  try {
    const db = getDb();
    const ref = db.collection("volunteers").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Volunteer not found." });
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    delete updates.id;
    await ref.update(updates);
    res.json({ success: true, data: { ...doc.data(), ...updates } });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/volunteers/:id
async function deleteVolunteer(req, res, next) {
  try {
    const db = getDb();
    await db.collection("volunteers").doc(req.params.id).delete();
    res.json({ success: true, message: "Volunteer deleted." });
  } catch (err) {
    next(err);
  }
}

module.exports = { createVolunteer, getVolunteers, getVolunteerById, updateVolunteer, deleteVolunteer };
