const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ID van de pending spot via command line
const pendingId = process.argv[2];

if (!pendingId) {
  console.log("Gebruik: node approvePending.js <pendingSpotId>");
  process.exit(1);
}

async function approve() {
  const pendingRef = db.collection("pending_spots").doc(pendingId);
  const snap = await pendingRef.get();

  if (!snap.exists) {
    console.log("Pending spot bestaat niet");
    return;
  }

  // kopiëren naar spots
  await db.collection("spots").doc(pendingId).set(snap.data());

  console.log("Spot gekopieerd naar spots");
  console.log("Pending spot blijft bestaan (niet verwijderd)");
}

approve().catch(console.error);
