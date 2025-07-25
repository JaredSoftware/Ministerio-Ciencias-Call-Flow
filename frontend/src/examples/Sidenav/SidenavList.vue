<template>
  <div class="sidenav-wrapper">
    <div
      class="collapse navbar-collapse w-auto h-auto h-100"
      id="sidenav-collapse-main"
    >
    <ul class="navbar-nav">
      <li class="nav-item">
        <sidenav-item
          url="/dashboard"
          :class="getRoute() === 'dashboard' ? 'active' : ''"
          :navText="this.$store.state.isRTL ? 'لوحة القيادة' : 'Dashboard'"
        >
          <template v-slot:icon>
            <i class="ni ni-tv-2 text-primary text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>
      <!-- Opción de gestión de usuarios -->
      <li v-if="canViewUsers" class="nav-item">
        <sidenav-item
          url="/Users"
          :class="getRoute() === 'Users' ? 'active' : ''"
          :navText="this.$store.state.isRTL ? 'المستخدمين' : 'Users'"
        >
          <template v-slot:icon>
            <i class="ni ni-single-02 text-dark text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>
      
      <!-- Opción de usuarios activos - solo con permisos -->
      <li v-if="canViewActiveUsers" class="nav-item">
        <sidenav-item
          url="/active-users"
          :class="getRoute() === 'active-users' ? 'active' : ''"
          :navText="this.$store.state.isRTL ? 'المستخدمين النشطين' : 'Usuarios Activos'"
        >
          <template v-slot:icon>
            <i class="ni ni-chart-bar-32 text-info text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>
      
      <!-- Opción WORK: solo si el estado actual es de categoría 'work' -->
      <li v-if="showWorkFunction" class="nav-item">
        <sidenav-item
          url="/work"
          :class="getRoute() === 'work' ? 'active' : ''"
          :navText="this.$store.state.isRTL ? 'عمل' : 'Work'"
        >
          <template v-slot:icon>
            <i class="ni ni-briefcase-24 text-warning text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      

      
      <!-- Debug: Mostrar rol actual (temporal) -->
      <li v-if="userRole" class="nav-item">
        <div class="px-3 py-2 text-xs text-muted">
          <small>Rol: {{ userRole }}</small>
        </div>
      </li>
      <!--<li class="nav-item">
        <sidenav-item
          url="/billing"
          :class="getRoute() === 'billing' ? 'active' : ''"
          :navText="this.$store.state.isRTL ? 'الفواتیر' : 'Billing'"
        >
          <template v-slot:icon>
            <i class="ni ni-credit-card text-success text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>
      <li class="nav-item">
        <sidenav-item
          url="/virtual-reality"
          :class="getRoute() === 'virtual-reality' ? 'active' : ''"
          :navText="
            this.$store.state.isRTL ? 'الواقع الافتراضي' : 'Virtual Reality'
          "
        >
          <template v-slot:icon>
            <i class="ni ni-app text-info text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>
      <li class="nav-item">
        <sidenav-item
          url="/rtl-page"
          :class="getRoute() === 'rtl-page' ? 'active' : ''"
          navText="RTL"
        >
          <template v-slot:icon>
            <i class="ni ni-world-2 text-danger text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>
      -->

      <li class="mt-3 nav-item">
        <h6
          v-if="this.$store.state.isRTL"
          class="text-xs ps-4 text-uppercase font-weight-bolder opacity-6"
          :class="this.$store.state.isRTL ? 'me-4' : 'ms-2'"
        >
          صفحات المرافق
        </h6>
        <h6
          v-else
          class="text-xs ps-4 text-uppercase font-weight-bolder opacity-6"
          :class="this.$store.state.isRTL ? 'me-4' : 'ms-2'"
        >
          ACCOUNT PAGES
        </h6>
      </li>

      <li class="nav-item">
        <sidenav-item
          url="/signout"
          :class="getRoute() === 'signout' ? 'active' : ''"
          :navText="this.$store.state.isRTL ? 'حساب تعريفي' : 'Signout'"
        >
          <template v-slot:icon>
            <i class="ni ni-single-02 text-dark text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <!---<li class="nav-item">
        <sidenav-item
          url="/signin"
          :class="getRoute() === 'signin' ? 'active' : ''"
          :navText="this.$store.state.isRTL ? 'تسجيل الدخول' : 'Sign In'"
        >
          <template v-slot:icon>
            <i class="ni ni-single-copy-04 text-danger text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>
      <li class="nav-item">
        <sidenav-item
          url="/signup"
          :class="getRoute() === 'signup' ? 'active' : ''"
          :navText="this.$store.state.isRTL ? 'اشتراك' : 'Sign Up'"
        >
          <template v-slot:icon>
            <i class="ni ni-collection text-info text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>-->
    </ul>
  </div>
  
  <!-- Componente de Estado de Usuario -->
  <!--<div class="user-status-container">
    <h6 class="status-section-title">
      <i class="fas fa-circle text-success"></i>
      Estados de Usuario
    </h6>
    <UserStatusSelector />
  </div>-->
  
  <!--<div class="pt-3 mx-3 mt-3 sidenav-footer">
    <sidenav-card
      :class="cardBg"
      textPrimary="Need Help?"
      textSecondary="Please check our docs"
    />
  </div>-->
  </div>
