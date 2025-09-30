const mongoose = require('mongoose');

// Configuración de base de datos (misma que db.js)
const config = {
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "password123",
  server: process.env.DB_HOST || "127.0.0.1",
  database: process.env.DB || "menv",
  port: process.env.DB_PORT || 37017,
};

const server = `${config.server}:${config.port}`;
var user = ``;
if (config.user.length > 0 && config.password.length > 0) {
  user = `${config.user}:${config.password}@`;
}

const URI = `mongodb://${user}${server}/${config.database}?authSource=admin`;
mongoose.set("strictQuery", false);

async function setupTestUser() {
  try {
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ Conectado a MongoDB');
    
    const UserStatus = require('../models/userStatus');
    const users = require('../models/users');
    
    // Buscar el primer usuario
    const firstUser = await users.findOne({}, '_id name correo');
    if (!firstUser) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }
    
    console.log(`🛠️ Configurando usuario: ${firstUser.name} (${firstUser.correo})`);
    
    // Configurar en estado 'available'
    await UserStatus.findOneAndUpdate(
      { userId: firstUser._id },
      {
        status: 'available',
        isActive: true,
        lastSeen: new Date(),
        socketId: 'test-socket-' + Date.now(),
        sessionId: 'test-session-' + Date.now()
      },
      { upsert: true }
    );
    
    console.log('✅ Usuario configurado en estado "available"');
    console.log('🎉 Listo para probar tipificaciones!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

setupTestUser(); 