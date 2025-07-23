<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="card mb-4">
          <div class="card-header pb-0">
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-3">
              <h6>👥 Usuarios Activos y Estados</h6>
                <div class="d-flex align-items-center gap-2">
                  <span 
                    class="badge"
                    :class="usingMQTT ? 'bg-success' : 'bg-warning'"
                    title="Estado de MQTT"
                  >
                    <i :class="usingMQTT ? 'fas fa-wifi' : 'fas fa-exclamation-triangle'"></i>
                    {{ usingMQTT ? 'MQTT Activo' : 'MQTT Inactivo' }}
                  </span>
                  <span class="badge bg-info">
                    <i class="fas fa-users"></i>
                    {{ users.length }} usuarios
                  </span>
                </div>
              </div>
              <div class="d-flex gap-2">
                <button @click="refreshUsers" class="btn btn-sm btn-primary">
                  <i class="fas fa-sync-alt"></i> Actualizar
                </button>
                <button @click="exportToCSV" class="btn btn-sm btn-success">
                  <i class="fas fa-download"></i> Exportar CSV
                </button>
              </div>
            </div>
          </div>
          <div class="card-body px-0 pt-0 pb-2">
            <!-- Filtros -->
            <div class="row mx-3 mb-3">
              <div class="col-md-3">
                <label class="form-label">Filtrar por Estado</label>
                <select v-model="statusFilter" class="form-select">
                  <option value="">Todos los estados</option>
                  <option v-for="status in availableStatuses" :key="status.value" :value="status.value">
                    {{ status.label }}
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Buscar Usuario</label>
                <input 
                  v-model="searchTerm" 
                  type="text" 
                  class="form-control" 
                  placeholder="Nombre o email..."
                >
              </div>
              <div class="col-md-3">
                <label class="form-label">Ordenar por</label>
                <select v-model="sortBy" class="form-select">
                  <option value="lastActivity">Última Actividad</option>
                  <option value="name">Nombre</option>
                  <option value="status">Estado</option>
                  <option value="role">Rol</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Mostrar</label>
                <select v-model="showOnly" class="form-select">
                  <option value="all">Todos los usuarios</option>
                  <option value="online">Solo conectados</option>
                  <option value="offline">Solo desconectados</option>
                </select>
              </div>
            </div>

            <!-- Estadísticas -->
            <div class="row mx-3 mb-3">
              <div class="col-md-3">
                <div class="card bg-gradient-primary text-white">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <h6 class="mb-0">Total Usuarios</h6>
                        <h4 class="mb-0">{{ filteredUsers.length }}</h4>
                      </div>
                      <div class="align-self-center">
                        <i class="fas fa-users fa-2x opacity-7"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-gradient-success text-white">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <h6 class="mb-0">Conectados</h6>
                        <h4 class="mb-0">{{ onlineUsers.length }}</h4>
                      </div>
                      <div class="align-self-center">
                        <i class="fas fa-circle fa-2x opacity-7"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-gradient-warning text-white">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <h6 class="mb-0">En Trabajo</h6>
                        <h4 class="mb-0">{{ workingUsers.length }}</h4>
                      </div>
                      <div class="align-self-center">
                        <i class="fas fa-briefcase fa-2x opacity-7"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-gradient-info text-white">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <h6 class="mb-0">En Descanso</h6>
                        <h4 class="mb-0">{{ breakUsers.length }}</h4>
                      </div>
                      <div class="align-self-center">
                        <i class="fas fa-coffee fa-2x opacity-7"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tabla de Usuarios -->
            <div class="table-responsive p-0">
              <table class="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                      Usuario
                    </th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                      Estado
                    </th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                      Rol
                    </th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                      Última Actividad
                    </th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                      Tiempo Conectado
                    </th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in paginatedUsers" :key="user._id">
                    <td>
                      <div class="d-flex px-2 py-1">
                        <div>
                          <img 
                            :src="user.avatar || '/img/default-avatar.png'" 
                            class="avatar avatar-sm me-3"
                            alt="user avatar"
                          >
                        </div>
                        <div class="d-flex flex-column justify-content-center">
                          <h6 class="mb-0 text-sm">{{ user.name }}</h6>
                          <p class="text-xs text-secondary mb-0">{{ user.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex align-items-center">
                        <span 
                          class="badge badge-sm me-2"
                          :style="{ backgroundColor: getStatusColor(user.status) }"
                        >
                          <i :class="getStatusIcon(user.status)" class="me-1"></i>
                          {{ getStatusLabel(user.status) }}
                        </span>
                        <small v-if="user.customStatus" class="text-muted">
                          {{ user.customStatus }}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-sm bg-gradient-secondary">
                        {{ roleMap[user.userId?.role?._id] || user.userId?.role?.nombre || 'N/A' }}
                      </span>
                    </td>
                    <td>
                      <div class="d-flex flex-column">
                        <span class="text-xs font-weight-bold">
                          {{ formatDate(user.lastActivity) }}
                        </span>
                        <span class="text-xs text-secondary">
                          {{ getTimeAgo(user.lastActivity) }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span class="text-xs font-weight-bold">
                        {{ getConnectionTime(user.lastActivity) }}
                      </span>
                    </td>
                    <td>
                      <div class="btn-group" role="group">
                        <button 
                          @click="viewUserDetails(user)" 
                          class="btn btn-sm btn-outline-primary"
                          title="Ver detalles"
                        >
                          <i class="fas fa-eye"></i>
                        </button>
                        <button 
                          @click="sendMessage(user)" 
                          class="btn btn-sm btn-outline-success"
                          title="Enviar mensaje"
                        >
                          <i class="fas fa-comment"></i>
                        </button>
                        <button 
                          @click="changeUserStatus(user)" 
                          class="btn btn-sm btn-outline-warning"
                          title="Cambiar estado"
                        >
                          <i class="fas fa-edit"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Paginación -->
            <div class="d-flex justify-content-between align-items-center mx-3 mt-3">
              <div>
                <span class="text-sm text-secondary">
                  Mostrando {{ startIndex + 1 }} - {{ endIndex }} de {{ filteredUsers.length }} usuarios
                </span>
              </div>
              <nav>
                <ul class="pagination pagination-sm">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">
                      Anterior
                    </a>
                  </li>
                  <li 
                    v-for="page in visiblePages" 
                    :key="page" 
                    class="page-item"
                    :class="{ active: page === currentPage }"
                  >
                    <a class="page-link" href="#" @click.prevent="changePage(page)">
                      {{ page }}
                    </a>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">
                      Siguiente
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🚨 SECCIÓN DE EVENTOS EN TIEMPO REAL -->
    <div class="row mt-4" v-if="usingMQTT">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <h6>🚨 Eventos en Tiempo Real (MQTT)</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Usuario</th>
                    <th>Evento</th>
                    <th>Rol</th>
                    <th>Estado Anterior</th>
                    <th>Estado Nuevo</th>
                    <th>Color</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="event in realTimeEvents" :key="event.id">
                    <td>{{ formatTime(event.timestamp) }}</td>
                    <td>{{ event.userName }}</td>
                    <td>
                      <span class="badge" :class="getEventBadgeClass(event.type)">
                        {{ getEventLabel(event.type) }}
                      </span>
                    </td>
                    <td>{{ roleMap[event.role] || event.role || 'N/A' }}</td>
                    <td>{{ event.previousStatus || 'N/A' }}</td>
                    <td>{{ event.newStatus || 'N/A' }}</td>
                    <td>
                      <div 
                        class="status-dot-sm" 
                        :style="{ backgroundColor: event.newColor || '#6c757d' }"
                      ></div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Detalles del Usuario -->
    <div class="modal fade" id="userDetailsModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalles del Usuario</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="selectedUser">
            <div class="row">
              <div class="col-md-6">
                <h6>Información Personal</h6>
                <p><strong>Nombre:</strong> {{ selectedUser.name }}</p>
                <p><strong>Email:</strong> {{ selectedUser.email }}</p>
                <p><strong>Rol:</strong> {{ roleMap[selectedUser.userId?.role?._id] || selectedUser.userId?.role?.nombre || 'N/A' }}</p>
                <p><strong>Estado:</strong> {{ getStatusLabel(selectedUser.status) }}</p>
              </div>
              <div class="col-md-6">
                <h6>Actividad</h6>
                <p><strong>Última Actividad:</strong> {{ formatDate(selectedUser.lastActivity) }}</p>
                <p><strong>Tiempo Conectado:</strong> {{ getConnectionTime(selectedUser.lastActivity) }}</p>
                <p><strong>IP:</strong> {{ selectedUser.ipAddress || 'N/A' }}</p>
                <p><strong>Sesión ID:</strong> {{ selectedUser.sessionId || 'N/A' }}</p>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-12">
                <h6>Historial de Estados</h6>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Duración</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(history, index) in selectedUser.statusHistory || []" :key="index">
                        <td>
                          <span 
                            class="badge badge-sm"
                            :style="{ backgroundColor: getStatusColor(history.status) }"
                          >
                            {{ getStatusLabel(history.status) }}
                          </span>
                        </td>
                        <td>{{ formatDate(history.timestamp) }}</td>
                        <td>{{ history.duration || 'N/A' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '@/services/axios';
import { Modal } from 'bootstrap';
import { connectMQTT } from '@/services/mqttService';

export default {
  name: 'ActiveUsers',
  data() {
    return {
      users: [],
      availableStatuses: [],
      loading: false,
      searchTerm: '',
      statusFilter: '',
      sortBy: 'lastActivity',
      showOnly: 'all',
      currentPage: 1,
      itemsPerPage: 10,
      selectedUser: null,
      refreshInterval: null,
      usingMQTT: false,
      realTimeEvents: [],
      eventCounter: 0,
      mqttClient: null,
      mqttService: null,
      activeUsers: [],
      mqttReady: false,
      mqttConnected: false,
      roleMap: {}, // Mapeo de ID de rol a nombre legible
    };
  },
  computed: {
    filteredUsers() {
      let filtered = this.users;

      // Filtrar por búsqueda
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        filtered = filtered.filter(user => 
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
        );
      }

      // Filtrar por estado
      if (this.statusFilter) {
        filtered = filtered.filter(user => user.status === this.statusFilter);
      }

      // Filtrar por conexión
      if (this.showOnly === 'online') {
        filtered = filtered.filter(user => user.isOnline);
      } else if (this.showOnly === 'offline') {
        filtered = filtered.filter(user => !user.isOnline);
      }

      // Ordenar
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'status':
            return a.status.localeCompare(b.status);
          case 'role':
            return a.role.localeCompare(b.role);
          case 'lastActivity':
          default:
            return new Date(b.lastActivity) - new Date(a.lastActivity);
        }
      });

      return filtered;
    },
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredUsers.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    },
    startIndex() {
      return (this.currentPage - 1) * this.itemsPerPage;
    },
    endIndex() {
      return Math.min(this.startIndex + this.itemsPerPage, this.filteredUsers.length);
    },
    visiblePages() {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(this.totalPages, start + maxVisible - 1);
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    },
    onlineUsers() {
      return this.users.filter(user => user.isOnline);
    },
    workingUsers() {
      return this.users.filter(user => 
        user.isOnline && ['available', 'busy', 'on_call', 'focus'].includes(user.status)
      );
    },
    breakUsers() {
      return this.users.filter(user => 
        user.isOnline && ['break', 'lunch', 'meeting', 'training', 'do_not_disturb'].includes(user.status)
      );
    }
  },
  async mounted() {
    console.log('🚀 ActiveUsers mounted - Iniciando sistema de monitoreo en tiempo real...');
    
    // 1. Cargar datos iniciales
    await this.loadStatusTypes();
    await this.loadUsers();
    console.log('🔄 Antes de cargar roles...');
    await this.loadRoles();
    console.log('🟢 Mapeo de roles (roleMap):', this.roleMap);
    console.log('🟢 Lista de usuarios (users):', this.users);
    
    // 2. Inicializar MQTT para monitoreo visual
    await this.initMQTT();
    
    // 3. Configurar actualización automática cada 30 segundos
    this.refreshInterval = setInterval(() => {
      console.log('🔄 Actualización automática de usuarios activos...');
      this.loadUsers();
    }, 30000); // 30 segundos
    
    // 4. Configurar event listener para actualizaciones forzadas
    window.addEventListener('forceUpdate', this.handleForceUpdate);
    
    // 5. Si el usuario ya está disponible, conecta inmediatamente
    if (this.$store.state.user && this.$store.state.user._id && this.$store.state.user.name) {
      this.initMQTTConnection();
    } else {
      // Si no, espera a que esté disponible
      this.$watch(
        () => this.$store.state.user,
        (user) => {
          if (user && user._id && user.name && !this.mqttReady) {
            this.initMQTTConnection();
          }
        },
        { immediate: true }
      );
    }
    
    console.log('✅ Sistema de monitoreo en tiempo real inicializado');
  },
  beforeUnmount() {
    // Limpiar conexión MQTT
    if (this.mqttService) {
      console.log('🧹 Limpiando conexión MQTT...');
      this.mqttService.disconnect();
    }
    
    // Limpiar intervalo de actualización
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Limpiar listener de actualización forzada
    window.removeEventListener('forceActiveUsersUpdate', this.handleForceUpdate);
    window.removeEventListener('forceUpdate', this.handleForceUpdate);
    
    // Limpiar cliente MQTT antiguo
    if (this.mqttClient) {
      this.mqttClient.end();
    }
  },
  methods: {
    async initUserStatus() {
      try {
        console.log('🔄 Inicializando estado del usuario...');
        const response = await axios.post('/user-status/init-status', {}, {
          withCredentials: true
        });
        
        if (response.data.success) {
          console.log('✅ Estado del usuario inicializado:', response.data.status.status);
        } else {
          console.log('⚠️ Error inicializando estado:', response.data.message);
        }
      } catch (error) {
        console.error('❌ Error inicializando estado del usuario:', error);
      }
    },

    async loadUsers() {
      try {
        this.loading = true;
        const response = await axios.get('/user-status/active-users', {
          withCredentials: true
        });
        
        if (response.data.success) {
          this.users = response.data.users;
          console.log('✅ Usuarios activos cargados:', this.users.length);
        } else {
          console.log('⚠️ Respuesta sin éxito:', response.data);
        }
      } catch (error) {
        console.error('❌ Error cargando usuarios activos:', error);
        console.error('   - URL:', error.config?.url);
        console.error('   - Status:', error.response?.status);
        console.error('   - Data:', error.response?.data);
      } finally {
        this.loading = false;
      }
    },
    
    async loadStatusTypes() {
      try {
        const response = await axios.get('/user-status/available-statuses', {
          withCredentials: true
        });
        
        if (response.data.success) {
          this.availableStatuses = response.data.statuses;
          console.log('✅ Tipos de estado cargados:', this.availableStatuses.length);
        } else {
          console.log('⚠️ Respuesta sin éxito para tipos de estado:', response.data);
        }
      } catch (error) {
        console.error('❌ Error cargando tipos de estado:', error);
        console.error('   - URL:', error.config?.url);
        console.error('   - Status:', error.response?.status);
        console.error('   - Data:', error.response?.data);
      }
    },
    
    async loadRoles() {
      console.log('🔄 Iniciando carga de roles...');
      try {
        const response = await axios.get('user-status/roles');
        console.log('🟢 Respuesta del API de roles:', response.data);
        if (response.data.success) {
          this.roleMap = {};
          response.data.roles.forEach(role => {
            this.roleMap[role._id] = role.nombre;
          });
          console.log('🟢 Mapeo de roles creado:', this.roleMap);
        }
      } catch (error) {
        console.error('❌ Error cargando roles:', error);
        console.error('   - URL:', error.config?.url);
        console.error('   - Status:', error.response?.status);
        console.error('   - Data:', error.response?.data);
      }
    },
    
    refreshUsers() {
      this.loadUsers();
    },
    
    getStatusColor(status) {
      const statusObj = this.availableStatuses.find(s => s.value === status);
      return statusObj ? statusObj.color : '#6c757d';
    },
    
    getStatusLabel(status) {
      const statusObj = this.availableStatuses.find(s => s.value === status);
      return statusObj ? statusObj.label : 'Desconocido';
    },
    
    getStatusIcon(status) {
      const statusObj = this.availableStatuses.find(s => s.value === status);
      return statusObj ? statusObj.icon : 'fas fa-question-circle';
    },
    
    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString('es-ES');
    },
    
    getTimeAgo(date) {
      if (!date) return 'N/A';
      
      const now = new Date();
      const past = new Date(date);
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
      if (diffHours > 0) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
      if (diffMins > 0) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
      return 'Ahora mismo';
    },
    
    getConnectionTime(date) {
      if (!date) return 'N/A';
      
      const now = new Date();
      const past = new Date(date);
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
      if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
      return `${diffMins}m`;
    },
    
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
    
    viewUserDetails(user) {
      this.selectedUser = user;
      const modal = new Modal(document.getElementById('userDetailsModal'));
      modal.show();
    },
    
    sendMessage(user) {
      // Implementar envío de mensajes
      console.log('Enviar mensaje a:', user.name);
    },
    
    changeUserStatus(user) {
      // Implementar cambio de estado
      console.log('Cambiar estado de:', user.name);
    },
    
    exportToCSV() {
      const headers = ['Nombre', 'Email', 'Estado', 'Rol', 'Última Actividad', 'Tiempo Conectado'];
      const csvContent = [
        headers.join(','),
        ...this.filteredUsers.map(user => [
          user.name,
          user.email,
          this.getStatusLabel(user.status),
          user.role,
          this.formatDate(user.lastActivity),
          this.getConnectionTime(user.lastActivity)
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usuarios_activos_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },

    // 🚨 INICIALIZAR MQTT PARA TIEMPO REAL
    async initMQTT() {
      try {
        console.log('🔌 Inicializando MQTT para ActiveUsers...');
        const MQTTService = (await import('@/services/mqttService')).default;
        
        // Crear nueva instancia del servicio MQTT
        this.mqttService = new MQTTService();
        
        // Intentar conectar MQTT
        const connected = await this.mqttService.connect();
        
        if (connected && this.mqttService.isConnected) {
          console.log('✅ MQTT conectado, configurando listeners...');
          this.usingMQTT = true;
          
          // 🚨 LISTENER PARA CAMBIOS DE ESTADO EN TIEMPO REAL
          this.mqttService.on(this.mqttService.topics.statusChanged, (data) => {
            console.log('🚨 MQTT TIEMPO REAL:', `${data.userName} ${data.previousStatus || 'N/A'} → ${data.newStatus}`);
            this.showNotification(`${data.userName} cambió de ${data.previousStatus || 'N/A'} a ${data.newStatus}`);
            this.handleUserStatusChange(data);
          });
          
          // 🚨 LISTENER PARA LISTA DE USUARIOS ACTIVOS
          this.mqttService.on(this.mqttService.topics.activeUsers, (data) => {
            console.log('👥 Lista de usuarios activos MQTT:', data.users?.length || 0, 'usuarios');
            this.handleActiveUsersList(data);
          });
          
          // 🚨 LISTENER PARA CONEXIONES
          this.mqttService.on(this.mqttService.topics.userConnected, (data) => {
            console.log('🔗 Usuario conectado MQTT:', data.userName);
            this.showNotification(`${data.userName} se conectó`, 'success');
            this.handleUserConnected(data);
          });
          
          // 🚨 LISTENER PARA DESCONEXIONES
          this.mqttService.on(this.mqttService.topics.userDisconnected, (data) => {
            console.log('🔌 Usuario desconectado MQTT:', data.userName);
            this.showNotification(`${data.userName} se desconectó`, 'warning');
            this.handleUserDisconnected(data);
          });
          
          console.log('✅ MQTT inicializado correctamente para ActiveUsers');
        } else {
          console.log('⚠️ MQTT no se pudo conectar');
          this.usingMQTT = false;
        }
      } catch (error) {
        console.error('❌ Error inicializando MQTT:', error);
        this.usingMQTT = false;
      }
    },

    initMQTTConnection() {
      const userId = this.$store.state.user && this.$store.state.user._id;
      const userName = this.$store.state.user && this.$store.state.user.name;
      if (!userId || !userName) {
        console.warn('No se conecta a MQTT: usuario no disponible', userId, userName);
        return;
      }
      console.log('Conectando MQTT con:', userId, userName);
      this.mqttClient = connectMQTT(userId, userName);
      this.mqttReady = true;
      this.mqttClient.on('connect', () => {
        this.mqttConnected = true;
        this.mqttClient.subscribe('activeUsers/connected');
        this.mqttClient.subscribe('activeUsers/disconnected');
      });
      this.mqttClient.on('close', () => {
        this.mqttConnected = false;
      });
      this.mqttClient.on('error', () => {
        this.mqttConnected = false;
      });
      this.mqttClient.on('message', (topic, message) => {
        const data = JSON.parse(message.toString());
        if (topic === 'activeUsers/connected') {
          if (!this.activeUsers.find(u => u.clientId === data.clientId)) {
            this.activeUsers.push(data);
          }
        }
        if (topic === 'activeUsers/disconnected') {
          this.activeUsers = this.activeUsers.filter(u => u.clientId !== data.clientId);
        }
      });
    },

    // 🔔 MOSTRAR NOTIFICACIONES
    showNotification(message, type = 'info') {
      console.log(`🔔 Notificación: ${message}`);
      // Aquí puedes integrar con tu sistema de notificaciones
      // Por ejemplo, mostrar un toast o alert
      if (window.showToast) {
        window.showToast(message, type);
      }
    },

    // 🚨 MANEJAR CAMBIOS DE ESTADO EN TIEMPO REAL VIA MQTT
    handleUserStatusChange(data) {
      try {
        const { userId, userName, newStatus, newLabel, newColor, timestamp } = data;
        
        console.log(`🚨 MQTT - Cambio de estado detectado: ${userName} → ${newStatus}`);
        
        // Buscar el usuario en la lista
        const userIndex = this.users.findIndex(u => u._id === userId);
        
        if (userIndex !== -1) {
          const oldStatus = this.users[userIndex].status;
          
          // Actualizar los datos del usuario
          this.users[userIndex].status = newStatus;
          this.users[userIndex].label = newLabel;
          this.users[userIndex].color = newColor;
          this.users[userIndex].lastActivity = timestamp;
          
          console.log(`🚨 MQTT TIEMPO REAL: ${userName} ${oldStatus} → ${newStatus}`);
          
          // Agregar evento a la lista de eventos en tiempo real
          this.addRealTimeEvent({
            type: 'status_change',
            userName,
            previousStatus: oldStatus,
            newStatus,
            newColor,
            timestamp
          });
          
          // Forzar actualización visual
          this.$forceUpdate();
          
          // Mostrar notificación visual
          this.showStatusChangeNotification(userName, oldStatus, newStatus);
        } else {
          console.log('⚠️ Usuario no encontrado para cambio de estado, recargando lista...');
          // Recargar lista completa si el usuario no está
          this.loadUsers();
        }
      } catch (error) {
        console.error('❌ Error en cambio de estado MQTT:', error);
      }
    },

    // 🚨 MANEJAR LISTA DE USUARIOS ACTIVOS VIA MQTT
    handleActiveUsersList(data) {
      console.log('🚀 INICIO handleActiveUsersList - Método ejecutándose');
      try {
        console.log('👥 MQTT - Lista de usuarios activos recibida:', data.users?.length || 0);
        console.log('🔍 Debug roleMap:', this.roleMap);
        console.log('🔍 roleMap keys:', Object.keys(this.roleMap));
        console.log('🔍 roleMap length:', Object.keys(this.roleMap).length);
        
        if (data.users && Array.isArray(data.users)) {
          // Cargar roles si no se han cargado aún
          if (Object.keys(this.roleMap).length === 0) {
            console.log('🔄 roleMap está vacío, cargando roles...');
            this.loadRoles();
          } else {
            console.log('⚠️ roleMap ya tiene contenido, no cargando roles');
          }
          this.users = data.users;
          // Debug: Verificar el rol del primer usuario
          if (this.users.length > 0) {
            const firstUser = this.users[0];
            console.log('🔍 Debug primer usuario:', firstUser);
            console.log('🔍 Todos los campos del usuario:', Object.keys(firstUser));
            console.log('�� userId completo:', JSON.stringify(firstUser.userId));
            console.log('🔍 user completo:', JSON.stringify(firstUser, null, 2));
            console.log('🔍 user.role:', firstUser.role);
            console.log('🔍 user.roleId:', firstUser.roleId);
            console.log('🔍 user.userRole:', firstUser.userRole);
            console.log('🔍 roleMap[user.role]:', this.roleMap[firstUser.role]);
            console.log('🔍 Resultado final:', this.roleMap[firstUser.role] || firstUser.role);
          }
          this.$forceUpdate();
          console.log('✅ Lista de usuarios actualizada via MQTT');
        }
      } catch (error) {
        console.error('❌ Error procesando lista de usuarios MQTT:', error);
      }
    },

    // 🚨 MANEJAR CONEXIÓN DE USUARIO VIA MQTT
    handleUserConnected(data) {
      try {
        const { userName, role } = data;
        console.log(`🔗 MQTT - Usuario conectado: ${userName} (${role})`);
        
        // Agregar evento a la lista
        this.addRealTimeEvent({
          type: 'user_connected',
          userName,
          role,
          timestamp: new Date().toISOString()
        });
        
        // Recargar lista para incluir el nuevo usuario
        this.loadUsers();
      } catch (error) {
        console.error('❌ Error en conexión de usuario MQTT:', error);
      }
    },

    // 🚨 MANEJAR DESCONEXIONES VIA MQTT
    handleUserDisconnected(data) {
      try {
        const { userId, userName } = data;
        console.log(`🔌 MQTT - Usuario desconectado: ${userName}`);
        
        // Agregar evento a la lista
        this.addRealTimeEvent({
          type: 'user_disconnected',
          userName,
          timestamp: new Date().toISOString()
        });
        
        // Remover el usuario de la lista de activos
        const userIndex = this.users.findIndex(u => u._id === userId);
        if (userIndex !== -1) {
          console.log(`🔌 Usuario ${userName} desconectado, removiendo de lista activa`);
          this.users.splice(userIndex, 1);
          this.$forceUpdate();
        }
        
        // También recargar desde servidor para confirmar
        setTimeout(() => {
          this.loadUsers();
        }, 2000);
        
      } catch (error) {
        console.error('❌ Error manejando desconexión MQTT:', error);
      }
    },

    // 🚨 MOSTRAR NOTIFICACIÓN VISUAL DE CAMBIO DE ESTADO
    showStatusChangeNotification(userName, oldStatus, newStatus) {
      try {
        // Crear notificación simple en consola por ahora
        console.log(`🔔 Notificación: ${userName} cambió de ${oldStatus} a ${newStatus}`);
        
        // TODO: Implementar notificación visual en UI si se requiere
      } catch (error) {
        console.error('❌ Error mostrando notificación:', error);
      }
    },

    // 🚨 MÉTODOS PARA EVENTOS EN TIEMPO REAL
    formatTime(timestamp) {
      if (!timestamp) return 'N/A';
      return new Date(timestamp).toLocaleTimeString('es-ES');
    },

    getEventBadgeClass(type) {
      const classes = {
        'status_change': 'bg-primary',
        'user_connected': 'bg-success',
        'user_disconnected': 'bg-warning'
      };
      return classes[type] || 'bg-secondary';
    },

    getEventLabel(type) {
      const labels = {
        'status_change': 'Cambio Estado',
        'user_connected': 'Conectado',
        'user_disconnected': 'Desconectado'
      };
      return labels[type] || type;
    },

    addRealTimeEvent(eventData) {
      this.eventCounter++;
      const event = {
        id: this.eventCounter,
        timestamp: new Date().toISOString(),
        ...eventData
      };
      
      this.realTimeEvents.unshift(event);
      
      // Mantener solo los últimos 50 eventos
      if (this.realTimeEvents.length > 50) {
        this.realTimeEvents = this.realTimeEvents.slice(0, 50);
      }
    },

    // 🚨 MÉTODO PARA MANEJAR ACTUALIZACIÓN FORZADA
    handleForceUpdate(event) {
      try {
        console.log('🚨 ACTUALIZACIÓN FORZADA RECIBIDA:', event.detail);
        
        const { userId, newStatus, newLabel, newColor, timestamp } = event.detail;
        
        if (userId) {
          // Buscar el usuario en la lista y actualizar
          const userIndex = this.users.findIndex(u => u._id === userId);
          if (userIndex !== -1) {
            const oldStatus = this.users[userIndex].status;
            
            // Actualizar el usuario en la lista
            this.users[userIndex].status = newStatus;
            this.users[userIndex].label = newLabel;
            this.users[userIndex].color = newColor;
            this.users[userIndex].lastActivity = timestamp;
            
            console.log(`🚨 Usuario actualizado FORZADAMENTE: ${this.users[userIndex].name} ${oldStatus} → ${newStatus}`);
            
            // Forzar re-renderizado
            this.$forceUpdate();
          } else {
            console.log('⚠️ Usuario no encontrado en lista para actualización forzada');
          }
        }
        
        // También recargar desde servidor para estar seguros
        setTimeout(() => {
          console.log('🔄 Recargando desde servidor tras actualización forzada...');
          this.loadUsers();
        }, 1000);
        
      } catch (error) {
        console.error('❌ Error en actualización forzada:', error);
      }
    }
  }
};
</script>

<style scoped>
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.badge {
  font-size: 0.75rem;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.pagination {
  margin-bottom: 0;
}

.card {
  border: none;
  box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.15);
}

.table th {
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.table td {
  vertical-align: middle;
  font-size: 0.875rem;
}

.status-dot-sm {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.badge {
  font-size: 0.75rem;
}

.real-time-events {
  max-height: 400px;
  overflow-y: auto;
}
</style> 