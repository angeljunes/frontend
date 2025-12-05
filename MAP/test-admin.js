// TEST: Verificar que el usuario tiene rol ADMIN
// Abre la consola (F12) y ejecuta esto:
// localStorage.getItem('rcas_user')

// Si quieres forzar un usuario ADMIN para pruebas, ejecuta esto en la consola:
/*
localStorage.setItem('rcas_user', JSON.stringify({
  id: 1,
  username: 'admin',
  fullName: 'Admin de Prueba',
  email: 'admin@test.com',
  role: 'ADMIN',
  zone: 'Lima'
}));
*/

// Luego recarga la página y abre el modal
