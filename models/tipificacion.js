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
  
  // CAMPOS DEL CLIENTE - INFORMACIÓN PERSONAL
  nombres: { type: String },
  apellidos: { type: String },
  fechaNacimiento: { type: Date },
  
  // UBICACIÓN
  pais: { type: String },
  departamento: { type: String },
  ciudad: { type: String },
  direccion: { type: String },
  
  // CONTACTO
  telefono: { type: String },
  correo: { type: String },
  
  // DEMOGRÁFICOS
  sexo: { type: String, enum: ['', 'Hombre', 'Mujer', 'Intersexual'], default: '' },
  nivelEscolaridad: { type: String, default: '' },
  grupoEtnico: { type: String, default: '' },
  discapacidad: { type: String, default: '' },
  
  // NUEVOS CAMPOS PARA GESTIÓN DE COLAS
  priority: { type: Number, default: 1, min: 1, max: 5 }, // 1=Baja, 5=Crítica
  queuePosition: { type: Number }, // Posición en la cola del agente
  estimatedTime: { type: Number }, // Tiempo estimado en minutos
  timeInQueue: { type: Number }, // Tiempo que lleva en cola (calculado)
  callbackRequested: { type: Boolean, default: false }, // Cliente solicita callback
  skillRequired: { type: String }, // Skill específico requerido
  customerSegment: { type: String, enum: ['premium', 'standard', 'basic'], default: 'standard' },
}, { timestamps: true });

module.exports = mongoose.model('Tipificacion', tipificacionSchema); 