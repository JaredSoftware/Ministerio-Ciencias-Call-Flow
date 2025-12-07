<template>
  <div class="container-fluid py-4 bg-light min-vh-100">
    <!-- Header Principal con Gradiente -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card border-0 shadow-sm overflow-hidden">
          <div class="card-body p-4 bg-gradient-primary text-white position-relative">
            <div class="position-relative z-index-1">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h2 class="text-white mb-1 font-weight-bold">
                    <i class="fas fa-chart-pie me-2"></i>Gestión de Clientes
                  </h2>
                  <p class="text-white text-sm opacity-8 mb-0">
                    Administración centralizada de clientes y tipificaciones
                  </p>
                </div>
                <div v-if="!loading && vistaActiva === 'clientes'" class="d-none d-md-block text-end">
                  <h3 class="text-white mb-0 font-weight-bolder">{{ totalClientes }}</h3>
                  <small class="text-uppercase font-weight-bold opacity-8">Clientes Totales</small>
                </div>
              </div>
            </div>
            <!-- Decoración de fondo -->
            <div class="position-absolute top-0 end-0 h-100 w-50 d-none d-md-block opacity-1" 
                 style="background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1)); pointer-events: none;">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navegación (Tabs Modernos) -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-2">
            <div class="nav-wrapper position-relative end-0">
              <ul class="nav nav-pills nav-fill p-1" role="tablist">
                <li class="nav-item">
                  <a 
                    class="nav-link mb-0 px-0 py-2 font-weight-bold transition-all"
                    :class="{ 'active bg-white text-primary shadow-sm': vistaActiva === 'clientes', 'text-secondary': vistaActiva !== 'clientes' }"
                    @click="cambiarVista('clientes')"
                    href="javascript:;"
                  >
                    <i class="fas fa-users me-2"></i>Todos los Clientes
                  </a>
                </li>
                <li class="nav-item">
                  <a 
                    class="nav-link mb-0 px-0 py-2 font-weight-bold transition-all"
                    :class="{ 'active bg-white text-primary shadow-sm': vistaActiva === 'tipificaciones', 'text-secondary': vistaActiva !== 'tipificaciones' }"
                    @click="cambiarVista('tipificaciones')"
                    href="javascript:;"
                  >
                    <i class="fas fa-poll me-2"></i>Tipificaciones
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VISTA: TODOS LOS CLIENTES -->
    <transition name="fade" mode="out-in">
      <div v-if="vistaActiva === 'clientes'" key="clientes">
        <!-- Buscador y Filtros -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body p-4">
            <div class="row g-3 align-items-end">
              <div class="col-md-6 col-lg-7">
                <label class="form-label font-weight-bold text-xs text-uppercase text-muted">Buscar Cliente</label>
                <div class="input-group input-group-alternative border rounded-3 overflow-hidden">
                  <span class="input-group-text bg-white border-0"><i class="fas fa-search text-secondary"></i></span>
                  <input 
                    type="text" 
                    class="form-control border-0 ps-2" 
                    placeholder="Escribe cédula, nombre, correo o teléfono..." 
                    v-model="textoBusqueda"
                    @keyup.enter="buscarClientes"
                    @input="debounceBusqueda"
                  >
                  <button v-if="textoBusqueda" class="btn bg-white border-0 mb-0 text-secondary" @click="limpiarBusqueda">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <div class="col-6 col-md-3 col-lg-2">
                <label class="form-label font-weight-bold text-xs text-uppercase text-muted">Mostrar</label>
                <select class="form-select border rounded-3" v-model.number="limitePorPagina" @change="buscarClientes">
                  <option :value="20">20 registros</option>
                  <option :value="50">50 registros</option>
                  <option :value="100">100 registros</option>
                  <option :value="200">200 registros</option>
                </select>
              </div>
              <div class="col-6 col-md-3 col-lg-3 text-end">
                <button class="btn btn-success w-100 mb-0 shadow-sm" @click="exportarCSV" :disabled="clientes.length === 0">
                  <i class="fas fa-file-csv me-2"></i>Exportar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabla de Resultados -->
        <div class="card border-0 shadow-lg">
          <div class="card-header border-bottom bg-white p-4">
            <h5 class="mb-0 font-weight-bold">Resultados</h5>
            <p class="text-sm text-muted mb-0">
              <span v-if="loading"><i class="fas fa-spinner fa-spin me-1"></i> Cargando datos...</span>
              <span v-else>Se encontraron {{ totalClientes }} clientes registrados</span>
            </p>
          </div>
          
          <div class="table-responsive">
            <table class="table align-items-center mb-0 table-hover">
              <thead class="bg-light">
                <tr>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-4">Cliente / ID</th>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Contacto</th>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Ubicación</th>
                  <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Interacciones</th>
                  <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Última Actividad</th>
                  <th class="text-secondary opacity-7"></th>
                </tr>
              </thead>
              <tbody v-if="!loading && clientes.length > 0">
                <tr v-for="cliente in clientes" :key="cliente._id" class="transition-base">
                  <td class="ps-4">
                    <div class="d-flex px-2 py-1">
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm font-weight-bold text-dark">{{ getNombreCompleto(cliente) }}</h6>
                        <p class="text-xs text-secondary mb-0">
                          <span class="badge bg-light text-dark border">{{ cliente.cedula }}</span>
                          <span class="ms-2 text-xs">{{ cliente.tipoDocumento }}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex flex-column">
                      <span class="text-xs font-weight-bold mb-1" v-if="cliente.correo">
                        <i class="fas fa-envelope me-1 text-secondary"></i> {{ cliente.correo }}
                      </span>
                      <span class="text-xs text-secondary" v-if="cliente.telefono">
                        <i class="fas fa-phone me-1 text-secondary"></i> {{ cliente.telefono }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <p class="text-xs font-weight-bold mb-0">{{ cliente.ciudad || 'N/A' }}</p>
                    <p class="text-xs text-secondary mb-0">{{ cliente.departamento }}</p>
                  </td>
                  <td class="align-middle text-center">
                    <span class="badge bg-gradient-info">{{ cliente.totalInteracciones || 0 }}</span>
                  </td>
                  <td class="align-middle text-center">
                    <span class="text-secondary text-xs font-weight-bold">{{ formatFecha(cliente.fechaUltimaInteraccion) }}</span>
                    <div class="text-secondary text-xxs">{{ formatHora(cliente.fechaUltimaInteraccion) }}</div>
                  </td>
                  <td class="align-middle text-end pe-4">
                    <button class="btn btn-link text-secondary mb-0 px-2" @click="verDetalles(cliente)" title="Ver perfil completo">
                      <i class="fas fa-chevron-right text-lg"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
              <tbody v-else-if="loading">
                <tr>
                  <td colspan="6" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-sm text-secondary">Buscando información...</p>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td colspan="6" class="text-center py-5">
                    <div class="text-center">
                      <i class="fas fa-inbox fa-3x text-secondary opacity-5 mb-3"></i>
                      <p class="text-secondary font-weight-bold">No se encontraron resultados</p>
                      <button class="btn btn-sm btn-outline-primary" @click="limpiarBusqueda">Limpiar filtros</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div class="card-footer bg-white border-top py-3" v-if="totalPaginas > 1">
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-sm text-secondary">
                Página <span class="font-weight-bold text-dark">{{ paginaActual }}</span> de {{ totalPaginas }}
              </span>
              <nav aria-label="Page navigation">
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" :class="{ disabled: paginaActual === 1 }">
                    <a class="page-link" href="javascript:;" @click="irAPagina(paginaActual - 1)">
                      <i class="fas fa-angle-left"></i>
                    </a>
                  </li>
                  <li class="page-item disabled">
                    <span class="page-link">{{ paginaActual }}</span>
                  </li>
                  <li class="page-item" :class="{ disabled: paginaActual === totalPaginas }">
                    <a class="page-link" href="javascript:;" @click="irAPagina(paginaActual + 1)">
                      <i class="fas fa-angle-right"></i>
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- VISTA: TIPIFICACIONES -->
    <transition name="fade" mode="out-in">
      <div v-if="vistaActiva === 'tipificaciones'" key="tipificaciones">
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body p-4">
            <div class="row g-3 align-items-end">
              <div class="col-md-4">
                <label class="form-label font-weight-bold text-xs text-uppercase text-muted">Fecha Inicio</label>
                <input type="date" class="form-control rounded-3" v-model="fechaInicioTipif">
              </div>
              <div class="col-md-4">
                <label class="form-label font-weight-bold text-xs text-uppercase text-muted">Fecha Fin</label>
                <input type="date" class="form-control rounded-3" v-model="fechaFinTipif">
              </div>
              <div class="col-md-4">
                <button class="btn btn-primary w-100 mb-0 shadow-sm" @click="buscarTipificaciones" :disabled="loading || !fechaInicioTipif || !fechaFinTipif">
                  <i class="fas fa-search me-2"></i> Buscar Reportes
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-lg">
          <div class="card-header border-bottom bg-white p-4 d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-0 font-weight-bold">Historial de Tipificaciones</h5>
              <p class="text-sm text-muted mb-0">Registros del {{ formatFecha(fechaInicioTipif) }} al {{ formatFecha(fechaFinTipif) }}</p>
            </div>
            <button class="btn btn-outline-success btn-sm mb-0" @click="exportarTipificacionesCSV" :disabled="tipificaciones.length === 0">
              <i class="fas fa-download me-1"></i> CSV
            </button>
          </div>
          
          <div class="table-responsive">
            <table class="table align-items-center mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-4">Fecha</th>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Agente</th>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Cliente</th>
                  <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Categorización</th>
                  <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Duración</th>
                </tr>
              </thead>
              <tbody v-if="!loading && tipificaciones.length > 0">
                <tr v-for="tipif in tipificaciones" :key="tipif._id">
                  <td class="ps-4">
                    <div class="d-flex flex-column">
                      <span class="text-sm font-weight-bold text-dark">{{ formatFecha(tipif.fecha) }}</span>
                      <span class="text-xs text-secondary">{{ formatHora(tipif.fecha) }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="text-sm font-weight-bold">{{ tipif.agente?.nombre || 'Sistema' }}</span>
                  </td>
                  <td>
                    <div class="d-flex flex-column">
                      <span class="text-sm font-weight-bold">{{ getNombreCompleto(tipif.cliente) }}</span>
                      <span class="text-xs text-secondary">{{ tipif.cliente?.cedula }}</span>
                    </div>
                  </td>
                  <td class="align-middle text-center">
                    <span class="badge bg-light text-dark border mb-1 d-block mx-auto w-auto" style="max-width: 150px;">{{ tipif.nivel1 }}</span>
                    <span class="text-xs text-secondary d-block">{{ tipif.nivel2 }}</span>
                  </td>
                  <td class="align-middle text-center">
                    <span class="text-xs font-weight-bold">{{ tipif.duracionMinutos || 0 }} min</span>
                  </td>
                </tr>
              </tbody>
              <tbody v-else-if="loading">
                <tr>
                  <td colspan="5" class="text-center py-5"><div class="spinner-border text-primary"></div></td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td colspan="5" class="text-center py-5 text-secondary">No hay tipificaciones para mostrar en este rango.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal CRM -->
    <ClienteCRM
      v-if="clienteSeleccionado"
      :cliente="clienteSeleccionado"
      @cerrar="clienteSeleccionado = null"
      @cliente-actualizado="handleClienteActualizado"
    />
  </div>
</template>

<script>
import axios from 'axios';
import ClienteCRM from '@/components/ClienteCRM.vue';
import { mqttService } from '@/router/services/mqttService';

export default {
  name: 'Reportes',
  components: {
    ClienteCRM
  },
  data() {
    return {
      vistaActiva: 'clientes',
      textoBusqueda: '',
      limitePorPagina: 50,
      paginaActual: 1,
      clientes: [],
      totalClientes: 0,
      loading: false,
      clienteSeleccionado: null,
      debounceTimer: null,
      
      // Tipificaciones
      fechaInicioTipif: '',
      fechaFinTipif: '',
      tipificaciones: [],
      totalTipificaciones: 0,
      mqttTopicTipif: '',
      mqttCallbackTipif: null,
    };
  },
  computed: {
    totalPaginas() {
      return Math.ceil(this.totalClientes / this.limitePorPagina);
    }
  },
  async mounted() {
    await this.buscarClientes();
    await this.setupMQTTTipificaciones();
  },
  beforeUnmount() {
    if (this.mqttTopicTipif && this.mqttCallbackTipif) {
      mqttService.off(this.mqttTopicTipif, this.mqttCallbackTipif);
    }
    clearTimeout(this.debounceTimer);
  },
  methods: {
    cambiarVista(vista) {
      this.vistaActiva = vista;
      if (vista === 'clientes' && this.clientes.length === 0) this.buscarClientes();
    },
    debounceBusqueda() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.paginaActual = 1;
        this.buscarClientes();
      }, 500);
    },
    limpiarBusqueda() {
      this.textoBusqueda = '';
      this.paginaActual = 1;
      this.buscarClientes();
    },
    async buscarClientes() {
      this.loading = true;
      try {
        const params = {
          limite: this.limitePorPagina,
          offset: (this.paginaActual - 1) * this.limitePorPagina,
          ordenar: 'fechaUltimaInteraccion',
          direccion: 'desc',
          q: this.textoBusqueda
        };
        const response = await axios.get('/api/crm/clientes', { params });
        if (response.data.success) {
          this.clientes = response.data.clientes || [];
          this.totalClientes = response.data.total || 0;
        } else {
          this.clientes = [];
          this.totalClientes = 0;
        }
      } catch (error) {
        console.error('Error:', error);
        this.clientes = [];
      } finally {
        this.loading = false;
      }
    },
    irAPagina(pagina) {
      if (pagina >= 1 && pagina <= this.totalPaginas) {
        this.paginaActual = pagina;
        this.buscarClientes();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    async setupMQTTTipificaciones() {
      try {
        const userId = this.$store.state.user?.id || this.$store.state.user?._id;
        if (!userId) return;
        this.mqttTopicTipif = `crm/tipificaciones/resultado/${userId}`;
        if (!mqttService.isConnected) {
          await mqttService.connect('ws://localhost:9001', userId, this.$store.state.user?.name);
        }
        this.mqttCallbackTipif = (data) => this.handleResultadosTipificaciones(data);
        mqttService.on(this.mqttTopicTipif, this.mqttCallbackTipif);
      } catch (e) { console.error(e); }
    },
    async buscarTipificaciones() {
      this.loading = true;
      this.tipificaciones = [];
      try {
        const userId = this.$store.state.user?.id || this.$store.state.user?._id;
        mqttService.publish(`crm/tipificaciones/buscar/fechas/${userId}`, {
          fechaInicio: this.fechaInicioTipif,
          fechaFin: this.fechaFinTipif,
          page: 1, limit: 100, timestamp: new Date().toISOString()
        });
      } catch (e) { this.loading = false; }
    },
    handleResultadosTipificaciones(data) {
      this.loading = false;
      if (data.success) {
        this.tipificaciones = data.tipificaciones || [];
        this.totalTipificaciones = data.total || 0;
      }
    },
    async verDetalles(cliente) {
      try {
        // Cargar cliente completo con sus interacciones desde el endpoint
        const response = await axios.get(`/api/crm/cliente/${cliente.cedula}`);
        if (response.data.success && response.data.cliente) {
          this.clienteSeleccionado = response.data.cliente;
        } else {
          // Fallback: usar el cliente que ya tenemos
          this.clienteSeleccionado = cliente;
        }
      } catch (error) {
        console.error('Error cargando cliente completo:', error);
        // Fallback: usar el cliente que ya tenemos
        this.clienteSeleccionado = cliente;
      }
    },
    handleClienteActualizado(datos) {
      const idx = this.clientes.findIndex(c => c.cedula === datos.cedula);
      if (idx !== -1) {
        this.clientes[idx] = { ...this.clientes[idx], ...datos };
        this.clienteSeleccionado = this.clientes[idx];
      }
    },
    getNombreCompleto(c) { return c ? `${c.nombres || ''} ${c.apellidos || ''}`.trim() || 'Sin nombre' : '-'; },
    formatFecha(f) { if(!f) return '-'; const d = new Date(f); return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`; },
    formatHora(f) { if(!f) return '-'; const d = new Date(f); return d.toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'}); },
    exportarCSV() {
      if (this.clientes.length === 0) return;
      
      const headers = [
        'Cédula', 'Tipo Documento', 'Nombres', 'Apellidos', 'Teléfono',
        'Correo', 'Ciudad', 'Departamento', 'Total Interacciones',
        'Última Interacción'
      ];
      
      const rows = this.clientes.map(c => [
        c.cedula || '',
        c.tipoDocumento || '',
        c.nombres || '',
        c.apellidos || '',
        c.telefono || '',
        c.correo || '',
        c.ciudad || '',
        c.departamento || '',
        c.totalInteracciones || 0,
        this.formatFecha(c.fechaUltimaInteraccion) + ' ' + this.formatHora(c.fechaUltimaInteraccion)
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(field => `"${String(field)}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const fecha = new Date().toISOString().slice(0, 10);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_crm_${fecha}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    exportarTipificacionesCSV() {
      if (this.tipificaciones.length === 0) return;
      
      const headers = [
        'Fecha', 'Hora', 'Agente', 'Cédula Cliente', 'Nombre Cliente',
        'Teléfono', 'Nivel 1', 'Nivel 2', 'Nivel 3', 'Duración (min)'
      ];
      
      const rows = this.tipificaciones.map(t => [
        this.formatFecha(t.fecha),
        this.formatHora(t.fecha),
        t.agente?.nombre || '',
        t.cliente?.cedula || '',
        this.getNombreCompleto(t.cliente),
        t.cliente?.telefono || '',
        t.nivel1 || '',
        t.nivel2 || '',
        t.nivel3 || '',
        t.duracionMinutos || 0
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(field => `"${String(field)}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const fecha = new Date().toISOString().slice(0, 10);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `tipificaciones_${this.fechaInicioTipif}_${this.fechaFinTipif}_${fecha}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(87deg, #5e72e4 0, #825ee4 100%) !important;
}
.bg-gradient-info {
  background: linear-gradient(87deg, #11cdef 0, #1171ef 100%) !important;
}
.nav-pills .nav-link.active {
  background-color: #fff;
  color: #5e72e4;
  box-shadow: 0 4px 6px rgba(50,50,93,.11), 0 1px 3px rgba(0,0,0,.08);
}
.transition-base {
  transition: all .2s ease;
}
.transition-base:hover {
  transform: translateY(-2px);
  background-color: #f8f9fe;
}
.input-group-text {
  border-right: 0;
}
.input-group .form-control {
  border-left: 0;
  box-shadow: none;
}
.input-group .form-control:focus {
  border-color: #dee2e6;
}
.table thead th {
  border-bottom: 1px solid #e9ecef;
  background-color: #f6f9fc;
}
.table td, .table th {
  vertical-align: middle;
  border-top: 1px solid #e9ecef;
}
.card {
  box-shadow: 0 0 2rem 0 rgba(136, 152, 170, .15);
}
</style>
