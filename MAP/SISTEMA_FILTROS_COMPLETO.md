# 🎯 Sistema de Filtros Toggle - Documentación Completa

## 📋 Descripción

Sistema de filtros tipo toggle para mapa Leaflet con 3 botones de estado: **VERIFICADAS** (amarillo), **PENDIENTES** (rojo) y **RESUELTAS** (verde).

---

## ✨ Características

✅ **Toggle On/Off**: Un click activa, otro click desactiva  
✅ **Múltiples filtros**: Puedes activar varios botones simultáneamente  
✅ **Feedback visual**: Botones con animación de pulso cuando están activos  
✅ **Mostrar/Ocultar**: Los marcadores se muestran/ocultan dinámicamente  
✅ **Sin filtros = Todo visible**: Si no hay filtros activos, se muestran todas las alertas  

---

## 📁 Estructura de Archivos

### 1. **HTML** (map.html)

```html
<!-- Legend -->
<div class="leyenda" role="group" aria-label="Leyenda del mapa">
    <button class="leyenda-btn yellow" aria-label="Alertas verificadas">
        ✓ Verificadas
    </button>
    <button class="leyenda-btn red" aria-label="Alertas pendientes">
        ⏳ Pendientes
    </button>
    <button class="leyenda-btn green" aria-label="Alertas resueltas">
        ✓ Resueltas
    </button>
</div>
```

**Clases importantes:**
- `.leyenda` - Contenedor de los botones
- `.leyenda-btn` - Clase base de cada botón
- `.yellow`, `.red`, `.green` - Clases de color
- `.active` - Clase que se agrega cuando el filtro está activo

---

### 2. **CSS** (stylemap.css)

#### Estilos Base
```css
.leyenda-btn {
  border: none;
  padding: 10px 20px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-inverse);
  border-radius: var(--radius-full);
  transition: all var(--transition-base);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  position: relative;
  user-select: none;
}
```

#### Estado Activo
```css
.leyenda-btn.active {
  transform: translateY(-4px) scale(1.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 
              0 0 0 4px rgba(255, 255, 255, 0.6);
  animation: pulseActive 2s ease-in-out infinite;
  font-weight: 800;
}
```

#### Animación de Pulso
```css
@keyframes pulseActive {
  0%, 100% {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 
                0 0 0 4px rgba(255, 255, 255, 0.6);
  }
  50% {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 
                0 0 0 6px rgba(255, 255, 255, 0.8);
  }
}
```

#### Botones por Color

**Amarillo (Verificadas)**
```css
.leyenda-btn.yellow {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #1e293b;
}

.leyenda-btn.yellow.active {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  color: #ffffff;
  border: 3px solid #fbbf24;
}
```

**Rojo (Pendientes)**
```css
.leyenda-btn.red {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.leyenda-btn.red.active {
  background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
  border: 3px solid #ef4444;
}
```

**Verde (Resueltas)**
```css
.leyenda-btn.green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.leyenda-btn.green.active {
  background: linear-gradient(135deg, #047857 0%, #065f46 100%);
  border: 3px solid #10b981;
}
```

---

### 3. **JavaScript** (map.js)

#### Variables Globales

```javascript
// Array para almacenar todos los marcadores con su estado
let allMarkers = [];

// Set para almacenar los filtros activos (puede haber múltiples)
let activeFilters = new Set();
```

**Estructura de `allMarkers`:**
```javascript
[
  {
    marker: L.marker(...),  // Objeto Leaflet Marker
    status: "verificada"    // Estado: "verificada", "pendiente", "resuelta"
  },
  {
    marker: L.marker(...),
    status: "pendiente"
  },
  // ...
]
```

---

#### Función: `setupStatusFilters()`

**Propósito:** Configura los event listeners para los botones de la leyenda

```javascript
function setupStatusFilters() {
  const yellowBtn = document.querySelector('.leyenda-btn.yellow');
  const redBtn = document.querySelector('.leyenda-btn.red');
  const greenBtn = document.querySelector('.leyenda-btn.green');
  
  if (yellowBtn) {
    yellowBtn.addEventListener('click', () => 
      handleFilterClick('verificada', yellowBtn)
    );
  }
  
  if (redBtn) {
    redBtn.addEventListener('click', () => 
      handleFilterClick('pendiente', redBtn)
    );
  }
  
  if (greenBtn) {
    greenBtn.addEventListener('click', () => 
      handleFilterClick('resuelta', greenBtn)
    );
  }
  
  console.log('✅ Sistema de filtros toggle configurado');
}
```

**Cuándo se llama:** Automáticamente desde `setupFilters()` al cargar el mapa

