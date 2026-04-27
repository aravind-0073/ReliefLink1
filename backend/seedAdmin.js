require("dotenv").config();
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// Hardcode path for script to work locally without env issues if needed, but fallback is there
const serviceAccountPath = process.env.FIREBASE_CREDENTIALS_PATH 
  ? path.resolve(__dirname, process.env.FIREBASE_CREDENTIALS_PATH)
  : path.resolve(__dirname, "../../../smart-volunteer-allocator-firebase-adminsdk-fbsvc-f8d56d2e24.json");

const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedAdmin() {
  try {
    const email = "admin@relieflink.com";
    const password = "adminpassword123";
    
    const existing = await db.collection("users").where("email", "==", email).get();
    if (!existing.empty) {
      console.log("Admin user already exists!");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = uuidv4();
    await db.collection("users").doc(userId).set({
      id: userId,
      email,
      role: "admin",
      passwordHash,
      createdAt: new Date().toISOString()
    });

    console.log("Admin seeded successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err);
    process.exit(1);
  }
}

seedAdmin();
