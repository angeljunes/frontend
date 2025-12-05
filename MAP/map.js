// ========================================
// CONFIGURACIÓN DE APIs
// ========================================
const GOOGLE_MAPS_API_KEY = "AIzaSyBFw0Qbyq9zTFTd-tUqqo6YK6iMOTY"; // Reemplaza con tu API key de Google Maps
const GOMAPS_API_KEY = "3076fd4f58eece8c1dafba329cf1032e"; // API key de GoMaps (respaldo para búsquedas)
const API_BASE = "http://localhost:8081/api";

let offlineMode = false;

let marker = null;
let scanCircle = null;
let activeSuggestionIndex = -1;
let lastPredictions = [];
let allAlerts = []; // Para almacenar las alertas del backend

const map = L.map('map').setView([-12.0464, -77.0428], 12);

// Capa OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const redIcon = L.icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});


map.on('click', async (e) => {
  const latlng = e.latlng;
  const lat = latlng.lat;
  const lng = latlng.lng;

  console.log('\n🖱️ CLICK EN EL MAPA');
  console.log(`📍 Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);

  // Colocar marcador inmediatamente con coordenadas
  placeMarker(lat, lng, `Obteniendo dirección...\nLat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);

  // Mostrar coordenadas en el campo de dirección temporalmente
  const coordsText = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
  document.getElementById('direccionInput').value = coordsText;

  // Hacer reverse geocoding para obtener la dirección
  console.log('🔄 Obteniendo dirección del punto seleccionado...');
  const geocodeResult = await reverseGeocode(lat, lng);

  if (geocodeResult) {
    const address = geocodeResult.address;
    console.log(`✅ Dirección obtenida: ${address}`);

    // Actualizar el campo de dirección con la dirección real
    document.getElementById('direccionInput').value = address;

    // Actualizar el popup del marcador con la dirección
    if (marker) {
      marker.bindPopup(`📍 ${address}\n\nLat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`).openPopup();
    }

    // Intentar detectar y seleccionar país/ciudad
    const components = geocodeResult.components;
    let countryName = null;
    let cityName = null;
    let stateName = null;
    let districtName = null;

    components.forEach(component => {
      if (component.types.includes('country')) {
        countryName = component.long_name;
      }
      if (component.types.includes('locality')) {
        cityName = component.long_name;
      } else if (component.types.includes('administrative_area_level_2') && !cityName) {
        cityName = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        stateName = component.long_name;
      }
      if (component.types.includes('sublocality') || component.types.includes('sublocality_level_1') || component.types.includes('neighborhood')) {
        districtName = component.long_name;
      }
    });

    console.log('🌍 País detectado:', countryName || 'N/A');
    console.log('🏙️ Ciudad detectada:', cityName || 'N/A');
    console.log('🏘️ Distrito detectado:', districtName || 'N/A');
    console.log('📍 Estado/Provincia detectado:', stateName || 'N/A');

    // Auto-seleccionar país y ciudad si se detectaron
    if (countryName) {
      await selectCountryByName(countryName);
    }
    // Intentar city -> district -> state
    let selected = false;
    if (cityName) {
      selected = await selectCityByName(cityName);
    }
    if (!selected && districtName) {
      console.log(`🔁 Intentando con distrito: "${districtName}"`);
      selected = await selectCityByName(districtName);
    }
    if (!selected && stateName) {
      console.log(`🔁 Intentando con estado/provincia: "${stateName}"`);
      selected = await selectCityByName(stateName);
    }
  } else {
    console.warn('⚠️ No se pudo obtener la dirección, mostrando solo coordenadas');
    // Mantener las coordenadas en el campo de dirección
    if (marker) {
      marker.bindPopup(`📍 Ubicación seleccionada\n\nLat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`).openPopup();
    }
  }
});

function placeMarker(lat, lng, popupText) {
  if (marker) map.removeLayer(marker);
  if (scanCircle) map.removeLayer(scanCircle);

  marker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
  if (popupText) marker.bindPopup(popupText).openPopup();

  // Dibujar círculo de escaneo
  const perimetroInput = document.getElementById('perimetroInput');
  const radius = perimetroInput && perimetroInput.value ? parseInt(perimetroInput.value) : 500;

  scanCircle = L.circle([lat, lng], {
    color: '#3388ff',
    fillColor: '#3388ff',
    fillOpacity: 0.1,
    radius: radius
  }).addTo(map);
}

const input = document.getElementById('buscar');
const sugerenciasEl = document.getElementById('sugerencias');
const emergencyBtn = document.getElementById('emergencyBtn');
const perimetroInput = document.getElementById('perimetroInput');

// Actualizar círculo cuando cambia el perímetro
if (perimetroInput) {
  perimetroInput.addEventListener('input', () => {
    if (marker && scanCircle) {
      const newRadius = parseInt(perimetroInput.value) || 500;
      scanCircle.setRadius(newRadius);
    }
  });
}

// Debounce para evitar exceso de llamadas
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

