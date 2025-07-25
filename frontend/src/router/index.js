import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import Tables from "../views/Tables.vue";
import viaje from "../views/viaje.vue";
import abono from "../views/abonos.vue";
import saldos from "../views/saldos.vue";
import Billing from "../views/Billing.vue";
import VirtualReality from "../views/VirtualReality.vue";
import RTL from "../views/Rtl.vue";
import Profile from "../views/Profile.vue";
import Signup from "../views/Signup.vue";
import Signin from "../views/Signin.vue";
import users from "../views/users.vue";
import ActiveUsers from "../views/ActiveUsers.vue";
import Work from "../views/Work.vue";

import store from "../store/index"; // Importa tu store de Vuex

import tokens from "@/router/services/tokens";
import sessionSync from "@/router/services/sessionSync";
import permissions from "@/router/services/permissions";

const routes = [
  {
    path: "/",
    name: "/",
    redirect: "/signin",
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: {
      requiresAuth: true,
      permissions: [] // Acceso libre para usuarios autenticados
    },
  },
  {
    path: "/signout",
    name: "Signout",
    beforeEnter: async (to, from, next) => {
      console.log('🚪 Procesando signout...');
      
      // Limpiar store de Vuex
      store.dispatch("logout");
      
      // Limpiar localStorage y sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      function deleteCookie(cookieName) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }

      deleteCookie("rememberMe");
      deleteCookie("remember_token");
      
      console.log('✅ Signout completado, redirigiendo a login');
      next("/signin");
    },
  },
  {
    path: "/Users",
    name: "Users",
    component: users,
    meta: {
      requiresAuth: true,
      permissions: [{ module: 'users', permission: 'view' }]
    },
  },
  {
    path: "/active-users",
    name: "ActiveUsers",
    component: ActiveUsers,
    meta: {
      requiresAuth: true,
      permissions: [{ module: 'monitoring', permission: 'viewActiveUsers' }]
    },
  },
  {
    path: "/viajes",
    name: "viajes",
    component: viaje,
    meta: {
      requiresAuth: true,
      permissions: [{ module: 'operations', permission: 'viewViajes' }]
    },
  },
  {
    path: "/abonos",
    name: "Abonos",
    component: abono,
    meta: {
      requiresAuth: true,
      permissions: [{ module: 'finance', permission: 'viewAbonos' }]
    },
  },
  {
    path: "/saldos",
    name: "Saldos",
    component: saldos,
    meta: {
      requiresAuth: true,
      permissions: [{ module: 'finance', permission: 'viewSaldos' }]
    },
  },
  {
    path: "/tables",
    name: "Tables",
    component: Tables,
    meta: {
      requiresAuth: true,
      permissions: [{ module: 'operations', permission: 'viewTables' }]
    },
  },
  {
    path: "/billing",
    name: "Billing",
    component: Billing,
    meta: {
      requiresAuth: true,
      permissions: [{ module: 'finance', permission: 'viewBilling' }]
    },
  },
  {
    path: "/virtual-reality",
    name: "Virtual Reality",
    component: VirtualReality,
    meta: {
      requiresAuth: true,
      permissions: [] // Acceso libre para usuarios autenticados
    },
  },
  {
    path: "/rtl-page",
    name: "RTL",
    component: RTL,
    meta: {
      requiresAuth: true,
      permissions: [] // Acceso libre para usuarios autenticados
    },
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: {
      requiresAuth: true,
      permissions: [] // Acceso libre para usuarios autenticados
    },
  },
  {
    path: "/signin",
    name: "Signin",
    component: Signin,
    beforeEnter: async (to, from, next) => {
      console.log('🔐 Verificando acceso a /signin...');
      let isLoggedIn = sessionStorage.getItem("isLoggedIn");
      
      // Verificar Remember Me si no está logueado
      if (!store.getters.isLoggedIn && !isLoggedIn) {
        console.log('⚠️ No está logueado, verificando Remember Me...');
        const autoLoginResult = await sessionSync.autoLoginFromCookie();
        
        if (autoLoginResult.success) {
          console.log('✅ Auto-login exitoso en /signin');
          isLoggedIn = "true";
          sessionStorage.setItem("isLoggedIn", "true");
          store.dispatch("login", localStorage.getItem("token"));
        }
      }
      
      const roles = await tokens.sendRole();

      if (store.getters.isLoggedIn || isLoggedIn) {
        // Si el usuario ha iniciado sesión...
        if (roles.error) {
          localStorage.clear();
          next();
        } else {
          console.log('✅ Usuario ya autenticado, redirigiendo al dashboard');
          next("/dashboard"); // Permitimos el acceso a la ruta
        }
      } else {
        // Si el usuario no ha iniciado sesión...
        console.log('🔍 Verificando Remember Me en /signin...');
        
        const autoLoginResult = await sessionSync.autoLoginFromCookie();
        
        if (autoLoginResult.success) {
          console.log('✅ Auto-login exitoso desde cookie, redirigiendo al dashboard');
          next("/dashboard");
        } else {
          console.log('❌ No hay cookie válida o falló auto-login');
          localStorage.clear();
          next(); // Mostrar página de login
        }
      }
    },
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
  },
  {
    path: "/work",
    name: "Work",
    component: Work,
    meta: {
      requiresAuth: true,
      permissions: [] // Acceso libre para usuarios autenticados
    },
  },
  {
    path: "/reportes",
    name: "Reportes",
    component: () => import('@/views/Reportes.vue'),
    meta: {
      requiresAuth: true,
      permissions: [{ module: 'monitoring', permission: 'viewReports' }]
    },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  linkActiveClass: "active",
});

