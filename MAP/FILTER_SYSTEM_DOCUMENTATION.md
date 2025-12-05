# 🎯 Sistema de Filtros Toggle para Mapa Leaflet

## 📋 Descripción General

Sistema completo de filtros toggle para los botones de leyenda del mapa que permite:
- **Single Click**: Activa el filtro y muestra solo las alertas de ese tipo
- **Double Click**: Desactiva el filtro y muestra todas las alertas
- **Solo un filtro activo a la vez**: Al activar un filtro, el anterior se desactiva automáticamente
- **Feedback visual**: Los botones cambian de estilo cuando están activos

---

## 🔧 Componentes Implementados

### 1. **JavaScript (map.js)**

#### Variables Globales
```javascript
let activeStatusFilter = null;  // Filtro activo: 'verificada', 'pendiente', 'resuelta', o null
let allMarkers = [];            // Array de todos los marcadores (ya existía como allAlerts)
let clickTimeout = null;        // Timer para detectar doble click
```

#### Funciones Principales

**`setupStatusFilters()`**
- Configura los event listeners para los 3 botones de la leyenda
- Se llama automáticamente desde `setupFilters()`
- Asocia cada botón con su tipo de filtro correspondiente

**`handleFilterClick(filterType, button)`**
- Maneja clicks en los botones de filtro
- Detecta single vs double click usando un timeout de 250ms
- Single click → activa el filtro
- Double click → desactiva el filtro

**`activateFilter(filterType, button)`**
- Activa un filtro específico
- Desactiva el filtro anterior si existe
- Actualiza estilos visuales
- Filtra y muestra las alertas correspondientes

**`deactivateFilter()`**
- Desactiva el filtro activo
- Restaura estilos de botones a estado normal
- Muestra todas las alertas nuevamente

**`updateButtonStyles()`**
- Actualiza las clases CSS de los botones
- Agrega clase `.active` al botón del filtro activo
- Remueve clase `.active` de los demás botones

**`filterAlertsByStatus(filterType)`**
- Filtra el array `allAlerts` por estado
- Normaliza los valores para comparación (lowercase)
- Llama a `displayAlertsOnMap()` con las alertas filtradas
- Muestra log con cantidad de alertas filtradas

---

### 2. **CSS (stylemap.css)**

#### Estilos Base
```css
.leyenda-btn {
  /* Estilos normales del botón */
  user-select: none;  /* Previene selección de texto en doble click */
}
```

#### Estado Activo
```css
.leyenda-btn.active {
  transform: translateY(-3px) scale(1.05);  /* Elevación y escala */
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 
              0 0 0 3px rgba(255, 255, 255, 0.5);  /* Sombra + anillo */
  animation: pulse 2s infinite;  /* Animación de pulso */
}
```

#### Animación de Pulso
```css
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 
                0 0 0 3px rgba(255, 255, 255, 0.5);
  }
  50% {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 
                0 0 0 5px rgba(255, 255, 255, 0.7);
  }
}
```

#### Estilos Específicos por Botón

**Botón Amarillo (Verificadas)**
```css
.leyenda-btn.yellow.active {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: 2px solid #fbbf24;
}
```

**Botón Rojo (Pendientes)**
```css
.leyenda-btn.red.active {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  border: 2px solid #ef4444;
}
```

**Botón Verde (Resueltas)**
```css
.leyenda-btn.green.active {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  border: 2px solid #10b981;
}
```

---

## 🎮 Cómo Funciona

### Flujo de Interacción

1. **Usuario hace click en "Verificadas"**
   ```
   Click → handleFilterClick('verificada', button)
   → Espera 250ms para detectar doble click
   → Si no hay segundo click: activateFilter('verificada')
   → Filtra allAlerts por estado === 'verificada'
   → Muestra solo marcadores verificados
   → Botón amarillo obtiene clase .active
   ```

2. **Usuario hace click en "Pendientes" (con Verificadas activo)**
   ```
   Click → handleFilterClick('pendiente', button)
   → activateFilter('pendiente')
   → Primero desactiva filtro 'verificada'
   → Luego activa filtro 'pendiente'
   → Muestra solo marcadores pendientes
   → Botón rojo obtiene clase .active
   → Botón amarillo pierde clase .active
   ```

3. **Usuario hace doble click en "Pendientes"**
   ```
   Click 1 → Inicia timeout
   Click 2 (dentro de 250ms) → Cancela timeout
   → deactivateFilter()
   → Muestra todas las alertas
   → Botón rojo pierde clase .active
   ```

---

## 📊 Estructura de Datos

### Formato de Alerta
```javascript
{
  id: 1,
  title: "Alerta de prueba",
  description: "Descripción",
  latitude: -12.0464,
  longitude: -77.0428,
  status: "VERIFICADA",  // o "PENDIENTE" o "RESUELTA"
  priority: "ALTA",
  createdAt: "2024-01-15T10:30:00"
}
```

