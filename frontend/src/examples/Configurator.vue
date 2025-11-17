<template>
  <div class="fixed-plugin">
    <a
      class="px-3 py-2 fixed-plugin-button text-dark position-fixed"
      @click="$store.commit('toggleConfigurator')"
    >
      <i class="py-2 fa fa-cog"></i>
    </a>
    <div class="shadow-lg card">
      <div class="pt-3 pb-0 bg-transparent card-header">
        <div
          class=""
          :class="this.$store.state.isRTL ? 'float-end' : 'float-start'"
        >
          <h5 class="mt-3 mb-0">Argon Configurator</h5>
          <p>See our dashboard options.</p>
        </div>
        <div
          class="mt-4"
          @click="$store.commit('toggleConfigurator')"
          :class="this.$store.state.isRTL ? 'float-start' : 'float-end'"
        >
          <button 
            class="p-0 btn btn-link text-dark fixed-plugin-close-button"
            style="cursor: pointer; font-size: 1.5rem; padding: 8px; border-radius: 50%; background-color: rgba(255,255,255,0.1);"
            title="Cerrar configuración"
          >
            <i class="fa fa-times"></i>
          </button>
        </div>
        <!-- End Toggle Button -->
      </div>
      <hr class="my-1 horizontal dark" />
      <div class="pt-0 card-body pt-sm-3">
        <hr class="horizontal dark my-4" />
        <div class="mt-2 mb-5 d-flex">
          <h6 class="mb-0" :class="this.$store.state.isRTL ? 'ms-2' : ''">
            Light / Dark
          </h6>
          <div class="form-check form-switch ps-0 ms-auto my-auto">
            <input
              class="form-check-input mt-1 ms-auto"
              type="checkbox"
              :checked="this.$store.state.darkMode"
              @click="setDarkMode"
            />
          </div>
        </div>
        <hr class="horizontal dark my-4" />
        
        <!-- Sección de Estados de Usuario -->
        <div class="user-status-section">
          <h6 class="mb-2">
            <i class="fas fa-circle text-success me-2"></i>
            Estados de Usuario
          </h6>
          <UserStatusConfigurator />
        </div>
        
        <hr class="horizontal dark my-4" />
        <button 
          class="btn bg-gradient-danger w-100 mb-3"
          @click="$store.commit('toggleConfigurator')"
          style="font-weight: bold;"
        >
          <i class="fa fa-times me-2"></i>Cerrar Configuración
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from "vuex";
import { activateDarkMode, deactivateDarkMode } from "@/assets/js/dark-mode";
import UserStatusConfigurator from "@/components/UserStatusConfigurator.vue";
export default {
  name: "configurator",
  props: ["toggle"],
  components: {
    UserStatusConfigurator
  },
  methods: {
    ...mapMutations(["navbarMinimize", "sidebarType", "navbarFixed"]),
    sidebarColor(color = "success") {
      document.querySelector("#sidenav-main").setAttribute("data-color", color);
      this.$store.state.mcolor = `card-background-mask-${color}`;
    },
    sidebarType(type) {
      this.$store.state.sidebarType = type;
    },
    setNavbarFixed() {
      if (
        this.$route.name !== "Profile" ||
        this.$route.name !== "All Projects"
      ) {
        this.$store.state.isNavFixed = !this.$store.state.isNavFixed;
      }
    },
    setDarkMode() {
      if (this.$store.state.darkMode) {
        this.$store.state.darkMode = false;
        this.$store.state.sidebarType = "bg-white";
        deactivateDarkMode();
        return;
      } else {
        this.$store.state.darkMode = true;
        this.$store.state.sidebarType = "bg-default";
        activateDarkMode();
      }
    },
    sidenavTypeOnResize() {
      let white = document.querySelector("#btn-white");
      if (!white) {
        // El elemento no existe, no hacer nada
        return;
      }
      if (window.innerWidth < 1200) {
        white.classList.add("disabled");
      } else {
        white.classList.remove("disabled");
      }
    }
  },
  computed: {
    sidenavResponsive() {
      return this.sidenavTypeOnResize;
    }
  },
  beforeMount() {
    this.$store.state.isTransparent = "bg-transparent";
    window.addEventListener("resize", this.sidenavTypeOnResize);
    window.addEventListener("load", this.sidenavTypeOnResize);
  }
};
</script>

<style scoped>
.user-status-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.user-status-section h6 {
  color: #333;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.user-status-section h6 i {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
