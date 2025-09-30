<template>
  <div class="card">
    <div class="card-header">
      <h6 class="mb-0">
        <i class="fas fa-wifi me-2"></i>
        Estado MQTT Centralizado
      </h6>
    </div>
    <div class="card-body">
      <!-- Estado de Conexión -->
      <div class="row mb-3">
        <div class="col-12">
          <div class="d-flex align-items-center">
            <div 
              :class="connectionStatus.class" 
              class="status-indicator me-3"
            ></div>
            <div>
              <h6 class="mb-0">{{ connectionStatus.text }}</h6>
              <small class="text-muted">{{ connectionStatus.details }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Información de Conexión -->
      <div class="row mb-3" v-if="connectionInfo">
        <div class="col-md-6">
          <small class="text-muted">Broker URL:</small>
          <div class="fw-bold">{{ connectionInfo.brokerUrl }}</div>
        </div>
        <div class="col-md-6">
          <small class="text-muted">User ID:</small>
          <div class="fw-bold">{{ connectionInfo.userId || 'No autenticado' }}</div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="row mb-3" v-if="stats">
        <div class="col-md-4">
          <div class="text-center">
            <h4 class="mb-0 text-primary">{{ stats.subscriptions }}</h4>
            <small class="text-muted">Suscripciones</small>
          </div>
        </div>
        <div class="col-md-4">
          <div class="text-center">
            <h4 class="mb-0 text-success">{{ stats.listeners }}</h4>
            <small class="text-muted">Listeners</small>
          </div>
        </div>
        <div class="col-md-4">
          <div class="text-center">
            <h4 class="mb-0 text-info">{{ stats.categories.length }}</h4>
            <small class="text-muted">Categorías</small>
          </div>
        </div>
      </div>

      <!-- Suscripciones Activas -->
      <div class="row mb-3" v-if="connectionInfo && connectionInfo.subscriptions.length > 0">
        <div class="col-12">
          <h6 class="mb-2">Suscripciones Activas:</h6>
          <div class="subscriptions-list">
            <span 
              v-for="topic in connectionInfo.subscriptions" 
              :key="topic"
              class="badge bg-light text-dark me-1 mb-1"
            >
              {{ topic }}
            </span>
          </div>
        </div>
      </div>

      <!-- Eventos en Tiempo Real -->
      <div class="row" v-if="realTimeEvents.length > 0">
        <div class="col-12">
          <h6 class="mb-2">Eventos Recientes:</h6>
          <div class="events-list" style="max-height: 200px; overflow-y: auto;">
            <div 
              v-for="event in realTimeEvents.slice(-5)" 
              :key="event.id"
              class="event-item p-2 border-bottom"
            >
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <small class="text-muted">{{ formatTime(event.timestamp) }}</small>
                  <div class="fw-bold">{{ event.type }}</div>
                  <small>{{ event.details }}</small>
                </div>
                <div :class="getEventBadgeClass(event.type)" class="badge">
                  {{ event.type }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="row mt-3">
        <div class="col-12">
          <div class="d-flex gap-2">
            <button 
              @click="refreshStats" 
              class="btn btn-sm btn-outline-primary"
              :disabled="!mqttService.isConnected"
            >
              <i class="fas fa-sync-alt me-1"></i>
              Actualizar Stats
            </button>
            <button 
              @click="clearEvents" 
              class="btn btn-sm btn-outline-secondary"
            >
              <i class="fas fa-trash me-1"></i>
              Limpiar Eventos
            </button>
            <button 
              @click="testConnection" 
              class="btn btn-sm btn-outline-success"
              :disabled="!mqttService.isConnected"
            >
              <i class="fas fa-paper-plane me-1"></i>
              Test Conexión
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mqttService } from '@/services/mqttService'

export default {
  name: 'MQTTStatusMonitor',
  data() {
    return {
      connectionInfo: null,
      stats: null,
      realTimeEvents: [],
      eventCounter: 0
    }
  },
  
  computed: {
    connectionStatus() {
      if (mqttService.isConnecting) {
        return {
          text: 'Conectando...',
          details: 'Estableciendo conexión con el broker MQTT',
          class: 'bg-warning'
        }
      }
      
      if (mqttService.isConnected) {
        return {
          text: 'Conectado',
          details: 'Conexión MQTT activa y funcionando',
          class: 'bg-success'
        }
      }
      
      return {
        text: 'Desconectado',
        details: 'No hay conexión con el broker MQTT',
        class: 'bg-danger'
      }
    }
  },
  
  mounted() {
    this.initializeMonitor();
  },
  
  methods: {
    initializeMonitor() {
      // Obtener información inicial
      this.refreshStats();
      
      // Configurar callbacks del sistema
      mqttService.onSystemEvent('onConnect', () => {
        this.addEvent('connection', 'Conexión establecida exitosamente');
        this.refreshStats();
      });
      
      mqttService.onSystemEvent('onDisconnect', () => {
        this.addEvent('disconnection', 'Conexión perdida');
        this.refreshStats();
      });
      
      mqttService.onSystemEvent('onError', (error) => {
        this.addEvent('error', `Error de conexión: ${error.message}`);
        this.refreshStats();
      });
      
      mqttService.onSystemEvent('onReconnect', () => {
        this.addEvent('reconnection', 'Reconectando al broker...');
        this.refreshStats();
      });
      
      // Suscribirse a eventos de ejemplo
      mqttService.onStatusChange((data) => {
        this.addEvent('status_change', `${data.userName} cambió a ${data.newStatus}`);
      });
      
      mqttService.onUserConnected((data) => {
        this.addEvent('user_connected', `${data.userName} se conectó`);
      });
      
      mqttService.onUserDisconnected((data) => {
        this.addEvent('user_disconnected', `${data.userName} se desconectó`);
      });
      
      // Actualizar stats periódicamente
      setInterval(() => {
        if (mqttService.isConnected) {
          this.refreshStats();
        }
      }, 10000); // Cada 10 segundos
    },
    
    refreshStats() {
      this.connectionInfo = mqttService.getConnectionInfo();
      this.stats = mqttService.getStats();
    },
    
    addEvent(type, details) {
      this.realTimeEvents.push({
        id: ++this.eventCounter,
        type: type,
        details: details,
        timestamp: new Date()
      });
      
      // Mantener solo los últimos 50 eventos
      if (this.realTimeEvents.length > 50) {
        this.realTimeEvents = this.realTimeEvents.slice(-50);
      }
    },
    
    clearEvents() {
      this.realTimeEvents = [];
      this.eventCounter = 0;
    },
    
    testConnection() {
      if (mqttService.isConnected) {
        // Publicar un mensaje de prueba
        const testMessage = {
          type: 'test',
          timestamp: new Date().toISOString(),
          message: 'Mensaje de prueba desde el monitor MQTT'
        };
        
        const success = mqttService.publish('telefonia/system/test', testMessage);
        
        if (success) {
          this.addEvent('test_sent', 'Mensaje de prueba enviado exitosamente');
        } else {
          this.addEvent('test_error', 'Error enviando mensaje de prueba');
        }
      }
    },
    
    formatTime(date) {
      return new Date(date).toLocaleTimeString();
    },
    
    getEventBadgeClass(type) {
      const classes = {
        'connection': 'bg-success',
        'disconnection': 'bg-danger',
        'error': 'bg-danger',
        'reconnection': 'bg-warning',
        'status_change': 'bg-info',
        'user_connected': 'bg-success',
        'user_disconnected': 'bg-warning',
        'test_sent': 'bg-primary',
        'test_error': 'bg-danger'
      };
      
      return classes[type] || 'bg-secondary';
    }
  }
}
</script>

<style scoped>
.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.subscriptions-list {
  max-height: 100px;
  overflow-y: auto;
}

.events-list {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
}

.event-item {
  transition: background-color 0.2s;
}

.event-item:hover {
  background-color: #f8f9fa;
}

.event-item:last-child {
  border-bottom: none !important;
}
</style> 