async function fetchPredictions(query) {
  if (!query) return [];
  try {
    const url = `https://maps.gomaps.pro/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOMAPS_API_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data && data.predictions) return data.predictions;
    return [];
  } catch (err) {
    console.error('Fetch predictions error:', err);
    return [];
  }
}

function renderSuggestions(predictions) {
  sugerenciasEl.innerHTML = '';
  lastPredictions = predictions || [];
  activeSuggestionIndex = -1;

  if (!predictions || predictions.length === 0) {
    return;
  }

  predictions.forEach((p, i) => {
    const div = document.createElement('div');
    div.textContent = p.description;
    div.tabIndex = 0;
    div.addEventListener('click', () => seleccionarDireccion(p.description));
    div.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') seleccionarDireccion(p.description);
    });
    sugerenciasEl.appendChild(div);
  });
}


const doSearch = debounce(async (texto) => {
  if (!texto) {
    sugerenciasEl.innerHTML = '';
    lastPredictions = [];
    return;
  }
  const preds = await fetchPredictions(texto);
  renderSuggestions(preds);
}, 250);


input.addEventListener('input', (e) => {
  doSearch(e.target.value);
});


input.addEventListener('keydown', (e) => {
  const items = sugerenciasEl.querySelectorAll('div');

  // Flechas para navegar sugerencias
  if (e.key === 'ArrowDown') {
    if (items.length === 0) return;
    e.preventDefault();
    activeSuggestionIndex = Math.min(items.length - 1, activeSuggestionIndex + 1);
    updateActiveSuggestion(items);
    return;
  }
  if (e.key === 'ArrowUp') {
    if (items.length === 0) return;
    e.preventDefault();
    activeSuggestionIndex = Math.max(0, activeSuggestionIndex - 1);
    updateActiveSuggestion(items);
    return;
  }

  if (e.key === 'Escape') {
    clearSuggestions();
    return;
  }


  if (e.key === 'Enter') {
    e.preventDefault();
    if (items.length > 0) {
      const index = activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0;
      const chosenText = items[index].textContent;
      seleccionarDireccion(chosenText);
    } else {
      seleccionarDireccion(input.value);
    }
  }
});

function updateActiveSuggestion(items) {
  items.forEach(it => it.classList.remove('active'));
  if (activeSuggestionIndex >= 0 && items[activeSuggestionIndex]) {
    items[activeSuggestionIndex].classList.add('active');
    // Scroll si necesario
    const el = items[activeSuggestionIndex];
    const rect = el.getBoundingClientRect();
    const parentRect = sugerenciasEl.getBoundingClientRect();
    if (rect.bottom > parentRect.bottom) el.scrollIntoView(false);
    if (rect.top < parentRect.top) el.scrollIntoView();
  }
}

function clearSuggestions() {
  sugerenciasEl.innerHTML = '';
  lastPredictions = [];
  activeSuggestionIndex = -1;
}

document.addEventListener('click', (ev) => {
  if (!ev.target.closest('.map-section') && !ev.target.closest('.sugerencias')) {
    clearSuggestions();
  }
});


async function seleccionarDireccion(address) {
  if (!address) return;
  input.value = address;
  clearSuggestions();

  try {
    const url = `https://maps.gomaps.pro/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOMAPS_API_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data || !data.results || data.results.length === 0) {
      alert('No se encontró la dirección.');
      return;
    }

    const r = data.results[0];
    const loc = r.geometry.location;
    const latlng = [loc.lat, loc.lng];

    // Si hay viewport, usar fitBounds para ajustar mejor el zoom
    if (r.geometry.viewport && r.geometry.viewport.northeast && r.geometry.viewport.southwest) {
      const ne = r.geometry.viewport.northeast;
      const sw = r.geometry.viewport.southwest;
      const bounds = L.latLngBounds([sw.lat, sw.lng], [ne.lat, ne.lng]);
      map.fitBounds(bounds, { maxZoom: 17 });
    } else {
      map.setView(latlng, 16);
    }

    placeMarker(latlng[0], latlng[1], r.formatted_address || address);
  } catch (err) {
    console.error('Error geocoding:', err);
    alert('Error al buscar la ubicación (ver consola).');
  }
}

// --- Emergencia: geolocalizar, centrar y enviar alerta ---
async function handleEmergencyClick() {
  if (!navigator.geolocation) {
    alert('Geolocalización no soportada en este navegador.');
    return;
  }

  console.log('\n🚨 BOTÓN DE EMERGENCIA ACTIVADO');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔄 Solicitando ubicación GPS...');

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;

    console.log('📍 Ubicación obtenida para emergencia');
    console.log(`📌 Latitud: ${lat}`);
    console.log(`📌 Longitud: ${lng}`);
    console.log(`📏 Precisión: ${accuracy.toFixed(0)} metros`);

    // Centrar mapa y colocar marcador
    map.setView([lat, lng], 17);
    placeMarker(lat, lng, `🚨 EMERGENCIA\nObteniendo dirección...\nLat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}\nPrecisión: ${accuracy.toFixed(0)}m`);

    // Obtener dirección mediante reverse geocoding
    console.log('🔄 Obteniendo dirección de emergencia...');
    const geocodeResult = await reverseGeocode(lat, lng);

    let address = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    let countryName = null;
    let cityName = null;

    if (geocodeResult) {
      address = geocodeResult.address;
      console.log(`✅ Dirección de emergencia obtenida: ${address}`);

      // Rellenar campo de dirección
      document.getElementById('direccionInput').value = address;

      // Actualizar popup del marcador
      if (marker) {
        marker.bindPopup(`🚨 EMERGENCIA\n${address}\n\nLat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}\nPrecisión: ${accuracy.toFixed(0)}m`).openPopup();
      }

      // Detectar país y ciudad
      const components = geocodeResult.components;
      components.forEach(component => {
        if (component.types.includes('country')) {
          countryName = component.long_name;
        }
        if (component.types.includes('locality')) {
          cityName = component.long_name;
        } else if (component.types.includes('administrative_area_level_2') && !cityName) {
          cityName = component.long_name;
        }
      });

      console.log('🌍 País detectado:', countryName || 'N/A');
      console.log('🏙️ Ciudad detectada:', cityName || 'N/A');

      // Auto-seleccionar país y ciudad
      if (countryName) {
        await selectCountryByName(countryName);
      }
      if (cityName) {
        await selectCityByName(cityName);
      }
    } else {
      console.warn('⚠️ No se pudo obtener dirección, usando coordenadas');
      document.getElementById('direccionInput').value = address;
    }

    // Enviar emergencia al backend de Spring Boot
    try {
      const alertData = {
        title: 'EMERGENCIA',
        description: `Botón de emergencia activado. Precisión: ${accuracy.toFixed(0)}m`,
        priority: 'ALTA',
        // Compatibilidad de nombres de campos
        latitude: lat,
        longitude: lng,
        latitud: lat,
        longitud: lng,
        address: address,
        country: countryName,
        city: cityName
      };

      console.log('📤 Enviando alerta de emergencia al backend...');
      const newAlert = await createAlert(alertData);
      console.log('✅ Emergencia registrada exitosamente');
      console.log('═══════════════════════════════════════════════════════');

      alert(`🚨 EMERGENCIA REGISTRADA\n\nID: ${newAlert.id}\nDirección: ${address}\nLat: ${lat.toFixed(6)}\nLng: ${lng.toFixed(6)}\nPrecisión: ${accuracy.toFixed(0)}m`);

    } catch (e) {
      console.error('❌ Error al enviar la emergencia:', e);
      console.log('═══════════════════════════════════════════════════════');
      alert(`📍 Ubicación marcada\nDirección: ${address}\nLat: ${lat.toFixed(6)}\nLng: ${lng.toFixed(6)}\n\n⚠️ No se pudo registrar en el servidor.\nVerificar conexión con backend.`);
    }
  }, (err) => {
    console.error('\n❌ ERROR DE GEOLOCALIZACIÓN EN EMERGENCIA');
    console.error('═══════════════════════════════════════════════════════');
    console.error('Código de error:', err.code);
    console.error('Mensaje:', err.message);

    let errorMsg = 'No se pudo obtener tu ubicación.\n';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMsg += 'Permiso denegado. Activa permisos de ubicación.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMsg += 'Ubicación no disponible. Verifica GPS/conexión.';
        break;
      case err.TIMEOUT:
        errorMsg += 'Tiempo agotado. Intenta de nuevo.';
        break;
      default:
        errorMsg += 'Error desconocido.';
    }
    alert(errorMsg);
  }, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  });
}

