// ========================================
// EJEMPLO DE USO - SISTEMA DE FILTROS TOGGLE
// ========================================

// Este archivo muestra cómo usar el sistema de filtros
// en diferentes escenarios

// ========================================
// EJEMPLO 1: Datos de prueba
// ========================================

const alertasDePrueba = [
  {
    id: 1,
    title: "Alerta de seguridad",
    description: "Robo reportado",
    latitude: -12.0464,
    longitude: -77.0428,
    status: "VERIFICADA",
    priority: "ALTA",
    createdAt: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    title: "Alerta de tráfico",
    description: "Accidente vehicular",
    latitude: -12.0500,
    longitude: -77.0500,
    status: "PENDIENTE",
    priority: "MEDIA",
    createdAt: "2024-01-15T11:00:00Z"
  },
  {
    id: 3,
    title: "Alerta resuelta",
    description: "Problema solucionado",
    latitude: -12.0600,
    longitude: -77.0600,
    status: "RESUELTA",
    priority: "BAJA",
    createdAt: "2024-01-15T09:00:00Z"
  },
  {
    id: 4,
    title: "Otra alerta verificada",
    description: "Confirmada por autoridades",
    latitude: -12.0550,
    longitude: -77.0450,
    status: "VERIFICADA",
    priority: "ALTA",
    createdAt: "2024-01-15T12:00:00Z"
  },
  {
    id: 5,
    title: "Alerta pendiente de revisión",
    description: "En proceso de verificación",
    latitude: -12.0480,
    longitude: -77.0520,
    status: "PENDIENTE",
    priority: "MEDIA",
    createdAt: "2024-01-15T13:00:00Z"
  }
];

// ========================================
// EJEMPLO 2: Cargar alertas en el mapa
// ========================================

// Simplemente llama a displayAlertsOnMap con tus alertas
// El sistema automáticamente las almacenará en allMarkers
function cargarAlertasDeEjemplo() {
  displayAlertsOnMap(alertasDePrueba);
  console.log('✅ Alertas de ejemplo cargadas');
  console.log(`📍 Total de marcadores: ${allMarkers.length}`);
}

// ========================================
// EJEMPLO 3: Activar filtro programáticamente
// ========================================

function activarFiltroVerificadas() {
  const yellowBtn = document.querySelector('.leyenda-btn.yellow');
  if (yellowBtn) {
    handleFilterClick('verificada', yellowBtn);
  }
}

function activarFiltroPendientes() {
  const redBtn = document.querySelector('.leyenda-btn.red');
  if (redBtn) {
    handleFilterClick('pendiente', redBtn);
  }
}

function activarFiltroResueltas() {
  const greenBtn = document.querySelector('.leyenda-btn.green');
  if (greenBtn) {
    handleFilterClick('resuelta', greenBtn);
  }
}

// ========================================
// EJEMPLO 4: Activar múltiples filtros
// ========================================

function activarVerificadasYPendientes() {
  activarFiltroVerificadas();
  setTimeout(() => {
    activarFiltroPendientes();
  }, 100);
}

// ========================================
// EJEMPLO 5: Desactivar todos los filtros
// ========================================

