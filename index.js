const { app, server, io } = require("./app");
const fs = require("fs");

// Configurar limpieza automática de estados
const stateManager = require("./services/stateManager");

// Limpiar estados antiguos cada hora
setInterval(() => {
  stateManager.cleanupOldStates();
}, 60 * 60 * 1000);

// Iniciar servidor
server.listen(app.get("port"), function () {
  console.log(`🚀 Servidor iniciado en http://localhost:${app.get("port")}`);
  console.log(`📡 Socket.IO habilitado`);
  console.log(`⚡ StateManager activo`);
});
