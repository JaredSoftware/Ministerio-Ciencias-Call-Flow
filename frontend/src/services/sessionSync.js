import axios from "./axios";

const sessionSyncService = {
  // Sincronizar token con sesión Express
  syncSession: async () => {
    try {
      console.log('🔍 Verificando localStorage...');
      console.log('   - token (usuario):', localStorage.getItem("token"));
      console.log('   - TokenRole:', localStorage.getItem("TokenRole"));
      console.log('   - isLoggedIn:', sessionStorage.getItem("isLoggedIn"));
      
      // Obtener token del USUARIO (no el de rol)
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.log('❌ No hay token disponible para sincronizar');
        return { success: false, message: 'No hay token disponible' };
      }
      
      console.log('🔄 Sincronizando sesión con token:', token.substring(0, 20) + '...');
      console.log('🔍 Token completo:', token);
      
      console.log('📤 Enviando petición a /auth/sync-session...');
      const response = await axios.post("/auth/sync-session", { token }, {
        withCredentials: true // Solo para esta petición
      });
      console.log('📥 Respuesta recibida:', response.data);
      
      if (response.data.success) {
        console.log('✅ Sesión sincronizada correctamente');
        return response.data;
      } else {
        console.log('❌ Error sincronizando sesión:', response.data.message);
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
      console.log('🍪 Verificando cookie Remember Me...');
      console.log('🔍 Todas las cookies:', document.cookie);
      
      // Buscar cookie rememberMe
      const allCookies = document.cookie.split(";");
      console.log('📋 Cookies separadas:', allCookies);
      
      const rememberMeCookie = allCookies
        .find((cookie) => cookie.trim().startsWith("rememberMe="));

      if (!rememberMeCookie) {
        console.log('❌ No hay cookie Remember Me');
        console.log('🔍 Cookies encontradas:', allCookies.map(c => c.trim().split('=')[0]));
        return { success: false, message: 'No hay cookie Remember Me' };
      }

      const token = decodeURIComponent(rememberMeCookie.split("=")[1]);
      console.log('✅ Cookie encontrada, token:', token.substring(0, 20) + '...');

      // Guardar token en localStorage para que funcione el sistema existente
      localStorage.setItem('token', token);
      console.log('💾 Token guardado en localStorage');

      // Sincronizar sesión con Express usando el token de la cookie
      console.log('🔄 Sincronizando sesión desde cookie...');
      const syncResult = await sessionSyncService.syncSession();

      if (syncResult.success) {
        console.log('✅ Auto-login exitoso desde cookie:', syncResult.user.name);
        
        // Marcar como logueado en sessionStorage
        sessionStorage.setItem("isLoggedIn", "true");
        
        return {
          success: true,
          user: syncResult.user,
          message: 'Auto-login exitoso desde cookie'
        };
      } else {
        console.log('❌ Error sincronizando desde cookie:', syncResult.message);
        return syncResult;
      }

    } catch (error) {
      console.error('❌ Error en auto-login desde cookie:', error);
      return { success: false, message: 'Error en auto-login: ' + error.message };
    }
      }
  };

export default sessionSyncService; 