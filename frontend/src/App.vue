<template>
  <div id="app">
    <!-- Indicador de estado del usuario - Línea superior -->
    <status-indicator-bar />
    
    <div
      v-show="this.$store.state.layout === 'landing'"
      class="landing-bg h-100 bg-gradient-primary position-fixed w-100"
    ></div>
    <sidenav
      :custom_class="this.$store.state.mcolor"
      :class="[
        this.$store.state.isTransparent,
        this.$store.state.isRTL ? 'fixed-end' : 'fixed-start'
      ]"
      v-if="this.$store.state.showSidenav"
    />
    <main
      class="main-content position-relative max-height-vh-100 h-100 border-radius-lg"
      style="padding-top: 3px;"
    >
      <!-- nav -->
      <navbar
        :class="[navClasses]"
        :textWhite="
          this.$store.state.isAbsolute ? 'text-white opacity-8' : 'text-white'
        "
        :minNav="navbarMinimize"
        v-if="this.$store.state.showNavbar"
      />
      <router-view />
      <app-footer v-show="this.$store.state.showFooter" />
      <configurator
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
import { mapMutations } from "vuex";

export default {
  name: "App",
  components: {
    Sidenav,
    Configurator,
    Navbar,
    AppFooter,
    StatusIndicatorBar
  },
  methods: {
    ...mapMutations(["toggleConfigurator", "navbarMinimize"])
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
  beforeMount() {
    this.$store.state.isTransparent = "bg-transparent";
  }
};
</script>
