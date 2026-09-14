What is KOVA?

KOVA is a digital outdoor utility focused on discovering chill spots and providing weather information for hikers and adventurers. It’s an app/website that combines map data with local spots and weather updates, helping users plan their outings smarter and more enjoyably.

Why KOVA?

The idea behind KOVA comes from personal experience: many great outdoor spots are hard to find, and the weather can suddenly change everything. KOVA brings these two elements together: spots and weather.

Purpose of KOVA

Spot discovery: users can add, view, and explore chill spots via an easy-to-use map.

Weather utility: real-time weather information to plan your trips and activities effectively.

User-friendly and clear: everything in one interface, without distractions.

Community-driven: spots are submitted by users and only become visible after approval, ensuring quality and reliability.

Vision

KOVA aims to make outdoor experiences more accessible. Not just following routes, but finding the places you really want to be, with confidence in the weather and a safe, pleasant environment. It’s a combination of exploration, convenience, and reliable information.

## Mappenstructuur

```text
KOVA/
|-- index.html          Website-startpagina
|-- assets/
|   |-- css/            Stylesheets van de website
|   `-- js/             JavaScript van de website
|-- images/             Afbeeldingen en iconen
|-- spot/               Foto's van spots
|-- app/                App-pagina's en API-code
|-- web/                Webpagina's, aanmelden en bijdragen
|-- admin/              Beheerpagina's en authenticatie
|-- firebase/           Firebase-code, rules.txt en cors.json
|-- scripts/            Node.js-onderhoudsscripts voor Firebase
|-- www/                Webbestanden voor de Capacitor-app
|   |-- index.html
|   |-- assets/css/
|   |-- assets/js/
|   |-- images/
|   |-- app/
|   `-- web/
`-- android/            Native Android-project
```

De website wordt vanuit de projectroot geserveerd. Capacitor gebruikt `www/`, zoals ingesteld in `capacitor.config.json`. Beide versies hebben hun eigen CSS en JavaScript; wijzigingen worden niet automatisch gekopieerd. HTML-pagina's blijven op hun bestaande adressen. Het oude `admin.html` verwijst door naar `admin/addspot.html`.

### Onderhoudsscripts

Voer scripts vanuit de projectroot uit met `node scripts/<bestandsnaam>.js`. De scripts verwachten het lokale bestand `serviceAccountKey.json` in de projectroot, zoals voorheen.

- `node scripts/add-weekly-fields.js`
- `node scripts/backfillSpotFields.js`
- `node scripts/buildSearchIndex.js`
- `node scripts/approvePendingSpot.js <pendingSpotId>`
- `node scripts/optimizeExistingSpotPhotos.js --dry-run`

Deze scripts benaderen Firebase en kunnen gegevens wijzigen. De CORS-configuratie staat nu in `firebase/cors.json` en de bestaande regels in `firebase/rules.txt`.

### Lokale paden controleren

Voer `node scripts/check-paths.js` uit om vaste lokale links in HTML, CSS, JavaScript en beide manifests te controleren. De controle houdt rekening met hoofdletters en hosting onder `/KOVA/`. Externe diensten en dynamisch opgehaalde URLs worden niet getest.
