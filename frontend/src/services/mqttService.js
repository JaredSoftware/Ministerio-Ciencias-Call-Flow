// MQTT Service para Frontend
import mqtt from 'mqtt'

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.topics = {
      statusChanged: 'telefonia/users/status/changed',
      activeUsers: 'telefonia/users/active/list',
      userConnected: 'telefonia/users/connected',
      userDisconnected: 'telefonia/users/disconnected'
    };
    this.listeners = {};
  }

  // Conectar al broker MQTT
  async connect(brokerUrl = 'ws://localhost:9001') {
    try {
      console.log('🔌 Frontend conectando a broker MQTT:', brokerUrl);
      
      this.client = mqtt.connect(brokerUrl, {
        clientId: `frontend_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
      });

      return new Promise((resolve, reject) => {
        this.client.on('connect', () => {
          console.log('✅ Frontend conectado al broker MQTT');
          this.isConnected = true;
          resolve(true);
        });

        this.client.on('error', (error) => {
          console.error('❌ Error en MQTT frontend:', error);
          this.isConnected = false;
          reject(error);
        });

        this.client.on('reconnect', () => {
          console.log('🔄 Frontend reconectando a MQTT...');
        });

        this.client.on('close', () => {
          console.log('❌ Frontend desconectado de MQTT');
          this.isConnected = false;
        });

        this.client.on('message', (topic, message) => {
          try {
            const data = JSON.parse(message.toString());
            console.log(`📥 MQTT mensaje recibido en ${topic}:`, data);
            
            // Emitir evento a los listeners
            if (this.listeners[topic]) {
              this.listeners[topic].forEach(callback => {
                callback(data);
              });
            }
          } catch (error) {
            console.error('❌ Error procesando mensaje MQTT:', error);
          }
        });
      });

    } catch (error) {
      console.error('❌ Error conectando frontend a MQTT:', error);
      throw error;
    }
  }

  // Suscribirse a un topic
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

  // Escuchar eventos de un topic
  on(topic, callback) {
    if (!this.listeners[topic]) {
      this.listeners[topic] = [];
      // Suscribirse al topic si no está suscrito
      this.subscribe(topic);
    }
    this.listeners[topic].push(callback);
  }

  // Desconectar
  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      console.log('🔌 Frontend desconectado de MQTT');
    }
  }
}

// Función de conexión simple para compatibilidad
export function connectMQTT(userId, userName) {
  console.log('Conectando MQTT con:', userId, userName);
  return mqtt.connect('ws://localhost:9001', {
    clientId: `user_${userId}`,
    username: userName
  });
}

// Exportar la clase como default
export default MQTTService; 