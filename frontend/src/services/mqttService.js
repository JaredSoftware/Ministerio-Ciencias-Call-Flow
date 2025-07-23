// MQTT Service para Frontend
import mqtt from 'mqtt'

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.topics = {
      statusChanged: 'telefonia/users/status/changed',
      activeUsers: 'telefonia/users/active/list',
      userConnected: 'telefonia/users/connected',
      userDisconnected: 'telefonia/users/disconnected'
    };
    this.listeners = {};
    this.userId = null;
  }

  // Conectar al broker MQTT (solo una vez por sesión)
  async connect(brokerUrl = 'ws://localhost:9001', userId = null) {
    // Si ya está conectado o conectando, devolver la promesa existente
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

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log('🔌 Frontend conectando a broker MQTT:', brokerUrl, 'userId:', userId);
        
        this.client = mqtt.connect(brokerUrl, {
          clientId: userId ? `frontend_${userId}` : `frontend_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`,
          username: userId || undefined,
          clean: true,
          connectTimeout: 4000,
          reconnectPeriod: 1000,
        });

        this.client.on('connect', () => {
          console.log('✅ Frontend conectado al broker MQTT');
          this.isConnected = true;
          this.isConnecting = false;
          
          // Re-suscribirse a todos los topics activos
          Object.keys(this.listeners).forEach(topic => {
            this.subscribe(topic);
          });
          
          resolve(true);
        });

        this.client.on('error', (error) => {
          console.error('❌ Error en MQTT frontend:', error);
          this.isConnected = false;
          this.isConnecting = false;
          reject(error);
        });

        this.client.on('reconnect', () => {
          console.log('🔄 Frontend reconectando a MQTT...');
        });

        this.client.on('close', () => {
          console.log('❌ Frontend desconectado de MQTT');
          this.isConnected = false;
          this.isConnecting = false;
        });

        this.client.on('message', (topic, message) => {
          try {
            const data = JSON.parse(message.toString());
            console.log(`📥 MQTT mensaje recibido en ${topic}:`, data);
            
            if (this.listeners[topic]) {
              this.listeners[topic].forEach(callback => {
                callback(data);
              });
            }
          } catch (error) {
            console.error('❌ Error procesando mensaje MQTT:', error);
          }
        });

      } catch (error) {
        console.error('❌ Error conectando frontend a MQTT:', error);
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  subscribe(topic) {
    if (!this.isConnected || !this.client) {
      console.log('⚠️ MQTT no conectado, no se puede suscribir');
      return false;
    }

    try {
      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error(`❌ Error suscribiéndose a ${topic}:`, error);
        } else {
          console.log(`📡 Suscrito a ${topic}`);
        }
      });
      return true;
    } catch (error) {
      console.error('❌ Error en subscribe MQTT:', error);
      return false;
    }
  }

  on(topic, callback) {
    if (!this.listeners[topic]) {
      this.listeners[topic] = [];
    }
    
    // Evitar duplicar listeners
    if (!this.listeners[topic].includes(callback)) {
      this.listeners[topic].push(callback);
    }
    
    // Solo suscribirse si no está ya suscrito
    if (this.isConnected && this.listeners[topic].length === 1) {
      this.subscribe(topic);
    }
  }

  // Solo desconectar cuando se haga logout o se cierre la app
  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      this.isConnecting = false;
      this.connectionPromise = null;
      this.listeners = {};
      console.log('🔌 Frontend desconectado de MQTT');
    }
  }
}

const mqttSingleton = new MQTTService();
export { mqttSingleton };

// Función de conexión simple para compatibilidad
export function connectMQTT(userId, userName) {
  console.log('Conectando MQTT con:', userId, userName);
  return mqtt.connect('ws://localhost:9001', {
    clientId: `user_${userId}`,
    username: userName
  });
}

export default MQTTService; 