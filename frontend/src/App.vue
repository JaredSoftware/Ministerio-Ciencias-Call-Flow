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
    }
  },
};
</script>
