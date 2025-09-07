const assignPendingTipificaciones = require('../routes/index.routes').assignPendingTipificaciones;

class AutoAssignService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.intervalMs = 10000; // 10 segundos
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ AutoAssignService ya está ejecutándose');
      return;
    }

    console.log('🚀 Iniciando AutoAssignService...');
    this.isRunning = true;
    
    // Ejecutar inmediatamente
    this.executeAssignment();
    
    // Programar ejecución periódica
    this.intervalId = setInterval(() => {
      this.executeAssignment();
    }, this.intervalMs);
    
    console.log(`✅ AutoAssignService iniciado - ejecutando cada ${this.intervalMs/1000} segundos`);
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ AutoAssignService no está ejecutándose');
      return;
    }

    console.log('🛑 Deteniendo AutoAssignService...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('✅ AutoAssignService detenido');
  }

  async executeAssignment() {
    if (!this.isRunning) return;

    try {
      console.log('🔄 Ejecutando asignación automática...');
      const result = await assignPendingTipificaciones();
      
      if (result.assigned > 0) {
        console.log(`✅ Asignación automática: ${result.assigned} tipificaciones asignadas`);
      }
    } catch (error) {
      console.error('❌ Error en asignación automática:', error);
    }
  }

  // Método para ejecutar asignación inmediata (cuando se conecta un agente)
  async executeImmediate() {
    try {
      console.log('⚡ Ejecutando asignación inmediata...');
      const result = await assignPendingTipificaciones();
      
      if (result.assigned > 0) {
        console.log(`✅ Asignación inmediata: ${result.assigned} tipificaciones asignadas`);
      }
      
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
