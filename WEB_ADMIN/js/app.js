// Estado de la aplicación
const state = {
    user: JSON.parse(localStorage.getItem('rcas_user')),
    alerts: [],
    map: null,
    markers: {},
    selectedAlertId: null,
    currentView: 'map' // 'map' or 'list'
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    if (state.user) {
        initDashboard();
    } else {
        initLogin();
    }
});

// --- AUTENTICACIÓN ---

function checkAuth() {
    const path = window.location.pathname;
    const isLoginPage = document.getElementById('login-section') && !document.getElementById('login-section').classList.contains('hidden');

    if (!state.user && !isLoginPage) {
        showLogin();
    } else if (state.user && isLoginPage) {
        showDashboard();
    }
}

function initLogin() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const identity = document.getElementById('identity').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button');

            try {
                btn.disabled = true;
                btn.textContent = 'Iniciando...';

                const user = await api.login(identity, password);

                // Permitir acceso a ADMIN y USER
                state.user = user;
                showDashboard();
            } catch (error) {
                alert(error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Ingresar';
            }
        });
    }
}

function logout() {
    localStorage.removeItem('rcas_user');
    state.user = null;
    window.location.reload();
}

function showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');

    // Mapeo de Roles
    const roleLabel = document.getElementById('admin-role-label');
    const zoneDisplay = document.getElementById('user-zone-display');

    if (state.user.role === 'ADMIN') {
        roleLabel.textContent = 'Autoridad / Presidente de Barrio';

        // Mostrar botón de gestión de usuarios solo para ADMIN
        const btnUsers = document.getElementById('btn-users');
        if (btnUsers) {
            btnUsers.style.display = 'flex';
        }
    } else {
        roleLabel.textContent = 'Ciudadano';
    }

    // Mostrar Zona
    if (state.user.zone) {
        zoneDisplay.textContent = state.user.zone;
    } else {
        zoneDisplay.textContent = 'Lima (General)';
    }

    initMap();
    startAlertPolling();
}

// --- NAVEGACIÓN ---

function switchView(viewName) {
    state.currentView = viewName;

    // Actualizar botones de navegación
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(viewName)) {
            btn.classList.add('active');
        }
    });

    // Cambiar visibilidad de secciones
    const mapSection = document.getElementById('view-map');
    const listSection = document.getElementById('view-list');
    const sidebarList = document.getElementById('sidebar-alert-list');
    const mapStats = document.getElementById('map-stats');

    if (viewName === 'map') {
        mapSection.classList.add('active');
        mapSection.classList.remove('hidden');
        listSection.classList.remove('active');
        listSection.classList.add('hidden');
        if (document.getElementById('view-users')) {
            document.getElementById('view-users').classList.add('hidden');
            document.getElementById('view-users').classList.remove('active');
        }

        // Mostrar elementos del sidebar específicos del mapa
        sidebarList.style.display = 'block';
        mapStats.style.display = 'flex';

        // Redimensionar mapa (fix Leaflet)
        if (state.map) {
            setTimeout(() => {
                state.map.invalidateSize();
            }, 100);
        }
    } else if (viewName === 'list') {
        mapSection.classList.remove('active');
        mapSection.classList.add('hidden');
        listSection.classList.add('active');
        listSection.classList.remove('hidden');
        if (document.getElementById('view-users')) {
            document.getElementById('view-users').classList.add('hidden');
            document.getElementById('view-users').classList.remove('active');
        }

        // Ocultar elementos del sidebar no necesarios en lista
        sidebarList.style.display = 'none';
        mapStats.style.display = 'none';

        renderFullAlertTable();
    } else if (viewName === 'users') {
        mapSection.classList.remove('active');
        mapSection.classList.add('hidden');
        listSection.classList.remove('active');
        listSection.classList.add('hidden');

        const usersSection = document.getElementById('view-users');
        if (usersSection) {
            usersSection.classList.add('active');
            usersSection.classList.remove('hidden');
        }

        // Ocultar elementos del sidebar
        sidebarList.style.display = 'none';
        mapStats.style.display = 'none';

        renderUserTable();
    }
}

// --- MAPA ---

function initMap() {
    if (state.map) return;

    // Inicializar Leaflet
    state.map = L.map('map').setView([-12.0464, -77.0428], 13); // Lima default

    // Capa oscura para estilo moderno
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy;OpenStreetMap, &copy;CartoDB'
    }).addTo(state.map);
}