if (typeof emergencyBtn !== 'undefined' && emergencyBtn) {
  emergencyBtn.addEventListener('click', handleEmergencyClick);
}

// --- Registrar Alerta: usa la ubicación y los campos actuales y envía POST ---
async function handleRegisterAlertClick() {
  try {
    console.log('\n📝 REGISTRAR ALERTA - Iniciando');
    if (!marker) {
      alert('Primero selecciona/obtén una ubicación en el mapa.');
      console.warn('⚠️ No hay marcador/ubicación para registrar la alerta');
      return;
    }

    const latlng = marker.getLatLng();
    const direccion = (document.getElementById('direccionInput')?.value || '').trim();

    const countrySelect = document.getElementById('countrySelect');
    const citySelect = document.getElementById('citySelect');
    const countryId = countrySelect?.value || '';
    const countryName = countrySelect && countrySelect.selectedIndex > -1 ? countrySelect.options[countrySelect.selectedIndex].textContent : '';
    const cityId = citySelect?.value || '';
    const cityName = citySelect && citySelect.selectedIndex > -1 ? citySelect.options[citySelect.selectedIndex].textContent : '';

    // Prioridad desde el selector de la sección .filtros
    let priority = 'MEDIA';
    const dangerSelect = document.getElementById('dangerLevelSelect');
    if (dangerSelect && dangerSelect.value) {
      const val = dangerSelect.value.toString().toUpperCase();
      if (['ALTA', 'MEDIA', 'BAJA'].includes(val)) priority = val;
    }

    const payload = {
      title: 'ALERTA',
      description: 'Registro manual desde botón REGISTRAR ALERTA',
      priority: priority,
      // Compatibilidad de nombres de campos
      latitude: latlng.lat,
      longitude: latlng.lng,
      latitud: latlng.lat,
      longitud: latlng.lng,
      address: direccion || `Lat: ${latlng.lat.toFixed(6)}, Lng: ${latlng.lng.toFixed(6)}`,
      country: countryName || undefined,
      city: cityName || undefined,
      countryId: countryId || undefined,
      cityId: cityId || undefined
    };

    console.log('📦 Payload a enviar:', payload);
    console.log('📤 Enviando POST a', `${API_BASE}/alerts`);
    const result = await createAlert(payload);
    alert(`✅ Alerta registrada con éxito\nID: ${result.id || '(sin id)'}\nDirección: ${payload.address}`);
  } catch (err) {
    console.error('❌ Error registrando alerta:', err);
    alert('Error al registrar la alerta. Revisa la consola para más detalles.');
  }
}

// ========================================
// FUNCIONES DE REVERSE GEOCODING ROBUSTAS
// ========================================

/**
 * Realiza reverse geocoding usando Google Maps API
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {Promise<Object|null>} - Objeto con dirección y componentes, o null si falla
 */
async function reverseGeocodeGoogle(lat, lng) {
  console.log('🔄 Intentando reverse geocoding con Google Maps API...');
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=es`;
    console.log('🌐 URL Google Maps:', url);

    const response = await fetch(url);
    console.log('📡 Google Maps status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 Respuesta Google Maps:', data);

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      console.log('✅ Google Maps: Reverse geocoding exitoso');
      return {
        source: 'Google Maps',
        address: result.formatted_address,
        components: result.address_components,
        raw: result
      };
    } else {
      console.warn(`⚠️ Google Maps status: ${data.status}`);
      if (data.error_message) {
        console.warn(`⚠️ Error message: ${data.error_message}`);
      }
      return null;
    }
  } catch (error) {
    console.error('❌ Error en Google Maps API:', error.message);
    return null;
  }
}

/**
 * Realiza reverse geocoding usando Nominatim (OpenStreetMap)
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {Promise<Object|null>} - Objeto con dirección y componentes, o null si falla
 */
async function reverseGeocodeNominatim(lat, lng) {
  console.log('🔄 Intentando reverse geocoding con Nominatim (OpenStreetMap)...');
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`;
    console.log('🌐 URL Nominatim:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RCAS-App/1.0' // Nominatim requiere User-Agent
      }
    });
    console.log('📡 Nominatim status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 Respuesta Nominatim:', data);

    if (data && data.display_name) {
      console.log('✅ Nominatim: Reverse geocoding exitoso');

      // Convertir formato de Nominatim a formato similar a Google Maps
      const address = data.address || {};
      const components = [];

      // Mapear componentes de Nominatim a formato Google-like
      if (address.road) components.push({ long_name: address.road, types: ['route'] });
      if (address.house_number) components.push({ long_name: address.house_number, types: ['street_number'] });
      if (address.suburb || address.neighbourhood) components.push({ long_name: address.suburb || address.neighbourhood, types: ['sublocality'] });
      if (address.city || address.town || address.village) components.push({ long_name: address.city || address.town || address.village, types: ['locality'] });
      if (address.state) components.push({ long_name: address.state, types: ['administrative_area_level_1'] });
      if (address.country) components.push({ long_name: address.country, short_name: address.country_code?.toUpperCase(), types: ['country'] });

      return {
        source: 'Nominatim (OpenStreetMap)',
        address: data.display_name,
        components: components,
        raw: data
      };
    } else {
      console.warn('⚠️ Nominatim no devolvió resultados');
      return null;
    }
  } catch (error) {
    console.error('❌ Error en Nominatim API:', error.message);
    return null;
  }
}

