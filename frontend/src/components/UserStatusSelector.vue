<template>
  <div class="user-status-selector">
    <!-- Estado actual del usuario - Versión simplificada -->
    <div class="current-status-simple" @click="showStatusModal = true">
      <div class="status-dot" :style="{ backgroundColor: currentStatusColor }"></div>
      <span class="status-text">{{ currentStatusLabel }}</span>
      <i class="fas fa-chevron-down"></i>
    </div>

    <!-- Modal para cambiar estado -->
    <div v-if="showStatusModal" class="status-modal-overlay" @click="showStatusModal = false">
      <div class="status-modal" @click.stop>
        <div class="modal-header">
          <h5>Cambiar Estado</h5>
          <button class="close-btn" @click="showStatusModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <!-- Estados predefinidos -->
          <div class="status-options">
            <div
              v-for="status in availableStatuses"
              :key="status.value"
              class="status-option"
              :class="{ active: currentStatus === status.value }"
              @click="changeStatus(status.value)"
            >
              <div class="status-color" :style="{ backgroundColor: status.color }"></div>
              <span class="status-text">{{ status.label }}</span>
            </div>
          </div>
          
          <!-- Estado personalizado -->
          <div class="custom-status-section">
            <label>Estado personalizado:</label>
            <input
              v-model="customStatus"
              type="text"
              placeholder="Escribe tu estado personalizado..."
              maxlength="100"
              class="form-control"
            />
            <button
              @click="changeStatus(currentStatus, customStatus)"
              class="btn btn-primary btn-sm mt-2"
              :disabled="!customStatus.trim()"
            >
              Aplicar Estado Personalizado
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de usuarios activos - Versión simplificada -->
    <div class="active-users-section">
      <h6 class="section-title">
        <i class="fas fa-users"></i>
        Usuarios Activos ({{ activeUsers.length }})
      </h6>
      
      <div class="users-list">
        <div
          v-for="user in activeUsers"
          :key="user.userId"
          class="user-item-simple"
          :class="{ 'current-user': user.userId === currentUserId }"
        >
          <div class="user-avatar-simple">
            <div class="status-dot-small" :style="{ backgroundColor: user.color }"></div>
          </div>
          <div class="user-info-simple">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-status">{{ user.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Debug info -->
    <div class="debug-info" v-if="debug">
      <small>Debug: {{ currentStatus }} - {{ activeUsers.length }} usuarios</small>
    </div>
  </div>
</template>

<script>
import websocketService from '@/services/websocketService';

