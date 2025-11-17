<template>
  <div 
    class="status-indicator-bar"
    :style="{ backgroundColor: statusColor }"
    :class="{ 'status-animation': showAnimation }"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <div class="status-icon">
      <i class="fas fa-circle"></i>
    </div>
    <div class="status-tooltip" v-if="showTooltip">
      {{ statusLabel }}
    </div>
  </div>
</template>

<script>
import websocketService from '@/router/services/websocketService';
import axios from '@/router/services/axios';
import { mapState } from 'vuex';
import statusTypes from '@/router/services/statusTypes';

export default {
  name: 'StatusIndicatorBar',
  data() {
    return {
      currentStatus: 'offline',
      statusColor: '#6c757d',
      statusLabel: 'Desconectado',
      showAnimation: false,
      showTooltip: false
    };
  },
  computed: {
    ...mapState(['userStatus']),
  },
  watch: {
    // Observar cambios en el store directamente
    '$store.state.userStatus': {
      handler(newStatus) {
        if (newStatus && newStatus.status) {
          this.updateStatus(newStatus);
        }
      },
      immediate: true,
      deep: true
    },
    // Observar cambios en el estado de login
    '$store.state.isLoggedIn': {
      handler(newValue) {
        if (newValue) {
          this.initializeStatusService();
          this.initializeWebSocket();
          this.loadCurrentStatus();
        } else {
          // Limpiar estado
          this.currentStatus = 'offline';
          this.statusColor = '#6c757d';
          this.statusLabel = 'Desconectado';
        }
      },
      immediate: true
    }
  },
  mounted() {
    // Solo inicializar si el usuario está logueado
    if (this.$store.state.isLoggedIn) {
      this.initializeStatusService();
      this.initializeWebSocket();
      this.loadCurrentStatus();
      
      // Forzar actualización inicial desde el store
      if (this.userStatus && this.userStatus.status) {
        this.updateStatus(this.userStatus);
      }
    }
  },
  beforeUnmount() {
  },
  methods: {
    async initializeStatusService() {
      try {
        await statusTypes.initialize();
      } catch (error) {
        console.error('❌ Error inicializando servicio de tipos de estado:', error);
      }
    },
    
    initializeWebSocket() {
      // Solo suscribirse a eventos de WebSocket, no conectar ni desconectar
      websocketService.on('own_status_changed', (data) => {
        if (data && data.status) {
          this.updateStatus(data);
        }
      });
      // Eliminar cualquier llamada a websocketService.connect()
    },
    
    async loadCurrentStatus() {
      // Solo cargar si el usuario está logueado
      if (!this.$store.state.isLoggedIn) {
        return;
      }
      
      try {
        const response = await axios.get('/user-status/my-status', {
          withCredentials: true
        });
        
        if (response.data.success && response.data.status) {
          this.updateStatus(response.data.status);
        }
      } catch (error) {
        console.error('Error cargando estado para indicador:', error);
        
        // Si hay error de autenticación, limpiar estado
        if (error.response && error.response.status === 401) {
          this.currentStatus = 'offline';
          this.statusColor = '#6c757d';
          this.statusLabel = 'Desconectado';
        }
      }
    },
    
    updateStatus(data) {
      
      // Verificar que data no sea null o undefined
      if (!data || !data.status) {
        data = { status: 'offline' };
      }
      
      
      // Verificar que el servicio esté inicializado
      
      // Usar el servicio de tipos de estado para obtener información
      let selectedStatus = statusTypes.getStatusByValue(data.status);
      
      
      // El servicio siempre devuelve un estado (dinámico si no existe)
      if (!selectedStatus) {
        selectedStatus = {
          color: '#6c757d',
          label: data.status || 'Desconectado',
          icon: 'fas fa-times-circle'
        };
      }
      
      const newColor = selectedStatus.color;
      const newLabel = selectedStatus.label;
      
      
      // Solo animar si el color cambió
      if (this.statusColor !== newColor) {
        this.triggerAnimation();
      }
      
      this.currentStatus = data.status;
      this.statusColor = newColor;
      this.statusLabel = newLabel;
      
    },
    
    triggerAnimation() {
      this.showAnimation = true;
      setTimeout(() => {
        this.showAnimation = false;
      }, 1000);
    }
  }
};
</script>

<style scoped>
.status-indicator-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #28a745;
  z-index: 9999;
  transition: background-color 0.3s ease;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-indicator-bar:hover {
  height: 4px;
}

.status-indicator-bar:hover .status-tooltip {
  opacity: 1;
  transform: translateY(0);
}

.status-animation {
  animation: statusBarPulse 1s ease-in-out;
}

.status-tooltip {
  position: absolute;
  top: 8px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  pointer-events: none;
}

.status-tooltip::before {
  content: '';
  position: absolute;
  top: -4px;
  right: 10px;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid rgba(0, 0, 0, 0.8);
}

.status-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  font-size: 8px;
  opacity: 0.8;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

@keyframes statusBarPulse {
  0% { 
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
  }
  50% { 
    opacity: 0.8;
    box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
  }
  100% { 
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .status-indicator-bar {
    height: 2px;
  }
  
  .status-indicator-bar:hover {
    height: 3px;
  }
}
</style> 