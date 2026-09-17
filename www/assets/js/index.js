
      document.addEventListener("DOMContentLoaded", () => {
        const startupOverlay = document.getElementById("kovaStartup");
        const startupProgress = document.querySelector(
          "[data-startup-progress]",
        );
        const startupStartedAt = performance.now();
        let startupFinished = false;

        function wait(ms) {
          return new Promise((resolve) => window.setTimeout(resolve, ms));
        }

        function setStartupProgress(value) {
          if (!startupProgress) return;
          const clean = Math.max(0.06, Math.min(1, Number(value) || 0));
          startupProgress.style.transform = `scaleX(${clean})`;
        }

        async function finishStartupSplash() {
          if (startupFinished) return;
          startupFinished = true;
          setStartupProgress(1);

          const elapsed = performance.now() - startupStartedAt;
          const remaining = Math.max(0, STARTUP_SPLASH_MIN_MS - elapsed);
          if (remaining) await wait(remaining);

          // Let the loading bar visibly reach 100% before fading away.
          await wait(110);
          startupOverlay?.classList.add("is-hiding");
          window.setTimeout(() => {
            if (startupOverlay) startupOverlay.hidden = true;
          }, 360);
        }

        setStartupProgress(0.1);

        const navRight = document.querySelector(".nav-right");
        const menuToggle = document.querySelector(".hamburger-toggle");
        const menuPanel = document.getElementById("kovaMenu");
        const navLeft = document.querySelector(".nav-left");
        const navLogo = document.querySelector(".nav-left img");
        const navTagline = document.querySelector(".kova-tagline-roll");
        const navTaglineCurrent = document.querySelector(
          ".kova-tagline-current",
        );
        const navTaglinePhrases = [
          "every spot is a treasure!",
          "find your next escape",
          "hidden gems. real moments.",
        ];
        let navTaglinePhraseIndex = 0;
        let navTaglinePauseTimer = null;

        function runNextNavTagline() {
          if (!navTaglineCurrent) return;
          navTaglineCurrent.textContent =
            navTaglinePhrases[navTaglinePhraseIndex];
          navTaglinePhraseIndex =
            (navTaglinePhraseIndex + 1) % navTaglinePhrases.length;

          navTaglineCurrent.classList.remove("is-running");
          void navTaglineCurrent.offsetWidth;
          navTaglineCurrent.classList.add("is-running");
        }

        if (navTaglineCurrent) {
          navTaglineCurrent.addEventListener("animationend", () => {
            navTaglineCurrent.classList.remove("is-running");
            navTaglinePauseTimer = window.setTimeout(runNextNavTagline, 3000);
          });

          runNextNavTagline();
        }

        function syncNavTaglineWidth() {
          if (!navLeft || !navLogo || !navTagline) return;
          const logoWidth = Math.round(navLogo.getBoundingClientRect().width);
          if (!logoWidth) return;
          navLeft.style.setProperty("--kova-logo-width", `${logoWidth}px`);
          navTagline.style.width = `${logoWidth}px`;
          navTagline.style.maxWidth = `${logoWidth}px`;
        }

        if (navLogo && navTagline) {
          if (navLogo.complete) syncNavTaglineWidth();
          else {
            navLogo.addEventListener("load", syncNavTaglineWidth, {
              once: true,
            });
          }

          window.addEventListener("resize", syncNavTaglineWidth);

          if (typeof ResizeObserver === "function") {
            const navLogoResizeObserver = new ResizeObserver(() => {
              syncNavTaglineWidth();
            });
            navLogoResizeObserver.observe(navLogo);
          }
        }

        function closeHamburgerMenu() {
          if (!navRight || !menuToggle || !menuPanel) return;
          navRight.classList.remove("open");
          menuToggle.setAttribute("aria-expanded", "false");
          menuPanel.setAttribute("aria-hidden", "true");
        }

        if (navRight && menuToggle && menuPanel) {
          menuToggle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isOpen = navRight.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuPanel.setAttribute("aria-hidden", String(!isOpen));
          });

          menuPanel.addEventListener("click", (e) => {
            if (e.target.closest("a")) closeHamburgerMenu();
          });

          document.addEventListener("click", (e) => {
            if (!navRight.contains(e.target)) closeHamburgerMenu();
          });

          document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeHamburgerMenu();
          });
        }

        const TUTORIAL_STORAGE_KEY = "kova_tutorial_seen_v1";
        const tutorialOverlay = document.getElementById("kovaTutorial");
        const tutorialTitle = document.getElementById("tutorialTitle");
        const tutorialText = document.getElementById("tutorialText");
        const tutorialIcon = document.querySelector("[data-tutorial-icon]");
        const tutorialDots = document.querySelector("[data-tutorial-dots]");
        const tutorialBackBtn = document.querySelector("[data-tutorial-back]");
        const tutorialNextBtn = document.querySelector("[data-tutorial-next]");
        const tutorialCloseBtn = document.querySelector(
          "[data-tutorial-close]",
        );
        const tutorialOpenBtns = document.querySelectorAll(
          "[data-action='open-tutorial']",
        );

        const tutorialSlides = [
          {
            icon: "K",
            title: "Welcome to KOVA.",
            text: "A clean map for real spots. Open the map, find nearby places and keep the good ones easy to reach.",
          },
          {
            icon: "X",
            title: "Find spots.",
            text: "Tap a <b>spot marker</b> to open the photo, description, rating and route button.",
          },
          {
            icon: "⌁",
            title: "Search the map.",
            text: "Desktop: click an empty point. Phone or tablet: <b>long press</b>. KOVA searches spots in a 10 km radius.",
          },
          {
            icon: "+",
            title: "Add from the menu.",
            text: "New spots are added through <b>add spot</b> in the hamburger menu. This keeps accidental map taps out of the flow.",
          },
        ];

        let tutorialIndex = 0;

        function hasSeenTutorial() {
          try {
            return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
          } catch (e) {
            return false;
          }
        }

        function rememberTutorialSeen() {
          try {
            localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
          } catch (e) {}
        }

        function renderTutorialSlide() {
          const slide = tutorialSlides[tutorialIndex];
          if (!slide || !tutorialOverlay) return;

          if (tutorialTitle) tutorialTitle.textContent = slide.title;
          if (tutorialText) tutorialText.innerHTML = slide.text;
          if (tutorialIcon) tutorialIcon.textContent = slide.icon;

          if (tutorialDots) {
            tutorialDots.innerHTML = tutorialSlides
              .map(
                (_, index) =>
                  `<span class="tutorial-dot ${index === tutorialIndex ? "active" : ""}"></span>`,
              )
              .join("");
          }

          if (tutorialBackBtn) tutorialBackBtn.disabled = tutorialIndex === 0;
          if (tutorialNextBtn) {
            tutorialNextBtn.textContent =
              tutorialIndex === tutorialSlides.length - 1 ? "Start" : "Next";
          }
        }

        function openTutorial() {
          if (!tutorialOverlay) return;
          closeHamburgerMenu();
          tutorialIndex = 0;
          renderTutorialSlide();
          tutorialOverlay.classList.add("open");
          tutorialOverlay.setAttribute("aria-hidden", "false");
        }

        function closeTutorial({ remember = true } = {}) {
          if (!tutorialOverlay) return;
          tutorialOverlay.classList.remove("open");
          tutorialOverlay.setAttribute("aria-hidden", "true");
          if (remember) rememberTutorialSeen();
        }

        tutorialOpenBtns.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            openTutorial();
          });
        });

        if (tutorialBackBtn) {
          tutorialBackBtn.addEventListener("click", () => {
            tutorialIndex = Math.max(0, tutorialIndex - 1);
            renderTutorialSlide();
          });
        }

        if (tutorialNextBtn) {
          tutorialNextBtn.addEventListener("click", () => {
            if (tutorialIndex >= tutorialSlides.length - 1) {
              closeTutorial({ remember: true });
              return;
            }

            tutorialIndex += 1;
            renderTutorialSlide();
          });
        }

        if (tutorialCloseBtn) {
          tutorialCloseBtn.addEventListener("click", () => {
            closeTutorial({ remember: true });
          });
        }

        if (tutorialOverlay) {
          tutorialOverlay.addEventListener("click", (e) => {
            if (e.target === tutorialOverlay) {
              closeTutorial({ remember: true });
            }
          });
        }

        document.addEventListener("keydown", (e) => {
          if (
            e.key === "Escape" &&
            tutorialOverlay &&
            tutorialOverlay.classList.contains("open")
          ) {
            closeTutorial({ remember: true });
          }
        });

        if (!hasSeenTutorial()) {
          window.setTimeout(() => openTutorial(), 450);
        }

        maptilersdk.config.apiKey = "7TBqy4hTdFfQeIq7oXKj";

        const DEFAULT_CENTER = [4.5, 50.85];
        const DEFAULT_ZOOM = 7.5;
        const USER_START_ZOOM = 11;

        const KOVA_MOBILE_LIKE = window.matchMedia(
          "(pointer: coarse), (max-width: 900px)",
        ).matches;

        const SEARCH_RADIUS_KM = 10;
        const STARTUP_PRELOAD_RADIUS_KM = 25;
        const STARTUP_THUMB_PREFETCH_LIMIT = KOVA_MOBILE_LIKE ? 8 : 16;
        const STARTUP_SPLASH_MIN_MS = 800;
        const STARTUP_GPS_GRACE_MS = 1200;
        const KOVA_LAST_LOCATION_KEY = "kova_last_location_v1";

        const DUPLICATE_BLOCK_RADIUS_M = 80;
        const LOCAL_RATINGS_KEY = "kova_spot_ratings_v1";
        const KOVA_SAVED_SPOTS_KEY = "kova_saved_spots_v1";
        const KOVA_ROUTE_SPOTS_KEY = "kova_route_spots_v1";
        const KOVA_ROUTE_MODE_KEY = "kova_route_mode_v1";
        const KOVA_ROUTE_MAX_SPOTS = 5;

        function readLastKovaLocation() {
          try {
            const raw = localStorage.getItem(KOVA_LAST_LOCATION_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            const lat = Number(parsed?.lat);
            const lng = Number(parsed?.lng);

            if (
              Number.isFinite(lat) &&
              Number.isFinite(lng) &&
              lat >= -90 &&
              lat <= 90 &&
              lng >= -180 &&
              lng <= 180
            ) {
              return { lat, lng };
            }
          } catch (e) {}

          return null;
        }

        function rememberLastKovaLocation(lat, lng) {
          try {
            localStorage.setItem(
              KOVA_LAST_LOCATION_KEY,
              JSON.stringify({ lat, lng, savedAt: Date.now() }),
            );
          } catch (e) {}
        }

        const startupStoredLocation = readLastKovaLocation();
        const startupMapCenter = startupStoredLocation
          ? [startupStoredLocation.lng, startupStoredLocation.lat]
          : DEFAULT_CENTER;
        const startupMapZoom = startupStoredLocation
          ? USER_START_ZOOM
          : DEFAULT_ZOOM;

        // Spot image performance -----------------------------------------
        // New spots should store a small WebP URL in `thumbURL` and the
        // normal image in `photoURL`. Older spots without thumbURL still work.
        const KOVA_IMAGE_PREFETCH_LIMIT = KOVA_MOBILE_LIKE ? 8 : 16;
        const kovaImagePreloadCache = new Map();

        function getSpotThumbnailURL(spot) {
          if (!spot) return "";
          return safeHttpsURL(
            spot.thumbURL ||
              spot.thumbnailURL ||
              spot.photoThumbURL ||
              spot.photoThumbnailURL ||
              "",
          );
        }

        function getSpotDisplayURL(spot) {
          return getSpotThumbnailURL(spot) || safeHttpsURL(spot?.photoURL);
        }

        function preloadKovaImage(url, priority = "low") {
          const cleanURL = safeHttpsURL(url);
          if (!cleanURL) return Promise.resolve(false);
          if (kovaImagePreloadCache.has(cleanURL)) {
            return kovaImagePreloadCache.get(cleanURL);
          }

          const promise = new Promise((resolve) => {
            const img = new Image();
            img.decoding = "async";
            try {
              img.fetchPriority = priority;
            } catch (e) {}
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = cleanURL;
          });

          kovaImagePreloadCache.set(cleanURL, promise);
          return promise;
        }

        function preloadStartupSpotImages(
          features,
          center,
          limit = STARTUP_THUMB_PREFETCH_LIMIT,
        ) {
          if (!Array.isArray(features) || !features.length) {
            return Promise.resolve([]);
          }

          const connection =
            navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection ||
            null;

          if (connection?.saveData) return Promise.resolve([]);
          if (/2g/i.test(String(connection?.effectiveType || ""))) {
            return Promise.resolve([]);
          }

          const ranked = features
            .map((feature) => {
              const props = feature?.properties || {};
              const coords = feature?.geometry?.coordinates || [];
              const lng = Number(coords[0] ?? props.lng);
              const lat = Number(coords[1] ?? props.lat);
              let distance = Number.POSITIVE_INFINITY;

              if (
                center &&
                Number.isFinite(center.lat) &&
                Number.isFinite(center.lng) &&
                Number.isFinite(lat) &&
                Number.isFinite(lng)
              ) {
                distance = haversineMeters(center.lat, center.lng, lat, lng);
              }

              return { props, distance };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limit);

          return Promise.allSettled(
            ranked.map(({ props }) =>
              preloadKovaImage(
                getSpotThumbnailURL(props) || safeHttpsURL(props.photoURL),
                "low",
              ),
            ),
          );
        }

        let kovaPrefetchTimer = null;
        let kovaPrefetchIdleHandle = null;

        function cancelScheduledSpotImagePrefetch() {
          if (kovaPrefetchTimer) {
            clearTimeout(kovaPrefetchTimer);
            kovaPrefetchTimer = null;
          }

          if (
            kovaPrefetchIdleHandle !== null &&
            typeof window.cancelIdleCallback === "function"
          ) {
            window.cancelIdleCallback(kovaPrefetchIdleHandle);
          }
          kovaPrefetchIdleHandle = null;
        }

        function scheduleSpotImagePrefetch(features = currentBaseSpotFeatures) {
          if (!Array.isArray(features) || !features.length) return;

          const connection =
            navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection ||
            null;

          if (connection?.saveData) return;
          if (/2g/i.test(String(connection?.effectiveType || ""))) return;

          cancelScheduledSpotImagePrefetch();

          const run = () => {
            kovaPrefetchTimer = null;
            kovaPrefetchIdleHandle = null;

            // Never decode/prefetch images while the user is actively moving
            // the map. moveend will schedule us again once the camera settles.
            if (typeof map?.isMoving === "function" && map.isMoving()) return;

            let center = null;
            try {
              center = map.getCenter();
            } catch (e) {}

            const ranked = features
              .map((feature) => {
                const props = feature?.properties || {};
                const coords = feature?.geometry?.coordinates || [];
                const lng = Number(coords[0] ?? props.lng);
                const lat = Number(coords[1] ?? props.lat);
                let distance = Number.POSITIVE_INFINITY;

                if (center && Number.isFinite(lat) && Number.isFinite(lng)) {
                  distance = haversineMeters(
                    Number(center.lat),
                    Number(center.lng),
                    lat,
                    lng,
                  );
                }

                return { props, distance };
              })
              .sort((a, b) => a.distance - b.distance)
              .slice(0, KOVA_IMAGE_PREFETCH_LIMIT);

            ranked.forEach(({ props }) => {
              const thumbURL = getSpotThumbnailURL(props);
              const photoURL = safeHttpsURL(props.photoURL);
              preloadKovaImage(thumbURL || photoURL, "low");
            });
          };

          // On modern browsers, use idle time so image decoding cannot steal
          // frames from a gesture/camera animation. Fallback remains quick.
          kovaPrefetchTimer = window.setTimeout(
            () => {
              kovaPrefetchTimer = null;
              if (typeof window.requestIdleCallback === "function") {
                kovaPrefetchIdleHandle = window.requestIdleCallback(run, {
                  timeout: 550,
                });
              } else {
                run();
              }
            },
            KOVA_MOBILE_LIKE ? 180 : 90,
          );
        }

        // MANUAL KOVA PICKS:
        // Add as many Firestore spot document IDs as you want.
        // Order here = order in the horizontal KOVA picks carousel.
        //
        // Example:
        // const KOVAS_PICK_IDS = [
        //   "aBc123...",
        //   "xYz456...",
        //   "kOvA789..."
        // ];
        const KOVAS_PICK_IDS = [
          "Rargk5xZMwNo2hNdNwEz",
          "9c8SGXtFux9ne8fY2qnP",
          "dZOTzVtR0BxhDjk2IYDz",
          "8fF5SCMJImqJaWu6lEGc",
          "29fp2fidsHLpMwGtHY25",
        ];

        // Cap very high-density phone screens at 2x. A DPR 3 phone otherwise
        // asks WebGL to shade more than twice as many pixels as DPR 2.
        const KOVA_MAP_PIXEL_RATIO = Math.min(
          Number(window.devicePixelRatio) || 1,
          2,
        );

        const map = new maptilersdk.Map({
          container: "map",
          style:
            "https://api.maptiler.com/maps/dataviz-dark/style.json?key=7TBqy4hTdFfQeIq7oXKj",
          center: startupMapCenter,
          zoom: startupMapZoom,
          minZoom: 5,
          navigationControl: false,
          projectionControl: false,
          geolocateControl: false,
          doubleClickZoom: false,

          // KOVA is a flat discovery map: disable unused 3D/rotation work and
          // keep rendering focused on pan + pinch zoom.
          dragRotate: false,
          touchPitch: false,
          pitchWithRotate: false,
          maxPitch: 0,
          renderWorldCopies: false,

          // Shorter symbol collision fades feel more immediate and do less
          // compositing after a camera movement.
          fadeDuration: 140,
          pixelRatio: KOVA_MAP_PIXEL_RATIO,
          validateStyle: false,
        });

        if (map.doubleClickZoom) map.doubleClickZoom.disable();

        map.on("dblclick", (e) => {
          e.preventDefault();
        });

        const firebaseConfig = {
          apiKey: "AIzaSyARxFI9HyJxrINfzDazhxFHKSrGLX8KoBk",
          authDomain: "kova-6052a.firebaseapp.com",
          projectId: "kova-6052a",
          storageBucket: "kova-6052a.firebasestorage.app",
          messagingSenderId: "873689812978",
          appId: "1:873689812978:web:e0581f3df823e51239656b",
          measurementId: "G-VM5224Z3K6",
        };

        firebase.initializeApp(firebaseConfig);

        const appCheck = firebase.appCheck();
        appCheck.activate(
          new firebase.appCheck.ReCaptchaEnterpriseProvider(
            "6LeDWTQtAAAAAHAS41PtaHPe3ZcoQyDW4nGRiCVD",
          ),
          true,
        );

        const db = firebase.firestore();

        const footerEl = document.getElementById("kovaFooter");

        let activePopup = null;
        let activeCoordPopup = null;
        let clickPin = null;
        let userMarker = null;
        let userPopup = null;
        let userMarkerEl = null;
        let userLat = null;
        let userLng = null;
        let userLocationRequestPromise = null;
        let mapLoaded = false;
        let initialNearbyLoaded = false;
        let startupRegionLoaded = false;
        let userMarkerAdded = false;
        let currentBaseSpotFeatures = [];

        const feedOverlay = document.getElementById("kovaFeed");
        const feedOpenBtns = document.querySelectorAll(
          "[data-action='open-feed']",
        );
        const feedCloseBtn = document.querySelector("[data-feed-close]");
        const feedPickSection = document.querySelector(
          "[data-feed-pick-section]",
        );
        const feedPickEl = document.querySelector("[data-feed-pick]");
        const feedAllTimeEl = document.querySelector("[data-feed-alltime]");
        let feedLoaded = false;

        const libraryOverlay = document.getElementById("kovaLibrary");
        const libraryCloseBtn = document.querySelector("[data-library-close]");
        const savedOpenBtns = document.querySelectorAll(
          "[data-action='open-saved']",
        );
        const routeOpenBtns = document.querySelectorAll(
          "[data-action='open-route']",
        );
        const savedListEl = document.querySelector("[data-saved-list]");
        const routeListEl = document.querySelector("[data-route-list]");
        const savedCountEl = document.querySelector("[data-saved-count]");
        const routeCountEl = document.querySelector("[data-route-count]");
        const routeMenuCountEl = document.querySelector(
          "[data-route-menu-count]",
        );
        const routeModeBtns = document.querySelectorAll("[data-route-mode]");
        const routeOpenAppleBtn = document.querySelector(
          "[data-route-open-apple]",
        );
        const routeOpenGoogleBtn = document.querySelector(
          "[data-route-open-google]",
        );

        function readJSONStorage(key, fallback) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            return parsed ?? fallback;
          } catch (e) {
            return fallback;
          }
        }

        function writeJSONStorage(key, value) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (e) {}
        }

        function normalizePersonalSpot(spot) {
          if (!spot || !spot.id) return null;
          const lat = Number(spot.lat);
          const lng = Number(spot.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return {
            id: String(spot.id),
            name: String(spot.name || "Untitled spot"),
            description: String(spot.description || ""),
            addedBy: String(spot.addedBy || spot.added_by || spot.author || ""),
            photoURL: safeHttpsURL(spot.photoURL),
            thumbURL: getSpotThumbnailURL(spot),
            lat,
            lng,
            avgRating: Number(spot.avgRating || 0),
            ratingCount: Number(spot.ratingCount || 0),
            type: normalizeSpotType(spot.type),
          };
        }

        function getSavedSpots() {
          const stored = readJSONStorage(KOVA_SAVED_SPOTS_KEY, {});
          return stored && typeof stored === "object" && !Array.isArray(stored)
            ? stored
            : {};
        }

        function setSavedSpots(spots) {
          writeJSONStorage(KOVA_SAVED_SPOTS_KEY, spots);
        }

        function getRouteSpots() {
          const stored = readJSONStorage(KOVA_ROUTE_SPOTS_KEY, []);
          if (!Array.isArray(stored)) return [];
          return stored
            .map(normalizePersonalSpot)
            .filter(Boolean)
            .slice(0, KOVA_ROUTE_MAX_SPOTS);
        }

        function setRouteSpots(spots) {
          writeJSONStorage(
            KOVA_ROUTE_SPOTS_KEY,
            spots
              .map(normalizePersonalSpot)
              .filter(Boolean)
              .slice(0, KOVA_ROUTE_MAX_SPOTS),
          );
        }

        function getRouteMode() {
          try {
            const stored = localStorage.getItem(KOVA_ROUTE_MODE_KEY);
            return ["cycling", "driving", "walking"].includes(stored)
              ? stored
              : "cycling";
          } catch (e) {
            return "cycling";
          }
        }

        function setRouteMode(mode) {
          if (!["cycling", "driving", "walking"].includes(mode)) return;
          try {
            localStorage.setItem(KOVA_ROUTE_MODE_KEY, mode);
          } catch (e) {}
          updateRouteModeUI();
        }

        function isSpotSaved(spotId) {
          return Boolean(getSavedSpots()[String(spotId)]);
        }
        function isSpotInRoute(spotId) {
          return getRouteSpots().some(
            (spot) => String(spot.id) === String(spotId),
          );
        }

        function personalSpotToMapFeature(spot) {
          const clean = normalizePersonalSpot(spot);
          if (!clean) return null;
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: [clean.lng, clean.lat] },
            properties: {
              id: clean.id,
              name: clean.name,
              description: clean.description,
              addedBy: clean.addedBy,
              photoURL: clean.photoURL,
              thumbURL: clean.thumbURL,
              lat: clean.lat,
              lng: clean.lng,
              avgRating: clean.avgRating,
              ratingCount: clean.ratingCount,
              type: clean.type,
              saved: true,
            },
          };
        }

        function getSpotFromPopupCard(card) {
          if (!card) return null;
          return normalizePersonalSpot({
            id: card.getAttribute("data-spot-id"),
            name: card.getAttribute("data-spot-name") || "",
            description: card.getAttribute("data-spot-description") || "",
            addedBy: card.getAttribute("data-spot-added-by") || "",
            photoURL: card.getAttribute("data-spot-photo") || "",
            thumbURL: card.getAttribute("data-spot-thumb") || "",
            lat: card.getAttribute("data-spot-lat"),
            lng: card.getAttribute("data-spot-lng"),
            avgRating: card.getAttribute("data-spot-rating"),
            ratingCount: card.getAttribute("data-spot-rating-count"),
            type: card.getAttribute("data-spot-type"),
          });
        }

        function saveSpotLocally(spot) {
          const clean = normalizePersonalSpot(spot);
          if (!clean) return false;
          const saved = getSavedSpots();
          saved[clean.id] = clean;
          setSavedSpots(saved);
          renderPersonalLibrary();
          refreshCurrentMapWithSavedSpots();
          return true;
        }

        function removeSavedSpot(spotId) {
          const saved = getSavedSpots();
          delete saved[String(spotId)];
          setSavedSpots(saved);
          renderPersonalLibrary();
          refreshCurrentMapWithSavedSpots();
        }

        function addSpotToRoute(spot) {
          const clean = normalizePersonalSpot(spot);
          if (!clean) return { ok: false, reason: "invalid" };
          const route = getRouteSpots();
          if (route.some((item) => item.id === clean.id))
            return { ok: true, already: true };
          if (route.length >= KOVA_ROUTE_MAX_SPOTS)
            return { ok: false, reason: "full" };
          route.push(clean);
          setRouteSpots(route);
          renderPersonalLibrary();
          return { ok: true, already: false };
        }

        function removeSpotFromRoute(spotId) {
          setRouteSpots(
            getRouteSpots().filter(
              (spot) => String(spot.id) !== String(spotId),
            ),
          );
          renderPersonalLibrary();
        }

        function moveRouteSpot(index, direction) {
          const route = getRouteSpots();
          const target = index + direction;
          if (
            index < 0 ||
            target < 0 ||
            index >= route.length ||
            target >= route.length
          )
            return;
          [route[index], route[target]] = [route[target], route[index]];
          setRouteSpots(route);
          renderPersonalLibrary();
        }

        function clearRouteSpots() {
          setRouteSpots([]);
          renderPersonalLibrary();
        }

        function updateRouteModeUI() {
          const mode = getRouteMode();
          routeModeBtns.forEach((btn) =>
            btn.classList.toggle(
              "active",
              btn.getAttribute("data-route-mode") === mode,
            ),
          );
        }

        function renderSavedSpotItem(spot) {
          const photo = getSpotDisplayURL(spot);
          return `
            <div class="kova-personal-item">
              ${photo ? `<img class="kova-personal-thumb" src="${escapeHTML(photo)}" alt="" loading="lazy" decoding="async">` : `<span class="kova-personal-thumb"></span>`}
              <div class="kova-personal-copy" role="button" tabindex="0" data-personal-open-spot="${escapeHTML(spot.id)}">
                <div class="kova-personal-name">${escapeHTML(spot.name)}</div>
                <div class="kova-personal-meta">Saved on this device</div>
              </div>
              <div class="kova-personal-actions">
                <button class="kova-mini-btn" type="button" data-saved-add-route="${escapeHTML(spot.id)}">＋ route</button>
                <button class="kova-mini-btn" type="button" data-saved-remove="${escapeHTML(spot.id)}">×</button>
              </div>
            </div>`;
        }

        function renderRouteSpotItem(spot, index, total) {
          const photo = getSpotDisplayURL(spot);
          const meta =
            index === 0
              ? "Route start"
              : index === total - 1
                ? "Route finish"
                : `Stop ${index + 1}`;
          return `
            <div class="kova-personal-item kova-route-item">
              <div class="kova-route-number">${index + 1}</div>
              ${photo ? `<img class="kova-personal-thumb" src="${escapeHTML(photo)}" alt="" loading="lazy" decoding="async">` : `<span class="kova-personal-thumb"></span>`}
              <div class="kova-personal-copy" role="button" tabindex="0" data-personal-open-spot="${escapeHTML(spot.id)}">
                <div class="kova-personal-name">${escapeHTML(spot.name)}</div>
                <div class="kova-personal-meta">${meta}</div>
              </div>
              <div class="kova-personal-actions">
                <button class="kova-mini-btn" type="button" data-route-move-up="${index}" ${index === 0 ? "disabled" : ""}>↑</button>
                <button class="kova-mini-btn" type="button" data-route-move-down="${index}" ${index === total - 1 ? "disabled" : ""}>↓</button>
                <button class="kova-mini-btn" type="button" data-route-remove="${escapeHTML(spot.id)}">×</button>
              </div>
            </div>`;
        }

        function renderPersonalLibrary() {
          const saved = Object.values(getSavedSpots())
            .map(normalizePersonalSpot)
            .filter(Boolean);
          const route = getRouteSpots();
          if (savedCountEl) savedCountEl.textContent = `${saved.length} saved`;
          if (routeCountEl)
            routeCountEl.textContent = `${route.length} / ${KOVA_ROUTE_MAX_SPOTS} spots`;
          if (routeMenuCountEl)
            routeMenuCountEl.textContent = route.length
              ? `(${route.length})`
              : "";

          if (savedListEl) {
            savedListEl.innerHTML = saved.length
              ? saved.map(renderSavedSpotItem).join("")
              : `<div class="kova-library-empty">No saved spots yet. Open any KOVA spot and tap <b>Save</b>.</div>`;
          }

          if (routeListEl) {
            routeListEl.innerHTML = route.length
              ? route
                  .map((spot, index) =>
                    renderRouteSpotItem(spot, index, route.length),
                  )
                  .join("") +
                `<button class="kova-mini-btn" style="margin-top:4px;width:max-content;" type="button" data-route-clear>Clear route</button>`
              : `<div class="kova-library-empty">Add 2 to 5 spots with <b>Add to route</b>. The order shown here is the route order.</div>`;
          }

          const routeReady = route.length >= 2;
          if (routeOpenAppleBtn) routeOpenAppleBtn.disabled = !routeReady;
          if (routeOpenGoogleBtn) routeOpenGoogleBtn.disabled = !routeReady;
          updateRouteModeUI();
          syncOpenPopupPersonalButtons();
        }

        function closeLibrary() {
          if (!libraryOverlay) return;
          libraryOverlay.classList.remove("open");
          libraryOverlay.setAttribute("aria-hidden", "true");
        }

        function openLibrary(section = "saved") {
          if (!libraryOverlay) return;
          closeHamburgerMenu();
          closeFeed();
          closeLocationSearch();
          renderPersonalLibrary();
          libraryOverlay.classList.add("open");
          libraryOverlay.setAttribute("aria-hidden", "false");
          requestAnimationFrame(() => {
            const target =
              section === "route"
                ? libraryOverlay.querySelector("[data-library-route-section]")
                : libraryOverlay.querySelector("[data-library-saved-section]");
            target?.scrollIntoView({ block: "start", behavior: "smooth" });
          });
        }

        function syncOpenPopupPersonalButtons() {
          document
            .querySelectorAll(".kova-popup[data-spot-id]")
            .forEach((card) => {
              const spotId = card.getAttribute("data-spot-id");
              if (!spotId) return;
              const saveBtn = card.querySelector("[data-action='save-spot']");
              const routeBtn = card.querySelector(
                "[data-action='toggle-route-spot']",
              );
              const saved = isSpotSaved(spotId);
              const inRoute = isSpotInRoute(spotId);
              if (saveBtn) {
                saveBtn.classList.toggle("is-active", saved);
                saveBtn.setAttribute("aria-pressed", String(saved));
              }
              if (routeBtn) {
                routeBtn.classList.toggle("is-active", inRoute);
                routeBtn.setAttribute("aria-pressed", String(inRoute));
              }
            });
        }

        function getGoogleMultiStopUrl(route) {
          if (!Array.isArray(route) || route.length < 2) return "";
          const mode = getRouteMode();
          const first = route[0];
          const last = route[route.length - 1];
          const middle = route.slice(1, -1);
          const params = new URLSearchParams({
            api: "1",
            origin: `${first.lat},${first.lng}`,
            destination: `${last.lat},${last.lng}`,
            travelmode: mode === "cycling" ? "bicycling" : mode,
          });
          if (middle.length)
            params.set(
              "waypoints",
              middle.map((spot) => `${spot.lat},${spot.lng}`).join("|"),
            );
          return `https://www.google.com/maps/dir/?${params.toString()}`;
        }

        function getAppleMultiStopUrl(route) {
          if (!Array.isArray(route) || route.length < 2) return "";
          const mode = getRouteMode();
          const first = route[0];
          const last = route[route.length - 1];
          const middle = route.slice(1, -1);
          const params = new URLSearchParams();
          params.set("source", `${first.lat},${first.lng}`);
          params.set("destination", `${last.lat},${last.lng}`);
          params.set("mode", mode);
          middle.forEach((spot) =>
            params.append("waypoint", `${spot.lat},${spot.lng}`),
          );
          return `https://maps.apple.com/directions?${params.toString()}`;
        }

        function openMultiStopRoute(provider) {
          const route = getRouteSpots();
          if (route.length < 2) return;
          const url =
            provider === "apple"
              ? getAppleMultiStopUrl(route)
              : getGoogleMultiStopUrl(route);
          if (url) window.KovaDevice.openExternal(url).catch(console.warn);
        }

        function refreshCurrentMapWithSavedSpots() {
          if (!mapLoaded || !map.getSource("spots")) return;
          setSpotsGeoJSON(currentBaseSpotFeatures, { preserveBase: true });
        }

        savedOpenBtns.forEach((btn) =>
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            openLibrary("saved");
          }),
        );
        routeOpenBtns.forEach((btn) =>
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            openLibrary("route");
          }),
        );
        libraryCloseBtn?.addEventListener("click", closeLibrary);
        libraryOverlay?.addEventListener("click", (e) => {
          if (e.target === libraryOverlay) closeLibrary();
        });
        routeModeBtns.forEach((btn) =>
          btn.addEventListener("click", () =>
            setRouteMode(btn.getAttribute("data-route-mode")),
          ),
        );
        routeOpenAppleBtn?.addEventListener("click", () =>
          openMultiStopRoute("apple"),
        );
        routeOpenGoogleBtn?.addEventListener("click", () =>
          openMultiStopRoute("google"),
        );

        libraryOverlay?.addEventListener("click", async (e) => {
          const savedRemove = e.target.closest("[data-saved-remove]");
          if (savedRemove) {
            removeSavedSpot(savedRemove.getAttribute("data-saved-remove"));
            return;
          }
          const savedAddRoute = e.target.closest("[data-saved-add-route]");
          if (savedAddRoute) {
            const spotId = savedAddRoute.getAttribute("data-saved-add-route");
            const result = addSpotToRoute(getSavedSpots()[spotId]);
            if (!result.ok && result.reason === "full")
              window.alert(
                `Your KOVA route already has ${KOVA_ROUTE_MAX_SPOTS} spots.`,
              );
            return;
          }
          const routeRemove = e.target.closest("[data-route-remove]");
          if (routeRemove) {
            removeSpotFromRoute(routeRemove.getAttribute("data-route-remove"));
            return;
          }
          const moveUp = e.target.closest("[data-route-move-up]");
          if (moveUp) {
            moveRouteSpot(
              Number(moveUp.getAttribute("data-route-move-up")),
              -1,
            );
            return;
          }
          const moveDown = e.target.closest("[data-route-move-down]");
          if (moveDown) {
            moveRouteSpot(
              Number(moveDown.getAttribute("data-route-move-down")),
              1,
            );
            return;
          }
          const clearBtn = e.target.closest("[data-route-clear]");
          if (clearBtn) {
            clearRouteSpots();
            return;
          }
          const openSpot = e.target.closest("[data-personal-open-spot]");
          if (openSpot) {
            const spotId = openSpot.getAttribute("data-personal-open-spot");
            closeLibrary();
            await openSpotFromFeed(spotId);
          }
        });

        libraryOverlay?.addEventListener("keydown", async (e) => {
          if (
            (e.key === "Enter" || e.key === " ") &&
            e.target?.matches?.("[data-personal-open-spot]")
          ) {
            e.preventDefault();
            const spotId = e.target.getAttribute("data-personal-open-spot");
            closeLibrary();
            await openSpotFromFeed(spotId);
          }
        });

        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && libraryOverlay?.classList.contains("open"))
            closeLibrary();
        });

        renderPersonalLibrary();

        // Province-first Search -------------------------------------------
        // IMPORTANT:
        // Search does NOT read the full `spots` collection.
        // 1 read gets the small province index.
        // Spot reads only happen after exactly one province/region is chosen.
        const searchOverlay = document.getElementById("kovaSearch");
        const searchOpenBtns = document.querySelectorAll(
          "[data-action='open-search']",
        );
        const searchCloseBtn = document.querySelector("[data-search-close]");
        const searchClearBtn = document.querySelector("[data-search-clear]");
        const searchSubmitBtn = document.querySelector("[data-search-submit]");
        const countryOptionsEl = document.querySelector(
          "[data-country-options]",
        );
        const provinceOptionsEl = document.querySelector(
          "[data-province-options]",
        );
        const cityOptionsEl = document.querySelector("[data-city-options]");
        const spotTypeOptionsEl = document.querySelector("[data-type-options]");
        const spotTypeCountEl = document.querySelector("[data-type-count]");
        const searchStatusEl = document.querySelector("[data-search-status]");
        const searchResultCountEl = document.querySelector(
          "[data-search-result-count]",
        );
        const countryCountEl = document.querySelector("[data-country-count]");
        const provinceCountEl = document.querySelector("[data-province-count]");
        const cityCountEl = document.querySelector("[data-city-count]");

        let searchRegionIndex = [];
        let searchRegionIndexLoaded = false;
        let searchRegionIndexPromise = null;

        let selectedCountryKey = "";
        let selectedProvinceKey = "";
        let selectedProvinceName = "";
        let provinceSpots = [];
        let provinceSpotsLoaded = false;
        let provinceSpotsPromise = null;
        let selectedLocationCities = new Set();
        let selectedSpotTypes = new Set();

        function normalizeSearchText(value) {
          return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
        }

        function makeSearchOption(kind, value, key, count, checked = false) {
          const safeId =
            `${kind}-${normalizeSearchText(key || value)}`
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "") +
            "-" +
            Math.random().toString(36).slice(2, 7);

          return `
            <div class="kova-filter-option">
              <input
                id="${escapeHTML(safeId)}"
                type="checkbox"
                value="${escapeHTML(key || value)}"
                data-filter-kind="${escapeHTML(kind)}"
                data-filter-label="${escapeHTML(value)}"
                ${checked ? "checked" : ""}
              >
              <label for="${escapeHTML(safeId)}">
                ${escapeHTML(value)}
                ${Number.isFinite(Number(count)) ? `<span style="opacity:.42">${Number(count)}</span>` : ""}
              </label>
            </div>
          `;
        }

        function uniqueSorted(values) {
          return [...new Set(values.filter(Boolean))].sort((a, b) =>
            String(a).localeCompare(String(b), "nl", { sensitivity: "base" }),
          );
        }

        function updateSearchTypeUI() {
          if (spotTypeCountEl) {
            spotTypeCountEl.textContent = selectedSpotTypes.size
              ? `${selectedSpotTypes.size} selected`
              : "all types";
          }

          spotTypeOptionsEl
            ?.querySelectorAll("input[data-filter-kind='type']")
            .forEach((input) => {
              input.checked = selectedSpotTypes.has(input.value);
            });
        }

        async function loadSearchRegionIndex() {
          if (searchRegionIndexLoaded) return searchRegionIndex;
          if (searchRegionIndexPromise) return searchRegionIndexPromise;

          searchRegionIndexPromise = (async () => {
            if (searchStatusEl) {
              searchStatusEl.classList.remove("error");
              searchStatusEl.textContent = "Loading available regions…";
            }

            try {
              // One document read, regardless of how many KOVA spots exist.
              const snap = await db
                .collection("search_index")
                .doc("regions")
                .get();

              if (!snap.exists) {
                throw new Error(
                  "Search index missing. Run node scripts/buildSearchIndex.js once.",
                );
              }

              const data = snap.data() || {};
              searchRegionIndex = Array.isArray(data.regions)
                ? data.regions
                    .filter(
                      (region) =>
                        region &&
                        region.country &&
                        region.countryKey &&
                        region.province &&
                        region.provinceKey &&
                        Number(region.count || 0) > 0,
                    )
                    .map((region) => ({
                      country: String(region.country),
                      countryKey: String(region.countryKey),
                      province: String(region.province),
                      provinceKey: String(region.provinceKey),
                      count: Number(region.count || 0),
                    }))
                : [];

              searchRegionIndexLoaded = true;
              renderSearchCountries();

              if (searchStatusEl) {
                searchStatusEl.textContent = searchRegionIndex.length
                  ? "Choose a country, then one province or region."
                  : "No searchable provinces with spots yet.";
              }

              return searchRegionIndex;
            } catch (err) {
              console.error("KOVA Search index error:", err);

              if (searchStatusEl) {
                searchStatusEl.classList.add("error");
                searchStatusEl.textContent =
                  err?.message || "Could not load Search.";
              }

              if (countryOptionsEl) {
                countryOptionsEl.innerHTML =
                  '<div class="kova-filter-empty">Search index unavailable.</div>';
              }

              if (provinceOptionsEl) {
                provinceOptionsEl.innerHTML =
                  '<div class="kova-filter-empty">No provinces available.</div>';
              }

              if (cityOptionsEl) {
                cityOptionsEl.innerHTML =
                  '<div class="kova-filter-empty">Choose a province first.</div>';
              }

              throw err;
            } finally {
              searchRegionIndexPromise = null;
            }
          })();

          return searchRegionIndexPromise;
        }

        function renderSearchCountries() {
          if (!countryOptionsEl) return;

          const countriesByKey = new Map();

          searchRegionIndex.forEach((region) => {
            const current = countriesByKey.get(region.countryKey) || {
              country: region.country,
              countryKey: region.countryKey,
              count: 0,
            };

            current.count += Number(region.count || 0);
            countriesByKey.set(region.countryKey, current);
          });

          const countries = [...countriesByKey.values()].sort((a, b) =>
            a.country.localeCompare(b.country, "nl", { sensitivity: "base" }),
          );

          if (countryCountEl) {
            countryCountEl.textContent = countries.length
              ? `${countries.length} available`
              : "";
          }

          countryOptionsEl.innerHTML = countries.length
            ? countries
                .map((item) =>
                  makeSearchOption(
                    "country",
                    item.country,
                    item.countryKey,
                    item.count,
                    item.countryKey === selectedCountryKey,
                  ),
                )
                .join("")
            : '<div class="kova-filter-empty">No countries with spots found.</div>';

          renderSearchProvinces();
        }

        function renderSearchProvinces() {
          if (!provinceOptionsEl) return;

          if (!selectedCountryKey) {
            if (provinceCountEl) provinceCountEl.textContent = "";
            provinceOptionsEl.innerHTML =
              '<div class="kova-filter-empty">Choose a country first.</div>';
            resetLoadedProvince();
            renderSearchCities();
            updateSearchResultCount();
            return;
          }

          const provinces = searchRegionIndex
            .filter((region) => region.countryKey === selectedCountryKey)
            .sort((a, b) =>
              a.province.localeCompare(b.province, "nl", {
                sensitivity: "base",
              }),
            );

          if (provinceCountEl) {
            provinceCountEl.textContent = provinces.length
              ? `${provinces.length} available`
              : "";
          }

          provinceOptionsEl.innerHTML = provinces.length
            ? provinces
                .map((region) =>
                  makeSearchOption(
                    "province",
                    region.province,
                    region.provinceKey,
                    region.count,
                    region.provinceKey === selectedProvinceKey,
                  ),
                )
                .join("")
            : '<div class="kova-filter-empty">No provinces with spots found.</div>';
        }

        function resetLoadedProvince() {
          provinceSpots = [];
          provinceSpotsLoaded = false;
          provinceSpotsPromise = null;
          selectedLocationCities.clear();
        }

        async function loadSelectedProvinceSpots() {
          if (!selectedProvinceKey) {
            resetLoadedProvince();
            renderSearchCities();
            updateSearchResultCount();
            return [];
          }

          if (provinceSpotsPromise) return provinceSpotsPromise;

          provinceSpotsLoaded = false;
          provinceSpots = [];
          selectedLocationCities.clear();

          if (searchSubmitBtn) searchSubmitBtn.disabled = true;

          if (cityOptionsEl) {
            cityOptionsEl.innerHTML =
              '<div class="kova-filter-empty">Loading cities in this province…</div>';
          }

          if (searchStatusEl) {
            searchStatusEl.classList.remove("error");
            searchStatusEl.textContent = `Loading spots in ${selectedProvinceName || "this province"}…`;
          }

          provinceSpotsPromise = (async () => {
            try {
              // This is the only spot query used by menu Search.
              // It can never load a whole country or the whole world.
              const snap = await db
                .collection("spots")
                .where("provinceKey", "==", selectedProvinceKey)
                .get();

              provinceSpots = [];

              snap.forEach((doc) => {
                const data = doc.data() || {};
                const lat = Number(data.lat);
                const lng = Number(data.lng);

                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

                provinceSpots.push({
                  id: doc.id,
                  ...data,
                  lat,
                  lng,
                  avgRating: Number(data.avgRating || 0),
                  ratingCount: Number(data.ratingCount || 0),
                  city: String(
                    data.city ||
                      data.municipality ||
                      data.town ||
                      data.place ||
                      "",
                  ).trim(),
                });
              });

              provinceSpotsLoaded = true;
              renderSearchCities();
              updateSearchResultCount();

              if (searchStatusEl) {
                searchStatusEl.textContent = `${provinceSpots.length} spot${provinceSpots.length === 1 ? "" : "s"} available in ${selectedProvinceName}.`;
              }

              return provinceSpots;
            } catch (err) {
              console.error("Province Search error:", err);

              if (searchStatusEl) {
                searchStatusEl.classList.add("error");
                searchStatusEl.textContent = "Could not load this province.";
              }

              if (cityOptionsEl) {
                cityOptionsEl.innerHTML =
                  '<div class="kova-filter-empty">Could not load cities.</div>';
              }

              throw err;
            } finally {
              if (searchSubmitBtn) searchSubmitBtn.disabled = false;
              provinceSpotsPromise = null;
            }
          })();

          return provinceSpotsPromise;
        }

        function renderSearchCities() {
          if (!cityOptionsEl) return;

          if (!selectedProvinceKey) {
            if (cityCountEl) cityCountEl.textContent = "";
            cityOptionsEl.innerHTML =
              '<div class="kova-filter-empty">Choose one province or region first.</div>';
            return;
          }

          if (!provinceSpotsLoaded) return;

          const counts = new Map();

          provinceSpots.forEach((spot) => {
            const city = String(spot.city || "").trim();
            if (!city) return;

            counts.set(city, (counts.get(city) || 0) + 1);
          });

          const cities = [...counts.entries()].sort((a, b) =>
            a[0].localeCompare(b[0], "nl", { sensitivity: "base" }),
          );

          if (cityCountEl) {
            cityCountEl.textContent = cities.length
              ? `${cities.length} available`
              : "";
          }

          cityOptionsEl.innerHTML = cities.length
            ? cities
                .map(([city, count]) =>
                  makeSearchOption(
                    "city",
                    city,
                    city,
                    count,
                    selectedLocationCities.has(city),
                  ),
                )
                .join("")
            : '<div class="kova-filter-empty">No matching cities in this province.</div>';
        }

        function getProvinceSearchMatches() {
          if (!provinceSpotsLoaded || !selectedProvinceKey) return [];

          return provinceSpots.filter((spot) => {
            const city = String(spot.city || "").trim();
            const type = normalizeSpotType(spot.type);

            if (
              selectedLocationCities.size &&
              !selectedLocationCities.has(city)
            ) {
              return false;
            }

            if (selectedSpotTypes.size && !selectedSpotTypes.has(type)) {
              return false;
            }

            return true;
          });
        }

        function updateSearchResultCount() {
          if (!searchResultCountEl || !searchSubmitBtn) return;

          if (!selectedProvinceKey) {
            searchResultCountEl.textContent =
              "Select one province or region first.";
            searchSubmitBtn.disabled = true;
            return;
          }

          if (!provinceSpotsLoaded) {
            searchResultCountEl.textContent = "Loading province…";
            searchSubmitBtn.disabled = true;
            return;
          }

          const matches = getProvinceSearchMatches();

          const typeText = selectedSpotTypes.size
            ? ` · ${[...selectedSpotTypes]
                .map((type) => type.charAt(0).toUpperCase() + type.slice(1))
                .join(" + ")}`
            : "";

          searchResultCountEl.textContent = `${matches.length} spot${matches.length === 1 ? "" : "s"} match${typeText}.`;

          searchSubmitBtn.disabled = matches.length === 0;
        }

        function clearProvinceSearch() {
          selectedCountryKey = "";
          selectedProvinceKey = "";
          selectedProvinceName = "";
          selectedSpotTypes.clear();
          resetLoadedProvince();

          updateSearchTypeUI();
          renderSearchCountries();
          renderSearchCities();
          updateSearchResultCount();

          if (searchStatusEl) {
            searchStatusEl.classList.remove("error");
            searchStatusEl.textContent =
              "Choose a country, then one province or region.";
          }
        }

        function closeLocationSearch() {
          if (!searchOverlay) return;
          searchOverlay.classList.remove("open");
          searchOverlay.setAttribute("aria-hidden", "true");
        }

        async function openLocationSearch() {
          if (!searchOverlay) return;

          closeHamburgerMenu();
          closeFeed();
          closeLibrary();

          searchOverlay.classList.add("open");
          searchOverlay.setAttribute("aria-hidden", "false");

          try {
            await loadSearchRegionIndex();
          } catch (e) {}
        }

        function spotToMapFeature(spot) {
          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [Number(spot.lng), Number(spot.lat)],
            },
            properties: {
              id: spot.id,
              name: spot.name || "",
              description: spot.description || "",
              addedBy: spot.addedBy || "",
              added_by: spot.added_by || "",
              author: spot.author || "",
              photoURL: spot.photoURL || "",
              thumbURL:
                spot.thumbURL ||
                spot.thumbnailURL ||
                spot.photoThumbURL ||
                spot.photoThumbnailURL ||
                "",
              lat: Number(spot.lat),
              lng: Number(spot.lng),
              avgRating: Number(spot.avgRating || 0),
              ratingCount: Number(spot.ratingCount || 0),
              type: normalizeSpotType(spot.type),
            },
          };
        }

        function showProvinceSearchMatchesOnMap() {
          if (!selectedProvinceKey || !provinceSpotsLoaded) {
            if (searchStatusEl) {
              searchStatusEl.classList.add("error");
              searchStatusEl.textContent =
                "Choose one province or region first.";
            }
            return;
          }

          const matches = getProvinceSearchMatches();

          if (!matches.length) {
            if (searchStatusEl) {
              searchStatusEl.classList.add("error");
              searchStatusEl.textContent =
                "No spots match the selected filters.";
            }
            return;
          }

          closeAll();
          setSpotsGeoJSON(matches.map(spotToMapFeature));
          closeLocationSearch();

          if (matches.length === 1) {
            const only = matches[0];

            map.easeTo({
              center: [Number(only.lng), Number(only.lat)],
              zoom: Math.max(map.getZoom(), 13),
              duration: 620,
            });

            return;
          }

          const bounds = new maptilersdk.LngLatBounds();

          matches.forEach((spot) => {
            bounds.extend([Number(spot.lng), Number(spot.lat)]);
          });

          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, {
              padding: {
                top: 100,
                right: 70,
                bottom: 100,
                left: 70,
              },
              maxZoom: 13,
              duration: 700,
            });
          }
        }

        searchOpenBtns.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            openLocationSearch();
          });
        });

        searchCloseBtn?.addEventListener("click", closeLocationSearch);
        searchClearBtn?.addEventListener("click", clearProvinceSearch);
        searchSubmitBtn?.addEventListener(
          "click",
          showProvinceSearchMatchesOnMap,
        );

        searchOverlay?.addEventListener("click", (e) => {
          if (e.target === searchOverlay) closeLocationSearch();
        });

        countryOptionsEl?.addEventListener("change", async (e) => {
          const input = e.target.closest("input[data-filter-kind='country']");
          if (!input) return;

          // Checkboxes visually, but exactly one country can be active.
          const nextKey = input.checked ? input.value : "";

          selectedCountryKey = nextKey;
          selectedProvinceKey = "";
          selectedProvinceName = "";
          resetLoadedProvince();

          countryOptionsEl
            .querySelectorAll("input[data-filter-kind='country']")
            .forEach((other) => {
              other.checked = other === input && Boolean(nextKey);
            });

          renderSearchProvinces();
          renderSearchCities();
          updateSearchResultCount();
        });

        provinceOptionsEl?.addEventListener("change", async (e) => {
          const input = e.target.closest("input[data-filter-kind='province']");
          if (!input) return;

          const nextKey = input.checked ? input.value : "";
          const nextName = input.checked
            ? input.getAttribute("data-filter-label") || ""
            : "";

          selectedProvinceKey = nextKey;
          selectedProvinceName = nextName;
          resetLoadedProvince();

          provinceOptionsEl
            .querySelectorAll("input[data-filter-kind='province']")
            .forEach((other) => {
              other.checked = other === input && Boolean(nextKey);
            });

          updateSearchResultCount();

          if (selectedProvinceKey) {
            try {
              await loadSelectedProvinceSpots();
            } catch (e) {}
          } else {
            renderSearchCities();
          }
        });

        cityOptionsEl?.addEventListener("change", (e) => {
          const input = e.target.closest("input[data-filter-kind='city']");
          if (!input) return;

          if (input.checked) selectedLocationCities.add(input.value);
          else selectedLocationCities.delete(input.value);

          updateSearchResultCount();
        });

        spotTypeOptionsEl?.addEventListener("change", (e) => {
          const input = e.target.closest("input[data-filter-kind='type']");
          if (!input) return;

          if (input.checked) selectedSpotTypes.add(input.value);
          else selectedSpotTypes.delete(input.value);

          updateSearchTypeUI();
          updateSearchResultCount();
        });

        updateSearchTypeUI();

        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && searchOverlay?.classList.contains("open")) {
            closeLocationSearch();
          }
        });

        const SOURCE_ID = "spots";
        const LAYER_CLUSTERS_X = "spots-clusters-x";
        const LAYER_CLUSTERS_COUNT = "spots-clusters-count";
        const LAYER_POINTS = "spots-points";
        const SEARCH_RADIUS_SOURCE_ID = "kova-search-radius-preview";
        const SEARCH_RADIUS_FILL_LAYER = "kova-search-radius-fill";
        const SEARCH_RADIUS_LINE_LAYER = "kova-search-radius-line";

        function closeFeed() {
          if (!feedOverlay) return;
          feedOverlay.classList.remove("open");
          feedOverlay.setAttribute("aria-hidden", "true");
        }

        async function openFeed() {
          if (!feedOverlay) return;
          closeHamburgerMenu();
          closeAll();
          closeLibrary();

          feedOverlay.classList.add("open");
          feedOverlay.setAttribute("aria-hidden", "false");

          // Only KOVA picks + all-time top 5 are loaded.
          if (!feedLoaded) {
            await loadKovaFeed();
          }
        }

        function makeFeedSpotThumb(spot) {
          const url = getSpotDisplayURL(spot);
          if (!url) return "";
          return `<img class="kova-top-thumb" src="${escapeHTML(url)}" alt="" loading="lazy" decoding="async">`;
        }

        function renderKovaPicks(spots) {
          if (!feedPickSection || !feedPickEl) return;

          if (!Array.isArray(spots) || !spots.length) {
            feedPickSection.hidden = true;
            feedPickEl.innerHTML = "";
            return;
          }

          feedPickSection.hidden = false;

          feedPickEl.innerHTML = `
            <div class="kova-pick-carousel">
              <button
                class="kova-pick-nav prev"
                type="button"
                data-pick-prev
                aria-label="Previous KOVA picks"
              >←</button>

              <div class="kova-pick-scroll" aria-label="KOVA picks" data-pick-scroll>
                ${spots
                  .map((spot) => {
                    const photoURL = getSpotDisplayURL(spot);
                    const rating = Number(spot.avgRating || 0).toFixed(1);
                    const ratingCount = Number(spot.ratingCount || 0);

                    return `
                      <article
                        class="kova-pick-card"
                        role="button"
                        tabindex="0"
                        data-feed-spot-id="${escapeHTML(spot.id)}"
                        aria-label="Open ${escapeHTML(spot.name || "KOVA pick")}"
                      >
                        ${photoURL ? `<img src="${escapeHTML(photoURL)}" alt="${escapeHTML(spot.name || "KOVA pick")}" loading="lazy" decoding="async">` : ""}
                        <div class="kova-pick-card-content">
                          <h3 class="kova-pick-name">${escapeHTML(spot.name || "Untitled spot")}</h3>
                          <div class="kova-pick-meta">★ ${rating} · ${ratingCount} total ratings</div>
                        </div>
                      </article>
                    `;
                  })
                  .join("")}
              </div>

              <button
                class="kova-pick-nav next"
                type="button"
                data-pick-next
                aria-label="Next KOVA picks"
              >→</button>
            </div>
          `;

          setupKovaPickCarousel();
        }

        function setupKovaPickCarousel() {
          const scrollEl = feedPickEl?.querySelector("[data-pick-scroll]");
          const prevBtn = feedPickEl?.querySelector("[data-pick-prev]");
          const nextBtn = feedPickEl?.querySelector("[data-pick-next]");

          if (!scrollEl) return;

          function getStep() {
            const firstCard = scrollEl.querySelector(".kova-pick-card");
            if (!firstCard) return Math.max(320, scrollEl.clientWidth * 0.5);

            const styles = window.getComputedStyle(scrollEl);
            const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
            return firstCard.getBoundingClientRect().width + gap;
          }

          function updateButtons() {
            const maxScroll = Math.max(
              0,
              scrollEl.scrollWidth - scrollEl.clientWidth,
            );
            const current = scrollEl.scrollLeft;

            if (prevBtn) prevBtn.disabled = current <= 4;
            if (nextBtn) nextBtn.disabled = current >= maxScroll - 4;
          }

          prevBtn?.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollEl.scrollBy({
              left: -getStep(),
              behavior: "smooth",
            });
          });

          nextBtn?.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollEl.scrollBy({
              left: getStep(),
              behavior: "smooth",
            });
          });

          // Normal mouse wheel on desktop becomes horizontal movement
          // while the pointer is above the KOVA picks carousel.
          scrollEl.addEventListener(
            "wheel",
            (e) => {
              if (window.matchMedia("(max-width: 700px)").matches) return;
              if (scrollEl.scrollWidth <= scrollEl.clientWidth + 2) return;

              const delta =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

              if (!delta) return;

              e.preventDefault();
              scrollEl.scrollLeft += delta;
            },
            { passive: false },
          );

          // Mouse click-and-drag support.
          let dragging = false;
          let startX = 0;
          let startScrollLeft = 0;
          let moved = false;

          scrollEl.addEventListener("pointerdown", (e) => {
            if (window.matchMedia("(max-width: 700px)").matches) return;
            if (e.pointerType !== "mouse") return;

            dragging = true;
            moved = false;
            startX = e.clientX;
            startScrollLeft = scrollEl.scrollLeft;

            try {
              scrollEl.setPointerCapture(e.pointerId);
            } catch (err) {}
          });

          scrollEl.addEventListener("pointermove", (e) => {
            if (!dragging) return;

            const dx = e.clientX - startX;
            if (Math.abs(dx) > 4) moved = true;

            scrollEl.scrollLeft = startScrollLeft - dx;
          });

          function endDrag() {
            dragging = false;
          }

          scrollEl.addEventListener("pointerup", endDrag);
          scrollEl.addEventListener("pointercancel", endDrag);

          // Prevent opening a spot after a real drag gesture.
          scrollEl.addEventListener(
            "click",
            (e) => {
              if (!moved) return;
              e.preventDefault();
              e.stopPropagation();
              moved = false;
            },
            true,
          );

          scrollEl.addEventListener("scroll", updateButtons, { passive: true });
          window.addEventListener("resize", updateButtons, { passive: true });

          requestAnimationFrame(updateButtons);
        }

        function renderAllTimeTopSpots(spots) {
          if (!feedAllTimeEl) return;

          if (!spots.length) {
            feedAllTimeEl.innerHTML = `
              <div class="kova-feed-empty">
                No rated spots yet. Once spots receive ratings, the all-time top 5 appears here.
              </div>
            `;
            return;
          }

          feedAllTimeEl.innerHTML = spots
            .map((spot, index) => {
              const avg = Number(spot.avgRating || 0).toFixed(1);
              const count = Number(spot.ratingCount || 0);

              return `
                <button
                  class="kova-top-item"
                  type="button"
                  data-feed-spot-id="${escapeHTML(spot.id)}"
                >
                  <span class="kova-top-rank">#${index + 1}</span>
                  ${makeFeedSpotThumb(spot) || `<span class="kova-top-thumb"></span>`}
                  <span class="kova-top-copy">
                    <span class="kova-top-name">${escapeHTML(spot.name || "Untitled spot")}</span>
                    <span class="kova-top-rating">★ ${avg} · ${count} total rating${count === 1 ? "" : "s"}</span>
                  </span>
                  <span class="kova-top-arrow">→</span>
                </button>
              `;
            })
            .join("");
        }

        async function loadKovaFeed({ force = false } = {}) {
          if (!force && feedLoaded) return;

          if (feedAllTimeEl) {
            feedAllTimeEl.innerHTML =
              '<div class="kova-feed-loading">Loading all-time favorites…</div>';
          }

          try {
            const picksPromise =
              Array.isArray(KOVAS_PICK_IDS) && KOVAS_PICK_IDS.length
                ? Promise.all(
                    KOVAS_PICK_IDS.map((spotId) =>
                      db
                        .collection("spots")
                        .doc(spotId)
                        .get()
                        .then((snap) =>
                          snap.exists ? { id: snap.id, ...snap.data() } : null,
                        ),
                    ),
                  ).then((spots) => spots.filter(Boolean))
                : Promise.resolve([]);

            // Only 5 spot reads for the ranking.
            const allTimePromise = db
              .collection("spots")
              .orderBy("avgRating", "desc")
              .limit(5)
              .get()
              .then((snap) => {
                const spots = [];
                snap.forEach((doc) => {
                  spots.push({ id: doc.id, ...doc.data() });
                });
                return spots;
              });

            const [picks, allTimeSpots] = await Promise.all([
              picksPromise,
              allTimePromise,
            ]);

            const allTimeTopFive = allTimeSpots
              .filter(
                (spot) =>
                  Number(spot.ratingCount || 0) > 0 &&
                  Number.isFinite(Number(spot.avgRating || 0)),
              )
              .sort((a, b) => {
                const ratingDiff =
                  Number(b.avgRating || 0) - Number(a.avgRating || 0);

                if (ratingDiff !== 0) return ratingDiff;

                return Number(b.ratingCount || 0) - Number(a.ratingCount || 0);
              })
              .slice(0, 5);

            renderKovaPicks(picks);
            renderAllTimeTopSpots(allTimeTopFive);
            feedLoaded = true;
          } catch (err) {
            console.error("KOVA feed error:", err);

            if (feedAllTimeEl) {
              feedAllTimeEl.innerHTML =
                '<div class="kova-feed-empty">Could not load the all-time ranking.</div>';
            }
          }
        }

        async function openSpotFromFeed(spotId) {
          if (!spotId) return;

          try {
            const snap = await db.collection("spots").doc(spotId).get();
            if (!snap.exists) return;

            const spot = { id: snap.id, ...snap.data() };
            const lat = Number(spot.lat);
            const lng = Number(spot.lng);

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            closeFeed();

            if (activePopup) {
              closeActiveSpotPopup({ animate: false });
            }
            closeCoordPopup();
            closeUserPopup();

            // Load all nearby spots around the selected Discover spot.
            // They remain visible after the selected spot popup is closed.
            await fetchSpotsInRadius(lat, lng, SEARCH_RADIUS_KM, {
              recenter: false,
              showEmptyPopup: false,
            });

            const props = {
              ...spot,
              id: snap.id,
              lat,
              lng,
              avgRating: Number(spot.avgRating || 0),
              ratingCount: Number(spot.ratingCount || 0),
            };

            const popup = new maptilersdk.Popup({
              offset: 18,
              maxWidth: "620px",
              closeButton: true,
              closeOnClick: false,
              className: "spot-sheet-popup",
            })
              .setLngLat([lng, lat])
              .setHTML(makeSpotPopupHTML(props))
              .addTo(map);

            activePopup = popup;
            attachPopupImageLoader(popup);
            attachMobileSheetGestures(popup);
            updateFooterVisibility();
            easeToSpotWithPopupSpace(lng, lat);
            popup.once("close", () => {
              if (activePopup === popup) activePopup = null;
              updateFooterVisibility();
            });

            await hydratePopupData(popup, props);
          } catch (err) {
            console.error("Open feed spot error:", err);
          }
        }

        feedOpenBtns.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            openFeed();
          });
        });

        feedCloseBtn?.addEventListener("click", closeFeed);

        feedOverlay?.addEventListener("click", (e) => {
          if (e.target === feedOverlay) closeFeed();
        });

        document.addEventListener("click", (e) => {
          const item = e.target.closest("[data-feed-spot-id]");
          if (!item) return;

          const spotId = item.getAttribute("data-feed-spot-id");
          openSpotFromFeed(spotId);
        });

        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && feedOverlay?.classList.contains("open")) {
            closeFeed();
          }

          if (
            (e.key === "Enter" || e.key === " ") &&
            e.target?.matches?.(".kova-pick-card[data-feed-spot-id]")
          ) {
            e.preventDefault();
            openSpotFromFeed(e.target.getAttribute("data-feed-spot-id"));
          }
        });

        function getLocalRatings() {
          try {
            const raw = localStorage.getItem(LOCAL_RATINGS_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === "object" ? parsed : {};
          } catch (e) {
            return {};
          }
        }

        function setLocalRatings(ratings) {
          try {
            localStorage.setItem(LOCAL_RATINGS_KEY, JSON.stringify(ratings));
          } catch (e) {}
        }

        function getLocalRatingRecord(spotId) {
          const ratings = getLocalRatings();
          const stored = ratings[spotId];

          // Backwards compatible with older KOVA ratings stored as a number.
          if (Number.isInteger(Number(stored))) {
            const value = Number(stored);
            if (value >= 1 && value <= 5) {
              return { value, weekKey: null };
            }
          }

          if (stored && typeof stored === "object") {
            const value = Number(stored.value);
            const weekKey =
              typeof stored.weekKey === "string" ? stored.weekKey : null;

            if (Number.isInteger(value) && value >= 1 && value <= 5) {
              return { value, weekKey };
            }
          }

          return null;
        }

        function getLocalRating(spotId) {
          return getLocalRatingRecord(spotId)?.value ?? null;
        }

        function setLocalRating(spotId, value) {
          const ratings = getLocalRatings();
          ratings[spotId] = { value };
          setLocalRatings(ratings);
        }

        const showFooter = () =>
          footerEl && footerEl.classList.remove("footer-hidden");
        const hideFooter = () =>
          footerEl && footerEl.classList.add("footer-hidden");

        function updateFooterVisibility() {
          const somethingOpen =
            !!activePopup ||
            !!activeCoordPopup ||
            !!(userPopup && userPopup.isOpen());

          if (somethingOpen) hideFooter();
          else showFooter();
        }

        function escapeHTML(str) {
          return String(str ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        }

        function safeHttpsURL(url) {
          const s = String(url || "").trim();
          return s.startsWith("https://") ? s : "";
        }

        function normalizeSpotType(type) {
          const value = String(type || "")
            .trim()
            .toLowerCase();
          return ["water", "nature", "urban"].includes(value) ? value : "urban";
        }

        function setStatus(el, message = "", type = "") {
          if (!el) return;
          el.textContent = message;
          el.classList.remove("success", "error");
          if (type) el.classList.add(type);
        }

        function initUserLocationFlow() {
          if (!window.KovaDevice.geolocation) {
            console.warn("Geolocation is not supported on this device.");
            return Promise.resolve(false);
          }

          if (!userLocationRequestPromise) {
            userLocationRequestPromise = requestUserLocation();
          }

          return userLocationRequestPromise;
        }

        function openNavigation(lat, lng) {
          if (window.KovaDevice.native) {
            window.KovaDevice.openExternal(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).catch(console.warn);
            return;
          }
          const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const isAndroid = /Android/.test(navigator.userAgent);
          const q = `${lat},${lng}`;
          const label = "KOVA Spot";

          if (isAndroid) {
            window.location.href = `geo:${q}?q=${q}(${encodeURIComponent(label)})`;
            return;
          }

          if (isApple) {
            window.location.href = `https://maps.apple.com/?daddr=${encodeURIComponent(
              q,
            )}&dirflg=d`;
            return;
          }

          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              q,
            )}`,
            "_blank",
          );
        }

        async function goAddSpot(lat, lng) {
          const coordStr = `${lat.toFixed(5)},${lng.toFixed(5)}`;
          try {
            await navigator.clipboard.writeText(coordStr);
          } catch (e) {}

          const url = `./app/pages/addspot.html?coords=${encodeURIComponent(
            coordStr,
          )}`;
          window.location.href = url;
        }

        function removeClickPin() {
          if (clickPin) {
            clickPin.remove();
            clickPin = null;
          }
        }

        function placeClickPin(lng, lat) {
          if (!clickPin) {
            const pinEl = document.createElement("div");
            pinEl.className = "pinpoint";
            clickPin = new maptilersdk.Marker({ element: pinEl })
              .setLngLat([lng, lat])
              .addTo(map);
          } else {
            clickPin.setLngLat([lng, lat]);
          }
        }

        function closeCoordPopup() {
          if (activeCoordPopup) {
            activeCoordPopup.remove();
            activeCoordPopup = null;
            updateFooterVisibility();
          }
          removeClickPin();
        }

        function closeUserPopup() {
          if (userPopup && userPopup.isOpen()) {
            userPopup.remove();
          }
          updateFooterVisibility();
        }

        window.addEventListener('kova:back', event => {
          if (tutorialOverlay?.classList.contains('open')) closeTutorial();
          else if (libraryOverlay?.classList.contains('open')) closeLibrary();
          else if (searchOverlay?.classList.contains('open')) closeLocationSearch();
          else if (feedOverlay?.classList.contains('open')) closeFeed();
          else if (navRight?.classList.contains('open')) closeHamburgerMenu();
          else if (activePopup || activeCoordPopup || userPopup?.isOpen()) closeAll();
          else return;
          event.preventDefault();
        });

        function closeAll() {
          if (activePopup) closeActiveSpotPopup();

          if (activeCoordPopup) {
            activeCoordPopup.remove();
            activeCoordPopup = null;
          }

          closeUserPopup();
          removeClickPin();
          updateFooterVisibility();
        }

        function syncUserMarker() {
          if (
            !userMarker ||
            typeof userLat !== "number" ||
            typeof userLng !== "number"
          ) {
            return;
          }

          if (!userMarkerAdded) {
            userMarker.setLngLat([userLng, userLat]).addTo(map);
            userMarkerAdded = true;
          } else {
            userMarker.setLngLat([userLng, userLat]);
          }
        }

        function easeToSpotWithPopupSpace(lng, lat) {
          const isMobile = window.matchMedia("(max-width: 700px)").matches;

          if (isMobile) {
            map.easeTo({
              center: [lng, lat],
              zoom: Math.max(map.getZoom(), 12),
              duration: 520,
            });
            return;
          }

          const canvas = map.getCanvas();
          const h = canvas ? canvas.clientHeight : window.innerHeight;
          const liftPx = Math.round(Math.min(420, h * 0.34));

          map.easeTo({
            center: [lng, lat],
            zoom: Math.max(map.getZoom(), 12),
            duration: 520,
            offset: [0, -liftPx],
          });
        }

        function isMobileSpotSheet() {
          return window.matchMedia("(max-width: 700px)").matches;
        }

        function setSpotSheetState(card, state = "expanded") {
          if (!card) return;
          card.classList.remove("sheet-peek", "sheet-expanded");
          card.classList.add(
            state === "peek" ? "sheet-peek" : "sheet-expanded",
          );
        }

        function closeActiveSpotPopup({ animate = true } = {}) {
          if (!activePopup) return false;

          const popup = activePopup;
          const popupEl = popup.getElement && popup.getElement();
          const card = popupEl?.querySelector?.(".kova-popup[data-spot-id]");
          activePopup = null;

          if (
            animate && card &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ) {
            const content = popupEl.querySelector(".maplibregl-popup-content");
            const currentStyle = window.getComputedStyle(content);
            content.style.setProperty("--spot-close-transform", currentStyle.transform);
            content.style.setProperty("--spot-close-opacity", currentStyle.opacity);
            popupEl.classList.add("spot-closing");
            popupEl.inert = true;
            window.setTimeout(() => {
              try {
                popup.remove();
              } catch (e) {}
              updateFooterVisibility();
            }, 180);
          } else {
            popup.remove();
            updateFooterVisibility();
          }

          return true;
        }

        function attachMobileSheetGestures(popup) {
          requestAnimationFrame(() => {
            if (!popup) return;

            const popupEl = popup.getElement();
            if (!popupEl) return;

            const card = popupEl.querySelector(".kova-popup[data-spot-id]");
            if (!card) return;

            setSpotSheetState(card, "expanded");
            if (card.dataset.sheetBound === "true") return;
            card.dataset.sheetBound = "true";

            const dragZones = [
              card.querySelector("[data-sheet-grabber]"),
              card.querySelector(".hero"),
            ].filter(Boolean);

            let startY = 0;
            let lastY = 0;
            let dragging = false;

            function startDrag(event) {
              if (!isMobileSpotSheet()) return;
              if (event.pointerType && event.pointerType === "mouse") return;
              if (event.isPrimary === false) return;

              dragging = true;
              startY = event.clientY;
              lastY = event.clientY;
              card.classList.add("sheet-dragging");

              try {
                event.currentTarget.setPointerCapture(event.pointerId);
              } catch (e) {}
            }

            function moveDrag(event) {
              if (!dragging) return;
              lastY = event.clientY;

              const dy = lastY - startY;
              const down = Math.max(0, dy);
              const up = Math.min(0, dy);
              const translateY =
                down > 0 ? Math.min(down, 220) : Math.max(up * 0.16, -18);

              card.style.transform = `translateY(${translateY}px)`;
            }

            function endDrag() {
              if (!dragging) return;

              const dy = lastY - startY;
              dragging = false;
              card.classList.remove("sheet-dragging");
              card.style.transform = "";

              if (dy < -42) {
                setSpotSheetState(card, "expanded");
                return;
              }

              if (dy > 72) {
                closeActiveSpotPopup({ animate: true });
                return;
              }

              setSpotSheetState(card, "expanded");
            }

            dragZones.forEach((zone) => {
              zone.addEventListener("pointerdown", startDrag, {
                passive: true,
              });
              zone.addEventListener("pointermove", moveDrag, { passive: true });
              zone.addEventListener("pointerup", endDrag, { passive: true });
              zone.addEventListener("pointercancel", endDrag, {
                passive: true,
              });
            });
          });
        }

        function attachPopupImageLoader(popup) {
          requestAnimationFrame(() => {
            if (!popup) return;

            const popupEl = popup.getElement();
            if (!popupEl) return;

            const hero = popupEl.querySelector(".hero[data-photo-url]");
            if (!hero) return;

            const photoURL = safeHttpsURL(
              hero.getAttribute("data-photo-url") || "",
            );

            const thumbURL = safeHttpsURL(
              hero.getAttribute("data-thumb-url") || "",
            );

            const img = hero.querySelector("img[data-spot-image]");
            const loading = hero.querySelector(".kova-loading");
            const fallback = hero.querySelector(".kova-fallback");

            if ((!photoURL && !thumbURL) || !img) {
              if (loading) loading.classList.add("hidden");
              if (fallback) fallback.classList.remove("hidden");
              return;
            }

            const initialURL = thumbURL || photoURL;
            const initialIsPreview = Boolean(thumbURL) && thumbURL !== photoURL;

            let fullImageStarted = false;
            let initialHandled = false;

            function showLoadedImage(preview = false) {
              hero.classList.add("is-loaded");
              hero.classList.toggle("has-preview", preview);
              hero.classList.toggle("is-full", !preview);

              if (loading) loading.classList.add("hidden");
              if (fallback) fallback.classList.add("hidden");
            }

            function loadFullImage() {
              if (fullImageStarted || !photoURL || photoURL === initialURL) {
                return;
              }

              fullImageStarted = true;

              const full = new Image();
              full.decoding = "async";

              try {
                full.fetchPriority = "low";
              } catch (e) {}

              full.onload = () => {
                if (!popup.getElement()) return;

                img.src = photoURL;
                hero.classList.remove("has-preview");
                hero.classList.add("is-loaded", "is-full");

                if (loading) loading.classList.add("hidden");
                if (fallback) fallback.classList.add("hidden");
              };

              full.onerror = () => {
                // Keep the already visible thumbnail if full-res fails.
                if (!hero.classList.contains("is-loaded")) {
                  if (loading) loading.classList.add("hidden");
                  if (fallback) fallback.classList.remove("hidden");
                }
              };

              full.src = photoURL;
            }

            function handleInitialLoaded() {
              if (initialHandled) return;
              initialHandled = true;

              showLoadedImage(initialIsPreview);

              if (initialIsPreview) {
                loadFullImage();
              }
            }

            function handleInitialError() {
              if (initialHandled) return;
              initialHandled = true;

              // If the thumbnail ever fails, fall back to the normal image.
              if (initialIsPreview && photoURL) {
                const fallbackFull = new Image();
                fallbackFull.decoding = "async";

                try {
                  fallbackFull.fetchPriority = "high";
                } catch (e) {}

                fallbackFull.onload = () => {
                  if (!popup.getElement()) return;

                  img.src = photoURL;
                  showLoadedImage(false);
                };

                fallbackFull.onerror = () => {
                  if (loading) loading.classList.add("hidden");
                  if (fallback) fallback.classList.remove("hidden");
                };

                fallbackFull.src = photoURL;
                return;
              }

              if (loading) loading.classList.add("hidden");
              if (fallback) fallback.classList.remove("hidden");
            }

            img.addEventListener("load", handleInitialLoaded, { once: true });
            img.addEventListener("error", handleInitialError, { once: true });

            // The browser may have finished the thumbnail before the popup
            // loader attached (especially after our nearby prefetch).
            if (img.complete) {
              if (img.naturalWidth > 0) {
                handleInitialLoaded();
              } else {
                handleInitialError();
              }
            }
          });
        }

        function renderStars(avgRating) {
          const rounded = Math.round(Number(avgRating) || 0);
          let html = "";
          for (let i = 1; i <= 5; i++) {
            html += i <= rounded ? "★" : "☆";
          }
          return html;
        }

        function makeSpotPopupHTML(props) {
          const name = escapeHTML(props.name);
          const type = normalizeSpotType(props.type);
          const typeLabel = type[0].toUpperCase() + type.slice(1);
          const desc = escapeHTML(props.description);
          const addedByRaw =
            props.addedBy || props.added_by || props.author || "";
          const addedBy = escapeHTML(addedByRaw || "unknown");
          const photoURL = safeHttpsURL(props.photoURL);
          const thumbURL = getSpotThumbnailURL(props);
          const initialImageURL = thumbURL || photoURL;

          return `
            <div
              class="kova-popup"
              data-spot-id="${escapeHTML(props.id)}"
              data-spot-name="${escapeHTML(props.name || "")}"
              data-spot-description="${escapeHTML(props.description || "")}"
              data-spot-added-by="${escapeHTML(addedByRaw || "")}"
              data-spot-photo="${escapeHTML(photoURL)}"
              data-spot-thumb="${escapeHTML(thumbURL)}"
              data-spot-lat="${Number(props.lat)}"
              data-spot-lng="${Number(props.lng)}"
              data-spot-rating="${Number(props.avgRating || 0)}"
              data-spot-rating-count="${Number(props.ratingCount || 0)}"
              data-spot-type="${escapeHTML(normalizeSpotType(props.type))}"
            >
              <div class="sheet-grabber" data-sheet-grabber aria-hidden="true"><span></span></div>
              <button
                class="spot-close-btn"
                type="button"
                data-action="close-spot"
                aria-label="Close spot"
              >×</button>
              <div
                class="hero"
                data-photo-url="${escapeHTML(photoURL)}"
                data-thumb-url="${escapeHTML(thumbURL)}"
              >
                <div class="kova-loading">
                  <div class="kova-spinner"></div>
                  <div class="kova-loading-text">Loading image...</div>
                </div>

                <div class="kova-fallback hidden">No image yet</div>

                <img
                  data-spot-image
                  ${initialImageURL ? `src="${escapeHTML(initialImageURL)}"` : ""}
                  alt="${name}"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                />
              </div>

              <div class="body">
                <div class="spot-heading">
                  <h3 class="title">${name}</h3>
                  <span class="spot-type spot-type-${type}">${typeLabel}</span>
                </div>
                <p class="desc">${desc || "No description yet."}</p>
                <p class="byline">added by <b>${addedBy}</b></p>

                <div class="spot-meta">
                  <div class="spot-card-box">
                    <div class="spot-box-title">Rating</div>
                    <div class="rating-summary" data-rating-summary>
                      ${renderStars(props.avgRating || 0)} ${Number(
                        props.avgRating || 0,
                      ).toFixed(1)}
                      <small>(${Number(props.ratingCount || 0)} ratings)</small>
                    </div>

                    <div class="stars-row" data-stars-row></div>
                    <div class="rating-note" data-rating-note></div>
                    <div class="popup-status" data-rating-status></div>
                  </div>
                </div>

                <div class="spot-actions">
                  <button class="spot-action-btn ${isSpotSaved(props.id) ? "is-active" : ""}" data-action="save-spot" aria-pressed="${isSpotSaved(props.id)}" type="button">
                    <svg class="spot-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M6.5 4.5h11v15l-5.5-3.4-5.5 3.4v-15z"></path>
                    </svg>
                    <span>Save</span>
                  </button>
                  <button class="spot-action-btn ${isSpotInRoute(props.id) ? "is-active" : ""}" data-action="toggle-route-spot" aria-pressed="${isSpotInRoute(props.id)}" type="button">
                    <svg class="spot-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <circle cx="6" cy="18" r="2"></circle>
                      <circle cx="18" cy="6" r="2"></circle>
                      <path d="M7.5 16.5c2-4 4.5-5 9-8.5"></path>
                    </svg>
                    <span>Route</span>
                  </button>
                  <button class="spot-action-btn" data-action="nav" data-lat="${props.lat}" data-lng="${props.lng}" type="button">
                    <svg class="spot-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M20 4l-6 16-3-7-7-3L20 4z"></path>
                    </svg>
                    <span>Navigate</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        }

        function makeNoSpotsPopupHTML(lat, lng, radiusKm) {
          return `
            <div class="coord-popup">
              <strong>No spots found</strong>
              <span class="coords">Nothing here yet in this ${radiusKm} km radius.</span>
            </div>
          `;
        }

        function makeDuplicateSpotPopupHTML(
          lat,
          lng,
          nearestSpot,
          distanceMeters,
        ) {
          const cleanDistance =
            distanceMeters < 10 ? "< 10m" : `${Math.round(distanceMeters)}m`;

          const spotName = escapeHTML(nearestSpot?.name || "existing spot");

          return `
            <div class="coord-popup">
              <strong>Spot already nearby</strong>
              <span class="coords">
                There is already a spot too close to this location.<br>
                Nearest: <b>${spotName}</b><br>
                Distance: ${cleanDistance}
              </span>
              <div class="btn-row single">
                <button data-action="show-spots" data-lat="${lat}" data-lng="${lng}" data-radius="${SEARCH_RADIUS_KM}">
                  Show nearby spots
                </button>
              </div>
            </div>
          `;
        }

        function emptyGeoJSON() {
          return { type: "FeatureCollection", features: [] };
        }

        function setSpotsGeoJSON(features, options = {}) {
          const src = map.getSource(SOURCE_ID);
          if (!src) return;

          const cleanFeatures = Array.isArray(features) ? features : [];

          if (!options.preserveBase) {
            currentBaseSpotFeatures = cleanFeatures;
          }

          const byId = new Map();

          Object.values(getSavedSpots())
            .map(personalSpotToMapFeature)
            .filter(Boolean)
            .forEach((feature) => {
              byId.set(String(feature.properties?.id || ""), feature);
            });

          currentBaseSpotFeatures.forEach((feature) => {
            const spotId = String(feature?.properties?.id || "");
            if (spotId) byId.set(spotId, feature);
          });

          const mergedFeatures = [...byId.values()];

          src.setData({
            type: "FeatureCollection",
            features: mergedFeatures,
          });

          scheduleSpotImagePrefetch(mergedFeatures);
        }

        function toRad(x) {
          return (x * Math.PI) / 180;
        }

        function haversineMeters(aLat, aLng, bLat, bLng) {
          const R = 6371000;
          const dLat = toRad(bLat - aLat);
          const dLng = toRad(bLng - aLng);

          const s1 =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(aLat)) *
              Math.cos(toRad(bLat)) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);

          const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1));
          return R * c;
        }

        function getBoundsForRadius(lat, lng, radiusKm) {
          const safeCos = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
          const latDelta = radiusKm / 111;
          const lngDelta = radiusKm / (111 * safeCos);

          return {
            minLat: lat - latDelta,
            maxLat: lat + latDelta,
            minLng: lng - lngDelta,
            maxLng: lng + lngDelta,
          };
        }

        function renderInteractiveStars(
          starsRow,
          selectedValue,
          disabled = false,
        ) {
          if (!starsRow) return;
          let html = "";

          for (let i = 1; i <= 5; i++) {
            html += `
              <button
                type="button"
                class="star-btn ${i <= selectedValue ? "active" : ""} ${disabled ? "disabled" : ""}"
                data-rate-value="${i}"
                ${disabled ? "disabled" : ""}
                aria-label="Rate ${i} star${i > 1 ? "s" : ""}"
              >★</button>
            `;
          }

          starsRow.innerHTML = html;
        }

        async function rateSpot(spotId, newRating) {
          if (!Number.isInteger(newRating) || newRating < 1 || newRating > 5) {
            throw new Error("Invalid rating.");
          }

          const previousRating = getLocalRating(spotId);

          if (previousRating === newRating) {
            return { changed: false, rating: newRating };
          }

          const spotRef = db.collection("spots").doc(spotId);

          await db.runTransaction(async (transaction) => {
            const spotSnap = await transaction.get(spotRef);

            if (!spotSnap.exists) {
              throw new Error("Spot not found.");
            }

            const spotData = spotSnap.data() || {};
            let ratingSum = Number(spotData.ratingSum || 0);
            let ratingCount = Number(spotData.ratingCount || 0);

            if (previousRating === null) {
              ratingSum += newRating;
              ratingCount += 1;
            } else {
              ratingSum = ratingSum - previousRating + newRating;
            }

            ratingSum = Math.max(0, ratingSum);
            ratingCount = Math.max(0, ratingCount);

            const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

            transaction.set(
              spotRef,
              {
                ratingSum: Math.round(ratingSum),
                ratingCount: Math.round(ratingCount),
                avgRating: Number(avgRating.toFixed(2)),
              },
              { merge: true },
            );
          });

          setLocalRating(spotId, newRating);
          feedLoaded = false;

          return { changed: true, rating: newRating };
        }

        async function getSpotDocData(spotId) {
          const snap = await db.collection("spots").doc(spotId).get();
          return snap.exists ? snap.data() || {} : {};
        }

        async function hydratePopupData(popup, fallbackProps = {}) {
          if (!popup) return;
          const popupEl = popup.getElement();
          if (!popupEl) return;

          const card = popupEl.querySelector(".kova-popup[data-spot-id]");
          if (!card) return;

          const spotId = card.getAttribute("data-spot-id") || fallbackProps.id;
          if (!spotId) return;

          const ratingSummaryEl = popupEl.querySelector(
            "[data-rating-summary]",
          );
          const starsRowEl = popupEl.querySelector("[data-stars-row]");
          const ratingNoteEl = popupEl.querySelector("[data-rating-note]");
          const ratingStatusEl = popupEl.querySelector("[data-rating-status]");

          try {
            const spotData = await getSpotDocData(spotId);
            const localRating = getLocalRating(spotId);
            const avgRating = Number(spotData.avgRating || 0);
            const ratingCount = Number(spotData.ratingCount || 0);
            const alreadyRated = localRating !== null;

            if (ratingSummaryEl) {
              ratingSummaryEl.innerHTML = `
                ${renderStars(avgRating)} ${avgRating.toFixed(1)}
                <small>(${ratingCount} ratings)</small>
              `;
            }

            // Keep stars clickable after voting so the rating can be changed.
            renderInteractiveStars(starsRowEl, localRating || 0, false);

            if (ratingNoteEl) {
              ratingNoteEl.textContent = alreadyRated
                ? `Your rating: ${localRating}/5 · tap another star to change it.`
                : "Tap a star to rate this spot.";
            }

            setStatus(ratingStatusEl, "");
            syncOpenPopupPersonalButtons();
          } catch (err) {
            console.error("Popup hydrate error:", err);
            setStatus(ratingStatusEl, "Could not load rating data.", "error");
          }

          if (starsRowEl && !starsRowEl.dataset.bound) {
            starsRowEl.dataset.bound = "true";

            starsRowEl.addEventListener("click", async (e) => {
              const btn = e.target.closest("[data-rate-value]");
              if (!btn) return;

              const spotCard = popupEl.querySelector(
                ".kova-popup[data-spot-id]",
              );
              const liveSpotId = spotCard?.getAttribute("data-spot-id");
              const value = Number(btn.getAttribute("data-rate-value"));

              if (!liveSpotId || !Number.isInteger(value)) return;

              const ratingStatusElLocal = popupEl.querySelector(
                "[data-rating-status]",
              );
              const ratingNoteElLocal =
                popupEl.querySelector("[data-rating-note]");

              try {
                const oldRating = getLocalRating(liveSpotId);

                if (oldRating === value) {
                  setStatus(
                    ratingStatusElLocal,
                    `Your rating is already ${value}/5.`,
                    "success",
                  );
                  return;
                }

                setStatus(
                  ratingStatusElLocal,
                  oldRating === null
                    ? "Saving rating..."
                    : "Updating rating...",
                );

                const result = await rateSpot(liveSpotId, value);

                setStatus(
                  ratingStatusElLocal,
                  oldRating === null ? "Rating saved." : "Rating updated.",
                  "success",
                );

                if (ratingNoteElLocal) {
                  ratingNoteElLocal.textContent = `Your rating: ${result.rating}/5 · tap another star to change it.`;
                }

                await hydratePopupData(popup, { id: liveSpotId });
              } catch (err) {
                console.error("Rating error:", err);
                setStatus(
                  ratingStatusElLocal,
                  err?.message || "Could not save rating.",
                  "error",
                );
              }
            });
          }
        }

        async function findNearbyExistingSpot(
          lat,
          lng,
          radiusM = DUPLICATE_BLOCK_RADIUS_M,
        ) {
          const docsById = new Map();
          const radiusKm = radiusM / 1000;
          const canGeoHash =
            window.geofire &&
            typeof window.geofire.geohashQueryBounds === "function";

          try {
            if (canGeoHash) {
              const bounds = window.geofire.geohashQueryBounds(
                [lat, lng],
                radiusM,
              );

              await Promise.all(
                bounds.map(async (bound) => {
                  const q = db
                    .collection("spots")
                    .orderBy("geohash")
                    .startAt(bound[0])
                    .endAt(bound[1]);

                  const snap = await q.get();
                  snap.forEach((doc) => {
                    docsById.set(doc.id, { id: doc.id, ...doc.data() });
                  });
                }),
              );
            } else {
              const box = getBoundsForRadius(lat, lng, radiusKm);
              const q = db
                .collection("spots")
                .where("lat", ">=", box.minLat)
                .where("lat", "<=", box.maxLat);

              const snap = await q.get();
              snap.forEach((doc) => {
                const d = doc.data();
                if (
                  d &&
                  typeof d.lng === "number" &&
                  d.lng >= box.minLng &&
                  d.lng <= box.maxLng
                ) {
                  docsById.set(doc.id, { id: doc.id, ...d });
                }
              });
            }
          } catch (err) {
            console.error("Duplicate check error:", err);
            return null;
          }

          let nearest = null;

          docsById.forEach((spot) => {
            if (
              !spot ||
              typeof spot.lat !== "number" ||
              typeof spot.lng !== "number"
            ) {
              return;
            }

            const distance = haversineMeters(lat, lng, spot.lat, spot.lng);

            if (distance <= radiusM) {
              if (!nearest || distance < nearest.distance) {
                nearest = { ...spot, distance };
              }
            }
          });

          return nearest;
        }

        function showNoSpotsPopup(lat, lng, radiusKm, autoCloseDelayMs = 0) {
          closeCoordPopup();
          placeClickPin(lng, lat);

          activeCoordPopup = new maptilersdk.Popup({
            offset: 18,
            closeButton: true,
            closeOnClick: false,
            maxWidth: "320px",
            className: "coord-map-popup",
          })
            .setLngLat([lng, lat])
            .setHTML(makeNoSpotsPopupHTML(lat, lng, radiusKm))
            .addTo(map);

          updateFooterVisibility();

          let autoCloseTimer = null;

          activeCoordPopup.once("close", () => {
            if (autoCloseTimer) window.clearTimeout(autoCloseTimer);
            activeCoordPopup = null;
            removeClickPin();
            updateFooterVisibility();
          });

          if (autoCloseDelayMs > 0) {
            const popupRef = activeCoordPopup;
            autoCloseTimer = window.setTimeout(() => {
              if (activeCoordPopup === popupRef && popupRef) {
                popupRef.remove();
              }
            }, autoCloseDelayMs);
          }
        }

        function showDuplicateSpotPopup(lat, lng, nearestSpot) {
          closeCoordPopup();
          placeClickPin(lng, lat);

          activeCoordPopup = new maptilersdk.Popup({
            offset: 18,
            closeButton: true,
            closeOnClick: false,
            maxWidth: "320px",
            className: "coord-map-popup",
          })
            .setLngLat([lng, lat])
            .setHTML(
              makeDuplicateSpotPopupHTML(
                lat,
                lng,
                nearestSpot,
                nearestSpot.distance,
              ),
            )
            .addTo(map);

          updateFooterVisibility();

          activeCoordPopup.once("close", () => {
            activeCoordPopup = null;
            removeClickPin();
            updateFooterVisibility();
          });
        }

        async function fetchSpotsInRadius(
          centerLat,
          centerLng,
          radiusKm = SEARCH_RADIUS_KM,
          options = {},
        ) {
          const {
            recenter = true,
            showEmptyPopup = true,
            noSpotsAutoCloseAt = 0,
          } = options;
          const radiusM = radiusKm * 1000;
          const docsById = new Map();
          const canGeoHash =
            window.geofire &&
            typeof window.geofire.geohashQueryBounds === "function";

          try {
            if (canGeoHash) {
              const bounds = window.geofire.geohashQueryBounds(
                [centerLat, centerLng],
                radiusM,
              );

              await Promise.all(
                bounds.map(async (bound) => {
                  const q = db
                    .collection("spots")
                    .orderBy("geohash")
                    .startAt(bound[0])
                    .endAt(bound[1]);

                  const snap = await q.get();
                  snap.forEach((doc) => {
                    docsById.set(doc.id, doc.data());
                  });
                }),
              );
            } else {
              const box = getBoundsForRadius(centerLat, centerLng, radiusKm);
              const q = db
                .collection("spots")
                .where("lat", ">=", box.minLat)
                .where("lat", "<=", box.maxLat);

              const snap = await q.get();
              snap.forEach((doc) => {
                const d = doc.data();
                if (
                  d &&
                  typeof d.lng === "number" &&
                  d.lng >= box.minLng &&
                  d.lng <= box.maxLng
                ) {
                  docsById.set(doc.id, d);
                }
              });
            }
          } catch (err) {
            console.error("Radius fetch error:", err);
            return;
          }

          const features = [];

          docsById.forEach((spot, id) => {
            if (
              !spot ||
              typeof spot.lat !== "number" ||
              typeof spot.lng !== "number"
            ) {
              return;
            }

            const distance = haversineMeters(
              centerLat,
              centerLng,
              spot.lat,
              spot.lng,
            );

            if (distance > radiusM) return;

            features.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [spot.lng, spot.lat],
              },
              properties: {
                id,
                name: spot.name || "",
                description: spot.description || "",
                addedBy: spot.addedBy || "",
                added_by: spot.added_by || "",
                author: spot.author || "",
                photoURL: spot.photoURL || "",
                thumbURL:
                  spot.thumbURL ||
                  spot.thumbnailURL ||
                  spot.photoThumbURL ||
                  spot.photoThumbnailURL ||
                  "",
                lat: spot.lat,
                lng: spot.lng,
                avgRating: Number(spot.avgRating || 0),
                ratingCount: Number(spot.ratingCount || 0),
                type: normalizeSpotType(spot.type),
              },
            });
          });

          setSpotsGeoJSON(features);

          if (features.length === 0) {
            if (showEmptyPopup) {
              const autoCloseDelayMs = noSpotsAutoCloseAt
                ? Math.max(1, noSpotsAutoCloseAt - Date.now())
                : 0;
              showNoSpotsPopup(
                centerLat,
                centerLng,
                radiusKm,
                autoCloseDelayMs,
              );
            }
            return;
          }

          closeCoordPopup();

          if (recenter) {
            map.easeTo({
              center: [centerLng, centerLat],
              zoom: Math.max(map.getZoom(), 11),
              duration: 500,
            });
          }
        }

        async function zoomToClusterSpots(clusterId, fallbackCoords) {
          const src = map.getSource(SOURCE_ID);
          if (!src) return;

          try {
            const leaves = await src.getClusterLeaves(
              Number(clusterId),
              100,
              0,
            );

            if (Array.isArray(leaves) && leaves.length > 1) {
              const bounds = new maptilersdk.LngLatBounds();

              leaves.forEach((leaf) => {
                const coords = leaf?.geometry?.coordinates;
                if (
                  Array.isArray(coords) &&
                  typeof coords[0] === "number" &&
                  typeof coords[1] === "number"
                ) {
                  bounds.extend(coords);
                }
              });

              if (!bounds.isEmpty()) {
                map.fitBounds(bounds, {
                  padding: { top: 90, bottom: 90, left: 90, right: 90 },
                  maxZoom: 15,
                  duration: 650,
                });
                return;
              }
            }

            if (Array.isArray(leaves) && leaves.length === 1) {
              const onlyCoords = leaves[0]?.geometry?.coordinates;
              if (Array.isArray(onlyCoords)) {
                map.easeTo({
                  center: onlyCoords,
                  zoom: Math.max(map.getZoom(), 14),
                  duration: 520,
                });
                return;
              }
            }

            const zoom = await src.getClusterExpansionZoom(Number(clusterId));
            map.easeTo({
              center: fallbackCoords,
              zoom,
              duration: 520,
            });
          } catch (err) {
            console.error("Cluster zoom error:", err);

            try {
              const zoom = await src.getClusterExpansionZoom(Number(clusterId));
              map.easeTo({
                center: fallbackCoords,
                zoom,
                duration: 520,
              });
            } catch (fallbackErr) {
              console.error("Cluster fallback zoom error:", fallbackErr);
            }
          }
        }

        async function getStartupPreloadCenter() {
          if (typeof userLat === "number" && typeof userLng === "number") {
            return { lat: userLat, lng: userLng, source: "live" };
          }

          if (startupStoredLocation) {
            return {
              lat: startupStoredLocation.lat,
              lng: startupStoredLocation.lng,
              source: "stored",
            };
          }

          if (userLocationRequestPromise) {
            await Promise.race([
              userLocationRequestPromise.catch(() => false),
              wait(STARTUP_GPS_GRACE_MS),
            ]);
          }

          if (typeof userLat === "number" && typeof userLng === "number") {
            return { lat: userLat, lng: userLng, source: "live" };
          }

          return null;
        }

        async function preloadStartupRegion() {
          if (!mapLoaded || startupRegionLoaded) return false;

          const center = await getStartupPreloadCenter();
          if (!center) return false;

          startupRegionLoaded = true;
          setStartupProgress(0.46);

          if (center.source === "live") {
            syncUserMarker();
            initialNearbyLoaded = true;
          }

          map.jumpTo({
            center: [center.lng, center.lat],
            zoom: USER_START_ZOOM,
          });

          await fetchSpotsInRadius(
            center.lat,
            center.lng,
            STARTUP_PRELOAD_RADIUS_KM,
            {
              recenter: false,
              showEmptyPopup: false,
            },
          );

          setStartupProgress(0.74);

          // Start warming a larger set of nearby thumbnails. We only wait
          // briefly for them; any remaining image requests continue in cache
          // after the splash disappears.
          const imageWarmup = preloadStartupSpotImages(
            currentBaseSpotFeatures,
            center,
            STARTUP_THUMB_PREFETCH_LIMIT,
          );

          await Promise.race([imageWarmup, wait(KOVA_MOBILE_LIKE ? 320 : 500)]);
          setStartupProgress(0.92);

          return true;
        }

        async function maybeLoadInitialNearbySpots() {
          if (
            initialNearbyLoaded ||
            !mapLoaded ||
            typeof userLat !== "number" ||
            typeof userLng !== "number"
          ) {
            return;
          }

          initialNearbyLoaded = true;
          syncUserMarker();

          map.jumpTo({
            center: [userLng, userLat],
            zoom: USER_START_ZOOM,
          });

          await fetchSpotsInRadius(
            userLat,
            userLng,
            STARTUP_PRELOAD_RADIUS_KM,
            {
              recenter: false,
              showEmptyPopup: false,
            },
          );
        }

        async function refreshNearbyUserSpots() {
          if (
            typeof userLat !== "number" ||
            typeof userLng !== "number" ||
            !mapLoaded
          ) {
            return;
          }

          syncUserMarker();

          map.jumpTo({
            center: [userLng, userLat],
            zoom: USER_START_ZOOM,
          });

          await fetchSpotsInRadius(userLat, userLng, SEARCH_RADIUS_KM, {
            recenter: false,
            showEmptyPopup: false,
          });
        }

        function requestUserLocation() {
          if (!window.KovaDevice.geolocation) {
            return Promise.resolve(false);
          }

          return new Promise((resolve) => {
            window.KovaDevice.geolocation.getCurrentPosition(
              async (pos) => {
                userLng = pos.coords.longitude;
                userLat = pos.coords.latitude;
                rememberLastKovaLocation(userLat, userLng);

                // Do not log precise user coordinates.

                syncUserMarker();

                // During startup, the splash orchestration decides which
                // region to preload. After startup, a fresh GPS fix can refine
                // the map immediately.
                if (startupFinished) {
                  await maybeLoadInitialNearbySpots();
                }

                resolve(true);
              },
              (err) => {
                console.warn("KOVA location unavailable:", err.message);

                // No popup: KOVA stays usable without location.
                resolve(false);
              },
              {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000,
              },
            );
          });
        }

        if (window.KovaDevice.geolocation) {
          userMarkerEl = document.createElement("img");
          userMarkerEl.src = "./images/playericon.png";
          userMarkerEl.alt = "Current location";
          userMarkerEl.style.width = "28px";
          userMarkerEl.style.height = "28px";
          userMarkerEl.classList.add("player-marker");

          userMarker = new maptilersdk.Marker({
            element: userMarkerEl,
            anchor: "center",
          });

          ["click", "dblclick", "pointerdown", "touchstart"].forEach(
            (eventName) => {
              userMarkerEl.addEventListener(
                eventName,
                (ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                },
                { passive: false },
              );
            },
          );
        }

        initUserLocationFlow();

        document.addEventListener("click", async (e) => {
          const shareBtn = e.target.closest('[data-action="share-spot"]');
          if (shareBtn) {
            e.preventDefault();
            const lat = Number(shareBtn.dataset.lat), lng = Number(shareBtn.dataset.lng);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              try {
                await window.KovaDevice.share({ title: 'KOVA spot', text: 'Discover this spot with KOVA: https://www.kova.spot', url: 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lng });
              } catch (error) { if (!/cancel|abort/i.test(error.message || '')) console.warn('Sharing unavailable'); }
            }
            return;
          }
          const closeSpotBtn = e.target.closest("[data-action='close-spot']");
          if (closeSpotBtn) {
            e.preventDefault();
            e.stopPropagation();
            closeActiveSpotPopup({ animate: true });
            return;
          }

          const saveSpotBtn = e.target.closest("[data-action='save-spot']");
          if (saveSpotBtn) {
            e.preventDefault();
            e.stopPropagation();
            const spot = getSpotFromPopupCard(
              saveSpotBtn.closest(".kova-popup[data-spot-id]"),
            );
            if (!spot) return;
            if (isSpotSaved(spot.id)) removeSavedSpot(spot.id);
            else saveSpotLocally(spot);
            syncOpenPopupPersonalButtons();
            return;
          }

          const routeSpotBtn = e.target.closest(
            "[data-action='toggle-route-spot']",
          );
          if (routeSpotBtn) {
            e.preventDefault();
            e.stopPropagation();
            const spot = getSpotFromPopupCard(
              routeSpotBtn.closest(".kova-popup[data-spot-id]"),
            );
            if (!spot) return;
            if (isSpotInRoute(spot.id)) removeSpotFromRoute(spot.id);
            else {
              const result = addSpotToRoute(spot);
              if (!result.ok && result.reason === "full")
                window.alert(
                  `Your KOVA route can contain maximum ${KOVA_ROUTE_MAX_SPOTS} spots.`,
                );
            }
            syncOpenPopupPersonalButtons();
            return;
          }

          const navBtn = e.target.closest("[data-action='nav']");
          if (navBtn) {
            e.preventDefault();
            e.stopPropagation();
            const lat = Number(navBtn.getAttribute("data-lat"));
            const lng = Number(navBtn.getAttribute("data-lng"));
            openNavigation(lat, lng);
            return;
          }

          const addBtn = e.target.closest("[data-action='add-spot']");
          if (addBtn) {
            e.preventDefault();
            e.stopPropagation();
            const lat = Number(addBtn.getAttribute("data-lat"));
            const lng = Number(addBtn.getAttribute("data-lng"));

            const existingSpot = await findNearbyExistingSpot(
              lat,
              lng,
              DUPLICATE_BLOCK_RADIUS_M,
            );

            if (existingSpot) {
              showDuplicateSpotPopup(lat, lng, existingSpot);
              return;
            }

            await goAddSpot(lat, lng);
            return;
          }

          const showBtn = e.target.closest("[data-action='show-spots']");
          if (showBtn) {
            e.preventDefault();
            e.stopPropagation();

            const lat = Number(showBtn.getAttribute("data-lat"));
            const lng = Number(showBtn.getAttribute("data-lng"));
            const radiusKm =
              Number(showBtn.getAttribute("data-radius")) || SEARCH_RADIUS_KM;

            const popupEl = showBtn.closest(".maplibregl-popup");
            const noSpotsAutoCloseAt = Date.now() + 980;
            showSearchRadiusPulse(lng, lat, radiusKm);

            if (popupEl) {
              popupEl.classList.add("is-searching");
            }

            await fetchSpotsInRadius(lat, lng, radiusKm, {
              recenter: false,
              showEmptyPopup: true,
              noSpotsAutoCloseAt,
            });
            return;
          }
        });

        map.on("load", async () => {
          mapLoaded = true;

          map.addSource(SOURCE_ID, {
            type: "geojson",
            data: emptyGeoJSON(),
            cluster: true,
            clusterMaxZoom: 13,
            clusterRadius: 55,
          });

          setSpotsGeoJSON([]);

          map.addLayer({
            id: LAYER_CLUSTERS_X,
            type: "symbol",
            source: SOURCE_ID,
            filter: ["has", "point_count"],
            layout: {
              "text-field": "X",
              "text-font": ["Open Sans Bold"],
              "text-size": [
                "step",
                ["get", "point_count"],
                22,
                10,
                24,
                25,
                26,
                75,
                29,
                200,
                33,
              ],
              "text-offset": [0, 0],
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            },
            paint: {
              "text-color": "rgba(139, 113, 8, 1)",
            },
          });

          map.addLayer({
            id: LAYER_CLUSTERS_COUNT,
            type: "symbol",
            source: SOURCE_ID,
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-font": ["Open Sans Bold"],
              "text-size": [
                "step",
                ["get", "point_count"],
                11,
                10,
                12,
                25,
                13,
                75,
                14,
                200,
                15,
              ],
              "text-offset": [0.72, 0.08],
              "text-anchor": "left",
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            },
            paint: {
              "text-color": "#ffffff",
            },
          });

          map.addLayer({
            id: LAYER_POINTS,
            type: "symbol",
            source: SOURCE_ID,
            filter: ["!", ["has", "point_count"]],
            layout: {
              "text-field": "X",
              "text-font": ["Open Sans Bold"],
              "text-size": 22,
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            },
            paint: {
              "text-color": [
                "match",
                ["get", "type"],
                "water",
                "#3B82C4",
                "nature",
                "#4E7D4A",
                "urban",
                "#8B7108",
                "#8B7108",
              ],
            },
          });

          map.on("mouseenter", LAYER_POINTS, () => {
            map.getCanvas().style.cursor = "pointer";
          });

          map.on("mouseleave", LAYER_POINTS, () => {
            map.getCanvas().style.cursor = "";
          });

          map.on("mouseenter", LAYER_CLUSTERS_X, () => {
            map.getCanvas().style.cursor = "pointer";
          });

          map.on("mouseleave", LAYER_CLUSTERS_X, () => {
            map.getCanvas().style.cursor = "";
          });

          map.on("mouseenter", LAYER_CLUSTERS_COUNT, () => {
            map.getCanvas().style.cursor = "pointer";
          });

          map.on("mouseleave", LAYER_CLUSTERS_COUNT, () => {
            map.getCanvas().style.cursor = "";
          });

          map.on("click", LAYER_CLUSTERS_X, async (e) => {
            const feature = e.features?.[0];
            if (!feature) return;

            const clusterId = Number(feature.properties?.cluster_id);
            if (!Number.isFinite(clusterId)) return;

            closeCoordPopup();
            closeUserPopup();

            if (activePopup) closeActiveSpotPopup();

            const coords = feature.geometry.coordinates;
            await zoomToClusterSpots(clusterId, coords);
          });

          map.on("click", LAYER_CLUSTERS_COUNT, async (e) => {
            const feature = e.features?.[0];
            if (!feature) return;

            const clusterId = Number(feature.properties?.cluster_id);
            if (!Number.isFinite(clusterId)) return;

            closeCoordPopup();
            closeUserPopup();

            if (activePopup) closeActiveSpotPopup();

            const coords = feature.geometry.coordinates;
            await zoomToClusterSpots(clusterId, coords);
          });

          map.on("click", LAYER_POINTS, async (e) => {
            const f = e.features?.[0];
            if (!f) return;

            closeCoordPopup();
            closeUserPopup();

            if (activePopup) {
              closeActiveSpotPopup({ animate: false });
            }

            const coords = f.geometry.coordinates;
            const props = { ...(f.properties || {}) };

            props.id = String(props.id || "");
            props.lat = Number(props.lat);
            props.lng = Number(props.lng);
            props.avgRating = Number(props.avgRating || 0);
            props.ratingCount = Number(props.ratingCount || 0);

            const popup = new maptilersdk.Popup({
              offset: 18,
              maxWidth: "620px",
              closeButton: true,
              closeOnClick: false,
              className: "spot-sheet-popup",
            })
              .setLngLat(coords)
              .setHTML(makeSpotPopupHTML(props))
              .addTo(map);

            activePopup = popup;
            attachPopupImageLoader(popup);
            attachMobileSheetGestures(popup);
            updateFooterVisibility();

            easeToSpotWithPopupSpace(coords[0], coords[1]);

            popup.once("close", () => {
              if (activePopup === popup) activePopup = null;
              updateFooterVisibility();
            });

            await hydratePopupData(popup, props);
          });

          setStartupProgress(0.34);

          try {
            const didPreloadRegion = await preloadStartupRegion();

            if (!didPreloadRegion) {
              setStartupProgress(0.82);
            }
          } catch (err) {
            console.warn("KOVA startup preload failed:", err);
            setStartupProgress(0.86);
          } finally {
            updateFooterVisibility();
            await finishStartupSplash();

            // If GPS became available while a stored region was preloading,
            // refine to the real current region after the map is visible.
            if (
              !initialNearbyLoaded &&
              typeof userLat === "number" &&
              typeof userLng === "number"
            ) {
              maybeLoadInitialNearbySpots().catch((err) =>
                console.warn("KOVA live-region refresh failed:", err),
              );
            }
          }
        });

        map.on("dragstart", closeAll);

        map.on("movestart", () => {
          document.body.classList.add("kova-map-moving");
          cancelScheduledSpotImagePrefetch();
        });

        map.on("moveend", () => {
          document.body.classList.remove("kova-map-moving");
          scheduleSpotImagePrefetch(currentBaseSpotFeatures);
        });

        let longPressTimer = null;
        let longPressVisualTimer = null;
        let longPressPointer = null;
        let suppressNextMapClick = false;

        const LONG_PRESS_MS = 650;
        const LONG_PRESS_VISUAL_DELAY_MS = 220;
        const LONG_PRESS_MOVE_TOLERANCE_PX = 24;

        function needsLongPressForMapSearch() {
          return window.matchMedia("(pointer: coarse), (hover: none)").matches;
        }

        function isMapOverlayTarget(target) {
          return (
            target &&
            (target.closest(".player-marker") ||
              target.closest(".user-popup-card") ||
              target.closest(".user-map-popup") ||
              target.closest(".maplibregl-popup") ||
              target.closest(".kova-tutorial") ||
              target.closest(".kova-library-overlay") ||
              target.closest(".kova-feed-overlay") ||
              target.closest(".kova-search-overlay") ||
              target.closest("nav"))
          );
        }

        function normalizePoint(point) {
          if (!point) return null;
          if (Array.isArray(point)) return point;
          return [point.x, point.y];
        }

        function getSpotHitsAtPoint(point) {
          if (!mapLoaded || !map.getLayer(LAYER_POINTS)) return [];

          try {
            return map.queryRenderedFeatures(normalizePoint(point), {
              layers: [LAYER_CLUSTERS_X, LAYER_CLUSTERS_COUNT, LAYER_POINTS],
            });
          } catch (err) {
            console.warn("Spot hit test failed:", err);
            return [];
          }
        }

        function clearMapPopupsForSearch() {
          closeUserPopup();

          if (activePopup) closeActiveSpotPopup();

          if (activeCoordPopup) {
            activeCoordPopup.remove();
            activeCoordPopup = null;
          }
        }

        function showSearchPopupAt(lng, lat) {
          clearMapPopupsForSearch();
          placeClickPin(lng, lat);

          const popupHTML = `
            <div class="coord-popup coord-popup-search compact-search">
              <div class="btn-row single">
                <button class="primary search-cta" data-action="show-spots" data-lat="${lat}" data-lng="${lng}" data-radius="${SEARCH_RADIUS_KM}">
                  Search spots here
                </button>
              </div>
            </div>
          `;

          activeCoordPopup = new maptilersdk.Popup({
            offset: 18,
            closeButton: true,
            closeOnClick: false,
            maxWidth: "320px",
            className: "coord-map-popup",
          })
            .setLngLat([lng, lat])
            .setHTML(popupHTML)
            .addTo(map);

          updateFooterVisibility();

          activeCoordPopup.once("close", () => {
            activeCoordPopup = null;
            removeClickPin();
            updateFooterVisibility();
          });
        }

        map.on("click", async (event) => {
          if (suppressNextMapClick) {
            suppressNextMapClick = false;
            return;
          }

          if (needsLongPressForMapSearch()) return;

          const target = event.originalEvent?.target;
          if (isMapOverlayTarget(target)) return;

          const hits = getSpotHitsAtPoint(event.point);
          if (hits && hits.length) return;

          if (activePopup && closeActiveSpotPopup({ animate: true })) return;

          const { lng, lat } = event.lngLat;
          showSearchPopupAt(lng, lat);
        });

        const mapContainer = map.getContainer();
        const mapCanvas = map.getCanvas();
        let longPressIndicator = null;
        let searchRadiusPulseEl = null;

        function ensureLongPressIndicator() {
          if (longPressIndicator) return longPressIndicator;

          const el = document.createElement("div");
          el.className = "long-press-indicator";
          el.innerHTML =
            '<div class="long-press-ring"></div><div class="long-press-core"></div><div class="long-press-hint">Hold to search</div>';
          mapContainer.appendChild(el);
          longPressIndicator = el;
          return el;
        }

        function showLongPressIndicator(point) {
          const el = ensureLongPressIndicator();
          el.style.left = point.x + "px";
          el.style.top = point.y + "px";
          el.style.setProperty("--long-press-ms", LONG_PRESS_MS + "ms");
          el.classList.toggle("hint-below", point.y < 110);
          el.classList.remove("ready");
          void el.offsetWidth;
          el.classList.add("show");
        }

        function flashLongPressIndicator(point) {
          const el = ensureLongPressIndicator();
          el.style.left = point.x + "px";
          el.style.top = point.y + "px";
          el.classList.toggle("hint-below", point.y < 110);
          el.classList.add("show", "ready");
          window.setTimeout(() => {
            if (!longPressIndicator) return;
            longPressIndicator.classList.remove("show", "ready");
          }, 260);
        }

        function hideLongPressIndicator() {
          if (!longPressIndicator) return;
          longPressIndicator.classList.remove("show", "ready");
        }

        let searchRadiusAnimationFrame = null;
        let searchRadiusHideTimer = null;

        function ensureSearchRadiusPulse() {
          if (!mapLoaded) return null;

          if (!map.getSource(SEARCH_RADIUS_SOURCE_ID)) {
            map.addSource(SEARCH_RADIUS_SOURCE_ID, {
              type: "geojson",
              data: emptyGeoJSON(),
            });
          }

          if (!map.getLayer(SEARCH_RADIUS_FILL_LAYER)) {
            map.addLayer(
              {
                id: SEARCH_RADIUS_FILL_LAYER,
                type: "fill",
                source: SEARCH_RADIUS_SOURCE_ID,
                paint: {
                  "fill-color": "rgba(139, 113, 8, 1)",
                  "fill-opacity": 0.11,
                },
              },
              map.getLayer(LAYER_CLUSTERS_X) ? LAYER_CLUSTERS_X : undefined,
            );
          }

          if (!map.getLayer(SEARCH_RADIUS_LINE_LAYER)) {
            map.addLayer(
              {
                id: SEARCH_RADIUS_LINE_LAYER,
                type: "line",
                source: SEARCH_RADIUS_SOURCE_ID,
                paint: {
                  "line-color": "rgba(214, 177, 62, 0.95)",
                  "line-width": 1.5,
                  "line-opacity": 0.72,
                },
              },
              map.getLayer(LAYER_CLUSTERS_X) ? LAYER_CLUSTERS_X : undefined,
            );
          }

          return map.getSource(SEARCH_RADIUS_SOURCE_ID);
        }

        function makeRadiusCircleGeoJSON(
          centerLng,
          centerLat,
          radiusKm,
          steps = KOVA_MOBILE_LIKE ? 64 : 96,
        ) {
          if (!Number.isFinite(centerLng) || !Number.isFinite(centerLat)) {
            return emptyGeoJSON();
          }

          const earthRadiusKm = 6371.0088;
          const angularDistance = radiusKm / earthRadiusKm;
          const lat1 = toRad(centerLat);
          const lng1 = toRad(centerLng);
          const coords = [];

          for (let i = 0; i <= steps; i++) {
            const bearing = (2 * Math.PI * i) / steps;
            const lat2 = Math.asin(
              Math.sin(lat1) * Math.cos(angularDistance) +
                Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
            );
            const lng2 =
              lng1 +
              Math.atan2(
                Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
                Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
              );

            coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
          }

          return {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [coords],
                },
                properties: {},
              },
            ],
          };
        }

        function easeOutCubic(t) {
          return 1 - Math.pow(1 - t, 3);
        }

        function showSearchRadiusPulse(lng, lat, radiusKm = SEARCH_RADIUS_KM) {
          const src = ensureSearchRadiusPulse();
          if (!src) return;

          if (searchRadiusAnimationFrame) {
            window.cancelAnimationFrame(searchRadiusAnimationFrame);
            searchRadiusAnimationFrame = null;
          }

          if (searchRadiusHideTimer) {
            window.clearTimeout(searchRadiusHideTimer);
            searchRadiusHideTimer = null;
          }

          const targetRadiusKm = Number(radiusKm) || SEARCH_RADIUS_KM;
          const duration = 560;
          const start = performance.now();
          const minFrameInterval = KOVA_MOBILE_LIKE ? 32 : 16;
          let lastDrawAt = 0;

          function frame(now) {
            const progress = Math.min(1, (now - start) / duration);

            if (progress < 1 && now - lastDrawAt < minFrameInterval) {
              searchRadiusAnimationFrame = window.requestAnimationFrame(frame);
              return;
            }

            lastDrawAt = now;
            const animatedRadiusKm = Math.max(
              0.08,
              targetRadiusKm * easeOutCubic(progress),
            );
            src.setData(makeRadiusCircleGeoJSON(lng, lat, animatedRadiusKm));

            if (progress < 1) {
              searchRadiusAnimationFrame = window.requestAnimationFrame(frame);
              return;
            }

            src.setData(makeRadiusCircleGeoJSON(lng, lat, targetRadiusKm));
            searchRadiusAnimationFrame = null;
            searchRadiusHideTimer = window.setTimeout(() => {
              const liveSource = map.getSource(SEARCH_RADIUS_SOURCE_ID);
              if (liveSource) liveSource.setData(emptyGeoJSON());
            }, 420);
          }

          src.setData(makeRadiusCircleGeoJSON(lng, lat, 0.08));
          searchRadiusAnimationFrame = window.requestAnimationFrame(frame);
        }

        function clearLongPressTimer() {
          if (longPressTimer) {
            window.clearTimeout(longPressTimer);
            longPressTimer = null;
          }

          if (longPressVisualTimer) {
            window.clearTimeout(longPressVisualTimer);
            longPressVisualTimer = null;
          }

          longPressPointer = null;
          hideLongPressIndicator();
        }

        function getPointFromClient(clientX, clientY) {
          const rect = mapCanvas.getBoundingClientRect();
          return {
            x: clientX - rect.left,
            y: clientY - rect.top,
          };
        }

        function pointIsInsideMap(point) {
          if (!point) return false;
          return (
            point.x >= 0 &&
            point.y >= 0 &&
            point.x <= mapCanvas.clientWidth &&
            point.y <= mapCanvas.clientHeight
          );
        }

        function startLongPress(event) {
          if (!needsLongPressForMapSearch()) return;
          if (event.pointerType && event.pointerType === "mouse") return;
          if (event.isPrimary === false) return;
          if (isMapOverlayTarget(event.target)) return;

          const point = getPointFromClient(event.clientX, event.clientY);
          if (!pointIsInsideMap(point)) return;

          const hits = getSpotHitsAtPoint(point);
          if (hits && hits.length) return;

          clearLongPressTimer();

          longPressPointer = {
            id: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
            point,
            lngLat: map.unproject([point.x, point.y]),
          };

          longPressVisualTimer = window.setTimeout(() => {
            if (!longPressPointer) return;
            showLongPressIndicator(longPressPointer.point);
          }, LONG_PRESS_VISUAL_DELAY_MS);

          longPressTimer = window.setTimeout(() => {
            if (!longPressPointer) return;

            const lngLat = longPressPointer.lngLat;
            suppressNextMapClick = true;

            if (navigator.vibrate) {
              try {
                navigator.vibrate(10);
              } catch (e) {}
            }

            flashLongPressIndicator(longPressPointer.point);
            showSearchPopupAt(lngLat.lng, lngLat.lat);
            clearLongPressTimer();

            window.setTimeout(() => {
              suppressNextMapClick = false;
            }, 900);
          }, LONG_PRESS_MS);
        }

        function moveLongPress(event) {
          if (!longPressPointer) return;
          if (event.pointerId !== longPressPointer.id) return;

          const dx = Math.abs(event.clientX - longPressPointer.clientX);
          const dy = Math.abs(event.clientY - longPressPointer.clientY);

          if (
            dx > LONG_PRESS_MOVE_TOLERANCE_PX ||
            dy > LONG_PRESS_MOVE_TOLERANCE_PX
          ) {
            clearLongPressTimer();
          }
        }

        function endLongPress(event) {
          if (!longPressPointer) return;
          if (event.pointerId !== longPressPointer.id) return;
          clearLongPressTimer();
        }

        if (window.PointerEvent) {
          mapContainer.addEventListener("pointerdown", startLongPress, {
            passive: true,
            capture: true,
          });

          mapContainer.addEventListener("pointermove", moveLongPress, {
            passive: true,
            capture: true,
          });

          mapContainer.addEventListener("pointerup", endLongPress, {
            passive: true,
            capture: true,
          });

          mapContainer.addEventListener("pointercancel", endLongPress, {
            passive: true,
            capture: true,
          });
        } else {
          mapContainer.addEventListener(
            "touchstart",
            (event) => {
              if (!needsLongPressForMapSearch()) return;
              if (event.touches.length !== 1) {
                clearLongPressTimer();
                return;
              }

              if (isMapOverlayTarget(event.target)) return;

              const touch = event.touches[0];
              const point = getPointFromClient(touch.clientX, touch.clientY);
              if (!pointIsInsideMap(point)) return;

              const hits = getSpotHitsAtPoint(point);
              if (hits && hits.length) return;

              clearLongPressTimer();

              longPressPointer = {
                id: "touch",
                clientX: touch.clientX,
                clientY: touch.clientY,
                point,
                lngLat: map.unproject([point.x, point.y]),
              };

              longPressVisualTimer = window.setTimeout(() => {
                if (!longPressPointer) return;
                showLongPressIndicator(longPressPointer.point);
              }, LONG_PRESS_VISUAL_DELAY_MS);

              longPressTimer = window.setTimeout(() => {
                if (!longPressPointer) return;

                const lngLat = longPressPointer.lngLat;
                suppressNextMapClick = true;

                if (navigator.vibrate) {
                  try {
                    navigator.vibrate(10);
                  } catch (e) {}
                }

                flashLongPressIndicator(longPressPointer.point);
                showSearchPopupAt(lngLat.lng, lngLat.lat);
                clearLongPressTimer();

                window.setTimeout(() => {
                  suppressNextMapClick = false;
                }, 900);
              }, LONG_PRESS_MS);
            },
            { passive: true, capture: true },
          );

          mapContainer.addEventListener(
            "touchmove",
            (event) => {
              if (!longPressPointer || !event.touches.length) return;

              const touch = event.touches[0];
              const dx = Math.abs(touch.clientX - longPressPointer.clientX);
              const dy = Math.abs(touch.clientY - longPressPointer.clientY);

              if (
                dx > LONG_PRESS_MOVE_TOLERANCE_PX ||
                dy > LONG_PRESS_MOVE_TOLERANCE_PX
              ) {
                clearLongPressTimer();
              }
            },
            { passive: true, capture: true },
          );

          mapContainer.addEventListener("touchend", clearLongPressTimer, {
            passive: true,
            capture: true,
          });

          mapContainer.addEventListener("touchcancel", clearLongPressTimer, {
            passive: true,
            capture: true,
          });
        }

        updateFooterVisibility();
      });
    