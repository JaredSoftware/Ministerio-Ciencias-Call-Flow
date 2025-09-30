<template>
  <div class="websocket-test">
    <div class="card">
      <div class="card-header">
        <h6>🔌 WebSocket Test</h6>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h6>Estado de Conexión:</h6>
            <div class="status-indicator">
              <span 
                class="status-dot" 
                :class="{ 'connected': isConnected, 'disconnected': !isConnected }"
              ></span>
              <span class="status-text">
                {{ isConnected ? 'Conectado' : 'Desconectado' }}
              </span>
            </div>
            <p class="text-sm text-muted">Socket ID: {{ socketId || 'N/A' }}</p>
          </div>
          <div class="col-md-6">
            <h6>Acciones:</h6>
            <button 
              @click="connect" 
              class="btn btn-sm btn-success me-2"
              :disabled="isConnected"
            >
              🔌 Conectar WebSocket
            </button>
            <button 
              @click="disconnect" 
              class="btn btn-sm btn-danger me-2"
              :disabled="!isConnected"
            >
              Desconectar
            </button>
            <button 
              @click="testStatus" 
              class="btn btn-sm btn-primary me-2"
              :disabled="!isConnected"
            >
              Probar Estado
            </button>
            <button 
              @click="testSession" 
              class="btn btn-sm btn-info me-2"
            >
              Probar Sesión
            </button>
            <button 
              @click="testAuth" 
              class="btn btn-sm btn-warning me-2"
            >
              🔐 Verificar Login
            </button>
            <button 
              @click="forceConnect" 
              class="btn btn-sm btn-primary"
              :disabled="isConnected"
            >
              🚀 Forzar Conexión
            </button>
          </div>
        </div>
        
        <div class="mt-3">
          <h6>Log de Eventos:</h6>
          <div class="log-container">
            <div 
              v-for="(log, index) in logs" 
              :key="index" 
              class="log-entry"
              :class="log.type"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import websocketService from '@/services/websocketService';

export default {
  name: 'WebSocketTest',
  data() {
    return {
      isConnected: false,
      socketId: null,
      logs: []
    };
  },
  mounted() {
    this.addLog('info', 'Componente montado');
    this.updateConnectionStatus();
    
    // Suscribirse a eventos del WebSocket
    websocketService.on('userStatusChanged', (data) => {
      this.addLog('success', `Estado cambiado: ${JSON.stringify(data)}`);
    });
    
    websocketService.on('activeUsersList', (users) => {
      this.addLog('info', `Usuarios activos: ${users.length}`);
    });
    
    websocketService.on('statusChangeError', (error) => {
      this.addLog('error', `Error: ${error.message}`);
    });
  },
  methods: {
    connect() {
      this.addLog('info', 'Intentando conectar...');
      websocketService.connect();
      this.updateConnectionStatus();
    },
    
    disconnect() {
      this.addLog('info', 'Desconectando...');
      websocketService.disconnect();
      this.updateConnectionStatus();
    },
    
    testStatus() {
      this.addLog('info', 'Probando cambio de estado...');
      websocketService.changeStatus('busy', 'Probando WebSocket');
    },
    
    async testSession() {
      this.addLog('info', 'Probando sesión...');
      try {
        const response = await fetch('/api/user-status/test-session', {
          credentials: 'include'
        });
        const data = await response.json();
        this.addLog('info', `Respuesta sesión: ${JSON.stringify(data)}`);
      } catch (error) {
        this.addLog('error', `Error probando sesión: ${error.message}`);
      }
    },
    
    async testAuth() {
      this.addLog('info', 'Probando autenticación...');
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include'
        });
        const data = await response.json();
        this.addLog('info', `Respuesta auth: ${JSON.stringify(data)}`);
        
        if (data.authenticated) {
          this.addLog('success', '✅ Usuario autenticado - Puedes conectar WebSocket');
        } else {
          this.addLog('error', '❌ Usuario NO autenticado - Haz login primero');
        }
      } catch (error) {
        this.addLog('error', `Error probando auth: ${error.message}`);
      }
    },
    
    async forceConnect() {
      this.addLog('info', '🚀 Forzando conexión WebSocket...');
      try {
        this.addLog('info', 'Verificando sesión primero...');
        const authCheck = await fetch('/api/auth/check', {
          credentials: 'include'
        });
        const authData = await authCheck.json();
        this.addLog('info', `Auth check: ${JSON.stringify(authData)}`);
        
        if (authData.authenticated) {
          this.addLog('success', '✅ Usuario autenticado, conectando WebSocket...');
          await websocketService.connect();
          this.updateConnectionStatus();
        } else {
          this.addLog('error', '❌ Usuario no autenticado');
        }
      } catch (error) {
        this.addLog('error', `Error forzando conexión: ${error.message}`);
      }
    },
    
    updateConnectionStatus() {
      const status = websocketService.getConnectionStatus();
      this.isConnected = status.isConnected;
      this.socketId = status.socketId;
      
      if (this.isConnected) {
        this.addLog('success', 'WebSocket conectado');
      } else {
        this.addLog('warning', 'WebSocket desconectado');
      }
    },
    
    addLog(type, message) {
      const time = new Date().toLocaleTimeString();
      this.logs.unshift({
        type,
        time,
        message
      });
      
      // Mantener solo los últimos 20 logs
      if (this.logs.length > 20) {
        this.logs = this.logs.slice(0, 20);
      }
    }
  }
};
</script>

<style scoped>
.websocket-test {
  margin: 1rem 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 0.5rem;
  background-color: #dc3545;
}

.status-dot.connected {
  background-color: #28a745;
}

.status-dot.disconnected {
  background-color: #dc3545;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
}

.log-entry {
  display: flex;
  margin-bottom: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
}

.log-entry.info {
  color: #0d6efd;
}

.log-entry.success {
  color: #198754;
}

.log-entry.warning {
  color: #fd7e14;
}

.log-entry.error {
  color: #dc3545;
}

.log-time {
  margin-right: 0.5rem;
  color: #6c757d;
  min-width: 80px;
}

.log-message {
  flex: 1;
}
</style> 