const mongoose = require('mongoose');

const tipificacionSchema = new mongoose.Schema({
  idLlamada: { type: String },
  cedula: { type: String },
  tipoDocumento: { type: String },
  observacion: { type: String },
  historial: { type: Array, default: [] },
  arbol: { type: Array, default: [] },
  assignedTo: { type: String },
  assignedToName: { type: String },
  status: { type: String, enum: ['pending', 'success', 'cancelada_por_agente'], default: 'pending' },
  timestamp: { type: Date, default: Date.now },
  type: { type: String },
  nivel1: { type: String },
  nivel2: { type: String },
  nivel3: { type: String },
  nivel4: { type: String },
  nivel5: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Tipificacion', tipificacionSchema); 