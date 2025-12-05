// ========================================
// MODAL DE ESTADO DE ALERTAS
// ========================================

let currentUser = null; // Para almacenar el usuario actual
let currentFilterStatus = 'all';
let modalAlerts = []; // Alertas específicas del modal

// Función para obtener el usuario actual
function getCurrentUser() {
    // Obtener usuario de localStorage (guardado al iniciar sesión)
    const userStr = localStorage.getItem('rcas_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            console.log('✅ Usuario encontrado:', user.fullName || user.username, '- Rol:', user.role);
            return user;
        } catch (e) {
            console.error('Error parsing user:', e);
        }
    }

    // Si no hay usuario, retornar null
    console.warn('⚠️ No hay usuario autenticado. Por favor inicia sesión.');
    return null;
}

// Abrir modal de Estado de Alertas
function openAlertStatusModal() {
    const modal = document.getElementById('modalEstadoAlerta');
    if (modal) {
        currentUser = getCurrentUser();

        // Verificar si hay usuario autenticado
        if (!currentUser) {
            alert('⚠️ Debes iniciar sesión primero.\n\nSerás redirigido a la página de inicio de sesión.');
            // Redirigir a la página de inicio de sesión
            window.location.href = '../INICIAR SESION/index.html';
            return;
        }

        console.log('👤 Usuario actual:', currentUser.fullName || currentUser.username, '- Rol:', currentUser.role);
        modal.style.display = 'block';
        loadAlertsForModal();
    }
}

