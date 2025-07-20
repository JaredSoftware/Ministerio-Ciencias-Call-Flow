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
          <!-- Estados agrupados por categorías -->
          <div class="status-categories">
            <div 
              v-for="category in categories" 
              :key="category" 
              class="status-category"
            >
              <h6 class="category-title">
                {{ getCategoryLabel(category) }}
                <small class="text-muted">{{ getCategoryDescription(category) }}</small>
              </h6>
              <div class="status-options">
                <div
                  v-for="status in statusesByCategory[category]"
                  :key="status.value"
                  class="status-option"
                  :class="{ active: currentStatus === status.value }"
                  @click="selectStatus(status.value)"
                >
                  <div class="status-color" :style="{ backgroundColor: status.color }"></div>
                  <span class="status-text">{{ status.label }}</span>
                  <i :class="status.icon" class="status-icon"></i>
                </div>
              </div>
            </div>
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
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script>
import websocketService from '@/services/websocketService';
import axios from '@/services/axios';
import { mapMutations } from 'vuex';
import statusTypesService from '@/services/statusTypes';

export default {
  name: 'UserStatusConfigurator',
  data() {
    return {
      showStatusModal: false,
      currentStatus: 'available',
      customStatus: '',
      currentStatusColor: '#00d25b',
      currentStatusLabel: 'Disponible',
      lastSeen: new Date(),
      isChangingStatus: false,
      showStatusAnimation: false,
      availableStatuses: [],
      statusesByCategory: {},
      categories: []
    };
  },
  mounted() {
    // No inicializar nada aquí, el watcher se encargará cuando el usuario esté logueado
    console.log('🎯 UserStatusConfigurator montado - Esperando autenticación...');
  },
  watch: {
    currentStatus(newStatus) {
      console.log('👀 Estado cambiado a:', newStatus);
      // Actualizar colores y labels cuando cambie el estado
      let selectedStatus = statusTypesService.getStatusByValue(newStatus);
      
      // Si no se encuentra en el servicio, buscar en los estados locales
      if (!selectedStatus) {
        selectedStatus = this.availableStatuses.find(s => s.value === newStatus);
      }
      
      if (selectedStatus) {
        this.currentStatusColor = selectedStatus.color;
        this.currentStatusLabel = selectedStatus.label;
      }
    },
    // Watcher para detectar cuando el usuario se loguee
    '$store.state.isLoggedIn': {
      handler(newValue) {
        if (newValue) {
          console.log('🔐 Usuario logueado detectado - Inicializando sistema de estados...');
          // Usar setTimeout para asegurar que el store esté completamente actualizado
          setTimeout(async () => {
            await this.loadCurrentStatus();
            // Asignar estado por defecto si no hay estado actual
            if (!this.currentStatus || this.currentStatus === 'online') {
              await this.assignDefaultStatus();
            }
          }, 100);
        } else {
          console.log('🚪 Usuario deslogueado - Limpiando sistema de estados...');
          websocketService.disconnect();
          // Limpiar estados
          this.availableStatuses = [];
          this.statusesByCategory = {};
          this.categories = [];
        }
      },
      immediate: true
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
    },
    
    async loadDynamicStatuses() {
      try {
        console.log('🔄 Cargando estados dinámicos...');
        
        // Inicializar el servicio de tipos de estado
        await statusTypesService.initialize();
        
        // Cargar todos los estados
        this.availableStatuses = await statusTypesService.loadStatuses();
        console.log('📊 Estados cargados:', this.availableStatuses);
        
        // Cargar categorías
        this.categories = await statusTypesService.loadCategories();
        console.log('📊 Categorías cargadas:', this.categories);
        
        // Agrupar estados por categoría
        this.statusesByCategory = statusTypesService.getStatusesGroupedByCategory();
        console.log('📊 Estados agrupados:', this.statusesByCategory);
        
        console.log('✅ Estados dinámicos cargados:', {
          total: this.availableStatuses.length,
          categories: this.categories,
          grouped: this.statusesByCategory
        });
        
        // Forzar actualización del componente
        this.$forceUpdate();
        
      } catch (error) {
        console.error('❌ Error cargando estados dinámicos:', error);
        
        // Estados de fallback si no se pueden cargar desde el servidor
        console.log('🔄 Usando estados de fallback...');
        this.availableStatuses = [
          { value: 'available', label: 'Disponible', color: '#00d25b', category: 'work', icon: 'fas fa-circle' },
          { value: 'busy', label: 'Ocupado', color: '#2196f3', category: 'work', icon: 'fas fa-clock' },
          { value: 'on_call', label: 'En llamada', color: '#1976d2', category: 'work', icon: 'fas fa-phone' },
          { value: 'break', label: 'Descanso', color: '#ff9800', category: 'break', icon: 'fas fa-coffee' },
          { value: 'lunch', label: 'Almuerzo', color: '#ff5722', category: 'break', icon: 'fas fa-utensils' },
          { value: 'meeting', label: 'En reunión', color: '#ffa726', category: 'break', icon: 'fas fa-users' },
          { value: 'away', label: 'Ausente', color: '#f44336', category: 'out', icon: 'fas fa-user-clock' },
          { value: 'offline', label: 'Desconectado', color: '#6c757d', category: 'out', icon: 'fas fa-times-circle' }
        ];
        
        this.categories = ['work', 'break', 'out'];
        
        // Agrupar estados por categoría
        this.statusesByCategory = {
          work: this.availableStatuses.filter(s => s.category === 'work'),
          break: this.availableStatuses.filter(s => s.category === 'break'),
          out: this.availableStatuses.filter(s => s.category === 'out')
        };
        
        console.log('✅ Estados de fallback cargados');
        this.$forceUpdate();
      }
    },
    
    loadFallbackStatuses() {
      console.log('🔄 Cargando estados de fallback...');
      this.availableStatuses = [
        { value: 'available', label: 'Disponible', color: '#00d25b', category: 'work', icon: 'fas fa-circle' },
        { value: 'busy', label: 'Ocupado', color: '#2196f3', category: 'work', icon: 'fas fa-clock' },
        { value: 'on_call', label: 'En llamada', color: '#1976d2', category: 'work', icon: 'fas fa-phone' },
        { value: 'break', label: 'Descanso', color: '#ff9800', category: 'break', icon: 'fas fa-coffee' },
        { value: 'lunch', label: 'Almuerzo', color: '#ff5722', category: 'break', icon: 'fas fa-utensils' },
        { value: 'meeting', label: 'En reunión', color: '#ffa726', category: 'break', icon: 'fas fa-users' },
        { value: 'away', label: 'Ausente', color: '#f44336', category: 'out', icon: 'fas fa-user-clock' },
        { value: 'offline', label: 'Desconectado', color: '#6c757d', category: 'out', icon: 'fas fa-times-circle' }
      ];
      
      this.categories = ['work', 'break', 'out'];
      
      // Agrupar estados por categoría
      this.statusesByCategory = {
        work: this.availableStatuses.filter(s => s.category === 'work'),
        break: this.availableStatuses.filter(s => s.category === 'break'),
        out: this.availableStatuses.filter(s => s.category === 'out')
      };
      
      console.log('✅ Estados de fallback cargados');
      this.$forceUpdate();
    },
    
    getCategoryLabel(category) {
      const labels = {
        'work': 'Trabajo',
        'break': 'Descanso',
        'out': 'Fuera'
      };
      return labels[category] || category;
    },
    
    getCategoryDescription(category) {
      const descriptions = {
        'work': 'Sí se puede asignar trabajo',
        'break': 'No se debe asignar trabajo',
        'out': 'Conectado pero no trabajando'
      };
      return descriptions[category] || '';
    },
    
    async loadCurrentStatus() {
      try {
        // Verificar que el usuario esté logueado en el store
        if (!this.$store.state.isLoggedIn) {
          console.log('🚪 Usuario no logueado en store, esperando...');
          return;
        }
        
        console.log('✅ Usuario logueado en store - Inicializando...');
        
        // Cargar estados dinámicos primero
        await this.loadDynamicStatuses();
        
        // Luego inicializar WebSocket
        this.initializeWebSocket();
        
        // Finalmente cargar estado actual
        const response = await axios.get('/user-status/my-status', {
          withCredentials: true
        });
        if (response.data.success && response.data.status) {
          this.updateOwnStatus(response.data.status);
        }
      } catch (error) {
        console.error('Error cargando estado:', error);
        // Si hay error, usar estados de fallback
        console.log('🔄 Usando estados de fallback debido a error...');
        this.loadFallbackStatuses();
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
        
        // Pequeño delay para asegurar que la sesión esté sincronizada
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Cambiar estado a través de WebSocket solo si está conectado
        if (websocketService.isConnected) {
          websocketService.changeStatus(status, customStatus);
        } else {
          console.log('⚠️ WebSocket no conectado, solo usando API REST');
        }
        
        // También cambiar a través de API REST
        const response = await axios.post('/user-status/change-status', {
          status,
          customStatus
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
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
          
          // Emitir evento personalizado para que otros componentes lo detecten
          this.$root.$emit('status-changed', { status: status });
          
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
      
      if (data && data.status) {
        this.currentStatus = data.status;
        
        // Usar el servicio de tipos de estado para obtener información
        const selectedStatus = statusTypesService.getStatusByValue(data.status);
        if (selectedStatus) {
          this.currentStatusColor = selectedStatus.color;
          this.currentStatusLabel = selectedStatus.label;
        } else {
          // Si no se encuentra, usar valores por defecto
          this.currentStatusColor = data.color || '#28a745';
          this.currentStatusLabel = data.label || 'Conectado';
        }
        
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
      }
    },
    
    triggerStatusAnimation() {
      this.showStatusAnimation = true;
      setTimeout(() => {
        this.showStatusAnimation = false;
      }, 500);
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
    },
    
    // Método para asignar estado por defecto
    async assignDefaultStatus() {
      try {
        console.log('🔄 Asignando estado por defecto...');
        
        // Obtener estado por defecto del servicio
        const defaultStatus = await statusTypesService.getDefaultStatus();
        const statusToAssign = defaultStatus ? defaultStatus.value : 'available';
        
        console.log(`   - Estado por defecto encontrado: ${statusToAssign}`);
        
        // Cambiar al estado por defecto
        await this.changeStatus(statusToAssign);
        
        console.log('✅ Estado por defecto asignado exitosamente');
      } catch (error) {
        console.error('❌ Error asignando estado por defecto:', error);
        // Fallback a 'available' si hay error
        try {
          await this.changeStatus('available');
          console.log('✅ Estado por defecto asignado con fallback');
        } catch (fallbackError) {
          console.error('❌ Error en fallback:', fallbackError);
        }
      }
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

.status-categories {
  margin-bottom: 1.5rem;
}

.status-category {
  margin-bottom: 1.5rem;
}

.category-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #eee;
}

.category-title small {
  font-weight: 400;
  margin-left: 0.5rem;
}

.status-options {
  margin-bottom: 1rem;
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

.status-icon {
  margin-left: auto;
  font-size: 0.9rem;
  color: #666;
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