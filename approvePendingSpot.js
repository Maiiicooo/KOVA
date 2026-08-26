const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const MAPTILER_KEY = process.env.MAPTILER_API_KEY || "7TBqy4hTdFfQeIq7oXKj";

const pendingId = process.argv[2];

if (!pendingId) {
  console.log("Gebruik: node approvePendingSpot.js <pendingSpotId>");
  process.exit(1);
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFeatureTypes(feature) {
  const types = new Set();

  const value =
    feature?.place_type ||
    feature?.properties?.place_type ||
    feature?.properties?.types ||
    [];

  (Array.isArray(value) ? value : [value]).forEach((type) => {
    const clean = String(type || "")
      .toLowerCase()
      .trim();

    if (clean) {
      types.add(clean);
    }
  });

  const idPrefix = String(feature?.id || "")
    .split(".")[0]
    .toLowerCase()
    .trim();

  if (idPrefix) {
    types.add(idPrefix);
  }

  return [...types];
}

function getFeatureText(feature) {
  const raw =
    feature?.text ||
    feature?.properties?.text ||
    feature?.properties?.name ||
    feature?.place_name ||
    "";

  return String(raw || "")
    .split(",")[0]
    .trim();
}

function collectCandidates(result) {
  const candidates = [];

  const features = Array.isArray(result?.features) ? result.features : [];

  for (const feature of features) {
    candidates.push(feature);

    const context = feature?.context || feature?.properties?.context || [];

    if (Array.isArray(context)) {
      context.forEach((item) => {
        candidates.push(item);
      });
    }
  }

  return candidates;
}

function findName(candidates, types) {
  for (const type of types) {
    const match = candidates.find((candidate) =>
      getFeatureTypes(candidate).includes(type),
    );

    const text = getFeatureText(match);

    if (text) {
      return text;
    }
  }

  return "";
}

async function reverseGeocode(lat, lng) {
  const url =
    `https://api.maptiler.com/geocoding/${lng},${lat}.json` +
    `?key=${encodeURIComponent(MAPTILER_KEY)}` +
    `&language=nl` +
    `&types=country,region,subregion,county,joint_municipality,municipality,municipal_district,locality,place`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MapTiler returned HTTP ${response.status}`);
  }

  const result = await response.json();
  const candidates = collectCandidates(result);

  const city = findName(candidates, [
    "municipality",
    "joint_municipality",
    "place",
    "locality",
    "municipal_district",
  ]);

  const province = findName(candidates, ["county", "subregion", "region"]);

  let country = findName(candidates, ["country"]);

  if (!country) {
    const placeName = String(result?.features?.[0]?.place_name || "");

    const parts = placeName
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length > 1) {
      country = parts[parts.length - 1];
    }
  }

  if (!country || !province) {
    throw new Error(
      "Country/province kon niet bepaald worden. Spot werd NIET goedgekeurd.",
    );
  }

  return {
    city,
    province,
    country,
  };
}

async function approve() {
  const pendingRef = db.collection("pending_spots").doc(pendingId);

  const pendingSnap = await pendingRef.get();

  if (!pendingSnap.exists) {
    console.log("❌ Pending spot bestaat niet");
    return;
  }

  const pendingData = pendingSnap.data() || {};

  const lat = Number(pendingData.lat);

  const lng = Number(pendingData.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Pending spot heeft geen geldige lat/lng.");
  }

  console.log("📍 Locatie bepalen...");

  const location = await reverseGeocode(lat, lng);

  const countryKey = normalizeKey(location.country);

  const provinceKey = `${countryKey}__${normalizeKey(location.province)}`;

  const cityKey = normalizeKey(location.city);

  const approvedData = {
    ...pendingData,

    country: location.country,

    countryKey,

    province: location.province,

    provinceKey,

    city: location.city || "",

    cityKey,
  };

  const spotRef = db.collection("spots").doc(pendingId);

  const indexRef = db.collection("search_index").doc("regions");

  await db.runTransaction(async (transaction) => {
    const livePending = await transaction.get(pendingRef);

    if (!livePending.exists) {
      throw new Error("Pending spot bestaat niet meer.");
    }

    const indexSnap = await transaction.get(indexRef);

    const indexData = indexSnap.exists ? indexSnap.data() || {} : {};

    const regions = Array.isArray(indexData.regions)
      ? [...indexData.regions]
      : [];

    const existingIndex = regions.findIndex(
      (region) => region?.provinceKey === provinceKey,
    );

    if (existingIndex >= 0) {
      regions[existingIndex] = {
        ...regions[existingIndex],

        country: location.country,

        countryKey,

        province: location.province,

        provinceKey,

        count: Number(regions[existingIndex].count || 0) + 1,
      };
    } else {
      regions.push({
        country: location.country,

        countryKey,

        province: location.province,

        provinceKey,

        count: 1,
      });
    }

    regions.sort((a, b) => {
      const countryCompare = String(a.country).localeCompare(
        String(b.country),
        "nl",
      );

      if (countryCompare !== 0) {
        return countryCompare;
      }

      return String(a.province).localeCompare(String(b.province), "nl");
    });

    transaction.set(spotRef, approvedData);

    transaction.delete(pendingRef);

    transaction.set(
      indexRef,
      {
        version: 1,

        regions,

        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      },
    );
  });

  console.log("");
  console.log("✅ Spot approved");

  console.log(
    `✅ ${location.country} · ${location.province} · ${location.city}`,
  );

  console.log("✅ Gekopieerd naar spots");

  console.log("✅ Verwijderd uit pending_spots");

  console.log("✅ Search index bijgewerkt");

  console.log("ID:", pendingId);
}

approve().catch((error) => {
  console.error("❌ Error:", error?.message || error);

  process.exitCode = 1;
});
