const { getDb } = require("../config/firebase");
const { calcPriorityScore } = require("../utils/priorityEngine");
const { v4: uuidv4 } = require("uuid");

// POST /api/admin/tasks/suggest — volunteer submits a suggestion
async function suggestNeed(req, res, next) {
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
      status: "pending",
      approved: false,
      createdBy: req.user.id,
      createdByRole: req.user.role,  // "volunteer" or "user"
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

// GET /api/admin/pending-tasks — all pending suggestions
async function getPendingTasks(req, res, next) {
  try {
    const db = getDb();
    const snapshot = await db.collection("needs").where("status", "==", "pending").get();
    const needs = snapshot.docs.map((d) => d.data());
    needs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: needs });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/tasks/:id/approve
async function approveTask(req, res, next) {
  try {
    const db = getDb();
    const ref = db.collection("needs").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Task not found." });
    await ref.update({ status: "open", approved: true, approvedAt: new Date().toISOString() });
    res.json({ success: true, message: "Task approved and is now open." });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/tasks/:id/reject
async function rejectTask(req, res, next) {
  try {
    const db = getDb();
    const ref = db.collection("needs").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Task not found." });
    await ref.update({ status: "rejected", approved: false, rejectedAt: new Date().toISOString() });
    res.json({ success: true, message: "Task rejected." });
  } catch (err) {
    next(err);
  }
}

module.exports = { suggestNeed, getPendingTasks, approveTask, rejectTask };
