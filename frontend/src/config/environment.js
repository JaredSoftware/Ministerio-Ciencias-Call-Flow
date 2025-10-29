// Configuración dinámica de entorno
// Detecta automáticamente la URL base del navegador

class EnvironmentConfig {
  constructor() {
    this.baseUrl = this.getBaseUrl();
    this.isDevelopment = this.detectEnvironment();
  }

  // Detectar la URL base del navegador
  getBaseUrl() {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      // Construir URL base
      let baseUrl = `${protocol}//${hostname}`;
      
      // Solo agregar puerto si no es el puerto estándar (80 para http, 443 para https)
      if (port && port !== '80' && port !== '443') {
        baseUrl += `:${port}`;
      }
      
      return baseUrl;
    }
    
    // Fallback para SSR o testing
    return 'http://localhost:9035';
  }

  // Detectar si estamos en desarrollo
  detectEnvironment() {
    if (typeof window !== 'undefined') {
      // Desarrollo solo si es localhost o IP local de desarrollo
      const isLocalDev = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.startsWith('192.168.') ||
                         window.location.hostname.startsWith('10.');
      
      // También considerar desarrollo si es NODE_ENV development
      const isNodeDev = process.env.NODE_ENV === 'development';
      
      // IPs 172.x.x.x se consideran producción (servidores)
      return isLocalDev || isNodeDev;
    }
    
    return process.env.NODE_ENV === 'development';
  }

  // Obtener URL del backend WebSocket (Socket.IO)
  getWebSocketUrl() {
    if (this.isDevelopment) {
      // En desarrollo, usar localhost con puerto específico
      return 'http://localhost:9035';
    }
    
    // En producción, usar la misma URL base (nginx proxy)
    // Socket.IO usa la ruta /socket.io/ automáticamente
    return this.baseUrl;
  }

  // Obtener URL del broker MQTT
  getMQTTBrokerUrl() {
    if (this.isDevelopment) {
      // En desarrollo, usar WebSocket en localhost con puerto directo
      return 'ws://localhost:9001';
    }
    
    // En producción, usar la ruta /mqtt del proxy nginx
    const protocol = this.baseUrl.startsWith('https') ? 'wss:' : 'ws:';
    const host = new URL(this.baseUrl).host;
    return `${protocol}//${host}/mqtt`;
  }

  // Obtener URL base de la API
  getApiUrl() {
    if (this.isDevelopment) {
      return 'http://localhost:9035';
    }
    
    // En producción, usar la misma URL base
    return this.baseUrl;
  }

  // Información de debug
  getDebugInfo() {
    return {
      baseUrl: this.baseUrl,
      isDevelopment: this.isDevelopment,
      websocketUrl: this.getWebSocketUrl(),
      mqttBrokerUrl: this.getMQTTBrokerUrl(),
      apiUrl: this.getApiUrl(),
      userAgent: typeof window !== 'undefined' ? window.location.href : 'N/A'
    };
  }
}

// Crear instancia singleton
const environmentConfig = new EnvironmentConfig();

export default environmentConfig;