</template>
<script>
import SidenavItem from "./SidenavItem.vue";
import permissions from '@/router/services/permissions';
import statusTypes from '@/router/services/statusTypes';
//import UserStatusSelector from "@/components/UserStatusSelector.vue";
//import SidenavCard from "./SidenavCard.vue";

export default {
  name: "SidenavList",
  props: {
    cardBg: String,
  },
  data() {
    return {
      title: "App",
      controls: "dashboardsExamples",
      isActive: "active",
      canViewUsers: false,
      canViewActiveUsers: false,
      permissionsLoaded: false,
    };
  },
  components: {
    SidenavItem,
    //UserStatusSelector,
    //SidenavCard
  },
  computed: {
    // Los permisos ya están cargados en las propiedades data
    showWorkFunction() {
      // Obtener el estado actual del usuario desde el store
      const userStatus = this.$store.state.userStatus || {};
      if (!userStatus.status) return false;
      // Buscar la categoría del estado actual
      const statusObj = statusTypes.getStatusByValue
        ? statusTypes.getStatusByValue(userStatus.status)
        : null;
      return statusObj && statusObj.category === 'work';
    }
  },
  async mounted() {
    // Cargar permisos al montar el componente
    if (!this.permissionsLoaded) {
      await this.loadUserPermissions();
    }
  },

  methods: {
    async loadUserPermissions() {
      // Evitar cargar múltiples veces
      if (this.permissionsLoaded || this._loadingPermissions) {
        return;
      }
      
      this._loadingPermissions = true;
      
      try {
        console.log('🔄 Cargando permisos del usuario...');
        
        // Verificar permisos específicos para cada elemento del sidebar
        this.canViewUsers = await permissions.canShowUIElement('sidebar-users');
        this.canViewActiveUsers = await permissions.canShowUIElement('sidebar-active-users');
        
        this.permissionsLoaded = true;
        console.log('✅ Permisos del usuario cargados');
        console.log('   - Users:', this.canViewUsers);
        console.log('   - Active Users:', this.canViewActiveUsers);
        
      } catch (error) {
        console.error('❌ Error cargando permisos del usuario:', error);
        // En caso de error, denegar todos los permisos
        this.canViewUsers = false;
        this.canViewActiveUsers = false;
      } finally {
        this._loadingPermissions = false;
      }
    },
    getRoute() {
      const routeArr = this.$route.path.split("/");
      return routeArr[1];
    },
  },
};
</script>

<style scoped>
.sidenav-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.user-status-container {
  margin-top: auto;
  padding: 0.5rem;
  border-top: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  margin: 1rem;
}

.status-section-title {
  color: white;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  text-align: center;
  font-weight: 600;
}

.status-section-title i {
  margin-right: 0.5rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
