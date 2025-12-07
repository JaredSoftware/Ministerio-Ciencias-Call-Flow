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
// Work.vue ahora muestra un popup con iframe del formulario EJS
// import Work from "../views/Work.vue"; // Cargado dinámicamente
import TreeAdmin from "../views/TreeAdmin.vue";
import DialogosAdmin from "../views/DialogosAdmin.vue";

import store from "../store/index"; // Importa tu store de Vuex

import tokens from "@/router/services/tokens";
import permissions from "@/router/services/permissions";
import qs from "qs";

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
      // Verificar si hay usuario (idAgent es opcional)
      const hasUserComplete = !!store.state.user && store.getters.isLoggedIn;
      
      if (!hasUserComplete) {
        // No hay usuario completo, simplemente mostrar login (sin limpiar para no interrumpir el proceso)
        next();
        return;
      }
      
      // Si hay usuario completo, verificar token
      const roles = await tokens.sendRole();
      
      if (roles.error) {
        // Token inválido, limpiar y mostrar login
        console.log("⚠️ [Router] Token inválido. Limpiando sesión...");
        store.dispatch("logout");
        localStorage.clear();
        sessionStorage.clear();
        next();
      } else {
        // Token válido, redirigir al dashboard
        next("/dashboard");
      }
    },
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
  },
  // Ruta Work eliminada - el sistema funciona automáticamente con notificaciones
  // {
  //   path: "/work",
  //   name: "Work",
  //   component: () => import("../views/Work.vue"),
  //   meta: {
  //     requiresAuth: true,
  //     permissions: []
  //   },
  // },
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
        path: "/dialogos-admin",
        name: "DialogosAdmin",
        component: DialogosAdmin,
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
  
  // Rutas especiales que no requieren verificación - SALIR INMEDIATAMENTE
  if (rutasEspeciales.includes(to.path)) {
    next();
    return;
  }
  
  // Verificar si la ruta requiere autenticación
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    
    // 🚨 VERIFICACIÓN SIMPLE: Solo permitir acceso si hay usuario completo en el store
    // También verificar sessionStorage por si el store aún no se actualizó
    const userInStore = store.state.user;
    const userInSession = sessionStorage.getItem('user');
    let user = userInStore;
    
    // Si no hay usuario en store pero sí en sessionStorage, intentar parsearlo
    if (!user && userInSession) {
      try {
        user = qs.parse(userInSession);
        // Actualizar el store con el usuario de sessionStorage
        store.commit('setUser', user);
        if (!store.getters.isLoggedIn) {
          store.commit('makelogin');
        }
      } catch (e) {
        // Error parseando, continuar sin usuario
      }
    }
    
    // Verificar si hay usuario: debe tener user Y estar logueado
    // idAgent es opcional (algunos usuarios como admin pueden no tenerlo)
    const hasUserComplete = !!user && store.getters.isLoggedIn;
    
    // Si NO hay usuario completo, redirigir a signin
    if (!hasUserComplete) {
      // NO hacer log si ya estamos yendo a signin (evitar spam en consola)
      if (to.path !== '/signin' && from.path !== '/signin') {
        console.log("🚨 [Router] No hay usuario completo. Redirigiendo a /signin");
      }
      next("/signin");
      return;
    }

    // Usuario está logueado, verificar permisos específicos
    
    // Obtener los permisos requeridos para esta ruta
    const routePermissions = to.meta.permissions;
    
    // Si no hay permisos específicos requeridos, permitir acceso
    if (!routePermissions || routePermissions.length === 0) {
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
        next();
        return;
      }
      
      // Si no es admin, verificar permisos específicos
      const hasAccess = await permissions.hasAnyPermission(routePermissions);
      
      if (hasAccess) {
        next();
        } else {
        // Redirigir al dashboard o a una página de acceso denegado
        next('/dashboard');
      }
    } catch (error) {
      console.error('❌ Error verificando permisos:', error);
      // En caso de error, permitir acceso temporal
      next();
      }
    } else {
    // Ruta pública
    next();
  }
});

export default router;
