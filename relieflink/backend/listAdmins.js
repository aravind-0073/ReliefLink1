const { getDb, initFirebase } = require("./config/firebase");
require("dotenv").config();

async function listAdmins() {
  initFirebase();
  const db = getDb();
  const snapshot = await db.collection("users").where("role", "==", "admin").get();
  if (snapshot.empty) {
    console.log("No admin users found.");
  } else {
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`Email: ${data.email}, Name: ${data.name}`);
    });
  }
  process.exit();
}

listAdmins();
