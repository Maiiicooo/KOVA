# KOVA Android-audit — 14 september 2026

## Uitgangssituatie

- Statische webapp zonder bundler of webbuild-script. `www` was een verouderde kopie: onder andere de huidige opgeslagen-spots/route-interface en wijzigingen in het toevoegen van spots ontbraken.
- Capacitor core/android/cli 8.5.0; alleen Geolocation 8.2.2 geïnstalleerd. De webcode gebruikte uitsluitend `navigator.geolocation`, dus de native plugin werd niet aangeroepen.
- Bestaande Android-ID `app.kova.spot`, door de gebruiker expliciet bevestigd. `kova.spot` uit de oorspronkelijke opdracht is daarom niet toegepast.
- Java 21, Gradle 8.14.3, Android Gradle Plugin 8.13.0, minSdk 24 en compile/targetSdk 36. Geen major-migratie nodig.
- Standaard Capacitor-iconen en splash; geen handling van native terugknop, netwerkstatus of fotoherstel.
- De bestaande instrumentatietest verwachtte ten onrechte `com.getcapacitor.app`; eerder in deze sessie gecorrigeerd.
- Reeds aanwezige lokale Android Studio-/VS Code-wijzigingen zijn buiten deze aanpassingen gehouden.

## Packages en keuzes

| Package | Keuze |
| --- | --- |
| `@capacitor/core`, `@capacitor/android`, `@capacitor/cli` | Uitgelijnd op 8.5.2; lockfile legt de versies vast |
| `@capacitor/geolocation` | 8.2.2 behouden; aangesloten op alle bestaande locatieaanroepen |
| `@capacitor/app` | Terugknop, hervatten, onderbroken fotoresultaten |
| `@capacitor/network` | Beginstatus, online/offline-events en zichtbare melding |
| `@capacitor/preferences` | Alleen tijdelijk native fotoformulierherstel; geen migratie van localStorage of Firestore |
| `@capacitor/splash-screen` | Donkere start, automatisch vangnet en verbergen na eerste DOM-render |
| `@capacitor/share` | Native delen vanuit een spotkaart |
| `@capacitor/browser` | HTTPS-links buiten de app in een browservenster |
| `@capacitor/keyboard` | Zichtbaar houden van het actieve invoerveld na openen toetsenbord |
| `@capacitor/camera` | Moderne `takePhoto` / `chooseFromGallery`; bestaande file-input/upload blijft werken |
| `@capacitor/status-bar` | Niet geïnstalleerd: ingebouwde v8 SystemBars beheert beide systeembalken |
| `@capacitor/filesystem` | Niet geïnstalleerd: nog geen offline-bestandsopslag; foto's gaan via de bestaande upload |
| `@capacitor/haptics` | Niet geïnstalleerd: geen huidige functie die dit vereist |
| `@capacitor/assets` | Dev-tool 3.0.5; dit versienummer staat los van Capacitor-runtime v8 |

Toegevoegde pluginversies: App 8.1.1, Browser 8.0.4, Camera 8.2.4, Keyboard 8.0.5, Network 8.0.1, Preferences 8.0.1, Share 8.0.1 en SplashScreen 8.0.2. De compatibele npm-auditfix heeft ook de bestaande Node-beheertool `firebase-admin` in de lockfile van 14.3.0 naar 14.4.0 bijgewerkt; de Firebase-web-SDK en applicatiecode zijn niet gemigreerd. Sharp blijft 0.35.4.

De assetgenerator vraagt upstream nog CLI 5 en sharp 0.32 aan. Gerichte npm-overrides laten hem de root-CLI v8 en sharp 0.35.4 gebruiken. Dit voorkomt een tweede Capacitor-major en verwijdert de daarbij meegekomen hoge/kritieke auditmeldingen. De Android-assetgeneratie is met deze overrides uitgevoerd. Er is geen native maps-SDK toegevoegd; alle kaarten blijven MapTiler. Bestaande Google/Apple Maps-routeknoppen blijven externe navigatielinks.

## Webbuild en native integratie