### Mapeo de Estados
```javascript
'verificada' → Botón amarillo → Icono amarillo
'pendiente'  → Botón rojo     → Icono rojo
'resuelta'   → Botón verde    → Icono verde
```

---

## 🔍 Logs de Consola

El sistema genera logs informativos:

```javascript
✅ Filtros de estado configurados
✅ Filtro "verificada" activado
📊 Mostrando 5 de 15 alertas (filtro: verificada)
🔄 Filtro "verificada" desactivado - mostrando todas las alertas
```

---

## 🎨 Feedback Visual

### Estado Normal
- Botón con gradiente de color
- Sombra suave
- Hover: elevación ligera

### Estado Activo
- Escala aumentada (1.05x)
- Elevación mayor (translateY -3px)
- Anillo blanco pulsante
- Gradiente más oscuro
- Borde de color brillante
- Animación de pulso continua

---

## 🧪 Casos de Uso

### Caso 1: Filtrar Alertas Verificadas
```
1. Click en botón amarillo "✓ Verificadas"
2. Mapa muestra solo marcadores amarillos
3. Botón amarillo se eleva y pulsa
4. Otros botones permanecen normales
```

### Caso 2: Cambiar de Filtro
```
1. Filtro "Verificadas" está activo
2. Click en botón rojo "⏳ Pendientes"
3. Filtro "Verificadas" se desactiva automáticamente
4. Filtro "Pendientes" se activa
5. Mapa muestra solo marcadores rojos
6. Botón rojo se eleva y pulsa
7. Botón amarillo vuelve a estado normal
```

### Caso 3: Desactivar Filtro
```
1. Filtro "Pendientes" está activo
2. Doble click en botón rojo "⏳ Pendientes"
3. Filtro se desactiva
4. Mapa muestra todos los marcadores
5. Botón rojo vuelve a estado normal
```

---

## ⚙️ Configuración

### Tiempo de Detección de Doble Click
```javascript
// En handleFilterClick()
setTimeout(() => {
  // ...
}, 250); // 250ms - ajustable según preferencia
```

### Velocidad de Animación de Pulso
```css
.leyenda-btn.active {
  animation: pulse 2s infinite; /* 2s - ajustable */
}
```

---

## 🐛 Solución de Problemas

### Problema: Los filtros no funcionan
**Solución**: Verificar que `setupStatusFilters()` se llama en `setupFilters()`

### Problema: Doble click no detectado
**Solución**: Aumentar el timeout de 250ms a 300ms o más

### Problema: Marcadores no se filtran
**Solución**: Verificar que `allAlerts` contiene datos y que el campo `status` o `estado` existe

### Problema: Estilos activos no se muestran
**Solución**: Verificar que la clase `.active` se agrega correctamente con DevTools

---

## 📝 Notas Importantes

1. **Compatibilidad**: El sistema usa `allAlerts` que ya existe en el código
2. **Sin conflictos**: No interfiere con el filtro de prioridad existente
3. **Normalización**: Los estados se comparan en lowercase para evitar problemas de mayúsculas
4. **Fallback**: Si `status` no existe, usa `estado` como alternativa
5. **Performance**: Solo re-renderiza marcadores cuando cambia el filtro

---

## 🚀 Mejoras Futuras Posibles

1. **Filtros múltiples**: Permitir activar varios filtros simultáneamente
2. **Persistencia**: Guardar filtro activo en localStorage
3. **Contador**: Mostrar cantidad de alertas por tipo en cada botón
4. **Animación**: Transición suave al mostrar/ocultar marcadores
5. **Teclado**: Atajos de teclado para activar filtros (1, 2, 3)

---

## ✅ Checklist de Implementación

- [x] Variables globales agregadas
- [x] Función `setupStatusFilters()` implementada
- [x] Función `handleFilterClick()` con detección de doble click
- [x] Función `activateFilter()` implementada
- [x] Función `deactivateFilter()` implementada
- [x] Función `updateButtonStyles()` implementada
- [x] Función `filterAlertsByStatus()` implementada
- [x] Estilos CSS para estado `.active` agregados
- [x] Animación de pulso implementada
- [x] Estilos específicos por botón agregados
- [x] Logs de consola para debugging
- [x] Documentación completa

---

## 📞 Soporte

Si encuentras algún problema o necesitas ayuda:
1. Revisa los logs de consola
2. Verifica que los IDs de los botones coinciden
3. Confirma que `allAlerts` tiene datos
4. Usa DevTools para inspeccionar las clases CSS

---

**Versión**: 1.0  
**Fecha**: 2024  
**Estado**: ✅ Completamente funcional
