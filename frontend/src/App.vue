<template>
  <div id="app">
    <!-- Indicador de estado del usuario - Línea superior -->
    <status-indicator-bar v-if="this.$store.state.isLoggedIn" />
    <!-- Monitor de sincronización de estados -->
    <status-sync-monitor v-if="this.$store.state.isLoggedIn" />
    
    <div
      v-show="this.$store.state.layout === 'landing'"
      class="landing-bg h-100 bg-gradient-primary position-fixed w-100"
    ></div>
    <sidenav
      v-if="this.$store.state.isLoggedIn && this.$store.state.showSidenav"
      :custom_class="this.$store.state.mcolor"
      :class="[
        this.$store.state.isTransparent,
        this.$store.state.isRTL ? 'fixed-end' : 'fixed-start'
      ]"
    />
    <main
      class="main-content position-relative max-height-vh-100 h-100 border-radius-lg"
      style="padding-top: 3px;"
    >
      <!-- nav -->
      <navbar
        v-if="this.$store.state.isLoggedIn && this.$store.state.showNavbar"
        :class="[navClasses]"
        :textWhite="
          this.$store.state.isAbsolute ? 'text-white opacity-8' : 'text-white'
        "
        :minNav="navbarMinimize"
      />
      <router-view />
      <app-footer v-if="this.$store.state.isLoggedIn && this.$store.state.showFooter" />
      <configurator
        v-if="this.$store.state.isLoggedIn"
        :toggle="toggleConfigurator"
        :class="[
          this.$store.state.showConfig ? 'show' : '',
          this.$store.state.hideConfigButton ? 'd-none' : ''
        ]"
      />
    </main>
  </div>
</template>
<script>
import Sidenav from "./examples/Sidenav";
import Configurator from "@/examples/Configurator.vue";
import Navbar from "@/examples/Navbars/Navbar.vue";
import AppFooter from "@/examples/Footer.vue";
import StatusIndicatorBar from "@/components/StatusIndicatorBar.vue";
import StatusSyncMonitor from "@/components/StatusSyncMonitor.vue";
import { mapMutations } from "vuex";
import { mqttService } from '@/router/services/mqttService';
import websocketService from '@/router/services/websocketService';
import environmentConfig from '@/config/environment';
import inactivityService from '@/services/inactivityService';
import sessionLockService from '@/services/sessionLockService';

export default {
  name: "App",
  components: {
    Sidenav,
    Configurator,
    Navbar,
    AppFooter,
    StatusIndicatorBar,
    StatusSyncMonitor
  },
  computed: {
    navClasses() {
      return {
        "position-sticky bg-white left-auto top-2 z-index-sticky":
          this.$store.state.isNavFixed && !this.$store.state.darkMode,
        "position-sticky bg-default left-auto top-2 z-index-sticky":
          this.$store.state.isNavFixed && this.$store.state.darkMode,
        "position-absolute px-4 mx-0 w-100 z-index-2": this.$store.state
          .isAbsolute,
        "px-0 mx-4": !this.$store.state.isAbsolute
      };
    }
  },
  watch: {
    '$store.state.isLoggedIn': {
      immediate: true,
      handler(isLoggedIn) {
        if (isLoggedIn && this.$store.state.user && this.$store.state.user._id) {
          if (!mqttService.isConnected) {
            // Usar configuración dinámica para MQTT
            const mqttUrl = environmentConfig.getMQTTBrokerUrl();
            mqttService.connect(mqttUrl, this.$store.state.user._id, this.$store.state.user.name);
            
            // 🔒 CONFIGURAR CALLBACK PARA CERRAR SESIÓN SI HAY MÚLTIPLES DESCONEXIONES
            mqttService.onSystemEvent('onForceLogout', () => {
              this.handleMQTTForceLogout();
            });
          }
          if (!websocketService.isConnected) {
            websocketService.connect({
              id: this.$store.state.user._id,
              name: this.$store.state.user.name,
              email: this.$store.state.user.correo
            });
          }
          // Configurar listeners para cambios de estado automáticos
          this.setupAutoStatusChangeListeners();
          
          // 🕐 Iniciar monitoreo de inactividad
          inactivityService.start();
          
          // 🔒 Iniciar sistema de sesión única
          sessionLockService.start(this.$store.state.user._id, this.$store.state.user.name);
        } else {
          // Usuario deslogueado - detener servicios
          inactivityService.stop();
          sessionLockService.stop();
        }
      }
    },
    '$store.state.user': {
      immediate: true,
      handler(user) {
        if (this.$store.state.isLoggedIn && user && user._id) {
          if (!mqttService.isConnected) {
            // Usar configuración dinámica para MQTT
            const mqttUrl = environmentConfig.getMQTTBrokerUrl();
            mqttService.connect(mqttUrl, user._id, user.name);
            
            // 🔒 CONFIGURAR CALLBACK PARA CERRAR SESIÓN SI HAY MÚLTIPLES DESCONEXIONES
            mqttService.onSystemEvent('onForceLogout', () => {
              this.handleMQTTForceLogout();
            });
          }
          if (!websocketService.isConnected) {
            websocketService.connect({
              id: user._id,
              name: user.name,
              email: user.correo
            });
          }
          // Configurar listeners para cambios de estado automáticos
          this.setupAutoStatusChangeListeners();
        }
      }
    },
    // ✅ ESCUCHAR CAMBIOS DE RUTA PARA REINICIAR TIMER DE INACTIVIDAD
    '$route.path': {
      handler(newPath, oldPath) {
        if (newPath !== oldPath && inactivityService.isActive) {
          console.log(`🔄 [APP] Cambio de ruta detectado: ${oldPath} → ${newPath}`);
          inactivityService.handleRouteChange();
        }
      }
    }
  },
  beforeMount() {
    this.$store.state.isTransparent = "bg-transparent";
    this.checkAuthStatus();
    this.logEnvironmentInfo();
    this.clearOrphanCookies();
  },
  methods: {
    ...mapMutations(["toggleConfigurator", "navbarMinimize"]),
    checkAuthStatus() {
      // Verificar si hay un token válido al cargar la aplicación (solo sessionStorage ahora)
      const token = sessionStorage.getItem('token');
      const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
      
      
      if (token && !isLoggedIn) {
        this.$store.commit('makelogin');
      }
    },
    
    clearOrphanCookies() {
      // Si no hay sesión activa, limpiar todas las cookies HTTP que puedan existir
      const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
      const token = sessionStorage.getItem('token');
      
      if (!isLoggedIn || !token) {
        
        // Limpiar todas las cookies
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          
          // Eliminar la cookie en todos los paths posibles
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        }
        
      }
    },
    
    logEnvironmentInfo() {
      // Log información del entorno para debug
      environmentConfig.getDebugInfo();
    },
    
    setupAutoStatusChangeListeners() {
      if (!this.$store.state.user || !this.$store.state.user._id) {
        return;
      }
      
      const userId = this.$store.state.user._id;
      
      // 1️⃣ Listener para cambios de estado del usuario específico
      const statusChangeTopic = `telefonia/users/status-change/${userId}`;
      
      // Limpiar listener anterior si existe
      if (this.statusChangeCallback) {
        mqttService.off(statusChangeTopic, this.statusChangeCallback, 'status');
      }
      
      // Crear nuevo callback
      this.statusChangeCallback = (data) => {
        this.handleAutoStatusChange(data);
      };
      
      // Registrar listener
      mqttService.on(statusChangeTopic, this.statusChangeCallback, 'status');
      
      // 2️⃣ Listener GLOBAL para nuevas tipificaciones (captura temprana)
      const nuevaTipificacionTopic = `telefonia/tipificacion/nueva/${userId}`;
      
      // Limpiar listener anterior si existe
      if (this.nuevaTipificacionCallback) {
        mqttService.off(nuevaTipificacionTopic, this.nuevaTipificacionCallback, 'tipificacion');
      }
      
      // Crear callback para tipificaciones
      this.nuevaTipificacionCallback = (data) => {
        this.handleNuevaTipificacionGlobal(data);
      };
      
      // Registrar listener
      mqttService.on(nuevaTipificacionTopic, this.nuevaTipificacionCallback, 'tipificacion');
      
    },
    
    async handleAutoStatusChange(data) {
      try {
        
        // Verificar si el cambio fue automático por asignación de llamada
        if (data.changedBy === 'system_auto_assignment' && data.reason === 'incoming_call') {
          
          // Actualizar estado en el store
          if (data.newStatus) {
            this.$store.commit('updateUserStatus', data.newStatus);
          }
          
          // Verificar si necesita redirigir a /work
          const currentRoute = this.$route.path;
          
          if (currentRoute !== '/work') {
            
            // Mostrar notificación antes de redirigir
            this.showAutoStatusChangeNotification(data);
            
            // Redirigir después de un breve delay para que se vea la notificación
            setTimeout(() => {
              this.$router.push('/work');
            }, 2000);
          } else {
            this.showAutoStatusChangeNotification(data);
          }
        }
      } catch (error) {
        console.error('❌ Error procesando cambio automático de estado:', error);
      }
    },
    
    // 🔒 MANEJAR LOGOUT FORZADO POR MQTT
    async handleMQTTForceLogout() {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.error(`🚨 [APP] MQTT forzando cierre de sesión | ${timestamp}`);
      
      // Mostrar notificación al usuario
      const notification = document.createElement('div');
      notification.className = 'mqtt-logout-notification';
      notification.innerHTML = `
        <div class="notification-content">
          <div class="notification-icon">⚠️</div>
          <div class="notification-text">
            <h4>Pérdida de Conexión</h4>
            <p>La conexión MQTT se ha perdido múltiples veces.</p>
            <p class="notification-detail">Tu sesión será cerrada por seguridad...</p>
          </div>
        </div>
      `;
      
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #dc3545, #c82333);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
        z-index: 10000;
        min-width: 350px;
        animation: slideInRight 0.5s ease-out;
      `;
      
      document.body.appendChild(notification);
      
      // Esperar 3 segundos y luego hacer logout
      setTimeout(async () => {
        try {
          // Desconectar servicios
          if (mqttService) {
            mqttService.disconnect();
          }
          if (websocketService) {
            websocketService.disconnect();
          }
          
          // Hacer logout del store
          await this.$store.dispatch('logout');
          
          // Limpiar almacenamiento
          localStorage.clear();
          sessionStorage.clear();
          
          // Redirigir a login
          this.$router.push('/signin?reason=mqtt_connection_lost');
        } catch (error) {
          console.error('❌ Error en logout forzado:', error);
          // Forzar redirección de todas formas
          window.location.href = '/signin?reason=mqtt_connection_lost';
        }
      }, 3000);
    },
    
    showAutoStatusChangeNotification(data) {
      // Crear notificación visual
      const notification = document.createElement('div');
      notification.className = 'auto-status-notification';
      notification.innerHTML = `
        <div class="notification-content">
          <div class="notification-icon">📞</div>
          <div class="notification-text">
            <h4>¡Nueva Llamada Asignada!</h4>
            <p>Tu estado cambió automáticamente a "${data.newLabel || data.newStatus}"</p>
            <p class="notification-detail">Serás redirigido al área de trabajo...</p>
          </div>
        </div>
      `;
      
      // Agregar estilos
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
        z-index: 10000;
        min-width: 350px;
        animation: slideInRight 0.5s ease-out;
      `;
      
      // Agregar al DOM
      document.body.appendChild(notification);
      
      // Reproducir sonido de notificación
      this.playNotificationSound();
      
      // Remover después de 4 segundos
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-in';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 500);
      }, 4000);
    },
    
    playNotificationSound() {
      try {
        // Crear un sonido de notificación simple usando Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        // Silenciar errores de audio
      }
    },
    
    // 📞 Manejar nueva tipificación recibida globalmente
    async handleNuevaTipificacionGlobal(data) {
      // 🚨 LOG DE RECEPCIÓN GLOBAL
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const userId = this.$store.state.user?._id || 'N/A';
      const logLine = `${timestamp} ✅ [FRONTEND] TIPIFICACION_RECIBIDA_GLOBAL | idLlamada:${data?.idLlamada || 'N/A'} | cedula:${data?.cedula || 'N/A'} | userId:${userId} | route:${this.$route.path}`;
      console.log(logLine);
      console.log('📦 [DEBUG] Datos recibidos:', JSON.stringify(data, null, 2));
      
      try {
        // 🚨 VALIDAR DATOS ANTES DE PROCESAR
        if (!data || !data.idLlamada) {
          console.error('❌ [FRONTEND] Datos inválidos recibidos:', data);
          return;
        }
        
        // Siempre guardar en el store para que el watcher en Work.vue lo procese
        const storeLog = `${timestamp} 💾 [FRONTEND] GUARDANDO_EN_STORE | idLlamada:${data.idLlamada}`;
        console.log(storeLog);
        this.$store.commit('setPendingTipificacion', data);
        
        // Verificar si el store se actualizó correctamente
        const pendingCheck = this.$store.state.pendingTipificacion;
        if (pendingCheck && pendingCheck.idLlamada === data.idLlamada) {
          console.log(`✅ [FRONTEND] Store actualizado correctamente | idLlamada:${data.idLlamada}`);
        } else {
          console.error(`❌ [FRONTEND] Store NO se actualizó correctamente | esperado:${data.idLlamada} | recibido:${pendingCheck?.idLlamada || 'null'}`);
        }
        
        // Verificar si ya estamos en /work
        const currentRoute = this.$route.path;
        
        if (currentRoute !== '/work') {
          const redirectLog = `${timestamp} ↪️ [FRONTEND] REDIRIGIENDO_A_WORK | idLlamada:${data.idLlamada}`;
          console.log(redirectLog);
          // Redirigir a Work - el watcher de Work.vue procesará la tipificación pendiente
          this.$router.push('/work');
        } else {
          const alreadyWorkLog = `${timestamp} ✓ [FRONTEND] YA_EN_WORK | idLlamada:${data.idLlamada} | Esperando watcher de Work.vue...`;
          console.log(alreadyWorkLog);
          // El watcher de Work.vue procesará automáticamente la tipificación pendiente
          // Forzar actualización después de un breve delay
          setTimeout(() => {
            const pendingAfterDelay = this.$store.state.pendingTipificacion;
            if (pendingAfterDelay && pendingAfterDelay.idLlamada === data.idLlamada) {
              console.warn(`⚠️ [FRONTEND] Tipificación aún pendiente después de 1s | idLlamada:${data.idLlamada}`);
            }
          }, 1000);
        }
      } catch (error) {
        const errorTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const errorLog = `${errorTimestamp} ❌ [FRONTEND] ERROR_PROCESANDO_GLOBAL | idLlamada:${data?.idLlamada || 'N/A'} | RAZON:${error.message || 'Error desconocido'}`;
        console.error(errorLog);
        console.error('❌ Error procesando tipificación global:', error);
        console.error('❌ Stack trace:', error.stack);
      }
    }
  },
  
  data() {
    return {
      statusChangeCallback: null,
      nuevaTipificacionCallback: null
    };
  },
};
</script>

