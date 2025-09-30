import websocketService from '@/router/services/websocketService';

export default {
  install(app) {
    // Agregar el servicio WebSocket al contexto global de Vue
    app.config.globalProperties.$websocket = websocketService;
    
    console.log('🔌 Plugin WebSocket instalado');
  }
}; 