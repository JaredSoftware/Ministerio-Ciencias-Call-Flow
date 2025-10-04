<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <div class="d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center">
                <button class="btn btn-sm btn-outline-secondary me-2" @click="goBack">
                  <i class="ni ni-bold-left"></i>
                  Volver
                </button>
                  <h6 class="mb-0">
                    <i class="ni ni-monitor text-info me-2"></i>
                    Panel Administrativo 1
                  </h6>
              </div>
              <div class="d-flex align-items-center">
                <span class="badge me-2" :class="connectionStatus.badgeClass">
                  <i :class="connectionStatus.icon"></i>
                  {{ connectionStatus.text }}
                </span>
                <button class="btn btn-sm btn-outline-light me-2" @click="refreshIframe" :disabled="loading">
                  <i class="ni ni-button-power"></i>
                  Recargar
                </button>
                <button class="btn btn-sm btn-outline-light" @click="openInNewTab">
                  <i class="ni ni-world"></i>
                  Abrir en Nueva Pestaña
                </button>
              </div>
            </div>
            <div class="mt-2">
              <small class="text-light opacity-75">
                <i class="ni ni-planet me-1"></i>
                URL: {{ iframeUrl }}<br>
                <i class="ni ni-info me-1"></i>
                Sistema de gestión administrativa<br>
                <i class="ni ni-notification-70 me-1"></i>
                <span class="text-warning">Nota: Si no carga, el servidor puede tener restricciones CORS</span>
              </small>
            </div>
          </div>
          <div class="card-body p-0">
            <!-- Estado de carga -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p class="mt-2 text-muted">Cargando panel administrativo...</p>
              <div class="progress mt-3" style="width: 300px; margin: 0 auto;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" style="width: 100%"></div>
              </div>
            </div>
            
            <!-- Estado de error -->
            <div v-else-if="error" class="alert alert-danger m-3">
              <div class="d-flex align-items-center">
                <i class="ni ni-notification-70 me-2 fs-4"></i>
                <div class="flex-grow-1">
                  <h6 class="alert-heading">Error de Conexión</h6>
                  <p class="mb-2">{{ error }}</p>
                  <small class="text-muted">
                    <i class="ni ni-time-alarm me-1"></i>
                    Último intento: {{ lastAttemptTime }}
                  </small>
                </div>
              </div>
              <hr>
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <button class="btn btn-sm btn-outline-danger me-2" @click="loadIframe">
                    <i class="ni ni-button-power me-1"></i>
                    Reintentar
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" @click="testConnection">
                    <i class="ni ni-world me-1"></i>
                    Probar Conexión
                  </button>
                </div>
                <div>
                  <small class="text-muted">
                    Intentos: {{ retryCount }}/{{ maxRetries }}
                  </small>
                </div>
              </div>
            </div>
            
            <!-- Iframe -->
            <div v-else class="position-relative">
              <iframe
                :src="iframeUrl"
                frameborder="0"
                class="admin-iframe"
                @load="onIframeLoad"
                @error="onIframeError"
                :sandbox="iframeSandbox"
                allow="*"
                ref="adminIframe"
              ></iframe>
              
              <!-- Overlay de estado -->
              <div v-if="showStatusOverlay" class="iframe-status-overlay">
                <div class="status-card">
                  <i class="ni ni-check-circle text-success fs-1"></i>
                  <h6 class="text-success mt-2">Conectado</h6>
                  <small class="text-muted">Panel cargado correctamente</small>
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
export default {
  name: "AdminIframe1",
  data() {
    return {
      loading: true,
      error: null,
      retryCount: 0,
      maxRetries: 3,
      lastAttemptTime: null,
      showStatusOverlay: false,
      iframeTimeout: null,
      iframeSandbox: "allow-same-origin allow-scripts allow-forms allow-popups allow-presentation",
      iframeUrl: "https://172.16.116.3:7070/WebManagement/index.html"
    };
  },
  computed: {
    connectionStatus() {
      if (this.loading) {
        return {
          text: 'Conectando...',
          badgeClass: 'badge-warning',
          icon: 'ni ni-spinner ni-spin'
        };
      }
      if (this.error) {
        return {
          text: 'Error de Conexión',
          badgeClass: 'badge-danger',
          icon: 'ni ni-notification-70'
        };
      }
      return {
        text: 'Conectado',
        badgeClass: 'badge-success',
        icon: 'ni ni-check-circle'
      };
    }
  },
  mounted() {
    this.loadIframe();
  },
  methods: {
    async loadIframe() {
      this.loading = true;
      this.error = null;
      this.lastAttemptTime = new Date().toLocaleString();
      
      // Construir URL dinámicamente si es necesario
      this.buildDynamicUrl();
      
      console.log(`🔄 Cargando iframe Admin 1: ${this.iframeUrl}`);
      
      // Verificar conectividad básica (más permisivo para CORS)
      const isAccessible = await this.checkUrlAccessibility();
      if (!isAccessible) {
        this.error = `❌ Servidor no accesible: ${this.iframeUrl}\n\n🔍 Diagnóstico:\n• Servidor: ${this.iframeUrl.split('://')[1].split(':')[0]}\n• Puerto: ${this.iframeUrl.split(':')[2].split('/')[0]}\n• Problema: No responde a peticiones\n\n💡 Soluciones:\n• Verifica que el servidor esté funcionando\n• Comprueba conectividad de red\n• Revisa firewall\n• Prueba abriendo la URL en nueva pestaña`;
        this.loading = false;
        return;
      }
      
      console.log("✅ Servidor accesible, cargando iframe...");
      
      // Timeout más largo para iframes (20 segundos)
      this.iframeTimeout = setTimeout(() => {
        if (this.loading) {
          console.warn("⏰ Timeout del iframe después de 20 segundos");
          this.onIframeError();
        }
      }, 20000);
    },
    
    buildDynamicUrl() {
      // Construir URL basada en configuración del usuario si existe
      const user = this.$store.state.user;
      if (user && user.iframeConfig && user.iframeConfig.adminPanel1) {
        this.iframeUrl = user.iframeConfig.adminPanel1;
        console.log('👤 URL personalizada del usuario:', this.iframeUrl);
      }
    },
    
    onIframeLoad() {
      this.loading = false;
      this.retryCount = 0;
      this.showStatusOverlay = true;
      
      // Limpiar timeout
      if (this.iframeTimeout) {
        clearTimeout(this.iframeTimeout);
        this.iframeTimeout = null;
      }
      
      console.log("✅ Panel Admin 1 cargado correctamente");
      
      // Ocultar overlay después de 2 segundos
      setTimeout(() => {
        this.showStatusOverlay = false;
      }, 2000);
    },
    
    onIframeError() {
      this.loading = false;
      this.retryCount++;
      
      // Limpiar timeout
      if (this.iframeTimeout) {
        clearTimeout(this.iframeTimeout);
        this.iframeTimeout = null;
      }
      
      console.error(`❌ Error en iframe Admin 1 (intento ${this.retryCount}/${this.maxRetries})`);
      
      if (this.retryCount < this.maxRetries) {
        console.log(`⚠️ Reintentando en 3 segundos...`);
        setTimeout(() => {
          this.loadIframe();
        }, 3000);
      } else {
        const serverIp = this.iframeUrl.split('://')[1].split(':')[0];
        const port = this.iframeUrl.split(':')[2].split('/')[0];
        
        this.error = `❌ No se pudo cargar el panel administrativo después de ${this.maxRetries} intentos.\n\n🔍 Diagnóstico:\n• Servidor: ${serverIp}:${port}\n• URL: ${this.iframeUrl}\n• Último intento: ${this.lastAttemptTime}\n• Problema: Restricciones CORS o servidor no responde\n\n💡 Soluciones:\n• El servidor responde pero tiene restricciones CORS\n• Usa el botón "Abrir en Nueva Pestaña" para acceder directamente\n• Verifica configuración CORS en el servidor ${serverIp}:${port}\n• Comprueba conectividad de red\n\n🌐 Alternativa: Abre la URL directamente en nueva pestaña.`;
        console.error("❌ Error definitivo en iframe Admin 1:", this.error);
      }
    },
    
    async checkUrlAccessibility() {
      try {
        console.log("🔍 Verificando accesibilidad...");
        
        // Para servidores con CORS, usar no-cors directamente
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout
        
        await fetch(this.iframeUrl, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors',
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        console.log("✅ Servidor accesible (no-cors)");
        return true;
        
      } catch (error) {
        console.warn("⚠️ Error verificando servidor:", error.message);
        
        // Si falla completamente, el servidor no está disponible
        console.error("❌ Servidor no accesible:", error.message);
        return false;
      }
    },
    
    async testConnection() {
      try {
        console.log("🔍 Probando conexión...");
        const isAccessible = await this.checkUrlAccessibility();
        if (isAccessible) {
          console.log("✅ Conexión exitosa");
          this.error = null;
        } else {
          console.log("❌ Conexión fallida");
          this.error = "Servidor no responde. Verifica la conectividad.";
        }
      } catch (error) {
        console.error("❌ Error en prueba de conexión:", error);
        this.error = `Prueba de conexión fallida: ${error.message}`;
      }
    },
    
    refreshIframe() {
      this.loading = true;
      this.error = null;
      this.retryCount = 0;
      this.loadIframe();
    },
    
    openInNewTab() {
      window.open(this.iframeUrl, '_blank', 'noopener,noreferrer');
    },
    
    goBack() {
      this.$router.go(-1);
    }
  }
};
</script>

<style scoped>
.admin-iframe {
  width: 100%;
  height: calc(100vh - 200px);
  min-height: 600px;
  border: none;
  border-radius: 0 0 0.375rem 0.375rem;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0.375rem 0.375rem 0 0;
}

.card-header h6 {
  color: white !important;
}

.btn-outline-secondary {
  border-color: rgba(255,255,255,0.3);
  color: white;
}

.btn-outline-secondary:hover {
  background-color: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.5);
  color: white;
}

.btn-outline-light {
  border-color: rgba(255,255,255,0.3);
  color: white;
}

.btn-outline-light:hover {
  background-color: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.5);
  color: white;
}

.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
}

.badge-warning {
  background-color: #ffc107;
  color: #000;
}

.badge-success {
  background-color: #28a745;
  color: #fff;
}

.badge-danger {
  background-color: #dc3545;
  color: #fff;
}

/* Overlay de estado del iframe */
.iframe-status-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
  animation: fadeInOut 2s ease-in-out;
}

.status-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
}

/* Mejoras de responsividad */
@media (max-width: 768px) {
  .admin-iframe {
    height: calc(100vh - 250px);
    min-height: 400px;
  }
  
  .card-header {
    padding: 0.75rem;
  }
  
  .d-flex.justify-content-between {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .d-flex.justify-content-between > div:last-child {
    margin-top: 0.5rem;
    width: 100%;
    justify-content: space-between;
  }
}
</style>