function updateMapMarkers() {
    // Limpiar marcadores antiguos que ya no están
    const currentIds = state.alerts.map(a => a.id);
    Object.keys(state.markers).forEach(id => {
        if (!currentIds.includes(id)) {
            state.map.removeLayer(state.markers[id]);
            delete state.markers[id];
        }
    });

    // Añadir/Actualizar marcadores
    state.alerts.forEach(alert => {
        if (!state.markers[alert.id]) {
            const color = getPriorityColor(alert.priority);

            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px ${color}; border: 2px solid white;"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            const marker = L.marker([alert.latitude, alert.longitude], { icon })
                .addTo(state.map)
                .bindPopup(createPopupContent(alert));

            marker.on('click', () => {
                selectAlert(alert.id);
                // Si estamos en lista, cambiar a mapa
                if (state.currentView === 'list') {
                    switchView('map');
                }
            });

            state.markers[alert.id] = marker;
        }
    });
}

function createPopupContent(alert) {
    return `
        <div class="popup-content">
            <strong>${alert.title}</strong><br>
            <span class="badge ${alert.priority.toLowerCase()}">${alert.priority}</span>
            <p>${alert.description}</p>
            <small>${new Date(alert.createdAt).toLocaleString()}</small>
        </div>
    `;
}

// --- ALERTAS ---

let pollingInterval;

function startAlertPolling() {
    loadAlerts(); // Carga inicial
    pollingInterval = setInterval(loadAlerts, 5000); // Poll cada 5s
}

