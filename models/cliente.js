const mongoose = require('mongoose');
const { getFechaColombia } = require('../utils/fechaColombia');

const clienteSchema = new mongoose.Schema({
  // Información básica de identificación
  cedula: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tipoDocumento: {
    type: String,
    required: false,
    enum: ['', 'Cédula de ciudadanía', 'Cédula de extranjería', 'Tarjeta de identidad', 'Pasaporte', 'Permiso temporal de permanencia'],
    default: ''
  },
  
  // Información personal
  nombres: {
    type: String,
    default: ''
  },
  apellidos: {
    type: String,
    default: ''
  },
  fechaNacimiento: {
    type: Date
  },
  sexo: {
    type: String,
    enum: ['', 'Hombre', 'Mujer', 'Intersexual'],
    default: ''
  },
  
  // Ubicación
  pais: {
    type: String,
    default: 'Colombia'
  },
  departamento: String,
  ciudad: String,
  direccion: String,
  
  // Contacto
  telefono: String,
  correo: {
    type: String,
    lowercase: true,
    trim: true
  },
  
  // Información demográfica
  nivelEscolaridad: {
    type: String,
    enum: [
      '',
      'Prescolar',
      'Básica primaria (1 a 5)',
      'Básica Secundaria (6 a 9)',
      'Media (10-11)',
      'Técnico',
      'Tecnólogo',
      'Universitario (pregrado)',
      'Postgrado (Especialización)',
      'Postgrado (Maestría)',
      'Postgrado (Doctorado)',
      'Postgrado (post Doctorado)'
    ],
    default: ''
  },
  grupoEtnico: {
    type: String,
    enum: [
      '',
      'Indígena',
      'Raizal',
      'Palenquero/a',
      'Gitano/a ROM',
      'Negro/a, Mulato/a, Afrodescendiente',
      'Ningún grupo étnico'
    ],
    default: ''
  },
  discapacidad: {
    type: String,
    enum: [
      '',
      'Ninguna',
      'Física',
      'Visual',
      'Auditiva',
      'Múltiple',
      'Intelectual - Cognitiva',
      'Psicosocial',
      'Sordoceguera'
    ],
    default: ''
  },
  
  // Historial de interacciones
  interacciones: [{
    idLlamada: String,
    fecha: {
      type: Date,
      default: getFechaColombia // 🕐 UTC-5 (Colombia)
    },
    tipo: {
      type: String,
      enum: ['tipificacion', 'consulta', 'reclamo', 'sugerencia', 'otro'],
      default: 'tipificacion'
    },
    observacion: String,
    agente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    estado: {
      type: String,
      enum: ['completada', 'pendiente', 'cancelada'],
      default: 'completada'
    },
    // Niveles de tipificación
    nivel1: String,
    nivel2: String,
    nivel3: String,
    nivel4: String,
    nivel5: String,
    arbol: [{
      value: String,
      label: String,
      children: [mongoose.Schema.Types.Mixed]
    }]
  }],
  
  // Metadatos
  fechaCreacion: {
    type: Date,
    default: getFechaColombia // 🕐 UTC-5 (Colombia)
  },
  fechaUltimaInteraccion: {
    type: Date,
    default: getFechaColombia // 🕐 UTC-5 (Colombia)
  },
  totalInteracciones: {
    type: Number,
    default: 0
  },
  
  // Estado del cliente
  activo: {
    type: Boolean,
    default: true
  },
  
  // Notas adicionales del agente
  notas: [{
    fecha: {
      type: Date,
      default: getFechaColombia // 🕐 UTC-5 (Colombia)
    },
    agente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contenido: String
  }]
}, {
  timestamps: true
});

// 🕐 PRE-SAVE HOOK: Asegurar que createdAt y updatedAt estén en UTC-5 (Colombia)
clienteSchema.pre('save', function(next) {
  // Si es un documento nuevo, establecer createdAt en UTC-5
  if (this.isNew && !this.createdAt) {
    this.createdAt = getFechaColombia();
  }
  // Siempre actualizar updatedAt en UTC-5
  this.updatedAt = getFechaColombia();
  next();
});

// Índices para búsquedas eficientes
clienteSchema.index({ cedula: 1 });
clienteSchema.index({ correo: 1 });
clienteSchema.index({ telefono: 1 });
clienteSchema.index({ fechaUltimaInteraccion: -1 });
clienteSchema.index({ 'interacciones.fecha': -1 });

// Método para agregar una nueva interacción
clienteSchema.methods.agregarInteraccion = function(interaccionData) {
  // Si no tiene fecha, usar fecha actual en UTC-5
  if (!interaccionData.fecha) {
    interaccionData.fecha = getFechaColombia();
  }
  this.interacciones.push(interaccionData);
  this.fechaUltimaInteraccion = getFechaColombia(); // 🕐 UTC-5 (Colombia)
  this.totalInteracciones = this.interacciones.length;
  return this.save();
};

// Método estático para buscar cliente por cédula
clienteSchema.statics.buscarPorCedula = function(cedula) {
  return this.findOne({ cedula: cedula, activo: true });
};

// Método estático para crear o actualizar cliente
clienteSchema.statics.crearOActualizar = async function(datosCliente) {
  const clienteExistente = await this.buscarPorCedula(datosCliente.cedula);
  
  if (clienteExistente) {
    // Actualizar datos del cliente existente
    Object.keys(datosCliente).forEach(key => {
      if (key !== 'cedula' && key !== 'interacciones' && datosCliente[key]) {
        clienteExistente[key] = datosCliente[key];
      }
    });
    return await clienteExistente.save();
  } else {
    // Crear nuevo cliente
    return await this.create(datosCliente);
  }
};

// Método para obtener historial de interacciones
clienteSchema.methods.obtenerHistorial = function(limite = 10) {
  return this.interacciones
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, limite);
};

module.exports = mongoose.model('Cliente', clienteSchema);
