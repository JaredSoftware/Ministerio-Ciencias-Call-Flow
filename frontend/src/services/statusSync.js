import axios from './axios';
import websocketService from './websocketService';

class StatusSyncService {
  constructor() {
    this.syncInterval = null;
    this.lastSyncTime = null;
    this.isSyncing = false;
    this.currentStatus = null;
    this.syncIntervalMs = 30000; // 30 segundos
    this.heartbeatIntervalMs = 10000; // 10 segundos
    this.heartbeatInterval = null;
    this.lastUserChange = null; // Timestamp del último cambio del usuario
    this.userChangeCooldown = 5000; // 5 segundos de cooldown después de cambio manual
  }

  // Inicializar sincronización continua
  async initialize() {
    console.log('🔄 Inicializando sincronización continua de estados...');
    
    try {
      // Obtener estado actual del backend
      await this.syncCurrentStatus();
      
      // Iniciar sincronización periódica
      this.startPeriodicSync();
      
      // Iniciar heartbeat
      this.startHeartbeat();
      
      console.log('✅ Sincronización continua inicializada');
    } catch (error) {
      console.error('❌ Error inicializando sincronización:', error);
    }
  }

  // Detener sincronización
  stop() {
    console.log('🛑 Deteniendo sincronización continua...');
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.isSyncing = false;
    console.log('✅ Sincronización detenida');
  }

  // Sincronizar estado actual con el backend
  async syncCurrentStatus() {
    if (this.isSyncing) {
      console.log('⚠️ Sincronización ya en progreso, saltando...');
      return;
    }

    // Verificar si el usuario acaba de cambiar el estado manualmente
    if (this.lastUserChange) {
      const timeSinceUserChange = Date.now() - this.lastUserChange.getTime();
      if (timeSinceUserChange < this.userChangeCooldown) {
        console.log(`⏳ Cambio reciente del usuario (${timeSinceUserChange}ms), saltando sincronización...`);
        return;
      }
    }

    this.isSyncing = true;
    
    try {
      console.log('🔄 Sincronizando estado actual con backend...');
      
      // Si tenemos un estado actual en el frontend, enviarlo al backend
      if (this.currentStatus && this.currentStatus.status) {
        console.log('📤 Enviando estado del frontend al backend:', this.currentStatus.status);
        
        const response = await axios.post('/user-status/sync-status', {
          status: this.currentStatus.status,
          customStatus: this.currentStatus.customStatus
        }, {
          withCredentials: true
        });
        
        if (response.data.success) {
          this.currentStatus = response.data.status;
          this.lastSyncTime = new Date();
          
          console.log('✅ Estado enviado y confirmado:', {
            status: this.currentStatus.status,
            lastSeen: this.currentStatus.lastSeen,
            syncTime: this.lastSyncTime
          });
        }
      } else {
        // Si no tenemos estado local, obtener del backend
        console.log('📥 Obteniendo estado del backend...');
        
        const response = await axios.get('/user-status/my-status', {
          withCredentials: true
        });
        
        if (response.data.success) {
          this.currentStatus = response.data.status;
          this.lastSyncTime = new Date();
          
          console.log('✅ Estado obtenido del backend:', {
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
      console.log('📤 Enviando estado al backend:', { status, customStatus });
      
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
        
        console.log('✅ Estado enviado exitosamente al backend');
        
        return response.data;
      }
    } catch (error) {
      console.error('❌ Error enviando estado al backend:', error);
      throw error;
    }
  }

  // Iniciar sincronización periódica
  startPeriodicSync() {
    console.log(`🔄 Iniciando sincronización periódica cada ${this.syncIntervalMs/1000}s...`);
    
    this.syncInterval = setInterval(async () => {
      await this.syncCurrentStatus();
    }, this.syncIntervalMs);
  }

  // Iniciar heartbeat para mantener conexión
  startHeartbeat() {
    console.log(`💓 Iniciando heartbeat cada ${this.heartbeatIntervalMs/1000}s...`);
    
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
        console.log('💓 Heartbeat enviado exitosamente');
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
        console.log('✅ Actividad actualizada');
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