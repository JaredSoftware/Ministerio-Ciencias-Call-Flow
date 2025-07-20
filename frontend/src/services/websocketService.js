import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userInfo = null;
    this.listeners = new Map();
  }

  // Conectar al WebSocket cuando el usuario esté autenticado
  async connect(userInfo = null) {
    if (this.isConnected) {
      console.log('WebSocket ya está conectado');
      return;
    }

    try {
      console.log('🔌 Conectando WebSocket...');
      console.log('   - Con credenciales: true');
      console.log('   - Usuario info:', userInfo);
      
      // CONEXIÓN CON LOGGING DETALLADO
      this.socket = io('http://localhost:9035', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        forceNew: true,
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket conectado con ID:', this.socket.id);
        this.isConnected = true;
        
        // Si tenemos información del usuario, inicializar estado
        if (userInfo) {
          this.initializeUserStatus(userInfo);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('❌ WebSocket desconectado');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Error conectando WebSocket:', error);
      });

      // Escuchar eventos de estado de usuario
      this.socket.on('user_status_changed', (data) => {
        console.log('👤 Estado de usuario cambiado:', data);
        this.emit('userStatusChanged', data);
      });

      this.socket.on('own_status_changed', (data) => {
        console.log('👤 Mi estado cambió:', data);
        this.emit('ownStatusChanged', data);
      });

      this.socket.on('active_users_list', (users) => {
        console.log('👥 Lista de usuarios activos actualizada:', users);
        this.emit('activeUsersList', users);
      });

      this.socket.on('status_change_error', (error) => {
        console.error('❌ Error cambiando estado:', error);
        this.emit('statusChangeError', error);
      });

    } catch (error) {
      console.error('❌ Error inicializando WebSocket:', error);
    }
  }

  // Desconectar WebSocket
  disconnect() {
    if (this.socket) {
      console.log('🔌 Desconectando WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Inicializar estado del usuario
  initializeUserStatus(userInfo) {
    if (!this.isConnected || !this.socket) {
      console.log('⚠️ WebSocket no conectado, no se puede inicializar estado');
      return;
    }

    console.log('🔄 Inicializando estado para usuario:', userInfo.name);
    this.userInfo = userInfo;
    
    // El servidor automáticamente detectará la sesión y inicializará el estado
    // No necesitamos enviar datos adicionales aquí
  }

  // Cambiar estado del usuario
  changeStatus(status, customStatus = null) {
    if (!this.isConnected || !this.socket) {
      console.log('⚠️ WebSocket no conectado, no se puede cambiar estado');
      return;
    }

    console.log('🔄 Cambiando estado a:', status, customStatus);
    this.socket.emit('change_status', {
      status,
      customStatus
    });
  }

  // Actualizar actividad del usuario
  updateActivity() {
    if (!this.isConnected || !this.socket) {
      return;
    }

    this.socket.emit('update_activity');
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
      socketId: this.socket?.id
    };
  }
}

// Crear instancia singleton
const websocketService = new WebSocketService();

export default websocketService; 