const rutasEspeciales = ["/signin", "/signout"];

router.beforeEach(async (to, from, next) => {
  console.log('🛡️ Router guard ejecutándose para:', to.path);
  
  // Rutas especiales que no requieren verificación
  if (rutasEspeciales.includes(to.path)) {
    console.log('✅ Ruta especial, permitiendo acceso directo');
    next();
    return;
  }
  
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  console.log('🔍 sessionStorage isLoggedIn:', isLoggedIn);
  console.log('🔍 store.getters.isLoggedIn:', store.getters.isLoggedIn);
  
  // VERIFICAR REMEMBER ME ANTES DE VERIFICAR PERMISOS
  if (!store.getters.isLoggedIn && !isLoggedIn) {
    console.log('⚠️ Usuario no logueado, verificando Remember Me...');
    
    const autoLoginResult = await sessionSync.autoLoginFromCookie();
    if (autoLoginResult.success) {
      console.log('✅ Auto-login exitoso desde cookie en router guard');
      // Actualizar estados
      sessionStorage.setItem("isLoggedIn", "true");
      store.dispatch("login", localStorage.getItem("token"));
    }
  }
  
  // Verificar si la ruta requiere autenticación
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      console.log('🔒 Ruta protegida detectada');
    
    // Verificar si el usuario está logueado
        const isLoggedInNow = sessionStorage.getItem("isLoggedIn");
        
    if (!store.getters.isLoggedIn && !isLoggedInNow) {
      console.log('❌ Usuario no autenticado, redirigiendo a login');
      next("/signin");
      return;
    }

    // Usuario está logueado, verificar permisos específicos
    console.log('✅ Usuario autenticado, verificando permisos...');
    
    // Obtener los permisos requeridos para esta ruta
    const routePermissions = to.meta.permissions;
    
    // Si no hay permisos específicos requeridos, permitir acceso
    if (!routePermissions || routePermissions.length === 0) {
      console.log('✅ Ruta sin permisos específicos, permitiendo acceso');
      next();
      return;
    }

    try {
      // Verificar si el usuario tiene los permisos necesarios
      const hasAccess = await permissions.hasAnyPermission(routePermissions);
      
      if (hasAccess) {
        console.log('✅ Usuario tiene permisos, permitiendo acceso');
        next();
        } else {
        console.log('❌ Usuario sin permisos suficientes, redirigiendo');
        // Redirigir al dashboard o a una página de acceso denegado
        next('/dashboard');
      }
    } catch (error) {
      console.error('❌ Error verificando permisos:', error);
      // En caso de error, permitir acceso temporal
      console.log('⚠️ Error en verificación de permisos, permitiendo acceso temporal');
      next();
      }
    } else {
    // Ruta pública
    console.log('✅ Ruta pública, permitiendo acceso');
    next();
  }
});

export default router;
