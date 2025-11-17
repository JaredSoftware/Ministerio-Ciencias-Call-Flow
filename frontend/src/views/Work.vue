<template>
  <div class="work-container">
    <!-- Modal para nueva tipificación -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content bg-white">
        <h4 class="text-dark">📞 Nueva Tipificación Asignada</h4>
        
        <!-- 🎯 INDICADOR CRM -->
        <div v-if="modalData.esClienteExistente" class="crm-indicator">
          <div class="crm-badge existing">
            <span class="crm-icon">👤</span>
            <span class="crm-text">Cliente Existente</span>
            <span class="crm-count">{{ modalData.totalInteracciones }} interacciones</span>
          </div>
        </div>
        <div v-else class="crm-indicator">
          <div class="crm-badge new">
            <span class="crm-icon">🆕</span>
            <span class="crm-text">Cliente Nuevo</span>
          </div>
        </div>
        
        <div class="modal-info bg-white">
          <div class="modal-info-grid">
            <div class="modal-info-section">
              <h5 class="text-dark">Información de la Llamada</h5>
              <p class="text-dark"><strong class="text-dark">ID Llamada:</strong> {{ modalData.idLlamada }}</p>
              <p class="text-dark"><strong class="text-dark">Tipo Documento:</strong> {{ modalData.tipoDocumento }}</p>
              <p class="text-dark"><strong class="text-dark">Cédula:</strong> {{ modalData.cedula }}</p>
            </div>
            <div class="modal-info-section" v-if="modalData.nombres || modalData.apellidos">
              <h5 class="text-dark">Información del Cliente</h5>
              <p class="text-dark" v-if="modalData.nombres"><strong class="text-dark">Nombres:</strong> {{ modalData.nombres }}</p>
              <p class="text-dark" v-if="modalData.apellidos"><strong class="text-dark">Apellidos:</strong> {{ modalData.apellidos }}</p>
              <p class="text-dark" v-if="modalData.telefono"><strong class="text-dark">Teléfono:</strong> {{ modalData.telefono }}</p>
              <p class="text-dark" v-if="modalData.correo"><strong class="text-dark">Correo:</strong> {{ modalData.correo }}</p>
              <!-- 🎯 INFORMACIÓN CRM ADICIONAL -->
              <div v-if="modalData.esClienteExistente" class="crm-info">
                <p><strong>Total Interacciones:</strong> {{ modalData.totalInteracciones }}</p>
                <p v-if="modalData.fechaUltimaInteraccion">
                  <strong>Última Interacción:</strong> 
                  {{ formatDate(modalData.fechaUltimaInteraccion) }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-buttons">
          <button @click="guardarModal" class="btn-accept">Aceptar</button>
          <button @click="cancelarTipificacion" class="btn-cancel">Cancelar</button>
        </div>
      </div>
    </div>

    <div v-if="tipificacionActiva" class="client-info bg-white">
      <h5 class="text-dark">INFORMACIÓN DEL CLIENTE</h5>
      <table class="client-info-table">
        <tr>
          <td class="text-dark"><b class="text-dark">ID Llamada:</b></td>
          <td class="text-dark">{{ idLlamada || 'Sin asignar' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">T. Documento:</b></td>
          <td class="text-dark">{{ tipoDocumento || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Doc. No.:</b></td>
          <td class="text-dark">{{ cedula || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Nombres:</b></td>
          <td class="text-dark">{{ nombres || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Apellidos:</b></td>
          <td class="text-dark">{{ apellidos || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Fecha Nacimiento:</b></td>
          <td class="text-dark">{{ fechaNacimiento || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">País:</b></td>
          <td class="text-dark">{{ pais || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Departamento:</b></td>
          <td class="text-dark">{{ departamento || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Ciudad:</b></td>
          <td class="text-dark">{{ ciudad || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Correo:</b></td>
          <td class="text-dark">{{ correo || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Teléfono:</b></td>
          <td class="text-dark">{{ telefono || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Dirección:</b></td>
          <td class="text-dark">{{ direccion || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Sexo:</b></td>
          <td class="text-dark">{{ sexo || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Nivel Escolaridad:</b></td>
          <td class="text-dark">{{ nivelEscolaridad || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Grupo Étnico:</b></td>
          <td class="text-dark">{{ grupoEtnico || 'No Info' }}</td>
        </tr>
        <tr>
          <td class="text-dark"><b class="text-dark">Discapacidad:</b></td>
          <td class="text-dark">{{ discapacidad || 'No Info' }}</td>
        </tr>
      </table>
      <div>
        <button class="btn-update" @click="editarCliente">Actualizar</button>
      </div>
    </div>

    <!-- MODAL PARA EDITAR CLIENTE -->
    <div v-if="mostrarModalCliente" class="modal-overlay">
      <div class="modal-content large-modal">
        <h4>Editar Información del Cliente</h4>
        <div class="client-form-grid">
          <div class="form-group">
            <label><b>ID Llamada:</b></label>
            <input v-model="clienteTemp.idLlamada" />
          </div>
          
          <div class="form-group">
            <label><b>Tipo de Identificación:</b></label>
            <select v-model="clienteTemp.tipoDocumento">
              <option value="">Seleccione...</option>
              <option value="Cédula de ciudadanía">Cédula de ciudadanía</option>
              <option value="Cédula de extranjería">Cédula de extranjería</option>
              <option value="Tarjeta de identidad">Tarjeta de identidad</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="Permiso temporal de permanencia">Permiso temporal de permanencia</option>
            </select>
          </div>
          
          <div class="form-group">
            <label><b>No. de Identificación:</b></label>
            <input v-model="clienteTemp.cedula" />
          </div>
          
          <div class="form-group">
            <label><b>Nombres:</b></label>
            <input v-model="clienteTemp.nombres" />
          </div>
          
          <div class="form-group">
            <label><b>Apellidos:</b></label>
            <input v-model="clienteTemp.apellidos" />
          </div>
          
          <div class="form-group">
            <label><b>Fecha de nacimiento:</b></label>
            <input type="date" v-model="clienteTemp.fechaNacimiento" />
          </div>
          
          <div class="form-group">
            <label><b>País de residencia:</b></label>
            <input v-model="clienteTemp.pais" />
          </div>
          
          <div class="form-group">
            <label><b>Departamento:</b></label>
            <input v-model="clienteTemp.departamento" />
          </div>
          
          <div class="form-group">
            <label><b>Ciudad:</b></label>
            <input v-model="clienteTemp.ciudad" />
          </div>
          
          <div class="form-group">
            <label><b>Correo electrónico:</b></label>
            <input type="email" v-model="clienteTemp.correo" />
          </div>
          
          <div class="form-group">
            <label><b>Teléfono de contacto:</b></label>
            <input v-model="clienteTemp.telefono" />
          </div>
          
          <div class="form-group full-width">
            <label><b>Dirección:</b></label>
            <input v-model="clienteTemp.direccion" />
          </div>
          
          <div class="form-group">
            <label><b>Sexo:</b></label>
            <select v-model="clienteTemp.sexo">
              <option value="">Seleccione...</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Intersexual">Intersexual</option>
            </select>
          </div>
          
          <div class="form-group">
            <label><b>Nivel de escolaridad:</b></label>
            <select v-model="clienteTemp.nivelEscolaridad">
              <option value="">Seleccione...</option>
              <option value="Prescolar">Prescolar</option>
              <option value="Básica primaria (1 a 5)">Básica primaria (1 a 5)</option>
              <option value="Básica Secundaria (6 a 9)">Básica Secundaria (6 a 9)</option>
              <option value="Media (10-11)">Media (10-11)</option>
              <option value="Técnico">Técnico</option>
              <option value="Tecnólogo">Tecnólogo</option>
              <option value="Universitario (pregrado)">Universitario (pregrado)</option>
              <option value="Postgrado (Especialización)">Postgrado (Especialización)</option>
              <option value="Postgrado (Maestría)">Postgrado (Maestría)</option>
              <option value="Postgrado (Doctorado)">Postgrado (Doctorado)</option>
              <option value="Postgrado (post Doctorado)">Postgrado (post Doctorado)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label><b>Grupo étnico:</b></label>
            <select v-model="clienteTemp.grupoEtnico">
              <option value="">Seleccione...</option>
              <option value="Indígena">Indígena</option>
              <option value="Raizal">Raizal</option>
              <option value="Palenquero/a">Palenquero/a</option>
              <option value="Gitano/a ROM">Gitano/a ROM</option>
              <option value="Negro/a, Mulato/a, Afrodescendiente">Negro/a, Mulato/a, Afrodescendiente</option>
              <option value="Ningún grupo étnico">Ningún grupo étnico</option>
            </select>
          </div>
          
          <div class="form-group">
            <label><b>Discapacidad:</b></label>
            <select v-model="clienteTemp.discapacidad">
              <option value="">Seleccione...</option>
              <option value="Ninguna">Ninguna</option>
              <option value="Física">Física</option>
              <option value="Visual">Visual</option>
              <option value="Auditiva">Auditiva</option>
              <option value="Múltiple">Múltiple</option>
              <option value="Intelectual - Cognitiva">Intelectual - Cognitiva</option>
              <option value="Psicosocial">Psicosocial</option>
              <option value="Sordoceguera">Sordoceguera</option>
            </select>
          </div>
        </div>
        <div style="margin-top: 16px; text-align: right;">
          <button class="btn-save" @click="guardarCliente">Guardar</button>
          <button class="btn-cancel" @click="cancelarEdicionCliente">Cancelar</button>
        </div>
      </div>
    </div>
    
    <div class="work-main bg-white">
      <div class="tipificacion-header">
        <button class="tab-active">TIPIFICACIONES</button>
      </div>
      
      <!-- Envolver el formulario principal con v-if="tipificacionActiva" -->
      <div class="tipificacion-form" v-if="tipificacionActiva">
        <h4 class="text-dark">📞 Formulario de Tipificación</h4>
        
        <div class="form-row" v-if="nivel1Options.length > 0">
          <label for="nivel1" class="text-dark">Nivel 1</label>
          <select id="nivel1" v-model="nivel1" @change="nivel2 = ''; nivel3 = ''; nivel4 = ''; nivel5 = ''" class="bg-white text-dark">
            <option value="">Selecciona una opción...</option>
            <option v-for="option in nivel1Options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <div class="form-row" v-if="nivel2Options.length > 0">
          <label for="nivel2" class="text-dark">Nivel 2</label>
          <select id="nivel2" v-model="nivel2" @change="nivel3 = ''; nivel4 = ''; nivel5 = ''" class="bg-white text-dark">
            <option value="">Selecciona una opción...</option>
            <option v-for="option in nivel2Options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <div class="form-row" v-if="nivel3Options.length > 0">
          <label for="nivel3" class="text-dark">Nivel 3</label>
          <select id="nivel3" v-model="nivel3" @change="nivel4 = ''; nivel5 = ''" class="bg-white text-dark">
            <option value="">Selecciona una opción...</option>
            <option v-for="option in nivel3Options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <div class="form-row" v-if="nivel4Options.length > 0">
          <label for="nivel4" class="text-dark">Nivel 4</label>
          <select id="nivel4" v-model="nivel4" @change="nivel5 = ''" class="bg-white text-dark">
            <option value="">Selecciona una opción...</option>
            <option v-for="option in nivel4Options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <div class="form-row" v-if="nivel5Options.length > 0">
          <label for="nivel5" class="text-dark">Nivel 5</label>
          <select id="nivel5" v-model="nivel5" class="bg-white text-dark">
            <option value="">Selecciona una opción...</option>
            <option v-for="option in nivel5Options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <div class="form-row">
          <label for="observaciones" class="text-dark">Observaciones</label>
          <textarea 
            id="observaciones" 
            v-model="observacion"
            placeholder="Escribe tus observaciones aquí..."
            rows="4"
            class="bg-white text-dark">
          </textarea>
        </div>
        
        <div class="form-actions">
          <button 
            @click="guardarTipificacion" 
            :disabled="saving || !idLlamada"
            class="btn-save">
            {{ saving ? 'Guardando...' : 'Guardar Tipificación' }}
          </button>
          <button @click="limpiarFormulario" class="btn-clear">Limpiar</button>
        </div>
      </div>
      
      <!-- MENSAJE CUANDO NO HAY FORMULARIO ACTIVO -->
      <div v-else class="no-active-form text-dark" style="text-align: center; padding: 40px;">
        <h4 class="text-dark">📋 Esperando Nueva Tipificación</h4>
        <p class="text-dark">El sistema asignará automáticamente la siguiente llamada...</p>
        <div style="margin-top: 20px;">
          <div class="loading-spinner" style="display: inline-block; width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
      </div>
    </div>
    
    <div class="work-history bg-white">
      <!-- SECCIÓN SIMPLIFICADA: ESTADO DE TRABAJO -->
      <div class="work-status-section bg-white">
        <h5 class="text-dark">📞 Estado de Trabajo</h5>
        <div class="work-status-info">
          <div v-if="!tipificacionActiva" class="waiting-status bg-white">
            <div class="waiting-icon">⏳</div>
            <div class="waiting-text">
              <h6 class="text-dark">Esperando Nueva Llamada</h6>
              <p class="text-dark">El sistema asignará automáticamente la siguiente llamada cuando esté disponible</p>
            </div>
          </div>
          <div v-else class="active-status bg-white">
            <div class="active-icon">📞</div>
            <div class="active-text">
              <h6 class="text-dark">Llamada Activa</h6>
              <p class="text-dark">Procesando tipificación actual</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- SECCIÓN EXISTENTE: HISTORIAL -->
      <div class="history-section bg-white">
        <h5 class="text-dark">📋 Historial Completado</h5>
        <div class="history-list">
          <div v-if="historial.length === 0" class="no-history text-dark">
            No hay tipificaciones completadas
          </div>
        <div v-for="(item, index) in historial" :key="item._id || index" class="history-item bg-white">
          <div class="history-header">
            <span class="history-index text-dark">{{ index + 1 }}.</span>
            <span class="history-id text-dark"><b class="text-dark">ID:</b> <span class="badge-id">{{ item.idLlamada }}</span></span>
            <span class="history-doc text-dark"><b class="text-dark">{{ item.tipoDocumento }}:</b> <span class="badge-doc">{{ item.cedula }}</span></span>
            <span v-if="item.status" :class="['badge-status',
              item.status === 'success' ? 'badge-success' :
              item.status === 'pending' ? 'badge-pending' :
              item.status === 'cancelada_por_agente' ? 'badge-cancelada' : '']">
              {{ item.status === 'success' ? 'Completada' :
                 item.status === 'pending' ? 'Pendiente' :
                 item.status === 'cancelada_por_agente' ? 'Cancelada' : item.status }}
            </span>
          </div>
          <div class="history-details">
            <p class="text-dark" v-if="item.assignedToName">
              <strong class="text-dark">👤 Agente:</strong> 
              {{ item.assignedToName }}
              <span v-if="item.assignedAgentId" class="badge-agent-id">(ID: {{ item.assignedAgentId }})</span>
            </p>
            <p class="text-dark"><strong class="text-dark">Observación:</strong> {{ item.observacion || 'Sin observaciones' }}</p>
            <p class="text-dark" v-if="item.nivel1 || item.nivel2 || item.nivel3 || item.nivel4 || item.nivel5">
              <strong class="text-dark">Niveles:</strong>
              <span class="text-dark" v-if="item.nivel1">{{ item.nivel1 }}</span>
              <span class="text-dark" v-if="item.nivel2"> &raquo; {{ item.nivel2 }}</span>
              <span class="text-dark" v-if="item.nivel3"> &raquo; {{ item.nivel3 }}</span>
              <span class="text-dark" v-if="item.nivel4"> &raquo; {{ item.nivel4 }}</span>
              <span class="text-dark" v-if="item.nivel5"> &raquo; {{ item.nivel5 }}</span>
            </p>
            <p class="text-dark"><strong class="text-dark">Fecha:</strong> <span class="badge-date">{{ formatDate(item.createdAt) }}</span></p>
          </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '@/router/services/axios';
import toastMixin from '@/mixins/toastMixin';
import { mqttService } from '@/router/services/mqttService';
import statusTypes from '@/router/services/statusTypes';
import environmentConfig from '@/config/environment';

export default {
  name: 'Work',
  mixins: [toastMixin],
  data() {
    return {
      historial: [],
      cedula: '',
      idLlamada: '',
      tipoDocumento: '',
      observacion: '',
      nivel1: '',
      nivel2: '',
      nivel3: '',
      nivel4: '',
      nivel5: '',
      arbol: [],
      showModal: false,
      modalData: {
        idLlamada: '',
        tipoDocumento: '',
        cedula: ''
      },
      saving: false,
      skipNextEvent: false,
      mqttTopic: '',
      mqttCallback: null, // Para guardar el callback y poder limpiarlo
      editandoCliente: false,
      mostrarModalCliente: false,
      // Campos del cliente
      nombres: '',
      apellidos: '',
      fechaNacimiento: '',
      pais: '',
      departamento: '',
      ciudad: '',
      correo: '',
      telefono: '',
      direccion: '',
      sexo: '',
      nivelEscolaridad: '',
      grupoEtnico: '',
      discapacidad: '',
      clienteTemp: {
        idLlamada: '',
        tipoDocumento: '',
        cedula: '',
        nombres: '',
        apellidos: '',
        fechaNacimiento: '',
        pais: '',
        departamento: '',
        ciudad: '',
        telefono: '',
        correo: '',
        direccion: '',
        sexo: '',
        nivelEscolaridad: '',
        grupoEtnico: '',
        discapacidad: ''
      },
      tipificacionActiva: false,
    };
  },
  computed: {
    nivel1Options() {
      return this.arbol || [];
    },
    nivel2Options() {
      const n1 = this.nivel1 && this.nivel1 !== '' ? this.nivel1 : null;
      if (!n1) return [];
      const node = this.arbol.find(n => n.value === n1);
      return node && node.children ? node.children : [];
    },
    nivel3Options() {
      const n2 = this.nivel2 && this.nivel2 !== '' ? this.nivel2 : null;
      if (!n2) return [];
      const node = this.nivel2Options.find(n => n.value === n2);
      return node && node.children ? node.children : [];
    },
    nivel4Options() {
      const n3 = this.nivel3 && this.nivel3 !== '' ? this.nivel3 : null;
      if (!n3) return [];
      const node = this.nivel3Options.find(n => n.value === n3);
      return node && node.children ? node.children : [];
    },
    nivel5Options() {
      const n4 = this.nivel4 && this.nivel4 !== '' ? this.nivel4 : null;
      if (!n4) return [];
      const node = this.nivel4Options.find(n => n.value === n4);
      return node && node.children ? node.children : [];
    }
  },
  methods: {
    guardarModal() {
      this.idLlamada = this.modalData.idLlamada;
      this.tipoDocumento = this.modalData.tipoDocumento;
      this.cedula = this.modalData.cedula;
      this.showModal = false;
      
      // ✅ ACTIVAR FORMULARIO DESPUÉS DE ACEPTAR MODAL
      this.tipificacionActiva = true;
    },
    
    // Método para inicializar el árbol - SIN HARDCODE, espera MQTT
    initializeArbol() {
      // ❌ NO HARDCODE - El árbol viene SOLO por MQTT
      this.arbol = [];
    },
    
    // Método para cargar historial (fallback)
    loadHistorial() {
      // Inicializar historial vacío
      // El historial real se recibirá por MQTT
      this.historial = [];
    },
    
    // Método para limpiar el formulario
    limpiarFormulario() {
      this.nivel1 = '';
      this.nivel2 = '';
      this.nivel3 = '';
      this.nivel4 = '';
      this.nivel5 = '';
      this.observacion = '';
    },
    
    // Método para formatear fechas
    formatDate(date) {
      if (!date) return 'No disponible';
      try {
        const d = new Date(date);
        return d.toLocaleString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return 'Fecha inválida';
      }
    },
    
    async guardarTipificacion() {
      this.saving = true;
      try {
        // Función para obtener el label de un nivel
        const getLabel = (options, value) => {
          const found = options.find(opt => opt.value === value);
          return found ? found.label : value;
        };
        
        // Llamar al endpoint de actualización con body parameters
        // Nota: axios ya tiene /api/ en baseURL, así que no debemos duplicarlo
        const response = await axios.post('/tipificacion/actualizar', {
          idLlamada: this.idLlamada || '',
          cedula: this.cedula || '',
          tipoDocumento: this.tipoDocumento || '',
          observacion: this.observacion || '',
          // Campos del cliente
          nombres: this.nombres || '',
          apellidos: this.apellidos || '',
          fechaNacimiento: this.fechaNacimiento || '',
          pais: this.pais || '',
          departamento: this.departamento || '',
          ciudad: this.ciudad || '',
          telefono: this.telefono || '',
          correo: this.correo || '',
          direccion: this.direccion || '',
          sexo: this.sexo || '',
          nivelEscolaridad: this.nivelEscolaridad || '',
          grupoEtnico: this.grupoEtnico || '',
          discapacidad: this.discapacidad || '',
          // Niveles de tipificación
          nivel1: getLabel(this.nivel1Options, this.nivel1) || '',
          nivel2: getLabel(this.nivel2Options, this.nivel2) || '',
          nivel3: getLabel(this.nivel3Options, this.nivel3) || '',
          nivel4: getLabel(this.nivel4Options, this.nivel4) || '',
          nivel5: getLabel(this.nivel5Options, this.nivel5) || '',
          // Usuario asignado
          assignedTo: this.$store.state.user?._id || this.$store.state.user?.id || '',
          // Historial y árbol
          historial: this.historial,
          arbol: this.arbol
        });
        if (response.data.success) {
          // Limpiar campos y cerrar formulario/modal
          this.nivel1 = '';
          this.nivel2 = '';
          this.nivel3 = '';
          this.nivel4 = '';
          this.nivel5 = '';
          this.observacion = '';
          this.idLlamada = '';
          this.cedula = '';
          this.tipoDocumento = '';
          this.nombres = '';
          this.apellidos = '';
          this.fechaNacimiento = '';
          this.pais = '';
          this.departamento = '';
          this.ciudad = '';
          this.telefono = '';
          this.correo = '';
          this.direccion = '';
          this.sexo = '';
          this.nivelEscolaridad = '';
          this.grupoEtnico = '';
          this.discapacidad = '';
          this.historial = [];
          this.arbol = [];
          this.tipificacionActiva = false;
          this.showModal = false;
          this.skipNextEvent = true;
          
          // 🔥 IMPORTANTE: Limpiar la tipificación pendiente del store para evitar que vuelva a aparecer
          this.$store.commit('clearPendingTipificacion');
          
          this.showToast('Tipificación guardada correctamente', 'success');
        } else {
          this.showToast('Error al guardar la tipificación', 'error');
        }
      } catch (e) {
        this.showToast('Error al guardar la tipificación', 'error');
      } finally {
        this.saving = false;
      }
    },
         async setupMQTT() {
       try {
         
         // Obtener el userId del store
         const userId = this.$store.state.user?.id || this.$store.state.user?._id;
         
         if (!userId) {
           console.warn('⚠️⚠️⚠️ NO SE PUEDE CONFIGURAR MQTT SIN USERID');
           return;
         }
         
         // Configurar topic personalizado para este usuario
         this.mqttTopic = `telefonia/tipificacion/nueva/${userId}`;
         
         // Asegurar que MQTT esté conectado
         if (!mqttService.isConnected) {
           try {
             // Usar configuración dinámica para MQTT
             const mqttUrl = environmentConfig.getMQTTBrokerUrl();
             await mqttService.connect(mqttUrl, userId, this.$store.state.user?.name);
           } catch (error) {
             console.error('❌ Error conectando MQTT Service:', error);
             // Reintentar en 3 segundos
             setTimeout(() => {
               this.setupMQTT();
             }, 3000);
             return;
           }
         }
         
         
         // Limpiar listener anterior si existe
         if (this.mqttCallback) {
           mqttService.off(this.mqttTopic, this.mqttCallback);
         }
         
        // Crear callback para nueva tipificación
        this.mqttCallback = (data) => {
          const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
          const callbackLog = `${timestamp} 🔔 [WORK] CALLBACK_DIRECTO_MQTT | topic:${this.mqttTopic} | idLlamada:${data?.idLlamada || 'N/A'}`;
          console.log(callbackLog);
          console.log('📦 [WORK] Datos recibidos en callback directo:', JSON.stringify(data, null, 2));
          
          // Procesar directamente (no usar store, procesar inmediatamente)
          this.handleNuevaTipificacion(data);
        };
        
        // Suscribirse al topic personalizado del usuario
        console.log(`📡 [WORK] Suscribiéndose al topic: ${this.mqttTopic}`);
        mqttService.on(this.mqttTopic, this.mqttCallback);
         
         
      } catch (error) {
        console.error('❌❌❌ ERROR CONFIGURANDO MQTT:', error);
      }
    },
    
    handleNuevaTipificacion(data) {
      // 🚨 LOG DE RECEPCIÓN DE TIPIFICACIÓN
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const logLine = `${timestamp} ✅ [FRONTEND] TIPIFICACION_RECIBIDA | idLlamada:${data.idLlamada || 'N/A'} | cedula:${data.cedula || 'N/A'} | assignedTo:${data.assignedTo || 'N/A'} | topic:telefonia/tipificacion/nueva/${this.$store.state.user?._id || 'N/A'}`;
      console.log(logLine);
      
      try {
        // 🚨 VALIDACIÓN: NO PROCESAR SI ES LA MISMA TIPIFICACIÓN QUE YA ESTÁ ACTIVA
        if (this.tipificacionActiva && this.idLlamada && this.idLlamada === data.idLlamada) {
          const duplicateLog = `${timestamp} ⚠️ [FRONTEND] TIPIFICACION_DUPLICADA_IGNORADA | idLlamada:${data.idLlamada || 'N/A'}`;
          console.warn(duplicateLog);
          return;
        }
        
        // 🚨 VALIDACIÓN: NO PROCESAR SI LA TIPIFICACIÓN YA FUE GUARDADA
        if (data.status === 'success') {
          const alreadySavedLog = `${timestamp} ⚠️ [FRONTEND] TIPIFICACION_YA_GUARDADA_IGNORADA | idLlamada:${data.idLlamada || 'N/A'}`;
          console.warn(alreadySavedLog);
          return;
        }
        // Procesar árbol de tipificaciones si existe
        if (data.arbol) {
          data.arbol.forEach((node) => {
            if (node.children && node.children.length > 0) {
              // Procesar hijos si es necesario
            }
          });
        }
        
        // Actualizar datos del formulario - Campos básicos
        this.cedula = data.cedula || '';
        this.idLlamada = data.idLlamada || '';
        this.tipoDocumento = data.tipoDocumento || '';
        this.observacion = data.observacion || '';
        
        // Actualizar datos del cliente - Información personal
        this.nombres = data.nombres || '';
        this.apellidos = data.apellidos || '';
        this.fechaNacimiento = data.fechaNacimiento || '';
        
        // Ubicación
        this.pais = data.pais || '';
        this.departamento = data.departamento || '';
        this.ciudad = data.ciudad || '';
        this.direccion = data.direccion || '';
        
        // Contacto
        this.telefono = data.telefono || '';
        this.correo = data.correo || '';
        
        // Demográficos
        this.sexo = data.sexo || '';
        this.nivelEscolaridad = data.nivelEscolaridad || '';
        this.grupoEtnico = data.grupoEtnico || '';
        this.discapacidad = data.discapacidad || '';
        
        // Actualizar historial
        if (Array.isArray(data.historial)) {
          this.historial = data.historial;
        } else {
          this.historial.unshift(data);
        }
        
        // ✅ IMPORTANTE: Actualizar el árbol de tipificaciones
        if (data.arbol && Array.isArray(data.arbol)) {
          this.arbol = data.arbol;
          
          // Forzar actualización del componente
          this.$forceUpdate();
        } else {
          const errorTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
          const errorLog = `${errorTimestamp} ⚠️ [FRONTEND] TIPIFICACION_INCOMPLETA | idLlamada:${data.idLlamada || 'N/A'} | RAZON:arbol_no_recibido_o_invalido`;
          console.warn(errorLog);
        }
        
        // Mostrar modal con la información de la tipificación
        this.modalData = {
          idLlamada: data.idLlamada || '',
          tipoDocumento: data.tipoDocumento || '',
          cedula: data.cedula || '',
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          telefono: data.telefono || '',
          correo: data.correo || ''
        };
        
        // 🎯 MOSTRAR INFORMACIÓN CRM EN EL MODAL
        
        // Determinar si es cliente existente (puede ser true/false o undefined)
        const esClienteExistente = data.clienteExistente === true;
        const totalInteracciones = data.totalInteracciones || 0;
        
        if (esClienteExistente && totalInteracciones > 0) {
          this.modalData.esClienteExistente = true;
          this.modalData.totalInteracciones = totalInteracciones;
          this.modalData.fechaUltimaInteraccion = data.fechaUltimaInteraccion;
        } else {
          this.modalData.esClienteExistente = false;
          this.modalData.totalInteracciones = 0;
        }
        
        this.showModal = true;
        // ✅ ASEGURAR QUE EL FORMULARIO SE ACTIVE CUANDO LLEGUE NUEVA TIPIFICACIÓN
        this.tipificacionActiva = true;
        
        // Reproducir sonido de notificación (opcional)
        this.playNotificationSound();
        
      } catch (error) {
        const errorTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const errorLog = `${errorTimestamp} ❌ [FRONTEND] ERROR_PROCESANDO_TIPIFICACION | idLlamada:${data?.idLlamada || 'N/A'} | RAZON:${error.message || 'Error desconocido'} | stack:${error.stack?.substring(0, 100) || 'N/A'}`;
        console.error(errorLog);
        console.error('❌❌❌ ERROR PROCESANDO TIPIFICACIÓN:', error);
      }
    },
    
    playNotificationSound() {
      try {
        // Intentar reproducir sonido de notificación (si existe)
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {
          // Silenciar errores de reproducción (archivo no existe o no se puede reproducir)
        });
      } catch (error) {
        // Silenciar errores de audio (archivo no existe)
      }
    },
    editarCliente() {
      this.mostrarModalCliente = true;
      this.clienteTemp = {
        idLlamada: this.idLlamada || '',
        tipoDocumento: this.tipoDocumento || '',
        cedula: this.cedula || '',
        nombres: this.nombres || '',
        apellidos: this.apellidos || '',
        fechaNacimiento: this.fechaNacimiento || '',
        pais: this.pais || '',
        departamento: this.departamento || '',
        ciudad: this.ciudad || '',
        telefono: this.telefono || '',
        correo: this.correo || '',
        direccion: this.direccion || '',
        sexo: this.sexo || '',
        nivelEscolaridad: this.nivelEscolaridad || '',
        grupoEtnico: this.grupoEtnico || '',
        discapacidad: this.discapacidad || ''
      };
    },
    guardarCliente() {
      this.idLlamada = this.clienteTemp.idLlamada;
      this.tipoDocumento = this.clienteTemp.tipoDocumento;
      this.cedula = this.clienteTemp.cedula;
      this.nombres = this.clienteTemp.nombres;
      this.apellidos = this.clienteTemp.apellidos;
      this.fechaNacimiento = this.clienteTemp.fechaNacimiento;
      this.pais = this.clienteTemp.pais;
      this.departamento = this.clienteTemp.departamento;
      this.ciudad = this.clienteTemp.ciudad;
      this.telefono = this.clienteTemp.telefono;
      this.correo = this.clienteTemp.correo;
      this.direccion = this.clienteTemp.direccion;
      this.sexo = this.clienteTemp.sexo;
      this.nivelEscolaridad = this.clienteTemp.nivelEscolaridad;
      this.grupoEtnico = this.clienteTemp.grupoEtnico;
      this.discapacidad = this.clienteTemp.discapacidad;
      this.mostrarModalCliente = false;
    },
    cancelarEdicionCliente() {
      this.mostrarModalCliente = false;
    },
    limpiarTipificacion() {
      this.cedula = '';
      this.idLlamada = '';
      this.tipoDocumento = '';
      this.observacion = '';
      this.nombres = '';
      this.apellidos = '';
      this.fechaNacimiento = '';
      this.pais = '';
      this.departamento = '';
      this.ciudad = '';
      this.telefono = '';
      this.correo = '';
      this.direccion = '';
      this.sexo = '';
      this.nivelEscolaridad = '';
      this.grupoEtnico = '';
      this.discapacidad = '';
    },
    async cancelarTipificacion() {
      // Lógica para cancelar la tipificación pendiente en el backend
      try {
        const params = {
          idLlamada: this.modalData.idLlamada,
          assignedTo: this.$store.state.user?._id || this.$store.state.user?.id
        };
        await axios.post('/tipificacion/cancelar', params);
      } catch (e) {
        // Opcional: mostrar error
        if (this.showToast) {
          this.showToast('Error al cancelar la tipificación', 'error');
        }
      }
      // Limpiar y cerrar modal y formulario
      this.showModal = false;
      this.tipificacionActiva = false;
      this.nivel1 = '';
      this.nivel2 = '';
      this.nivel3 = '';
      this.nivel4 = '';
      this.nivel5 = '';
      this.observacion = '';
      this.idLlamada = '';
      this.cedula = '';
      this.tipoDocumento = '';
      this.nombres = '';
      this.apellidos = '';
      this.fechaNacimiento = '';
      this.pais = '';
      this.departamento = '';
      this.ciudad = '';
      this.telefono = '';
      this.correo = '';
      this.direccion = '';
      this.sexo = '';
      this.nivelEscolaridad = '';
      this.grupoEtnico = '';
      this.discapacidad = '';
      this.historial = [];
      this.arbol = [];
      
    },
    
    
    
  },
  watch: {
    '$store.state.user._id': {
      immediate: true,
      async handler(newUserId) {
        if (!newUserId) return;
        const topic = `telefonia/tipificacion/nueva/${newUserId}`;
        // Limpiar listener anterior si existe
        if (this.mqttTopic && this.mqttCallback) {
          mqttService.off(this.mqttTopic, this.mqttCallback);
        }
        // Suscribirse al nuevo topic
        const callback = (data) => {
          if (this.skipNextEvent) {
            this.skipNextEvent = false;
            return;
          }
          
          // Usar el método principal para procesar
          this.handleNuevaTipificacion(data);
        };
        this.mqttCallback = callback;
        if (!mqttService.isConnected) {
          // Usar configuración dinámica para MQTT
          const mqttUrl = environmentConfig.getMQTTBrokerUrl();
          await mqttService.connect(mqttUrl, newUserId);
        }
        mqttService.on(topic, callback);
        this.mqttTopic = topic;
      }
    },
    
    // 🔥 WATCHER PARA PROCESAR TIPIFICACIÓN PENDIENTE CUANDO CAMBIE
    '$store.state.pendingTipificacion': {
      handler(newTipificacion) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const logLine = `${timestamp} 👀 [WATCHER] TIPIFICACION_PENDIENTE_CAMBIO | idLlamada:${newTipificacion?.idLlamada || 'null'} | mounted:${this._isMounted} | active:${this.tipificacionActiva}`;
        console.log(logLine);
        
        // Solo procesar si el componente está montado y hay una tipificación pendiente
        if (!this._isMounted) {
          console.warn(`⚠️ [WATCHER] Componente NO montado, ignorando tipificación | idLlamada:${newTipificacion?.idLlamada || 'null'}`);
          return;
        }
        
        if (!newTipificacion) {
          console.log(`ℹ️ [WATCHER] No hay tipificación pendiente`);
          return;
        }
        
        // 🚨 NO PROCESAR SI YA EXISTE UNA TIPIFICACIÓN ACTIVA CON EL MISMO ID LLAMADA
        if (this.tipificacionActiva && this.idLlamada && this.idLlamada === newTipificacion.idLlamada) {
          console.log(`⚠️ [WATCHER] Ignorando tipificación duplicada | idLlamada:${newTipificacion.idLlamada}`);
          // Limpiar del store para evitar que vuelva a aparecer
          this.$store.commit('clearPendingTipificacion');
          return;
        }
        
        // 🚨 NO PROCESAR SI LA TIPIFICACIÓN YA FUE GUARDADA (status: 'success')
        if (newTipificacion.status === 'success') {
          console.log(`⚠️ [WATCHER] Ignorando tipificación ya guardada | idLlamada:${newTipificacion.idLlamada}`);
          // Limpiar del store
          this.$store.commit('clearPendingTipificacion');
          return;
        }
        
        // ✅ PROCESAR LA TIPIFICACIÓN
        const processLog = `${timestamp} 🚀 [WATCHER] PROCESANDO_TIPIFICACION | idLlamada:${newTipificacion.idLlamada}`;
        console.log(processLog);
        console.log('📦 [WATCHER] Datos de tipificación:', JSON.stringify(newTipificacion, null, 2));
        
        try {
          this.handleNuevaTipificacion(newTipificacion);
          
          // Verificar si se procesó correctamente
          setTimeout(() => {
            if (this.idLlamada === newTipificacion.idLlamada && this.tipificacionActiva) {
              console.log(`✅ [WATCHER] Tipificación procesada correctamente | idLlamada:${newTipificacion.idLlamada}`);
            } else {
              console.error(`❌ [WATCHER] Tipificación NO se procesó correctamente | esperado:${newTipificacion.idLlamada} | actual:${this.idLlamada} | activa:${this.tipificacionActiva}`);
            }
          }, 500);
          
          // Limpiar del store después de procesar
          this.$store.commit('clearPendingTipificacion');
        } catch (error) {
          console.error(`❌ [WATCHER] Error procesando tipificación | idLlamada:${newTipificacion.idLlamada} | error:${error.message}`);
          console.error('❌ Stack trace:', error.stack);
        }
      },
      immediate: false // No procesar inmediatamente, solo cuando cambie
    },
    
    // 🔒 WATCHER PARA VALIDAR QUE EL USUARIO TENGA EL ESTADO CORRECTO PARA WORK
    '$store.state.userStatus.status': {
      handler(newStatus, oldStatus) {
        // ⚠️ IMPORTANTE: Solo validar si realmente estamos en la ruta /work
        // Esto evita redirecciones durante el login o cuando estamos navegando a otra ruta
        if (this.$route.path !== '/work') {
          return;
        }
        
        // Solo validar si ya estamos montados
        if (!this._isMounted) {
          return;
        }
        
        // ⚠️ CRÍTICO: Comparar valores reales, no referencias de objetos
        // Normalizar valores (pueden ser strings, null, undefined)
        const newStatusValue = newStatus === null || newStatus === undefined ? null : String(newStatus).trim();
        const oldStatusValue = oldStatus === null || oldStatus === undefined ? null : String(oldStatus).trim();
        
        // Solo validar si el estado REALMENTE cambió de valor
        // StatusSyncMonitor actualiza el store cada 5 segundos incluso si el estado no cambió
        if (newStatusValue === oldStatusValue) {
          return;
        }
        
        // ⚠️ Evitar validación durante los primeros 10 segundos después del montaje
        // Esto previene redirecciones durante la inicialización del componente y login
        if (!this._mountedTime) {
          this._mountedTime = Date.now();
        }
        const timeSinceMount = Date.now() - this._mountedTime;
        if (timeSinceMount < 10000) {
          console.log(`⚠️ [WORK] Ignorando cambio de estado durante inicialización (${Math.round(timeSinceMount/1000)}s / 10s)`);
          return;
        }
        
        // No validar si los estados aún no están cargados
        if (!statusTypes.statuses || statusTypes.statuses.length === 0) {
          console.log('⚠️ [WORK] Estados aún no cargados, ignorando validación');
          return;
        }
        
        // Solo validar si hay un estado nuevo definido
        if (!newStatusValue || newStatusValue === 'null' || newStatusValue === 'undefined') {
          // Solo redirigir si antes tenía un estado válido (no es la primera vez)
          if (oldStatusValue && oldStatusValue !== 'null' && oldStatusValue !== 'undefined') {
            console.warn('⚠️ [WORK] Usuario perdió estado, redirigiendo a dashboard');
            this.showToast('Tu estado cambió. Por favor, selecciona un estado válido.', 'warning');
            
            // Limpiar formulario y datos antes de redirigir
            this.limpiarTipificacion();
            this.tipificacionActiva = false;
            this.showModal = false;
            
            this.$router.push('/dashboard');
          }
          return;
        }
        
        // Validar si el estado actual es de categoría 'work'
        const newStatusObj = statusTypes.getStatusByValue(newStatusValue);
        const oldStatusObj = oldStatusValue ? statusTypes.getStatusByValue(oldStatusValue) : null;
        
        // ⚠️ Solo redirigir si el NUEVO estado NO permite work Y el ANTERIOR sí permitía
        // Esto evita redirecciones cuando el usuario ya estaba en un estado que no permite work
        const newStatusAllowsWork = !newStatusObj || 
                                   !newStatusObj.category || 
                                   newStatusObj.category === 'work' || 
                                   newStatusObj.category === 'custom';
        const oldStatusAllowedWork = !oldStatusObj || 
                                    !oldStatusObj.category || 
                                    oldStatusObj.category === 'work' || 
                                    oldStatusObj.category === 'custom';
        
        // Solo redirigir si cambió DE un estado válido A uno inválido
        if (oldStatusAllowedWork && !newStatusAllowsWork) {
          console.warn(`⚠️ [WORK] Estado cambió de '${oldStatusValue}' (permite work) a '${newStatusValue}' (NO permite work), redirigiendo`);
          
          this.showToast('Tu estado cambió a uno que no permite acceder a Work. Has sido redirigido al Dashboard.', 'warning');
          
          // Limpiar formulario y datos antes de redirigir
          this.limpiarTipificacion();
          this.tipificacionActiva = false;
          this.showModal = false;
          
          // Redirigir al dashboard
          this.$router.push('/dashboard');
        } else {
          console.log(`ℹ️ [WORK] Estado cambió a '${newStatusValue}' pero permite work o ya estaba en estado no válido`);
        }
      },
      // 🔥 IMPORTANTE: deep: false para evitar reaccionar a cambios en propiedades del objeto
      // Solo queremos reaccionar cuando el valor del status cambia
      deep: false
    }
  },
  async mounted() {
    // Marcar tiempo de montaje para evitar redirecciones durante inicialización
    this._mountedTime = Date.now();
    
    // Cargar usuario desde sessionStorage si no está en el store
    let user = this.$store.state.user;
    if (!user) {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        try {
          const userParams = new URLSearchParams(userStr);
          user = {
            _id: userParams.get('_id'),
            correo: userParams.get('correo'),
            name: userParams.get('name')
          };
          this.$store.state.user = user;
        } catch (error) {
          console.error('Error parseando usuario:', error);
        }
      }
    }

    // 🔒 VALIDACIÓN INICIAL: Verificar que el usuario tenga un estado de categoría 'work'
    const currentStatus = this.$store.state.userStatus?.status;
    
    // Solo validar si el estado existe y statusTypes tiene estados cargados
    if (currentStatus && statusTypes.statuses && statusTypes.statuses.length > 0) {
      const statusObj = statusTypes.getStatusByValue(currentStatus);
      
      
      // Solo bloquear si encontramos el estado Y su categoría NO es 'work' Y NO es 'custom'
      if (statusObj && statusObj.category !== 'work' && statusObj.category !== 'custom') {
        console.warn('⚠️ Estado actual NO es de categoría WORK al entrar');
        this.showToast('Tu estado actual no permite acceder a Work. Por favor, cambia a un estado de trabajo.', 'warning');
        this.$router.push('/dashboard');
        return;
      }
    }

    // ✅ Validación del frontend ya completada arriba
    // La validación del estado se hace con statusTypes.getStatusByValue()
    // No necesitamos validación adicional del backend aquí
    
    // Inicializar componente
    this.initializeArbol();
    this.loadHistorial();
    this.setupMQTT();
    
    // Marcar que el componente está montado
    this._isMounted = true;
    
    // 🔥 PROCESAR TIPIFICACIÓN PENDIENTE SI EXISTE
    const pendingTipificacion = this.$store.state.pendingTipificacion;
    if (pendingTipificacion) {
      // Procesar inmediatamente
      this.handleNuevaTipificacion(pendingTipificacion);
      // Limpiar del store
      this.$store.commit('clearPendingTipificacion');
    }
  },
  beforeUnmount() {
    // Marcar que el componente se está desmontando
    this._isMounted = false;
    
    // Limpiar listener MQTT si existe
    if (this.mqttTopic && this.mqttCallback) {
      mqttService.off(this.mqttTopic, this.mqttCallback);
      this.mqttCallback = null;
    }
    
  }
};
</script>

<style scoped>
.work-container {
  display: flex;
  flex-direction: row;
  gap: 24px;
  padding: 24px;
  background: #f8f9fa;
  min-height: 90vh;
}

/* Modal Styles */
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

/* 🎯 ESTILOS CRM */
.crm-indicator {
  margin-bottom: 16px;
  text-align: center;
}

.crm-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.crm-badge.existing {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.crm-badge.new {
  background: linear-gradient(135deg, #007bff, #6610f2);
  color: white;
}

.crm-icon {
  font-size: 1.2rem;
}

.crm-text {
  font-weight: 600;
}

.crm-count {
  background: rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
}

.crm-info {
  margin-top: 12px;
  padding: 12px;
  background: #e8f5e8;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.crm-info p {
  margin: 4px 0;
  font-size: 0.9rem;
  color: #155724;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.large-modal {
  min-width: 800px;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h4 {
  margin-bottom: 16px;
  color: #1976d2;
  text-align: center;
}

.modal-info {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.modal-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.modal-info-section h5 {
  margin: 0 0 12px 0;
  color: #1976d2;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 2px solid #e3f2fd;
  padding-bottom: 4px;
}

.modal-info p {
  margin: 8px 0;
  font-size: 0.95rem;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-accept {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-accept:hover {
  background: #218838;
}

.btn-cancel {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-cancel:hover {
  background: #5a6268;
}

/* Estilos para el formulario de cliente */
.client-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 6px;
  color: #555;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

/* Sidebar Styles */
.work-sidebar {
  width: 260px;
  background: #e9ecef;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.client-info-table {
  width: 100%;
  margin-bottom: 16px;
  font-size: 0.95rem;
}

.client-info-table td {
  padding: 4px 0;
  vertical-align: top;
}

.btn-update {
  background: #ffc107;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
}

.btn-update:hover {
  background: #e0a800;
}

/* Main Content Styles */
.work-main {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.tipificacion-header {
  margin-bottom: 16px;
}

.tab-active {
  background: #1976d2;
  color: #fff;
  border: none;
  padding: 8px 24px;
  border-radius: 4px 4px 0 0;
  font-weight: bold;
}

.tipificacion-form {
  margin-top: 8px;
}

.tipificacion-form h4 {
  margin-bottom: 20px;
  color: #333;
}

.form-row {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.form-row label {
  font-weight: 500;
  margin-bottom: 6px;
  color: #555;
}

.form-row select, .form-row textarea {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-row select:focus, .form-row textarea:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-start;
}

.btn-save {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.btn-save:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.btn-clear {
  background: #dc3545;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #c82333;
  transform: translateY(-1px);
}

/* History Styles */
.work-history {
  width: 350px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  overflow-y: auto;
  max-height: 80vh;
}

.work-history h5 {
  margin-bottom: 16px;
  color: #333;
  font-size: 1.1rem;
}

.history-list {
  margin-top: 10px;
}

.no-history {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.history-item {
  background: #f8f9fa;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.history-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.history-index {
  color: #333;
}

.history-id {
  color: #1976d2;
  font-weight: bold;
}

.history-doc {
  color: #28a745;
  font-weight: bold;
}

.history-details {
  font-size: 0.9rem;
  color: #555;
}

.history-details p {
  margin: 4px 0;
  line-height: 1.4;
}

.badge-id {
  background: #007bff;
  color: #fff;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.95em;
  margin-left: 2px;
}
.badge-doc {
  background: #28a745;
  color: #fff;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.95em;
  margin-left: 2px;
}
.badge-status {
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 0.85em;
  margin-left: 8px;
  font-weight: 600;
  display: inline-block;
  vertical-align: middle;
  box-shadow: 0 1px 2px rgba(40,167,69,0.08);
  letter-spacing: 0.5px;
}
.badge-success {
  background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
  color: #155724;
  border: 1px solid #38c172;
}
.badge-pending {
  background: #ffc107;
  color: #856404;
  border: 1px solid #ffe082;
}
.badge-date {
  background: #e9ecef;
  color: #333;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.95em;
  margin-left: 2px;
}
.badge-cancelada {
  background: #ff9800;
  color: #fff;
  border: 1px solid #ffa726;
}
.badge-agent-id {
  background: #6c757d;
  color: #fff;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.85em;
  margin-left: 4px;
  font-weight: 600;
}

/* ESTILOS PARA ESTADO DE TRABAJO SIMPLIFICADO */
.work-status-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.work-status-section h5 {
  margin-bottom: 16px;
  color: #28a745;
  font-weight: 600;
}

.work-status-info {
  text-align: center;
}

.waiting-status, .active-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.waiting-icon, .active-icon {
  font-size: 2.5rem;
  opacity: 0.8;
}

.waiting-text h6, .active-text h6 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.waiting-text p, .active-text p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;
}

.waiting-status {
  border-left: 4px solid #ffc107;
}

.active-status {
  border-left: 4px solid #28a745;
  background: #f0fff4;
}

.history-section {
  padding: 16px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.history-section h5 {
  color: #28a745;
  font-weight: 600;
}

/* ANIMACIÓN PARA SPINNER */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .work-container {
    flex-direction: column;
    gap: 16px;
  }
  
  .work-sidebar, .work-history {
    width: 100%;
    max-height: none;
  }
  
  .modal-content {
    min-width: 320px;
    margin: 20px;
  }
  
  .modal-info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .work-container {
    padding: 16px;
  }
  
  .work-main {
    padding: 16px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-save, .btn-clear {
    width: 100%;
  }
  
  .client-form-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .large-modal {
    min-width: 320px;
    max-width: 95vw;
    margin: 20px;
  }
}

/* 🎯 FORZAR COLOR NEGRO PARA text-dark */
h4.text-dark,
h5.text-dark,
h6.text-dark,
p.text-dark,
label.text-dark,
span.text-dark,
div.text-dark,
td.text-dark,
b.text-dark,
strong.text-dark {
  color: #000000 !important;
}
</style>
