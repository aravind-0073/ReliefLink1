const { getDb } = require("../config/firebase");
const { matchVolunteersToNeed } = require("../utils/matchingEngine");

// GET /api/match/:needId
async function getMatches(req, res, next) {
  try {
    const db = getDb();
    const needDoc = await db.collection("needs").doc(req.params.needId).get();
    if (!needDoc.exists) return res.status(404).json({ success: false, message: "Need not found." });
    const need = needDoc.data();

    const [volSnap, assignSnap] = await Promise.all([
      db.collection("volunteers").get(),
      db.collection("assignments").where("needId", "==", need.id).get(),
    ]);
    const volunteers = volSnap.docs.map((d) => d.data());
    const assignments = assignSnap.docs.map((d) => d.data());

    const matches = matchVolunteersToNeed(need, volunteers, assignments);
    res.json({ success: true, need, data: matches });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMatches };
