const { getDb } = require("../config/firebase");

// GET /api/analytics
async function getAnalytics(req, res, next) {
  try {
    const db = getDb();
    const [needsSnap, volSnap, assignSnap] = await Promise.all([
      db.collection("needs").get(),
      db.collection("volunteers").get(),
      db.collection("assignments").get(),
    ]);
    const needs = needsSnap.docs.map((d) => d.data());
    const volunteers = volSnap.docs.map((d) => d.data());
    const assignments = assignSnap.docs.map((d) => d.data());

    const completed = needs.filter((n) => n.status === "completed");
    const totalPeopleHelped = completed.reduce((s, n) => s + (n.peopleAffected || 0), 0);

    const byCategory = {};
    const byUrgency = {};
    needs.forEach((n) => {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
      byUrgency[n.urgency] = (byUrgency[n.urgency] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        totalNeeds: needs.length,
        pendingNeeds: needs.filter((n) => n.status === "pending").length,
        inProgressNeeds: needs.filter((n) => n.status === "in-progress").length,
        completedNeeds: completed.length,
        urgentNeeds: needs.filter((n) => n.urgency === "high" && n.status !== "completed").length,
        totalVolunteers: volunteers.length,
        availableVolunteers: volunteers.filter((v) => v.availability).length,
        totalAssignments: assignments.length,
        activeAssignments: assignments.filter((a) => a.status === "in-progress").length,
        totalPeopleHelped,
        byCategory,
        byUrgency,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAnalytics };
