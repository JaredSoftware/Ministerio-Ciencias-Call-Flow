const mongoose = require('mongoose');

// Schema para los nodos del árbol (usando Mixed para permitir recursividad)
const TreeNodeSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  children: [mongoose.Schema.Types.Mixed] // Usar Mixed para estructura recursiva
}, { _id: false, strict: false });

// Schema principal del árbol
const TreeSchema = new mongoose.Schema({
  root: [TreeNodeSchema], // Array de nodos raíz
  name: {
    type: String,
    default: 'tipificaciones'
  },
  description: {
    type: String,
    default: 'Árbol de tipificaciones para call center'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Método estático para obtener el árbol activo
TreeSchema.statics.getActiveTree = function() {
  return this.findOne({ isActive: true });
};

// Método estático para obtener el árbol principal de tipificaciones
TreeSchema.statics.getTipificacionesTree = function() {
  // Intentar primero por name, luego por cualquier árbol activo, o el primero disponible
  return this.findOne({
    $or: [
      { name: 'tipificaciones', isActive: true },
      { isActive: true },
      { root: { $exists: true, $ne: [] } }
    ]
  });
};

module.exports = mongoose.model('Tree', TreeSchema); 