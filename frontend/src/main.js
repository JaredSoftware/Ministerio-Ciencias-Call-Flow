import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";
import router from "./router";
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";
import ArgonDashboard from "./argon-dashboard";
// import Popper from "popper.js"; // Deshabilitado temporalmente
import VueGoodTablePlugin from 'vue-good-table-next';
import 'vue-good-table-next/dist/vue-good-table-next.css'
import WebSocketPlugin from "./plugins/websocket";
import { mqttService } from "./router/services/mqttService";
import environmentConfig from "./config/environment";

const appInstance = createApp(App);
appInstance.use(store);
appInstance.use(router);
appInstance.use(ArgonDashboard);
appInstance.use(VueGoodTablePlugin);
appInstance.use(WebSocketPlugin);

// Configurar Popper.js globalmente - DESHABILITADO TEMPORALMENTE
// appInstance.config.globalProperties.$popper = Popper;

appInstance.mount("#app");

// Inicializar MQTT después de que la app esté montada usando configuración dinámica
const mqttUrl = environmentConfig.getMQTTBrokerUrl();
mqttService.connect(mqttUrl).then(() => {
}).catch((error) => {
  console.error('❌ Error conectando MQTT Service:', error);
});

// 🚀 SERVICIO GLOBAL: Monitoreo constante de tipificaciones pendientes
class TipificacionMonitorService {
  constructor() {
    this.eventSource = null; // Conexión SSE
    this.lastTipificacionIds = [];
    this.isRunning = false;
    this.popupWindow = null;
    this.notificationPermission = null;
  }

  // Solicitar permiso para notificaciones
  async requestNotificationPermission() {
    if (!("Notification" in window)) {
      console.warn("⚠️ [TipificacionMonitor] Este navegador no soporta notificaciones");
      return false;
    }

    if (Notification.permission === "granted") {
      this.notificationPermission = "granted";
      console.log("✅ [TipificacionMonitor] Permiso de notificaciones ya concedido");
      return true;
    }

    if (Notification.permission !== "denied") {
      try {
        console.log("🔔 [TipificacionMonitor] Solicitando permiso de notificaciones...");
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission;
        console.log(`🔔 [TipificacionMonitor] Permiso de notificaciones: ${permission}`);
        return permission === "granted";
      } catch (error) {
        console.error("❌ [TipificacionMonitor] Error solicitando permiso de notificaciones:", error);
        return false;
      }
    }

    console.warn("⚠️ [TipificacionMonitor] Permiso de notificaciones denegado");
    return false;
  }

  // Mostrar notificación del navegador o alerta alternativa
  showNotification(tipificacion) {
    console.log("🔔 [TipificacionMonitor] Intentando mostrar notificación...");
    
    const idLlamada = tipificacion.idLlamada || tipificacion.id || "N/A";
    const cedula = tipificacion.cedula || "Sin cédula";
    const nombres = tipificacion.nombres || "";
    const apellidos = tipificacion.apellidos || "";
    const cliente = nombres || apellidos ? `${nombres} ${apellidos}`.trim() : cedula;

    // Si el permiso no está concedido, intentar solicitar
    if (this.notificationPermission !== "granted") {
      console.warn("⚠️ [TipificacionMonitor] Permiso de notificaciones no concedido. Permiso actual:", this.notificationPermission);
      
      // Intentar solicitar permiso nuevamente
      this.requestNotificationPermission().then(granted => {
        if (granted) {
          // Si se concedió, mostrar notificación
          this.showNotification(tipificacion);
        } else {
          // Si no se concedió, mostrar alerta alternativa y abrir popup automáticamente
          console.log("⚠️ [TipificacionMonitor] Permiso denegado, usando alerta alternativa");
          this.showAlternativeAlert(idLlamada, cliente);
        }
      });
      return;
    }

    // Mostrar notificación del navegador
    try {
      const notification = new Notification("📞 Nueva Tipificación Pendiente", {
        body: `Llamada ${idLlamada} - Cliente: ${cliente}`,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `tipificacion-${idLlamada}`, // Evita notificaciones duplicadas
        requireInteraction: true, // La notificación permanece hasta que el usuario la cierre
        data: {
          idLlamada: idLlamada,
          tipificacion: tipificacion
        }
      });

      console.log("✅ [TipificacionMonitor] Notificación mostrada:", idLlamada);

      // Al hacer clic en la notificación, abrir el formulario
      notification.onclick = () => {
        console.log("🖱️ [TipificacionMonitor] Click en notificación, abriendo formulario...");
        window.focus(); // Enfocar la ventana del navegador
        this.openFormulario();
        notification.close();
      };

      // Cerrar la notificación después de 10 segundos si no se interactúa
      setTimeout(() => {
        notification.close();
      }, 10000);
    } catch (error) {
      console.error("❌ [TipificacionMonitor] Error mostrando notificación:", error);
      // Si falla, usar alerta alternativa
      this.showAlternativeAlert(idLlamada, cliente);
    }
  }

