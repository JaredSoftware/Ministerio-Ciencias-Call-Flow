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
import TreeAdmin from "../views/TreeAdmin.vue";

import store from "../store/index"; // Importa tu store de Vuex

import tokens from "@/router/services/tokens";
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

      // Limpiar todas las cookies
      function deleteAllCookies() {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      }

      deleteAllCookies();
      
      console.log('✅ Signout completado - sesión limpiada completamente');
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
      const isLoggedIn = sessionStorage.getItem("isLoggedIn");
      
      if (store.getters.isLoggedIn || isLoggedIn) {
        // Si el usuario ya está logueado, verificar si el token es válido
        console.log('✅ Usuario ya autenticado, verificando token...');
        const roles = await tokens.sendRole();
        
        if (roles.error) {
          // Token inválido, limpiar y mostrar login
          console.log('❌ Token inválido, limpiando sesión');
          localStorage.clear();
          sessionStorage.clear();
          next();
        } else {
          // Token válido, redirigir al dashboard
          console.log('✅ Token válido, redirigiendo al dashboard');
          next("/dashboard");
        }
      } else {
        // Usuario no logueado, mostrar página de login
        console.log('🔐 Usuario no autenticado, mostrando login');
        next();
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
      {
        path: "/tree-admin",
        name: "TreeAdmin",
        component: TreeAdmin,
        meta: {
          requiresAuth: true,
          permissions: [{ module: 'admin', permission: 'manageTree' }]
        },
      },
      {
        path: "/admin-iframe-1",
        name: "AdminIframe1",
        component: () => import("../views/AdminIframe1.vue"),
        meta: {
          requiresAuth: true,
          permissions: [{ module: 'admin', permission: 'systemConfig' }]
        },
      },
      {
        path: "/admin-iframe-2",
        name: "AdminIframe2",
        component: () => import("../views/AdminIframe2.vue"),
        meta: {
          requiresAuth: true,
          permissions: [{ module: 'admin', permission: 'systemConfig' }]
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
      // Verificar si el usuario es admin primero
      const userRole = store.state.user?.role || 
                      store.state.role ||
                      localStorage.getItem('userRoleName') || 
                      localStorage.getItem('userRole') || 
                      sessionStorage.getItem('role') ||
                      'usuario';
      
      const isAdmin = userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'administrador';
      
      if (isAdmin) {
        console.log('👑 Usuario admin detectado, permitiendo acceso automático');
        next();
        return;
      }
      
      // Si no es admin, verificar permisos específicos
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
