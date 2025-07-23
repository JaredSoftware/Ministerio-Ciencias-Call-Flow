<template>
  <div class="work-container">
    <div class="work-sidebar">
      <h5>INFORMACIÓN DEL CLIENTE</h5>
      <table class="client-info-table">
        <tr><td><b>Cliente:</b></td><td>Tipificación estándar</td></tr>
        <tr><td><b>T. Documento:</b></td><td>1</td></tr>
        <tr><td><b>Doc. No.:</b></td><td>0000</td></tr>
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
        <div class="form-row">
          <label for="nivel1">Nivel 1</label>
          <select id="nivel1">
            <option>Selecciona una opción...</option>
          </select>
        </div>
        <div class="form-row">
          <label for="observaciones">Observaciones</label>
          <textarea id="observaciones" placeholder="Escribe tus observaciones aquí..."></textarea>
        </div>
      </div>
    </div>
    <div class="work-history">
      <h5>Historial de Transferencias</h5>
      <div class="history-list">
        <div class="history-item">
          <div class="history-header">
            <span class="history-index">1 -</span>
            <span class="history-skl">SKL:CAN_001</span>
            <span class="history-vdn">VDN:20000001</span>
            <span class="history-asr">ASR:Pruebas PC</span>
          </div>
          <table class="history-table">
            <tr><th>Autogestión IVR</th><th>Tipificación Asesor</th></tr>
            <tr><td>UIIERR</td><td>CANAL TELEFÓNICO Y CORREOS ELECTRÓNICOS</td></tr>
            <tr><td>UIIERR</td><td>Aplicativos</td></tr>
            <tr><td>UIIERR</td><td>SGD - SISTEMA DE GESTIÓN DE DATOS (BODEGA DE DATOS SISPRO)</td></tr>
            <tr><td>UIIERR</td><td>PROBLEMAS DE CONEXIÓN CON LOS CUBOS</td></tr>
            <tr><td>UIIERR</td><td>PROBLEMAS DE CONEXIÓN CON LOS CUBOS</td></tr>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '@/services/axios';
import toastMixin from '@/mixins/toastMixin';
import MQTTService from '@/services/mqttService';

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
      mqttService: null,
      mqttConnected: false,
      showModal: false,
      modalData: {
        idLlamada: '',
        tipoDocumento: '',
        cedula: ''
      },
      saving: false,
      skipNextEvent: false,
      mqttTopic: '',
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
    async guardarTipificacion() {
      this.saving = true;
      try {
        const _id = this.historial.length > 0 && this.historial[0]._id ? this.historial[0]._id : undefined;
        // Obtener el label de cada nivel seleccionado
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
        // Notificación de éxito
        if (this.showToast) {
          this.showToast('Tipificación guardada correctamente', 'success');
        } else if (window.showToast) {
          window.showToast('Tipificación guardada correctamente', 'success');
        }
        // Limpiar formulario y datos de la izquierda
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
    }
  },
  watch: {
    '$store.state.user._id': {
      immediate: true,
      async handler(newUserId) {
        if (!newUserId) return;
        const topic = `telefonia/tipificacion/nueva/${newUserId}`;
        if (!this.mqttService) {
          this.mqttService = new MQTTService();
          await this.mqttService.connect('ws://localhost:9001', newUserId);
        }
        if (this.mqttTopic) {
          this.mqttService.client.unsubscribe(this.mqttTopic);
        }
        this.mqttService.on(topic, (data) => {
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
        });
        this.mqttTopic = topic;
      }
    }
  },
  async mounted() {
    // MQTT se inicializa por watcher
  },
  beforeUnmount() {
    if (this.mqttService) {
      this.mqttService.disconnect();
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
.btn-update {
  background: #ffc107;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
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
.form-row {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}
.form-row label {
  font-weight: 500;
  margin-bottom: 4px;
}
.form-row select, .form-row textarea {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 1rem;
}
.work-history {
  width: 350px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  overflow-y: auto;
  max-height: 80vh;
}
.history-list {
  margin-top: 8px;
}
.history-item {
  margin-bottom: 16px;
  border: 1px solid #1976d2;
  border-radius: 6px;
  padding: 8px;
}
.history-header {
  font-size: 0.95rem;
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.history-skl { color: #009688; font-weight: bold; }
.history-vdn { color: #1976d2; font-weight: bold; }
.history-asr { color: #388e3c; font-weight: bold; }
.history-table {
  width: 100%;
  font-size: 0.93rem;
  border-collapse: collapse;
}
.history-table th, .history-table td {
  border-bottom: 1px solid #eee;
  padding: 4px 6px;
}
</style> 