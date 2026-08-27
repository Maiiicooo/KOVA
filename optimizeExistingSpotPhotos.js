const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const crypto = require("crypto");
const sharp = require("sharp");

const serviceAccount = require("./serviceAccountKey.json");

const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET || "kova-6052a.firebasestorage.app";

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: STORAGE_BUCKET,
});

const db = getFirestore();
const bucket = getStorage().bucket();

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const FULL_MAX_SIZE = 1600;
const THUMB_MAX_SIZE = 640;

const FULL_QUALITY = 82;
const THUMB_QUALITY = 78;

const CACHE_CONTROL = "public,max-age=31536000,immutable";

function makeDownloadURL(path, token) {
  return (
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
    `${encodeURIComponent(path)}?alt=media&token=${token}`
  );
}

async function downloadImage(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}

async function makeOptimizedImages(inputBuffer) {
  const image = sharp(inputBuffer, {
    failOn: "none",
  }).rotate();

  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not determine image dimensions.");
  }

  const fullBuffer = await image
    .clone()
    .resize({
      width: FULL_MAX_SIZE,
      height: FULL_MAX_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: FULL_QUALITY,
      effort: 4,
    })
    .toBuffer();

  const thumbBuffer = await image
    .clone()
    .resize({
      width: THUMB_MAX_SIZE,
      height: THUMB_MAX_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: THUMB_QUALITY,
      effort: 4,
    })
    .toBuffer();

  const fullMeta = await sharp(fullBuffer).metadata();

  const thumbMeta = await sharp(thumbBuffer).metadata();

  return {
    fullBuffer,
    thumbBuffer,

    originalWidth: metadata.width,
    originalHeight: metadata.height,

    fullWidth: fullMeta.width || null,
    fullHeight: fullMeta.height || null,

    thumbWidth: thumbMeta.width || null,
    thumbHeight: thumbMeta.height || null,
  };
}

async function uploadWebP(path, buffer) {
  const token = crypto.randomUUID();

  const file = bucket.file(path);

  await file.save(buffer, {
    resumable: false,

    contentType: "image/webp",

    metadata: {
      cacheControl: CACHE_CONTROL,

      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  return makeDownloadURL(path, token);
}

function kb(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}

async function optimizeSpot(doc) {
  const spot = doc.data() || {};
  const spotId = doc.id;

  const currentPhotoURL = String(spot.photoURL || "").trim();

  if (!currentPhotoURL) {
    console.log(`⚪ ${spotId}: no photoURL, skipped`);

    return {
      status: "skipped",
    };
  }

  if (!FORCE && spot.thumbURL && spot.photoOptimized === true) {
    console.log(`⏭️ ${spotId}: already optimized`);

    return {
      status: "skipped",
    };
  }

  console.log("");
  console.log(`📸 ${spotId}`);
  console.log(`   ${spot.name || "Untitled spot"}`);

  if (DRY_RUN) {
    console.log("   🧪 dry-run: would optimize this photo");

    return {
      status: "dry-run",
    };
  }

  const sourceURL =
    String(spot.originalPhotoURL || "").trim() || currentPhotoURL;

  const originalBuffer = await downloadImage(sourceURL);

  console.log(`   Downloaded: ${kb(originalBuffer.length)}`);

  const optimized = await makeOptimizedImages(originalBuffer);

  const stamp = Date.now();

  const fullPath = `spot_photos_optimized/${spotId}/` + `${stamp}-full.webp`;

  const thumbPath = `spot_photos_optimized/${spotId}/` + `${stamp}-thumb.webp`;

  const [photoURL, thumbURL] = await Promise.all([
    uploadWebP(fullPath, optimized.fullBuffer),

    uploadWebP(thumbPath, optimized.thumbBuffer),
  ]);

  console.log(`   Full:  ${kb(optimized.fullBuffer.length)}`);

  console.log(`   Thumb: ${kb(optimized.thumbBuffer.length)}`);

  const updateData = {
    photoURL,
    thumbURL,

    photoWidth: optimized.fullWidth,

    photoHeight: optimized.fullHeight,

    thumbWidth: optimized.thumbWidth,

    thumbHeight: optimized.thumbHeight,

    photoOptimized: true,

    photoOptimizedAt: FieldValue.serverTimestamp(),

    photoStoragePath: fullPath,

    thumbStoragePath: thumbPath,
  };

  // Bewaar de originele URL zodat je altijd
  // kan terugrollen indien nodig.
  if (!spot.originalPhotoURL) {
    updateData.originalPhotoURL = currentPhotoURL;
  }

  await doc.ref.update(updateData);

  console.log("   ✅ Firestore updated");

  console.log("   ✅ Original photo kept");

  return {
    status: "optimized",
  };
}

async function main() {
  console.log("KOVA existing spot photo optimizer");

  console.log("----------------------------------");

  console.log(`Bucket: ${bucket.name}`);

  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  console.log(`Force: ${FORCE ? "YES" : "NO"}`);

  console.log("");

  const snapshot = await db.collection("spots").get();

  console.log(`Found ${snapshot.size} spot(s).`);

  let optimized = 0;
  let skipped = 0;
  let failed = 0;

  // Bewust één voor één.
  // Minder zwaar voor Firebase en RAM.
  for (const doc of snapshot.docs) {
    try {
      const result = await optimizeSpot(doc);

      if (result.status === "optimized") {
        optimized++;
      } else {
        skipped++;
      }
    } catch (error) {
      failed++;

      console.error("");

      console.error(`❌ ${doc.id}: ${error?.message || error}`);

      console.error("   Spot was NOT changed in Firestore.");
    }
  }

  console.log("");

  console.log("----------------------------------");

  console.log("Finished.");

  console.log(`✅ Optimized: ${optimized}`);

  console.log(`⏭️ Skipped:   ${skipped}`);

  console.log(`❌ Failed:    ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error?.message || error);

  process.exitCode = 1;
});
