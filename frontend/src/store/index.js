import { createStore } from "vuex";

export default createStore({
  state: {
    hideConfigButton: false,
    isPinned: true,
    showConfig: false,
    sidebarType: "bg-white",
    isRTL: false,
    mcolor: "",
    darkMode: false,
    isNavFixed: false,
    isAbsolute: false,
    showNavs: true,
    showSidenav: true,
    showNavbar: true,
    showFooter: true,
    showMain: true,
    layout: "default",
    //login
    isLoggedIn: false,
    //remember me
    rememberMe: false,
    token: sessionStorage.getItem('token') || '',
    // User status
    userStatus: {
      status: 'online',
      customStatus: null,
      lastActivity: null
    },
  },
  mutations: {
    toggleConfigurator(state) {
      state.showConfig = !state.showConfig;
    },
    navbarMinimize(state) {
      const sidenav_show = document.querySelector(".g-sidenav-show");

      if (sidenav_show.classList.contains("g-sidenav-hidden")) {
        sidenav_show.classList.remove("g-sidenav-hidden");
        sidenav_show.classList.add("g-sidenav-pinned");
        state.isPinned = true;
      } else {
        sidenav_show.classList.add("g-sidenav-hidden");
        sidenav_show.classList.remove("g-sidenav-pinned");
        state.isPinned = false;
      }
    },
    sidebarType(state, payload) {
      state.sidebarType = payload;
    },
    navbarFixed(state) {
      if (state.isNavFixed === false) {
        state.isNavFixed = true;
      } else {
        state.isNavFixed = false;
      }
    },
    //login
    makelogin(state) {
      sessionStorage.setItem("isLoggedIn", true);
      state.isLoggedIn = true
    },
    logout(state) {
      sessionStorage.setItem("isLoggedIn", false);
      state.isLoggedIn = false
    },
    //remember me
    setToken(state, token) {
      state.token = token;
      localStorage.setItem('token', token);
    },
    clearToken(state) {
      state.token = '';
      localStorage.removeItem('token');
    },
    setRememberMe(state, value) {
      state.rememberMe = value;
    },
    setRole(state, role) {
      state.role = role;
      localStorage.setItem('role', role);
    },
    setRoleToken(state, tokenRole) {
      state.TokenRole = tokenRole;
      localStorage.setItem('TokenRole', tokenRole);
    },
    clearRole(state) {
      state.role = '';
      localStorage.removeItem('role');
    },
    // User status mutations
    setUserStatus(state, statusData) {
      state.userStatus = { ...state.userStatus, ...statusData };
    },
    updateUserStatus(state, status) {
      state.userStatus.status = status;
    },
  },
  actions: {
    toggleSidebarColor({ commit }, payload) {
      commit("sidebarType", payload);
    },
    //loggin
    // En el action de login
    login({ commit, state },tokenInfo) {
      // Simulación de inicio de sesión
      return new Promise(() => {
        setTimeout(() => {
          const token = tokenInfo;
          commit('setToken', token);
          if (state.rememberMe) {
            // Establecer una cookie para recordar la sesión
            const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días desde ahora
            document.cookie = `remember_token=${token};expires=${expires.toUTCString()}`;
          }
        }, 1000);
        commit("makelogin")
      });
    },
    logout({ commit }) {
      // Simulación de cierre de sesión
      return new Promise((resolve) => {
        setTimeout(() => {
          commit('clearToken');
          resolve();
        }, 500);
      });
    },
    checkToken({ commit }) {
      const token = localStorage.getItem('token');
      if (token) {
        commit('setToken', token);
      }
    },
    checkRememberMe({ commit }) {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('remember_token=')) {
          const token = cookie.substring('remember_token='.length);
          commit('setToken', token);
          commit('setRememberMe', true);
          return;
        }
      }
    }
  },
  getters: {
    isLoggedIn: state => state.isLoggedIn
  }
});