  // Mostrar alerta alternativa si no hay permisos de notificaciones
  showAlternativeAlert(idLlamada, cliente) {
    console.log("🔔 [TipificacionMonitor] Mostrando alerta alternativa");
    
    // Mostrar alerta del navegador
    const mensaje = `📞 Nueva Tipificación Pendiente\n\nLlamada: ${idLlamada}\nCliente: ${cliente}\n\n¿Deseas abrir el formulario ahora?`;
    
    if (confirm(mensaje)) {
      this.openFormulario();
    } else {
      // Si el usuario cancela, abrir automáticamente después de 2 segundos
      console.log("⏱️ [TipificacionMonitor] Abriendo formulario automáticamente en 2 segundos...");
      setTimeout(() => {
        this.openFormulario();
      }, 2000);
    }
  }

  // Abrir popup del formulario
  openFormulario() {
    const user = store.state.user;
    const idAgent = user?.idAgent;

    if (!idAgent) {
      console.error("❌ No se encontró idAgent para abrir el formulario");
      return;
    }

    // Si ya hay una ventana abierta, enfocarla
    if (this.popupWindow && !this.popupWindow.closed) {
      this.popupWindow.focus();
      return;
    }

    // Construir URL completa del formulario EJS
    const baseUrl = window.location.origin;
    const formUrl = `${baseUrl}/api/tipificacion/formulario/${idAgent}`;

    // Características de la ventana popup
    const popupFeatures = [
      'width=1400',
      'height=900',
      'left=' + (screen.width / 2 - 700),
      'top=' + (screen.height / 2 - 450),
      'scrollbars=yes',
      'resizable=yes',
      'toolbar=no',
      'menubar=no',
      'location=no',
      'status=no',
      'directories=no'
    ].join(',');

    // Abrir ventana popup
    this.popupWindow = window.open(formUrl, 'TipificacionFormulario_' + idAgent, popupFeatures);

    if (!this.popupWindow || this.popupWindow.closed || typeof this.popupWindow.closed === 'undefined') {
      console.warn("⚠️ El navegador bloqueó la ventana popup");
    } else {
      this.popupWindow.focus();
      
      // Escuchar mensajes del popup para cerrarlo
      const messageHandler = (event) => {
        if (event.data && event.data.type === 'cerrarPopup') {
          try {
            if (this.popupWindow && !this.popupWindow.closed) {
              this.popupWindow.close();
            }
          } catch(e) {
            // Ignorar error al cerrar popup
          }
          this.popupWindow = null;
          window.removeEventListener('message', messageHandler);
        }
      };
      window.addEventListener('message', messageHandler);
      
      // También verificar periódicamente si el popup se cerró
      const checkInterval = setInterval(() => {
        if (this.popupWindow && this.popupWindow.closed) {
          this.popupWindow = null;
          clearInterval(checkInterval);
        }
      }, 500);
    }
  }

