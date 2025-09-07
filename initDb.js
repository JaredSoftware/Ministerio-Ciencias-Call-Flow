const mongoose = require('mongoose');

async function initializeDatabase() {
  try {
    // Verificar si ya hay una conexión activa
    if (mongoose.connection.readyState === 1) {
      console.log('🔗 Usando conexión existente a MongoDB');
    } else {
      console.log('⏳ Esperando conexión a MongoDB...');
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
    console.log(`📋 Estados disponibles: ${statusTypes.length}`);
    
    // Mostrar estados por categoría
    const categories = {};
    statusTypes.forEach(status => {
      if (!categories[status.category]) {
        categories[status.category] = [];
      }
      categories[status.category].push(status);
    });

    Object.keys(categories).forEach(category => {
      console.log(`   ${category.toUpperCase()}: ${categories[category].length} estados`);
    });

    console.log('✅ Sistema de estados listo para usar!');

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
