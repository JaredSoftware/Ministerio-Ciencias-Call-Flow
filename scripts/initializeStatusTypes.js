const mongoose = require('mongoose');
const StatusType = require('../models/statusType');

// Configuración de conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ministerio_educacion';

async function initializeStatusTypes() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('🔄 Inicializando tipos de estado...');
    await StatusType.initializeDefaultStatuses();
    
    console.log('🔄 Verificando estados...');
    const statuses = await StatusType.getActiveStatuses();
    
    console.log(`✅ Estados encontrados: ${statuses.length}`);
    console.log('\n📊 Lista de estados:');
    
    statuses.forEach((status, index) => {
      console.log(`${index + 1}. ${status.value} - ${status.label} (${status.category})`);
    });
    
    // Verificar si hay estados faltantes
    const expectedValues = [
      'available', 'busy', 'on_call', 'focus',
      'break', 'lunch', 'meeting', 'training', 'do_not_disturb',
      'away', 'out_of_office', 'offline'
    ];
    
    const missingValues = expectedValues.filter(expected => 
      !statuses.find(status => status.value === expected)
    );
    
    if (missingValues.length > 0) {
      console.log('\n❌ Estados faltantes:', missingValues);
    } else {
      console.log('\n✅ Todos los estados están presentes');
    }
    
    // Verificar estado por defecto
    const defaultStatus = await StatusType.getDefaultStatus();
    if (defaultStatus) {
      console.log(`\n🎯 Estado por defecto: ${defaultStatus.value} - ${defaultStatus.label}`);
    } else {
      console.log('\n⚠️ No hay estado por defecto configurado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeStatusTypes();
}

module.exports = initializeStatusTypes; 