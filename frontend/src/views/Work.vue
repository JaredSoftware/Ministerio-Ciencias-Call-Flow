<template>
  <div class="work-container">
    <!-- Modal para nueva tipificación -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h4>📞 Nueva Tipificación Asignada</h4>
        <div class="modal-info">
          <p><strong>ID Llamada:</strong> {{ modalData.idLlamada }}</p>
          <p><strong>Tipo Documento:</strong> {{ modalData.tipoDocumento }}</p>
          <p><strong>Cédula:</strong> {{ modalData.cedula }}</p>
        </div>
        <div class="modal-buttons">
          <button @click="guardarModal" class="btn-accept">Aceptar</button>
          <button @click="showModal = false" class="btn-cancel">Cancelar</button>
        </div>
      </div>
    </div>

    <div class="work-sidebar">
      <h5>INFORMACIÓN DEL CLIENTE</h5>
      <table class="client-info-table">
        <tr><td><b>ID Llamada:</b></td><td>{{ idLlamada || 'Sin asignar' }}</td></tr>
        <tr><td><b>T. Documento:</b></td><td>{{ tipoDocumento || 'No Info' }}</td></tr>
        <tr><td><b>Doc. No.:</b></td><td>{{ cedula || 'No Info' }}</td></tr>
        <tr><td><b>Teléfono:</b></td><td>No Info</td></tr>
        <tr><td><b>Correo:</b></td><td>No Info</td></tr>
        <tr><td><b>Departamento:</b></td><td>No Info</td></tr>
        <tr><td><b>Municipio:</b></td><td>No Info</td></tr>
      </table>
      <button class="btn-update">Actualizar</button>
    </div>
    
    <div class="work-main">
      <div class="tipificacion-header">
        <button class="tab-active">TIPIFICACIONES</button>
      </div>
      
      <div class="tipificacion-form">
        <h4>Formulario de Tipificación</h4>
        
        <div class="form-row" v-if="nivel1Options.length > 0">
          <label for="nivel1">Nivel 1</label>
          <select id="nivel1" v-model="nivel1" @change="nivel2 = ''; nivel3 = ''; nivel4 = ''; nivel5 = ''">
            <option value="">Selecciona una opción...</option>
            <option v-for="option in nivel1Options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <div class="form-row" v-if="nivel2Options.length > 0">
          <label for="nivel2">Nivel 2</label>
          <select id="nivel2" v-model="nivel2" @change="nivel3 = ''; nivel4 = ''; nivel5 = ''">
            <option value="">Selecciona una opción...</option>
            <option v-for="option in nivel2Options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <div class="form-row" v-if="nivel3Options.length > 0">
          <label for="nivel3">Nivel 3</label>
          <select id="nivel3" v-model="nivel3" @change="nivel4 = ''; nivel5 = ''">
            <option value="">Selecciona una opción...</option>
            <option v-for="option in nivel3Options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <div class="form-row" v-if="nivel4Options.length > 0">
          <label for="nivel4">Nivel 4</label>
          <select id="nivel4" v-model="nivel4" @change="nivel5 = ''">
            <option value="">Selecciona una opción...</option>
            <option v-for="option in nivel4Options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <div class="form-row" v-if="nivel5Options.length > 0">
          <label for="nivel5">Nivel 5</label>
          <select id="nivel5" v-model="nivel5">
            <option value="">Selecciona una opción...</option>
            <option v-for="option in nivel5Options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <div class="form-row">
          <label for="observaciones">Observaciones</label>
          <textarea 
            id="observaciones" 
            v-model="observacion"
            placeholder="Escribe tus observaciones aquí..."
            rows="4">
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
    </div>
    
    <div class="work-history">
      <h5>Historial de Tipificaciones</h5>
      <div class="history-list">
        <div v-if="historial.length === 0" class="no-history">
          No hay tipificaciones asignadas
        </div>
        <div v-for="(item, index) in historial" :key="item._id || index" class="history-item">
          <div class="history-header">
            <span class="history-index">{{ index + 1 }} -</span>
            <span class="history-id">ID: {{ item.idLlamada }}</span>
            <span class="history-doc">{{ item.tipoDocumento }}: {{ item.cedula }}</span>
          </div>
          <div class="history-details">
            <p><strong>Observación:</strong> {{ item.observacion || 'Sin observaciones' }}</p>
            <p><strong>Fecha:</strong> {{ formatDate(item.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '@/services/axios';
import toastMixin from '@/mixins/toastMixin';
import { mqttService } from '@/services/mqttService';

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
    },
    
         // Método para inicializar el árbol - SIN HARDCODE, espera MQTT
     initializeArbol() {
       // ❌ NO HARDCODE - El árbol viene SOLO por MQTT
       this.arbol = [];
       console.log('⏳ Esperando árbol de tipificaciones por MQTT...');
     },
    
    // Método para cargar historial (fallback)
    loadHistorial() {
      // Inicializar historial vacío
      // El historial real se recibirá por MQTT
      this.historial = [];
      console.log('✅ Historial inicializado');
    },
    
    // Método para limpiar el formulario
    limpiarFormulario() {
      this.nivel1 = '';
      this.nivel2 = '';
      this.nivel3 = '';
      this.nivel4 = '';
      this.nivel5 = '';
      this.observacion = '';
      console.log('✅ Formulario limpiado');
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
        const _id = this.historial.length > 0 && this.historial[0]._id ? this.historial[0]._id : undefined;
        const getLabel = (options, value) => {
          const found = options.find(opt => opt.value === value);
          return found ? found.label : '';
        };
        const nivel1Label = getLabel(this.nivel1Options, this.nivel1);
        const nivel2Label = getLabel(this.nivel2Options, this.nivel2);
        const nivel3Label = getLabel(this.nivel3Options, this.nivel3);
        const nivel4Label = getLabel(this.nivel4Options, this.nivel4);
        const nivel5Label = getLabel(this.nivel5Options, this.nivel5);
        const params = {
          _id,
          idLlamada: this.idLlamada,
          cedula: this.cedula,
          tipoDocumento: this.tipoDocumento,
          observacion: this.observacion,
          nivel1: nivel1Label,
          nivel2: nivel2Label,
          nivel3: nivel3Label,
          nivel4: nivel4Label,
          nivel5: nivel5Label,
          startTime: this.startTime || Date.now()
        };
        if (!params._id) delete params._id;
        await axios.get('/tipificacion/formulario', { params });
        if (this.showToast) {
          this.showToast('Tipificación guardada correctamente', 'success');
        } else if (window.showToast) {
          window.showToast('Tipificación guardada correctamente', 'success');
        }
        this.nivel1 = '';
        this.nivel2 = '';
        this.nivel3 = '';
        this.nivel4 = '';
        this.nivel5 = '';
        this.observacion = '';
        this.idLlamada = '';
        this.cedula = '';
        this.tipoDocumento = '';
        this.historial = [];
        this.skipNextEvent = true;
      } catch (e) {
        if (this.showToast) {
          this.showToast('Error al guardar la tipificación', 'error');
        } else if (window.showToast) {
          window.showToast('Error al guardar la tipificación', 'error');
        }
      } finally {
        this.saving = false;
      }
    },
         setupMQTT() {
       try {
         console.log('🔌🔌🔌 CONFIGURANDO MQTT PARA WORK 🔌🔌🔌');
         
         // Obtener el userId del store
         const userId = this.$store.state.user?.id || this.$store.state.user?._id;
         console.log('👤 User ID desde store:', userId);
         console.log('🏪 Store completo:', this.$store.state.user);
         
         if (!userId) {
           console.warn('⚠️⚠️⚠️ NO SE PUEDE CONFIGURAR MQTT SIN USERID');
           console.log('🔍 Verificando store state:', this.$store.state);
           return;
         }
         
         // Configurar topic personalizado para este usuario
         this.mqttTopic = `telefonia/tipificacion/nueva/${userId}`;
         console.log('📡📡📡 TOPIC MQTT CONFIGURADO:', this.mqttTopic);
         
         // Verificar si la conexión global está disponible
         if (mqttService.isConnected) {
           console.log('✅✅✅ MQTT GLOBAL CONECTADO, CONFIGURANDO LISTENER');
           
           // Suscribirse al topic personalizado del usuario
           mqttService.on(this.mqttTopic, (data) => {
             console.log('📥📥📥 NUEVA TIPIFICACIÓN RECIBIDA POR MQTT:', data);
             this.handleNuevaTipificacion(data);
           });
           
           console.log('✅✅✅ MQTT CONFIGURADO PARA RECIBIR TIPIFICACIONES');
           console.log('📡 Esperando mensajes en topic:', this.mqttTopic);
         } else {
           console.log('⚠️⚠️⚠️ MQTT GLOBAL NO CONECTADO, REINTENTANDO...');
           console.log('🔍 Estado MQTT Service:', {
             isConnected: mqttService.isConnected,
             isConnecting: mqttService.isConnecting
           });
           
           // Intentar de nuevo en 2 segundos
           setTimeout(() => {
             this.setupMQTT();
           }, 2000);
         }
       } catch (error) {
         console.error('❌❌❌ ERROR CONFIGURANDO MQTT:', error);
       }
     },
    
         handleNuevaTipificacion(data) {
       try {
         console.log('🎯🎯🎯 PROCESANDO NUEVA TIPIFICACIÓN 🎯🎯🎯');
         console.log('📥 Data completa recibida:', JSON.stringify(data, null, 2));
         console.log('🌳 Árbol recibido:', data.arbol ? 'SÍ (' + data.arbol.length + ' nodos)' : 'NO');
         
         if (data.arbol) {
           console.log('🌳 ESTRUCTURA DEL ÁRBOL RECIBIDO:');
           data.arbol.forEach((node, index) => {
             console.log(`   ${index + 1}. ${node.label} (${node.value})`);
             if (node.children && node.children.length > 0) {
               node.children.forEach((child) => {
                 console.log(`      - ${child.label} (${child.value})`);
               });
             }
           });
         }
         
         // Actualizar datos del formulario
         this.cedula = data.cedula || '';
         this.idLlamada = data.idLlamada || '';
         this.tipoDocumento = data.tipoDocumento || '';
         this.observacion = data.observacion || '';
         
         console.log('📝 Datos del formulario actualizados:');
         console.log(`   - ID Llamada: ${this.idLlamada}`);
         console.log(`   - Cédula: ${this.cedula}`);
         console.log(`   - Tipo Doc: ${this.tipoDocumento}`);
         
         // Actualizar historial
         if (Array.isArray(data.historial)) {
           this.historial = data.historial;
           console.log('📋 Historial actualizado:', this.historial.length, 'items');
         } else {
           this.historial.unshift(data);
           console.log('📋 Item agregado al historial');
         }
         
         // ✅ IMPORTANTE: Actualizar el árbol de tipificaciones
         if (data.arbol && Array.isArray(data.arbol)) {
           this.arbol = data.arbol;
           console.log('✅✅✅ ÁRBOL ACTUALIZADO CON ÉXITO ✅✅✅');
           console.log('🌳 Nuevo árbol en this.arbol:', this.arbol.length, 'nodos raíz');
           console.log('🌳 Primer nodo:', this.arbol[0]?.label, '(', this.arbol[0]?.value, ')');
           
           // Forzar actualización del componente
           this.$forceUpdate();
           console.log('🔄 Componente forzado a actualizar');
         } else {
           console.warn('⚠️ NO SE RECIBIÓ ÁRBOL O ÁRBOL INVÁLIDO');
         }
         
         // Mostrar modal con la información de la tipificación
         this.modalData = {
           idLlamada: data.idLlamada || '',
           tipoDocumento: data.tipoDocumento || '',
           cedula: data.cedula || ''
         };
         
         this.showModal = true;
         console.log('🗂️ Modal mostrado con datos:', this.modalData);
         
         // Reproducir sonido de notificación (opcional)
         this.playNotificationSound();
         
       } catch (error) {
         console.error('❌❌❌ ERROR PROCESANDO TIPIFICACIÓN:', error);
       }
     },
    
    playNotificationSound() {
      try {
        // Reproducir sonido de notificación
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('No se pudo reproducir sonido:', e));
      } catch (error) {
        console.log('No se pudo reproducir sonido de notificación');
      }
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
          this.cedula = data.cedula || '';
          this.idLlamada = data.idLlamada || '';
          this.tipoDocumento = data.tipoDocumento || '';
          this.observacion = data.observacion || '';
          if (Array.isArray(data.historial)) {
            this.historial = data.historial;
          } else {
            this.historial.unshift(data);
          }
          if (data.arbol) {
            this.arbol = data.arbol;
          }
        };
        this.mqttCallback = callback;
        if (!mqttService.isConnected) {
          await mqttService.connect('ws://localhost:9001', newUserId);
        }
        mqttService.on(topic, callback);
        this.mqttTopic = topic;
      }
    }
  },
     async mounted() {
     console.log('🚀🚀🚀 WORK MONTADO - INICIANDO DEBUG 🚀🚀🚀');
     
     // Debug inicial
     console.log('🔍 Estado inicial del árbol:', this.arbol.length, 'nodos');
     console.log('🔍 Store state:', this.$store.state);
     console.log('🔍 User en store:', this.$store.state.user);
     
     // Cargar datos necesarios
     this.initializeArbol();
     this.loadHistorial();
     
     console.log('📋 Después de inicializar:');
     console.log('   - Árbol:', this.arbol.length, 'nodos');
     console.log('   - Historial:', this.historial.length, 'items');
     
     // Eliminar setupMQTT();
     
     // Debug final
     setTimeout(() => {
       console.log('⏰ DEBUG A LOS 5 SEGUNDOS:');
       console.log('   - Árbol final:', this.arbol.length, 'nodos');
       console.log('   - MQTT Topic:', this.mqttTopic);
       console.log('   - MQTT Conectado:', mqttService.isConnected);
       console.log('   - Primer nodo del árbol:', this.arbol[0]?.label);
       
       if (this.arbol.length === 0) {
         console.warn('⚠️⚠️⚠️ ÁRBOL SIGUE VACÍO DESPUÉS DE 5 SEGUNDOS!');
       }
     }, 5000);
     
     console.log('✅✅✅ WORK LISTO - ESPERANDO MQTT ✅✅✅');
   },
  beforeUnmount() {
    // Limpiar listener MQTT si existe
    if (this.mqttTopic && this.mqttCallback) {
      mqttService.off(this.mqttTopic, this.mqttCallback);
      this.mqttCallback = null;
    }
    console.log('Work desmontándose - manteniendo conexión MQTT global');
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

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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
  margin-top: 8px;
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
  margin-bottom: 16px;
  border: 1px solid #1976d2;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
  transition: all 0.2s;
}

.history-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.history-header {
  font-size: 0.95rem;
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-weight: 600;
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
}
</style> 