<style>
/* Animaciones para notificaciones de cambio automático de estado */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.auto-status-notification {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.auto-status-notification .notification-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.auto-status-notification .notification-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.auto-status-notification .notification-text h4 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.auto-status-notification .notification-text p {
  margin: 4px 0;
  font-size: 0.95rem;
  opacity: 0.95;
}

.auto-status-notification .notification-detail {
  font-size: 0.85rem !important;
  opacity: 0.8 !important;
  font-style: italic;
}

/* Estilos para notificaciones de inactividad */
.inactivity-warning,
.logout-notification {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.inactivity-warning .warning-content,
.logout-notification .notification-content {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
}

.inactivity-warning .warning-icon,
.logout-notification .notification-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.inactivity-warning .warning-text h4,
.logout-notification .notification-text h4 {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.inactivity-warning .warning-text p,
.logout-notification .notification-text p {
  margin: 6px 0;
  font-size: 1rem;
  opacity: 0.95;
}

.inactivity-warning .warning-detail,
.logout-notification .notification-detail {
  font-size: 0.9rem !important;
  opacity: 0.85 !important;
  font-style: italic;
  margin-top: 10px !important;
}

.inactivity-warning .warning-close {
  position: absolute;
  top: -5px;
  right: -5px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.inactivity-warning .warning-close:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* Estilos para notificaciones de sesión duplicada */
.session-takeover-notification {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.session-takeover-notification .notification-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.session-takeover-notification .notification-icon {
  font-size: 3rem;
  animation: pulse 1.5s infinite;
}

.session-takeover-notification .notification-text h4 {
  margin: 0 0 12px 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.session-takeover-notification .notification-text p {
  margin: 8px 0;
  font-size: 1rem;
  opacity: 0.95;
}

.session-takeover-notification .notification-detail {
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  margin-top: 12px !important;
}

.session-takeover-notification .notification-info {
  font-size: 0.9rem !important;
  opacity: 0.85 !important;
  font-style: italic;
  margin-top: 16px !important;
  padding-top: 16px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

/* Advertencia de pestaña secundaria */
.local-takeover-warning {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.local-takeover-warning .warning-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.local-takeover-warning .warning-icon {
  font-size: 2rem;
  animation: pulse 2s infinite;
}

.local-takeover-warning .warning-text h4 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.local-takeover-warning .warning-text p {
  margin: 4px 0;
  font-size: 0.9rem;
}

.local-takeover-warning .warning-detail {
  font-weight: 600;
  font-size: 0.95rem !important;
}

.local-takeover-warning .warning-action {
  font-style: italic;
  opacity: 0.9;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>
