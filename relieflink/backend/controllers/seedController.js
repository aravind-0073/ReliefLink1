const { getDb } = require("../config/firebase");
const { calcPriorityScore } = require("../utils/priorityEngine");
const { v4: uuidv4 } = require("uuid");

const SAMPLE_NEEDS = [
  { title: "Food shortage – Sector 7", description: "150+ families without food access after flooding. Urgent distribution needed.", category: "food", urgency: "critical", peopleAffected: 150, location: { lat: 28.65, lng: 77.23 }, address: "Sector 7, RK Puram, New Delhi, 110022" },
  { title: "Medical camp needed – East Village", description: "Elderly population lacking basic healthcare access. Need doctors and nurses.", category: "health", urgency: "high", peopleAffected: 80, location: { lat: 28.63, lng: 77.21 }, address: "East Patel Nagar, New Delhi, 110008" },
  { title: "School supplies shortage", description: "Children unable to attend school due to lack of materials.", category: "education", urgency: "medium", peopleAffected: 45, location: { lat: 28.67, lng: 77.25 }, address: "Lajpat Nagar, New Delhi, 110024" },
  { title: "Disaster shelter required", description: "Families displaced after building collapse. Immediate shelter needed.", category: "disaster", urgency: "high", peopleAffected: 200, location: { lat: 28.62, lng: 77.19 }, address: "Connaught Place, New Delhi, 110001" },
  { title: "Drinking water contamination", description: "Contaminated water supply in northern zone. Volunteers needed for distribution.", category: "health", urgency: "medium", peopleAffected: 60, location: { lat: 28.68, lng: 77.27 }, address: "Karol Bagh, New Delhi, 110005" },
  { title: "Adult literacy program", description: "Need volunteers to teach basic reading and writing skills to adults.", category: "education", urgency: "low", peopleAffected: 30, location: { lat: 28.66, lng: 77.22 }, address: "Hauz Khas, New Delhi, 110016" },
];

const SAMPLE_VOLUNTEERS = [
  { name: "Arjun Sharma", skills: ["medical", "first-aid"], availability: true, location: { lat: 28.64, lng: 77.22 }, address: "Vasant Vihar, New Delhi, 110057" },
  { name: "Priya Mehta", skills: ["teaching", "education", "tutoring"], availability: true, location: { lat: 28.67, lng: 77.24 }, address: "Green Park, New Delhi, 110016" },
  { name: "Ravi Kumar", skills: ["logistics", "food-distribution", "driving"], availability: false, location: { lat: 28.61, lng: 77.20 }, address: "Mayur Vihar, New Delhi, 110091" },
  { name: "Sunita Patel", skills: ["counseling", "education", "communication"], availability: true, location: { lat: 28.65, lng: 77.26 }, address: "Dwarka Sector 11, New Delhi, 110075" },
  { name: "Mohan Das", skills: ["construction", "disaster-relief", "general-help"], availability: true, location: { lat: 28.62, lng: 77.18 }, address: "Saket, New Delhi, 110017" },
  { name: "Kavita Rao", skills: ["nursing", "first-aid", "medical", "general-help"], availability: true, location: { lat: 28.69, lng: 77.23 }, address: "Pitampura, New Delhi, 110034" },
];

async function clearCollection(db, collectionName) {
  const snapshot = await db.collection(collectionName).where("isSeed", "==", true).get();
  if (snapshot.size === 0) return;
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

async function seedDatabase(req, res, next) {
  try {
    const db = getDb();
    
    // Wipe old data to prevent duplicates
    await clearCollection(db, "needs");
    await clearCollection(db, "volunteers");
    await clearCollection(db, "assignments");

    const batch = db.batch();

    for (const n of SAMPLE_NEEDS) {
      const id = uuidv4();
      const need = { ...n, id, status: "pending", isSeed: true, createdAt: new Date().toISOString(), priorityScore: 0 };
      need.priorityScore = calcPriorityScore(need);
      batch.set(db.collection("needs").doc(id), need);
    }

    for (const v of SAMPLE_VOLUNTEERS) {
      const id = uuidv4();
      batch.set(db.collection("volunteers").doc(id), { ...v, id, isSeed: true, createdAt: new Date().toISOString() });
    }

    await batch.commit();
    res.json({ success: true, message: `Seeded ${SAMPLE_NEEDS.length} needs and ${SAMPLE_VOLUNTEERS.length} volunteers.` });
  } catch (err) {
    next(err);
  }
}

module.exports = { seedDatabase };
