const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date, required: true },
  nombreArchivo: { type: String, required: true },
  fechaCreacion: { type: Date, default: Date.now },
  status: { type: String, enum: ['pendiente', 'generado', 'error'], default: 'pendiente' },
  solicitadoPor: {
    correo: { type: String },
    userId: { type: String }
  },
  archivoUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema); 