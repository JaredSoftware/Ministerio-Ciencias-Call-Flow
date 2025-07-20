# Sistema de Gestión de Estados - Ministerio de Educación

## 📋 Descripción

Este sistema implementa un flujo de estados en tiempo real usando Socket.IO y Express Sessions para la aplicación del Ministerio de Educación.

## 🏗️ Arquitectura

### Componentes Principales

1. **StateManager** (`services/stateManager.js`)
   - Gestión centralizada de estados
   - Comunicación en tiempo real
   - Manejo de usuarios conectados

2. **Socket.IO** (Integrado en `app.js`)
   - Comunicación bidireccional en tiempo real
   - Manejo de eventos de estado
   - Notificaciones instantáneas

3. **Express Sessions** (Mejorado)
   - Sesiones seguras y persistentes
   - Integración con Socket.IO
   - Manejo de autenticación

4. **Middleware** (`middleware/stateMiddleware.js`)
   - Middleware para manejo de estados
   - Autenticación y autorización
   - Logging de actividad

## 🚀 Características

### ✅ Funcionalidades Implementadas

- **Estados de Usuario**: Cada usuario tiene su propio estado
- **Estados Globales**: Estados compartidos por toda la aplicación
- **Notificaciones en Tiempo Real**: Sistema de notificaciones instantáneas
- **Flujos de Trabajo**: Manejo de procesos paso a paso
- **Autenticación**: Sistema de login/logout con estados
- **Autorización**: Control de acceso basado en roles
- **Logging**: Registro de actividad de usuarios
- **Limpieza Automática**: Eliminación de estados antiguos

## 📡 Eventos Socket.IO

### Eventos del Cliente al Servidor

```javascript
// Acción del usuario
socket.emit('user_action', {
  action: 'create_user',
  data: { name: 'Juan', email: 'juan@example.com' }
});

// Cambio de estado
socket.emit('state_change', {
  state: { currentPage: 'dashboard', filters: {} },
  broadcast: false
});

// Actualización de flujo de trabajo
socket.emit('workflow_update', {
  workflowType: 'user_registration',
  step: 'verification',
  data: { emailVerified: true }
});

// Enviar notificación
socket.emit('send_notification', {
  targetUsers: ['user1', 'user2'],
  type: 'info',
  message: 'Nuevo usuario registrado'
});

// Solicitar estadísticas
socket.emit('get_state_stats');
```

### Eventos del Servidor al Cliente

```javascript
// Actividad de usuario
socket.on('user_activity', (data) => {
  console.log(`${data.userName} realizó: ${data.action}`);
});

// Estado actualizado
socket.on('state_updated', (data) => {
  console.log('Estado actualizado:', data);
});

// Flujo de trabajo actualizado
socket.on('workflow_updated', (data) => {
  console.log('Flujo actualizado:', data);
});

// Notificación
socket.on('notification', (data) => {
  console.log('Notificación:', data.message);
});

// Estadísticas de estado
socket.on('state_stats', (stats) => {
  console.log('Estadísticas:', stats);
});
```

## 🔧 Uso en Rutas

### Middleware Básico

```javascript
const { userStateMiddleware, requireAuth, logUserActivity } = require('../middleware/stateMiddleware');

// Aplicar middleware a todas las rutas
app.use(userStateMiddleware);

// Ruta protegida con autenticación
app.post('/api/protected', requireAuth, (req, res) => {
  // Tu lógica aquí
});

// Ruta con logging de actividad
app.post('/api/action', logUserActivity('create_user'), (req, res) => {
  // Tu lógica aquí
});
```

### Uso del StateManager en Controladores

```javascript
// En cualquier controlador
const someController = async (req, res) => {
  try {
    // Obtener StateManager
    const stateManager = req.app.get('stateManager');
    
    // Actualizar estado del usuario
    stateManager.setUserState(req.session.user._id, {
      currentPage: 'dashboard',
      lastAction: 'view_data',
      timestamp: new Date()
    });
    
    // Enviar notificación
    stateManager.sendGlobalNotification({
      type: 'info',
      message: 'Datos actualizados',
      userId: req.session.user._id
    });
    
    // Manejar flujo de trabajo
    stateManager.handleWorkflow({
      userId: req.session.user._id,
      workflowType: 'data_processing',
      step: 'completed',
      data: { processedItems: 100 }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno' });
  }
};
```