---

#### Función: `handleFilterClick(type, button)`

**Propósito:** Maneja el click en un botón de filtro (toggle on/off)

**Parámetros:**
- `type` (string): Tipo de filtro - `'verificada'`, `'pendiente'`, `'resuelta'`
- `button` (HTMLElement): Elemento del botón clickeado

```javascript
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
```

**Comportamiento:**
1. Verifica si el filtro ya está activo
2. Si está activo → lo desactiva (remueve del Set y quita clase `.active`)
3. Si no está activo → lo activa (agrega al Set y añade clase `.active`)
4. Llama a `applyFilters()` para actualizar el mapa

---

#### Función: `applyFilters()`

**Propósito:** Aplica los filtros activos y muestra/oculta marcadores

```javascript
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
```

**Lógica:**
1. Si `activeFilters` está vacío → muestra todos los marcadores
2. Si hay filtros activos:
   - Recorre cada marcador en `allMarkers`
   - Si el `status` del marcador está en `activeFilters` → lo muestra
   - Si no está → lo oculta
3. Registra en consola cuántos marcadores son visibles

---

#### Función: `displayAlertsOnMap(alerts)` - MODIFICADA

**Propósito:** Crea marcadores y los almacena en `allMarkers`

```javascript
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
```

**Cambios importantes:**
1. Limpia el array `allMarkers` antes de crear nuevos marcadores
2. Almacena cada marcador con su estado en `allMarkers`
3. Aplica filtros automáticamente si hay filtros activos

---

## 🎮 Flujo de Interacción

### Escenario 1: Activar un filtro

```
Usuario hace click en "VERIFICADAS"
    ↓
handleFilterClick('verificada', button)
    ↓
activeFilters.add('verificada')
    ↓
button.classList.add('active')
    ↓
applyFilters()
    ↓
Muestra solo marcadores con status === 'verificada'
    ↓
Oculta marcadores con status !== 'verificada'
```

**Resultado visual:**
- Botón amarillo se eleva, escala y pulsa
- Solo marcadores amarillos visibles en el mapa
- Consola: `✅ Filtro "verificada" activado`
- Consola: `📊 Mostrando X de Y alertas (filtros: verificada)`

---

### Escenario 2: Activar múltiples filtros

```
Usuario hace click en "VERIFICADAS"
    ↓
activeFilters = Set(['verificada'])
    ↓
Usuario hace click en "PENDIENTES"
    ↓
activeFilters = Set(['verificada', 'pendiente'])
    ↓
applyFilters()
    ↓
Muestra marcadores con status === 'verificada' O 'pendiente'
    ↓
Oculta marcadores con status === 'resuelta'
```

**Resultado visual:**
- Botones amarillo y rojo activos (elevados y pulsando)
- Marcadores amarillos y rojos visibles
- Marcadores verdes ocultos
- Consola: `📊 Mostrando X de Y alertas (filtros: verificada, pendiente)`

---

### Escenario 3: Desactivar un filtro

```
activeFilters = Set(['verificada', 'pendiente'])
    ↓
Usuario hace click en "VERIFICADAS" (ya activo)
    ↓
handleFilterClick('verificada', button)
    ↓
activeFilters.delete('verificada')
    ↓
activeFilters = Set(['pendiente'])
    ↓
button.classList.remove('active')
    ↓
applyFilters()
    ↓
Muestra solo marcadores con status === 'pendiente'
```

**Resultado visual:**
- Botón amarillo vuelve a estado normal
- Botón rojo sigue activo
- Solo marcadores rojos visibles
- Consola: `🔄 Filtro "verificada" desactivado`

---

### Escenario 4: Desactivar todos los filtros

```
activeFilters = Set(['pendiente'])
    ↓
Usuario hace click en "PENDIENTES" (último activo)
    ↓
activeFilters.delete('pendiente')
    ↓
activeFilters = Set([])  // Vacío
    ↓
applyFilters()
    ↓
activeFilters.size === 0
    ↓
Muestra TODOS los marcadores
```

**Resultado visual:**
- Todos los botones en estado normal
- Todos los marcadores visibles (amarillos, rojos, verdes)
- Consola: `📊 Mostrando todas las alertas (sin filtros activos)`

---

## 📊 Estructura de Datos

### Formato de Alerta (Backend)

```javascript
{
  id: 1,
  title: "Alerta de seguridad",
  description: "Descripción detallada",
  latitude: -12.0464,
  longitude: -77.0428,
  status: "VERIFICADA",  // o "PENDIENTE" o "RESUELTA"
  priority: "ALTA",
  createdAt: "2024-01-15T10:30:00Z"
}
```

