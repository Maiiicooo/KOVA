// main.js

const approvedSpots = [
  {
    name: 'Grote Markt Brussel',
    description: 'Prachtige historische spot in hartje Brussel.',
    lat: 50.8466, lng: 4.3528,
    photo: 'https://www.27vakantiedagen.nl/wp-content/uploads/2021/01/belgie-brussel-grote-markt.jpg',
    address: 'Grote Markt 1, 1000 Brussel, België'
  },
  {
    name: 'Citadelpark Gent',
    description: 'Rustige plek bij het water en veel groen.',
    lat: 51.0374558, lng: 3.7192784,
    photo: 'https://link-naar-foto-2.jpg',
    address: 'Citadelpark, 9000 Gent, België'
  },

  {
    name: 'Japanse Tuin',
    description: 'De Japanse Tuin in Hasselt is een van de grootste Japanse tuinen in Europa.',
    lat: 50.937531, lng: 5.353040,
    photo: 'https://www.klasse.be/wp/wp-content/uploads/2016/09/japanse-tuin-hasselt.jpg',
    address: 'Gouverneur Verwilghensingel 15, 3500 Hasselt'
  },
];

let map, autocomplete, infoWindow, markersList = [];

function initMap() {
  // Set map options with center in Belgium (Brussels)
  const mapOptions = {
    center: { lat: 50.8503, lng: 4.3517 }, // Brussels, Belgium
    zoom: 8,
    mapTypeControl: false,     // Disables the map type control (e.g., Kaart, Sateliet)
    fullscreenControl: false,  // Disables the fullscreen control
    streetViewControl: false   // Disables the Street View control
  };

  // Initialize the map on the page
  const map = new google.maps.Map(document.getElementById("map"), mapOptions);

  // Use MapTiler Dark as the sole map tiles source
  const maptilerDark = new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
      return "https://api.maptiler.com/maps/dataviz-dark/" +
             zoom + "/" +
             coord.x + "/" +
             coord.y +
             ".png?key=bXqEyTzJDzxdgChcxOJp";
    },
    tileSize: new google.maps.Size(256, 256),
    maxZoom: 20,
    name: "MapTiler Dark"
  });

  // Set the MapTiler Dark tiles as the active map type
  map.mapTypes.set("maptiler_dark", maptilerDark);
  map.setMapTypeId("maptiler_dark");

  // Create an InfoWindow and attach a click listener to the map to close it
  infoWindow = new google.maps.InfoWindow();
  map.addListener("click", () => infoWindow.close());

  // Proceed with adding markers and autocomplete
  approvedSpots.forEach(spot => {
    const marker = new google.maps.Marker({
      position: { lat: spot.lat, lng: spot.lng },
      map, 
      title: spot.name
    });
    markersList.push({ marker, spot });
    marker.addListener("click", () => showInfo(marker, spot));
  });

  autocomplete = new google.maps.places.Autocomplete(
    document.getElementById("autocomplete")
  );
  autocomplete.bindTo("bounds", map);
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) return;
    document.getElementById("lat").value = place.geometry.location.lat();
    document.getElementById("lng").value = place.geometry.location.lng();
  });

  const searchInput = document.getElementById("searchInput");
  const suggestionsEl = document.getElementById("suggestions");

  searchInput.addEventListener("input", e => {
    const term = e.target.value.toLowerCase().trim();
    markersList.forEach(({ marker, spot }) => {
      const hay = (spot.name + ' ' + spot.description + ' ' + spot.address).toLowerCase();
      marker.setMap(!term || hay.includes(term) ? map : null);
    });
    const matches = approvedSpots
      .map(s => s.name)
      .filter(n => n.toLowerCase().includes(term));
    if (term && matches.length) {
      suggestionsEl.innerHTML = matches.slice(0, 10)
        .map(n => `<div class="suggestion-item">${n}</div>`).join('');
      suggestionsEl.classList.remove('hidden');
    } else {
      suggestionsEl.classList.add('hidden');
    }
  });
  
  suggestionsEl.addEventListener("click", e => {
    const item = e.target.closest('.suggestion-item');
    if (!item) return;
    const val = item.textContent;
    searchInput.value = val;
    suggestionsEl.classList.add('hidden');
    const term = val.toLowerCase().trim();
    markersList.forEach(({ marker, spot }) => {
      const hay = (spot.name + ' ' + spot.description + ' ' + spot.address).toLowerCase();
      marker.setMap(!term || hay.includes(term) ? map : null);
    });
  });

  document.addEventListener("click", e => {
    if (!e.target.closest('.search-container')) {
      suggestionsEl.classList.add('hidden');
    }
  });

  document.getElementById("closeForm").addEventListener("click", () => {
    document.getElementById("formContainer").style.display = "none";
  });

  function showInfo(marker, spot) {
    let navUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
    let content = `
      <div class="info-window">
        <h3>${spot.name}</h3>
        <p>${spot.description}</p>
        <p class="address">
          <a href="${navUrl}" target="_blank" rel="noopener">${spot.address}</a>
        </p>
      </div>
    `;
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
  }

  window.addEventListener("DOMContentLoaded", () => {
    // Spot-form toggling
    document.getElementById("addBtn").addEventListener("click", () => {
      document.getElementById("formContainer").style.display = "block";
    });
    document.getElementById("closeForm").addEventListener("click", () => {
      document.getElementById("formContainer").style.display = "none";
    });

    // About-overlay toggling
    document.getElementById("aboutBtn").addEventListener("click", e => {
      e.preventDefault();
      document.getElementById("aboutContainer").classList.remove("hidden");
      document.body.classList.add("about-active");
    });
    document.getElementById("backToMap").addEventListener("click", e => {
      e.preventDefault();
      document.getElementById("aboutContainer").classList.add("hidden");
      document.body.classList.remove("about-active");
    });
  });
}
