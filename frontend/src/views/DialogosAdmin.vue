<template>
  <div class="dialogos-admin-container bg-white">
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header pb-0">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h4 class="mb-0">💬 Administración de Diálogos para Agentes</h4>
                  <p class="text-sm text-secondary mb-0">
                    Gestiona los mensajes y guiones que aparecen en el formulario de tipificación
                  </p>
                </div>
                <button 
                  class="btn btn-primary btn-sm"
                  @click="abrirModalCrear"
                  :disabled="loading"
                >
                  <i class="ni ni-fat-add"></i>
                  Nuevo Diálogo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de Diálogos -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <div v-if="loading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </div>

              <div v-else-if="dialogos.length === 0" class="text-center py-4">
                <p class="text-muted">No hay diálogos creados aún</p>
              </div>

              <div v-else class="table-responsive">
                <table class="table align-items-center mb-0">
                  <thead>
                    <tr>
                      <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Título</th>
                      <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Tipo</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Estado</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Prioridad</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="dialogo in dialogos" :key="dialogo._id">
                      <td>
                        <div class="d-flex px-2 py-1">
                          <div class="d-flex flex-column justify-content-center">
                            <h6 class="mb-0 text-sm">{{ dialogo.titulo }}</h6>
                            <p class="text-xs text-secondary mb-0">
                              {{ dialogo.mensaje.substring(0, 60) }}{{ dialogo.mensaje.length > 60 ? '...' : '' }}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="badge" :class="getTipoBadgeClass(dialogo.tipo)">
                          {{ dialogo.tipo }}
                        </span>
                      </td>
                      <td class="align-middle text-center text-sm">
                        <span class="badge" :class="dialogo.activo ? 'badge-success' : 'badge-secondary'">
                          {{ dialogo.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td class="align-middle text-center">
                        <span class="text-xs font-weight-bold">{{ dialogo.prioridad }}</span>
                      </td>
                      <td class="align-middle text-center">
                        <button 
                          class="btn btn-sm btn-outline-info me-1"
                          @click="verDialogo(dialogo)"
                          title="Ver"
                        >
                          <i class="ni ni-zoom-split-in"></i>
                        </button>
                        <button 
                          class="btn btn-sm btn-outline-warning me-1"
                          @click="editarDialogo(dialogo)"
                          title="Editar"
                        >
                          <i class="ni ni-ruler-pencil"></i>
                        </button>
                        <button 
                          class="btn btn-sm"
                          :class="dialogo.activo ? 'btn-outline-secondary' : 'btn-outline-success'"
                          @click="toggleActivo(dialogo)"
                          :title="dialogo.activo ? 'Desactivar' : 'Activar'"
                        >
                          <i :class="dialogo.activo ? 'ni ni-button-power' : 'ni ni-check-bold'"></i>
                        </button>
                        <button 
                          class="btn btn-sm btn-outline-danger ms-1"
                          @click="eliminarDialogo(dialogo)"
                          title="Eliminar"
                        >
                          <i class="ni ni-fat-remove"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Crear/Editar -->
    <div v-if="mostrarModal">
      <div class="modal-backdrop fade show" @click="cerrarModal" style="z-index: 1040;"></div>
      <div class="modal fade show d-block" tabindex="-1" style="z-index: 1050;">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ dialogoEditando._id ? 'Editar Diálogo' : 'Nuevo Diálogo' }}
              </h5>
              <button type="button" class="btn-close" @click="cerrarModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="guardarDialogo">
                <fieldset :disabled="guardando">
                  <div class="mb-3">
                    <label class="form-label">Título <span class="text-danger">*</span></label>
                    <input 
                      type="text" 
                      class="form-control" 
                      v-model="dialogoEditando.titulo"
                      required
                      placeholder="Ej: GUION ATENCIÓN AL CIUDADANO"
                    />
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Tipo</label>
                    <select class="form-select" v-model="dialogoEditando.tipo">
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="guion">Guion</option>
                    </select>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Categoría</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      v-model="dialogoEditando.categoria"
                      placeholder="Ej: atencion, caracterizacion, despedida"
                    />
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Mensaje <span class="text-danger">*</span></label>
                    <TrumbowygEditor
                      v-model="dialogoEditando.mensajeFormateado"
                      @change="onEditorChange"
                    />
                    <small class="form-text text-muted">
                      <i class="ni ni-settings-gear-65"></i> 
                      Usa el editor para formatear tu mensaje. El HTML se guardará automáticamente.
                    </small>
                  </div>

                  <!-- Preview en Tiempo Real -->
                  <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <label class="form-label mb-0">
                        <i class="ni ni-image"></i> Vista Previa en Tiempo Real
                      </label>
                      <small class="text-muted">
                        <i class="ni ni-button-play"></i> Actualización automática
                      </small>
                    </div>
                    <div class="preview-container border rounded p-3 shadow-sm" :class="getPreviewClass()">
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="mb-0 fw-bold">{{ dialogoEditando.titulo || 'Título del Diálogo' }}</h6>
                        <span class="badge" :class="getTipoBadgeClass(dialogoEditando.tipo)">
                          {{ dialogoEditando.tipo }}
                        </span>
                      </div>
                      <hr class="my-2">
                      <div 
                        class="preview-mensaje"
                        :class="{ 'text-muted fst-italic': !dialogoEditando.mensaje && !dialogoEditando.mensajeFormateado }"
                        v-html="getPreviewMensaje()"
                      ></div>
                      <div v-if="dialogoEditando.categoria" class="mt-2">
                        <small class="text-muted">
                          <i class="ni ni-tag"></i> Categoría: {{ dialogoEditando.categoria }}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Prioridad</label>
                      <select class="form-select" v-model.number="dialogoEditando.prioridad">
                        <option :value="1">1 - Más importante</option>
                        <option :value="2">2</option>
                        <option :value="3">3</option>
                        <option :value="4">4</option>
                        <option :value="5">5 - Menos importante</option>
                      </select>
                    </div>

                    <div class="col-md-6 mb-3">
                      <label class="form-label">Fecha de Expiración (opcional)</label>
                      <input 
                        type="datetime-local" 
                        class="form-control" 
                        v-model="dialogoEditando.fechaFin"
                      />
                      <small class="form-text text-muted">
                        Dejar vacío para que no expire nunca
                      </small>
                    </div>
                  </div>

                  <div class="mb-3">
                    <div class="form-check">
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        v-model="dialogoEditando.activo"
                        id="checkActivo"
                      />
                      <label class="form-check-label" for="checkActivo">
                        Activo (visible para los agentes)
                      </label>
                    </div>
                  </div>
                </fieldset>

                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" @click="cerrarModal" :disabled="guardando">Cancelar</button>
                  <button type="submit" class="btn btn-primary" :disabled="guardando">
                    <span v-if="guardando" class="spinner-border spinner-border-sm me-1"></span>
                    {{ dialogoEditando._id ? 'Actualizar' : 'Crear' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Ver Diálogo -->
    <div v-if="mostrarVerModal">
      <div class="modal-backdrop fade show" @click="cerrarVerModal" style="z-index: 1040;"></div>
      <div class="modal fade show d-block" tabindex="-1" style="z-index: 1050;">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ dialogoViendo.titulo }}</h5>
              <button type="button" class="btn-close" @click="cerrarVerModal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <strong>Tipo:</strong> 
                <span class="badge ms-2" :class="getTipoBadgeClass(dialogoViendo.tipo)">
                  {{ dialogoViendo.tipo }}
                </span>
              </div>
              <div class="mb-3">
                <strong>Estado:</strong> 
                <span class="badge ms-2" :class="dialogoViendo.activo ? 'badge-success' : 'badge-secondary'">
                  {{ dialogoViendo.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              <div class="mb-3">
                <strong>Prioridad:</strong> {{ dialogoViendo.prioridad }}
              </div>
              <hr>
              <div class="dialogo-preview">
                <h6 class="mb-3">Vista Previa:</h6>
                <div class="preview-container border rounded p-3" :class="getPreviewClassVer(dialogoViendo)">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0 fw-bold">{{ dialogoViendo.titulo }}</h6>
                    <span class="badge" :class="getTipoBadgeClass(dialogoViendo.tipo)">
                      {{ dialogoViendo.tipo }}
                    </span>
                  </div>
                  <hr class="my-2">
                  <div 
                    class="preview-mensaje"
                    v-html="getPreviewMensajeVer(dialogoViendo)"
                  ></div>
                  <div v-if="dialogoViendo.categoria" class="mt-2">
                    <small class="text-muted">
                      <i class="ni ni-tag"></i> Categoría: {{ dialogoViendo.categoria }}
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="cerrarVerModal">Cerrar</button>
              <button type="button" class="btn btn-warning" @click="editarDesdeVer">
                <i class="ni ni-ruler-pencil"></i>
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';
import TrumbowygEditor from '../components/TrumbowygEditor.vue';

export default {
  name: 'DialogosAdmin',
  components: {
    TrumbowygEditor
  },
  data() {
    return {
      loading: false,
      guardando: false,
      dialogos: [],
      mostrarModal: false,
      mostrarVerModal: false,
      dialogoEditando: {
        titulo: '',
        mensaje: '',
        mensajeFormateado: '',
        tipo: 'info',
        categoria: 'general',
        activo: true,
        prioridad: 1,
        fechaFin: null
      },
      dialogoViendo: {}
    };
  },
  async mounted() {
    await this.cargarDialogos();
  },
  methods: {
    async cargarDialogos() {
      this.loading = true;
      try {
        const response = await axios.get('/api/dialogos-agente');
        if (response.data.success) {
          this.dialogos = response.data.dialogos;
        }
      } catch (error) {
        console.error('Error cargando diálogos:', error);
        this.showNotification('Error cargando diálogos', 'error');
      } finally {
        this.loading = false;
      }
    },

    abrirModalCrear() {
      this.dialogoEditando = {
        titulo: '',
        mensaje: '',
        mensajeFormateado: '',
        tipo: 'info',
        categoria: 'general',
        activo: true,
        prioridad: 1,
        fechaFin: null
      };
      this.mostrarModal = true;
    },

    editarDialogo(dialogo) {
      // Si no hay mensajeFormateado pero sí mensaje, convertir a HTML básico
      let mensajeFormateado = dialogo.mensajeFormateado || '';
      if (!mensajeFormateado && dialogo.mensaje) {
        mensajeFormateado = dialogo.mensaje.replace(/\n/g, '<br>');
      }

      this.dialogoEditando = {
        _id: dialogo._id,
        titulo: dialogo.titulo,
        mensaje: dialogo.mensaje,
        mensajeFormateado: mensajeFormateado,
        tipo: dialogo.tipo,
        categoria: dialogo.categoria || 'general',
        activo: dialogo.activo,
        prioridad: dialogo.prioridad,
        fechaFin: dialogo.fechaFin ? new Date(dialogo.fechaFin).toISOString().slice(0, 16) : null
      };
      this.mostrarModal = true;
    },

    verDialogo(dialogo) {
      this.dialogoViendo = { ...dialogo };
      this.mostrarVerModal = true;
    },

    editarDesdeVer() {
      this.cerrarVerModal();
      this.editarDialogo(this.dialogoViendo);
    },

    cerrarModal() {
      this.mostrarModal = false;
      this.dialogoEditando = {
        titulo: '',
        mensaje: '',
        mensajeFormateado: '',
        tipo: 'info',
        categoria: 'general',
        activo: true,
        prioridad: 1,
        fechaFin: null
      };
    },

    cerrarVerModal() {
      this.mostrarVerModal = false;
      this.dialogoViendo = {};
    },

    async guardarDialogo() {
      // Validar que haya contenido
      const contenido = this.dialogoEditando.mensajeFormateado || this.dialogoEditando.mensaje;
      if (!contenido || !contenido.trim()) {
        this.showNotification('Por favor ingresa un mensaje', 'error');
        return;
      }

      // Validar título
      if (!this.dialogoEditando.titulo || !this.dialogoEditando.titulo.trim()) {
        this.showNotification('Por favor ingresa un título', 'error');
        return;
      }

      this.guardando = true;
      try {
        const data = {
          ...this.dialogoEditando
        };

        // Si hay mensajeFormateado pero no mensaje, extraer texto plano
        if (data.mensajeFormateado && !data.mensaje) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = data.mensajeFormateado;
          data.mensaje = tempDiv.textContent || tempDiv.innerText || '';
        }

        // Convertir fechaFin a formato correcto
        if (data.fechaFin) {
          data.fechaFin = new Date(data.fechaFin).toISOString();
        } else {
          data.fechaFin = null;
        }

        // Eliminar _id si es nuevo
        const id = data._id;
        delete data._id;

        let response;
        if (id) {
          response = await axios.put(`/api/dialogos-agente/${id}`, data);
        } else {
          response = await axios.post('/api/dialogos-agente', data);
        }

        if (response.data.success) {
          this.showNotification(
            id ? 'Diálogo actualizado correctamente' : 'Diálogo creado correctamente',
            'success'
          );
          this.cerrarModal();
          await this.cargarDialogos();
        }
      } catch (error) {
        console.error('Error guardando diálogo:', error);
        this.showNotification(
          error.response?.data?.message || 'Error guardando diálogo',
          'error'
        );
      } finally {
        this.guardando = false;
      }
    },

    async toggleActivo(dialogo) {
      try {
        const response = await axios.put(`/api/dialogos-agente/${dialogo._id}`, {
          activo: !dialogo.activo
        });

        if (response.data.success) {
          this.showNotification(
            dialogo.activo ? 'Diálogo desactivado' : 'Diálogo activado',
            'success'
          );
          await this.cargarDialogos();
        }
      } catch (error) {
        console.error('Error cambiando estado:', error);
        this.showNotification('Error cambiando estado del diálogo', 'error');
      }
    },

    async eliminarDialogo(dialogo) {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas eliminar el diálogo "${dialogo.titulo}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`/api/dialogos-agente/${dialogo._id}`);
          if (response.data.success) {
            this.showNotification('Diálogo eliminado correctamente', 'success');
            await this.cargarDialogos();
          }
        } catch (error) {
          console.error('Error eliminando diálogo:', error);
          this.showNotification('Error eliminando diálogo', 'error');
        }
      }
    },

    getTipoBadgeClass(tipo) {
      const clases = {
        info: 'badge-info',
        success: 'badge-success',
        warning: 'badge-warning',
        error: 'badge-danger',
        guion: 'badge-secondary'
      };
      return clases[tipo] || 'badge-secondary';
    },

    getPreviewClass() {
      const clases = {
        info: 'preview-info',
        success: 'preview-success',
        warning: 'preview-warning',
        error: 'preview-error',
        guion: 'preview-guion'
      };
      return clases[this.dialogoEditando.tipo] || 'preview-info';
    },

    getPreviewMensaje() {
      const mensaje = this.dialogoEditando.mensajeFormateado || this.dialogoEditando.mensaje || 'Tu mensaje aparecerá aquí...';
      // Si hay HTML formateado, usarlo directamente
      if (this.dialogoEditando.mensajeFormateado) {
        return mensaje;
      }
      // Si solo hay texto simple, convertir saltos de línea
      if (this.dialogoEditando.mensaje) {
        return mensaje.replace(/\n/g, '<br>');
      }
      return 'Tu mensaje aparecerá aquí...';
    },

    onEditorChange(html) {
      // Sincronizar mensajeFormateado con el HTML del editor
      this.dialogoEditando.mensajeFormateado = html;
      
      // Extraer texto plano del HTML para mensaje (backup)
      if (typeof window !== 'undefined' && window.DOMParser) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        this.dialogoEditando.mensaje = doc.body.textContent || '';
      } else {
        // Fallback: remover tags HTML básicas
        this.dialogoEditando.mensaje = html
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();
      }
    },

    getPreviewClassVer(dialogo) {
      const clases = {
        info: 'preview-info',
        success: 'preview-success',
        warning: 'preview-warning',
        error: 'preview-error',
        guion: 'preview-guion'
      };
      return clases[dialogo.tipo] || 'preview-info';
    },

    getPreviewMensajeVer(dialogo) {
      const mensaje = dialogo.mensajeFormateado || dialogo.mensaje || '';
      // Convertir saltos de línea a <br> si no hay HTML formateado
      if (!dialogo.mensajeFormateado && dialogo.mensaje) {
        return mensaje.replace(/\n/g, '<br>');
      }
      return mensaje;
    },

    showNotification(message, type = 'info') {
      Swal.fire({
        icon: type,
        title: message,
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  }
};
</script>

<style scoped>
.dialogos-admin-container {
  min-height: calc(100vh - 200px);
}

.dialogo-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.dialogo-mensaje {
  white-space: pre-line;
  line-height: 1.6;
}

.modal.show {
  display: block;
  opacity: 1;
}

.modal-backdrop.show {
  opacity: 0.5;
}

/* Estilos para el Preview en Tiempo Real */
.preview-container {
  background: #ffffff;
  transition: all 0.3s ease;
  min-height: 150px;
}

.preview-info {
  border-left: 4px solid #17a2b8 !important;
  background: linear-gradient(to right, rgba(23, 162, 184, 0.05), #ffffff);
}

.preview-success {
  border-left: 4px solid #28a745 !important;
  background: linear-gradient(to right, rgba(40, 167, 69, 0.05), #ffffff);
}

.preview-warning {
  border-left: 4px solid #ffc107 !important;
  background: linear-gradient(to right, rgba(255, 193, 7, 0.05), #ffffff);
}

.preview-error {
  border-left: 4px solid #dc3545 !important;
  background: linear-gradient(to right, rgba(220, 53, 69, 0.05), #ffffff);
}

.preview-guion {
  border-left: 4px solid #6c757d !important;
  background: linear-gradient(to right, rgba(108, 117, 125, 0.05), #ffffff);
}

.preview-mensaje {
  line-height: 1.8;
  color: #344767;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.preview-mensaje :deep(br) {
  display: block;
  margin: 0.5em 0;
}

.preview-mensaje :deep(p) {
  margin-bottom: 0.5em;
}

.preview-mensaje :deep(ul),
.preview-mensaje :deep(ol) {
  margin-left: 1.5em;
  margin-bottom: 0.5em;
}

.preview-mensaje :deep(strong),
.preview-mensaje :deep(b) {
  font-weight: 600;
}

.preview-mensaje :deep(em),
.preview-mensaje :deep(i) {
  font-style: italic;
}

/* Estilos para Trumbowyg Editor */
.trumbowyg-wrapper {
  margin-bottom: 0;
}

.trumbowyg-wrapper :deep(.trumbowyg-box) {
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  overflow: hidden;
}

.trumbowyg-wrapper :deep(.trumbowyg-button-pane) {
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.trumbowyg-wrapper :deep(.trumbowyg-button-pane button) {
  border: none;
  background: transparent;
}

.trumbowyg-wrapper :deep(.trumbowyg-button-pane button:hover) {
  background: #e9ecef;
}

.trumbowyg-wrapper :deep(.trumbowyg-editor) {
  min-height: 250px;
  padding: 15px;
  background: #ffffff;
  font-size: 14px;
  line-height: 1.6;
  color: #344767;
}

.trumbowyg-wrapper :deep(.trumbowyg-editor:focus) {
  outline: none;
}

.trumbowyg-wrapper :deep(.trumbowyg-box.trumbowyg-box-visible) {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.trumbowyg-wrapper :deep(.trumbowyg-modal-box) {
  z-index: 1060;
}
</style>

<style>
/* Estilos globales para Trumbowyg (se carga desde CDN) */
.trumbowyg-modal-box {
  z-index: 1060 !important;
}

.trumbowyg-dropdown {
  z-index: 1061 !important;
}
</style>