function desactivarTodosLosFiltros() {
  // Limpiar el Set de filtros activos
  activeFilters.clear();
  
  // Remover clase active de todos los botones
  document.querySelectorAll('.leyenda-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Aplicar filtros (mostrará todos los marcadores)
  applyFilters();
  
  console.log('🔄 Todos los filtros desactivados');
}

// ========================================
// EJEMPLO 6: Obtener estadísticas
// ========================================

function obtenerEstadisticas() {
  const stats = {
    total: allMarkers.length,
    verificadas: allMarkers.filter(m => m.status === 'verificada').length,
    pendientes: allMarkers.filter(m => m.status === 'pendiente').length,
    resueltas: allMarkers.filter(m => m.status === 'resuelta').length,
    filtrosActivos: Array.from(activeFilters),
    marcadoresVisibles: allMarkers.filter(m => map.hasLayer(m.marker)).length
  };
  
  console.log('📊 ESTADÍSTICAS DEL MAPA');
  console.log('========================');
  console.log(`Total de alertas: ${stats.total}`);
  console.log(`  ✓ Verificadas: ${stats.verificadas}`);
  console.log(`  ⏳ Pendientes: ${stats.pendientes}`);
  console.log(`  ✓ Resueltas: ${stats.resueltas}`);
  console.log(`Filtros activos: ${stats.filtrosActivos.join(', ') || 'ninguno'}`);
  console.log(`Marcadores visibles: ${stats.marcadoresVisibles}`);
  
  return stats;
}

// ========================================
// EJEMPLO 7: Verificar estado de un filtro
// ========================================

function estaActivoFiltro(tipo) {
  return activeFilters.has(tipo);
}

function verificarEstadoFiltros() {
  console.log('🔍 ESTADO DE FILTROS');
  console.log('====================');
  console.log(`Verificadas: ${estaActivoFiltro('verificada') ? '✅ ACTIVO' : '❌ INACTIVO'}`);
  console.log(`Pendientes: ${estaActivoFiltro('pendiente') ? '✅ ACTIVO' : '❌ INACTIVO'}`);
  console.log(`Resueltas: ${estaActivoFiltro('resuelta') ? '✅ ACTIVO' : '❌ INACTIVO'}`);
}

// ========================================
// EJEMPLO 8: Filtrar por múltiples criterios
// ========================================

function filtrarPorPrioridadYEstado(prioridad, estado) {
  // Primero activar el filtro de estado
  const buttons = {
    'verificada': document.querySelector('.leyenda-btn.yellow'),
    'pendiente': document.querySelector('.leyenda-btn.red'),
    'resuelta': document.querySelector('.leyenda-btn.green')
  };
  
  const button = buttons[estado];
  if (button && !activeFilters.has(estado)) {
    handleFilterClick(estado, button);
  }
  
  // Luego filtrar por prioridad (si existe el selector)
  const dangerSelect = document.getElementById('dangerLevelSelect');
  if (dangerSelect) {
    dangerSelect.value = prioridad;
    dangerSelect.dispatchEvent(new Event('change'));
  }
}

// ========================================
// EJEMPLO 9: Animación de demostración
// ========================================

async function demoAnimada() {
  console.log('🎬 Iniciando demostración animada...');
  
  // Paso 1: Mostrar todas
  desactivarTodosLosFiltros();
  await esperar(2000);
  
  // Paso 2: Filtrar verificadas
  console.log('📍 Mostrando solo VERIFICADAS...');
  activarFiltroVerificadas();
  await esperar(2000);
  
  // Paso 3: Agregar pendientes
  console.log('📍 Agregando PENDIENTES...');
  activarFiltroPendientes();
  await esperar(2000);
  
  // Paso 4: Quitar verificadas
  console.log('📍 Quitando VERIFICADAS...');
  activarFiltroVerificadas(); // Toggle off
  await esperar(2000);
  
  // Paso 5: Agregar resueltas
  console.log('📍 Agregando RESUELTAS...');
  activarFiltroResueltas();
  await esperar(2000);
  
  // Paso 6: Mostrar todas de nuevo
  console.log('📍 Mostrando TODAS...');
  desactivarTodosLosFiltros();
  
  console.log('✅ Demostración completada');
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// EJEMPLO 10: Exportar datos filtrados
// ========================================

function exportarDatosFiltrados() {
  const marcadoresVisibles = allMarkers.filter(m => map.hasLayer(m.marker));
  
  const datos = marcadoresVisibles.map(item => ({
    status: item.status,
    lat: item.marker.getLatLng().lat,
    lng: item.marker.getLatLng().lng
  }));
  
  console.log('📤 DATOS FILTRADOS');
  console.log(JSON.stringify(datos, null, 2));
  
  return datos;
}

// ========================================
// EJEMPLO 11: Buscar marcador por coordenadas
// ========================================

function buscarMarcadorCercano(lat, lng, radio = 0.01) {
  const cercanos = allMarkers.filter(item => {
    const pos = item.marker.getLatLng();
    const distLat = Math.abs(pos.lat - lat);
    const distLng = Math.abs(pos.lng - lng);
    return distLat < radio && distLng < radio;
  });
  
  console.log(`🔍 Encontrados ${cercanos.length} marcadores cerca de (${lat}, ${lng})`);
  return cercanos;
}

// ========================================
// EJEMPLO 12: Centrar mapa en marcadores filtrados
// ========================================

function centrarEnMarcadoresFiltrados() {
  const marcadoresVisibles = allMarkers.filter(m => map.hasLayer(m.marker));
  
  if (marcadoresVisibles.length === 0) {
    console.warn('⚠️ No hay marcadores visibles para centrar');
    return;
  }
  
  const latlngs = marcadoresVisibles.map(m => m.marker.getLatLng());
  const bounds = L.latLngBounds(latlngs);
  map.fitBounds(bounds, { padding: [50, 50] });
  
  console.log(`🎯 Mapa centrado en ${marcadoresVisibles.length} marcadores`);
}

// ========================================
// EJEMPLO 13: Atajos de teclado
// ========================================

function configurarAtajosTeclado() {
  document.addEventListener('keydown', (e) => {
    // Solo si no estamos escribiendo en un input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    switch(e.key) {
      case '1':
        activarFiltroVerificadas();
        console.log('⌨️ Atajo: Filtro VERIFICADAS');
        break;
      case '2':
        activarFiltroPendientes();
        console.log('⌨️ Atajo: Filtro PENDIENTES');
        break;
      case '3':
        activarFiltroResueltas();
        console.log('⌨️ Atajo: Filtro RESUELTAS');
        break;
      case '0':
        desactivarTodosLosFiltros();
        console.log('⌨️ Atajo: Desactivar todos');
        break;
      case 's':
        obtenerEstadisticas();
        break;
    }
  });
  
  console.log('⌨️ Atajos de teclado configurados:');
  console.log('  1 = Toggle Verificadas');
  console.log('  2 = Toggle Pendientes');
  console.log('  3 = Toggle Resueltas');
  console.log('  0 = Desactivar todos');
  console.log('  S = Mostrar estadísticas');
}

// ========================================
// EJEMPLO 14: Guardar/Restaurar estado
// ========================================

function guardarEstadoFiltros() {
  const estado = {
    filtrosActivos: Array.from(activeFilters),
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('filtrosMapaRCAS', JSON.stringify(estado));
  console.log('💾 Estado de filtros guardado');
}

function restaurarEstadoFiltros() {
  const estadoGuardado = localStorage.getItem('filtrosMapaRCAS');
  
  if (!estadoGuardado) {
    console.log('ℹ️ No hay estado guardado');
    return;
  }
  
  const estado = JSON.parse(estadoGuardado);
  
  // Restaurar filtros
  estado.filtrosActivos.forEach(tipo => {
    const buttons = {
      'verificada': document.querySelector('.leyenda-btn.yellow'),
      'pendiente': document.querySelector('.leyenda-btn.red'),
      'resuelta': document.querySelector('.leyenda-btn.green')
    };
    
    const button = buttons[tipo];
    if (button) {
      handleFilterClick(tipo, button);
    }
  });
  
  console.log(`♻️ Estado restaurado (guardado: ${estado.timestamp})`);
}

// ========================================
// COMANDOS RÁPIDOS PARA LA CONSOLA
// ========================================

console.log(`
╔════════════════════════════════════════════════════════╗
║  SISTEMA DE FILTROS TOGGLE - COMANDOS DISPONIBLES     ║
╚════════════════════════════════════════════════════════╝

📊 INFORMACIÓN:
  obtenerEstadisticas()          - Ver estadísticas del mapa
  verificarEstadoFiltros()       - Ver qué filtros están activos

🎮 CONTROL DE FILTROS:
  activarFiltroVerificadas()     - Activar filtro de verificadas
  activarFiltroPendientes()      - Activar filtro de pendientes
  activarFiltroResueltas()       - Activar filtro de resueltas
  desactivarTodosLosFiltros()    - Desactivar todos los filtros

🎬 DEMOSTRACIONES:
  demoAnimada()                  - Ver demostración animada
  cargarAlertasDeEjemplo()       - Cargar alertas de prueba

🔧 UTILIDADES:
  centrarEnMarcadoresFiltrados() - Centrar mapa en marcadores visibles
  exportarDatosFiltrados()       - Exportar datos filtrados a JSON
  configurarAtajosTeclado()      - Activar atajos de teclado (1,2,3,0,S)

💾 PERSISTENCIA:
  guardarEstadoFiltros()         - Guardar estado actual
  restaurarEstadoFiltros()       - Restaurar estado guardado

🔍 BÚSQUEDA:
  buscarMarcadorCercano(lat, lng, radio) - Buscar marcadores cerca

═══════════════════════════════════════════════════════════

💡 TIP: Escribe el nombre de cualquier función para ejecutarla
`);

// ========================================
// AUTO-CONFIGURACIÓN (OPCIONAL)
// ========================================

// Descomentar para activar atajos de teclado automáticamente
// configurarAtajosTeclado();

// Descomentar para restaurar estado guardado al cargar
// window.addEventListener('load', () => {
//   restaurarEstadoFiltros();
// });

// Descomentar para guardar estado automáticamente al cambiar filtros
// const originalHandleFilterClick = handleFilterClick;
// handleFilterClick = function(...args) {
//   originalHandleFilterClick.apply(this, args);
//   guardarEstadoFiltros();
// };