async function loadAlerts() {
    try {
        const alerts = await api.getAlerts();

        // Detectar nuevas alertas para notificar
        if (state.alerts.length > 0 && alerts.length > state.alerts.length) {
            const newAlert = alerts[0]; // Asumiendo orden descendente
            showToast(`Nueva alerta: ${newAlert.title}`);
            playNotificationSound();
        }

        state.alerts = alerts;

        // Renderizar según la vista actual
        if (state.currentView === 'map') {
            renderSidebarList();
        } else {
            renderFullAlertTable();
        }

        updateMapMarkers();
        updateStats();
    } catch (error) {
        console.error('Error loading alerts:', error);
        const list = document.getElementById('sidebar-alert-list');
        if (list) {
            list.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--danger);">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i><br>
                    Error de conexión.<br>
                    <button onclick="loadAlerts()" class="btn-login" style="margin-top: 10px; padding: 5px 10px; font-size: 0.8rem;">Reintentar</button>
                </div>
            `;
        }
    }
}

function renderSidebarList() {
    const list = document.getElementById('sidebar-alert-list');
    if (!list) return;

    list.innerHTML = '';

    if (state.alerts.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No hay alertas registradas</div>';
        return;
    }

    state.alerts.forEach(alert => {
        const item = document.createElement('div');
        item.className = `alert-item ${state.selectedAlertId === alert.id ? 'selected' : ''} ${alert.priority.toLowerCase()}`;
        item.onclick = () => selectAlert(alert.id);

        item.innerHTML = `
            <div class="alert-header">
                <span class="alert-title">${alert.title}</span>
                <span class="alert-time">${formatTime(alert.createdAt)}</span>
            </div>
            <div class="alert-desc">${alert.description}</div>
            <div class="alert-footer">
                <span class="badge ${alert.status.toLowerCase()}">${alert.status}</span>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderFullAlertTable() {
    const tbody = document.getElementById('full-alerts-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (state.alerts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No hay alertas registradas</td></tr>';
        return;
    }

    const isAdmin = state.user && state.user.role && state.user.role.toUpperCase() === 'ADMIN';

    state.alerts.forEach(alert => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${alert.title}</strong></td>
            <td>${alert.description}</td>
            <td>${alert.zone || 'General'}</td>
            <td><span class="badge ${alert.priority.toLowerCase()}">${alert.priority}</span></td>
            <td><span class="badge ${alert.status.toLowerCase()}">${alert.status}</span></td>
            <td>${new Date(alert.createdAt).toLocaleString()}</td>
            <td>
                <div class="alert-actions">
                    ${isAdmin && alert.status !== 'RESUELTA' ?
                `<button onclick="updateStatus('${alert.id}', 'RESUELTA', event)" class="btn-icon check" title="Resolver">✓</button>` : ''}
                    ${isAdmin ?
                `<button onclick="deleteAlert('${alert.id}', event)" class="btn-icon trash" title="Eliminar">🗑️</button>` :
                '<span style="color: #666; font-size: 0.8rem;">Solo lectura</span>'}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function renderUserTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Cargando usuarios...</td></tr>';

    try {
        const users = await api.getUsers();
        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No hay usuarios registrados</td></tr>';
            return;
        }

        const isAdmin = state.user && state.user.role && state.user.role.toUpperCase() === 'ADMIN';

        users.forEach(user => {
            const tr = document.createElement('tr');
            const isCurrentUser = state.user && state.user.id === user.id;

            tr.innerHTML = `
                <td>${user.id}</td>
                <td>
                    <strong id="username-${user.id}">${user.username || user.identity || 'N/A'}</strong>
                    ${isAdmin && !isCurrentUser ? `
                        <button onclick="editUsername('${user.id}', event)" class="btn-icon-small" title="Edit" style="margin-left: 8px;">✏️</button>
                    ` : ''}
                </td>
                <td>${user.email || 'N/A'}</td>
                <td>
                    <select id="role-${user.id}" 
                            class="role-select ${user.role === 'ADMIN' ? 'admin-role' : 'user-role'}"
                            onchange="changeUserRole('${user.id}', this.value)" 
                            ${!isAdmin || isCurrentUser ? 'disabled' : ''}>
                        <option value="USER" ${user.role === 'USER' ? 'selected' : ''}>USER</option>
                        <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
                    </select>
                    ${isCurrentUser ? '<small style="color: #999; display: block; font-size: 0.7rem;">(Tú)</small>' : ''}
                </td>
                <td>${user.zone || 'General'}</td>
                <td>
                    ${isAdmin && !isCurrentUser ? `
                        <button onclick="confirmDeleteUser('${user.id}', '${user.username || user.identity}')" 
                                class="btn-icon trash" 
                                title="Eliminar usuario">🗑️</button>
                    ` : isCurrentUser ? '<span style="color: #999; font-size: 0.8rem;">-</span>' : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error rendering users:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--danger);">Error al cargar usuarios</td></tr>';
    }
}

// Editar username
async function editUsername(userId, event) {
    if (event) event.stopPropagation();

    const usernameElement = document.getElementById(`username-${userId}`);
    const currentUsername = usernameElement.textContent;

    const newUsername = prompt('Nuevo nombre de usuario:', currentUsername);
    if (!newUsername || newUsername === currentUsername) return;

    if (newUsername.length < 3) {
        alert('El nombre de usuario debe tener al menos 3 caracteres');
        return;
    }

    try {
        await api.updateUser(userId, { username: newUsername });
        usernameElement.textContent = newUsername;
        showToast('✅ Nombre de usuario actualizado');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Cambiar rol de usuario
async function changeUserRole(userId, newRole) {
    if (!confirm(`¿Cambiar el rol de este usuario a ${newRole}?`)) {
        // Revert selection
        renderUserTable();
        return;
    }

    try {
        await api.updateUser(userId, { role: newRole });
        showToast(`✅ Rol actualizado a ${newRole}`);

        // Update select appearance
        const select = document.getElementById(`role-${userId}`);
        if (select) {
            select.className = `role-select ${newRole === 'ADMIN' ? 'admin-role' : 'user-role'}`;
        }
    } catch (error) {
        alert('Error: ' + error.message);
        renderUserTable(); // Reload table on error
    }
}

// Eliminar usuario con confirmación
async function confirmDeleteUser(userId, username) {
    const confirmed = confirm(
        `⚠️ ¿Estás seguro de eliminar al usuario "${username}"?\n\n` +
        `Esta acción NO se puede deshacer.`
    );

    if (!confirmed) return;

    // Double confirmation for safety
    const doubleConfirm = prompt(
        `Para confirmar, escribe "ELIMINAR" (en mayúsculas):`,
        ''
    );

    if (doubleConfirm !== 'ELIMINAR') {
        alert('Eliminación cancelada');
        return;
    }

    try {
        await api.deleteUser(userId);
        showToast('✅ Usuario eliminado correctamente');
        renderUserTable(); // Reload table
    } catch (error) {
        alert('Error al eliminar: ' + error.message);
    }
}

function selectAlert(id) {
    state.selectedAlertId = id;

    // Si estamos en lista, no hacemos zoom automático, solo resaltamos
    if (state.currentView === 'map') {
        renderSidebarList();
        const alert = state.alerts.find(a => a.id === id);
        if (alert && state.map) {
            state.map.flyTo([alert.latitude, alert.longitude], 16, {
                animate: true,
                duration: 1.5
            });
            if (state.markers[id]) {
                state.markers[id].openPopup();
            }
        }
    }
}

async function updateStatus(id, status, event) {
    if (event) event.stopPropagation();
    if (!confirm('¿Cambiar estado de la alerta?')) return;

    try {
        await api.updateAlert(id, { status });
        loadAlerts();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteAlert(id, event) {
    if (event) event.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar esta alerta?')) return;

    try {
        await api.deleteAlert(id);
        loadAlerts();
    } catch (error) {
        alert(error.message);
    }
}

// --- UTILIDADES ---

function updateStats() {
    const total = state.alerts.length;
    const pending = state.alerts.filter(a => a.status === 'PENDIENTE').length;
    const high = state.alerts.filter(a => a.priority === 'ALTA').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-high').textContent = high;
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'ALTA': return '#ff4444';
        case 'MEDIA': return '#ffbb33';
        case 'BAJA': return '#00C851';
        default: return '#33b5e5';
    }
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function playNotificationSound() {
    // Implementar sonido si se desea
}
