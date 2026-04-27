const { getDb } = require("../config/firebase");
const { calcPriorityScore } = require("../utils/priorityEngine");
const { v4: uuidv4 } = require("uuid");

// POST /api/needs — admin only, pre-approved
async function createNeed(req, res, next) {
  try {
    const db = getDb();
    const { title, description, category, urgency, peopleAffected, location, address } = req.body;
    if (!title || !description || !category || !urgency || !peopleAffected || !location) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    const need = {
      id: uuidv4(),
      title,
      description,
      category,
      urgency,
      peopleAffected: Number(peopleAffected),
      location,
      address: address || "",
      status: "open",
      approved: true,
      createdBy: req.user?.id || "admin",
      volunteerId: null,
      createdAt: new Date().toISOString(),
      priorityScore: 0,
    };
    need.priorityScore = calcPriorityScore(need);
    await db.collection("needs").doc(need.id).set(need);
    res.status(201).json({ success: true, data: need });
  } catch (err) {
    next(err);
  }
}

// GET /api/needs — role-scoped
async function getNeeds(req, res, next) {
  try {
    const db = getDb();
    const { category, urgency, status } = req.query;
    const user = req.user;
    let query = db.collection("needs");

    if (user.role === "user") {
      // Normal users can only see needs they submitted
      const snapshot = await db.collection("needs").where("createdBy", "==", user.id).get();
      const needs = snapshot.docs.map((d) => d.data());
      needs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ success: true, data: needs });
    }

    if (user.role === "volunteer") {
      // Volunteers see open tasks OR their own assigned/created tasks
      const [openSnap, assignedSnap, createdSnap] = await Promise.all([
        db.collection("needs").where("status", "in", ["open", "pending"]).get(),
        db.collection("needs").where("volunteerId", "==", user.id).get(),
        db.collection("needs").where("createdBy", "==", user.id).get(),
      ]);
      const needsMap = new Map();
      // Add open tasks first, then overwrite with assigned/created tasks to ensure fresh data wins over stale index reads
      openSnap.docs.forEach((d) => needsMap.set(d.id, d.data()));
      createdSnap.docs.forEach((d) => needsMap.set(d.id, d.data()));
      assignedSnap.docs.forEach((d) => needsMap.set(d.id, d.data()));
      const needs = Array.from(needsMap.values());
      let filtered = needs;
      if (category) filtered = filtered.filter((n) => n.category === category);
      if (urgency) filtered = filtered.filter((n) => n.urgency === urgency);
      if (status) filtered = filtered.filter((n) => n.status === status);
      
      filtered.sort((a, b) => {
        if (a.status === "rejected" && b.status !== "rejected") return 1;
        if (a.status !== "rejected" && b.status === "rejected") return -1;
        return b.priorityScore - a.priorityScore;
      });
      
      return res.json({ success: true, data: filtered });
    }

    // Admins see everything
    if (category) query = query.where("category", "==", category);
    if (urgency) query = query.where("urgency", "==", urgency);
    if (status) query = query.where("status", "==", status);
    const snapshot = await query.get();
    const needs = snapshot.docs.map((d) => d.data());
    needs.sort((a, b) => {
      if (a.status === "rejected" && b.status !== "rejected") return 1;
      if (a.status !== "rejected" && b.status === "rejected") return -1;
      return b.priorityScore - a.priorityScore;
    });
    res.json({ success: true, data: needs });
  } catch (err) {
    next(err);
  }
}

// GET /api/needs/prioritized — only open tasks
async function getPrioritizedNeeds(req, res, next) {
  try {
    const db = getDb();
    const user = req.user;
    let snapshot;
    if (user.role === "volunteer") {
      snapshot = await db.collection("needs").where("status", "==", "open").get();
    } else {
      snapshot = await db.collection("needs").where("status", "!=", "completed").get();
    }
    const needs = snapshot.docs.map((d) => d.data());
    needs.sort((a, b) => {
      // Rejected tasks always go to the bottom
      if (a.status === "rejected" && b.status !== "rejected") return 1;
      if (a.status !== "rejected" && b.status === "rejected") return -1;
      return b.priorityScore - a.priorityScore;
    });
    res.json({ success: true, data: needs });
  } catch (err) {
    next(err);
  }
}

// GET /api/needs/:id
async function getNeedById(req, res, next) {
  try {
    const db = getDb();
    const doc = await db.collection("needs").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Need not found." });
    res.json({ success: true, data: doc.data() });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/needs/:id/status
async function updateNeedStatus(req, res, next) {
  try {
    const db = getDb();
    const { status } = req.body;
    const user = req.user;

    const validStatuses = ["pending", "in-progress", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }
    const ref = db.collection("needs").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Need not found." });

    // Volunteers can only update their own assigned tasks
    if (user.role === "volunteer" && doc.data().volunteerId !== user.id) {
      return res.status(403).json({ success: false, message: "You can only update your own assigned tasks." });
    }

    await ref.update({ status, updatedAt: new Date().toISOString() });

    // If task is completed, free the volunteer
    if (status === "completed" && doc.data().volunteerId) {
      await db.collection("users").doc(doc.data().volunteerId).update({
        availability: true,
        updatedAt: new Date().toISOString()
      });
    }

    res.json({ success: true, data: { ...doc.data(), status } });
  } catch (err) {
    next(err);
  }
}

// POST /api/needs/:id/accept — Volunteer accepts (claims) a task
async function acceptTask(req, res, next) {
  try {
    const db = getDb();
    const user = req.user;
    const ref = db.collection("needs").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Need not found." });

    const need = doc.data();
    if (need.volunteerId) {
      return res.status(409).json({ success: false, message: "This task has already been accepted by another volunteer." });
    }

    await ref.update({
      volunteerId: user.id,
      volunteerEmail: user.email,
      status: "in-progress",
      acceptedAt: new Date().toISOString(),
    });

    // Mark volunteer as busy
    await db.collection("users").doc(user.id).update({
      availability: false,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: "Task accepted successfully!", data: { ...need, volunteerId: user.id, status: "in-progress" } });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/needs/:id
async function deleteNeed(req, res, next) {
  try {
    const db = getDb();
    await db.collection("needs").doc(req.params.id).delete();
    res.json({ success: true, message: "Need deleted." });
  } catch (err) {
    next(err);
  }
}

module.exports = { createNeed, getNeeds, getPrioritizedNeeds, getNeedById, updateNeedStatus, deleteNeed, acceptTask };
