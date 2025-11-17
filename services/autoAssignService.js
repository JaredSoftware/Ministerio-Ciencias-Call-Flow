const assignPendingTipificaciones = require('../routes/index.routes').assignPendingTipificaciones;

class AutoAssignService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.intervalMs = 10000; // 10 segundos
  }

  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Ejecutar inmediatamente
    this.executeAssignment();
    
    // Programar ejecución periódica
    this.intervalId = setInterval(() => {
      this.executeAssignment();
    }, this.intervalMs);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async executeAssignment() {
    if (!this.isRunning) return;

    try {
      const result = await assignPendingTipificaciones();
    } catch (error) {
      console.error('❌ Error en asignación automática:', error);
    }
  }

  // Método para ejecutar asignación inmediata (cuando se conecta un agente)
  async executeImmediate() {
    try {
      const result = await assignPendingTipificaciones();
      return result;
    } catch (error) {
      console.error('❌ Error en asignación inmediata:', error);
      return { assigned: 0, error: error.message };
    }
  }

  // Método para verificar si hay tipificaciones pendientes sin asignar
  async hasUnassignedTipificaciones() {
    try {
      const Tipificacion = require('../models/tipificacion');
      const count = await Tipificacion.countDocuments({ 
        status: 'pending',
        $or: [
          { assignedTo: { $exists: false } },
          { assignedTo: null },
          { assignedTo: '' }
        ]
      });
      
      return count > 0;
    } catch (error) {
      console.error('❌ Error verificando tipificaciones sin asignar:', error);
      return false;
    }
  }
}

// Crear instancia singleton
const autoAssignService = new AutoAssignService();

module.exports = autoAssignService;