### Formato en `allMarkers`

```javascript
[
  {
    marker: L.marker([-12.0464, -77.0428], { icon: yellowIcon }),
    status: "verificada"  // Normalizado a lowercase
  },
  {
    marker: L.marker([-12.0500, -77.0500], { icon: redIcon }),
    status: "pendiente"
  },
  {
    marker: L.marker([-12.0600, -77.0600], { icon: greenIcon }),
    status: "resuelta"
  }
]
```

### Formato de `activeFilters`

```javascript
// Sin filtros activos
activeFilters = Set([])

// Un filtro activo
activeFilters = Set(['verificada'])

// Múltiples filtros activos
activeFilters = Set(['verificada', 'pendiente'])

// Todos los filtros activos
activeFilters = Set(['verificada', 'pendiente', 'resuelta'])
```

---

## 🔍 Logs de Consola

El sistema genera logs informativos para debugging:

```javascript
// Al configurar
✅ Sistema de filtros toggle configurado

// Al activar filtro
✅ Filtro "verificada" activado

// Al desactivar filtro
🔄 Filtro "verificada" desactivado

// Al aplicar filtros (con filtros activos)
📊 Mostrando 5 de 15 alertas (filtros: verificada, pendiente)

// Al aplicar filtros (sin filtros activos)
📊 Mostrando todas las alertas (sin filtros activos)

// Al cargar marcadores
📍 15 marcadores cargados en el mapa
```

---

## 🎨 Feedback Visual Detallado

### Estado Normal (Inactivo)

```css
/* Botón normal */
padding: 10px 20px
font-weight: 700
transform: translateY(0) scale(1)
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15)
```

**Apariencia:**
- Tamaño normal
- Sombra suave
- Gradiente de color base

### Estado Hover

```css
/* Al pasar el mouse */
transform: translateY(-3px)
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2)
```

**Apariencia:**
- Se eleva ligeramente
- Sombra más pronunciada
- Gradiente más oscuro

### Estado Activo (Filtro ON)

```css
/* Filtro activado */
transform: translateY(-4px) scale(1.08)
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 
            0 0 0 4px rgba(255, 255, 255, 0.6)
animation: pulseActive 2s ease-in-out infinite
font-weight: 800
border: 3px solid [color]
```

**Apariencia:**
- Elevado y escalado (8% más grande)
- Anillo blanco pulsante alrededor
- Gradiente más oscuro e intenso
- Borde de color brillante
- Animación continua de pulso
- Texto más grueso

---

## 🧪 Casos de Prueba

### Test 1: Activar filtro único
```
1. Cargar mapa con 15 alertas (5 verificadas, 5 pendientes, 5 resueltas)
2. Click en "VERIFICADAS"
3. ✅ Verificar: Solo 5 marcadores amarillos visibles
4. ✅ Verificar: Botón amarillo tiene clase .active
5. ✅ Verificar: Consola muestra "Mostrando 5 de 15 alertas"
```

### Test 2: Activar múltiples filtros
```
1. Click en "VERIFICADAS"
2. Click en "PENDIENTES"
3. ✅ Verificar: 10 marcadores visibles (5 amarillos + 5 rojos)
4. ✅ Verificar: Ambos botones tienen clase .active
5. ✅ Verificar: Marcadores verdes ocultos
```

### Test 3: Desactivar filtro
```
1. Activar "VERIFICADAS" y "PENDIENTES"
2. Click en "VERIFICADAS" (desactivar)
3. ✅ Verificar: Solo 5 marcadores rojos visibles
4. ✅ Verificar: Botón amarillo sin clase .active
5. ✅ Verificar: Botón rojo sigue con clase .active
```

### Test 4: Desactivar todos los filtros
```
1. Activar "PENDIENTES"
2. Click en "PENDIENTES" (desactivar último filtro)
3. ✅ Verificar: Todos los 15 marcadores visibles
4. ✅ Verificar: Ningún botón tiene clase .active
5. ✅ Verificar: Consola muestra "Mostrando todas las alertas"
```

### Test 5: Cambio rápido de filtros
```
1. Click en "VERIFICADAS"
2. Click en "PENDIENTES"
3. Click en "VERIFICADAS" (desactivar)
4. Click en "RESUELTAS"
5. ✅ Verificar: Solo marcadores rojos y verdes visibles
6. ✅ Verificar: Botones rojo y verde activos
```

---

## 🐛 Solución de Problemas

### Problema: Los filtros no funcionan

**Posibles causas:**
1. `setupStatusFilters()` no se está llamando
2. Los botones no tienen las clases correctas
3. `allMarkers` está vacío

