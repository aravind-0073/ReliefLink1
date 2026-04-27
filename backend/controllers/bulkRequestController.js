const { getDb } = require("../config/firebase");
const { calcPriorityScore } = require("../utils/priorityEngine");
const { v4: uuidv4 } = require("uuid");

const VALID_CATEGORIES = ["food", "health", "disaster", "shelter", "education", "other"];
const VALID_URGENCIES = ["low", "medium", "high", "critical"];
const REQUIRED_FIELDS = ["title", "category", "urgency", "location"];

function validateRow(row) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || String(row[field]).trim() === "") {
      errors.push(`Missing: ${field}`);
    }
  }
  if (row.category && !VALID_CATEGORIES.includes(String(row.category).toLowerCase())) {
    errors.push(`Invalid category: ${row.category}`);
  }
  if (row.urgency && !VALID_URGENCIES.includes(String(row.urgency).toLowerCase())) {
    errors.push(`Invalid urgency: ${row.urgency}`);
  }
  const people = Number(row.peopleAffected);
  if (row.peopleAffected !== undefined && row.peopleAffected !== "" && (isNaN(people) || people < 1)) {
    errors.push("peopleAffected must be >= 1");
  }
  return errors;
}

function rowToNeed(row, requestId, uploadedBy) {
  const need = {
    id: uuidv4(),
    title: String(row.title).trim(),
    description: String(row.description || "No description provided.").trim(),
    category: String(row.category).toLowerCase().trim(),
    urgency: String(row.urgency).toLowerCase().trim(),
    peopleAffected: Math.max(1, Number(row.peopleAffected) || 1),
    location: { lat: 0, lng: 0 },
    address: String(row.location || "").trim(),
    status: "open",
    approved: true,
    volunteerId: null,
    createdBy: uploadedBy,
    source: "bulk_upload",
    bulkRequestId: requestId,
    createdAt: new Date().toISOString(),
    priorityScore: 0,
  };
  need.priorityScore = calcPriorityScore(need);
  return need;
}

async function submitBulkRequest(req, res, next) {
  try {
    const db = getDb();
    const { fileName, parsedData } = req.body;
    const user = req.user;

    if (!fileName || !Array.isArray(parsedData) || parsedData.length === 0) {
      return res.status(400).json({ success: false, message: "fileName and parsedData (non-empty array) are required." });
    }

    const requestId = uuidv4();
    const isAdmin = user.role === "admin";

    if (isAdmin) {
      const created = [];
      const skipped = [];
      for (const row of parsedData) {
        const errors = validateRow(row);
        if (errors.length > 0) { skipped.push({ row, errors }); continue; }
        const need = rowToNeed(row, requestId, user.id);
        await db.collection("needs").doc(need.id).set(need);
        created.push(need.id);
      }
      const bulkReq = {
        id: requestId, fileName, parsedData,
        status: "approved", uploadedBy: user.id, uploadedByRole: user.role,
        createdAt: new Date().toISOString(), approvedAt: new Date().toISOString(),
        summary: { created: created.length, skipped: skipped.length },
      };
      await db.collection("bulkRequests").doc(requestId).set(bulkReq);
      return res.status(201).json({ success: true, message: `Auto-approved. ${created.length} needs created, ${skipped.length} rows skipped.`, data: bulkReq });
    }

    // Volunteer or User — pending approval
    const bulkReq = {
      id: requestId, fileName, parsedData,
      status: "pending", uploadedBy: user.id, uploadedByRole: user.role,
      createdAt: new Date().toISOString(),
    };
    await db.collection("bulkRequests").doc(requestId).set(bulkReq);
    return res.status(201).json({ success: true, message: "Bulk request submitted for admin review.", data: bulkReq });
  } catch (err) { next(err); }
}

async function getBulkRequests(req, res, next) {
  try {
    const db = getDb();
    const snapshot = await db.collection("bulkRequests").get();
    const requests = snapshot.docs.map(d => d.data());
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
}

async function approveBulkRequest(req, res, next) {
  try {
    const db = getDb();
    const ref = db.collection("bulkRequests").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Bulk request not found." });
    const bulkReq = doc.data();
    if (bulkReq.status !== "pending") {
      return res.status(400).json({ success: false, message: `Request is already ${bulkReq.status}.` });
    }
    const created = [];
    const skipped = [];
    for (const row of bulkReq.parsedData) {
      const errors = validateRow(row);
      if (errors.length > 0) { skipped.push({ row, errors }); continue; }
      const need = rowToNeed(row, bulkReq.id, bulkReq.uploadedBy);
      await db.collection("needs").doc(need.id).set(need);
      created.push(need.id);
    }
    await ref.update({
      status: "approved", approvedAt: new Date().toISOString(),
      approvedBy: req.user.id, summary: { created: created.length, skipped: skipped.length },
    });
    res.json({ success: true, message: `Approved. ${created.length} needs created, ${skipped.length} rows skipped.`, data: { created: created.length, skipped: skipped.length } });
  } catch (err) { next(err); }
}

async function rejectBulkRequest(req, res, next) {
  try {
    const db = getDb();
    const ref = db.collection("bulkRequests").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Bulk request not found." });
    await ref.update({ status: "rejected", rejectedAt: new Date().toISOString(), rejectedBy: req.user.id });
    res.json({ success: true, message: "Bulk request rejected." });
  } catch (err) { next(err); }
}

module.exports = { submitBulkRequest, getBulkRequests, approveBulkRequest, rejectBulkRequest };