`npm run build` kopieert de actuele publieke bronbestanden naar `www` en controleert lokale verwijzingen. Adminpagina's, Firebase-beheerscripts, node_modules en credentials worden niet via de publieke allowlist opgenomen. Het officiële lokale Capacitor JS-clientbestand wordt vóór de device-adapter gezet in de Android-kopie. Android injecteert zelf het native transport; alleen dat transport is niet voldoende voor `registerPlugin`.

`assets/js/device.js` is de gedeelde adapter. Op de gewone website blijft geolocation de browser-API. Android gebruikt permission checks en native Geolocation, accepteert benaderende locatie en vertaalt weigering, uitgeschakelde locatiediensten, timeout en ontbrekende positie naar bruikbare foutmeldingen. De kaart blijft zonder GPS bruikbaar. Er is geen achtergrondlocatie of doorlopende GPS-watch.

Netwerkstatus staat op `window.KovaDevice.network` en wordt gepubliceerd als `kova:network-change`. Dit is voorbereiding voor offline-functionaliteit, geen offline-kaartcache. Kaartlagen, Firebase en externe scripts hebben momenteel internet nodig.

De terugknop sluit eerst een geopende tutorial, bibliotheek, zoekscherm, feed, menu of popup. Daarna gaat hij terug in de WebView-geschiedenis. Op de startpagina zonder teruggeschiedenis wordt de app geminimaliseerd, niet abrupt beëindigd.

Foto's worden teruggezet in dezelfde HTML-file-input, zodat de bestaande preview, compressie en Firebase Storage-upload behouden blijven. Annuleren/fouten maken de bediening opnieuw beschikbaar. Preferences bewaart tijdelijk niet-geheime formuliervelden voor `appRestoredResult`; bij een niet-herstelbare onderbreking wordt opnieuw kiezen gevraagd. Er is geen stilzwijgende upload. Wachtwoorden worden niet opgeslagen.

## Android-configuratie

