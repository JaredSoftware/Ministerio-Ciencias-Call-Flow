<template>
  <div class="card">
    <div class="card-header pb-0 bg-light d-flex justify-content-between align-items-center">
      <h6>{{ tableName }}</h6>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-success" @click="showCreateModal = true">
          <i class="fas fa-plus me-1"></i>Crear Usuario
        </button>
        <button class="btn btn-sm btn-info" @click="refreshUsers">
          <i class="fas fa-sync-alt me-1"></i>Actualizar
        </button>
      </div>
    </div>
    <div class="card-body px-0 pt-0 pb-2 bg-light">
      <div class="table-responsive p-0">
        <table class="table align-items-center mb-0">
          <thead>
            <tr>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Nombre</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Email</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ID Agente</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Rol</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Estado</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in users" :key="user._id || index">
              <td>
                <div class="d-flex px-2 py-1">
                  <div class="d-flex flex-column justify-content-center">
                    <h6 class="mb-0 text-sm">{{ user.name || 'Sin nombre' }}</h6>
                  </div>
                </div>
              </td>
              <td>
                <div class="d-flex px-2 py-1">
                  <div class="d-flex flex-column justify-content-center">
                    <p class="text-xs text-secondary mb-0">{{ user.correo || 'Sin email' }}</p>
                  </div>
                </div> 
              </td>
              <td>
                <div class="d-flex px-2 py-1">
                  <div class="d-flex flex-column justify-content-center">
                    <span class="badge badge-info text-xs">{{ user.idAgent || 'Sin ID' }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="d-flex px-2 py-1">
                  <select 
                    class="form-select form-select-sm" 
                    :value="user.role" 
                    @change="updateUserRole(user._id, $event.target.value)"
                    :disabled="loadingStates.role[user._id]"
                  >
                    <option value="">Seleccionar rol</option>
                    <option 
                      v-for="role in AllRoles" 
                      :key="role._id" 
                      :value="role._id"
                      :selected="role._id === user.role"
                    >
                      {{ role.nombre }}
                    </option>
                  </select>
                </div>
              </td>
              <td>
                <div class="d-flex px-2 py-1">
                  <div class="form-check form-switch">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      :checked="user.active"
                      @change="updateUserStatus(user._id, $event.target.checked)"
                      :disabled="loadingStates.status[user._id]"
                    >
                    <label class="form-check-label">
                      <span class="badge" :class="user.active ? 'badge-success' : 'badge-secondary'">
                        {{ user.active ? 'Activo' : 'Inactivo' }}
                      </span>
                    </label>
                  </div>
                </div>  
              </td>
              <td>
                <div class="d-flex px-2 py-1 gap-1">
                  <button 
                    class="btn btn-sm btn-outline-primary" 
                    @click="editUser(user)"
                    title="Editar usuario"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-danger" 
                    @click="confirmDeleteUser(user)"
                    title="Eliminar usuario"
                    :disabled="user._id === currentUserId"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal para crear usuario -->
    <div 
      class="modal fade" 
      :class="{ show: showCreateModal }" 
      :style="{ display: showCreateModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Crear Nuevo Usuario</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createUser">
              <div class="mb-3">
                <label class="form-label">Nombre *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': validationErrors.create.name }"
                  v-model="newUser.name" 
                  required
                >
                <div v-if="validationErrors.create.name" class="invalid-feedback">
                  {{ validationErrors.create.name }}
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Email *</label>
                <div class="input-group">
                  <input 
                    type="email" 
                    class="form-control" 
                    :class="{ 'is-invalid': validationErrors.create.email }"
                    v-model="newUser.email" 
                    required
                  >
                  <span v-if="emailChecking" class="input-group-text">
                    <div class="spinner-border spinner-border-sm" role="status">
                      <span class="visually-hidden">Verificando...</span>
                    </div>
                  </span>
                </div>
                <div v-if="validationErrors.create.email" class="invalid-feedback d-block">
                  {{ validationErrors.create.email }}
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">ID Agente (opcional)</label>
                <input 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': validationErrors.create.idAgent }"
                  v-model="newUser.idAgent" 
                  placeholder="Ej: AGENT001"
                >
                <div v-if="validationErrors.create.idAgent" class="invalid-feedback">
                  {{ validationErrors.create.idAgent }}
                </div>
                <small class="form-text text-muted">Identificador único del agente (se puede agregar después)</small>
              </div>
              <div class="mb-3">
                <label class="form-label">Contraseña *</label>
                <input 
                  type="password" 
                  class="form-control" 
                  :class="{ 'is-invalid': validationErrors.create.password }"
                  v-model="newUser.password" 
                  required
                  minlength="6"
                >
                <div v-if="validationErrors.create.password" class="invalid-feedback">
                  {{ validationErrors.create.password }}
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Rol</label>
                <select class="form-select" v-model="newUser.role">
                  <option value="">Seleccionar rol</option>
                  <option 
                    v-for="role in AllRoles" 
                    :key="role._id" 
                    :value="role._id"
                  >
                    {{ role.nombre }}
                  </option>
                </select>
              </div>
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  v-model="newUser.active"
                  id="activeCheck"
                >
                <label class="form-check-label" for="activeCheck">
                  Usuario activo
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="createUser"
              :disabled="loadingStates.creating"
            >
              <span v-if="loadingStates.creating" class="spinner-border spinner-border-sm me-1"></span>
              Crear Usuario
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para editar usuario -->
    <div 
      class="modal fade" 
      :class="{ show: showEditModal }" 
      :style="{ display: showEditModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Editar Usuario</h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateUser">
              <div class="mb-3">
                <label class="form-label">Nombre *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': validationErrors.edit.name }"
                  v-model="editingUser.name" 
                  required
                >
                <div v-if="validationErrors.edit.name" class="invalid-feedback">
                  {{ validationErrors.edit.name }}
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Email *</label>
                <div class="input-group">
                  <input 
                    type="email" 
                    class="form-control" 
                    :class="{ 'is-invalid': validationErrors.edit.email }"
                    v-model="editingUser.correo" 
                    required
                  >
                  <span v-if="emailChecking" class="input-group-text">
                    <div class="spinner-border spinner-border-sm" role="status">
                      <span class="visually-hidden">Verificando...</span>
                    </div>
                  </span>
                </div>
                <div v-if="validationErrors.edit.email" class="invalid-feedback d-block">
                  {{ validationErrors.edit.email }}
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">ID Agente (opcional)</label>
                <input 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': validationErrors.edit.idAgent }"
                  v-model="editingUser.idAgent" 
                  placeholder="Ej: AGENT001"
                >
                <div v-if="validationErrors.edit.idAgent" class="invalid-feedback">
                  {{ validationErrors.edit.idAgent }}
                </div>
                <small class="form-text text-muted">Identificador único del agente (se puede agregar después)</small>
              </div>
              <div class="mb-3">
                <label class="form-label">Nueva Contraseña (opcional)</label>
                <input 
                  type="password" 
                  class="form-control" 
                  :class="{ 'is-invalid': validationErrors.edit.password }"
                  v-model="editingUser.password" 
                  placeholder="Dejar vacío para mantener la actual"
                  minlength="6"
                >
                <div v-if="validationErrors.edit.password" class="invalid-feedback">
                  {{ validationErrors.edit.password }}
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false">
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="updateUser"
              :disabled="loadingStates.updating"
            >
              <span v-if="loadingStates.updating" class="spinner-border spinner-border-sm me-1"></span>
              Actualizar Usuario
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación para eliminar -->
    <div 
      class="modal fade" 
      :class="{ show: showDeleteModal }" 
      :style="{ display: showDeleteModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirmar Eliminación</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de que deseas eliminar al usuario <strong>{{ userToDelete?.name }}</strong>?</p>
            <p class="text-danger"><small>Esta acción no se puede deshacer.</small></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="deleteUser"
              :disabled="loadingStates.deleting"
            >
              <span v-if="loadingStates.deleting" class="spinner-border spinner-border-sm me-1"></span>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop para modales -->
    <div 
      v-if="showCreateModal || showEditModal || showDeleteModal" 
      class="modal-backdrop fade show"
      @click="closeAllModals"
    ></div>
  </div>
</template>

<script>
import tokens from "@/router/services/tokens";
import roleAndActivate from "@/router/services/roleAndActivate";
import axios from "@/router/services/axios";
import { reactive } from 'vue';

export default {
  name: "users-table",
  props: {
    tableHead: Array,
    tableBody: Array,
    tableName: String,
  },
  data() {
    return {
      AllRoles: [],
      users: [],
      currentUserId: null,
      showCreateModal: false,
      showEditModal: false,
      showDeleteModal: false,
      userToDelete: null,
      newUser: {
        name: '',
        email: '',
        idAgent: '',
        password: '',
        role: '',
        active: true
      },
      editingUser: {
        _id: '',
        name: '',
        correo: '',
        idAgent: '',
        password: ''
      },
      // Estados de validación
      validationErrors: {
        create: {
          name: '',
          email: '',
          idAgent: '',
          password: ''
        },
        edit: {
          name: '',
          email: '',
          idAgent: '',
          password: ''
        }
      },
      emailChecking: false,
      loadingStates: reactive({
        role: {},
        status: {},
        creating: false,
        updating: false,
        deleting: false
      })
    };
  },
  async mounted() {
    await this.loadRoles();
    await this.loadUsers();
    this.getCurrentUserId();
  },
  watch: {
    tableBody: {
      handler(newVal) {
        if (newVal && Array.isArray(newVal) && newVal.length > 0) {
          this.users = [...newVal];
        } else if (newVal && Array.isArray(newVal)) {
          this.users = [];
        }
      },
      immediate: true
    },
    // Validar email en tiempo real al crear usuario
    'newUser.email': {
      handler(newEmail) {
        this.validateEmailInRealTime(newEmail, 'create');
      },
      immediate: false
    },
    // Validar email en tiempo real al editar usuario
    'editingUser.correo': {
      handler(newEmail) {
        this.validateEmailInRealTime(newEmail, 'edit');
      },
      immediate: false
    },
    // Validar idAgent en tiempo real al crear usuario
    'newUser.idAgent': {
      handler(newIdAgent) {
        this.validateIdAgentInRealTime(newIdAgent, 'create');
      },
      immediate: false
    },
    // Validar idAgent en tiempo real al editar usuario
    'editingUser.idAgent': {
      handler(newIdAgent) {
        this.validateIdAgentInRealTime(newIdAgent, 'edit');
      },
      immediate: false
    }
  },
  methods: {
    async loadRoles() {
      try {
        const roles = await tokens.sendRoles();
        this.AllRoles = roles || [];
      } catch (error) {
        console.error('Error cargando roles:', error);
        this.showError('Error al cargar los roles');
      }
    },

    async loadUsers() {
      try {
        const role = await tokens.sendRole();
        const users = await tokens.sendAllUsers(role);
        this.users = users || [];
      } catch (error) {
        console.error('Error cargando usuarios:', error);
        this.showError('Error al cargar los usuarios');
      }
    },

    getCurrentUserId() {
      try {
        // Obtener el ID del usuario actual desde el sessionStorage o store
        const userDataString = sessionStorage.getItem('user');
        console.log('🔍 userDataString del sessionStorage:', userDataString);
        
        if (userDataString && userDataString.trim() !== '') {
          // Verificar si es un JSON válido
          if (userDataString.startsWith('{') || userDataString.startsWith('[')) {
            const userData = JSON.parse(userDataString);
            this.currentUserId = userData._id;
          } else {
            console.log('⚠️ userDataString no es JSON válido, intentando parsear como query string');
            // Intentar parsear como query string
            const params = new URLSearchParams(userDataString);
            this.currentUserId = params.get('_id') || null;
          }
        } else {
          // Intentar obtener desde el store de Vuex
          this.currentUserId = this.$store.state.user?._id || null;
        }
        
        console.log('🔍 currentUserId obtenido:', this.currentUserId);
      } catch (error) {
        console.error('Error obteniendo ID del usuario actual:', error);
        // Intentar obtener desde el store como fallback
        this.currentUserId = this.$store.state.user?._id || null;
      }
    },

    async refreshUsers() {
      await this.loadUsers();
              this.showSuccess('Lista de usuarios actualizada');
    },

    async updateUserRole(userId, newRoleId) {
      if (!newRoleId) return;
      
              this.loadingStates.role[userId] = true;
      
      try {
        const response = await roleAndActivate.rolChanger(userId, newRoleId);
        
        console.log('🔍 Respuesta del servicio rolChanger:', response);
        console.log('🔍 Tipo de respuesta:', typeof response);
        console.log('🔍 Propiedades de respuesta:', Object.keys(response || {}));
        
        // Verificar si la respuesta es válida
        if (response && response.restart === true) {
          this.showWarning('Tu rol ha sido cambiado. Debes iniciar sesión nuevamente.');
        localStorage.clear();
          this.$router.push("/signin");
          return;
        }
        
        // Si la respuesta es exitosa (sin restart)
        if (response) {
          // Actualizar la lista local
          const userIndex = this.users.findIndex(u => u._id === userId);
          if (userIndex !== -1) {
            this.users[userIndex].role = newRoleId;
          }
          
          this.showSuccess('Rol actualizado correctamente');
        } else {
          this.showError('Error al actualizar el rol: Respuesta inválida');
        }
      } catch (error) {
        console.error('Error actualizando rol:', error);
        this.showError('Error al actualizar el rol: ' + (error.message || 'Error desconocido'));
      } finally {
        this.loadingStates.role[userId] = false;
      }
    },

    async updateUserStatus(userId, newStatus) {
              this.loadingStates.status[userId] = true;
      
      try {
        const response = await roleAndActivate.statChanger(userId, newStatus);
        
        console.log('🔍 Respuesta del servicio statChanger:', response);
        
        // Verificar si la respuesta es válida
        if (response && response.restart === true) {
          this.showWarning('Tu estado ha sido cambiado. Debes iniciar sesión nuevamente.');
        localStorage.clear();
          this.$router.push("/signin");
          return;
        }
        
        // Si la respuesta es exitosa (sin restart)
        if (response) {
          // Actualizar la lista local
          const userIndex = this.users.findIndex(u => u._id === userId);
          if (userIndex !== -1) {
            this.users[userIndex].active = newStatus;
          }
          
          this.showSuccess('Estado actualizado correctamente');
        } else {
          this.showError('Error al actualizar el estado: Respuesta inválida');
        }
      } catch (error) {
        console.error('Error actualizando estado:', error);
        this.showError('Error al actualizar el estado: ' + (error.message || 'Error desconocido'));
      } finally {
        this.loadingStates.status[userId] = false;
      }
    },

    // Validación de email
    validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    // Validar email en tiempo real
    async validateEmailInRealTime(email, formType) {
      // Limpiar error anterior
      this.validationErrors[formType].email = '';
      
      if (!email) {
        return; // No validar si está vacío
      }

      // Validar formato
      if (!this.validateEmail(email)) {
        this.validationErrors[formType].email = 'Formato de email inválido';
        return;
      }

      // Verificar si ya existe (solo para crear usuario)
      if (formType === 'create') {
        this.emailChecking = true;
        try {
          const response = await axios.post('/exists', { email });
          if (response.data.user) {
            this.validationErrors[formType].email = 'Este email ya está registrado';
          }
        } catch (error) {
          console.error('Error verificando email:', error);
        } finally {
          this.emailChecking = false;
        }
      } else if (formType === 'edit') {
        // Para editar, verificar si existe en otro usuario
        this.emailChecking = true;
        try {
          const response = await axios.post('/exists', { email });
          if (response.data.user) {
            // Verificar si es el mismo usuario
            const existingUser = this.users.find(u => u.correo === email);
            if (existingUser && existingUser._id !== this.editingUser._id) {
              this.validationErrors[formType].email = 'Este email ya está registrado por otro usuario';
            }
          }
        } catch (error) {
          console.error('Error verificando email:', error);
        } finally {
          this.emailChecking = false;
        }
      }
    },

    // Validar idAgent en tiempo real
    async validateIdAgentInRealTime(idAgent, formType) {
      // Limpiar error anterior
      this.validationErrors[formType].idAgent = '';
      
      if (!idAgent || idAgent.trim() === '') {
        return; // No validar si está vacío
      }

      // Verificar si ya existe en la lista actual de usuarios
      const existingUser = this.users.find(u => u.idAgent === idAgent.trim());
      
      if (formType === 'create') {
        if (existingUser) {
          this.validationErrors[formType].idAgent = 'Este ID Agente ya está registrado';
        }
      } else if (formType === 'edit') {
        // Para editar, verificar si existe en otro usuario
        if (existingUser && existingUser._id !== this.editingUser._id) {
          this.validationErrors[formType].idAgent = 'Este ID Agente ya está registrado por otro usuario';
        }
      }
    },

    async createUser() {
      if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
        this.showError('Por favor completa todos los campos obligatorios');
        return;
      }

      // Verificar si hay errores de validación
      if (this.validationErrors.create.name || this.validationErrors.create.email || this.validationErrors.create.idAgent || this.validationErrors.create.password) {
        this.showError('Por favor corrige los errores en el formulario');
        return;
      }

      this.loadingStates.creating = true;
      
      try {
        const response = await axios.post('/addUser', {
          name: this.newUser.name,
          email: this.newUser.email,
          idAgent: this.newUser.idAgent,
          password: this.newUser.password,
          role: this.newUser.role || null,
          active: this.newUser.active
        });

        if (response.data.success) {
          this.showSuccess('Usuario creado correctamente');
          this.showCreateModal = false;
          this.resetNewUser();
          await this.loadUsers();
        } else {
          this.showError(response.data.error || 'Error al crear usuario');
        }
      } catch (error) {
        console.error('Error creando usuario:', error);
        this.showError('Error al crear el usuario');
      } finally {
        this.loadingStates.creating = false;
      }
    },

    editUser(user) {
      this.editingUser = {
        _id: user._id,
        name: user.name,
        correo: user.correo,
        idAgent: user.idAgent || '',
        password: ''
      };
      // Limpiar errores de validación
      this.validationErrors.edit = {
        name: '',
        email: '',
        idAgent: '',
        password: ''
      };
      this.showEditModal = true;
    },

    async updateUser() {
      if (!this.editingUser.name || !this.editingUser.correo) {
        this.showError('Nombre y email son obligatorios');
        return;
      }

      // Verificar si hay errores de validación
      if (this.validationErrors.edit.name || this.validationErrors.edit.email || this.validationErrors.edit.idAgent || this.validationErrors.edit.password) {
        this.showError('Por favor corrige los errores en el formulario');
        return;
      }

      this.loadingStates.updating = true;
      
      try {
        const updateData = {
          id: this.editingUser._id,
          name: this.editingUser.name,
          email: this.editingUser.correo,
          idAgent: this.editingUser.idAgent
        };

        if (this.editingUser.password) {
          updateData.password = this.editingUser.password;
        }

        const response = await axios.post('/updateUser', updateData);

        if (response.data.success) {
          this.showSuccess(response.data.message || 'Usuario actualizado correctamente');
          this.showEditModal = false;
          await this.loadUsers();
        } else {
          this.showError(response.data.error || 'Error al actualizar usuario');
        }
      } catch (error) {
        console.error('Error actualizando usuario:', error);
        this.showError('Error al actualizar el usuario');
      } finally {
        this.loadingStates.updating = false;
      }
    },

    confirmDeleteUser(user) {
      if (user._id === this.currentUserId) {
        this.showError('No puedes eliminar tu propio usuario');
        return;
      }
      
      this.userToDelete = user;
      this.showDeleteModal = true;
    },

    async deleteUser() {
      if (!this.userToDelete) return;

      this.loadingStates.deleting = true;
      
      try {
        const response = await axios.post('/deleteUser', {
          id: this.userToDelete._id
        });

        if (response.data.success) {
          this.showSuccess(response.data.message || 'Usuario eliminado correctamente');
          this.showDeleteModal = false;
          this.userToDelete = null;
          await this.loadUsers();
        } else {
          this.showError(response.data.error || 'Error al eliminar usuario');
        }
      } catch (error) {
        console.error('Error eliminando usuario:', error);
        this.showError('Error al eliminar el usuario');
      } finally {
        this.loadingStates.deleting = false;
      }
    },

    resetNewUser() {
      this.newUser = {
        name: '',
        email: '',
        idAgent: '',
        password: '',
        role: '',
        active: true
      };
      // Limpiar errores de validación
      this.validationErrors.create = {
        name: '',
        email: '',
        idAgent: '',
        password: ''
      };
    },

    closeAllModals() {
      this.showCreateModal = false;
      this.showEditModal = false;
      this.showDeleteModal = false;
      this.userToDelete = null;
    },

    getRoleName(roleId) {
      const role = this.AllRoles.find(r => r._id === roleId);
      return role ? role.nombre : 'Sin rol';
    },

    // Métodos de toast simplificados
    showSuccess(message) {
      console.log('✅ Success:', message);
    },
    
    showError(message) {
      console.error('❌ Error:', message);
    },
    
    showWarning(message) {
      console.warn('⚠️ Warning:', message);
    },
    
    showInfo(message) {
      console.info('ℹ️ Info:', message);
    }
  }
};
</script>

<style scoped>
.modal {
  z-index: 1050;
}

.modal-backdrop {
  z-index: 1040;
}

.badge-success {
  background-color: #28a745;
  color: white;
}

.badge-secondary {
  background-color: #6c757d;
  color: white;
}

.badge-info {
  background-color: #17a2b8;
  color: white;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.gap-1 {
  gap: 0.25rem;
}

.gap-2 {
  gap: 0.5rem;
}

.form-select-sm {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}
</style>