/**
 * Realiza reverse geocoding con sistema de fallback
 * Intenta primero Google Maps, luego Nominatim
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {Promise<Object|null>} - Objeto con dirección y componentes, o null si todo falla
 */
async function reverseGeocode(lat, lng) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔄 INICIANDO REVERSE GEOCODING CON SISTEMA DE FALLBACK');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📍 Coordenadas: ${lat}, ${lng}`);

  // Intentar primero con Google Maps
  let result = await reverseGeocodeGoogle(lat, lng);

  // Si Google Maps falla, intentar con Nominatim
  if (!result) {
    console.log('\n⚠️ Google Maps falló, intentando con Nominatim...');
    result = await reverseGeocodeNominatim(lat, lng);
  }

  if (result) {
    console.log('\n✅ REVERSE GEOCODING EXITOSO');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📡 Fuente: ${result.source}`);
    console.log(`📍 Dirección: ${result.address}`);
    console.log(`📊 Componentes encontrados: ${result.components.length}`);
    console.log('═══════════════════════════════════════════════════════');
  } else {
    console.error('\n❌ REVERSE GEOCODING FALLÓ COMPLETAMENTE');
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ Tanto Google Maps como Nominatim fallaron');
    console.error('💡 Mostrando solo coordenadas como fallback');
    console.error('═══════════════════════════════════════════════════════');
  }

  return result;
}

// --- Geolocalización automática para rellenar formulario ---
async function handleAutoLocation() {
  if (!navigator.geolocation) {
    alert('Geolocalización no soportada en este navegador.');
    return;
  }

  const btnAutoLocation = document.getElementById('btnAutoLocation');
  const originalText = btnAutoLocation.textContent;
  btnAutoLocation.textContent = '🔄 Obteniendo ubicación...';
  btnAutoLocation.disabled = true;

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;

    console.log('═══════════════════════════════════════════════════════');
    console.log('📍 GEOLOCALIZACIÓN OBTENIDA');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📌 Latitud: ${lat}`);
    console.log(`📌 Longitud: ${lng}`);
    console.log(`📏 Precisión: ${accuracy.toFixed(0)} metros`);
    console.log('═══════════════════════════════════════════════════════');

    // SIEMPRE centrar mapa y colocar marcador primero (esto funciona siempre)
    console.log('🗺️ Centrando mapa en coordenadas...');
    map.setView([lat, lng], 16);
    placeMarker(lat, lng, `Tu ubicación\nLat: ${lat.toFixed(6)}\nLng: ${lng.toFixed(6)}\nPrecisión: ${accuracy.toFixed(0)}m`);
    console.log('✅ Mapa centrado correctamente');

    // Rellenar coordenadas en el campo de dirección como fallback
    const coordsText = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    document.getElementById('direccionInput').value = coordsText;

    // Hacer reverse geocoding con sistema de fallback (Google Maps → Nominatim)
    const geocodeResult = await reverseGeocode(lat, lng);

    if (geocodeResult) {
      // Reverse geocoding exitoso
      const address = geocodeResult.address;
      const components = geocodeResult.components;

      console.log('📍 Dirección detectada:', address);
      console.log(`📊 Total de componentes: ${components.length}`);

      // Rellenar dirección (reemplazar coordenadas)
      document.getElementById('direccionInput').value = address;

      // Buscar país y ciudad en los componentes
      let countryName = null;
      let cityName = null;
      let stateName = null;
      let districtName = null;

      console.log('\n🔍 ANALIZANDO COMPONENTES DE DIRECCIÓN:');
      console.log('═══════════════════════════════════════════════════════');
      components.forEach((component, index) => {
        console.log(`\n[${index + 1}] ${component.long_name}`);
        console.log(`    Tipos: ${component.types.join(', ')}`);
        if (component.short_name) console.log(`    Nombre corto: ${component.short_name}`);

        // País
        if (component.types.includes('country')) {
          countryName = component.long_name;
          console.log(`    ✅ PAÍS DETECTADO: ${countryName}`);
        }

        // Ciudad (prioridad: locality > administrative_area_level_2 > sublocality)
        if (component.types.includes('locality')) {
          cityName = component.long_name;
          console.log(`    ✅ CIUDAD DETECTADA (locality): ${cityName}`);
        } else if (component.types.includes('administrative_area_level_2') && !cityName) {
          cityName = component.long_name;
          console.log(`    ✅ CIUDAD DETECTADA (admin_level_2): ${cityName}`);
        } else if (component.types.includes('sublocality') && !cityName) {
          cityName = component.long_name;
          console.log(`    ✅ CIUDAD DETECTADA (sublocality): ${cityName}`);
        } else if (component.types.includes('administrative_area_level_3') && !cityName) {
          cityName = component.long_name;
          console.log(`    ✅ CIUDAD DETECTADA (admin_level_3): ${cityName}`);
        }

        // Estado/Provincia
        if (component.types.includes('administrative_area_level_1')) {
          stateName = component.long_name;
          console.log(`    📍 Estado/Provincia: ${stateName}`);
        }

        // Distrito
        if (component.types.includes('sublocality_level_1') || component.types.includes('neighborhood')) {
          districtName = component.long_name;
          console.log(`    🏘️ Distrito: ${districtName}`);
        }
      });

      console.log('\n═══════════════════════════════════════════════════════');
      console.log('📊 RESUMEN DE DETECCIÓN:');
      console.log('═══════════════════════════════════════════════════════');
      console.log('🌍 País detectado:', countryName || '❌ NO DETECTADO');
      console.log('🏙️ Ciudad detectada:', cityName || '❌ NO DETECTADO');
      console.log('📍 Estado/Provincia:', stateName || 'N/A');
      console.log('🏘️ Distrito:', districtName || 'N/A');
      console.log('═══════════════════════════════════════════════════════');

      // Intentar seleccionar el país en el dropdown
      if (countryName) {
        console.log(`\n🔍 Intentando seleccionar país: "${countryName}"`);
        const countrySelected = await selectCountryByName(countryName);
        if (!countrySelected) {
          console.warn(`⚠️ No se pudo seleccionar el país "${countryName}"`);
          console.warn('💡 Posibles causas:');
          console.warn('   - El país no existe en tu base de datos');
          console.warn('   - Diferencia de tildes (Peru vs Perú)');
          console.warn('   - Nombre diferente en la BD');
        }
      } else {
        console.warn('⚠️ No se detectó país en el reverse geocoding');
      }

      // Intentar seleccionar la ciudad en el dropdown, con fallbacks (city -> district -> state)
      let cityTried = false;
      if (cityName) {
        console.log(`\n🔍 Intentando seleccionar ciudad: "${cityName}"`);
        cityTried = await selectCityByName(cityName);
      }
      if (!cityTried && districtName) {
        console.log(`\n🔁 Intentando seleccionar por distrito: "${districtName}"`);
        cityTried = await selectCityByName(districtName);
      }
      if (!cityTried && stateName) {
        console.log(`\n🔁 Intentando seleccionar por estado/provincia: "${stateName}"`);
        cityTried = await selectCityByName(stateName);
      }
      if (!cityTried) {
        console.warn('⚠️ No se pudo seleccionar la ciudad automáticamente');
        console.warn('💡 Posibles causas:');
        console.warn('   - La ciudad no existe en tu base de datos para este país');
        console.warn('   - Diferencia de nombres (Lima Metropolitana vs Lima)');
        console.warn('   - Primero debes seleccionar el país manualmente');
      }

      btnAutoLocation.textContent = '✅ Ubicación obtenida';
      console.log('\n✅ PROCESO COMPLETADO EXITOSAMENTE');
      setTimeout(() => {
        btnAutoLocation.textContent = originalText;
        btnAutoLocation.disabled = false;
      }, 2000);

    } else {
      // Reverse geocoding falló completamente
      console.warn('\n⚠️ No se pudo obtener dirección, mostrando solo coordenadas');
      alert(`📍 Mapa centrado en tu ubicación\n${coordsText}\n\n⚠️ No se pudo obtener la dirección exacta.\nPuedes seleccionar país y ciudad manualmente.`);
      btnAutoLocation.textContent = originalText;
      btnAutoLocation.disabled = false;
    }
  }, (err) => {
    console.error('\n❌ ERROR DE GEOLOCALIZACIÓN');
    console.error('═══════════════════════════════════════════════════════');
    console.error('Código de error:', err.code);
    console.error('Mensaje:', err.message);
    console.error('═══════════════════════════════════════════════════════');

    let errorMsg = 'No se pudo obtener tu ubicación.\n';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMsg += 'Permiso denegado. Activa permisos de ubicación.';
        console.error('💡 Solución: Permite el acceso a la ubicación en tu navegador');
        break;
      case err.POSITION_UNAVAILABLE:
        errorMsg += 'Ubicación no disponible. Verifica GPS/conexión.';
        console.error('💡 Solución: Verifica que el GPS esté activado');
        break;
      case err.TIMEOUT:
        errorMsg += 'Tiempo agotado. Intenta de nuevo.';
        console.error('💡 Solución: Intenta nuevamente, puede ser problema de señal');
        break;
      default:
        errorMsg += 'Error desconocido.';
    }
    alert(errorMsg);
    btnAutoLocation.textContent = originalText;
    btnAutoLocation.disabled = false;
  }, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  });
}

