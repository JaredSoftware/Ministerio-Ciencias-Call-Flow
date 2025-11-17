<template>
  <div class="reportes-container bg-white">
    <h2 class="reportes-title text-dark">📊 Consulta de Clientes CRM</h2>
    
    <!-- SELECTOR DE TIPO DE BÚSQUEDA -->
    <div class="tipo-busqueda">
      <button 
        @click="tipoBusqueda = 'cedula'" 
        :class="['btn-tipo', { active: tipoBusqueda === 'cedula' }]"
      >
        🔍 Buscar por Cédula
      </button>
      <button 
        @click="tipoBusqueda = 'fechas'" 
        :class="['btn-tipo', { active: tipoBusqueda === 'fechas' }]"
      >
        📅 Clientes por Fechas
      </button>
      <button 
        @click="tipoBusqueda = 'tipificaciones'" 
        :class="['btn-tipo', { active: tipoBusqueda === 'tipificaciones' }]"
      >
        📊 Tipificaciones por Fechas
      </button>
    </div>
    
    <!-- FILTRO POR CÉDULA -->
    <div v-if="tipoBusqueda === 'cedula'" class="filtros-cedula">
      <div class="filtro-grupo">
        <label class="filtro-label text-dark">
          <i class="ni ni-badge icono-filtro"></i>
          Cédula del Cliente
        </label>
        <input 
          type="text" 
          v-model="cedulaBusqueda" 
          class="input-filtro bg-white text-dark"
          placeholder="Ingrese la cédula..."
          @keyup.enter="buscarClientes"
        />
      </div>
      <button class="btn-buscar" @click="buscarClientes" :disabled="!cedulaBusqueda">
        <i class="ni ni-zoom-split-in"></i>
        Buscar
      </button>
    </div>
    
    <!-- FILTRO POR FECHAS (Clientes) -->
    <div v-if="tipoBusqueda === 'fechas'" class="filtros-fechas">
      <div class="filtro-grupo">
        <label class="filtro-label text-dark">
          <i class="ni ni-calendar-grid-58 icono-filtro"></i>
          Fecha Inicio
        </label>
        <input 
          type="date" 
          v-model="fechaInicio" 
          class="input-filtro bg-white text-dark"
        />
      </div>
      <div class="filtro-grupo">
        <label class="filtro-label text-dark">
          <i class="ni ni-calendar-grid-58 icono-filtro"></i>
          Fecha Fin
        </label>
        <input 
          type="date" 
          v-model="fechaFin" 
          class="input-filtro bg-white text-dark"
        />
      </div>
      <button class="btn-buscar" @click="buscarClientes" :disabled="!fechaInicio || !fechaFin">
        <i class="ni ni-zoom-split-in"></i>
        Buscar
      </button>
    </div>
    
    <!-- FILTRO POR TIPIFICACIONES -->
    <div v-if="tipoBusqueda === 'tipificaciones'" class="filtros-fechas">
      <div class="filtro-grupo">
        <label class="filtro-label text-dark">
          <i class="ni ni-calendar-grid-58 icono-filtro"></i>
          Fecha Inicio
        </label>
        <input 
          type="date" 
          v-model="fechaInicioTipif" 
          class="input-filtro bg-white text-dark"
        />
      </div>
      <div class="filtro-grupo">
        <label class="filtro-label text-dark">
          <i class="ni ni-calendar-grid-58 icono-filtro"></i>
          Fecha Fin
        </label>
        <input 
          type="date" 
          v-model="fechaFinTipif" 
          class="input-filtro bg-white text-dark"
        />
      </div>
      <button class="btn-buscar" @click="buscarTipificaciones" :disabled="!fechaInicioTipif || !fechaFinTipif">
        <i class="ni ni-zoom-split-in"></i>
        Buscar Tipificaciones
      </button>
    </div>
    
    <!-- LOADING -->
    <div v-if="loading" class="loading-estado text-dark">
      <div class="spinner"></div>
      Buscando clientes...
    </div>
    
    <!-- RESULTADOS DE CLIENTES -->
    <div v-if="!loading && tipoBusqueda !== 'tipificaciones' && clientes.length > 0" class="resultados-container">
      <div class="resultados-header">
        <h4 class="text-dark">
          📋 Resultados: {{ clientes.length }} cliente{{ clientes.length > 1 ? 's' : '' }} encontrado{{ clientes.length > 1 ? 's' : '' }}
        </h4>
        <button class="btn-exportar" @click="exportarCSV">
          <i class="ni ni-archive-2"></i>
          Exportar CSV
        </button>
      </div>
      
      <!-- TABLA DE CLIENTES -->
      <div class="tabla-scroll">
        <table class="tabla-clientes bg-white">
          <thead>
            <tr>
              <th class="text-dark">Cédula</th>
              <th class="text-dark">Tipo Documento</th>
              <th class="text-dark">Nombres</th>
              <th class="text-dark">Apellidos</th>
              <th class="text-dark">Teléfono</th>
              <th class="text-dark">Correo</th>
              <th class="text-dark">Ciudad</th>
              <th class="text-dark">Total Interacciones</th>
              <th class="text-dark">Última Interacción</th>
              <th class="text-dark">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cliente in clientes" :key="cliente._id" class="fila-cliente">
              <td class="text-dark"><b>{{ cliente.cedula }}</b></td>
              <td class="text-dark">{{ cliente.tipoDocumento || 'No especificado' }}</td>
              <td class="text-dark">{{ cliente.nombres || '-' }}</td>
              <td class="text-dark">{{ cliente.apellidos || '-' }}</td>
              <td class="text-dark">{{ cliente.telefono || '-' }}</td>
              <td class="text-dark">{{ cliente.correo || '-' }}</td>
              <td class="text-dark">{{ cliente.ciudad || '-' }}</td>
              <td class="text-dark">
                <span class="badge-interacciones">{{ cliente.totalInteracciones || 0 }}</span>
              </td>
              <td class="text-dark">{{ formatFecha(cliente.fechaUltimaInteraccion) }}</td>
              <td>
                <button class="btn-detalle" @click="verDetalles(cliente)">
                  <i class="ni ni-bold-right"></i>
                  Ver Detalles
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- PAGINACIÓN -->
      <div v-if="hasMore && !loading" class="paginacion">
        <button class="btn-cargar-mas" @click="cargarMas">
          <i class="ni ni-bold-down"></i>
          Cargar Más ({{ clientes.length }} de {{ totalClientes }})
        </button>
      </div>
      
      <div v-if="totalClientes > 0" class="total-info text-dark">
        Mostrando {{ clientes.length }} de {{ totalClientes }} clientes
      </div>
    </div>
    
    <!-- RESULTADOS DE TIPIFICACIONES -->
    <div v-if="!loading && tipoBusqueda === 'tipificaciones' && tipificaciones.length > 0" class="resultados-container">
      <div class="resultados-header">
        <h4 class="text-dark">
          📊 Resultados: {{ tipificaciones.length }} tipificación{{ tipificaciones.length > 1 ? 'es' : '' }} encontrada{{ tipificaciones.length > 1 ? 's' : '' }}
        </h4>
        <button class="btn-exportar" @click="exportarTipificacionesCSV">
          <i class="ni ni-archive-2"></i>
          Exportar CSV
        </button>
      </div>
      
      <!-- TABLA DE TIPIFICACIONES -->
      <div class="tabla-scroll">
        <table class="tabla-clientes bg-white">
          <thead>
            <tr>
              <th class="text-dark">Fecha</th>
              <th class="text-dark">Hora</th>
              <th class="text-dark">Agente</th>
              <th class="text-dark">Cédula Cliente</th>
              <th class="text-dark">Nombre Cliente</th>
              <th class="text-dark">Teléfono</th>
              <th class="text-dark">Nivel 1</th>
              <th class="text-dark">Nivel 2</th>
              <th class="text-dark">Nivel 3</th>
              <th class="text-dark">Observaciones</th>
              <th class="text-dark">Duración (min)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tipif in tipificaciones" :key="tipif._id" class="fila-cliente">
              <td class="text-dark"><b>{{ formatFecha(tipif.fecha) }}</b></td>
              <td class="text-dark">{{ formatHora(tipif.fecha) }}</td>
              <td class="text-dark">{{ tipif.agente?.nombre || '-' }}</td>
              <td class="text-dark"><b>{{ tipif.cliente?.cedula || '-' }}</b></td>
              <td class="text-dark">{{ getNombreCompleto(tipif.cliente) }}</td>
              <td class="text-dark">{{ tipif.cliente?.telefono || '-' }}</td>
              <td class="text-dark">
                <span class="badge-nivel1">{{ tipif.nivel1 || '-' }}</span>
              </td>
              <td class="text-dark">{{ tipif.nivel2 || '-' }}</td>
              <td class="text-dark">{{ tipif.nivel3 || '-' }}</td>
              <td class="text-dark">
                <div class="observaciones-cell">{{ tipif.observaciones || '-' }}</div>
              </td>
              <td class="text-dark">
                <span class="badge-duracion">{{ tipif.duracionMinutos || 0 }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- PAGINACIÓN TIPIFICACIONES -->
      <div v-if="hasMoreTipif && !loading" class="paginacion">
        <button class="btn-cargar-mas" @click="cargarMasTipificaciones">
          <i class="ni ni-bold-down"></i>
          Cargar Más ({{ tipificaciones.length }} de {{ totalTipificaciones }})
        </button>
      </div>
      
      <div v-if="totalTipificaciones > 0" class="total-info text-dark">
        Mostrando {{ tipificaciones.length }} de {{ totalTipificaciones }} tipificaciones
      </div>
    </div>
    
    <!-- SIN RESULTADOS -->
    <div v-if="!loading && busquedaRealizada && clientes.length === 0 && tipificaciones.length === 0" class="sin-resultados">
      <i class="ni ni-fat-remove icono-sin-resultados"></i>
      <p class="text-dark">No se encontraron clientes con los criterios especificados</p>
    </div>
    
    <!-- 🎯 COMPONENTE CRM DEL CLIENTE -->
    <ClienteCRM
      v-if="clienteSeleccionado"
      :cliente="clienteSeleccionado"
      @cerrar="clienteSeleccionado = null"
      @cliente-actualizado="handleClienteActualizado"
    />
  </div>
</template>

<script>
import { mqttService } from '@/router/services/mqttService';
import ClienteCRM from '@/components/ClienteCRM.vue';

export default {
  name: 'Reportes',
  components: {
    ClienteCRM
  },
  data() {
    return {
      tipoBusqueda: 'cedula', // 'cedula', 'fechas' o 'tipificaciones'
      cedulaBusqueda: '',
      fechaInicio: '',
      fechaFin: '',
      fechaInicioTipif: '',
      fechaFinTipif: '',
      clientes: [],
      tipificaciones: [],
      loading: false,
      busquedaRealizada: false,
      clienteSeleccionado: null,
      mqttTopic: '',
      mqttCallback: null,
      mqttTopicTipif: '',
      mqttCallbackTipif: null,
      currentPage: 1,
      totalClientes: 0,
      hasMore: false,
      currentPageTipif: 1,
      totalTipificaciones: 0,
      hasMoreTipif: false
    };
  },
  async mounted() {
    await this.setupMQTT();
  },
  beforeUnmount() {
    // Limpiar listeners MQTT
    if (this.mqttTopic && this.mqttCallback) {
      mqttService.off(this.mqttTopic, this.mqttCallback);
    }
    if (this.mqttTopicTipif && this.mqttCallbackTipif) {
      mqttService.off(this.mqttTopicTipif, this.mqttCallbackTipif);
    }
  },
  methods: {
    async setupMQTT() {
      try {
        const userId = this.$store.state.user?.id || this.$store.state.user?._id;
        if (!userId) {
          console.warn('⚠️ No hay usuario para configurar MQTT');
          return;
        }
        
        this.mqttTopic = `crm/clientes/resultado/${userId}`;
        this.mqttTopicTipif = `crm/tipificaciones/resultado/${userId}`;
        
        // Asegurar conexión MQTT
        if (!mqttService.isConnected) {
          await mqttService.connect('ws://localhost:9001', userId, this.$store.state.user?.name);
        }
        
        // Callback para resultados de clientes
        this.mqttCallback = (data) => {
          this.handleResultados(data);
        };
        
        // Callback para resultados de tipificaciones
        this.mqttCallbackTipif = (data) => {
          this.handleResultadosTipificaciones(data);
        };
        
        mqttService.on(this.mqttTopic, this.mqttCallback);
        mqttService.on(this.mqttTopicTipif, this.mqttCallbackTipif);
        
      } catch (error) {
        console.error('❌ Error configurando MQTT:', error);
      }
    },
    
    async buscarClientes() {
      this.loading = true;
      this.busquedaRealizada = false;
      this.clientes = [];
      this.currentPage = 1;
      
      try {
        const userId = this.$store.state.user?.id || this.$store.state.user?._id;
        
        
        if (!userId) {
          alert('❌ Debes iniciar sesión para buscar clientes');
          this.loading = false;
          return;
        }
        
        if (this.tipoBusqueda === 'cedula') {
          // 📡 Publicar solicitud por MQTT - Búsqueda por cédula
          const topicBusqueda = `crm/clientes/buscar/cedula/${userId}`;
          mqttService.publish(topicBusqueda, {
            cedula: this.cedulaBusqueda,
            timestamp: new Date().toISOString()
          });
        } else {
          // 📡 Publicar solicitud por MQTT - Búsqueda por fechas
          const topicBusqueda = `crm/clientes/buscar/fechas/${userId}`;
          mqttService.publish(topicBusqueda, {
            fechaInicio: this.fechaInicio,
            fechaFin: this.fechaFin,
            page: this.currentPage,
            limit: 50,
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (error) {
        console.error('❌ Error solicitando búsqueda:', error);
        this.loading = false;
        this.busquedaRealizada = true;
      }
    },
    
    async buscarTipificaciones() {
      this.loading = true;
      this.busquedaRealizada = false;
      this.tipificaciones = [];
      this.currentPageTipif = 1;
      
      try {
        const userId = this.$store.state.user?.id || this.$store.state.user?._id;
        
        
        if (!userId) {
          alert('❌ Debes iniciar sesión para buscar tipificaciones');
          this.loading = false;
          return;
        }
        
        // 📡 Publicar solicitud por MQTT - Búsqueda de tipificaciones por fechas
        const topicBusqueda = `crm/tipificaciones/buscar/fechas/${userId}`;
        mqttService.publish(topicBusqueda, {
          fechaInicio: this.fechaInicioTipif,
          fechaFin: this.fechaFinTipif,
          page: this.currentPageTipif,
          limit: 100,
          timestamp: new Date().toISOString()
        });
        
        
      } catch (error) {
        console.error('❌ Error solicitando búsqueda de tipificaciones:', error);
        this.loading = false;
        this.busquedaRealizada = true;
      }
    },
    
    handleResultados(data) {
      this.loading = false;
      this.busquedaRealizada = true;
      
      if (data.success && data.clientes) {
        if (data.page === 1) {
          this.clientes = data.clientes;
        } else {
          this.clientes.push(...data.clientes);
        }
        
        this.totalClientes = data.total || data.count;
        this.hasMore = data.hasMore || false;
        
      } else {
        this.clientes = [];
        this.totalClientes = 0;
      }
    },
    
    handleResultadosTipificaciones(data) {
      this.loading = false;
      this.busquedaRealizada = true;
      
      if (data.success && data.tipificaciones) {
        if (data.page === 1) {
          this.tipificaciones = data.tipificaciones;
        } else {
          this.tipificaciones.push(...data.tipificaciones);
        }
        
        this.totalTipificaciones = data.total || data.count;
        this.hasMoreTipif = data.hasMore || false;
        
      } else {
        this.tipificaciones = [];
        this.totalTipificaciones = 0;
      }
    },
    
    async cargarMas() {
      if (!this.hasMore || this.loading) return;
      
      this.currentPage++;
      this.loading = true;
      
      const userId = this.$store.state.user?.id || this.$store.state.user?._id;
      
      // 📡 Publicar solicitud de siguiente página por MQTT
      const topicBusqueda = `crm/clientes/buscar/fechas/${userId}`;
      mqttService.publish(topicBusqueda, {
        fechaInicio: this.fechaInicio,
        fechaFin: this.fechaFin,
        page: this.currentPage,
        limit: 50,
        timestamp: new Date().toISOString()
      });
      
    },
    
    async cargarMasTipificaciones() {
      if (!this.hasMoreTipif || this.loading) return;
      
      this.currentPageTipif++;
      this.loading = true;
      
      const userId = this.$store.state.user?.id || this.$store.state.user?._id;
      
      // 📡 Publicar solicitud de siguiente página por MQTT
      const topicBusqueda = `crm/tipificaciones/buscar/fechas/${userId}`;
      mqttService.publish(topicBusqueda, {
        fechaInicio: this.fechaInicioTipif,
        fechaFin: this.fechaFinTipif,
        page: this.currentPageTipif,
        limit: 100,
        timestamp: new Date().toISOString()
      });
      
    },
    
    verDetalles(cliente) {
      this.clienteSeleccionado = cliente;
    },
    
    handleClienteActualizado(datosActualizados) {
      // Actualizar el cliente en la lista
      const index = this.clientes.findIndex(c => c.cedula === datosActualizados.cedula);
      if (index !== -1) {
        this.clientes[index] = { ...this.clientes[index], ...datosActualizados };
        this.clienteSeleccionado = this.clientes[index];
      }
    },
    
    exportarCSV() {
      if (this.clientes.length === 0) return;
      
      // Crear CSV
      const headers = [
        'Cédula',
        'Tipo Documento',
        'Nombres',
        'Apellidos',
        'Teléfono',
        'Correo',
        'País',
        'Departamento',
        'Ciudad',
        'Dirección',
        'Sexo',
        'Nivel Escolaridad',
        'Grupo Étnico',
        'Discapacidad',
        'Total Interacciones',
        'Última Interacción',
        'Fecha Creación'
      ];
      
      const rows = this.clientes.map(c => [
        c.cedula || '',
        c.tipoDocumento || '',
        c.nombres || '',
        c.apellidos || '',
        c.telefono || '',
        c.correo || '',
        c.pais || '',
        c.departamento || '',
        c.ciudad || '',
        c.direccion || '',
        c.sexo || '',
        c.nivelEscolaridad || '',
        c.grupoEtnico || '',
        c.discapacidad || '',
        c.totalInteracciones || 0,
        this.formatFechaHora(c.fechaUltimaInteraccion),
        this.formatFechaHora(c.fechaCreacion)
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');
      
      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const fecha = new Date().toISOString().slice(0, 10);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_${this.tipoBusqueda}_${fecha}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    
    exportarTipificacionesCSV() {
      if (this.tipificaciones.length === 0) return;
      
      // Crear CSV
      const headers = [
        'Fecha',
        'Hora',
        'Agente',
        'Cédula Cliente',
        'Nombre Cliente',
        'Teléfono Cliente',
        'Correo Cliente',
        'Nivel 1',
        'Nivel 2',
        'Nivel 3',
        'Observaciones',
        'Duración (minutos)',
        'ID Tipificación'
      ];
      
      const rows = this.tipificaciones.map(t => [
        this.formatFecha(t.fecha),
        this.formatHora(t.fecha),
        t.agente?.nombre || '',
        t.cliente?.cedula || '',
        this.getNombreCompleto(t.cliente),
        t.cliente?.telefono || '',
        t.cliente?.correo || '',
        t.nivel1 || '',
        t.nivel2 || '',
        t.nivel3 || '',
        t.observaciones || '',
        t.duracionMinutos || 0,
        t._id || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');
      
      // Descargar archivo
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
    },
    
    getNombreCompleto(cliente) {
      if (!cliente) return '-';
      const nombres = cliente.nombres || '';
      const apellidos = cliente.apellidos || '';
      return `${nombres} ${apellidos}`.trim() || '-';
    },
    
    formatHora(f) {
      if (!f) return '-';
      const d = new Date(f);
      return d.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    formatFecha(f) {
      if (!f) return '-';
      const d = new Date(f);
      return d.toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    },
    
    formatFechaHora(f) {
      if (!f) return '-';
      const d = new Date(f);
      return d.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.reportes-container {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  margin: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}

.reportes-title {
  font-size: 2rem;
  margin-bottom: 24px;
  font-weight: 700;
  text-align: center;
}

/* TIPO DE BÚSQUEDA */
.tipo-busqueda {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
}

.btn-tipo {
  background: #e0e0e0;
  color: #666;
  border: 2px solid transparent;
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-tipo.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.btn-tipo:hover:not(.active) {
  background: #d0d0d0;
}
/* FILTROS */
.filtros-cedula, .filtros-fechas {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: flex-end;
  margin-bottom: 32px;
  background: #f8f9fa;
  padding: 24px;
  border-radius: 12px;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filtro-label {
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.icono-filtro {
  font-size: 1.1em;
  color: #1976d2;
}

.input-filtro {
  padding: 10px 16px;
  border-radius: 6px;
  border: 1.5px solid #ddd;
  font-size: 1rem;
  min-width: 250px;
  transition: all 0.2s;
}

.input-filtro:focus {
  border-color: #1976d2;
  outline: none;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.btn-buscar {
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-buscar:hover:not(:disabled) {
  background: #1565c0;
  transform: translateY(-1px);
}

.btn-buscar:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* LOADING */
.loading-estado {
  text-align: center;
  padding: 40px;
  font-size: 1.1rem;
  font-weight: 600;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* RESULTADOS */
.resultados-container {
  margin-top: 32px;
}

.resultados-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.resultados-header h4 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.btn-exportar {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-exportar:hover {
  background: #218838;
}

/* TABLA DE CLIENTES */
.tabla-scroll {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.tabla-clientes {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

.tabla-clientes thead tr {
  background: #1976d2;
}

.tabla-clientes th {
  padding: 14px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  color: white !important;
  border-bottom: 2px solid #1565c0;
}

.tabla-clientes tbody tr {
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.tabla-clientes tbody tr:hover {
  background: #f5f5f5;
}

.tabla-clientes td {
  padding: 12px;
  font-size: 0.9rem;
}

.badge-interacciones {
  background: #1976d2;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
}

.badge-nivel1 {
  background: #28a745;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.85rem;
  display: inline-block;
}

.badge-duracion {
  background: #ffc107;
  color: #000;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
}

.observaciones-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-detalle {
  background: #1976d2;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-detalle:hover {
  background: #1565c0;
}

/* SIN RESULTADOS */
.sin-resultados {
  text-align: center;
  padding: 60px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 32px;
}

.icono-sin-resultados {
  font-size: 4rem;
  color: #ccc;
  display: block;
  margin-bottom: 16px;
}

.sin-resultados p {
  font-size: 1.1rem;
  margin: 0;
}

/* PAGINACIÓN */
.paginacion {
  text-align: center;
  margin: 24px 0;
}

.btn-cargar-mas {
  background: #1976d2;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-cargar-mas:hover {
  background: #1565c0;
  transform: translateY(-1px);
}

.total-info {
  text-align: center;
  margin-top: 16px;
  font-weight: 600;
  font-size: 0.95rem;
}

/* MODAL DE DETALLES */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-detalle {
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 2px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
}

.btn-cerrar {
  background: #dc3545;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-cerrar:hover {
  background: #c82333;
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
}

.seccion-detalle {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.seccion-detalle h5 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.detalle-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detalle-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detalle-label {
  font-weight: 600;
  font-size: 0.85rem;
}

.detalle-valor {
  font-size: 0.95rem;
}

/* INTERACCIONES */
.interacciones-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.interaccion-item {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
}

.interaccion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.badge-estado-interaccion {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.badge-estado-interaccion.completada {
  background: #28a745;
}

.badge-estado-interaccion.pendiente {
  background: #ffc107;
  color: #000;
}

.badge-estado-interaccion.cancelada {
  background: #dc3545;
}

.interaccion-item p {
  margin: 4px 0;
  font-size: 0.9rem;
}

.sin-interacciones {
  text-align: center;
  padding: 20px;
  font-style: italic;
  color: #999;
}

/* MODO OSCURO */
h4.text-dark,
h5.text-dark,
h3.text-dark,
label.text-dark,
span.text-dark,
p.text-dark,
td.text-dark,
th.text-dark,
b.text-dark {
  color: #000000 !important;
}
</style> 