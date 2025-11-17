import axios from './axios';
import websocketService from './websocketService';

class StatusSyncService {
  constructor() {
    this.syncInterval = null;
    this.lastSyncTime = null;
    this.isSyncing = false;
    this.currentStatus = null;
    this.syncIntervalMs = 30000; // 30 segundos
    this.heartbeatIntervalMs = 30000; // 30 segundos (MÁS FRECUENTE PARA SEGURIDAD)
    this.heartbeatInterval = null;
    this.lastUserChange = null; // Timestamp del último cambio del usuario
    this.userChangeCooldown = 5000; // 5 segundos de cooldown después de cambio manual
  }

  // Inicializar sincronización continua
  async initialize() {
    
    try {
      // Obtener estado actual del backend
      await this.syncCurrentStatus();
      
      // Iniciar sincronización periódica
      this.startPeriodicSync();
      
      // Iniciar heartbeat
      this.startHeartbeat();
      
    } catch (error) {
      console.error('❌ Error inicializando sincronización:', error);
    }
  }

  // Detener sincronización
  stop() {
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.isSyncing = false;
  }

  // Sincronizar estado actual con el backend
  async syncCurrentStatus() {
    if (this.isSyncing) {
      return;
    }

    // Verificar si el usuario acaba de cambiar el estado manualmente
    if (this.lastUserChange) {
      const timeSinceUserChange = Date.now() - this.lastUserChange.getTime();
      if (timeSinceUserChange < this.userChangeCooldown) {
        return;
      }
    }

    this.isSyncing = true;
    
    try {
      
      // Si tenemos un estado actual en el frontend, enviarlo al backend
      if (this.currentStatus && this.currentStatus.status) {
        
        const response = await axios.post('/user-status/sync-status', {
          status: this.currentStatus.status,
          customStatus: this.currentStatus.customStatus
        }, {
          withCredentials: true
        });
        
        if (response.data.success) {
          this.currentStatus = response.data.status;
          this.lastSyncTime = new Date();
          
            status: this.currentStatus.status,
            lastSeen: this.currentStatus.lastSeen,
            syncTime: this.lastSyncTime
          });
        }
      } else {
        // Si no tenemos estado local, obtener del backend
        
        const response = await axios.get('/user-status/my-status', {
          withCredentials: true
        });
        
        if (response.data.success) {
          this.currentStatus = response.data.status;
          this.lastSyncTime = new Date();
          
            status: this.currentStatus.status,
            lastSeen: this.currentStatus.lastSeen,
            syncTime: this.lastSyncTime
          });
          
          // Emitir evento de estado actualizado
          this.emitStatusUpdate(this.currentStatus);
        }
      }
    } catch (error) {
      console.error('❌ Error sincronizando estado:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Enviar estado al backend
  async sendStatusToBackend(status, customStatus = null) {
    try {
      
      // Marcar que el usuario cambió el estado manualmente
      this.lastUserChange = new Date();
      
      // Actualizar estado local inmediatamente
      this.currentStatus = {
        status: status,
        customStatus: customStatus,
        lastSeen: new Date().toISOString()
      };
      this.lastSyncTime = new Date();
      
      // Emitir evento de estado actualizado inmediatamente
      this.emitStatusUpdate(this.currentStatus);
      
      const response = await axios.post('/user-status/change-status', {
        status,
        customStatus
      }, {
        withCredentials: true
      });
      
      if (response.data.success) {
        // Actualizar con la respuesta del servidor
        this.currentStatus = response.data.status;
        
        
        return response.data;
      }
    } catch (error) {
      console.error('❌ Error enviando estado al backend:', error);
      throw error;
    }
  }

  // Iniciar sincronización periódica
  startPeriodicSync() {
    
    this.syncInterval = setInterval(async () => {
      await this.syncCurrentStatus();
    }, this.syncIntervalMs);
  }

  // Iniciar heartbeat para mantener conexión
  startHeartbeat() {
    
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  // Enviar heartbeat al backend
  async sendHeartbeat() {
    try {
      const response = await axios.post('/user-status/heartbeat', {
        timestamp: new Date().toISOString(),
        lastSync: this.lastSyncTime?.toISOString()
      }, {
        withCredentials: true
      });
      
      if (response.data.success) {
      }
    } catch (error) {
      console.error('❌ Error enviando heartbeat:', error);
    }
  }

  // Actualizar actividad del usuario
  async updateActivity() {
    try {
      const response = await axios.post('/user-status/update-activity', {
        timestamp: new Date().toISOString()
      }, {
        withCredentials: true
      });
      
      if (response.data.success) {
      }
    } catch (error) {
      console.error('❌ Error actualizando actividad:', error);
    }
  }

  // Emitir evento de actualización de estado
  emitStatusUpdate(status) {
    // Emitir evento personalizado para que otros componentes lo detecten
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('status-updated', {
        detail: { status }
      }));
    }
    
    // También emitir a través de WebSocket si está disponible
    if (websocketService.isConnected) {
      websocketService.emit('status_sync', { status });
    }
  }

  // Obtener estado actual
  getCurrentStatus() {
    return this.currentStatus;
  }

  // Obtener tiempo del último cambio del usuario
  getLastUserChange() {
    return this.lastUserChange;
  }

  // Verificar si el usuario cambió recientemente el estado
  isRecentUserChange() {
    if (!this.lastUserChange) return false;
    const timeSinceUserChange = Date.now() - this.lastUserChange.getTime();
    return timeSinceUserChange < this.userChangeCooldown;
  }

  // Obtener tiempo de última sincronización
  getLastSyncTime() {
    return this.lastSyncTime;
  }

  // Verificar si está sincronizando
  isCurrentlySyncing() {
    return this.isSyncing;
  }
}

// Crear instancia singleton
const statusSyncService = new StatusSyncService();

export default statusSyncService; 