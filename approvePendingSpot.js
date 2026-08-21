const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const pendingId = process.argv[2];

if (!pendingId) {
  console.log("Gebruik: node approvePendingSpot.js <pendingSpotId>");
  process.exit(1);
}

async function approve() {
  const pendingRef = db.collection("pending_spots").doc(pendingId);
  const snap = await pendingRef.get();

  if (!snap.exists) {
    console.log("Pending spot bestaat niet");
    return;
  }

  // Spot naar definitieve collectie kopiëren
  await db.collection("spots").doc(pendingId).set(snap.data());

  // Daarna verwijderen uit pending
  await pendingRef.delete();

  console.log("✅ Spot approved");
  console.log("✅ Gekopieerd naar spots");
  console.log("✅ Verwijderd uit pending_spots");
  console.log("ID:", pendingId);
}

approve().catch(console.error);