// Función auxiliar para seleccionar país por nombre
async function selectCountryByName(countryName) {
  const countrySelect = document.getElementById('countrySelect');
  if (!countrySelect) return;

  console.log(`🔍 Buscando país: "${countryName}"`);
  console.log('📋 Países disponibles:', Array.from(countrySelect.options).map(o => o.textContent));

  // Normalizar nombre del país para mejor matching
  const normalizedSearch = countryName.toLowerCase().trim();

  // Mapeo de nombres alternativos
  const countryAliases = {
    'peru': ['perú', 'peru'],
    'colombia': ['colombia'],
    'ecuador': ['ecuador'],
    'bolivia': ['bolivia'],
    'chile': ['chile'],
    'argentina': ['argentina'],
    'brazil': ['brasil', 'brazil'],
    'venezuela': ['venezuela'],
    'uruguay': ['uruguay'],
    'paraguay': ['paraguay']
  };

  // Buscar el país en las opciones
  for (let option of countrySelect.options) {
    if (option.value === '') continue; // Saltar opción vacía

    const optionText = option.textContent.toLowerCase().trim();

    // Matching exacto o parcial
    if (optionText === normalizedSearch ||
      optionText.includes(normalizedSearch) ||
      normalizedSearch.includes(optionText)) {
      countrySelect.value = option.value;
      console.log(`✅ País seleccionado: ${option.textContent} (ID: ${option.value})`);

      // Disparar evento change para cargar ciudades
      const event = new Event('change', { bubbles: true });
      countrySelect.dispatchEvent(event);

      // Esperar a que se carguen las ciudades
      await new Promise(resolve => setTimeout(resolve, 800));
      return true;
    }

    // Buscar en aliases
    for (let [key, aliases] of Object.entries(countryAliases)) {
      if (aliases.some(alias => alias === normalizedSearch) &&
        aliases.some(alias => alias === optionText)) {
        countrySelect.value = option.value;
        console.log(`✅ País seleccionado (por alias): ${option.textContent} (ID: ${option.value})`);

        const event = new Event('change', { bubbles: true });
        countrySelect.dispatchEvent(event);
        await new Promise(resolve => setTimeout(resolve, 800));
        return true;
      }
    }
  }

  console.warn(`⚠️ No se encontró el país "${countryName}" en el selector`);
  return false;
}

