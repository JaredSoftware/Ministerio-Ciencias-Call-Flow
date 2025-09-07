const mongoose = require('mongoose');

const statusTypeSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    default: '#28a745'
  },
  category: {
    type: String,
    enum: ['work', 'break', 'out'],
    required: true,
    default: 'work'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: 'fas fa-circle'
  }
}, {
  timestamps: true
});

// Índices para mejorar performance
statusTypeSchema.index({ category: 1, order: 1 });
statusTypeSchema.index({ isActive: 1 });
statusTypeSchema.index({ isDefault: 1 });

// Método estático para obtener estados por categoría
statusTypeSchema.statics.getByCategory = function(category) {
  return this.find({ 
    category, 
    isActive: true 
  }).sort('order');
};

// Método estático para obtener todos los estados activos
statusTypeSchema.statics.getActiveStatuses = function() {
  return this.find({ 
    isActive: true 
  }).sort('order');
};

// Método estático para obtener el estado por defecto
statusTypeSchema.statics.getDefaultStatus = function() {
  return this.findOne({ 
    isDefault: true, 
    isActive: true 
  }).sort({ order: 1 }); // Ordenar por order para obtener el primero si hay múltiples
};

// Método estático para inicializar estados por defecto (estilo Avaya)
statusTypeSchema.statics.initializeDefaultStatuses = async function() {
  const defaultStatuses = [
    // Estados de trabajo (SÍ se puede asignar trabajo)
    {
      value: 'conectado',
      label: 'Conectado',
      color: '#28a745',
      category: 'work',
      isDefault: false,
      order: 0,
      description: 'Usuario conectado al sistema',
      icon: 'fas fa-circle'
    },
    {
      value: 'available',
      label: 'Disponible',
      color: '#00d25b',
      category: 'work',
      isDefault: true,
      order: 1,
      description: 'Disponible para asignar trabajo',
      icon: 'fas fa-circle'
    },
    {
      value: 'busy',
      label: 'Ocupado',
      color: '#2196f3',
      category: 'work',
      order: 2,
      description: 'Trabajando en una tarea',
      icon: 'fas fa-clock'
    },
    {
      value: 'on_call',
      label: 'En llamada',
      color: '#1976d2',
      category: 'work',
      order: 3,
      description: 'Atendiendo una llamada',
      icon: 'fas fa-phone'
    },
    {
      value: 'focus',
      label: 'Enfoque',
      color: '#388e3c',
      category: 'work',
      order: 4,
      description: 'Trabajando con enfoque total',
      icon: 'fas fa-bullseye'
    },
    
    // Estados de descanso (NO se debe asignar trabajo)
    {
      value: 'break',
      label: 'Descanso',
      color: '#ff9800',
      category: 'break',
      order: 5,
      description: 'Tomando un descanso corto',
      icon: 'fas fa-coffee'
    },
    {
      value: 'lunch',
      label: 'Almuerzo',
      color: '#ff5722',
      category: 'break',
      order: 6,
      description: 'En horario de almuerzo',
      icon: 'fas fa-utensils'
    },
    {
      value: 'meeting',
      label: 'En reunión',
      color: '#ffa726',
      category: 'break',
      order: 7,
      description: 'Participando en una reunión',
      icon: 'fas fa-users'
    },
    {
      value: 'training',
      label: 'En capacitación',
      color: '#9c27b0',
      category: 'break',
      order: 8,
      description: 'Recibiendo capacitación',
      icon: 'fas fa-graduation-cap'
    },
    {
      value: 'do_not_disturb',
      label: 'No molestar',
      color: '#e91e63',
      category: 'break',
      order: 9,
      description: 'No disponible temporalmente',
      icon: 'fas fa-ban'
    },
    
    // Estados fuera (conectado pero no trabajando)
    {
      value: 'away',
      label: 'Ausente',
      color: '#f44336',
      category: 'out',
      order: 10,
      description: 'Temporalmente no disponible',
      icon: 'fas fa-user-clock'
    },
    {
      value: 'out_of_office',
      label: 'Fuera de oficina',
      color: '#9c27b0',
      category: 'out',
      order: 11,
      description: 'No en la oficina',
      icon: 'fas fa-building'
    },
    {
      value: 'offline',
      label: 'Desconectado',
      color: '#6c757d',
      category: 'out',
      order: 12,
      description: 'No disponible',
      icon: 'fas fa-times-circle'
    }
  ];

  try {
    // Verificar si ya existen estados
    const existingCount = await this.countDocuments();
    
    if (existingCount === 0) {
      console.log('🔄 Inicializando estados por defecto...');
      await this.insertMany(defaultStatuses);
      console.log(`✅ ${defaultStatuses.length} estados inicializados`);
    } else {
      console.log('ℹ️ Estados ya existen, saltando inicialización');
    }
  } catch (error) {
    console.error('❌ Error inicializando estados:', error);
    throw error;
  }
};

module.exports = mongoose.model('StatusType', statusTypeSchema); 