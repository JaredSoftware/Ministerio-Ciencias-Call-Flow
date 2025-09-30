// Service para manejar validaciones de estado de agentes
import axios from 'axios';

class StatusService {
  constructor() {
    this.statusTypes = new Map();
    this.userStatuses = new Map();
    this.lastUpdate = null;
  }

  // Cargar tipos de estado desde el backend (cache por 5 minutos)
  async loadStatusTypes() {
    const now = Date.now();
    if (this.lastUpdate && (now - this.lastUpdate) < 300000) {
      // Cache válido por 5 minutos
      return;
    }

    try {
      const response = await axios.get('/api/status-types');
      if (response.data && response.data.length > 0) {
        this.statusTypes.clear();
        response.data.forEach(statusType => {
          this.statusTypes.set(statusType.value, statusType);
        });
        this.lastUpdate = now;
      }
    } catch (error) {
      console.error('Error cargando tipos de estado:', error);
    }
  }

  // Verificar si un estado es válido para trabajar
  isWorkStatus(statusValue) {
    const statusType = this.statusTypes.get(statusValue);
    return statusType && statusType.category === 'work' && statusType.isActive;
  }

  // Verificar si un agente está disponible para recibir tipificaciones
  isAgentAvailable(userStatus) {
    if (!userStatus || !userStatus.isActive) {
      return false;
    }

    // Verificar que el estado sea de categoría 'work'
    return this.isWorkStatus(userStatus.status);
  }

  // Obtener información del estado
  getStatusInfo(statusValue) {
    return this.statusTypes.get(statusValue) || null;
  }

  // Obtener todos los estados de trabajo disponibles
  getWorkStatuses() {
    const workStatuses = [];
    for (const [, statusType] of this.statusTypes) {
      if (statusType.category === 'work' && statusType.isActive) {
        workStatuses.push(statusType);
      }
    }
    return workStatuses.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // Cambiar estado de un agente
  async changeAgentStatus(userId, userName, newStatus) {
    try {
      const response = await axios.post('/api/user-status/change-agent-status', {
        userId,
        userName,
        newStatus
      });
      return response.data;
    } catch (error) {
      console.error('Error cambiando estado de agente:', error);
      throw error;
    }
  }

  // Obtener lista de agentes conectados con validación de estados
  async getAvailableAgents() {
    try {
      await this.loadStatusTypes();
      
      const response = await axios.get('/api/agentes/conectados');
      if (response.data && response.data.agents) {
        return response.data.agents.filter(agent => 
          this.isAgentAvailable(agent.userStatus)
        );
      }
      return [];
    } catch (error) {
      console.error('Error obteniendo agentes disponibles:', error);
      return [];
    }
  }

  // Validar si el usuario actual puede recibir tipificaciones
  async validateCurrentUserForWork(userId) {
    try {
      const response = await axios.get(`/api/user-status/${userId}`);
      if (response.data && response.data.userStatus) {
        return this.isAgentAvailable(response.data.userStatus);
      }
      return false;
    } catch (error) {
      console.error('Error validando usuario actual:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
const statusService = new StatusService();
export default statusService;