## 🎯 Casos de Uso

### 1. Registro de Usuario con Flujo

```javascript
app.post('/api/register', workflowStateMiddleware('user_registration'), async (req, res) => {
  try {
    // Paso 1: Validación
    res.setWorkflowStep('validation', { email: req.body.email });
    
    // Paso 2: Creación
    const user = await createUser(req.body);
    res.setWorkflowStep('creation', { userId: user._id });
    
    // Paso 3: Verificación
    res.setWorkflowStep('verification', { emailSent: true });
    
    // Notificar a administradores
    res.sendNotification(['admin1', 'admin2'], {
      type: 'new_user',
      message: `Nuevo usuario: ${user.name}`,
      userId: user._id
    });
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Dashboard en Tiempo Real

```javascript
app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    const stateManager = req.app.get('stateManager');
    
    // Obtener estadísticas en tiempo real
    const stats = stateManager.getStateStats();
    
    // Actualizar estado del usuario
    stateManager.setUserState(req.session.user._id, {
      currentPage: 'dashboard',
      lastVisit: new Date()
    });
    
    res.json({
      stats,
      userState: stateManager.getUserState(req.session.user._id)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🔒 Seguridad

### Configuración de Sesiones

```javascript
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "ministerio_educacion_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    httpOnly: true
  },
  name: 'ministerio_educacion_session'
});
```

### Variables de Entorno

```env
SESSION_SECRET=tu_clave_secreta_muy_segura
NODE_ENV=development
```

## 📊 Monitoreo

### Estadísticas Disponibles

```javascript
const stats = stateManager.getStateStats();
// Retorna:
{
  totalUsers: 5,
  totalStates: 6,
  globalState: { /* estado global */ },
  connectedUsers: [ /* usuarios conectados */ ]
}
```

### Logs Automáticos

- Conexiones/desconexiones de usuarios
- Cambios de estado
- Actividad de usuarios
- Errores del sistema

## 🚀 Inicio Rápido

1. **Instalar dependencias**:
   ```bash
   npm install socket.io
   ```

2. **Configurar variables de entorno**:
   ```env
   SESSION_SECRET=tu_clave_secreta
   ```

3. **Iniciar servidor**:
   ```bash
   npm start
   ```

4. **Conectar desde el cliente**:
   ```javascript
   const socket = io('http://localhost:9035');
   ```

## 🔄 Mantenimiento

### Limpieza Automática

El sistema limpia automáticamente estados antiguos cada hora:

```javascript
setInterval(() => {
  stateManager.cleanupOldStates();
}, 60 * 60 * 1000);
```

### Monitoreo de Rendimiento

- Estados por usuario: Máximo 1MB
- Tiempo de vida: 24 horas
- Limpieza automática: Cada hora
- Logs: Console y archivos

## 📝 Notas Importantes

1. **Sesiones**: Siempre usar `requireAuth` para rutas protegidas
2. **Estados**: Limpiar estados no utilizados
3. **Notificaciones**: Usar tipos específicos para mejor organización
4. **Flujos**: Documentar cada paso del flujo de trabajo
5. **Seguridad**: Cambiar `SESSION_SECRET` en producción

## 🆘 Solución de Problemas

### Problemas Comunes

1. **Socket no conecta**: Verificar CORS y puerto
2. **Estados no persisten**: Verificar configuración de sesiones
3. **Notificaciones no llegan**: Verificar que el usuario esté en la sala correcta
4. **Memoria alta**: Revisar limpieza automática de estados

### Debug

```javascript
// Habilitar logs detallados
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  stateManager.on('stateChanged', (data) => {
    console.log('Estado cambiado:', data);
  });
}
``` 