// Función auxiliar para seleccionar ciudad por nombre
async function selectCityByName(cityName) {
  const citySelect = document.getElementById('citySelect');
  if (!citySelect) return;

  console.log(`🔍 Buscando ciudad: "${cityName}"`);

  // Esperar a que el selector esté habilitado y tenga opciones
  let attempts = 0;
  const maxAttempts = 20; // ~6s
  while ((citySelect.disabled || citySelect.options.length <= 1) && attempts < maxAttempts) {
    console.log(`⏳ Esperando ciudades... (intento ${attempts + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 300));
    attempts++;
  }

  if (citySelect.disabled) {
    console.warn('⚠️ El selector de ciudades sigue deshabilitado después de esperar');
    return false;
  }

  console.log('📋 Ciudades disponibles:', Array.from(citySelect.options).map(o => o.textContent));

  // Normalizador sin tildes
  const normalize = (s) => (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  // Normalizar nombre de la ciudad
  const normalizedSearch = normalize(cityName);

  // Remover prefijos comunes
  const cleanSearch = normalizedSearch
    .replace(/^provincia de /, '')
    .replace(/^distrito de /, '')
    .replace(/^municipio de /, '');

  // Buscar la ciudad en las opciones
  for (let option of citySelect.options) {
    if (option.value === '') continue; // Saltar opción vacía

    const optionText = normalize(option.textContent);
    const cleanOption = optionText
      .replace(/^provincia de /, '')
      .replace(/^distrito de /, '')
      .replace(/^municipio de /, '');

    // Matching exacto o parcial
    if (cleanOption === cleanSearch ||
      cleanOption.includes(cleanSearch) ||
      cleanSearch.includes(cleanOption) ||
      optionText === normalizedSearch ||
      optionText.includes(normalizedSearch)) {
      citySelect.value = option.value;
      console.log(`✅ Ciudad seleccionada: ${option.textContent} (ID: ${option.value})`);
      return true;
    }
  }

  console.warn(`⚠️ No se encontró la ciudad "${cityName}" en el selector`);
  console.log(`💡 Sugerencia: Verifica que la ciudad esté en la base de datos para este país`);
  return false;
}

const btnAutoLocation = document.getElementById('btnAutoLocation');
if (btnAutoLocation) {
  btnAutoLocation.addEventListener('click', handleAutoLocation);
}

// ========================================
// FUNCIONES PARA CONECTAR CON EL BACKEND
// ========================================

// ...
// Cargar países desde el backend
async function loadCountries() {
  try {
    console.log('🔄 Cargando países...');
    const response = await fetch(`${API_BASE}/location/countries`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const countries = await response.json();
    console.log('📍 Países recibidos:', countries);

    const countrySelect = document.getElementById('countrySelect');

    if (!countrySelect) {
      console.error('❌ No se encontró el elemento countrySelect');
      return;
    }

    countrySelect.innerHTML = '<option value="">Seleccionar País</option>';

    if (countries && countries.length > 0) {
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.id;
        option.textContent = country.name;
        countrySelect.appendChild(option);
      });

      console.log(`✅ ${countries.length} países cargados correctamente`);
    } else {
      console.warn('⚠️ No se recibieron países del backend');
    }

  } catch (error) {
    console.error('❌ Error cargando países:', error);
    console.log('🔧 Verificar que el backend esté ejecutándose en:', API_BASE);
  }
}

// Cargar ciudades por país
async function loadCities(countryId) {
  try {
    console.log(`🔄 Cargando ciudades para país ID: ${countryId}`);
    const response = await fetch(`${API_BASE}/location/cities/${countryId}`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const cities = await response.json();
    console.log('🏙️ Ciudades recibidas:', cities);

    const citySelect = document.getElementById('citySelect');

    if (!citySelect) {
      console.error('❌ No se encontró el elemento citySelect');
      return;
    }

    citySelect.innerHTML = '<option value="">Seleccionar Ciudad</option>';
    citySelect.disabled = true;

    if (cities && cities.length > 0) {
      cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.name;
        citySelect.appendChild(option);
      });
      console.log(`✅ ${cities.length} ciudades cargadas correctamente`);
      citySelect.disabled = false;
    } else {
      console.warn('⚠️ No se encontraron ciudades para este país');
    }

  } catch (error) {
    console.error('❌ Error cargando ciudades:', error);
  }
}

// Cargar ciudades en modo offline (datos de respaldo)
function loadCitiesOffline(countryId) {
  console.log(`🏙️ (offline) Cargando ciudades para país ID: ${countryId}`);
  const citiesByCountry = {
    // Perú
    1: [
      { id: 101, name: 'Lima' },
      { id: 102, name: 'Arequipa' },
      { id: 103, name: 'Cusco' }
    ],
    // Colombia
    2: [
      { id: 201, name: 'Bogotá' },
      { id: 202, name: 'Medellín' },
      { id: 203, name: 'Cali' }
    ],
    // Ecuador
    3: [
      { id: 301, name: 'Quito' },
      { id: 302, name: 'Guayaquil' }
    ],
    // Bolivia
    4: [
      { id: 401, name: 'La Paz' },
      { id: 402, name: 'Santa Cruz' }
    ],
    // Chile
    5: [
      { id: 501, name: 'Santiago' },
      { id: 502, name: 'Valparaíso' }
    ]
  };

  const citySelect = document.getElementById('citySelect');
  if (!citySelect) {
    console.error('❌ No se encontró el elemento citySelect');
    return;
  }

  citySelect.innerHTML = '<option value="">Seleccionar Ciudad</option>';
  citySelect.disabled = true;
  const key = Number(countryId);
  const cities = citiesByCountry[key] || [];
  if (cities.length === 0) {
    console.warn('⚠️ No hay ciudades de respaldo para este país');
    return;
  }
  cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city.id;
    option.textContent = city.name;
    citySelect.appendChild(option);
  });
  console.log(`✅ (offline) ${cities.length} ciudades cargadas`);
  citySelect.disabled = false;
}

// Limpiar selector de ciudades
function clearCities() {
  const citySelect = document.getElementById('citySelect');
  if (citySelect) {
    citySelect.innerHTML = '<option value="">Seleccionar Ciudad</option>';
    citySelect.disabled = true;
  }
}

// Cargar alertas desde el backend
async function loadAlerts() {
  try {
    console.log('🔍 Intentando cargar alertas desde:', `${API_BASE}/alerts`);
    const response = await fetch(`${API_BASE}/alerts`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en la respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Error al cargar alertas: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Alertas cargadas correctamente:', data);

    allAlerts = data;
    displayAlertsOnMap(allAlerts);
    return data;
  } catch (error) {
    console.error('❌ Error cargando alertas:', error);
    console.log('🔧 Posibles causas:');
    console.log('1. El servidor backend no está en ejecución');
    console.log('2. La ruta /api/alerts no existe o tiene un error');
    console.log('3. La base de datos podría estar caída o sin datos');

    // Mostrar alertas de ejemplo si estamos en desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('🔄 Mostrando alertas de ejemplo para desarrollo...');
      allAlerts = [
        {
          id: 1,
          titulo: 'Ejemplo de Alerta',
          descripcion: 'Esta es una alerta de ejemplo',
          latitud: -12.0464,
          longitud: -77.0428,
          prioridad: 'media',
          estado: 'pendiente',
          fecha: new Date().toISOString()
        }
      ];
      displayAlertsOnMap(allAlerts);
    }

    // No relanzar el error: ya se mostró fallback/datos de ejemplo en desarrollo
  }
}

// Mostrar alertas en el mapa
function displayAlertsOnMap(alerts) {
  // Limpiar marcadores existentes de alertas (mantener el marcador del usuario)
  map.eachLayer(layer => {
    if (layer instanceof L.Marker && layer !== marker) {
      map.removeLayer(layer);
    }
  });

  // Limpiar array de marcadores
  allMarkers = [];

  // Crear y almacenar marcadores
  alerts.forEach(alert => {
    const lat = alert.latitude ?? alert.latitud;
    const lng = alert.longitude ?? alert.longitud;
    if (lat && lng) {
      const status = (alert.status ?? alert.estado ?? 'pendiente').toLowerCase();
      const title = alert.title ?? alert.titulo ?? 'Alerta';
      const priority = (alert.priority ?? alert.prioridad ?? '').toString().toUpperCase();
      const created = alert.createdAt ?? alert.fecha;
      const alertIcon = getAlertIcon(status);

      // Crear marcador
      const newMarker = L.marker([lat, lng], { icon: alertIcon })
        .bindPopup(`
          <div>
            <h4>${title}</h4>
            <p><strong>Prioridad:</strong> ${priority || 'N/A'}</p>
            <p><strong>Estado:</strong> ${status}</p>
            <p><strong>Descripción:</strong> ${alert.description || alert.descripcion || 'Sin descripción'}</p>
            <p><strong>Dirección:</strong> ${alert.address || alert.direccion || 'No especificada'}</p>
            <p><small>Creada: ${created ? new Date(created).toLocaleString() : 'N/A'}</small></p>
          </div>
        `);

      // Almacenar en array con su estado
      allMarkers.push({
        marker: newMarker,
        status: status
      });

      // Agregar al mapa
      newMarker.addTo(map);
    }
  });

  // Aplicar filtros si hay alguno activo
  if (activeFilters.size > 0) {
    applyFilters();
  }

  console.log(`📍 ${allMarkers.length} marcadores cargados en el mapa`);
}

// Obtener icono según el estado de la alerta
function getAlertIcon(status) {
  const s = (status || '').toString().toLowerCase();
  let iconUrl;
  switch (s) {
    case 'pendiente':
      iconUrl = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
      break;
    case 'verificada':
      iconUrl = 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png';
      break;
    case 'resuelta':
      iconUrl = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
      break;
    default:
      iconUrl = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
  }
  return L.icon({ iconUrl, iconSize: [32, 32], iconAnchor: [16, 32] });
}

// Filtrar alertas por prioridad
function filterAlertsByPriority() {
  const sel = document.getElementById('dangerLevelSelect');
  const val = (sel && sel.value) ? sel.value.toString().toUpperCase() : '';
  if (!val) { displayAlertsOnMap(allAlerts); return; }
  const filteredAlerts = allAlerts.filter(alert =>
    (alert.priority ?? alert.prioridad ?? '').toString().toUpperCase() === val
  );
  displayAlertsOnMap(filteredAlerts);
}

// Agregar eventos a los checkboxes de filtro
function setupFilters() {
  const sel = document.getElementById('dangerLevelSelect');
  if (sel) sel.addEventListener('change', filterAlertsByPriority);

  // Configurar filtros de estado (leyenda)
  setupStatusFilters();
}

// ========================================
// SISTEMA DE FILTROS TOGGLE - VERSIÓN MEJORADA
// ========================================

// Array para almacenar todos los marcadores con su estado
let allMarkers = [];

// Set para almacenar los filtros activos (puede haber múltiples)
let activeFilters = new Set();

/**
 * Configura los event listeners para los botones de la leyenda
 */
function setupStatusFilters() {
  const yellowBtn = document.querySelector('.leyenda-btn.yellow');
  const redBtn = document.querySelector('.leyenda-btn.red');
  const greenBtn = document.querySelector('.leyenda-btn.green');

  if (yellowBtn) {
    yellowBtn.addEventListener('click', () => handleFilterClick('verificada', yellowBtn));
  }

  if (redBtn) {
    redBtn.addEventListener('click', () => handleFilterClick('pendiente', redBtn));
  }

  if (greenBtn) {
    greenBtn.addEventListener('click', () => handleFilterClick('resuelta', greenBtn));
  }

  console.log('✅ Sistema de filtros toggle configurado');
}

/**
 * Maneja el click en un botón de filtro (toggle on/off)
 * @param {string} type - Tipo de filtro: 'verificada', 'pendiente', 'resuelta'
 * @param {HTMLElement} button - Elemento del botón clickeado
 */
function handleFilterClick(type, button) {
  // Toggle: si está activo, desactivar; si no, activar
  if (activeFilters.has(type)) {
    // Desactivar filtro
    activeFilters.delete(type);
    button.classList.remove('active');
    console.log(`🔄 Filtro "${type}" desactivado`);
  } else {
    // Activar filtro
    activeFilters.add(type);
    button.classList.add('active');
    console.log(`✅ Filtro "${type}" activado`);
  }

  // Aplicar filtros
  applyFilters();
}

/**
 * Aplica los filtros activos y muestra/oculta marcadores
 */
function applyFilters() {
  // Si no hay filtros activos, mostrar todos los marcadores
  if (activeFilters.size === 0) {
    console.log('📊 Mostrando todas las alertas (sin filtros activos)');
    allMarkers.forEach(item => {
      if (item.marker && !map.hasLayer(item.marker)) {
        map.addLayer(item.marker);
      }
    });
    return;
  }

  // Contar marcadores visibles
  let visibleCount = 0;

  // Mostrar/ocultar marcadores según filtros activos
  allMarkers.forEach(item => {
    const status = (item.status || '').toLowerCase();

    if (activeFilters.has(status)) {
      // Mostrar marcador si coincide con algún filtro activo
      if (item.marker && !map.hasLayer(item.marker)) {
        map.addLayer(item.marker);
      }
      visibleCount++;
    } else {
      // Ocultar marcador si no coincide
      if (item.marker && map.hasLayer(item.marker)) {
        map.removeLayer(item.marker);
      }
    }
  });

  console.log(`📊 Mostrando ${visibleCount} de ${allMarkers.length} alertas (filtros: ${Array.from(activeFilters).join(', ')})`);
}

// Crear nueva alerta
async function createAlert(alertData) {
  try {
    const response = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(alertData)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '(sin cuerpo)');
      console.error('❌ Error HTTP al crear alerta:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Error al crear alerta: ${response.status} ${response.statusText}`);
    }

    const newAlert = await response.json();
    console.log('Alerta creada:', newAlert);

    // Recargar alertas para mostrar la nueva
    loadAlerts();

    return newAlert;
  } catch (error) {
    console.error('Error creando alerta:', error);
    throw error;
  }
}

