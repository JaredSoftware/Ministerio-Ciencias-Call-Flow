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
    enum: ['online', 'busy', 'away', 'break', 'meeting', 'lunch', 'vacation', 'sick', 'offline'],
    default: 'online'
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
    default: '#28a745' // Verde por defecto (online)
  },
  label: {
    type: String,
    default: 'En Línea'
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
userStatusSchema.methods.changeStatus = function(newStatus, customStatus = null) {
  this.status = newStatus;
  this.customStatus = customStatus;
  
  // Definir colores y labels según el estado
  const statusConfig = {
    online: { color: '#28a745', label: 'En Línea' },
    busy: { color: '#dc3545', label: 'Ocupado' },
    away: { color: '#ffc107', label: 'Ausente' },
    break: { color: '#fd7e14', label: 'En Descanso' },
    meeting: { color: '#6f42c1', label: 'En Reunión' },
    lunch: { color: '#e83e8c', label: 'Almuerzo' },
    vacation: { color: '#17a2b8', label: 'Vacaciones' },
    sick: { color: '#6c757d', label: 'Enfermo' },
    offline: { color: '#6c757d', label: 'Desconectado' }
  };
  
  const config = statusConfig[newStatus] || statusConfig.online;
  this.color = config.color;
  this.label = config.label;
  
  return this.save();
};

// Método estático para obtener usuarios activos
userStatusSchema.statics.getActiveUsers = function() {
  return this.find({ 
    isActive: true,
    lastSeen: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Últimos 5 minutos
  }).populate('userId', 'name correo');
};

// Método estático para obtener estado de un usuario
userStatusSchema.statics.getUserStatus = function(userId) {
  return this.findOne({ userId }).populate('userId', 'name correo');
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
  ).populate('userId', 'name correo');
};

module.exports = mongoose.model('UserStatus', userStatusSchema); 