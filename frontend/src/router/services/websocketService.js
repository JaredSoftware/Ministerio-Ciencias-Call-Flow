import { io } from 'socket.io-client';
import environmentConfig from '@/config/environment';
import store from '@/store';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userInfo = null;
    this.listeners = new Map();
    this.heartbeatInterval = null;
    this.heartbeatIntervalMs = 30000; // 30 segundos
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimeout = null;
  }

  // Conectar al WebSocket cuando el usuario esté autenticado
  async connect(userInfo = null) {
    if (this.isConnected) {
      return;
    }

    try {
      const websocketUrl = environmentConfig.getWebSocketUrl();
      
      // CONEXIÓN CON LOGGING DETALLADO Y RECONEXIÓN AUTOMÁTICA
      this.socket = io(websocketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        forceNew: false, // Permitir reconexión
        reconnection: true, // Habilitar reconexión automática
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0; // Resetear intentos de reconexión
        
        // Iniciar heartbeat automático
        this.startHeartbeat();
        
        // Si tenemos información del usuario, inicializar estado
        if (userInfo) {
          this.initializeUserStatus(userInfo);
        }
        
        console.log('✅ WebSocket conectado exitosamente');
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        this.stopHeartbeat();
        
        console.warn(`⚠️ WebSocket desconectado. Razón: ${reason}`);
        
        // No intentar reconectar si fue desconexión manual o por logout
        if (reason === 'io client disconnect' || reason === 'io server disconnect') {
          console.log('ℹ️ Desconexión manual, no reconectar');
          return;
        }
        
        // Intentar reconectar manualmente si la reconexión automática falla
        this.attemptReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Error conectando WebSocket:', error);
        this.stopHeartbeat();
      });

      // Escuchar eventos de estado de usuario
      this.socket.on('user_status_changed', (data) => {
        this.emit('userStatusChanged', data);
      });

      this.socket.on('own_status_changed', (data) => {
        this.emit('ownStatusChanged', data);
      });

      this.socket.on('active_users_list', (users) => {
        this.emit('activeUsersList', users);
      });

      // 🚨 NUEVO EVENTO ESPECÍFICO PARA ACTUALIZACIONES EN TIEMPO REAL
      this.socket.on('active_users_updated', (data) => {
        this.emit('activeUsersUpdated', data);
      });

      // 🚨 EVENTO DE DESCONEXIÓN DE USUARIO
      this.socket.on('user_disconnected', (data) => {
        this.emit('userDisconnected', data);
      });

      this.socket.on('status_change_error', (error) => {
        console.error('❌ Error cambiando estado:', error);
        this.emit('statusChangeError', error);
      });

      // Escuchar confirmación de heartbeat
      this.socket.on('heartbeat_confirmed', (data) => {
        // Heartbeat confirmado, conexión está activa
        this.emit('heartbeatConfirmed', data);
      });

    } catch (error) {
      console.error('❌ Error inicializando WebSocket:', error);
    }
  }

  // Iniciar heartbeat automático
  startHeartbeat() {
    // Limpiar intervalo anterior si existe
    this.stopHeartbeat();
    
    // Enviar heartbeat inmediatamente
    this.sendHeartbeat();
    
    // Configurar intervalo de 30 segundos
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket && this.socket.connected) {
        this.sendHeartbeat();
      }
    }, this.heartbeatIntervalMs);
  }

  // Detener heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Enviar heartbeat al servidor
  sendHeartbeat() {
    if (!this.isReady()) {
      return;
    }
    
    try {
      this.socket.emit('heartbeat', {
        timestamp: new Date().toISOString()
      });
      
      // También actualizar actividad
      this.socket.emit('update_activity');
    } catch (error) {
      console.error('❌ Error enviando heartbeat:', error);
    }
  }

  // Desconectar WebSocket
  disconnect() {
    this.stopHeartbeat();
    
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch (error) {
        console.error('❌ Error desconectando WebSocket:', error);
      }
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Inicializar estado del usuario
  initializeUserStatus(userInfo) {
    if (!this.isReady()) {
      return;
    }

    if (!userInfo || !userInfo.name) {
      return;
    }

    this.userInfo = userInfo;
    
    // El servidor automáticamente detectará la sesión y inicializará el estado
    // No necesitamos enviar datos adicionales aquí
  }

  // Cambiar estado del usuario
  changeStatus(status, customStatus = null) {
    if (!this.isReady()) {
      return;
    }

    if (!status) {
      return;
    }

    try {
      this.socket.emit('change_status', {
        status,
        customStatus
      });
    } catch (error) {
      console.error('❌ Error enviando cambio de estado:', error);
    }
  }

  // Actualizar actividad del usuario
  updateActivity() {
    if (!this.isReady()) {
      return;
    }

    try {
      this.socket.emit('update_activity');
    } catch (error) {
      console.error('❌ Error actualizando actividad:', error);
    }
  }

  // Suscribirse a eventos
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Emitir eventos internos
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  // Obtener estado de conexión
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }

  // Verificar si el WebSocket está listo para usar
  isReady() {
    return this.isConnected && this.socket && this.socket.connected;
  }
  
  // Intentar reconectar WebSocket
  attemptReconnect() {
    // Limpiar timeout anterior si existe
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Si ya se alcanzó el máximo de intentos, no seguir intentando
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      return;
    }
    
    // Incrementar contador de intentos
    this.reconnectAttempts++;
    
    // Intentar reconectar después de un delay
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, máximo 30 segundos
    console.log(`🔄 Intentando reconectar WebSocket (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts}) en ${delay}ms...`);
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        // Intentar reconectar con la información del usuario guardada
        const storeUser = store?.state?.user;
        if (this.userInfo || storeUser) {
          const user = this.userInfo || storeUser;
          await this.connect(user);
        } else {
          // Intentar reconectar sin información de usuario
          await this.connect();
        }
      } catch (error) {
        console.error('❌ Error en reconexión:', error);
        // Intentar de nuevo si no se alcanzó el máximo
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      }
    }, delay);
  }
}

// Crear instancia singleton
const websocketService = new WebSocketService();

export default websocketService; 