// Inicializar la aplicación
async function initializeApp() {
  console.log('🚀 Inicializando aplicación RCAS...');
  console.log('🔗 URL del backend:', API_BASE);

  // No bloquear por health-check: intentar cargar directamente y hacer fallback si falla
  console.log('📊 Cargando datos iniciales...');
  offlineMode = false;

  // Países con fallback
  try {
    await loadCountries();
  } catch (e) {
    console.warn('⚠️ No se pudieron cargar países desde backend. Usando modo offline.', e);
    offlineMode = true;
    loadCountriesOffline();
  }

  // Alertas con logging si falla (ya tiene demo en desarrollo)
  try {
    await loadAlerts();
  } catch (e) {
    console.warn('⚠️ No se pudieron cargar alertas.', e);
  }

  // Configurar filtros
  setupFilters();

  // Configurar listener único para el selector de países
  const countrySelect = document.getElementById('countrySelect');
  if (countrySelect) {
    countrySelect.addEventListener('change', function () {
      const selectedCountryId = this.value;
      if (selectedCountryId) {
        console.log(`🌍 País seleccionado: ${selectedCountryId}`);
        if (offlineMode) {
          loadCitiesOffline(selectedCountryId);
        } else {
          loadCities(selectedCountryId);
        }
      } else {
        clearCities();
      }
    });
    console.log('✅ Listener de países configurado');
  } else {
    console.error('❌ No se encontró el selector de países');
  }

  console.log('✅ Aplicación inicializada (tolerante a fallos)');
}

