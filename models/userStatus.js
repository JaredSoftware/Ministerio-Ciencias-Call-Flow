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
  // Historial de cambios de estado
  statusHistory: [
    {
      status: { type: String, required: true },
      timestamp: { type: Date, required: true },
      duration: { type: String, default: null }
    }
  ]
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
  // Guardar el estado anterior antes de cambiar
  const prevStatus = this.status;
  const prevTimestamp = this.lastSeen || this.updatedAt || this.createdAt || new Date();
  const now = new Date();
  if (prevStatus && prevStatus !== newStatus) {
    // Calcular duración
    const diffMs = now - prevTimestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    let duration = '';
    if (diffDays > 0) duration = `${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`;
    else if (diffHours > 0) duration = `${diffHours}h ${diffMins % 60}m`;
    else if (diffMins > 0) duration = `${diffMins}m`;
    else duration = 'menos de 1m';
    // Agregar al historial
    this.statusHistory = this.statusHistory || [];
    this.statusHistory.unshift({
      status: prevStatus,
      timestamp: prevTimestamp,
      duration
    });
    // Limitar historial a los últimos 30 cambios
    if (this.statusHistory.length > 30) {
      this.statusHistory = this.statusHistory.slice(0, 30);
    }
  }
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
    lastSeen: { $gte: new Date(Date.now() - 10 * 60 * 1000) }, // Últimos 10 minutos (más estricto)
    $or: [
      { socketId: { $ne: null } }, // Tiene socket activo
      { sessionId: { $ne: null } }  // Tiene sesión activa
    ]
  }).populate({
    path: 'userId',
    select: 'name correo role',
    populate: {
      path: 'role',
      select: 'nombre'
    }
  }).select('+statusHistory');
};

// Método estático para limpiar usuarios fantasma
userStatusSchema.statics.cleanupGhostUsers = async function() {
  try {
    console.log('🧹 Limpiando usuarios fantasma...');
    
    // Marcar como inactivos a usuarios que:
    // 1. No tienen socketId ni sessionId
    // 2. Su lastSeen es mayor a 15 minutos
    // 3. Están marcados como activos
    const result = await this.updateMany(
      {
        isActive: true,
        $or: [
          { socketId: null, sessionId: null },
          { lastSeen: { $lt: new Date(Date.now() - 15 * 60 * 1000) } }
        ]
      },
      {
        isActive: false,
        status: 'offline'
      }
    );
    
    console.log(`🧹 ${result.modifiedCount} usuarios fantasma limpiados`);
    return result;
  } catch (error) {
    console.error('❌ Error limpiando usuarios fantasma:', error);
    return null;
  }
};

// Método estático para obtener estado de un usuario
userStatusSchema.statics.getUserStatus = function(userId) {
  return this.findOne({ userId }).populate('userId', 'name correo').select('+statusHistory');
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

// Método estático para actualizar lastSeen por userId
userStatusSchema.statics.updateActivity = function(userId, timestamp) {
  return this.updateOne({ userId }, { $set: { lastSeen: timestamp || new Date() } });
};

module.exports = mongoose.model('UserStatus', userStatusSchema); 