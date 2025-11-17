const { app, server, io } = require("./app");
const fs = require("fs");

// Configurar limpieza automática de estados
const stateManager = require("./services/stateManager");

// Configurar asignación automática de tipificaciones
const autoAssignService = require("./services/autoAssignService");

// Limpiar estados antiguos cada hora
setInterval(() => {
  stateManager.cleanupOldStates();
}, 60 * 60 * 1000);

// Iniciar servidor
server.listen(app.get("port"), function () {
  
  // 🚨 PUBLICAR LISTA DE USUARIOS ACTIVOS PERIÓDICAMENTE
  setInterval(async () => {
    try {
      // Obtener función emitActiveUsersList del app.js
      const { emitActiveUsersList } = require('./app');
      if (typeof emitActiveUsersList === 'function') {
        await emitActiveUsersList();
      }
    } catch (error) {
      console.error('❌ Error en publicación periódica de usuarios activos:', error);
    }
  }, 30000); // Cada 30 segundos
  
  
  // 🚀 INICIAR SERVICIO DE ASIGNACIÓN AUTOMÁTICA
  autoAssignService.start();
});
