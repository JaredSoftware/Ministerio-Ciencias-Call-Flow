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
    required: true,
    default: 'available'
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
  statusType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StatusType'
  }
}, {
  timestamps: true
});

// Método para actualizar lastSeen
userStatusSchema.methods.updateActivity = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Método para cambiar estado
userStatusSchema.methods.changeStatus = async function(newStatus, customStatus = null) {
  this.status = newStatus;
  this.customStatus = customStatus;
  
  // Obtener configuración del estado desde la base de datos
  const StatusType = mongoose.model('StatusType');
  const statusType = await StatusType.findOne({ value: newStatus, isActive: true });
  
  if (statusType) {
    this.color = statusType.color;
    this.label = statusType.label;
    this.statusType = statusType._id;
  } else {
    // Fallback a valores por defecto si no se encuentra el estado
    this.color = '#28a745';
    this.label = 'Conectado';
  }
  
  return this.save();
};

// Método estático para obtener usuarios activos
userStatusSchema.statics.getActiveUsers = function() {
  return this.find({ 
    isActive: true,
    lastSeen: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Últimos 5 minutos
  }).populate('userId', 'name correo').populate('statusType');
};

// Método estático para obtener estado de un usuario
userStatusSchema.statics.getUserStatus = function(userId) {
  return this.findOne({ userId }).populate('userId', 'name correo').populate('statusType');
};

// Método estático para crear o actualizar estado
userStatusSchema.statics.upsertStatus = function(userId, statusData) {
  return this.findOneAndUpdate(
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
  ).populate('userId', 'name correo').populate('statusType');
};

module.exports = mongoose.model('UserStatus', userStatusSchema); 