// Configuración Centralizada de MQTT
// Este archivo centraliza toda la configuración MQTT del frontend

export const MQTT_CONFIG = {
  // Configuración del broker
  broker: {
    url: 'ws://localhost:9001',
    connectTimeout: 4000,
    reconnectPeriod: 1000,
    keepalive: 60,
    clean: true
  },
  
  // Topics organizados por categoría
  topics: {
    // Estados de usuario
    status: {
      statusChanged: 'telefonia/users/status/changed',
      activeUsers: 'telefonia/users/active/list',
      userConnected: 'telefonia/users/connected',
      userDisconnected: 'telefonia/users/disconnected',
      userStatus: (userId) => `telefonia/users/${userId}/status`
    },
    
    // Notificaciones
    notifications: {
      general: 'telefonia/notifications',
      user: (userId) => `telefonia/users/${userId}/notifications`,
      system: 'telefonia/system/notifications'
    },
    
    // Eventos del sistema
    system: {
      events: 'telefonia/system/events',
      heartbeat: 'telefonia/system/heartbeat',
      maintenance: 'telefonia/system/maintenance'
    },
    
    // Comunicación específica por usuario
    user: {
      messages: (userId) => `telefonia/users/${userId}/messages`,
      commands: (userId) => `telefonia/users/${userId}/commands`,
      status: (userId) => `telefonia/users/${userId}/status`
    },
    
    // Telefonía y llamadas
    telephony: {
      calls: 'telefonia/calls',
      callStatus: 'telefonia/calls/status',
      callEvents: 'telefonia/calls/events',
      queue: 'telefonia/queue',
      queueStatus: 'telefonia/queue/status'
    },
    
    // Chat y mensajería
    chat: {
      messages: 'telefonia/chat/messages',
      typing: 'telefonia/chat/typing',
      presence: 'telefonia/chat/presence'
    }
  },
  
  // Configuración de QoS (Quality of Service)
  qos: {
    status: 1,        // Estados de usuario - QoS 1 (al menos una vez)
    notifications: 0, // Notificaciones - QoS 0 (máximo una vez)
    system: 2,        // Eventos del sistema - QoS 2 (exactamente una vez)
    user: 1,          // Mensajes de usuario - QoS 1
    telephony: 2,     // Telefonía - QoS 2 (crítico)
    chat: 0           // Chat - QoS 0 (no crítico)
  },
  
  // Configuración de reconexión
  reconnect: {
    enabled: true,
    maxRetries: 10,
    retryDelay: 1000,
    backoffMultiplier: 1.5
  },
  
  // Configuración de logging
  logging: {
    enabled: true,
    level: 'info', // 'debug', 'info', 'warn', 'error'
    showTimestamps: true,
    showTopics: true
  },
  
  // Configuración de seguridad
  security: {
    useTLS: false,
    username: null,
    password: null,
    clientId: null
  }
};

// Funciones de utilidad para MQTT
export const MQTT_UTILS = {
  // Generar Client ID único
  generateClientId: (prefix = 'frontend', userId = null) => {
    const timestamp = Date.now();
    const random = Math.random().toString(16).substr(2, 8);
    return userId ? `${prefix}_${userId}_${timestamp}` : `${prefix}_${timestamp}_${random}`;
  },
  
  // Validar topic
  validateTopic: (topic) => {
    if (!topic || typeof topic !== 'string') {
      return false;
    }
    
    // Verificar que no contenga caracteres prohibidos
    const forbiddenChars = ['+', '#', '\0'];
    return !forbiddenChars.some(char => topic.includes(char));
  },
  
  // Construir topic con parámetros
  buildTopic: (baseTopic, ...params) => {
    let topic = baseTopic;
    params.forEach(param => {
      topic = topic.replace(/\{(\w+)\}/g, param);
    });
    return topic;
  },
  
  // Obtener QoS para una categoría
  getQoS: (category) => {
    return MQTT_CONFIG.qos[category] || 0;
  },
  
  // Verificar si un topic pertenece a una categoría
  getTopicCategory: (topic) => {
    for (const [category, topics] of Object.entries(MQTT_CONFIG.topics)) {
      for (const [, value] of Object.entries(topics)) {
        if (typeof value === 'string' && value === topic) {
          return category;
        }
        if (typeof value === 'function') {
          // Para topics dinámicos, verificar si coincide el patrón
          const pattern = value.toString().match(/`([^`]+)`/);
          if (pattern && topic.startsWith(pattern[1].replace(/\$\{userId\}/g, ''))) {
            return category;
          }
        }
      }
    }
    return 'unknown';
  }
};

// Configuración por entorno
export const getMQTTConfig = (environment = 'development') => {
  const baseConfig = { ...MQTT_CONFIG };
  
  switch (environment) {
    case 'production':
      baseConfig.broker.url = process.env.VUE_APP_MQTT_BROKER_URL || 'wss://mqtt.yourdomain.com:9001';
      baseConfig.security.useTLS = true;
      baseConfig.logging.level = 'warn';
      break;
      
    case 'staging':
      baseConfig.broker.url = process.env.VUE_APP_MQTT_BROKER_URL || 'wss://staging-mqtt.yourdomain.com:9001';
      baseConfig.logging.level = 'info';
      break;
      
    case 'development':
    default:
      baseConfig.broker.url = process.env.VUE_APP_MQTT_BROKER_URL || 'ws://localhost:9001';
      baseConfig.logging.level = 'debug';
      break;
  }
  
  return baseConfig;
};

// Exportar configuración por defecto
export default MQTT_CONFIG; 