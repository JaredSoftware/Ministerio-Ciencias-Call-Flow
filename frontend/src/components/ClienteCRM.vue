<template>
  <div class="modal-crm-overlay" @click="cerrar">
    <div class="modal-crm-container bg-white" @click.stop>
      <!-- HEADER CON TABS -->
      <div class="modal-crm-header bg-white">
        <div class="header-info">
          <h3 class="text-dark">
            <span class="icono-cliente">👤</span>
            {{ clienteEditado.nombres || 'Sin nombre' }} {{ clienteEditado.apellidos || '' }}
          </h3>
          <p class="text-dark cliente-meta">
            <span class="badge-cedula">{{ clienteEditado.cedula }}</span>
            <span class="badge-interacciones-header">{{ cliente.totalInteracciones || 0 }} interacciones</span>
          </p>
        </div>
        <button @click="cerrar" class="btn-cerrar-crm">&times;</button>
      </div>
      
      <!-- TABS -->
      <div class="modal-crm-tabs bg-white">
        <button 
          :class="['tab-btn', { active: tabActiva === 'info' }]"
          @click="tabActiva = 'info'"
        >
          📋 Información
        </button>
        <button 
          :class="['tab-btn', { active: tabActiva === 'editar' }]"
          @click="tabActiva = 'editar'"
        >
          ✏️ Editar
        </button>
        <button 
          :class="['tab-btn', { active: tabActiva === 'historial' }]"
          @click="tabActiva = 'historial'"
        >
          📞 Historial ({{ cliente.totalInteracciones || 0 }})
        </button>
      </div>
      
      <!-- CONTENIDO DE LOS TABS -->
      <div class="modal-crm-body">
        <!-- TAB: INFORMACIÓN -->
        <div v-show="tabActiva === 'info'" class="tab-content">
          <div class="info-seccion">
            <h5 class="text-dark seccion-titulo">📋 Información Básica</h5>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label text-dark">Cédula:</span>
                <span class="info-valor text-dark">{{ cliente.cedula }}</span>
              </div>
              <div class="info-item">
                <span class="info-label text-dark">Tipo Documento:</span>
                <span class="info-valor text-dark">{{ cliente.tipoDocumento || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label text-dark">Nombres:</span>
                <span class="info-valor text-dark">{{ cliente.nombres || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label text-dark">Apellidos:</span>
                <span class="info-valor text-dark">{{ cliente.apellidos || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label text-dark">Sexo:</span>
                <span class="info-valor text-dark">{{ cliente.sexo || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label text-dark">Fecha Nacimiento:</span>
                <span class="info-valor text-dark">{{ cliente.fechaNacimiento ? formatFecha(cliente.fechaNacimiento) : '-' }}</span>
              </div>
            </div>
          </div>
          
          <div class="info-seccion">
            <h5 class="text-dark seccion-titulo">📍 Ubicación y Contacto</h5>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label text-dark">País:</span>
                <span class="info-valor text-dark">{{ cliente.pais || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label text-dark">Departamento:</span>
                <span class="info-valor text-dark">{{ cliente.departamento || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label text-dark">Ciudad:</span>
                <span class="info-valor text-dark">{{ cliente.ciudad || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label text-dark">Dirección:</span>
                <span class="info-valor text-dark">{{ cliente.direccion || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label text-dark">Teléfono:</span>
                <span class="info-valor text-dark">{{ cliente.telefono || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label text-dark">Correo:</span>
                <span class="info-valor text-dark">{{ cliente.correo || '-' }}</span>
              </div>
            </div>
          </div>
          
          <div class="info-seccion">
            <h5 class="text-dark seccion-titulo">📊 Información Demográfica</h5>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label text-dark">Nivel Escolaridad:</span>
                <span class="info-valor text-dark">{{ cliente.nivelEscolaridad || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label text-dark">Grupo Étnico:</span>
                <span class="info-valor text-dark">{{ cliente.grupoEtnico || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label text-dark">Discapacidad:</span>
                <span class="info-valor text-dark">{{ cliente.discapacidad || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- TAB: EDITAR -->
        <div v-show="tabActiva === 'editar'" class="tab-content">
          <form @submit.prevent="guardarCambios" class="form-editar">
            <div class="form-seccion">
              <h5 class="text-dark seccion-titulo">📋 Información Básica</h5>
              <div class="form-grid">
                <div class="form-grupo">
                  <label class="text-dark">Cédula <span class="required">*</span></label>
                  <input v-model="clienteEditado.cedula" type="text" class="form-input bg-white text-dark" disabled />
                </div>
                <div class="form-grupo">
                  <label class="text-dark">Tipo Documento</label>
                  <select v-model="clienteEditado.tipoDocumento" class="form-input bg-white text-dark">
                    <option value="">Seleccionar...</option>
                    <option value="Cédula de ciudadanía">Cédula de ciudadanía</option>
                    <option value="Cédula de extranjería">Cédula de extranjería</option>
                    <option value="Tarjeta de identidad">Tarjeta de identidad</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Permiso temporal de permanencia">Permiso temporal de permanencia</option>
                  </select>
                </div>
                <div class="form-grupo">
                  <label class="text-dark">Nombres</label>
                  <input v-model="clienteEditado.nombres" type="text" class="form-input bg-white text-dark" />
                </div>
                <div class="form-grupo">
                  <label class="text-dark">Apellidos</label>
                  <input v-model="clienteEditado.apellidos" type="text" class="form-input bg-white text-dark" />
                </div>
                <div class="form-grupo">
                  <label class="text-dark">Sexo</label>
                  <select v-model="clienteEditado.sexo" class="form-input bg-white text-dark">
                    <option value="">Seleccionar...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div class="form-grupo">
                  <label class="text-dark">Fecha Nacimiento</label>
                  <input v-model="clienteEditado.fechaNacimiento" type="date" class="form-input bg-white text-dark" />
                </div>
              </div>
            </div>
            
            <div class="form-seccion">
              <h5 class="text-dark seccion-titulo">📍 Ubicación y Contacto</h5>
              <div class="form-grid">
                <div class="form-grupo">
                  <label class="text-dark">País</label>
                  <input v-model="clienteEditado.pais" type="text" class="form-input bg-white text-dark" />
                </div>
                <div class="form-grupo">
                  <label class="text-dark">Departamento</label>
                  <input v-model="clienteEditado.departamento" type="text" class="form-input bg-white text-dark" />
                </div>
                <div class="form-grupo">
                  <label class="text-dark">Ciudad</label>
                  <input v-model="clienteEditado.ciudad" type="text" class="form-input bg-white text-dark" />
                </div>
                <div class="form-grupo">
                  <label class="text-dark">Dirección</label>
                  <input v-model="clienteEditado.direccion" type="text" class="form-input bg-white text-dark" />
                </div>
                <div class="form-grupo">
                  <label class="text-dark">Teléfono</label>
                  <input v-model="clienteEditado.telefono" type="tel" class="form-input bg-white text-dark" />
                </div>
                <div class="form-grupo">
                  <label class="text-dark">Correo</label>
                  <input v-model="clienteEditado.correo" type="email" class="form-input bg-white text-dark" />
                </div>
              </div>
            </div>
            
            <div class="form-seccion">
              <h5 class="text-dark seccion-titulo">📊 Información Demográfica</h5>
              <div class="form-grid">
                <div class="form-grupo">
                  <label class="text-dark">Nivel Escolaridad</label>
                  <select v-model="clienteEditado.nivelEscolaridad" class="form-input bg-white text-dark">
                    <option value="">Seleccionar...</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Secundaria">Secundaria</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Tecnólogo">Tecnólogo</option>
                    <option value="Universitario (pregrado)">Universitario (pregrado)</option>
                    <option value="Postgrado (Especialización)">Postgrado (Especialización)</option>
                    <option value="Maestría">Maestría</option>
                    <option value="Doctorado">Doctorado</option>
                  </select>
                </div>
                <div class="form-grupo">
                  <label class="text-dark">Grupo Étnico</label>
                  <input v-model="clienteEditado.grupoEtnico" type="text" class="form-input bg-white text-dark" />
                </div>
                <div class="form-grupo">
                  <label class="text-dark">Discapacidad</label>
                  <input v-model="clienteEditado.discapacidad" type="text" class="form-input bg-white text-dark" />
                </div>
              </div>
            </div>
            
            <div class="form-acciones">
              <button type="button" @click="cancelarEdicion" class="btn-cancelar">
                ❌ Cancelar
              </button>
              <button type="submit" class="btn-guardar" :disabled="guardando">
                <span v-if="!guardando">💾 Guardar Cambios</span>
                <span v-else>⏳ Guardando...</span>
              </button>
            </div>
          </form>
        </div>
        
        <!-- TAB: HISTORIAL -->
        <div v-show="tabActiva === 'historial'" class="tab-content">
          <!-- HEADER CON BOTÓN DE DESCARGA -->
          <div v-if="cliente.interacciones && cliente.interacciones.length > 0" class="historial-header-acciones">
            <h6 class="text-dark historial-titulo">
              📊 Total de Interacciones: <span class="badge-count">{{ cliente.interacciones.length }}</span>
            </h6>
            <button @click="descargarHistorialExcel" class="btn-descargar-excel">
              📥 Descargar en Excel
            </button>
          </div>
          
          <div v-if="cliente.interacciones && cliente.interacciones.length > 0" class="historial-lista">
            <div 
              v-for="(interaccion, idx) in cliente.interacciones" 
              :key="interaccion._id || idx"
              class="historial-card bg-white"
            >
              <div class="historial-header">
                <div class="historial-numero text-dark">
                  <span class="numero-badge">{{ idx + 1 }}</span>
                  <span><b>ID:</b> {{ interaccion.idLlamada }}</span>
                </div>
                <span :class="['estado-badge', interaccion.estado]">
                  {{ interaccion.estado }}
                </span>
              </div>
              <div class="historial-content">
                <p class="text-dark"><b class="text-dark">📅 Fecha:</b> {{ formatFechaHora(interaccion.fecha) }}</p>
                <p class="text-dark"><b class="text-dark">📋 Tipo:</b> {{ interaccion.tipo }}</p>
                <p class="text-dark" v-if="interaccion.observacion">
                  <b class="text-dark">💬 Observación:</b> {{ interaccion.observacion }}
                </p>
                <div v-if="interaccion.nivel1 || interaccion.nivel2 || interaccion.nivel3" class="niveles-tipificacion">
                  <b class="text-dark">🌳 Tipificación:</b>
                  <div class="niveles-path">
                    <span class="nivel-item text-dark" v-if="interaccion.nivel1">{{ interaccion.nivel1 }}</span>
                    <span class="nivel-separador" v-if="interaccion.nivel2">→</span>
                    <span class="nivel-item text-dark" v-if="interaccion.nivel2">{{ interaccion.nivel2 }}</span>
                    <span class="nivel-separador" v-if="interaccion.nivel3">→</span>
                    <span class="nivel-item text-dark" v-if="interaccion.nivel3">{{ interaccion.nivel3 }}</span>
                    <span class="nivel-separador" v-if="interaccion.nivel4">→</span>
                    <span class="nivel-item text-dark" v-if="interaccion.nivel4">{{ interaccion.nivel4 }}</span>
                    <span class="nivel-separador" v-if="interaccion.nivel5">→</span>
                    <span class="nivel-item text-dark" v-if="interaccion.nivel5">{{ interaccion.nivel5 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="sin-historial text-dark">
            <span class="icono-vacio">📭</span>
            <p>No hay interacciones registradas para este cliente</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mqttService } from '@/router/services/mqttService';

export default {
  name: 'ClienteCRM',
  props: {
    cliente: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      tabActiva: 'info',
      clienteEditado: {},
      guardando: false
    };
  },
  mounted() {
    this.inicializarEdicion();
  },
  watch: {
    cliente: {
      handler() {
        this.inicializarEdicion();
      },
      deep: true
    }
  },
  methods: {
    inicializarEdicion() {
      this.clienteEditado = {
        cedula: this.cliente.cedula,
        tipoDocumento: this.cliente.tipoDocumento || '',
        nombres: this.cliente.nombres || '',
        apellidos: this.cliente.apellidos || '',
        sexo: this.cliente.sexo || '',
        fechaNacimiento: this.cliente.fechaNacimiento ? this.formatFechaInput(this.cliente.fechaNacimiento) : '',
        pais: this.cliente.pais || '',
        departamento: this.cliente.departamento || '',
        ciudad: this.cliente.ciudad || '',
        direccion: this.cliente.direccion || '',
        telefono: this.cliente.telefono || '',
        correo: this.cliente.correo || '',
        nivelEscolaridad: this.cliente.nivelEscolaridad || '',
        grupoEtnico: this.cliente.grupoEtnico || '',
        discapacidad: this.cliente.discapacidad || ''
      };
    },
    
    async guardarCambios() {
      this.guardando = true;
      
      try {
        const userId = this.$store.state.user?.id || this.$store.state.user?._id;
        
        // Publicar actualización por MQTT
        mqttService.publish(`crm/clientes/actualizar/${userId}`, {
          cedula: this.clienteEditado.cedula,
          datosActualizados: this.clienteEditado,
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Solicitud de actualización enviada por MQTT');
        
        // Emitir evento de actualización al padre
        this.$emit('cliente-actualizado', this.clienteEditado);
        
        // Cambiar a tab de información
        this.tabActiva = 'info';
        
        alert('✅ Cliente actualizado correctamente');
      } catch (error) {
        console.error('❌ Error guardando cambios:', error);
        alert('❌ Error al guardar los cambios');
      } finally {
        this.guardando = false;
      }
    },
    
    cancelarEdicion() {
      this.inicializarEdicion();
      this.tabActiva = 'info';
    },
    
    cerrar() {
      this.$emit('cerrar');
    },
    
    formatFecha(fecha) {
      if (!fecha) return '-';
      return new Date(fecha).toLocaleDateString('es-ES');
    },
    
    formatFechaHora(fecha) {
      if (!fecha) return '-';
      return new Date(fecha).toLocaleString('es-ES');
    },
    
    formatFechaInput(fecha) {
      if (!fecha) return '';
      const date = new Date(fecha);
      return date.toISOString().split('T')[0];
    },
    
    descargarHistorialExcel() {
      if (!this.cliente.interacciones || this.cliente.interacciones.length === 0) {
        alert('No hay interacciones para descargar');
        return;
      }
      
      // Crear CSV del historial
      const headers = [
        'N°',
        'ID Llamada',
        'Fecha',
        'Hora',
        'Tipo',
        'Estado',
        'Nivel 1',
        'Nivel 2',
        'Nivel 3',
        'Nivel 4',
        'Nivel 5',
        'Observación'
      ];
      
      const rows = this.cliente.interacciones.map((interaccion, idx) => {
        const fecha = new Date(interaccion.fecha);
        return [
          idx + 1,
          interaccion.idLlamada || '',
          fecha.toLocaleDateString('es-ES'),
          fecha.toLocaleTimeString('es-ES'),
          interaccion.tipo || '',
          interaccion.estado || '',
          interaccion.nivel1 || '',
          interaccion.nivel2 || '',
          interaccion.nivel3 || '',
          interaccion.nivel4 || '',
          interaccion.nivel5 || '',
          interaccion.observacion || ''
        ];
      });
      
      // Construir CSV
      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => {
          // Escapar comillas y comas
          const cellStr = String(cell).replace(/"/g, '""');
          return cellStr.includes(',') || cellStr.includes('\n') ? `"${cellStr}"` : cellStr;
        }).join(',') + '\n';
      });
      
      // Agregar información del cliente al inicio
      const infoCliente = `Historial de Interacciones - Cliente: ${this.cliente.nombres} ${this.cliente.apellidos}\nCédula: ${this.cliente.cedula}\nTotal Interacciones: ${this.cliente.interacciones.length}\nFecha de Descarga: ${new Date().toLocaleString('es-ES')}\n\n`;
      csv = infoCliente + csv;
      
      // Descargar archivo
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const nombreArchivo = `Historial_${this.cliente.cedula}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', nombreArchivo);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ Historial descargado: ${nombreArchivo}`);
    }
  }
};
</script>

<style scoped>
/* 🎯 MODAL CRM OVERLAY */
.modal-crm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

/* CONTAINER PRINCIPAL */
.modal-crm-container {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* HEADER */
.modal-crm-header {
  padding: 24px 30px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.icono-cliente {
  font-size: 28px;
}

.cliente-meta {
  margin: 8px 0 0 0;
  font-size: 14px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.badge-cedula {
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 13px;
}

.badge-interacciones-header {
  background: #48bb78;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 13px;
}

.btn-cerrar-crm {
  background: #f56565;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-cerrar-crm:hover {
  background: #e53e3e;
  transform: scale(1.1);
}

/* TABS */
.modal-crm-tabs {
  display: flex;
  border-bottom: 2px solid #e2e8f0;
  background: #f7fafc;
}

.tab-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: white;
}

/* BODY */
.modal-crm-body {
  padding: 30px;
  overflow-y: auto;
  flex: 1;
}

.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 📋 TAB INFORMACIÓN */
.info-seccion {
  margin-bottom: 30px;
}

.seccion-titulo {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-valor {
  font-size: 15px;
  font-weight: 500;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

/* ✏️ TAB EDITAR */
.form-editar {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.form-seccion {
  margin-bottom: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.form-grupo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-grupo label {
  font-size: 14px;
  font-weight: 600;
}

.required {
  color: #f56565;
}

.form-input {
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.form-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 2px solid #e2e8f0;
}

.btn-cancelar,
.btn-guardar {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancelar {
  background: #e2e8f0;
  color: #475569;
}

.btn-cancelar:hover {
  background: #cbd5e1;
}

.btn-guardar {
  background: #667eea;
  color: white;
}

.btn-guardar:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-guardar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 📞 TAB HISTORIAL */
.historial-header-acciones {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
}

.historial-titulo {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-count {
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
}

.btn-descargar-excel {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3);
}

.btn-descargar-excel:hover {
  background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.btn-descargar-excel:active {
  transform: translateY(0);
}

.historial-lista {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.historial-card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;
}

.historial-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.historial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.historial-numero {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.numero-badge {
  background: #667eea;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.estado-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.estado-badge.completada {
  background: #c6f6d5;
  color: #22543d;
}

.estado-badge.pendiente {
  background: #fef3c7;
  color: #78350f;
}

.estado-badge.cancelada {
  background: #fed7d7;
  color: #742a2a;
}

.historial-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.historial-content p {
  margin: 0;
  font-size: 14px;
}

.niveles-tipificacion {
  margin-top: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.niveles-path {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}

.nivel-item {
  background: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
}

.nivel-separador {
  color: #667eea;
  font-weight: 700;
}

.sin-historial {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8 !important;
}

.icono-vacio {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.sin-historial p {
  font-size: 16px;
  margin: 0;
}

/* 🎨 DARK MODE TEXT */
h4.text-dark,
h5.text-dark,
h3.text-dark,
label.text-dark,
span.text-dark,
p.text-dark,
b.text-dark {
  color: #000000 !important;
}
</style>
