<template>
  <div class="user-status-configurator">
    <!-- Estado actual del usuario - Versión compacta -->
    <div 
      class="current-status-compact" 
      :class="{ 'status-changed': showStatusAnimation }"
      @click="showStatusModal = true"
    >
      <div class="status-dot" :style="{ backgroundColor: currentStatusColor }"></div>
      <span class="status-text">{{ currentStatusLabel }}</span>
      <i class="fas fa-chevron-down"></i>
      <div class="status-indicator" v-if="currentStatus !== 'online'">
        <i class="fas fa-circle" :style="{ color: currentStatusColor }"></i>
      </div>
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
              @click="selectStatus(status.value)"
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
          
          <!-- Botones de acción -->
          <div class="modal-actions mt-3 d-flex gap-2">
            <button
              @click="showStatusModal = false"
              class="btn btn-secondary flex-fill"
              :disabled="isChangingStatus"
            >
              Cancelar
            </button>
            <button
              @click="changeStatus(currentStatus, customStatus)"
              class="btn btn-success flex-fill"
              :disabled="isChangingStatus"
            >
              <i v-if="!isChangingStatus" class="fas fa-check me-2"></i>
              <i v-else class="fas fa-spinner fa-spin me-2"></i>
              {{ isChangingStatus ? 'Cambiando...' : 'Aplicar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de usuarios activos - Versión compacta -->
    <div class="active-users-compact">
      <div class="users-count">
        <i class="fas fa-users"></i>
        <span>{{ activeUsers.length }} usuarios activos</span>
      </div>
      
      <div class="users-list-compact">
        <div
          v-for="user in activeUsers.slice(0, 3)"
          :key="user._id"
          class="user-item-compact"
          :class="{ 'current-user': user.userId === currentUserId }"
        >
          <div class="status-dot-small" :style="{ backgroundColor: user.color }"></div>
          <span class="user-name">{{ user.userId?.name || 'Usuario' }}</span>
        </div>
        <div v-if="activeUsers.length > 3" class="more-users">
          +{{ activeUsers.length - 3 }} más
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import websocketService from '@/services/websocketService';
import axios from '@/services/axios';
import { mapMutations } from 'vuex';

export default {
  name: 'UserStatusConfigurator',
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
      isChangingStatus: false,
      showStatusAnimation: false,
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
  mounted() {
    this.initializeWebSocket();
    this.loadCurrentStatus();
    this.loadActiveUsers();
  },
  watch: {
    currentStatus(newStatus) {
      console.log('👀 Estado cambiado a:', newStatus);
      // Actualizar colores y labels cuando cambie el estado
      const selectedStatus = this.availableStatuses.find(s => s.value === newStatus);
      if (selectedStatus) {
        this.currentStatusColor = selectedStatus.color;
        this.currentStatusLabel = selectedStatus.label;
      }
    }
  },
  beforeUnmount() {
    // Limpiar suscripciones
    websocketService.emit('own_status_changed', null);
    websocketService.emit('user_status_changed', null);
    websocketService.emit('active_users_list', null);
  },
  methods: {
    ...mapMutations(['setUserStatus', 'updateUserStatus']),
    initializeWebSocket() {
      console.log('🔌 Inicializando WebSocket en UserStatusConfigurator...');
      
      // Suscribirse a eventos de WebSocket
      websocketService.on('own_status_changed', (data) => {
        console.log('📡 Evento own_status_changed recibido en UserStatusConfigurator:', data);
        this.updateOwnStatus(data);
      });
      websocketService.on('user_status_changed', this.updateUserStatus);
      websocketService.on('active_users_list', this.updateActiveUsersList);
      
      // Solicitar lista de usuarios activos
      websocketService.socket?.emit('get_active_users');
    },
    
    async loadCurrentStatus() {
      try {
        const response = await axios.get('/user-status/my-status');
        if (response.data.success && response.data.status) {
          this.updateOwnStatus(response.data.status);
        }
      } catch (error) {
        console.error('Error cargando estado:', error);
      }
    },
    
    async loadActiveUsers() {
      try {
        const response = await axios.get('/user-status/active-users');
        if (response.data.success) {
          this.activeUsers = response.data.users;
        }
      } catch (error) {
        console.error('Error cargando usuarios activos:', error);
      }
    },
    
    selectStatus(status) {
      this.currentStatus = status;
      console.log('📝 Estado seleccionado:', status);
      
      // Actualizar store inmediatamente cuando se selecciona un estado
      this.$store.commit('setUserStatus', {
        status: status,
        customStatus: null,
        lastActivity: new Date().toISOString()
      });
      
      // También usar la mutación del mapMutations
      this.setUserStatus({
        status: status,
        customStatus: null,
        lastActivity: new Date().toISOString()
      });
      
      // Forzar actualización del estado visual
      const selectedStatus = this.availableStatuses.find(s => s.value === status);
      if (selectedStatus) {
        this.currentStatusColor = selectedStatus.color;
        this.currentStatusLabel = selectedStatus.label;
      }
      
      console.log('✅ Store actualizado al seleccionar estado:', status);
    },
    
    async changeStatus(status, customStatus = null) {
      if (this.isChangingStatus) return; // Evitar múltiples cambios simultáneos
      
      this.isChangingStatus = true;
      try {
        console.log('🔄 Cambiando estado a:', status, customStatus);
        
        // Cambiar estado a través de WebSocket
        websocketService.changeStatus(status, customStatus);
        
        // También cambiar a través de API REST
        const response = await axios.post('/user-status/change-status', {
          status,
          customStatus
        });
        
        if (response.data.success) {
          console.log('✅ Estado cambiado exitosamente');
          
          // Actualizar el estado visual inmediatamente
          const selectedStatus = this.availableStatuses.find(s => s.value === status);
          if (selectedStatus) {
            this.currentStatusColor = selectedStatus.color;
            this.currentStatusLabel = selectedStatus.label;
          }
          
          this.currentStatus = status;
          this.customStatus = customStatus || '';
          this.showStatusModal = false;
          
          // Actualizar el store de Vuex inmediatamente
          this.setUserStatus({
            status: status,
            customStatus: customStatus,
            lastActivity: new Date().toISOString()
          });
          
          // Forzar actualización del store para que otros componentes lo detecten
          this.$store.commit('setUserStatus', {
            status: status,
            customStatus: customStatus,
            lastActivity: new Date().toISOString()
          });
          
          console.log('✅ Store actualizado con nuevo estado:', status);
          
          // Notificar cambio a otros componentes
          // this.notifyStatusChange(status);
          
          // Activar animación
          this.triggerStatusAnimation();
          
          // Forzar actualización del componente
          this.$forceUpdate();
          console.log('✅ Estado visual actualizado:', this.currentStatusLabel);
        } else {
          console.error('❌ Error en respuesta del servidor:', response.data);
          alert('Error: ' + (response.data.message || 'Error desconocido'));
        }
      } catch (error) {
        console.error('❌ Error cambiando estado:', error);
        alert('Error cambiando estado: ' + error.message);
      } finally {
        this.isChangingStatus = false;
      }
    },
    
    updateOwnStatus(data) {
      console.log('🔄 Actualizando estado propio:', data);
      this.currentStatus = data.status;
      this.currentStatusColor = data.color;
      this.currentStatusLabel = data.label;
      this.lastSeen = new Date(data.lastSeen);
      this.currentUserId = data.userId;
      
      // Actualizar el store de Vuex
      this.setUserStatus({
        status: data.status,
        customStatus: data.customStatus,
        lastActivity: data.lastSeen
      });
      
      // Activar animación
      this.triggerStatusAnimation();
      
      // Forzar actualización del componente
      this.$forceUpdate();
      console.log('✅ Estado actualizado visualmente:', this.currentStatusLabel);
    },
    
    triggerStatusAnimation() {
      this.showStatusAnimation = true;
      setTimeout(() => {
        this.showStatusAnimation = false;
      }, 500);
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
    
    updateActiveUsersList(users) {
      this.activeUsers = users;
    },
    
    // Método para forzar actualización del estado en otros componentes
    forceStatusUpdate(status) {
      console.log('🔄 Forzando actualización de estado:', status);
      
      // Actualizar store directamente
      this.$store.commit('setUserStatus', {
        status: status,
        customStatus: null,
        lastActivity: new Date().toISOString()
      });
      
      // Emitir evento personalizado
      this.$emit('status-changed', { status });
      
      console.log('✅ Estado forzado actualizado');
    }
  }
};
</script>

<style scoped>
.user-status-configurator {
  padding: 0.5rem;
}

/* Estado actual compacto */
.current-status-compact {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
}

.current-status-compact.status-changed {
  animation: statusPulse 0.5s ease-in-out;
}

.current-status-compact:hover {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.2);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.status-text {
  font-weight: 600;
  color: #333;
  font-size: 0.85rem;
  flex: 1;
}

.status-indicator {
  margin-left: auto;
  font-size: 0.8rem;
}

/* Usuarios activos compactos */
.active-users-compact {
  margin-top: 0.75rem;
}

.users-count {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.users-count i {
  margin-right: 0.5rem;
  color: #28a745;
}

.users-list-compact {
  max-height: 120px;
  overflow-y: auto;
}

.user-item-compact {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.25rem;
  background: rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
}

.user-item-compact:hover {
  background: rgba(0, 0, 0, 0.05);
}

.user-item-compact.current-user {
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid rgba(40, 167, 69, 0.2);
}

.status-dot-small {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.user-name {
  font-size: 0.75rem;
  color: #333;
  font-weight: 500;
}

@keyframes statusPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); box-shadow: 0 0 10px rgba(40, 167, 69, 0.3); }
  100% { transform: scale(1); }
}

.more-users {
  font-size: 0.7rem;
  color: #666;
  text-align: center;
  padding: 0.25rem;
  font-style: italic;
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
  background: #d4edda;
  border: 2px solid #28a745;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
</style> 