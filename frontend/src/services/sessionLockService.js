// Servicio para gestionar sesiones únicas por usuario
// Solo permite una sesión activa por usuario en todo momento

import { mqttService } from '@/router/services/mqttService';
import store from '@/store';
import router from '@/router';

class SessionLockService {
  constructor() {
    this.sessionId = null;
    this.userId = null;
    this.heartbeatInterval = null;
    this.lockCheckInterval = null;
    this.isLocked = false;
  }

  // Generar ID de sesión único
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Iniciar sesión única
  async start(userId, userName) {
    if (this.isLocked) {
      console.log('⚠️ Sesión ya iniciada');
      return;
    }

    this.userId = userId;
    this.sessionId = this.generateSessionId();

    console.log('🔒 Iniciando sistema de sesión única');
    console.log(`   - Usuario: ${userName} (${userId})`);
    console.log(`   - Session ID: ${this.sessionId}`);

    // Almacenar sessionId en sessionStorage
    sessionStorage.setItem('sessionId', this.sessionId);

    // Escuchar notificaciones de sesión duplicada
    this.setupDuplicateSessionListener();

    // Anunciar esta sesión como activa
    await this.announceSession();

    // Iniciar heartbeat (cada 30 segundos)
    this.startHeartbeat();

    // Verificar si hay sesión duplicada (cada 10 segundos)
    this.startLockCheck();

    this.isLocked = true;
  }

  // Detener sistema de sesión única
  stop() {
    if (!this.isLocked) {
      return;
    }

    console.log('🔓 Deteniendo sistema de sesión única');

    // Limpiar intervalos
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.lockCheckInterval) {
      clearInterval(this.lockCheckInterval);
      this.lockCheckInterval = null;
    }

    // Anunciar cierre de sesión
    this.announceSessionClosed();

    // Limpiar listeners
    if (this.duplicateSessionCallback) {
      const topic = `session/duplicate/${this.userId}`;
      mqttService.off(topic, this.duplicateSessionCallback, 'session');
    }

    this.isLocked = false;
    this.sessionId = null;
    this.userId = null;
  }

  // Configurar listener para sesiones duplicadas
  setupDuplicateSessionListener() {
    const topic = `session/duplicate/${this.userId}`;

    this.duplicateSessionCallback = (data) => {
      console.log('🚨 Notificación de sesión duplicada recibida:', data);

      // Si no es nuestra sesión, significa que debemos cerrar
      if (data.newSessionId && data.newSessionId !== this.sessionId) {
        console.log('❌ Otra sesión ha tomado control - cerrando esta sesión');
        this.handleSessionTakeover(data);
      }
    };

    mqttService.on(topic, this.duplicateSessionCallback, 'session');
    console.log('👂 Escuchando duplicados en:', topic);
  }

  // Anunciar esta sesión como activa
  async announceSession() {
    const topic = `session/announce/${this.userId}`;
    const message = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      action: 'session_start',
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`
    };

    console.log('📢 Anunciando sesión activa');
    mqttService.publish(topic, message);
  }

  // Anunciar cierre de sesión
  announceSessionClosed() {
    const topic = `session/announce/${this.userId}`;
    const message = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      action: 'session_end'
    };

    console.log('📢 Anunciando cierre de sesión');
    mqttService.publish(topic, message);
  }

  // Heartbeat para mantener sesión activa
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.isLocked) return;

      const topic = `session/heartbeat/${this.userId}`;
      const message = {
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: Date.now()
      };

      mqttService.publish(topic, message);
      console.log('💓 Heartbeat enviado');
    }, 30000); // Cada 30 segundos
  }

  // Verificar periódicamente si hay conflicto de sesión
  startLockCheck() {
    this.lockCheckInterval = setInterval(() => {
      if (!this.isLocked) return;

      const storedSessionId = sessionStorage.getItem('sessionId');
      
      // Si el sessionId cambió, significa que otra pestaña tomó control
      if (storedSessionId !== this.sessionId) {
        console.log('⚠️ Session ID cambió - otra pestaña tomó control');
        this.handleLocalSessionTakeover();
      }
    }, 10000); // Cada 10 segundos
  }

  // Manejar cuando otra sesión toma control (remoto)
  handleSessionTakeover(data) {
    // Detener servicios
    this.stop();

    console.log('🚨 Sesión tomada por otro dispositivo:', data);

    // Mostrar notificación
    this.showSessionTakeoverNotification();

    // Esperar 3 segundos y hacer logout
    setTimeout(async () => {
      try {
        // Limpiar store
        await store.dispatch('logout');

        // Limpiar almacenamiento
        sessionStorage.clear();
        localStorage.clear();

        // Redirigir a login
        router.push('/signin');
      } catch (error) {
        console.error('❌ Error en logout por sesión duplicada:', error);
        window.location.href = '/signin';
      }
    }, 3000);
  }

  // Manejar cuando otra pestaña local toma control
  handleLocalSessionTakeover() {
    console.log('🔄 Otra pestaña de este navegador tiene el control');
    
    // Mostrar advertencia
    this.showLocalTakeoverWarning();

    // Esta pestaña pasa a modo "lectura" - no intenta hacer operaciones
    this.isLocked = false;
  }

  // Mostrar notificación de sesión tomada por otro dispositivo
  showSessionTakeoverNotification() {
    const notification = document.createElement('div');
    notification.className = 'session-takeover-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🚪</div>
        <div class="notification-text">
          <h4>Sesión Iniciada en Otro Dispositivo</h4>
          <p>Se ha detectado un nuevo inicio de sesión con tu cuenta.</p>
          <p class="notification-detail">Serás desconectado en 3 segundos por seguridad.</p>
          <p class="notification-info">Si no fuiste tú, cambia tu contraseña inmediatamente.</p>
        </div>
      </div>
    `;

    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #e91e63, #f44336);
      color: white;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(233, 30, 99, 0.5);
      z-index: 10001;
      min-width: 450px;
      text-align: center;
      animation: fadeIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);
  }

  // Mostrar advertencia de pestaña secundaria
  showLocalTakeoverWarning() {
    const warning = document.createElement('div');
    warning.id = 'local-takeover-warning';
    warning.className = 'local-takeover-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <div class="warning-icon">⚠️</div>
        <div class="warning-text">
          <h4>Sesión Secundaria Detectada</h4>
          <p>Tienes otra pestaña activa con tu cuenta.</p>
          <p class="warning-detail">Esta pestaña está en modo de solo lectura.</p>
          <p class="warning-action">Cierra las demás pestañas para usar esta.</p>
        </div>
      </div>
    `;

    warning.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #ff9800, #ff5722);
      color: white;
      padding: 15px;
      z-index: 9999;
      text-align: center;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    `;

    const existing = document.getElementById('local-takeover-warning');
    if (!existing) {
      document.body.insertBefore(warning, document.body.firstChild);
    }
  }

  // Verificar si esta es la sesión activa
  isActiveSession() {
    const storedSessionId = sessionStorage.getItem('sessionId');
    return this.isLocked && storedSessionId === this.sessionId;
  }
}

// Crear instancia singleton
const sessionLockService = new SessionLockService();

export default sessionLockService;

