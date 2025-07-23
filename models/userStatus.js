const mongoose = require('mongoose');

const userStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    unique: true
  },
  status: {
    type: String,
    required: true
  },
  customStatus: {
    type: String,
    maxlength: 100,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    default: null
  },
  sessionId: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#00d25b'
  },
  label: {
    type: String,
    default: 'Disponible'
  },
  // Eliminada referencia a StatusType para hacer el sistema completamente dinámico
}, {
  timestamps: true
});

// Método para actualizar lastSeen
userStatusSchema.methods.updateActivity = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Método para cambiar estado - COMPLETAMENTE DINÁMICO
userStatusSchema.methods.changeStatus = async function(newStatus, customStatus = null) {
  this.status = newStatus;
  this.customStatus = customStatus;
  
  // Obtener información del StatusType para este estado
  try {
    const StatusType = require('./statusType');
  const statusType = await StatusType.findOne({ value: newStatus, isActive: true });
  
  if (statusType) {
    this.color = statusType.color;
    this.label = statusType.label;
      console.log(`✅ Estado configurado desde StatusType: ${newStatus} -> ${statusType.label} (${statusType.color})`);
  } else {
      // Fallback si no se encuentra el StatusType
      this.color = this.color || '#00d25b';
      this.label = newStatus;
      console.log(`⚠️ StatusType no encontrado para: ${newStatus}, usando fallback`);
    }
  } catch (error) {
    console.error('❌ Error obteniendo StatusType:', error);
    // Fallback en caso de error
    this.color = this.color || '#00d25b';
    this.label = newStatus;
  }
  
  return this.save();
};

// Método estático para obtener usuarios activos
userStatusSchema.statics.getActiveUsers = function() {
  return this.find({ 
    isActive: true,
    lastSeen: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Últimos 30 minutos
  }).populate({
    path: 'userId',
    select: 'name correo role',
    populate: {
      path: 'role',
      select: 'nombre'
    }
  });
};

// Método estático para obtener estado de un usuario
userStatusSchema.statics.getUserStatus = function(userId) {
  return this.findOne({ userId }).populate('userId', 'name correo');
};

// Método estático para crear o actualizar estado
userStatusSchema.statics.upsertStatus = async function(userId, statusData) {
  // Si no se especifica un estado, obtener el estado por defecto de la base de datos
  if (!statusData.status) {
    try {
      const StatusType = require('./statusType');
      const defaultStatus = await StatusType.getDefaultStatus();
      if (defaultStatus) {
        statusData.status = defaultStatus.value;
        statusData.color = defaultStatus.color;
        statusData.label = defaultStatus.label;
        console.log(`✅ Usando estado por defecto: ${defaultStatus.value} (${defaultStatus.color})`);
      } else {
        // Fallback si no hay estado por defecto
        console.log('⚠️ No se encontró estado por defecto en la BD');
        throw new Error('No se encontró estado por defecto en la base de datos');
      }
    } catch (error) {
      console.error('❌ Error obteniendo estado por defecto:', error);
      // Fallback en caso de error
      console.error('❌ Error obteniendo estado por defecto:', error);
      throw new Error('Error obteniendo estado por defecto de la base de datos');
    }
  }

  const userStatus = await this.findOneAndUpdate(
    { userId },
    { 
      ...statusData,
      lastSeen: new Date()
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  ).populate('userId', 'name correo');
  
  // Solo llamar changeStatus si no se especificaron color y label
  if (statusData.status && (!statusData.color || !statusData.label)) {
    await userStatus.changeStatus(statusData.status, statusData.customStatus);
  }
  
  return userStatus;
};

module.exports = mongoose.model('UserStatus', userStatusSchema); 