- Alleen `INTERNET` (MapTiler/Firebase), `ACCESS_NETWORK_STATE` (netwerkstatus), `ACCESS_COARSE_LOCATION` en `ACCESS_FINE_LOCATION` (optionele locatie).
- AndroidX voegt daarnaast automatisch `app.kova.spot.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` toe: een interne signature-permission voor afgeschermde receivers, geen extra gebruikersrecht of toegang tot toesteldata.
- Geen achtergrondlocatie, CAMERA, READ/WRITE_EXTERNAL_STORAGE of brede mediarechten toegevoegd. Camera gebruikt de systeemcamera met `saveToGallery: false`; fotoselectie gebruikt de picker, met documentkiezer-fallback op oudere toestellen. [Officiële Camera-documentatie](https://capacitorjs.com/docs/apis/camera).
- Cleartext uit; mixed content niet toegestaan; geen `server.url`, custom hostname of live-reloadconfiguratie.
- De interne oorsprong `https://localhost` is onderdeel van Capacitor's lokale assetserver, geen ontwikkelserver. Deze verwijderen of willekeurig veranderen kan secure-context-API's en bestaande WebView-opslag verstoren. Dit staat los van externe development-URLs. [Capacitor-configuratie](https://capacitorjs.com/docs/config).
- Android-backup uitgeschakeld voor lokale WebView-/formuliergegevens.
- Donkere launch-achtergrond en donker WebView-achtergrondvlak; bestaande KOVA-websplash behouden.
- SystemBars gebruikt lichte symbolen op donkere achtergrond. De bestaande viewport heeft bewust geen `viewport-fit=cover`; Capacitor 8 past dan op Android 15+ native insets toe. Geen tweede CSS-padding die content dubbel verschuift. Op oudere Android-versies blijft de gewone vensterinpassing actief. [SystemBars](https://capacitorjs.com/docs/apis/system-bars).
- `adjustResize` plus SystemBars/IME-insets en scroll naar het actieve veld. Geen verouderde statusbar-overlay-opt-out. [Keyboard](https://capacitorjs.com/docs/apis/keyboard).

## Iconen en splash

Het bestaande `images/kova_alleen_x_png.png` (1706 × 1949) is als bron hergebruikt. De officiële generator schaalt het naar Android-iconen en lichte/donkere splashvarianten; geen nieuw logo getekend. `npm run assets:android` maakt dit reproduceerbaar. Er ontbreekt hiervoor geen bronbestand. Voor volledig handmatig aangeleverde alternatieven verwacht de tool minimaal 1024 × 1024 voor icon-only/foreground/background en 2732 × 2732 voor splash. [Assetdocumentatie](https://capacitorjs.com/docs/guides/splash-screens-and-icons).

## Firebase en security: nog te valideren vóór publicatie

De bestaande Firebase Auth/Firestore/Storage-webcode en MapTiler-integratie zijn behouden. Firebase-clientconfiguratie en publieke MapTiler-tokens zijn zichtbaar in een webapp; een `.env` maakt zulke clienttokens niet geheim. Er zijn geen serviceaccount-private keys aangetroffen in de gecontroleerde publieke bronbestanden. De build neemt de servertools niet op. [Firebase API keys](https://firebase.google.com/docs/projects/api-keys).

Er zijn concrete release-aandachtspunten die niet met een lokale Android-build kunnen worden afgevinkt:

1. `firebase/rules.txt` bevat twee alternatieve, achter elkaar geplakte rulesets, waarvan de eerste publieke schrijfrechten toestaat. Dit is geen gecontroleerde production-regelset. De werkelijk gedeployde Firestore- en Storage-regels moeten in Firebase worden gecontroleerd; geen regels zijn door deze taak gedeployd.
2. De kaart gebruikt reCAPTCHA Enterprise App Check. Toegestane domeinen, API-keyrestricties en App Check-enforcement moeten passen bij de WebView-origin. Een native app is niet automatisch een geldig web-reCAPTCHA-client. Test echte tokenuitgifte en Firestore-verzoeken op het toestel. Zet enforcement niet simpelweg uit en zet geen App Check-debugtoken in een release. Als de webprovider niet bruikbaar blijkt, is een expliciete native-attestatie/custom-providerintegratie nodig. [Firebase web App Check](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).
3. `firebase/cors.json` gebruikt brede origins/methodes; de gedeployde Storage-CORS en Firebase/MapTiler-keyrestricties zijn niet lokaal verifieerbaar. CORS vervangt geen toegangsregels.
4. npm kan resterende gematigde meldingen rapporteren in Node-/CLI-tooling. Gebruik `npm audit` voor de lockfile-status; force-upgrades van backendtools of overrides van willekeurige majors zijn niet toegepast. Deze Node-packages worden niet in de APK-webassets gebundeld.
5. Een ondertekende release, Play Console-instellingen en echte toesteltests ontbreken nog. Daarom is dit een voorbereide Android-setup, geen onvoorwaardelijke productie-goedkeuring.

## Android Studio en Samsung XCover7

Open de map `android` in Android Studio. Gebruik Gradle JDK 21 en installeer SDK Platform 36 als Studio daarom vraagt. Laat Gradle synchroniseren, selecteer module `app` en daarna het toestel. Voor iedere webwijziging eerst `npm run cap:sync`; Android Studio bouwt anders de laatst gekopieerde webassets.

Het minimum API 24 sluit de XCover7 niet uit. Het model is uitgebracht met Android 14; Samsung publiceert inmiddels ook Android 16-firmware. Test op de werkelijk geïnstalleerde firmware en WebView-versie, inclusief gebaren- en drietoetsnavigatie. De actuele toestelversie kon niet uitgelezen worden zolang ADB `unauthorized` meldt. [Samsung specificaties](https://news.samsung.com/global/introducing-the-galaxy-xcover7-galaxy-tab-active5-the-perfect-blend-of-durability-work-continuity-and-productivity-for-todays-enterprises), [Samsung updates](https://doc.samsungmobile.com/SM-G556B/028601240126/fra.html).

Toestelcontrole: koude start, kaart/spot openen, precieze en benaderende locatie, weigeren, GPS uit, timeout, terug vanuit alle overlays, vliegtuigmodus en herstel, laagste formulierveld met toetsenbord, foto kiezen/annuleren/maken, delen, externe route en Firebase lezen/inloggen/uploaden. Uploadtests veranderen live data en moeten herkenbare testinhoud gebruiken. Met Android Studio “Don't keep activities” of geheugenbelasting ook fotoherstel controleren.

Voor publicatie: **Build > Generate Signed Bundle / APK**, eigen release/upload-key gebruiken en veilig bewaren. Geen signing secrets in Git. Deze taak genereert geen productiekey en publiceert niets.

## Commando's

```text
npm install
npm run build
npm test
npm run cap:sync
npm run cap:doctor
npm run android:open
npm run android:run
npm run assets:android
```

Vanuit `android`, met SDK-pad via Android Studio/local.properties of ANDROID_HOME:

```text
.\gradlew.bat :app:assembleDebug :app:testDebugUnitTest :app:lintDebug :app:assembleDebugAndroidTest
```

De debug-APK komt in `android/app/build/outputs/apk/debug/app-debug.apk`. Instrumentatietests compileren is niet hetzelfde als ze uitvoeren op een toestel.

## Uitgevoerde eindcontroles

- Webbuild en 308 controles van lokale bestandsverwijzingen geslaagd.
- 14 Node-tests geslaagd: browserfallback, geweigerde/benaderende locatie, GPS uit, timeout, ontbrekende positie, terugknop, netwerkstatus, veilige browserlinks, echte Capacitor JS-client boven gemockt Android-transport, fotokiezer en camera-annulering. Dit zijn adaptertests, geen bewijs van een echte GPS-fix of werkende Samsung-camera.
- De JavaScript-bestanden en inline scripts van de gecontroleerde app-/webpagina's zijn op syntax gecontroleerd.
- Capacitor sync en doctor geslaagd; dependencyboom gecontroleerd: uitsluitend v8 voor core/CLI/Android/officiële runtimeplugins.
- `assembleDebug`, `testDebugUnitTest`, `lintDebug`, `assembleDebugAndroidTest` en `processReleaseManifest` geslaagd. De bestaande Java-unit-test is een template-test; de instrumentatietest is alleen gecompileerd.
- Debug-APK gegenereerd; release-manifest bevat geen debug-vlag en staat geen cleartext toe. Geen release ondertekend of gepubliceerd.
- Android lint: **0 fouten, 31 waarschuwingen**. Verdeling: 1 nieuwere AppCompat beschikbaar, 1 overbodige v24-resourcemap, 8 ongebruikte templateresources, 6 legacy-launchervormmeldingen, 2 splash-dichtheidsmeldingen, 12 dubbele lichte/donkere splashvarianten, 1 bitmap in een map zonder dichtheid. De adaptive iconen hebben ook een monochrome-laag. De officiële generator levert dezelfde splash voor beide thema's omdat KOVA bewust één donker ontwerp gebruikt. Deze waarschuwingen zijn niet onderdrukt; resterende vorm-/schaalcontrole hoort bij de toesteltest. Bestaande templateresources zijn niet onnodig verwijderd.
- Gradle meldt de bestaande `flatDir`-repositories; de officiële Camera-plugin meldt een altijd-false Kotlin-conditie en unchecked Java-operaties. Dit zijn waarschuwingen in gegenereerde/upstream-code, geen compileerfouten. Geen node_modules-broncode gepatcht.
- `npm audit --omit=dev`: **0 meldingen**. Volledige audit: **5 gematigde meldingen**, via uuid/xcode in CLI/assettooling; geen hoge/kritieke meldingen. Geen geforceerde CLI-downgrade toegepast.
- ADB ziet het aangesloten toestel als **unauthorized**. Installatie, echte locatie, Firebase App Check, keyboard/insets, camera en Samsung-gedrag zijn daarom niet op het toestel geverifieerd.

Belangrijkste gewijzigde bestanden: `package.json`/lockfile, `capacitor.config.json`, AndroidManifest/theme/backupregels, gegenereerde Android-pluginconfiguratie en iconen, `assets/js/device.js`, `assets/css/device.css`, `assets/js/index.js`, scriptverwijzingen in bestaande app-/webpagina's, `scripts/build-web.js`, `scripts/android-assets.js`, `tests/device.test.cjs`, README en de gegenereerde `www`-kopie.