**Solución:**
```javascript
// Verificar en consola:
console.log('activeFilters:', activeFilters);
console.log('allMarkers:', allMarkers);
console.log('Botones:', document.querySelectorAll('.leyenda-btn'));
```

---

### Problema: Los marcadores no se ocultan

**Posibles causas:**
1. El campo `status` no existe en las alertas
2. Los valores de `status` no coinciden (mayúsculas/minúsculas)

**Solución:**
```javascript
// Verificar estructura de marcadores:
allMarkers.forEach((item, i) => {
  console.log(`Marcador ${i}:`, item.status);
});

// Verificar filtros activos:
console.log('Filtros activos:', Array.from(activeFilters));
```

---

### Problema: Los estilos activos no se muestran

**Posibles causas:**
1. La clase `.active` no se está agregando
2. Conflicto de CSS

**Solución:**
```javascript
// Verificar clases en DevTools o consola:
document.querySelectorAll('.leyenda-btn').forEach(btn => {
  console.log(btn.className, btn.classList.contains('active'));
});
```

---

### Problema: Todos los marcadores desaparecen

**Posibles causas:**
1. `activeFilters` tiene valores incorrectos
2. Los valores de `status` no coinciden con los filtros

**Solución:**
```javascript
// Normalizar valores:
const status = (item.status || '').toLowerCase().trim();

// Verificar coincidencias:
allMarkers.forEach(item => {
  console.log(`Status: "${item.status}", En filtros: ${activeFilters.has(item.status)}`);
});
```

---

## 🚀 Mejoras Futuras

### 1. Contador de Alertas
```javascript
// Mostrar cantidad en cada botón
<button class="leyenda-btn yellow">
  ✓ Verificadas <span class="count">(5)</span>
</button>
```

### 2. Animación de Transición
```javascript
// Fade in/out al mostrar/ocultar marcadores
marker.setOpacity(0);
setTimeout(() => marker.setOpacity(1), 100);
```

### 3. Persistencia en LocalStorage
```javascript
// Guardar filtros activos
localStorage.setItem('activeFilters', JSON.stringify(Array.from(activeFilters)));

// Restaurar al cargar
const saved = JSON.parse(localStorage.getItem('activeFilters') || '[]');
activeFilters = new Set(saved);
```

### 4. Atajos de Teclado
```javascript
// Teclas 1, 2, 3 para activar filtros
document.addEventListener('keydown', (e) => {
  if (e.key === '1') handleFilterClick('verificada', yellowBtn);
  if (e.key === '2') handleFilterClick('pendiente', redBtn);
  if (e.key === '3') handleFilterClick('resuelta', greenBtn);
});
```

### 5. Filtro "Seleccionar Todo"
```javascript
// Botón para activar/desactivar todos los filtros
<button class="leyenda-btn all">Todos</button>
```

---

## ✅ Checklist de Implementación

- [x] HTML con 3 botones de leyenda
- [x] CSS con estilos base y estado activo
- [x] Animación de pulso para botones activos
- [x] Variable `allMarkers` para almacenar marcadores
- [x] Variable `activeFilters` (Set) para filtros activos
- [x] Función `setupStatusFilters()` para configurar listeners
- [x] Función `handleFilterClick(type, button)` para toggle
- [x] Función `applyFilters()` para mostrar/ocultar marcadores
- [x] Modificación de `displayAlertsOnMap()` para usar `allMarkers`
- [x] Logs de consola para debugging
- [x] Soporte para múltiples filtros simultáneos
- [x] Normalización de valores (lowercase)
- [x] Documentación completa

---

## 📞 Soporte y Debugging

### Comandos Útiles en Consola

```javascript
// Ver filtros activos
console.log('Filtros activos:', Array.from(activeFilters));

// Ver todos los marcadores
console.log('Total marcadores:', allMarkers.length);
allMarkers.forEach((item, i) => {
  console.log(`${i}: status="${item.status}", visible=${map.hasLayer(item.marker)}`);
});

// Ver botones
document.querySelectorAll('.leyenda-btn').forEach(btn => {
  console.log(btn.textContent, 'active:', btn.classList.contains('active'));
});

// Forzar aplicación de filtros
applyFilters();

// Limpiar todos los filtros
activeFilters.clear();
document.querySelectorAll('.leyenda-btn').forEach(btn => {
  btn.classList.remove('active');
});
applyFilters();
```

---

**Versión:** 2.0  
**Fecha:** 2024  
**Estado:** ✅ Completamente funcional  
**Compatibilidad:** Leaflet 1.x+  
**Navegadores:** Chrome, Firefox, Safari, Edge
