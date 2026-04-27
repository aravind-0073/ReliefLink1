/**
 * Cleanup script: finds all assignments that are still "in-progress"
 * but whose linked need is already "completed", then marks them done
 * and frees the volunteer.
 *
 * Run with: node cleanupAssignments.js
 */
require("dotenv").config();
const { initFirebase, getDb } = require("./config/firebase");

async function cleanup() {
  initFirebase();
  const db = getDb();

  console.log("🔍 Scanning for stuck in-progress assignments...\n");

  const assignmentSnap = await db.collection("assignments").where("status", "==", "in-progress").get();
  if (assignmentSnap.empty) {
    console.log("✅ No stuck assignments found.");
    return;
  }

  let fixed = 0;
  for (const doc of assignmentSnap.docs) {
    const assignment = doc.data();
    const needDoc = await db.collection("needs").doc(assignment.needId).get();
    if (!needDoc.exists) continue;
    const need = needDoc.data();

    if (need.status === "completed" || need.status === "rejected") {
      console.log(`🔧 Fixing assignment ${assignment.id}`);
      console.log(`   Volunteer: ${assignment.volunteerId}`);
      console.log(`   Need: "${need.title}" (status: ${need.status})`);

      // Mark assignment completed
      await doc.ref.update({
        status: "completed",
        updatedAt: new Date().toISOString(),
        note: "Auto-fixed by cleanup script",
      });

      // Free the volunteer — try volunteers collection first, then users collection
      const volRef = db.collection("volunteers").doc(assignment.volunteerId);
      const volDoc = await volRef.get();
      if (volDoc.exists) {
        await volRef.update({ availability: true, updatedAt: new Date().toISOString() });
        console.log(`   ✅ Volunteer freed (volunteers collection)\n`);
      } else {
        // Auth-registered volunteers have their record in users collection
        const userRef = db.collection("users").doc(assignment.volunteerId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          await userRef.update({ availability: true, updatedAt: new Date().toISOString() });
          console.log(`   ✅ Volunteer freed (users collection)\n`);
        } else {
          console.log(`   ⚠️  Volunteer doc not found — assignment marked done but could not free volunteer\n`);
        }
      }
      fixed++;
    }
  }

  console.log(`\n🏁 Done. Fixed ${fixed} stuck assignment(s).`);
}

cleanup().catch(console.error);
