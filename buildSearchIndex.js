const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const MAPTILER_KEY =
  process.env.MAPTILER_API_KEY || "7TBqy4hTdFfQeIq7oXKj";

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
    const clean = String(type || "").toLowerCase().trim();

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

  const features = Array.isArray(result?.features)
    ? result.features
    : [];

  for (const feature of features) {
    candidates.push(feature);

    const context =
      feature?.context ||
      feature?.properties?.context ||
      [];

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

function locationFromResult(result) {
  const candidates = collectCandidates(result);

  const city = findName(candidates, [
    "municipality",
    "joint_municipality",
    "place",
    "locality",
    "municipal_district",
  ]);

  const province = findName(candidates, [
    "county",
    "subregion",
    "region",
  ]);

  let country = findName(candidates, [
    "country",
  ]);

  if (!country) {
    const placeName = String(
      result?.features?.[0]?.place_name || "",
    );

    const parts = placeName
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length > 1) {
      country = parts[parts.length - 1];
    }
  }

  return {
    city,
    province,
    country,
  };
}

async function reverseGeocodeBatch(spots) {
  const queries = spots
    .map((spot) => `${spot.lng},${spot.lat}`)
    .join(";");

  const url =
    `https://api.maptiler.com/geocoding/${queries}.json` +
    `?key=${encodeURIComponent(MAPTILER_KEY)}` +
    `&language=nl` +
    `&types=country,region,subregion,county,joint_municipality,municipality,municipal_district,locality,place`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `MapTiler returned HTTP ${response.status}`,
    );
  }

  const data = await response.json();

  const results = Array.isArray(data)
    ? data
    : [data];

  return spots.map((spot, index) => ({
    ...spot,
    ...locationFromResult(
      results[index] || null,
    ),
  }));
}

async function main() {
  console.log(
    "Loading existing KOVA spots...",
  );

  const snap = await db
    .collection("spots")
    .get();

  const rawSpots = [];

  snap.forEach((doc) => {
    const data = doc.data() || {};

    const lat = Number(data.lat);
    const lng = Number(data.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      console.log(
        `Skipping ${doc.id}: invalid lat/lng`,
      );

      return;
    }

    rawSpots.push({
      id: doc.id,
      data,
      lat,
      lng,
    });
  });

  console.log(
    `${rawSpots.length} spots found.`,
  );

  const enriched = [];

  const batchSize = 50;

  for (
    let i = 0;
    i < rawSpots.length;
    i += batchSize
  ) {
    const batch = rawSpots.slice(
      i,
      i + batchSize,
    );

    console.log(
      `Reverse geocoding ${i + 1}-${Math.min(
        i + batch.length,
        rawSpots.length,
      )}...`,
    );

    const resolved =
      await reverseGeocodeBatch(batch);

    enriched.push(...resolved);
  }

  const regionMap = new Map();

  for (
    let start = 0;
    start < enriched.length;
    start += 450
  ) {
    const batch = db.batch();

    const chunk = enriched.slice(
      start,
      start + 450,
    );

    for (const spot of chunk) {
      if (
        !spot.country ||
        !spot.province
      ) {
        console.log(
          `Skipping Search metadata for ${spot.id}: country/province unresolved`,
        );

        continue;
      }

      const countryKey =
        normalizeKey(spot.country);

      const provinceKey =
        `${countryKey}__${normalizeKey(
          spot.province,
        )}`;

      const cityKey =
        normalizeKey(spot.city);

      const spotRef = db
        .collection("spots")
        .doc(spot.id);

      batch.set(
        spotRef,
        {
          country: spot.country,
          countryKey,

          province: spot.province,
          provinceKey,

          city: spot.city || "",
          cityKey,
        },
        {
          merge: true,
        },
      );

      const region =
        regionMap.get(provinceKey) || {
          country: spot.country,
          countryKey,

          province: spot.province,
          provinceKey,

          count: 0,
        };

      region.count += 1;

      regionMap.set(
        provinceKey,
        region,
      );
    }

    await batch.commit();
  }

  const regions = [
    ...regionMap.values(),
  ].sort((a, b) => {
    const countryCompare =
      a.country.localeCompare(
        b.country,
        "nl",
      );

    if (countryCompare !== 0) {
      return countryCompare;
    }

    return a.province.localeCompare(
      b.province,
      "nl",
    );
  });

  await db
    .collection("search_index")
    .doc("regions")
    .set({
      version: 1,

      regions,

      updatedAt:
        FieldValue.serverTimestamp(),
    });

  console.log("");
  console.log(
    "✅ Search index built",
  );

  console.log(
    `✅ ${regions.length} provinces/regions indexed`,
  );

  console.log(
    "✅ Existing spots now have country/province/city + provinceKey",
  );
}

main().catch((error) => {
  console.error(
    "❌ buildSearchIndex failed:",
  );

  console.error(error);

  process.exit(1);
});