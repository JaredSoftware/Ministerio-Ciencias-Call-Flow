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

import store from "../store/index"; // Importa tu store de Vuex

import tokens from "../services/tokens";
import sessionSync from "../services/sessionSync";

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
      roles: [
        "administrador",
        "contac center manager",
        "supervisor",
        "asesor",
        "usuario",
      ], // Agregamos esta propiedad para indicar que la ruta es protegida
    },
  },
  {
    path: "/signout",
    name: "Signout",
    beforeEnter: async (to, from, next) => {
      localStorage.clear();
      sessionStorage.clear();

      function deleteCookie(cookieName) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }

      deleteCookie("rememberMe");
      next("/");
    },
  },
  {
    path: "/Users",
    name: "Users",
    component: users,
    meta: {
      requiresAuth: true,
      roles: ["administrador", "contac center manager", "supervisor"], // Agregamos esta propiedad para indicar que la ruta es protegida
    },
  },
  {
    path: "/viajes",
    name: "viajes",
    component: viaje,
    meta: {
      requiresAuth: true, // Agregamos esta propiedad para indicar que la ruta es protegida
      roles: [
        "administrador",
        "contac center manager",
        "supervisor",
        "asesor",
        "usuario",
      ], // Agregamos esta propiedad para indicar que la ruta es protegida
    },
  },
  {
    path: "/abonos",
    name: "Abonos",
    component: abono,
    meta: {
      requiresAuth: true, // Agregamos esta propiedad para indicar que la ruta es protegida
      roles: [
        "administrador",
        "contac center manager",
        "supervisor",
        "asesor",
        "usuario",
      ], // Agregamos esta propiedad para indicar que la ruta es protegida
    },
  },
  {
    path: "/saldos",
    name: "Saldos",
    component: saldos,
    meta: {
      requiresAuth: true, // Agregamos esta propiedad para indicar que la ruta es protegida
      roles: [
        "administrador",
        "contac center manager",
        "supervisor",
        "asesor",
        "usuario",
      ], // Agregamos esta propiedad para indicar que la ruta es protegida
    },
  },
  {
    path: "/tables",
    name: "Tables",
    component: Tables,
    meta: {
      requiresAuth: true, // Agregamos esta propiedad para indicar que la ruta es protegida
      roles: [
        "administrador",
        "contac center manager",
        "supervisor",
        "asesor",
        "usuario",
      ], // Agregamos esta propiedad para indicar que la ruta es protegida
    },
  },
  {
    path: "/billing",
    name: "Billing",
    component: Billing,
    meta: {
      requiresAuth: true, // Agregamos esta propiedad para indicar que la ruta es protegida
      roles: [
        "administrador",
        "contac center manager",
        "supervisor",
        "asesor",
        "usuario",
      ], // Agregamos esta propiedad para indicar que la ruta es protegida
    },
  },
  {
    path: "/virtual-reality",
    name: "Virtual Reality",
    component: VirtualReality,
    meta: {
      requiresAuth: true, // Agregamos esta propiedad para indicar que la ruta es protegida
      roles: [
        "administrador",
        "contac center manager",
        "supervisor",
        "asesor",
        "usuario",
      ], // Agregamos esta propiedad para indicar que la ruta es protegida
    },
  },
  {
    path: "/rtl-page",
    name: "RTL",
    component: RTL,
    meta: {
      requiresAuth: true, // Agregamos esta propiedad para indicar que la ruta es protegida
      roles: [
        "administrador",
        "contac center manager",
        "supervisor",
        "asesor",
        "usuario",
      ], // Agregamos esta propiedad para indicar que la ruta es protegida
    },
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: {
      requiresAuth: true, // Agregamos esta propiedad para indicar que la ruta es protegida
      roles: [
        "administrador",
        "contac center manager",
        "supervisor",
        "asesor",
        "usuario",
      ], // Agregamos esta propiedad para indicar que la ruta es protegida
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
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  linkActiveClass: "active",
});

const rutasEspeciales = ["/signin"];

router.beforeEach(async (to, from, next) => {
  console.log('🛡️ Router guard ejecutándose para:', to.path);
  console.log('🔍 sessionStorage isLoggedIn:', sessionStorage.getItem("isLoggedIn"));
  console.log('🔍 store.getters.isLoggedIn:', store.getters.isLoggedIn);
  
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  
  // VERIFICAR REMEMBER ME ANTES DE VERIFICAR ROLES
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
  
  // Ahora verificar roles (después del posible auto-login)
  const roles = await tokens.sendRole();
  console.log('🔍 Roles obtenidos:', roles);

  if (rutasEspeciales.includes(to.path)) {
    console.log('✅ Ruta especial, permitiendo acceso');
    next();
  } else {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      console.log('🔒 Ruta protegida detectada');
      // Si la ruta es protegida...
              // Verificar de nuevo después del posible auto-login
        const isLoggedInNow = sessionStorage.getItem("isLoggedIn");
        
        if (store.getters.isLoggedIn || isLoggedInNow) {
          console.log('✅ Usuario ya logueado, verificando roles...');
          // Si el usuario ha iniciado sesión...
          if (!to.meta.roles.includes(roles.nombre)) {
            console.log('❌ Rol no autorizado, redirigiendo');
            next(from.fullPath);
          } else {
            console.log('✅ Rol autorizado, permitiendo acceso');
            next(); // Permitimos el acceso a la ruta
          }
        } else {
        // Si el usuario no ha iniciado sesión...
        console.log('❌ Usuario no autenticado después de verificar Remember Me');
        console.log('🔄 Redirigiendo a login...');
        next("/"); // Redirigir al login
      }
    } else {
      next(); // Permitimos el acceso a rutas no protegidas
    }
  }
});

export default router;
