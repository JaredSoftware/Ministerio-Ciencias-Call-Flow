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
import websocketService from '@/services/websocketService';
import axios from '@/services/axios';
import { mapState } from 'vuex';

export default {
  name: 'StatusIndicatorBar',
  data() {
    return {
      currentStatus: 'online',
      statusColor: '#28a745',
      statusLabel: 'En línea',
      showAnimation: false,
      showTooltip: false,
      statusColors: {
        online: '#28a745',
        busy: '#dc3545',
        away: '#ffc107',
        break: '#fd7e14',
        meeting: '#6f42c1',
        lunch: '#e83e8c',
        vacation: '#17a2b8',
        sick: '#6c757d'
      },
      statusLabels: {
        online: 'En línea',
        busy: 'Ocupado',
        away: 'Ausente',
        break: 'En descanso',
        meeting: 'En reunión',
        lunch: 'Almuerzo',
        vacation: 'Vacaciones',
        sick: 'Enfermo'
      }
    };
  },
  computed: {
    ...mapState(['userStatus']),
  },
  watch: {
    userStatus: {
      handler(newStatus) {
        console.log('🔄 Estado detectado desde Vuex:', newStatus);
        if (newStatus && newStatus.status) {
          this.updateStatus(newStatus);
        }
      },
      immediate: true,
      deep: true
    },
    // Observar cambios específicos en el status
    'userStatus.status': {
      handler(newStatus) {
        console.log('🔄 Status específico detectado:', newStatus);
        if (newStatus) {
          this.updateStatus({ status: newStatus });
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.initializeWebSocket();
    this.loadCurrentStatus();
    
    // Forzar actualización inicial desde el store
    if (this.userStatus && this.userStatus.status) {
      this.updateStatus(this.userStatus);
    }
  },
  beforeUnmount() {
    console.log('🧹 Limpiando suscripciones de StatusIndicatorBar');
  },
  methods: {
    initializeWebSocket() {
      console.log('🔌 Inicializando WebSocket en StatusIndicatorBar...');
      
      // Suscribirse a eventos de WebSocket
      websocketService.on('own_status_changed', (data) => {
        console.log('📡 Evento own_status_changed recibido en StatusIndicatorBar:', data);
        if (data && data.status) {
          this.updateStatus(data);
        }
      });
      
      // Conectar WebSocket si no está conectado
      if (!websocketService.isConnected) {
        console.log('🔌 Conectando WebSocket desde StatusIndicatorBar...');
        websocketService.connect();
      } else {
        console.log('✅ WebSocket ya conectado en StatusIndicatorBar');
      }
    },
    
    async loadCurrentStatus() {
      try {
        const response = await axios.get('/user-status/my-status');
        if (response.data.success && response.data.status) {
          this.updateStatus(response.data.status);
        }
      } catch (error) {
        console.error('Error cargando estado para indicador:', error);
      }
    },
    
    updateStatus(data) {
      console.log('🔄 Actualizando indicador de estado:', data);
      
      // Verificar que data no sea null o undefined
      if (!data || !data.status) {
        console.log('⚠️ Datos inválidos, usando estado por defecto');
        data = { status: 'online' };
      }
      
      console.log('   - Estado actual:', this.currentStatus);
      console.log('   - Color actual:', this.statusColor);
      console.log('   - Nuevo estado:', data.status);
      
      const newColor = this.statusColors[data.status] || this.statusColors.online;
      const newLabel = this.statusLabels[data.status] || this.statusLabels.online;
      
      console.log('   - Nuevo color:', newColor);
      console.log('   - Nuevo label:', newLabel);
      
      // Solo animar si el color cambió
      if (this.statusColor !== newColor) {
        console.log('   - Color cambió, activando animación');
        this.triggerAnimation();
      }
      
      this.currentStatus = data.status;
      this.statusColor = newColor;
      this.statusLabel = newLabel;
      
      console.log('✅ Indicador actualizado:', this.statusLabel);
      console.log('   - Color final:', this.statusColor);
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