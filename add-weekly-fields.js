const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function addWeeklyFields() {
  try {
    const snapshot = await db.collection("spots").get();

    if (snapshot.empty) {
      console.log("Geen spots gevonden.");
      return;
    }

    let batch = db.batch();
    let batchCount = 0;
    let updated = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updateData = {};

      if (!("weeklyKey" in data)) {
        updateData.weeklyKey = "";
      }

      if (!("weeklyRatingSum" in data)) {
        updateData.weeklyRatingSum = 0;
      }

      if (!("weeklyRatingCount" in data)) {
        updateData.weeklyRatingCount = 0;
      }

      if (!("weeklyAvgRating" in data)) {
        updateData.weeklyAvgRating = 0;
      }

      if (!("weeklyUpdatedAt" in data)) {
        updateData.weeklyUpdatedAt = null;
      }

      if (Object.keys(updateData).length === 0) {
        console.log(`✓ ${doc.id} heeft alles al`);
        continue;
      }

      batch.update(doc.ref, updateData);

      batchCount++;
      updated++;

      if (batchCount >= 400) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log("");
    console.log("✅ KLAAR");
    console.log(`${updated} spots aangepast.`);
  } catch (error) {
    console.error("❌ Fout:", error);
  }
}

addWeeklyFields();
