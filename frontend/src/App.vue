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
            mqttService.connect('ws://localhost:9001', this.$store.state.user._id, this.$store.state.user.name);
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
        }
      }
    },
    '$store.state.user': {
      immediate: true,
      handler(user) {
        if (this.$store.state.isLoggedIn && user && user._id) {
          if (!mqttService.isConnected) {
            mqttService.connect('ws://localhost:9001', user._id, user.name);
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
    }
  },
  beforeMount() {
    this.$store.state.isTransparent = "bg-transparent";
    this.checkAuthStatus();
  },
  methods: {
    ...mapMutations(["toggleConfigurator", "navbarMinimize"]),
    checkAuthStatus() {
      // Verificar si hay un token válido al cargar la aplicación
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
      
      console.log('🔍 Verificando estado de autenticación al cargar app...');
      console.log('   - Token existe:', !!token);
      console.log('   - isLoggedIn en sessionStorage:', isLoggedIn);
      
      if (token && !isLoggedIn) {
        console.log('🔄 Token encontrado pero isLoggedIn es false - Restaurando estado...');
        this.$store.commit('makelogin');
      }
    },
    
    setupAutoStatusChangeListeners() {
      if (!this.$store.state.user || !this.$store.state.user._id) {
        console.log('⚠️ No se puede configurar listeners sin usuario');
        return;
      }
      
      const userId = this.$store.state.user._id;
      console.log('🔧 Configurando listeners para cambios de estado automáticos para usuario:', userId);
      
      // Listener para cambios de estado del usuario específico
      const statusChangeTopic = `telefonia/users/status-change/${userId}`;
      
      // Limpiar listener anterior si existe
      if (this.statusChangeCallback) {
        mqttService.off(statusChangeTopic, this.statusChangeCallback, 'status');
      }
      
      // Crear nuevo callback
      this.statusChangeCallback = (data) => {
        console.log('🔄 Cambio de estado recibido por MQTT:', data);
        this.handleAutoStatusChange(data);
      };
      
      // Registrar listener
      mqttService.on(statusChangeTopic, this.statusChangeCallback, 'status');
      
      console.log('✅ Listeners configurados para cambios automáticos de estado');
    },
    
    async handleAutoStatusChange(data) {
      try {
        console.log('🎯 Procesando cambio automático de estado:', data);
        
        // Verificar si el cambio fue automático por asignación de llamada
        if (data.changedBy === 'system_auto_assignment' && data.reason === 'incoming_call') {
          console.log('🚀 Cambio automático detectado por llamada entrante');
          
          // Actualizar estado en el store
          if (data.newStatus) {
            this.$store.commit('updateUserStatus', data.newStatus);
          }
          
          // Verificar si necesita redirigir a /work
          const currentRoute = this.$route.path;
          console.log('📍 Ruta actual:', currentRoute);
          
          if (currentRoute !== '/work') {
            console.log('🔄 Redirigiendo automáticamente a /work...');
            
            // Mostrar notificación antes de redirigir
            this.showAutoStatusChangeNotification(data);
            
            // Redirigir después de un breve delay para que se vea la notificación
            setTimeout(() => {
              this.$router.push('/work');
            }, 2000);
          } else {
            console.log('✅ Usuario ya está en /work, solo mostrando notificación');
            this.showAutoStatusChangeNotification(data);
          }
        }
      } catch (error) {
        console.error('❌ Error procesando cambio automático de estado:', error);
      }
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
        console.log('No se pudo reproducir sonido de notificación:', error);
      }
    }
  },
  
  data() {
    return {
      statusChangeCallback: null
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
</style>
