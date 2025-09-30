const EventEmitter = require('events');

class StateManager extends EventEmitter {
  constructor() {
    super();
    this.states = new Map();
    this.io = null;
    this.connectedUsers = new Map();
  }

  // Inicializar con Socket.IO
  initialize(io) {
    this.io = io;
    console.log('StateManager inicializado con Socket.IO');
  }

  // Establecer estado para un usuario específico
  setUserState(userId, state) {
    this.states.set(userId, {
      ...state,
      lastUpdated: new Date(),
      userId
    });
    
    // Emitir cambio de estado
    this.emit('stateChanged', { userId, state });
    
    // Notificar a través de Socket.IO si está disponible
    if (this.io) {
      this.io.to(`user_${userId}`).emit('state_updated', {
        userId,
        state,
        timestamp: new Date()
      });
    }
  }

  // Obtener estado de un usuario
  getUserState(userId) {
    return this.states.get(userId) || null;
  }

  // Establecer estado global de la aplicación
  setGlobalState(state) {
    this.states.set('global', {
      ...state,
      lastUpdated: new Date()
    });
    
    this.emit('globalStateChanged', { state });
    
    // Emitir a todos los usuarios conectados
    if (this.io) {
      this.io.emit('global_state_updated', {
        state,
        timestamp: new Date()
      });
    }
  }

  // Obtener estado global
  getGlobalState() {
    return this.states.get('global') || {};
  }

  // Registrar usuario conectado
  registerUser(userId, userData) {
    this.connectedUsers.set(userId, {
      ...userData,
      connectedAt: new Date(),
      lastActivity: new Date()
    });
    
    console.log(`Usuario ${userData.name} registrado en StateManager`);
  }

  // Desregistrar usuario
  unregisterUser(userId) {
    this.connectedUsers.delete(userId);
    this.states.delete(userId);
    console.log(`Usuario ${userId} desregistrado de StateManager`);
  }

  // Obtener usuarios conectados
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  // Actualizar actividad del usuario
  updateUserActivity(userId) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      user.lastActivity = new Date();
      this.connectedUsers.set(userId, user);
    }
  }

  // Enviar notificación a usuarios específicos
  sendNotification(targetUsers, notification) {
    if (this.io) {
      targetUsers.forEach(userId => {
        this.io.to(`user_${userId}`).emit('notification', {
          ...notification,
          timestamp: new Date()
        });
      });
    }
  }

  // Enviar notificación global
  sendGlobalNotification(notification) {
    if (this.io) {
      this.io.emit('global_notification', {
        ...notification,
        timestamp: new Date()
      });
    }
  }

  // Manejar flujo de trabajo
  handleWorkflow(workflowData) {
    const { userId, workflowType, step, data } = workflowData;
    
    // Actualizar estado del flujo
    const currentState = this.getUserState(userId) || {};
    const workflowState = {
      ...currentState,
      workflow: {
        type: workflowType,
        step,
        data,
        lastUpdated: new Date()
      }
    };
    
    this.setUserState(userId, workflowState);
    
    // Notificar cambio de flujo
    if (this.io) {
      this.io.to(`user_${userId}`).emit('workflow_updated', {
        userId,
        workflow: workflowState.workflow
      });
    }
  }

  // Obtener estadísticas de estado
  getStateStats() {
    return {
      totalUsers: this.connectedUsers.size,
      totalStates: this.states.size,
      globalState: this.getGlobalState(),
      connectedUsers: this.getConnectedUsers()
    };
  }

  // Limpiar estados antiguos
  cleanupOldStates(maxAge = 24 * 60 * 60 * 1000) { // 24 horas por defecto
    const now = new Date();
    const toDelete = [];
    
    for (const [userId, state] of this.states.entries()) {
      if (userId !== 'global' && (now - state.lastUpdated) > maxAge) {
        toDelete.push(userId);
      }
    }
    
    toDelete.forEach(userId => {
      this.states.delete(userId);
    });
    
    console.log(`Limpiados ${toDelete.length} estados antiguos`);
  }
}

// Crear instancia singleton
const stateManager = new StateManager();

module.exports = stateManager; 