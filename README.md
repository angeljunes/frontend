# 🚀 Sistema RCAS - Guía de Inicio Rápido

## 📋 Descripción

**RCAS** (Registro y Control de Alertas de Seguridad) es un sistema integral para la gestión de alertas ciudadanas con geolocalización, monitoreo en tiempo real y coordinación comunitaria.

## 🎯 Inicio Rápido

### Método 1: Inicio Automático (Recomendado)

1. Asegúrate de que tu backend Java esté ejecutándose en `http://localhost:8081`
2. Haz doble clic en el archivo **`INICIAR.bat`**
3. El navegador se abrirá automáticamente con la página principal

### Método 2: Servidor Live

1. Abre el proyecto en VS Code
2. Instala la extensión **Live Server**
3. Click derecho en `index.html` → "Open with Live Server"
4. Navega a `http://127.0.0.1:5500/RCAS/`

## 🏗️ Estructura del Proyecto

```
RCAS/
├── index.html              # 🏠 Página principal/landing
├── style.css               # 🎨 Estilos de la landing page
├── INICIAR.bat             # ⚡ Script de inicio automático
│
├── INICIAR SESION/         # 🔐 Módulo de Login
│   ├── index.html
│   ├── estilo.css
│   ├── logo.jpg
│   ├── google.png
│   └── facebook.webp
│
├── CREAR CUENTA/           # 📝 Módulo de Registro
│   ├── index2.html
│   ├── estilo2.css
│   ├── logo2.png
│   ├── google.png
│   └── facebook.webp
│
├── MAP/                    # 🗺️ Módulo del Mapa
│   ├── map.html           # Mapa interactivo principal
│   ├── map.js             # Lógica del mapa
│   ├── stylemap.css       # Estilos del mapa
│   ├── modal-alerts.js    # Sistema de alertas
│   └── modal-styles.css   # Estilos de modales
│
├── WEB_ADMIN/              # 👨‍💼 Panel de Administración
│   ├── index.html
│   ├── css/
│   └── js/
│
└── SISTEM/                 # 🔧 Sistema adicional
    └── CARGA.html
```

## 🔧 Requisitos

### Backend Java

- **Java 11+** instalado
- Backend ejecutándose en **puerto 8081**
- Endpoints requeridos:
  - `POST /api/auth/register` - Registro de usuarios
  - `POST /api/auth/login` - Inicio de sesión
  - `GET /api/alerts` - Obtener alertas
  - `POST /api/alerts` - Crear alertas
  - `PUT /api/alerts/{id}` - Actualizar alertas
  - `DELETE /api/alerts/{id}` - Eliminar alertas

### Frontend

- Navegador moderno (Chrome, Firefox, Edge)
- VS Code con Live Server (opcional pero recomendado)

## 👥 Sistema de Usuarios

### Roles Disponibles

1. **USER** (Ciudadano)
   - Puede registrar alertas
   - Visualiza el mapa
   - NO puede editar/eliminar alertas

2. **ADMIN** (Presidente de Barrio / Autoridad)
   - Todas las funciones de USER
   - Puede editar estados de alertas
   - Puede eliminar alertas
   - Acceso al panel de administración

### Crear Usuario

1. Ir a "Crear Cuenta" desde la página principal
2. Completar el formulario:
   - Nombres y apellidos
   - Correo electrónico
   - Cargo: Ciudadano = USER, Presidente/Autoridad = ADMIN
   - Zona de residencia
   - Usuario
   - Contraseña (mínimo 6 caracteres)
3. Click en "Crear"
4. Serás redirigido al login

### Iniciar Sesión

1. Ir a "Iniciar Sesión"
2. Ingresar correo y contraseña
3. (Opcional) Marcar "Recordarme"
4. Click en "Continuar"
5. Serás redirigido al mapa

## 🗺️ Funcionalidades del Mapa

### Registrar Alerta

1. Click en el mapa para seleccionar ubicación
2. Click en "🚨 Registrar Alerta"
3. Llenar formulario de alerta
4. La alerta aparecerá en el mapa

### Ver Estado de Alertas

1. Click en "📊 Estado de Alerta"
2. Filtrar por: Todas / Pendientes / Verificadas / Resueltas
3. **Si eres ADMIN**: Puedes editar y eliminar alertas
4. **Si eres USER**: Solo puedes visualizar

### Botón de Emergencia

1. Click en "🚨 Emergencia"
2. Se enviará automáticamente tu ubicación actual
3. Se creará una alerta de prioridad ALTA

## 🎨 Características

✅ **Diseño Moderno** - UI/UX actualizado con gradientes y animaciones  
✅ **Responsive** - Funciona en móvil, tablet y desktop  
✅ **Validación en Tiempo Real** - Formularios inteligentes  
✅ **Notificaciones** - Sistema de mensajes elegantes  
✅ **Geolocalización** - Ubicación automática del usuario  
✅ **Sistema de Roles** - Permisos por tipo de usuario  
✅ **Persistencia** - Datos almacenados en backend  

## 🔐 Seguridad

- Contraseñas encriptadas en backend
- Validación de datos en cliente y servidor
- Tokens de sesión en localStorage
- Control de acceso basado en roles (RBAC)

## 🐛 Solución de Problemas

### El backend no responde

```bash
# Verificar que el backend esté corriendo
curl http://localhost:8081/api/alerts
```

Si no funciona:
1. Verifica que Java esté instalado: `java -version`
2. Inicia el backend Java en puerto 8081
3. Verifica el firewall no bloquee el puerto

### Las alertas no aparecen

1. Abre la consola del navegador (F12)
2. Verifica errores de CORS
3. Asegúrate que el backend permita requests desde `http://127.0.0.1`

### Error al iniciar sesión

1. Verifica que el usuario esté creado en la base de datos
2. Revisa la consola del navegador para errores
3. Verifica que el endpoint `/api/auth/login` esté disponible

### El script INICIAR.bat no funciona

1. Edita `INICIAR.bat`
2. Cambia la URL según tu configuración:
   ```bat
   start "" "http://127.0.0.1:5500/RCAS/index.html"
   ```
3. Guarda y ejecuta nuevamente

## 📞 Soporte

Para problemas o sugerencias:
1. Revisa la consola del navegador (F12)
2. Verifica los logs del backend
3. Consulta este README

## 🚀 Próximas Mejoras

- [ ] Notificaciones push en tiempo real
- [ ] Chat entre usuarios
- [ ] Estadísticas y gráficos
- [ ] Exportación de reportes
- [ ] App móvil nativa
- [ ] Integración con redes sociales

---

**Desarrollado para la comunidad RCAS** 🛡️  
*Comunidad segura, futuro mejor*
