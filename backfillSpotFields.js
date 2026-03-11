const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function backfillCollection(collectionName) {
  const snap = await db.collection(collectionName).get();

  if (snap.empty) {
    console.log(`Geen docs gevonden in ${collectionName}.`);
    return;
  }

  let updatedCount = 0;
  let skippedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const updateData = {};

    if (typeof data.avgRating !== "number") updateData.avgRating = 0;
    if (!Number.isInteger(data.ratingCount)) updateData.ratingCount = 0;
    if (!Number.isInteger(data.ratingSum)) updateData.ratingSum = 0;
    if (!Number.isInteger(data.commentCount)) updateData.commentCount = 0;
    if (typeof data.photoURL !== "string") updateData.photoURL = "";
    if (typeof data.description !== "string") updateData.description = "";

    if (Object.keys(updateData).length > 0) {
      await doc.ref.set(updateData, { merge: true });
      updatedCount++;
      console.log(`[${collectionName}] Updated: ${doc.id}`, updateData);
    } else {
      skippedCount++;
      console.log(`[${collectionName}] Skipped: ${doc.id}`);
    }
  }

  console.log(`\n[${collectionName}] klaar`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}\n`);
}

async function run() {
  await backfillCollection("spots");
  await backfillCollection("pending_spots");
}

run().catch((err) => {
  console.error("Fout:", err);
});
