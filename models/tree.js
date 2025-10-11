const mongoose = require('mongoose');

// Schema principal del árbol
// Usar Mixed directamente para root para evitar problemas de recursividad
const TreeSchema = new mongoose.Schema({
  root: [mongoose.Schema.Types.Mixed], // Array de nodos raíz usando Mixed directamente
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