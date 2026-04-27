const { getDb } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const { sendAssignmentEmail } = require("../utils/emailService");

// POST /api/assignments
async function createAssignment(req, res, next) {
  try {
    const db = getDb();
    const { volunteerId, needId } = req.body;
    if (!volunteerId || !needId) {
      return res.status(400).json({ success: false, message: "volunteerId and needId are required." });
    }

    const [volDoc, needDoc] = await Promise.all([
      db.collection("volunteers").doc(volunteerId).get(),
      db.collection("needs").doc(needId).get(),
    ]);
    if (!volDoc.exists) return res.status(404).json({ success: false, message: "Volunteer not found." });
    if (!needDoc.exists) return res.status(404).json({ success: false, message: "Need not found." });

    const volunteer = volDoc.data();
    const need = needDoc.data();

    const assignment = {
      id: uuidv4(),
      volunteerId,
      needId,
      status: "in-progress",
      createdAt: new Date().toISOString(),
    };
    await db.collection("assignments").doc(assignment.id).set(assignment);
    await db.collection("needs").doc(needId).update({
      status: "in-progress",
      volunteerId,
      updatedAt: new Date().toISOString()
    });
    await db.collection("volunteers").doc(volunteerId).update({ availability: false, updatedAt: new Date().toISOString() });

    // Send assignment email — fires async, never blocks the response
    sendAssignmentEmail(volunteer.email, volunteer.name, need);

    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
}


// GET /api/assignments
async function getAssignments(req, res, next) {
  try {
    const db = getDb();
    const { volunteerId, needId, status } = req.query;
    let query = db.collection("assignments");
    if (volunteerId) query = query.where("volunteerId", "==", volunteerId);
    if (needId) query = query.where("needId", "==", needId);
    if (status) query = query.where("status", "==", status);
    const snapshot = await query.get();
    const assignments = snapshot.docs.map((d) => d.data());
    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/assignments/:id/status
async function updateAssignmentStatus(req, res, next) {
  try {
    const db = getDb();
    const { status } = req.body;
    const validStatuses = ["in-progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }
    const ref = db.collection("assignments").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Assignment not found." });
    await ref.update({ status, updatedAt: new Date().toISOString() });

    if (status === "completed") {
      await db.collection("needs").doc(doc.data().needId).update({ status: "completed", updatedAt: new Date().toISOString() });
    }

    // Free the volunteer if task is done or cancelled
    if (status === "completed" || status === "cancelled") {
      await db.collection("volunteers").doc(doc.data().volunteerId).update({
        availability: true,
        updatedAt: new Date().toISOString()
      });
    }

    res.json({ success: true, data: { ...doc.data(), status } });
  } catch (err) {
    next(err);
  }
}

module.exports = { createAssignment, getAssignments, updateAssignmentStatus };
