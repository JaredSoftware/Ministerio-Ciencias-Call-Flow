const mongoose = require('mongoose');

async function initializeDatabase() {
  try {
    // Verificar si ya hay una conexión activa
    if (mongoose.connection.readyState === 1) {
    } else {
      // Esperar a que se establezca la conexión
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) {
          resolve();
        } else {
          mongoose.connection.once('connected', resolve);
        }
      });
    }

    // 1. Inicializar estados por defecto
    const StatusType = require('./models/statusType');
    await StatusType.initializeDefaultStatuses();

    // 2. Verificar que los estados están disponibles
    const statusTypes = await StatusType.find({ isActive: true }).sort('order');
    
    // Mostrar estados por categoría
    const categories = {};
    statusTypes.forEach(status => {
      if (!categories[status.category]) {
        categories[status.category] = [];
      }
      categories[status.category].push(status);
    });



  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}

// Exportar la función para que pueda ser usada desde otros archivos
module.exports = { initializeDatabase };

// Si se ejecuta directamente, inicializar la base de datos
if (require.main === module) {
  initializeDatabase();
}
