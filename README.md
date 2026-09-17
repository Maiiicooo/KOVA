What is KOVA?

KOVA is a digital outdoor utility focused on discovering chill spots for everyone. It’s an app/website that combines map data with local spots ,helping users plan their outings smarter and more enjoyably.

Why KOVA?

The idea behind KOVA comes from personal experience: many great outdoor spots are hard to find.

Purpose of KOVA

Spot discovery: users can add, view, and explore chill spots via an easy-to-use map.


User-friendly and clear: everything in one interface, without distractions.

Community-driven: spots are submitted by users and only become visible after approval, ensuring quality and reliability.

Vision

KOVA aims to make outdoor experiences more accessible. Not just following routes, but finding the places you really want to be, with confidence in the weather and a safe, pleasant environment. It’s a combination of exploration, convenience, and reliable information.

## Mappenstructuur

Android-setup, testcommando's en resterende releasecontroles: [Android-audit](docs/android-audit.md).
Gebruik na webwijzigingen `npm run cap:sync` en open daarna Android Studio met `npm run android:open`.
De bronbestanden staan buiten `www`; `www` wordt bijgewerkt door `npm run build`.

## iOS

Het iOS-project staat in `ios/App/App.xcodeproj`, met bundle-ID `app.kova.spot`.
Capacitor iOS/core/CLI gebruiken 8.5.2. De negen bestaande plugins zijn via Swift Package Manager gekoppeld; CocoaPods is niet nodig.
Voor bouwen en draaien is een Mac met Xcode 26+ nodig; het minimum is iOS 15.
Zie de [officiële iOS-documentatie](https://capacitorjs.com/docs/ios).

Op de Mac, vanuit de projectmap:

```sh
npm ci
npm run ios:sync
npm run ios:open
```

Laat Xcode de Swift-packages ophalen. Selecteer bij target **App > Signing & Capabilities** je eigen Apple-team voor een echt toestel, kies een simulator of aangesloten iPhone en druk op Run. De bundle-ID blijft `app.kova.spot`. Signing/provisioning en App Store-publicatie zijn nog niet ingesteld.
Na webwijzigingen gebruik je `npm run ios:sync`; `npm run ios:run` synchroniseert en start via de CLI.
`npm run assets:ios` genereert de iconen en donkere splash opnieuw uit het bestaande KOVA-logo.
De Android-commando's blijven `npm run cap:sync` en `npm run android:open`.

`Info.plist` bevat de door Camera en Geolocation vereiste gebruiksteksten. KOVA vraagt alleen locatie tijdens gebruik; er is geen achtergrondlocatie ingeschakeld. Foto's worden niet automatisch in de galerij opgeslagen. `PrivacyInfo.xcprivacy` is opgenomen in de app-resources en verklaart het UserDefaults-gebruik voor tijdelijk formulierherstel (CA92.1).

Nog te controleren op een echte iPhone voordat dit een release is:

- Kaart/spotladen en wisselen van thema, ook na hervatten en zonder netwerk.
- Locatie toestaan/weigeren, beperkte nauwkeurigheid en uitgeschakelde locatiediensten.
- Camera, fotokiezer, annuleren, uploaden, delen en externe links.
- Notch/home-indicator, toetsenbord en formulieren, portrait/landscape en iPad-layout.
- Firebase-login, Firestore, foto-upload en echte App Check-tokenuitgifte vanuit `capacitor://localhost`. De bestaande web-reCAPTCHA-provider is nog geen native App Attest-integratie; als deze origin niet werkt is aanvullende Firebase-integratie nodig. Enforcement niet uitschakelen om dit te omzeilen.
- Xcode Archive/privacyrapport en App Store Connect-privacygegevens voor alle werkelijk verzamelde gegevens; het UserDefaults-manifest vervangt die gegevens niet.

Het project en de webassets kunnen op Windows worden gegenereerd en gesynchroniseerd. Een geslaagde sync is geen iOS-compilatie of toesteltest.

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

