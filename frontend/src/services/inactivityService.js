// Servicio para detectar inactividad del usuario y hacer logout automático
import store from '@/store';
import router from '@/router';

class InactivityService {
  constructor() {
    this.timeout = null;
    this.warningTimeout = null;
    this.inactivityTime = 2 * 60 * 60 * 1000; // 2 horas en milisegundos
    this.warningTime = this.inactivityTime - (5 * 60 * 1000); // 5 minutos antes
    this.isActive = false;
    this.lastActivity = Date.now();
    
    // Eventos que se consideran actividad
    this.activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];
  }

  // Iniciar monitoreo de inactividad
  start() {
    if (this.isActive) {
      console.log('⚠️ Servicio de inactividad ya está activo');
      return;
    }

    console.log('🕐 Iniciando monitoreo de inactividad');
    console.log(`   - Tiempo de inactividad: ${this.inactivityTime / 1000 / 60} minutos`);
    console.log(`   - Advertencia en: ${this.warningTime / 1000 / 60} minutos`);
    
    this.isActive = true;
    this.lastActivity = Date.now();
    
    // Agregar event listeners para detectar actividad
    this.activityEvents.forEach(event => {
      window.addEventListener(event, this.resetTimer.bind(this), true);
    });

    // Iniciar timer
    this.resetTimer();
  }

  // Detener monitoreo
  stop() {
    if (!this.isActive) {
      return;
    }

    console.log('🛑 Deteniendo monitoreo de inactividad');
    this.isActive = false;

    // Limpiar timers
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }

    // Remover event listeners
    this.activityEvents.forEach(event => {
      window.removeEventListener(event, this.resetTimer.bind(this), true);
    });
  }

  // Reiniciar timer cuando hay actividad
  resetTimer() {
    if (!this.isActive) {
      return;
    }

    this.lastActivity = Date.now();

    // Limpiar timers existentes
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
    }

    // Configurar timer de advertencia (5 minutos antes del logout)
    this.warningTimeout = setTimeout(() => {
      this.showInactivityWarning();
    }, this.warningTime);

    // Configurar timer de logout
    this.timeout = setTimeout(() => {
      this.handleInactivity();
    }, this.inactivityTime);
  }

  // Mostrar advertencia de inactividad
  showInactivityWarning() {
    console.log('⚠️ ADVERTENCIA: Inactividad detectada - logout en 5 minutos');
    
    // Crear notificación visual
    const warning = document.createElement('div');
    warning.id = 'inactivity-warning';
    warning.className = 'inactivity-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <div class="warning-icon">⏰</div>
        <div class="warning-text">
          <h4>Inactividad Detectada</h4>
          <p>Tu sesión se cerrará en <strong>5 minutos</strong> por inactividad.</p>
          <p class="warning-detail">Mueve el mouse o haz clic para mantener tu sesión activa.</p>
        </div>
        <button class="warning-close" onclick="document.getElementById('inactivity-warning').remove()">✕</button>
      </div>
    `;

    // Agregar estilos inline
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ff9800, #ff5722);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(255, 152, 0, 0.4);
      z-index: 10000;
      min-width: 380px;
      animation: slideInRight 0.5s ease-out;
    `;

    // Agregar al DOM si no existe ya
    const existing = document.getElementById('inactivity-warning');
    if (!existing) {
      document.body.appendChild(warning);

      // Remover después de 10 segundos
      setTimeout(() => {
        if (document.getElementById('inactivity-warning')) {
          warning.remove();
        }
      }, 10000);
    }
  }

  // Manejar inactividad (logout automático)
  async handleInactivity() {
    const inactiveTime = Date.now() - this.lastActivity;
    const inactiveMinutes = Math.floor(inactiveTime / 1000 / 60);

    console.log('🚨 INACTIVIDAD DETECTADA - Haciendo logout automático');
    console.log(`   - Tiempo inactivo: ${inactiveMinutes} minutos`);

    // Detener monitoreo
    this.stop();

    // Mostrar notificación de logout
    this.showLogoutNotification(inactiveMinutes);

    // Esperar 3 segundos para que se vea la notificación
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Hacer logout
    try {
      // Limpiar store
      await store.dispatch('logout');

      // Limpiar localStorage y sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Limpiar cookies
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }

      // Redirigir a login
      router.push('/signin');
    } catch (error) {
      console.error('❌ Error en logout automático:', error);
      // Forzar redirección de todos modos
      window.location.href = '/signin';
    }
  }

  // Mostrar notificación de logout
  showLogoutNotification(minutes) {
    const notification = document.createElement('div');
    notification.className = 'logout-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🚪</div>
        <div class="notification-text">
          <h4>Sesión Cerrada por Inactividad</h4>
          <p>Has estado inactivo por <strong>${minutes} minutos</strong>.</p>
          <p class="notification-detail">Por seguridad, tu sesión ha sido cerrada automáticamente.</p>
        </div>
      </div>
    `;

    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #f44336, #e91e63);
      color: white;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(244, 67, 54, 0.5);
      z-index: 10001;
      min-width: 400px;
      text-align: center;
      animation: fadeIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);
  }

  // Obtener tiempo de inactividad actual
  getInactiveTime() {
    return Date.now() - this.lastActivity;
  }

  // Verificar si el usuario está inactivo
  isInactive() {
    return this.getInactiveTime() > this.inactivityTime;
  }
}

// Crear instancia singleton
const inactivityService = new InactivityService();

export default inactivityService;

