const API_BASE_URL = 'https://mi-backend-production-a259.up.railway.app/api';

const api = {
    // Helper para headers con token (si implementamos JWT en el futuro)
    getHeaders: () => {
        const headers = {
            'Content-Type': 'application/json'
        };
        const user = JSON.parse(localStorage.getItem('rcas_user'));
        if (user && user.token) {
            headers['Authorization'] = `Bearer ${user.token}`;
        }
        return headers;
    },

    // Login
    login: async (identity, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity, password })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Error al iniciar sesión');
            }

            const data = await response.json();
            // Guardar usuario en localStorage
            localStorage.setItem('rcas_user', JSON.stringify(data.user || data));
            return data.user || data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Register (para crear nuevos admins)
    register: async (userData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Error al registrar usuario');
            }

            return await response.json();
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    // Obtener todas las alertas (Admin ve todas)
    getAlerts: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/alerts`, {
                headers: api.getHeaders()
            });
            if (!response.ok) throw new Error('Error al obtener alertas');

            const data = await response.json();
            // Manejar diferentes formatos de respuesta
            if (Array.isArray(data)) return data;
            if (data.alerts && Array.isArray(data.alerts)) return data.alerts;
            if (data.data && Array.isArray(data.data)) return data.data;
            return [];
        } catch (error) {
            console.error('Get alerts error:', error);
            return [];
        }
    },

    // Actualizar alerta
    updateAlert: async (id, updates) => {
        try {
            const user = JSON.parse(localStorage.getItem('rcas_user'));
            const userId = user ? user.id : '';

            const response = await fetch(`${API_BASE_URL}/alerts/${id}?userId=${userId}`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('Error al actualizar alerta');
            return await response.json();
        } catch (error) {
            console.error('Update alert error:', error);
            throw error;
        }
    },

    // Eliminar alerta
    deleteAlert: async (id) => {
        try {
            const user = JSON.parse(localStorage.getItem('rcas_user'));
            const userId = user ? user.id : '';

            const response = await fetch(`${API_BASE_URL}/alerts/${id}?userId=${userId}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });

            if (!response.ok) throw new Error('Error al eliminar alerta');
            return true;
        } catch (error) {
            console.error('Delete alert error:', error);
            throw error;
        }
    },

    // Obtener usuarios
    getUsers: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                headers: api.getHeaders()
            });
            if (!response.ok) throw new Error('Error al obtener usuarios');
            return await response.json();
        } catch (error) {
            console.error('Get users error:', error);
            return [];
        }
    },

    // Actualizar usuario
    updateUser: async (userId, updates) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Error al actualizar usuario');
            }
            return await response.json();
        } catch (error) {
            console.error('Update user error:', error);
            throw error;
        }
    },

    // Eliminar usuario
    deleteUser: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Error al eliminar usuario');
            }
            return true;
        } catch (error) {
            console.error('Delete user error:', error);
            throw error;
        }
    }
};