// Cerrar modal
function closeAlertStatusModal() {
    const modal = document.getElementById('modalEstadoAlerta');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Cargar alertas para el modal
async function loadAlertsForModal() {
    const container = document.getElementById('alertListContainer');
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; color: #666;">Cargando alertas...</p>';

    try {
        const response = await fetch(`${API_BASE}/alerts`);
        if (!response.ok) throw new Error('Error al cargar alertas');

        const alerts = await response.json();
        modalAlerts = Array.isArray(alerts) ? alerts : [];

        console.log(`📊 Cargadas ${modalAlerts.length} alertas`);
        renderAlertCards(modalAlerts);
    } catch (error) {
        console.error('Error loading alerts:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--color-danger);">Error al cargar alertas. Verifica que el backend esté corriendo.</p>';
    }
}

// Renderizar tarjetas de alertas
function renderAlertCards(alerts) {
    const container = document.getElementById('alertListContainer');
    if (!container) return;

    // Filtrar por estado si es necesario
    let filteredAlerts = alerts;
    if (currentFilterStatus !== 'all') {
        filteredAlerts = alerts.filter(a => a.status === currentFilterStatus);
    }

    if (filteredAlerts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No hay alertas para mostrar.</p>';
        return;
    }

    // Re-obtener usuario para asegurar datos frescos
    const user = getCurrentUser();

    // Lógica robusta para detectar ADMIN
    let isAdmin = false;
    let userRole = 'INVITADO';

    if (user) {
        // Intentar obtener el rol de varias propiedades posibles
        userRole = user.role || user.rol || user.type || user.tipo || 'USER';
        userRole = String(userRole).toUpperCase();

        // Verificar si es admin
        isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRATOR' || userRole === 'ADMINISTRADOR';
    }

    // Debug visual en el título del modal
    const modalTitle = document.querySelector('#modalEstadoAlerta h2');
    if (modalTitle) {
        modalTitle.innerHTML = `📊 Estado de Alertas <span style="font-size: 12px; opacity: 0.7; display: block; margin-top: 5px;">Usuario: ${user ? (user.username || 'Usuario') : 'Anónimo'} | Rol: ${userRole}</span>`;
    }

    console.log('=== RENDERIZANDO ALERTAS ===');
    console.log('Usuario:', user);
    console.log('Rol detectado:', userRole);
    console.log('Es Admin:', isAdmin);

    container.innerHTML = filteredAlerts.map(alert => `
    <div class="alert-card">
      <div class="alert-card-header">
        <div>
          <div class="alert-card-title">${alert.title || 'Sin título'}</div>
          <div class="alert-card-meta">
            <span class="alert-badge ${(alert.priority || 'media').toLowerCase()}">${alert.priority || 'MEDIA'}</span>
            <span class="alert-badge ${(alert.status || 'pendiente').toLowerCase()}">${alert.status || 'PENDIENTE'}</span>
          </div>
        </div>
      </div>
      <div class="alert-card-description">
        ${alert.description || 'Sin descripción'}
      </div>
      <div class="alert-card-footer">
        <div class="alert-card-info">
          📍 ${alert.zone || 'Sin zona'} • 🕒 ${formatAlertDate(alert.createdAt)}
        </div>
        <div class="alert-card-actions">
          <button class="btn-small btn-view" onclick="viewAlertOnMap(${alert.latitude}, ${alert.longitude})">
            📍 Ver en mapa
          </button>
          ${isAdmin ? `
            <button class="btn-small btn-edit" onclick="editAlert('${alert.id}')" style="background-color: var(--color-accent); color: white; margin-left: 5px;">
              ✏️ Editar
            </button>
            <button class="btn-small btn-delete" onclick="deleteAlertFromModal('${alert.id}')" style="background-color: var(--color-danger); color: white; margin-left: 5px;">
              🗑️ Eliminar
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}
// Formatear fecha de alerta
function formatAlertDate(dateString) {
    if (!dateString) return 'Fecha desconocida';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Fecha inválida';
    }
}

// Ver alerta en el mapa
function viewAlertOnMap(lat, lng) {
    if (lat && lng) {
        map.setView([lat, lng], 17);
        closeAlertStatusModal();
    }
}

// Editar alerta (solo ADMIN)
async function editAlert(alertId) {
    const alert = modalAlerts.find(a => a.id === alertId);
    if (!alert) return;

    const newStatus = prompt('Cambiar estado a (PENDIENTE, VERIFICADA, RESUELTA):', alert.status);
    if (!newStatus) return;

    const validStatuses = ['PENDIENTE', 'VERIFICADA', 'RESUELTA'];
    if (!validStatuses.includes(newStatus.toUpperCase())) {
        alert('Estado inválido. Usa: PENDIENTE, VERIFICADA o RESUELTA');
        return;
    }

    try {
        // Soportar tanto id como _id
        const userId = currentUser ? (currentUser.id || currentUser._id) : '';
        console.log(`✏️ Editando alerta ${alertId} con usuario ${userId}`);

        const response = await fetch(`${API_BASE}/alerts/${alertId}?userId=${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus.toUpperCase() })
        });

        if (!response.ok) throw new Error('Error al actualizar alerta');

        alert('✅ Alerta actualizada correctamente');
        loadAlertsForModal();
    } catch (error) {
        console.error('Error updating alert:', error);
        alert('❌ Error al actualizar la alerta');
    }
}

// Eliminar alerta (solo ADMIN)
async function deleteAlertFromModal(alertId) {
    if (!confirm('¿Estás seguro de eliminar esta alerta?')) return;

    try {
        // Soportar tanto id como _id
        const userId = currentUser ? (currentUser.id || currentUser._id) : '';
        console.log(`🗑️ Eliminando alerta ${alertId} con usuario ${userId}`);

        const response = await fetch(`${API_BASE}/alerts/${alertId}?userId=${userId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error al eliminar alerta');

        alert('✅ Alerta eliminada correctamente');
        loadAlertsForModal();
    } catch (error) {
        console.error('Error deleting alert:', error);
        alert('❌ Error al eliminar la alerta');
    }
}

// Filtrar alertas por estado
function filterAlertsByStatus(status) {
    currentFilterStatus = status;

    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === status) {
            btn.classList.add('active');
        }
    });

    renderAlertCards(modalAlerts);
}

// Inicializar eventos del modal
function initAlertStatusModal() {
    const btnEstado = document.querySelector('.btn-estado');
    const closeBtn = document.getElementById('closeEstadoModal');
    const modal = document.getElementById('modalEstadoAlerta');

    if (btnEstado) {
        btnEstado.addEventListener('click', openAlertStatusModal);
        console.log('✅ Botón Estado de Alerta configurado');
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeAlertStatusModal);
    }

    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeAlertStatusModal();
            }
        });
    }

    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            filterAlertsByStatus(filter);
        });
    });
}

// Añadir al DOMContentLoaded existente
document.addEventListener('DOMContentLoaded', () => {
    initAlertStatusModal();
    console.log('✅ Modal de Estado de Alertas inicializado');
});
