// MQTT Service Centralizado para Frontend
import mqtt from 'mqtt'
import { MQTT_UTILS, getMQTTConfig } from './mqttConfig'

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.userId = null;
    this.userName = null;
    
    // Configuración centralizada desde archivo de configuración
    this.config = getMQTTConfig(process.env.NODE_ENV || 'development');
    
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
      onReconnect: null
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
      console.log('🔌 MQTT ya está conectado, reutilizando conexión');
      return true;
    }
    
    if (this.isConnecting && this.connectionPromise) {
      console.log('🔌 MQTT ya está conectando, esperando...');
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.userId = userId;
    this.userName = userName;
    
    // Usar URL personalizada si se proporciona
    const finalBrokerUrl = brokerUrl || this.config.broker.url;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log('🔌 Frontend conectando a broker MQTT:', finalBrokerUrl);
        console.log('   - User ID:', userId);
        console.log('   - User Name:', userName);
        
        const clientId = MQTT_UTILS.generateClientId('frontend', userId);
        
        this.client = mqtt.connect(finalBrokerUrl, {
          clientId: clientId,
          username: userName || userId || undefined,
          clean: this.config.broker.clean,
          connectTimeout: this.config.broker.connectTimeout,
          reconnectPeriod: this.config.broker.reconnectPeriod,
          keepalive: this.config.broker.keepalive
        });

        this.setupEventHandlers(resolve, reject);

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
      console.log('✅ Frontend conectado al broker MQTT');
      this.isConnected = true;
      this.isConnecting = false;
      
      // Re-suscribirse a todos los topics activos
      this.resubscribeAll();
      
      // Ejecutar callback de conexión
      if (this.systemCallbacks.onConnect) {
        this.systemCallbacks.onConnect();
      }
      
      resolve(true);
    });

    this.client.on('error', (error) => {
      console.error('❌ Error en MQTT frontend:', error);
      this.isConnected = false;
      this.isConnecting = false;
      
      if (this.systemCallbacks.onError) {
        this.systemCallbacks.onError(error);
      }
      
      reject(error);
    });

    this.client.on('reconnect', () => {
      console.log('🔄 Frontend reconectando a MQTT...');
      
      if (this.systemCallbacks.onReconnect) {
        this.systemCallbacks.onReconnect();
      }
    });

    this.client.on('close', () => {
      console.log('❌ Frontend desconectado de MQTT');
      this.isConnected = false;
      this.isConnecting = false;
      
      if (this.systemCallbacks.onDisconnect) {
        this.systemCallbacks.onDisconnect();
      }
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });
  }

  // Manejar mensajes recibidos
  handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📥 MQTT mensaje recibido en ${topic}:`, data);
      
      // Buscar listeners por categoría
      this.findAndExecuteListeners(topic, data);
      
    } catch (error) {
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
            callback(data);
          } catch (error) {
            console.error(`❌ Error en callback de ${topic}:`, error);
          }
        });
      }
    });
  }

  // Suscribirse a un topic
  subscribe(topic, category = 'status') {
    if (!this.isConnected || !this.client) {
      console.log('⚠️ MQTT no conectado, no se puede suscribir a:', topic);
      return false;
    }

    try {
      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error(`❌ Error suscribiéndose a ${topic}:`, error);
        } else {
          console.log(`📡 Suscrito a ${topic} (categoría: ${category})`);
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
    console.log('🔄 Re-suscribiendo a todos los topics activos...');
    
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
        console.log(`🗑️ Listener removido de ${topic}`);
      }
    }
  }

  // Publicar mensaje
  publish(topic, data) {
    if (!this.isConnected || !this.client) {
      console.log('⚠️ MQTT no conectado, no se puede publicar en:', topic);
      return false;
    }

    try {
      const message = JSON.stringify(data);
      this.client.publish(topic, message, (error) => {
        if (error) {
          console.error(`❌ Error publicando en ${topic}:`, error);
        } else {
          console.log(`📤 Mensaje MQTT publicado en ${topic}:`, data);
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
        console.log(`🗑️ Listeners de categoría '${category}' limpiados`);
      }
    } else {
      this.listeners = {
        status: {},
        notifications: {},
        system: {},
        user: {}
      };
      console.log('🗑️ Todos los listeners limpiados');
    }
  }

  // Desconectar completamente
  disconnect() {
    if (this.client) {
      console.log('🔌 Desconectando MQTT...');
      this.client.end();
      this.isConnected = false;
      this.isConnecting = false;
      this.connectionPromise = null;
      this.client = null;
      this.subscriptions.clear();
      console.log('✅ MQTT desconectado');
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
  console.log('🔌 Conectando MQTT (función de compatibilidad):', userId, userName);
  return mqttService.connect(null, userId, userName);
} 