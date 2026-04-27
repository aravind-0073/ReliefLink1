require("dotenv").config();
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");

const serviceAccountPath = path.resolve(__dirname, "../../../smart-volunteer-allocator-firebase-adminsdk-fbsvc-f8d56d2e24.json");
const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function updateAdminName() {
  const snapshot = await db.collection("users").where("role", "==", "admin").get();
  if (snapshot.empty) {
    console.log("No admin found.");
    process.exit(0);
  }

  for (const doc of snapshot.docs) {
    await doc.ref.update({ name: "Admin" });
    console.log(`Updated admin ${doc.id} with name 'Admin'`);
  }
  process.exit(0);
}

updateAdminName();
