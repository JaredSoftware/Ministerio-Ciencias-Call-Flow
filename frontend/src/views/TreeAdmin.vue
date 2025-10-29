<template>
  <div class="tree-admin-container bg-white">
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header pb-0">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h4 class="mb-0">🌳 Administración del Árbol de Tipificación</h4>
                  <p class="text-sm text-secondary mb-0">
                    Gestiona la estructura jerárquica de categorías para las tipificaciones
                  </p>
                </div>
                <div class="d-flex gap-2">
                  <button 
                    class="btn btn-outline-info btn-sm"
                    @click="downloadCurrentTree"
                    :disabled="loading"
                  >
                    <i class="ni ni-cloud-download-95"></i>
                    Descargar Actual
                  </button>
                  <button 
                    class="btn btn-outline-warning btn-sm"
                    @click="initializeDefaultTree"
                    :disabled="loading"
                  >
                    <i class="ni ni-button-power"></i>
                    Crear Por Defecto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Panel de Subida de Archivo -->
        <div class="col-lg-6 mb-4">
          <div class="card">
            <div class="card-header pb-0">
              <h6 class="mb-0">📤 Subir Nuevo Árbol</h6>
              <p class="text-sm text-secondary mb-0">
                Sube un archivo JSON con la nueva estructura del árbol
              </p>
            </div>
            <div class="card-body">
              <!-- Área de subida de archivo -->
              <div 
                class="upload-area"
                :class="{ 'drag-over': isDragOver, 'uploading': uploading }"
                @drop="handleFileDrop"
                @dragover="handleDragOver"
                @dragleave="handleDragLeave"
                @click="triggerFileInput"
              >
              <input 
                ref="fileInput"
                type="file"
                accept=".json,application/json,.csv,text/csv"
                @change="handleFileSelect"
                style="display: none;"
              />
                
                <div v-if="!uploading" class="upload-content">
                  <i class="ni ni-cloud-upload-96 upload-icon"></i>
                  <h6 class="upload-title">
                    {{ selectedFile ? selectedFile.name : 'Arrastra tu archivo JSON o CSV aquí' }}
                  </h6>
                  <p class="upload-subtitle">
                    {{ selectedFile ? 'Archivo seleccionado' : 'O haz clic para seleccionar' }}
                  </p>
                  <div v-if="selectedFile" class="file-info">
                    <small class="text-success">
                      <i class="ni ni-check-bold"></i>
                      {{ formatFileSize(selectedFile.size) }}
                    </small>
                  </div>
                </div>
                
                <div v-else class="upload-content">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Subiendo...</span>
                  </div>
                  <h6 class="upload-title mt-2">Subiendo archivo...</h6>
                  <p class="upload-subtitle">Por favor espera</p>
                </div>
              </div>

              <!-- Botones de acción -->
              <div class="mt-3 d-flex gap-2">
                <button 
                  class="btn btn-primary"
                  @click="uploadTree"
                  :disabled="!selectedFile || uploading"
                >
                  <i class="ni ni-cloud-upload-95"></i>
                  Subir Archivo
                </button>
                <button 
                  class="btn btn-outline-secondary"
                  @click="clearFile"
                  :disabled="!selectedFile || uploading"
                >
                  <i class="ni ni-fat-remove"></i>
                  Limpiar
                </button>
              </div>

              <!-- Información de ayuda -->
              <div class="mt-3">
          <div class="alert alert-info">
            <h6 class="alert-heading">
              <i class="ni ni-bulb-61"></i>
              Formato de Archivo CSV
            </h6>
            <ul class="mb-0 small">
              <li><strong>Primera línea (encabezado):</strong> nivel1,nivel2,nivel3,nivel4,nivel5</li>
              <li><strong>Siguientes líneas:</strong> tus categorías en orden jerárquico</li>
              <li><strong>Ejemplo:</strong><br>
                <code style="font-size: 0.85em;">
                  Transferencia llamada,Despacho del Ministro,,,<br>
                  Convocatorias,Información general,,,<br>
                  Plataforma Red Scienti,Activación de usuario,Crear cuenta,,
                </code>
              </li>
              <li><strong>Importante:</strong> Si Excel no deja celdas vacías, ¡no importa! El sistema las detecta automáticamente</li>
              <li>Usa el botón "Crear Por Defecto" para ver un ejemplo completo</li>
            </ul>
          </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel de Información del Árbol Actual -->
        <div class="col-lg-6 mb-4">
          <div class="card">
            <div class="card-header pb-0">
              <h6 class="mb-0">📋 Árbol Actual</h6>
              <p class="text-sm text-secondary mb-0">
                Información del árbol de tipificación en uso
              </p>
            </div>
            <div class="card-body">
              <div v-if="loading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-secondary">Cargando información del árbol...</p>
              </div>

              <div v-else-if="currentTree" class="tree-info">
                <div class="row">
                  <div class="col-sm-6">
                    <div class="info-item">
                      <label class="info-label">Nombre:</label>
                      <span class="info-value">{{ currentTree.name }}</span>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="info-item">
                      <label class="info-label">Estado:</label>
                      <span class="badge bg-success">Activo</span>
                    </div>
                  </div>
                </div>

                <div class="info-item mt-2">
                  <label class="info-label">Descripción:</label>
                  <p class="info-value">{{ currentTree.description }}</p>
                </div>

                <div class="row">
                  <div class="col-sm-6">
                    <div class="info-item">
                      <label class="info-label">Nodos Raíz:</label>
                      <span class="info-value">{{ currentTree.root.length }}</span>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="info-item">
                      <label class="info-label">Última Actualización:</label>
                      <span class="info-value">{{ formatDate(currentTree.updatedAt) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Vista previa del árbol -->
                <div class="mt-3">
                  <label class="info-label">Vista Previa:</label>
                  <div class="tree-preview">
                    <div 
                      v-for="(node, index) in currentTree.root.slice(0, 3)" 
                      :key="index"
                      class="tree-node"
                    >
                      <i class="ni ni-bullet-list-67 text-primary"></i>
                      <span class="node-label">{{ node.label }}</span>
                      <small class="text-secondary">
                        ({{ node.children ? node.children.length : 0 }} subcategorías)
                      </small>
                    </div>
                    <div v-if="currentTree.root.length > 3" class="text-center mt-2">
                      <small class="text-secondary">
                        ... y {{ currentTree.root.length - 3 }} categorías más
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-4">
                <i class="ni ni-folder-17 text-secondary" style="font-size: 48px; opacity: 0.3;"></i>
                <h6 class="mt-2 text-secondary">No hay árbol configurado</h6>
                <p class="text-sm text-secondary">
                  Sube un archivo JSON o crea un árbol por defecto
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Historial de Cambios -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header pb-0">
              <h6 class="mb-0">📜 Historial de Cambios</h6>
            </div>
            <div class="card-body">
              <div v-if="uploadHistory.length === 0" class="text-center py-3">
                <i class="ni ni-time-alarm text-secondary" style="font-size: 32px; opacity: 0.3;"></i>
                <p class="text-secondary mt-2 mb-0">No hay historial de cambios</p>
              </div>
              <div v-else>
                <div 
                  v-for="(item, index) in uploadHistory" 
                  :key="index"
                  class="history-item"
                >
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 class="mb-1">{{ item.action }}</h6>
                      <p class="text-sm text-secondary mb-0">
                        {{ formatDate(item.timestamp) }} - {{ item.user }}
                      </p>
                    </div>
                    <span class="badge" :class="item.success ? 'bg-success' : 'bg-danger'">
                      {{ item.success ? 'Éxito' : 'Error' }}
                    </span>
                  </div>
                  <div v-if="item.message" class="mt-2">
                    <small class="text-muted">{{ item.message }}</small>
                  </div>
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
import axios from 'axios';

export default {
  name: 'TreeAdmin',
  data() {
    return {
      loading: false,
      uploading: false,
      selectedFile: null,
      isDragOver: false,
      currentTree: null,
      uploadHistory: []
    };
  },
  async mounted() {
    await this.loadCurrentTree();
  },
  methods: {
    async loadCurrentTree() {
      this.loading = true;
      try {
        const response = await axios.get('/api/tree');
        if (response.data.success) {
          this.currentTree = response.data.tree;
        }
      } catch (error) {
        console.error('Error cargando árbol actual:', error);
        if (error.response?.status !== 404) {
          this.showNotification('Error cargando información del árbol', 'error');
        }
      } finally {
        this.loading = false;
      }
    },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.validateAndSetFile(file);
      }
    },

    handleFileDrop(event) {
      event.preventDefault();
      this.isDragOver = false;
      
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.validateAndSetFile(files[0]);
      }
    },

    handleDragOver(event) {
      event.preventDefault();
      this.isDragOver = true;
    },

    handleDragLeave(event) {
      event.preventDefault();
      this.isDragOver = false;
    },

    validateAndSetFile(file) {
      // Validar tipo de archivo
      const isJson = file.type.includes('json') || file.name.endsWith('.json');
      const isCsv = file.type.includes('csv') || file.name.endsWith('.csv');
      
      if (!isJson && !isCsv) {
        this.showNotification('Solo se permiten archivos JSON y CSV', 'error');
        return;
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showNotification('El archivo es demasiado grande (máximo 5MB)', 'error');
        return;
      }

      this.selectedFile = file;
    },

    clearFile() {
      this.selectedFile = null;
      this.$refs.fileInput.value = '';
    },

    async uploadTree() {
      if (!this.selectedFile) {
        this.showNotification('Por favor selecciona un archivo primero', 'error');
        return;
      }

      this.uploading = true;

      try {
        // Leer el archivo
        const fileContent = await this.readFile(this.selectedFile);
        let treeData;

        // Parsear según el tipo de archivo
        if (this.selectedFile.name.endsWith('.json')) {
          treeData = JSON.parse(fileContent);
        } else if (this.selectedFile.name.endsWith('.csv')) {
          // Convertir CSV a JSON (implementación básica)
          treeData = this.csvToJson(fileContent);
        } else {
          throw new Error('Formato de archivo no soportado');
        }

        console.log('📤 Subiendo árbol:', treeData);

        // Enviar al servidor
        const response = await axios.post('/api/tree/upload', {
          tree: treeData,
          fileName: this.selectedFile.name
        });

        if (response.data.success) {
          this.showNotification('Árbol actualizado correctamente', 'success');
          this.addToHistory(
            'Árbol subido desde archivo', 
            this.$store.state.user?.name || 'Usuario', 
            true, 
            `Archivo: ${this.selectedFile.name}`
          );
          await this.loadCurrentTree();
          this.clearFile();
        }
      } catch (error) {
        console.error('Error subiendo árbol:', error);
        const message = error.response?.data?.message || error.message || 'Error subiendo archivo';
        this.showNotification(message, 'error');
        this.addToHistory(
          'Error subiendo árbol', 
          this.$store.state.user?.name || 'Usuario', 
          false, 
          message
        );
      } finally {
        this.uploading = false;
      }
    },

    readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          console.log('📄 Archivo leído como UTF-8');
          console.log('📄 Primeros 200 caracteres:', content.substring(0, 200));
          resolve(content);
        };
        reader.onerror = reject;
        // Leer como texto UTF-8 (el estándar)
        reader.readAsText(file, 'UTF-8');
      });
    },

    csvToJson(csvContent) {
      // Implementación flexible de CSV a JSON para árbol
      // Soporta de 1 a 5 niveles: nivel1,nivel2,nivel3,nivel4,nivel5
      console.log('📄 Convirtiendo CSV a JSON...');
      
      const lines = csvContent.split('\n').filter(line => line.trim());
      const tree = {
        name: 'Árbol desde CSV',
        description: 'Importado desde archivo CSV',
        version: '1.0',
        root: []
      };

      // Maps para evitar duplicados en cada nivel
      const nivel1Map = new Map();
      const nivel2Map = new Map();
      const nivel3Map = new Map();
      const nivel4Map = new Map();

      lines.forEach((line, index) => {
        // Skip header (primera línea)
        if (index === 0) return;
        
        // Split y limpiar espacios
        const parts = line.split(',').map(part => part.trim());
        
        // Si la línea está vacía o no tiene nivel1, saltarla
        if (parts.length === 0 || !parts[0]) return;

        // El archivo ya viene correctamente decodificado como UTF-8
        const [nivel1, nivel2, nivel3, nivel4, nivel5] = parts;
        
        console.log(`Línea ${index}: ${nivel1} > ${nivel2 || ''} > ${nivel3 || ''} > ${nivel4 || ''} > ${nivel5 || ''}`);
        
        // ====== NIVEL 1 ======
        if (!nivel1Map.has(nivel1)) {
          const node1 = {
            value: nivel1.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_áéíóúñü]/g, ''),
            label: nivel1,
            children: []
          };
          nivel1Map.set(nivel1, node1);
          tree.root.push(node1);
        }
        const node1 = nivel1Map.get(nivel1);

        // ====== NIVEL 2 ======
        if (nivel2) {
          const nivel2Key = `${nivel1}|${nivel2}`;
          
          if (!nivel2Map.has(nivel2Key)) {
            const node2 = {
              value: nivel2.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_áéíóúñü]/g, ''),
              label: nivel2,
              children: []
            };
            nivel2Map.set(nivel2Key, node2);
            node1.children.push(node2);
          }
          const node2 = nivel2Map.get(nivel2Key);

          // ====== NIVEL 3 ======
          if (nivel3) {
            const nivel3Key = `${nivel1}|${nivel2}|${nivel3}`;
            
            if (!nivel3Map.has(nivel3Key)) {
              const node3 = {
                value: nivel3.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_áéíóúñü]/g, ''),
                label: nivel3,
                children: []
              };
              nivel3Map.set(nivel3Key, node3);
              node2.children.push(node3);
            }
            const node3 = nivel3Map.get(nivel3Key);

            // ====== NIVEL 4 ======
            if (nivel4) {
              const nivel4Key = `${nivel1}|${nivel2}|${nivel3}|${nivel4}`;
              
              if (!nivel4Map.has(nivel4Key)) {
                const node4 = {
                  value: nivel4.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_áéíóúñü]/g, ''),
                  label: nivel4,
                  children: []
                };
                nivel4Map.set(nivel4Key, node4);
                node3.children.push(node4);
              }
              const node4 = nivel4Map.get(nivel4Key);

              // ====== NIVEL 5 ======
              if (nivel5) {
                const node5 = {
                  value: nivel5.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_áéíóúñü]/g, ''),
                  label: nivel5,
                  children: []
                };
                node4.children.push(node5);
              }
            }
          }
        }
      });

      console.log(`✅ CSV convertido: ${tree.root.length} nodos raíz`);
      return tree;
    },

    async downloadCurrentTree() {
      try {
        const response = await axios.get('/api/tree/download', {
          responseType: 'blob'
        });

        // Crear enlace de descarga
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `arbol_tipificacion_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        this.showNotification('Archivo descargado correctamente', 'success');
      } catch (error) {
        console.error('Error descargando árbol:', error);
        this.showNotification('Error descargando archivo', 'error');
      }
    },

    async initializeDefaultTree() {
      if (!confirm('¿Estás seguro de que quieres crear un árbol por defecto? Esto reemplazará el árbol actual si existe.')) {
        return;
      }

      try {
        const response = await axios.post('/api/tree/initialize');
        if (response.data.success) {
          this.showNotification('Árbol por defecto creado correctamente', 'success');
          this.addToHistory('Árbol por defecto creado', this.$store.state.user?.name || 'Usuario', true, response.data.message);
          await this.loadCurrentTree();
        }
      } catch (error) {
        console.error('Error inicializando árbol:', error);
        this.showNotification('Error creando árbol por defecto', 'error');
        this.addToHistory('Error creando árbol por defecto', this.$store.state.user?.name || 'Usuario', false, error.response?.data?.message);
      }
    },

    addToHistory(action, user, success, message = '') {
      this.uploadHistory.unshift({
        action,
        user,
        success,
        message,
        timestamp: new Date()
      });

      // Mantener solo los últimos 10 elementos
      if (this.uploadHistory.length > 10) {
        this.uploadHistory = this.uploadHistory.slice(0, 10);
      }
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    showNotification(message, type = 'info') {
      // Usar el sistema de notificaciones existente o crear una simple
      console.log(`[${type.toUpperCase()}] ${message}`);
      
      // Crear notificación visual simple
      const notification = document.createElement('div');
      notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
      notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
      notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      
      document.body.appendChild(notification);
      
      // Auto-remover después de 5 segundos
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
    }
  }
};
</script>

<style scoped>
.tree-admin-container {
  min-height: 100vh;
}

.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.upload-area:hover {
  border-color: #5e72e4;
  background-color: #f0f2ff;
}

.upload-area.drag-over {
  border-color: #5e72e4;
  background-color: #e3f2fd;
  transform: scale(1.02);
}

.upload-area.uploading {
  border-color: #28a745;
  background-color: #d4edda;
  cursor: not-allowed;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 3rem;
  color: #5e72e4;
  margin-bottom: 1rem;
}

.upload-title {
  font-weight: 600;
  color: #344767;
  margin-bottom: 0.5rem;
}

.upload-subtitle {
  color: #8392ab;
  margin-bottom: 0;
}

.file-info {
  margin-top: 0.5rem;
}

.tree-info {
  padding: 1rem 0;
}

.info-item {
  margin-bottom: 1rem;
}

.info-label {
  font-weight: 600;
  color: #344767;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  display: block;
}

.info-value {
  color: #8392ab;
  font-size: 0.875rem;
}

.tree-preview {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 0.5rem;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid #e9ecef;
}

.tree-node:last-child {
  border-bottom: none;
}

.node-label {
  font-weight: 500;
  color: #344767;
}

.history-item {
  padding: 1rem;
  border-left: 3px solid #e9ecef;
  margin-bottom: 1rem;
  background-color: #f8f9fa;
  border-radius: 0 6px 6px 0;
}

.history-item:last-child {
  margin-bottom: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.alert {
  border: none;
  border-radius: 8px;
}

.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-header {
  background-color: transparent;
  border-bottom: 1px solid #e9ecef;
}
</style>
