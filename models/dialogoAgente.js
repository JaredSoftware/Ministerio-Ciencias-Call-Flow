const mongoose = require('mongoose');
const { getFechaColombia } = require('../utils/fechaColombia');

const dialogoAgenteSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  mensaje: {
    type: String,
    required: true,
    trim: true
  },
  // Mensaje formateado con HTML/Markdown para estructura compleja
  mensajeFormateado: {
    type: String,
    default: null
  },
  tipo: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'guion'],
    default: 'info'
  },
  // Categoría para organizar diálogos (ej: 'saludo', 'caracterizacion', 'despedida')
  categoria: {
    type: String,
    default: 'general'
  },
  activo: {
    type: Boolean,
    default: true
  },
  prioridad: {
    type: Number,
    default: 1,
    min: 1,
    max: 5 // 1 = más importante, 5 = menos importante
  },
  fechaInicio: {
    type: Date,
    default: getFechaColombia
  },
  fechaFin: {
    type: Date,
    default: null // null = sin fecha de expiración
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }
}, {
  timestamps: true
});

// 🕐 PRE-SAVE HOOK: Asegurar que createdAt y updatedAt estén en UTC-5 (Colombia)
dialogoAgenteSchema.pre('save', function(next) {
  if (this.isNew && !this.createdAt) {
    this.createdAt = getFechaColombia();
  }
  this.updatedAt = getFechaColombia();
  next();
});

// Índices para búsquedas rápidas
dialogoAgenteSchema.index({ activo: 1, prioridad: 1 });
dialogoAgenteSchema.index({ fechaFin: 1 });

module.exports = mongoose.model('DialogoAgente', dialogoAgenteSchema);