// Función de respaldo para cargar países sin backend
function loadCountriesOffline() {
  console.log('📍 Cargando países de respaldo (sin backend)...');
  const countriesOffline = [
    { id: 1, name: 'Perú' },
    { id: 2, name: 'Colombia' },
    { id: 3, name: 'Ecuador' },
    { id: 4, name: 'Bolivia' },
    { id: 5, name: 'Chile' }
  ];

  const countrySelect = document.getElementById('countrySelect');
  if (countrySelect) {
    countrySelect.innerHTML = '<option value="">Seleccionar País</option>';
    countriesOffline.forEach(country => {
      const option = document.createElement('option');
      option.value = country.id;
      option.textContent = country.name;
      countrySelect.appendChild(option);
    });
    console.log('✅ Países de respaldo cargados (funcionalidad limitada)');
  }
}

// Función para inicializar el modal de faltas
function initFaltaModal() {
  const modal = document.getElementById('modalFalta');
  const btnRegistrarFalta = document.getElementById('btnRegistrarFalta');
  const span = document.getElementsByClassName('close')[0];
  const formFalta = document.getElementById('formFalta');
  const fechaInput = document.getElementById('fechaFalta');

  // Establecer la fecha y hora actual como valor por defecto
  const now = new Date();
  // Ajustar a la zona horaria local
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  fechaInput.value = localDateTime;

  // Abrir modal al hacer clic en el botón
  btnRegistrarFalta.onclick = function () {
    modal.style.display = 'block';
  };

  // Cerrar modal al hacer clic en la X
  span.onclick = function () {
    modal.style.display = 'none';
  };

  // Cerrar modal al hacer clic fuera del contenido
  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };

  // Manejar el envío del formulario
  formFalta.onsubmit = async function (e) {
    e.preventDefault();

    const tipoFalta = document.getElementById('tipoFalta').value;
    const descripcion = document.getElementById('descripcionFalta').value;
    const fechaHora = document.getElementById('fechaFalta').value;
    const evidenciaInput = document.getElementById('evidenciaFalta');

    try {
      // Crear objeto FormData para manejar la carga de archivos
      const formData = new FormData();
      formData.append('tipo', tipoFalta);
      formData.append('descripcion', descripcion);
      formData.append('fechaHora', fechaHora);

      // Agregar archivo de evidencia si existe
      if (evidenciaInput.files.length > 0) {
        formData.append('evidencia', evidenciaInput.files[0]);
      }

      // Obtener ubicación actual del mapa si está disponible
      if (marker) {
        const latlng = marker.getLatLng();
        formData.append('latitud', latlng.lat);
        formData.append('longitud', latlng.lng);
      }

      // Obtener país y ciudad seleccionados
      const pais = document.getElementById('countrySelect').value;
      const ciudad = document.getElementById('citySelect').value;
      const direccion = document.getElementById('direccionInput').value;

      if (pais) formData.append('pais', pais);
      if (ciudad) formData.append('ciudad', ciudad);
      if (direccion) formData.append('direccion', direccion);

      // Enviar datos al servidor
      const response = await fetch(`${API_BASE}/faltas`, {
        method: 'POST',
        body: formData
        // No establecer 'Content-Type' header, ya que se establece automáticamente con el FormData
      });

      if (!response.ok) throw new Error('Error al registrar la falta');

      const result = await response.json();
      console.log('Falta registrada:', result);

      // Mostrar mensaje de éxito
      alert('Falta registrada correctamente');

      // Cerrar el modal y limpiar el formulario
      modal.style.display = 'none';
      formFalta.reset();

      // Restablecer la fecha y hora actual
      fechaInput.value = localDateTime;

    } catch (error) {
      console.error('Error al registrar la falta:', error);
      alert('Error al registrar la falta. Por favor, intente nuevamente.');
    }
  };
}

// Ejecutar cuando la página esté cargada
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  initFaltaModal();
  const btnRegistrarAlerta = document.getElementById('btnRegistrarAlerta');
  if (btnRegistrarAlerta) {
    btnRegistrarAlerta.addEventListener('click', handleRegisterAlertClick);
    console.log('✅ Listener de REGISTRAR ALERTA configurado');
  } else {
    console.warn('⚠️ No se encontró el botón btnRegistrarAlerta en el DOM');
  }
});

