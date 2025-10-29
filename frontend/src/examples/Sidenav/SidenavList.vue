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

      <!-- Opción de Reportes: solo para administradores o con permiso 'viewReports' -->
      <li v-if="canViewReports" class="nav-item">
        <sidenav-item
          url="/reportes"
          :class="getRoute() === 'reportes' ? 'active' : ''"
          :navText="this.$store.state.isRTL ? 'تقارير' : 'Reportes'"
        >
          <template v-slot:icon>
            <i class="ni ni-chart-pie-35 text-success text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <!-- Opción de Administración del Árbol de Tipificación: solo para administradores -->
      <li v-if="canManageTree || userRole === 'admin' || userRole === 'administrador'" class="nav-item">
        <sidenav-item
          url="/tree-admin"
          :class="getRoute() === 'tree-admin' ? 'active' : ''"
          :navText="this.$store.state.isRTL ? 'إدارة الشجرة' : 'Árbol de Tipificación'"
        >
          <template v-slot:icon>
            <i class="ni ni-settings-gear-65 text-warning text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <!-- Opción 1: Grabaciones - Nueva Pestaña -->
      <li v-if="canAccessAdminPanels" class="nav-item">
        <sidenav-item
          url="#"
          :class="getRoute() === 'admin-iframe-1' ? 'active' : ''"
          :navText="this.$store.state.isRTL ? 'التسجيلات' : 'Grabaciones'"
          @click.prevent="openAdminPanel1"
        >
          <template v-slot:icon>
            <i class="ni ni-sound-wave text-info text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <!-- Opción 2: Reporte de Llamadas - Nueva Pestaña -->
      <li v-if="canAccessAdminPanels" class="nav-item">
        <sidenav-item
          url="#"
          :class="getRoute() === 'admin-iframe-2' ? 'active' : ''"
          :navText="this.$store.state.isRTL ? 'تقرير المكالمات' : 'Reporte de Llamadas'"
          @click.prevent="openAdminPanel2"
        >
          <template v-slot:icon>
            <i class="ni ni-laptop text-success text-sm opacity-10"></i>
          </template>
        </sidenav-item>
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
      canViewReports: false,
      canManageTree: false,
      canAccessAdminPanels: false,
      permissionsLoaded: false,
    };
  },
  components: {
    SidenavItem,
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
    },
    userRole() {
      // Obtener el rol del usuario desde el store o localStorage
      return this.$store.state.user?.role || 
             localStorage.getItem('userRoleName') || 
             localStorage.getItem('userRole') || 
             'usuario';
    }
  },
  async mounted() {
    // Cargar permisos al montar el componente
    if (!this.permissionsLoaded) {
      await this.loadUserPermissions();
    }
    // Verificar permiso de reportes - los admins siempre tienen acceso
    if (this.userRole === 'admin' || this.userRole === 'administrador') {
      this.canViewReports = true;
    } else {
      this.canViewReports = await permissions.hasPermission('monitoring', 'viewReports');
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
        
        // Si el usuario es admin, otorgar todos los permisos automáticamente
        if (this.userRole === 'admin' || this.userRole === 'administrador') {
          console.log('👑 Usuario admin detectado - otorgando todos los permisos');
          this.canViewUsers = true;
          this.canViewActiveUsers = true;
          this.canManageTree = true;
          this.canAccessAdminPanels = true;
        } else {
          // Verificar permisos específicos para cada elemento del sidebar
          this.canViewUsers = await permissions.canShowUIElement('sidebar-users');
          this.canViewActiveUsers = await permissions.canShowUIElement('sidebar-active-users');
          this.canManageTree = await permissions.canShowUIElement('sidebar-tree-admin');
          this.canAccessAdminPanels = await permissions.canShowUIElement('sidebar-admin-panels');
        }
        
        this.permissionsLoaded = true;
        console.log('✅ Permisos del usuario cargados');
        console.log('   - Users:', this.canViewUsers);
        console.log('   - Active Users:', this.canViewActiveUsers);
        console.log('   - Tree Admin:', this.canManageTree);
        console.log('   - Admin Panels:', this.canAccessAdminPanels);
        
      } catch (error) {
        console.error('❌ Error cargando permisos del usuario:', error);
        // En caso de error, denegar todos los permisos excepto para admins
        if (this.userRole === 'admin' || this.userRole === 'administrador') {
          this.canViewUsers = true;
          this.canViewActiveUsers = true;
          this.canManageTree = true;
          this.canAccessAdminPanels = true;
        } else {
          this.canViewUsers = false;
          this.canViewActiveUsers = false;
          this.canManageTree = false;
          this.canAccessAdminPanels = false;
        }
      } finally {
        this._loadingPermissions = false;
      }
    },
    
    openAdminPanel1(event) {
      event.preventDefault();
      const url = 'https://172.16.116.3:7070/WebManagement/index.html';
      console.log('🌐 Abriendo Grabaciones en nueva pestaña:', url);
      
      // Abrir en nueva pestaña con configuración de seguridad
      window.open(url, '_blank', 'noopener,noreferrer,width=1200,height=800');
      
      // Mostrar notificación si está disponible
      if (this.$toast) {
        this.$toast.success('Grabaciones abierto en nueva pestaña', {
          position: 'top-right',
          timeout: 3000
        });
      }
    },
    
    openAdminPanel2(event) {
      event.preventDefault();
      const url = 'http://172.16.116.16:9080/web/login';
      console.log('🌐 Abriendo Reporte de Llamadas en nueva pestaña:', url);
      
      // Abrir en nueva pestaña con configuración de seguridad
      window.open(url, '_blank', 'noopener,noreferrer,width=1200,height=800');
      
      // Mostrar notificación si está disponible
      if (this.$toast) {
        this.$toast.success('Reporte de Llamadas abierto en nueva pestaña', {
          position: 'top-right',
          timeout: 3000
        });
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


/* Estilos para enlaces de paneles administrativos */
.nav-link {
  transition: all 0.3s ease;
  border-radius: 8px;
  margin: 2px 8px;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.nav-link.active {
  background-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.nav-link-text {
  color: white;
  font-weight: 500;
}

.nav-link:hover .nav-link-text {
  color: #fff;
}
</style>