  // Conectar a SSE (Server-Sent Events) para recibir actualizaciones en tiempo real desde Redis
  connectSSE() {
    const user = store.state.user;
    
    // Solo conectar si el usuario está logueado y tiene idAgent
    if (!store.state.isLoggedIn || !user || !user.idAgent) {
      console.log("🔍 [TipificacionMonitor] Usuario no logueado o sin idAgent:", {
        isLoggedIn: store.state.isLoggedIn,
        hasUser: !!user,
        idAgent: user?.idAgent
      });
      return;
    }

    const idAgent = user.idAgent;
    const baseUrl = window.location.origin;
    const sseUrl = `${baseUrl}/api/tipificacion/stream/${idAgent}`;
    
    console.log(`🔌 [TipificacionMonitor] Conectando a SSE para agente ${idAgent}:`, sseUrl);
    console.log(`🔌 [TipificacionMonitor] URL completa:`, sseUrl);

    // Cerrar conexión anterior si existe
    if (this.eventSource) {
      console.log("🔄 [TipificacionMonitor] Cerrando conexión SSE anterior...");
      this.eventSource.close();
      this.eventSource = null;
    }

    // Crear nueva conexión SSE
    try {
      this.eventSource = new EventSource(sseUrl);
      console.log("✅ [TipificacionMonitor] EventSource creado, readyState:", this.eventSource.readyState);
    } catch (error) {
      console.error("❌ [TipificacionMonitor] Error creando EventSource:", error);
      return;
    }

    // Manejar cuando se abre la conexión
    this.eventSource.onopen = () => {
      console.log("✅ [TipificacionMonitor] ⚠️⚠️⚠️ CONEXIÓN SSE ABIERTA ⚠️⚠️⚠️ readyState:", this.eventSource.readyState);
    };

    // Manejar mensajes recibidos
    this.eventSource.onmessage = (event) => {
      try {
        console.log("📨 [TipificacionMonitor] Evento SSE recibido (raw):", event);
        const data = JSON.parse(event.data);
        console.log("📡 [TipificacionMonitor] Mensaje SSE recibido:", data.type, "Count:", data.count, "Timestamp:", data.timestamp);

        if (data.type === 'update') {
          const tipificaciones = data.tipificaciones || [];
          const currentIds = tipificaciones.map(t => t.idLlamada || t.id).filter(Boolean);

          console.log("📋 [TipificacionMonitor] Tipificaciones actuales:", currentIds);
          console.log("📋 [TipificacionMonitor] IDs anteriores:", this.lastTipificacionIds);
          console.log("📋 [TipificacionMonitor] Count actual:", tipificaciones.length);

          // Comparar con los IDs anteriores para detectar nuevas tipificaciones
          if (this.lastTipificacionIds.length > 0) {
            const newTipificaciones = tipificaciones.filter(t => {
              const id = t.idLlamada || t.id;
              return id && !this.lastTipificacionIds.includes(id);
            });

            // Si hay nuevas tipificaciones, mostrar notificación
            if (newTipificaciones.length > 0) {
              console.log(`📞 [TipificacionMonitor] ⚠️⚠️⚠️ ${newTipificaciones.length} nueva(s) tipificación(es) detectada(s) ⚠️⚠️⚠️`, newTipificaciones);
              
              // Mostrar notificación para cada nueva tipificación
              newTipificaciones.forEach((tipificacion, index) => {
                console.log("🔔 [TipificacionMonitor] Mostrando notificación para:", tipificacion.idLlamada || tipificacion.id);
                
                // Mostrar notificación/alerta
                this.showNotification(tipificacion);
                
                // Si es la primera nueva tipificación, abrir popup automáticamente después de un breve delay
                if (index === 0) {
                  setTimeout(() => {
                    console.log("🚀 [TipificacionMonitor] Abriendo popup automáticamente para nueva tipificación");
                    this.openFormulario();
                  }, 1000); // Esperar 1 segundo para que el usuario vea la notificación/alerta
                }
              });
            } else {
              console.log("🔍 [TipificacionMonitor] No hay nuevas tipificaciones (IDs no cambiaron)");
            }
          } else {
            // Primera actualización: si hay tipificaciones, mostrar notificación y abrir popup
            if (tipificaciones.length > 0) {
              console.log(`📞 [TipificacionMonitor] ⚠️⚠️⚠️ ${tipificaciones.length} tipificación(es) pendiente(s) al iniciar ⚠️⚠️⚠️`);
              // Mostrar notificación solo de la primera (la más reciente)
              if (tipificaciones[0]) {
                console.log("🔔 [TipificacionMonitor] Mostrando notificación inicial para:", tipificaciones[0].idLlamada || tipificaciones[0].id);
                this.showNotification(tipificaciones[0]);
                
                // Abrir popup automáticamente después de un breve delay
                setTimeout(() => {
                  console.log("🚀 [TipificacionMonitor] Abriendo popup automáticamente para tipificación pendiente");
                  this.openFormulario();
                }, 1500); // Esperar 1.5 segundos para que el usuario vea la notificación/alerta
              }
            } else {
              console.log("🔍 [TipificacionMonitor] No hay tipificaciones pendientes");
            }
          }

          // Actualizar lista de IDs
          this.lastTipificacionIds = currentIds;
        } else if (data.type === 'heartbeat') {
          // Heartbeat silencioso - solo para mantener conexión viva
          console.log("💓 [TipificacionMonitor] Heartbeat recibido - conexión viva");
        } else if (data.type === 'error') {
          console.error("❌ [TipificacionMonitor] Error desde SSE:", data.message);
        }
      } catch (error) {
        console.error("❌ [TipificacionMonitor] Error procesando mensaje SSE:", error, "Data:", event.data);
      }
    };

    // Manejar errores de conexión
    this.eventSource.onerror = (error) => {
      console.error("❌ [TipificacionMonitor] Error en conexión SSE:", error);
      console.error("❌ [TipificacionMonitor] ReadyState:", this.eventSource?.readyState);
      console.error("❌ [TipificacionMonitor] URL:", sseUrl);
      console.log("🔄 [TipificacionMonitor] Intentando reconectar en 5 segundos...");
      
      // Cerrar conexión actual
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      // Intentar reconectar después de 5 segundos
      setTimeout(() => {
        if (this.isRunning && store.state.isLoggedIn && store.state.user?.idAgent) {
          console.log("🔄 [TipificacionMonitor] Intentando reconectar SSE...");
          this.connectSSE();
        }
      }, 5000);
    };

    console.log("✅ [TipificacionMonitor] Conexión SSE configurada, esperando mensajes...");
  }

