// MQTT Service Centralizado para Frontend
import mqtt from 'mqtt'
import { MQTT_UTILS, getMQTTConfig } from './mqttConfig'
import environmentConfig from '@/config/environment'

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.userId = null;
    this.userName = null;
    
    // ✅ Control de primera desconexión para logs
    this.firstDisconnectionTime = null;
    
    // Configuración centralizada desde archivo de configuración
    // Usar configuración dinámica basada en el entorno actual
    this.config = getMQTTConfig(environmentConfig.isDevelopment ? 'development' : 'production');
    
    // Configuración para conexión más robusta con reintentos automáticos
    this.config.broker.keepalive = 120; // 120 segundos en lugar de 60
    this.config.broker.connectTimeout = 10000; // 10 segundos en lugar de 4
    this.config.broker.reconnectPeriod = 5000; // ✅ REINTENTOS AUTOMÁTICOS cada 5 segundos (sin logout)
    
    // Topics centralizados desde configuración
    this.topics = {
      // Estados de usuario
      statusChanged: this.config.topics.status.statusChanged,
      activeUsers: this.config.topics.status.activeUsers,
      userConnected: this.config.topics.status.userConnected,
      userDisconnected: this.config.topics.status.userDisconnected,
      
      // Notificaciones y eventos
      notifications: this.config.topics.notifications.general,
      systemEvents: this.config.topics.system.events,
      
      // Comunicación específica por usuario
      userSpecific: this.config.topics.user.messages,
      userStatus: this.config.topics.user.status
    };
    
    // Listeners organizados por categoría
    this.listeners = {
      status: {},
      notifications: {},
      system: {},
      user: {}
    };
    
    // Estado de suscripciones
    this.subscriptions = new Set();
    
    // Callbacks de eventos del sistema
    this.systemCallbacks = {
      onConnect: null,
      onDisconnect: null,
      onError: null,
      onReconnect: null,
      onForceLogout: null // Nuevo callback para forzar logout
    };
  }

  // Configurar callbacks del sistema
  onSystemEvent(event, callback) {
    if (Object.prototype.hasOwnProperty.call(this.systemCallbacks, event)) {
      this.systemCallbacks[event] = callback;
    }
  }

  // Conectar al broker MQTT (método principal)
  async connect(brokerUrl = null, userId = null, userName = null) {
    // Si ya está conectado, devolver la promesa existente
    if (this.isConnected) {
      return true;
    }
    
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.userId = userId;
    this.userName = userName;
    
    // Usar URL personalizada si se proporciona
    const finalBrokerUrl = brokerUrl || this.config.broker.url;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        
        const clientId = MQTT_UTILS.generateClientId('frontend', userId);
        
        this.client = mqtt.connect(finalBrokerUrl, {
          clientId: clientId,
          username: userName || userId || undefined,
          clean: this.config.broker.clean,
          connectTimeout: this.config.broker.connectTimeout,
          reconnectPeriod: 0, // ❌ SIN RECONEXIONES AUTOMÁTICAS - Desloguear inmediatamente si se pierde conexión
          keepalive: this.config.broker.keepalive
        });

        // Heartbeat interval
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;

        this.setupEventHandlers(() => {
          // Iniciar heartbeat solo cuando esté conectado
          if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
          if (this.userId) {
            this.heartbeatInterval = setInterval(() => {
              if (this.isConnected && this.userId) {
                const topic = `telefonia/users/heartbeat/${this.userId}`;
                this.publish(topic, { userId: this.userId, timestamp: Date.now() });
              }
            }, 60000); // cada 60 segundos
          }
          resolve(true);
        }, reject);

      } catch (error) {
        console.error('❌ Error conectando frontend a MQTT:', error);
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Configurar manejadores de eventos
  setupEventHandlers(resolve, reject) {
    this.client.on('connect', () => {
      this.isConnected = true;
      this.isConnecting = false;
      
      // ✅ CONEXIÓN EXITOSA: Resetear contador de desconexiones
      this.firstDisconnectionTime = null;
      this.lastDisconnectionTime = null;
      
      // Re-suscribirse a todos los topics activos
      this.resubscribeAll();
      
      // Ejecutar callback de conexión
      if (this.systemCallbacks.onConnect) {
        this.systemCallbacks.onConnect();
      }
      
      resolve(true);
    });

    this.client.on('error', (error) => {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.warn(`⚠️ [MQTT] Error en frontend | ${timestamp} | error:${error.message || 'Unknown'}`);
      this.isConnected = false;
      this.isConnecting = false;
      
      // ✅ PERMITIR REINTENTOS AUTOMÁTICOS (sin logout)
      // El cliente MQTT se reconectará automáticamente gracias a reconnectPeriod
      console.log(`🔄 [MQTT] Error detectado, el cliente intentará reconectar automáticamente`);
      
      if (this.systemCallbacks.onError) {
        this.systemCallbacks.onError(error);
      }
      
      // No rechazar la promesa para permitir reconexión
      if (!this.firstDisconnectionTime) {
        reject(error);
      }
    });

    this.client.on('reconnect', () => {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.log(`🔄 [MQTT] Intento de reconexión automática | ${timestamp}`);
      // ✅ PERMITIR REINTENTOS - No hacer logout
    });

    this.client.on('close', () => {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.warn(`⚠️ [MQTT] Conexión cerrada | ${timestamp}`);
      
      this.isConnected = false;
      this.isConnecting = false;
      
      // ✅ PERMITIR REINTENTOS AUTOMÁTICOS (sin logout)
      // El cliente MQTT se reconectará automáticamente gracias a reconnectPeriod
      console.log(`🔄 [MQTT] Conexión cerrada, el cliente intentará reconectar automáticamente`);
      
      if (this.systemCallbacks.onDisconnect) {
        this.systemCallbacks.onDisconnect();
      }
    });
    
    // ✅ MANEJAR TIMEOUTS CON REINTENTOS AUTOMÁTICOS
    this.client.on('offline', () => {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.warn(`⚠️ [MQTT] Cliente offline | ${timestamp}`);
      
      // ✅ PERMITIR REINTENTOS AUTOMÁTICOS (sin logout)
      // El cliente MQTT se reconectará automáticamente gracias a reconnectPeriod
      console.log(`🔄 [MQTT] Cliente offline, el cliente intentará reconectar automáticamente`);
    });
    
    // Interceptar errores específicos de timeout y permitir reintentos
    const originalEmit = this.client.emit.bind(this.client);
    this.client.emit = function(event, ...args) {
      if (event === 'error') {
        const error = args[0];
        if (error && (error.message?.includes('keepalive timeout') || 
                     error.message?.includes('connack timeout') ||
                     error.message?.includes('Keepalive timeout') ||
                     error.message?.includes('Connack timeout'))) {
          // ✅ PERMITIR REINTENTOS AUTOMÁTICOS (sin logout)
          console.warn(`⚠️ [MQTT] Timeout detectado, el cliente intentará reconectar automáticamente: ${error.message}`);
        }
      }
      return originalEmit(event, ...args);
    };
    
    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });
  }
  
  // 🚨 REGISTRAR DESCONEXIÓN FALLIDA (Ya no se usa - se desloguea inmediatamente)
  recordFailedDisconnection() {
    // Este método ya no es necesario porque deslogueamos inmediatamente
    // Se mantiene por compatibilidad pero no hace nada
  }
  
  // 🚨 FORZAR CIERRE DE SESIÓN INMEDIATAMENTE (Sin reintentos)
  forceLogout() {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.error(`🚨 [MQTT] FORZANDO CIERRE DE SESIÓN INMEDIATO | ${timestamp} | razón:pérdida_de_conexión_mqtt`);
    
    // Desconectar completamente el cliente MQTT para evitar reconexiones
    if (this.client) {
      try {
        this.client.end(true); // true = desconectar forzadamente
        this.client.removeAllListeners(); // Limpiar todos los listeners
      } catch (error) {
        console.error('❌ Error desconectando cliente MQTT:', error);
      }
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.client = null;
    
    // Detener heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Ejecutar callback de logout forzado
    if (this.systemCallbacks.onForceLogout) {
      this.systemCallbacks.onForceLogout();
    } else {
      // Si no hay callback configurado, intentar redirigir directamente
      if (typeof window !== 'undefined' && window.location) {
        console.error('🚨 [MQTT] Redirigiendo a logout por pérdida de conexión MQTT');
        setTimeout(() => {
          window.location.href = '/signin?reason=mqtt_connection_lost';
        }, 1000); // Redirección más rápida (1 segundo en lugar de 2)
      }
    }
  }

  // Manejar mensajes recibidos
  handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      
      // 🚨 LOG DE MENSAJE MQTT RECIBIDO (especialmente para tipificaciones)
      if (topic && topic.includes('tipificacion/nueva')) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const logLine = `${timestamp} 📨 [MQTT] MENSAJE_RECIBIDO | topic:${topic} | idLlamada:${data?.idLlamada || 'N/A'} | cedula:${data?.cedula || 'N/A'}`;
        console.log(logLine);
      }
      
      // Buscar listeners por categoría
      this.findAndExecuteListeners(topic, data);
      
    } catch (error) {
      const errorTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const errorLog = `${errorTimestamp} ❌ [MQTT] ERROR_PROCESANDO_MENSAJE | topic:${topic} | RAZON:${error.message || 'Error desconocido'}`;
      console.error(errorLog);
      console.error('❌ Error procesando mensaje MQTT:', error);
    }
  }

  // Buscar y ejecutar listeners
  findAndExecuteListeners(topic, data) {
    // Buscar en todas las categorías
    Object.keys(this.listeners).forEach(category => {
      if (this.listeners[category][topic]) {
        this.listeners[category][topic].forEach(callback => {
          try {
            // 🚨 LOG cuando se ejecuta callback de tipificación
            if (topic && topic.includes('tipificacion/nueva')) {
              const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
              const logLine = `${timestamp} 🔔 [MQTT] CALLBACK_EJECUTADO | topic:${topic} | idLlamada:${data?.idLlamada || 'N/A'} | callbacks:${this.listeners[category][topic].length}`;
              console.log(logLine);
            }
            
            callback(data);
          } catch (error) {
            const errorTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
            const errorLog = `${errorTimestamp} ❌ [MQTT] ERROR_EN_CALLBACK | topic:${topic} | RAZON:${error.message || 'Error desconocido'}`;
            console.error(errorLog);
            console.error(`❌ Error en callback de ${topic}:`, error);
          }
        });
      }
    });
    
    // 🚨 LOG si no hay listeners registrados para tipificaciones
    if (topic && topic.includes('tipificacion/nueva')) {
      let hasListeners = false;
      Object.keys(this.listeners).forEach(category => {
        if (this.listeners[category][topic] && this.listeners[category][topic].length > 0) {
          hasListeners = true;
        }
      });
      
      if (!hasListeners) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const warningLog = `${timestamp} ⚠️ [MQTT] SIN_LISTENERS | topic:${topic} | idLlamada:${data?.idLlamada || 'N/A'} | RAZON:no_hay_callbacks_registrados`;
        console.warn(warningLog);
      }
    }
  }

  // Suscribirse a un topic
  subscribe(topic) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      // Verificar que el cliente no esté desconectándose
      if (this.client.disconnecting || this.client.disconnected) {
        console.warn(`⚠️ [MQTT] Cliente desconectándose, no se puede suscribir a ${topic}`);
        return false;
      }

      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error(`❌ Error suscribiéndose a ${topic}:`, error);
          // Si hay error de suscripción y el cliente está desconectándose, desloguear
          if (error.message?.includes('disconnecting') || error.message?.includes('client disconnecting')) {
            console.error(`🚨 [MQTT] Error de suscripción por desconexión, deslogueando`);
            this.forceLogout();
          }
        } else {
          this.subscriptions.add(topic);
        }
      });
      return true;
    } catch (error) {
      console.error('❌ Error en subscribe MQTT:', error);
      return false;
    }
  }

  // Re-suscribirse a todos los topics activos
  resubscribeAll() {
    // Solo re-suscribir si está conectado y el cliente no está desconectándose
    if (!this.isConnected || !this.client || this.client.disconnecting || this.client.disconnected) {
      console.warn(`⚠️ [MQTT] No se puede re-suscribir: cliente no conectado o desconectándose`);
      return;
    }
    
    Object.keys(this.listeners).forEach(category => {
      Object.keys(this.listeners[category]).forEach(topic => {
        this.subscribe(topic, category);
      });
    });
  }

  // Registrar listener para un topic
  on(topic, callback, category = 'status') {
    if (!this.listeners[category]) {
      this.listeners[category] = {};
    }
    
    if (!this.listeners[category][topic]) {
      this.listeners[category][topic] = [];
    }
    
    // Evitar duplicar listeners
    if (!this.listeners[category][topic].includes(callback)) {
      this.listeners[category][topic].push(callback);
    }
    
    // Suscribirse si está conectado y es la primera vez
    if (this.isConnected && this.listeners[category][topic].length === 1) {
      this.subscribe(topic, category);
    }
  }

  // Remover listener específico
  off(topic, callback, category = 'status') {
    if (this.listeners[category] && this.listeners[category][topic]) {
      const index = this.listeners[category][topic].indexOf(callback);
      if (index > -1) {
        this.listeners[category][topic].splice(index, 1);
      }
    }
  }

  // Publicar mensaje
  publish(topic, data) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      // Verificar que el cliente no esté desconectándose
      if (this.client.disconnecting || this.client.disconnected) {
        console.warn(`⚠️ [MQTT] Cliente desconectándose, no se puede publicar en ${topic}`);
        return false;
      }

      const message = JSON.stringify(data);
      this.client.publish(topic, message, (error) => {
        if (error) {
          console.error(`❌ Error publicando en ${topic}:`, error);
          // Si hay error de publicación y el cliente está desconectándose, desloguear
          if (error.message?.includes('disconnecting') || error.message?.includes('client disconnecting')) {
            console.error(`🚨 [MQTT] Error de publicación por desconexión, deslogueando`);
            this.forceLogout();
          }
        }
      });
      return true;
    } catch (error) {
      console.error('❌ Error en publish MQTT:', error);
      return false;
    }
  }

  // Métodos específicos para estados de usuario
  onStatusChange(callback) {
    this.on(this.topics.statusChanged, callback, 'status');
  }

  onActiveUsersUpdate(callback) {
    this.on(this.topics.activeUsers, callback, 'status');
  }

  onUserConnected(callback) {
    this.on(this.topics.userConnected, callback, 'status');
  }

  onUserDisconnected(callback) {
    this.on(this.topics.userDisconnected, callback, 'status');
  }

  // Métodos específicos para notificaciones
  onNotification(callback) {
    this.on(this.topics.notifications, callback, 'notifications');
  }

  // Métodos específicos para eventos del sistema
  onSystemEvents(callback) {
    this.on(this.topics.systemEvents, callback, 'system');
  }

  // Métodos específicos para mensajes de usuario
  onUserMessage(userId, callback) {
    const topic = this.topics.userSpecific(userId);
    this.on(topic, callback, 'user');
  }

  onUserStatusUpdate(userId, callback) {
    const topic = this.topics.userStatus(userId);
    this.on(topic, callback, 'user');
  }

  // Obtener información de conexión
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      userId: this.userId,
      userName: this.userName,
      subscriptions: Array.from(this.subscriptions),
      brokerUrl: this.config.broker.url
    };
  }

  // Obtener estadísticas
  getStats() {
    let totalListeners = 0;
    Object.keys(this.listeners).forEach(category => {
      Object.keys(this.listeners[category]).forEach(topic => {
        totalListeners += this.listeners[category][topic].length;
      });
    });

    return {
      connected: this.isConnected,
      subscriptions: this.subscriptions.size,
      listeners: totalListeners,
      categories: Object.keys(this.listeners)
    };
  }

  // Limpiar listeners por categoría
  clearListeners(category = null) {
    if (category) {
      if (this.listeners[category]) {
        this.listeners[category] = {};
      }
    } else {
      this.listeners = {
        status: {},
        notifications: {},
        system: {},
        user: {}
      };
    }
  }

  // Desconectar completamente
  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      this.isConnecting = false;
      this.connectionPromise = null;
      this.client = null;
      this.subscriptions.clear();
      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Crear instancia singleton
const mqttService = new MQTTService();

// Exportar tanto la instancia como la clase
export { mqttService };
export default MQTTService;

// Función de compatibilidad para código existente
export function connectMQTT(userId, userName) {
  return mqttService.connect(null, userId, userName);
} 