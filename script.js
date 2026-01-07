const map = L.map("map").setView([20.5937, 78.9629], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

let markers = [];

async function searchParking() {
  const placeInput = document.getElementById("locationInput");
  const place = placeInput.value.trim();
  const results = document.getElementById("results");

  if (!place) {
    alert("Please enter a location");
    return;
  }

  results.innerHTML = "<p>🔍 Searching parking locations…</p>";

  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
  );
  const geoData = await geoRes.json();

  if (geoData.length === 0) {
    results.innerHTML = "<p>❌ Location not found</p>";
    return;
  }

  const lat = geoData[0].lat;
  const lon = geoData[0].lon;
  const displayName = geoData[0].display_name.split(",")[0];

  map.setView([lat, lon], 14);

  markers.forEach(m => map.removeLayer(m));
  markers = [];
  results.innerHTML = "";

  const query = `
    [out:json];
    (
      node(around:5000,${lat},${lon})["amenity"="parking"];
      way(around:5000,${lat},${lon})["amenity"="parking"];
    );
    out center tags;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query
  });

  const data = await res.json();

  if (data.elements.length === 0) {
    results.innerHTML = `
      <div class="card">
        ❌ <strong>No parking data found</strong><br><br>
        This area may not have parking mapped yet.<br>
        Try a bigger city or nearby area.
      </div>
    `;
    return;
  }

  results.innerHTML = `
    <h3 style="margin-bottom:10px;">Parking in ${displayName}</h3>
  `;

  data.elements.forEach((p, index) => {
    const latlng = p.lat
      ? [p.lat, p.lon]
      : [p.center.lat, p.center.lon];

    const parkingName =
      (p.tags && p.tags.name)
        ? p.tags.name
        : `Unnamed Parking Area ${index + 1}`;

    const marker = L.marker(latlng).addTo(map);
    marker.bindPopup(`
      <strong>${parkingName}</strong><br>
      📍 ${displayName}<br>
      Source: OpenStreetMap
    `);
    markers.push(marker);


    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <strong>🅿️ ${parkingName}</strong><br>
      <small>📍 ${displayName}</small><br>
      <small>Source: OpenStreetMap</small>
    `;
    results.appendChild(card);
  });
}