  // Iniciar monitoreo
  async start() {
    if (this.isRunning) {
      console.log("⚠️ [TipificacionMonitor] El servicio ya está corriendo");
      return;
    }

    console.log("🚀 [TipificacionMonitor] Iniciando servicio de monitoreo...");

    // Solicitar permiso para notificaciones (más agresivo)
    const permissionGranted = await this.requestNotificationPermission();
    if (!permissionGranted) {
      console.warn("⚠️ [TipificacionMonitor] Permiso de notificaciones no concedido. Se usará alerta alternativa.");
    }

    // Conectar a SSE (conecta directamente a Redis a través del backend)
    this.connectSSE();

    this.isRunning = true;
    console.log("✅ [TipificacionMonitor] Servicio de monitoreo iniciado correctamente (SSE conectado)");
  }

  // Detener monitoreo
  stop() {
    if (this.eventSource) {
      console.log("🔌 [TipificacionMonitor] Cerrando conexión SSE...");
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isRunning = false;
    this.lastTipificacionIds = [];
    console.log("🛑 [TipificacionMonitor] Servicio de monitoreo detenido");
  }
}

// Crear instancia global del servicio
const tipificacionMonitor = new TipificacionMonitorService();

// Variable para rastrear el idAgent actual
let currentIdAgent = null;

// Suscribirse a las mutaciones del store para detectar login/logout
store.subscribe((mutation, state) => {
  // Detectar cuando el usuario hace login
  if (mutation.type === 'makelogin' || mutation.type === 'setUser') {
    const idAgent = state.user?.idAgent;
    
    if (idAgent && idAgent !== currentIdAgent) {
      console.log("✅ [TipificacionMonitor] Login detectado. Iniciando servicio para agente:", idAgent);
      currentIdAgent = idAgent;
      
      // Iniciar el servicio
      if (!tipificacionMonitor.isRunning) {
        tipificacionMonitor.start();
      }
    }
  }
  
  // Detectar cuando el usuario hace logout
  if (mutation.type === 'logout' || mutation.type === 'clearToken') {
    console.log("🛑 [TipificacionMonitor] Logout detectado. Deteniendo servicio...");
    currentIdAgent = null;
    
    // Detener el servicio
    if (tipificacionMonitor.isRunning) {
      tipificacionMonitor.stop();
    }
  }
});

// 🚨 LIMPIAR TODO AL CARGAR - NO MANTENER SESIÓN (solo si NO estamos en signin)
if (window.location.pathname !== '/signin') {
  console.log("🚨 [TipificacionMonitor] LIMPIANDO TODA LA SESIÓN AL CARGAR LA PÁGINA...");

  // Limpiar store
  store.dispatch("logout");

  // Limpiar storage COMPLETAMENTE
  localStorage.clear();
  sessionStorage.clear();

  // Limpiar cookies COMPLETAMENTE
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
  }

  console.log("✅ [TipificacionMonitor] Sesión completamente limpiada. El usuario DEBE hacer login.");
}

// Al cargar la página, NO iniciar automáticamente
// Solo se iniciará cuando el usuario haga login explícitamente
console.log("🚀 [TipificacionMonitor] Servicio global inicializado. Esperando login...");
console.log("🔍 [TipificacionMonitor] Estado inicial:", {
  isLoggedIn: store.state.isLoggedIn,
  hasUser: !!store.state.user,
  idAgent: store.state.user?.idAgent
});

// Si ya hay un usuario logueado al cargar (por ejemplo, desde sessionStorage),
// NO iniciar automáticamente - el usuario debe hacer login de nuevo
if (store.state.isLoggedIn && store.state.user?.idAgent) {
  console.log("⚠️ [TipificacionMonitor] Usuario detectado al cargar, pero NO se iniciará automáticamente.");
  console.log("⚠️ [TipificacionMonitor] El usuario debe hacer login de nuevo para iniciar el servicio.");
}
