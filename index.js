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
  console.log(`🚀 Servidor iniciado en http://localhost:${app.get("port")}`);
  console.log(`📡 Socket.IO habilitado`);
  console.log(`⚡ StateManager activo`);
  
  // 🚨 PUBLICAR LISTA DE USUARIOS ACTIVOS PERIÓDICAMENTE
  setInterval(async () => {
    try {
      // Obtener función emitActiveUsersList del app.js
      const { emitActiveUsersList } = require('./app');
      if (typeof emitActiveUsersList === 'function') {
        await emitActiveUsersList();
        console.log('📊 Lista de usuarios activos publicada automáticamente');
      }
    } catch (error) {
      console.error('❌ Error en publicación periódica de usuarios activos:', error);
    }
  }, 30000); // Cada 30 segundos
  
  console.log('🚀 Sistema de eventos Pub/Sub (MQTT) con publicación automática inicializado');
  
  // 🚀 INICIAR SERVICIO DE ASIGNACIÓN AUTOMÁTICA
  autoAssignService.start();
  console.log('🎯 Servicio de asignación automática iniciado');
});
