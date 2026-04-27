require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const bcrypt = require('bcryptjs');
const path = require('path');
const serviceAccountPath = path.resolve(__dirname, '../../../smart-volunteer-allocator-firebase-adminsdk-fbsvc-f8d56d2e24.json');
const serviceAccount = require(serviceAccountPath);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
async function reset() {
  const email = 'admin@relieflink.com';
  const password = 'adminpassword123';
  const snapshot = await db.collection('users').where('email', '==', email).get();
  if (snapshot.empty) return console.log('Admin not found');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  await snapshot.docs[0].ref.update({ passwordHash });
  console.log('Password reset to adminpassword123');
  process.exit(0);
}
reset();
