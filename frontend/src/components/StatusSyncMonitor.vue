<template>
  <div class="status-sync-monitor">
    <div class="sync-indicator" :class="{ 'syncing': isSyncing, 'connected': isConnected }">
      <div class="sync-dot"></div>
      <span class="sync-text">{{ syncText }}</span>
    </div>
    
    <div class="sync-details" v-if="showDetails">
      <div class="detail-item">
        <span class="label">Última sincronización:</span>
        <span class="value">{{ lastSyncTime || 'Nunca' }}</span>
      </div>
      <div class="detail-item">
        <span class="label">Estado actual:</span>
        <span class="value">{{ currentStatus?.status || 'Desconocido' }}</span>
      </div>
      <div class="detail-item">
        <span class="label">Session ID:</span>
        <span class="value">{{ sessionId || 'No disponible' }}</span>
      </div>
    </div>
  </div>
</template>

<script>
// Eliminar importación y uso de statusSyncService

export default {
  name: 'StatusSyncMonitor',
  data() {
    return {
      isSyncing: false,
      isConnected: false,
      lastSyncTime: null,
      currentStatus: null,
      sessionId: null,
      showDetails: false,
      syncInterval: null
    };
  },
  computed: {
    syncText() {
      if (this.isSyncing) {
        return 'Sincronizando...';
      } else if (this.isConnected) {
        return 'Conectado';
      } else {
        return 'Desconectado';
      }
    }
  },
  mounted() {
    this.startMonitoring();
    
    // Escuchar eventos de sincronización
    window.addEventListener('status-updated', this.handleStatusUpdate);
    
    // Alternar detalles al hacer clic
    this.$el.addEventListener('click', this.toggleDetails);
  },
  beforeUnmount() {
    this.stopMonitoring();
    window.removeEventListener('status-updated', this.handleStatusUpdate);
    this.$el.removeEventListener('click', this.toggleDetails);
  },
  methods: {
    startMonitoring() {
      // Actualizar estado cada 5 segundos
      this.syncInterval = setInterval(() => {
        this.updateSyncStatus();
      }, 5000);
      
      // Actualización inicial
      this.updateSyncStatus();
    },
    
    stopMonitoring() {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    },
    
    async updateSyncStatus() {
      try {
        // Verificar si el usuario está logueado
        if (!this.$store.state.isLoggedIn || !this.$store.state.user) {
          this.isConnected = false;
          this.currentStatus = null;
          return;
        }

        // Obtener estado actual del usuario desde el backend
        const response = await fetch('/api/user-status/my-status', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.status) {
            this.currentStatus = data.status;
            this.lastSyncTime = new Date();
            this.isConnected = true;
            this.sessionId = data.status.sessionId || 'Activo';
            
            // Actualizar el store con el estado actual
            this.$store.commit('setUserStatus', data.status);
          } else {
            this.isConnected = false;
            this.currentStatus = null;
          }
        } else {
          this.isConnected = false;
          this.currentStatus = null;
        }
      } catch (error) {
        console.error('Error actualizando estado de sincronización:', error);
        this.isConnected = false;
        this.currentStatus = null;
      }
    },
    
    handleStatusUpdate(event) {
      const { status } = event.detail;
      if (status) {
        this.currentStatus = status;
        this.lastSyncTime = new Date();
        this.isConnected = true;
      }
    },
    
    toggleDetails() {
      this.showDetails = !this.showDetails;
    }
  }
};
</script>

<style scoped>
.status-sync-monitor {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  z-index: 9999;
  transition: all 0.3s ease;
}

.status-sync-monitor:hover {
  background: rgba(0, 0, 0, 0.9);
}

.sync-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc3545;
  transition: all 0.3s ease;
}

.sync-dot.connected {
  background: #28a745;
}

.sync-dot.syncing {
  background: #ffc107;
  animation: pulse 1s infinite;
}

.sync-text {
  font-weight: 500;
}

.sync-details {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 11px;
}

.detail-item .label {
  color: rgba(255, 255, 255, 0.7);
}

.detail-item .value {
  font-weight: 500;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style> 