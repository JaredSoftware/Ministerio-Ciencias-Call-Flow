<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="card mb-4">
          <div class="card-header pb-0">
            <div class="d-flex justify-content-between align-items-center">
              <h6>👥 Usuarios Activos y Estados</h6>
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
                        {{ user.role }}
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
                <p><strong>Rol:</strong> {{ selectedUser.role }}</p>
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
      refreshInterval: null
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
    await this.loadUsers();
    await this.loadStatusTypes();
    
    // Actualizar cada 30 segundos
    this.refreshInterval = setInterval(() => {
      this.loadUsers();
    }, 30000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    async loadUsers() {
      try {
        this.loading = true;
        const response = await axios.get('/user-status/all-users', {
          withCredentials: true
        });
        
        if (response.data.success) {
          this.users = response.data.users;
          console.log('✅ Usuarios cargados:', this.users.length);
        }
      } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async loadStatusTypes() {
      try {
        const response = await axios.get('/status-types', {
          withCredentials: true
        });
        
        if (response.data.success) {
          this.availableStatuses = response.data.statuses;
        }
      } catch (error) {
        console.error('❌ Error cargando tipos de estado:', error);
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
</style> 