import axios from "./axios";

const sessionSyncService = {
  // Sincronizar token con sesión Express
  syncSession: async () => {
    try {
      
      // Obtener token del USUARIO (buscar en sessionStorage primero, luego localStorage)
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      
      if (!token) {
        return { success: false, message: 'No hay token disponible' };
      }
      
      
      const response = await axios.post("/auth/sync-session", { token }, {
        withCredentials: true // Solo para esta petición
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('❌ Error en syncSession:', error);
      console.error('   - Error details:', error.response?.data || error.message);
      return { success: false, message: 'Error de conexión: ' + error.message };
    }
  },
  
    // Verificar si la sesión está sincronizada
  checkSession: async () => {
    try {
      const response = await axios.get("/auth/check", {
        withCredentials: true // Solo para esta petición
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error verificando sesión:', error);
      return { authenticated: false, message: 'Error de conexión' };
    }
  },

  // Inicializar WebSocket con sesión
  initWebSocket: async () => {
    try {
      const response = await axios.post("/websocket/init", {}, {
        withCredentials: true // Solo para esta petición
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error inicializando WebSocket:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  // Auto-login desde cookie Remember Me
  autoLoginFromCookie: async () => {
    try {
      
      // Buscar cookie rememberMe
      const allCookies = document.cookie.split(";");
      
      const rememberMeCookie = allCookies
        .find((cookie) => cookie.trim().startsWith("rememberMe="));

      if (!rememberMeCookie) {
        return { success: false, message: 'No hay cookie Remember Me' };
      }

      const token = decodeURIComponent(rememberMeCookie.split("=")[1]);

      // Guardar token en localStorage para que funcione el sistema existente
      localStorage.setItem('token', token);

      // Sincronizar sesión con Express usando el token de la cookie
      const syncResult = await sessionSyncService.syncSession();

      if (syncResult.success) {
        
        // Marcar como logueado en sessionStorage
        sessionStorage.setItem("isLoggedIn", "true");
        
        return {
          success: true,
          user: syncResult.user,
          message: 'Auto-login exitoso desde cookie'
        };
      } else {
        return syncResult;
      }

    } catch (error) {
      console.error('❌ Error en auto-login desde cookie:', error);
      return { success: false, message: 'Error en auto-login: ' + error.message };
    }
      }
  };

export default sessionSyncService; 