export default {
  name: 'UserStatusSelector',
  data() {
    return {
      showStatusModal: false,
      currentStatus: 'online',
      customStatus: '',
      currentStatusColor: '#28a745',
      currentStatusLabel: 'En línea',
      lastSeen: new Date(),
      activeUsers: [],
      currentUserId: null,
      debug: true, // Habilitar debug
      availableStatuses: [
        { value: 'online', label: 'En línea', color: '#28a745' },
        { value: 'busy', label: 'Ocupado', color: '#dc3545' },
        { value: 'away', label: 'Ausente', color: '#ffc107' },
        { value: 'break', label: 'En descanso', color: '#fd7e14' },
        { value: 'meeting', label: 'En reunión', color: '#6f42c1' },
        { value: 'lunch', label: 'Almuerzo', color: '#e83e8c' },
        { value: 'vacation', label: 'Vacaciones', color: '#17a2b8' },
        { value: 'sick', label: 'Enfermo', color: '#6c757d' }
      ]
    };
  },
  computed: {
    lastSeenText() {
      const now = new Date();
      const diff = now - this.lastSeen;
      const minutes = Math.floor(diff / 60000);
      
      if (minutes < 1) return 'Ahora';
      if (minutes < 60) return `Hace ${minutes} min`;
      
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `Hace ${hours}h`;
      
      const days = Math.floor(hours / 24);
      return `Hace ${days}d`;
    }
  },
  mounted() {
    console.log('UserStatusSelector mounted');
    // NO inicializar WebSocket automáticamente
    // Solo cargar datos si están disponibles
    this.loadCurrentStatus();
    this.loadActiveUsers();
  },
  beforeUnmount() {
    // El servicio se encarga de la desconexión
  },
  methods: {
    initializeWebSocket() {
      try {
        console.log('🔄 Inicializando WebSocket...');
        
        // NO conectar automáticamente - solo suscribirse a eventos
        // websocketService.connect(); // COMENTADO - NO CONECTAR AUTOMÁTICAMENTE
        
        // Suscribirse a eventos
        websocketService.on('userStatusChanged', (data) => {
          console.log('Estado de usuario cambiado:', data);
          this.updateUserStatus(data);
        });
        
        websocketService.on('ownStatusChanged', (data) => {
          console.log('Mi estado cambió:', data);
          this.updateOwnStatus(data);
        });
        
        websocketService.on('activeUsersList', (users) => {
          console.log('Usuarios activos:', users);
          this.activeUsers = users;
        });
        
        websocketService.on('statusChangeError', (error) => {
          console.error('Error cambiando estado:', error);
        });
        
        // Actualizar actividad periódicamente
        setInterval(() => {
          websocketService.updateActivity();
        }, 30000); // Cada 30 segundos
        
      } catch (error) {
        console.error('❌ Error inicializando WebSocket:', error);
      }
    },
    
    async loadCurrentStatus() {
      try {
        console.log('Cargando estado actual...');
        const response = await fetch('/api/user-status/my-status', {
          credentials: 'include'
        });
        const data = await response.json();
        console.log('Respuesta estado:', data);
        
        if (data.success && data.status) {
          this.updateOwnStatus(data.status);
        }
      } catch (error) {
        console.error('Error cargando estado:', error);
      }
    },
    
    async loadActiveUsers() {
      try {
        console.log('Cargando usuarios activos...');
        const response = await fetch('/api/user-status/active-users', {
          credentials: 'include'
        });
        const data = await response.json();
        console.log('Respuesta usuarios:', data);
        
        if (data.success) {
          this.activeUsers = data.users;
        }
      } catch (error) {
        console.error('Error cargando usuarios activos:', error);
      }
    },
    
    async changeStatus(status, customStatus = null) {
      try {
        console.log('🔄 Cambiando estado a:', status, customStatus);
        
        // Usar el servicio WebSocket para cambiar estado
        websocketService.changeStatus(status, customStatus);
        
        // Actualizar estado local
        this.currentStatus = status;
        this.customStatus = customStatus || '';
        this.showStatusModal = false;
        
        // También hacer la llamada HTTP como respaldo
        const response = await fetch('/api/user-status/change-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            status,
            customStatus
          })
        });
        
        const data = await response.json();
        console.log('Respuesta cambio estado:', data);
        
      } catch (error) {
        console.error('❌ Error cambiando estado:', error);
      }
    },
    
    updateOwnStatus(data) {
      this.currentStatus = data.status;
      this.currentStatusColor = data.color;
      this.currentStatusLabel = data.label;
      this.lastSeen = new Date(data.lastSeen);
      this.currentUserId = data.userId;
    },
    
    updateUserStatus(data) {
      const userIndex = this.activeUsers.findIndex(user => user.userId === data.userId);
      
      if (userIndex !== -1) {
        this.activeUsers[userIndex] = {
          ...this.activeUsers[userIndex],
          status: data.status,
          customStatus: data.customStatus,
          color: data.color,
          label: data.label,
          lastSeen: data.lastSeen
        };
      }
    },
    
    getUserAvatar(user) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=40`;
    }
  }
};
</script>

<style scoped>
.user-status-selector {
  padding: 0.5rem;
  background: transparent;
  border-radius: 8px;
  margin: 0;
}

/* Estado actual simplificado */
.current-status-simple {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
  border: 2px solid transparent;
}

.current-status-simple:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.status-text {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  flex: 1;
}

/* Modal */
.status-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.status-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.modal-header h5 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1rem;
}

.status-options {
  margin-bottom: 1.5rem;
}

.status-option {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
}

.status-option:hover {
  background: #f8f9fa;
}

.status-option.active {
  background: #e3f2fd;
  border: 2px solid #2196f3;
}

.status-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.custom-status-section {
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.custom-status-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

/* Usuarios activos simplificados */
.active-users-section {
  margin-top: 1rem;
}

.section-title {
  color: #333;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
}

.section-title i {
  margin-right: 0.5rem;
}

.users-list {
  max-height: 200px;
  overflow-y: auto;
}

.user-item-simple {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.25rem;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.user-item-simple:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-item-simple.current-user {
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.user-avatar-simple {
  position: relative;
  margin-right: 0.5rem;
}

.status-dot-small {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.user-info-simple {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #333;
  font-size: 0.8rem;
}

.user-status {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.6);
}

/* Debug info */
.debug-info {
  margin-top: 0.5rem;
  padding: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  text-align: center;
}

.debug-info small {
  color: rgba(0, 0, 0, 0.7);
  font-size: 0.7rem;
}
</style> 