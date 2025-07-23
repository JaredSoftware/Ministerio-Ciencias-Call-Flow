const mqtt = require('mqtt');

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
  }

  // Conectar al broker MQTT
  async connect(brokerUrl = 'mqtt://localhost:1883') {
    try {
      console.log('🔌 Conectando a broker MQTT:', brokerUrl);
      
      this.client = mqtt.connect(brokerUrl, {
        clientId: `backend_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 0, // No reconectar automáticamente
        rejectUnauthorized: false
      });

      return new Promise((resolve, reject) => {
        this.client.on('connect', () => {
          console.log('✅ Backend conectado al broker MQTT');
          this.isConnected = true;
          resolve();
        });

        this.client.on('error', (error) => {
          console.error('❌ Error en MQTT backend:', error);
          this.isConnected = false;
          reject(error);
        });

        this.client.on('reconnect', () => {
          console.log('🔄 Backend reconectando a MQTT...');
        });

        this.client.on('close', () => {
          console.log('❌ Backend desconectado de MQTT');
          this.isConnected = false;
        });
      });

    } catch (error) {
      console.error('❌ Error conectando backend a MQTT:', error);
      throw error;
    }
  }

  // Publicar mensaje
  publish(topic, data) {
    if (!this.isConnected || !this.client) {
      console.log('⚠️ MQTT no conectado, no se puede publicar');
      return false;
    }

    try {
      const message = JSON.stringify(data);
      this.client.publish(topic, message, { qos: 1 }, (error) => {
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

  // Publicar cambio de estado de usuario
  publishUserStatusChange(userId, userName, newStatus, newLabel, newColor) {
    const data = {
      userId,
      userName,
      newStatus,
      newLabel,
      newColor,
      timestamp: new Date().toISOString(),
      type: 'status_change'
    };

    return this.publish(this.topics.statusChanged, data);
  }

  // Publicar lista de usuarios activos
  publishActiveUsersList(users) {
    const data = {
      users,
      timestamp: new Date().toISOString(),
      type: 'active_users_list'
    };

    return this.publish(this.topics.activeUsers, data);
  }

  // Publicar conexión de usuario
  publishUserConnected(userId, userName) {
    const data = {
      userId,
      userName,
      timestamp: new Date().toISOString(),
      type: 'user_connected'
    };

    return this.publish(this.topics.userConnected, data);
  }

  // Publicar desconexión de usuario
  publishUserDisconnected(userId, userName) {
    const data = {
      userId,
      userName,
      timestamp: new Date().toISOString(),
      type: 'user_disconnected'
    };

    return this.publish(this.topics.userDisconnected, data);
  }

  // Desconectar
  disconnect() {
    if (this.client) {
      console.log('🔌 Desconectando backend de MQTT...');
      this.client.end();
      this.isConnected = false;
    }
  }

  // Obtener estado de conexión
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      clientId: this.client?.options?.clientId,
      topics: this.topics
    };
  }
}

// Exportar la clase para poder crear instancias
module.exports = MQTTService; 