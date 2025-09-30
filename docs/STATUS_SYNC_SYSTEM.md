# Sistema de Sincronización de Estados y Heartbeat

## 📋 Resumen Ejecutivo

El sistema implementa una comunicación constante entre frontend y backend para mantener sincronizados los estados de usuario en tiempo real, utilizando WebSocket y mecanismos de heartbeat para garantizar la consistencia de datos.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **Frontend (Vue.js)**
   - `StatusSyncService` - Servicio de sincronización continua
   - `UserStatusConfigurator` - Componente de configuración de estados
   - `UserStatusSelector` - Componente de selección de estados
   - `StatusSyncMonitor` - Monitor visual de sincronización

2. **Backend (Node.js + Socket.IO)**
   - Endpoints REST para gestión de estados
   - Eventos WebSocket para sincronización en tiempo real
   - Sistema de heartbeat para mantener conexiones activas

3. **Base de Datos (MongoDB)**
   - Modelo `UserStatus` - Estados actuales de usuarios
   - Modelo `StatusType` - Tipos de estados disponibles

## 🔄 Flujo de Sincronización

### 1. Inicialización del Sistema

```javascript
// Frontend - Dashboard.vue
async mounted() {
  // 1. Sincronizar sesión
  const syncResult = await sessionSync.syncSession();
  
  // 2. Conectar WebSocket
  await websocketService.connect(syncResult.user);
  
  // 3. Inicializar sincronización continua
  await statusSyncService.initialize();
}
```

### 2. Sincronización Continua

```javascript
// Frontend - statusSync.js
class StatusSyncService {
  async initialize() {
    // Iniciar heartbeat cada 30 segundos
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000);
    
    // Sincronización periódica cada 60 segundos
    this.syncInterval = setInterval(() => {
      this.syncStatus();
    }, 60000);
  }
}
```

### 3. Mecanismo de Heartbeat

#### Frontend → Backend
```javascript
// Enviar heartbeat cada 30 segundos
async sendHeartbeat() {
  try {
    await axios.post('/user-status/heartbeat', {
      timestamp: new Date().toISOString(),
      status: this.currentStatus
    });
    
    // También enviar por WebSocket
    if (websocketService.isConnected) {
      websocketService.socket.emit('heartbeat', {
        timestamp: new Date().toISOString(),
        status: this.currentStatus
      });
    }
  } catch (error) {
    console.error('Error enviando heartbeat:', error);
  }
}
```

#### Backend → Frontend
```javascript
// app.js - Manejo de heartbeat
socket.on('heartbeat', async (data) => {
  try {
    // Actualizar último heartbeat del usuario
    await UserStatus.findOneAndUpdate(
      { userId: socket.userId },
      { 
        lastHeartbeat: new Date(),
        status: data.status || 'available'
      },
      { upsert: true }
    );
    
    // Responder con confirmación
    socket.emit('heartbeat_ack', { 
      success: true, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error procesando heartbeat:', error);
  }
});
```

## 🛡️ Mecanismo de Cooldown

### Problema Resuelto
Los cambios manuales de estado del usuario eran sobrescritos por la sincronización automática.

### Solución Implementada
```javascript
class StatusSyncService {
  constructor() {
    this.lastManualChange = null;
    this.cooldownPeriod = 5000; // 5 segundos
  }
  
  // Marcar cambio manual
  onManualStatusChange(status) {
    this.lastManualChange = new Date();
    this.currentStatus = status;
    
    // Actualizar inmediatamente en el store
    this.$store.commit('setUserStatus', {
      status: status,
      lastActivity: new Date().toISOString()
    });
  }
  
  // Verificar si está en cooldown
  isInCooldown() {
    if (!this.lastManualChange) return false;
    
    const timeSinceChange = Date.now() - this.lastManualChange.getTime();
    return timeSinceChange < this.cooldownPeriod;
  }
  
  // Sincronización con cooldown
  async syncStatus() {
    if (this.isInCooldown()) {
      console.log('⏳ En cooldown, saltando sincronización...');
      return;
    }
    
    // Continuar con sincronización normal
    await this.sendStatusToBackend(this.currentStatus);
  }
}
```

## 📡 Eventos WebSocket

### Eventos del Cliente (Frontend → Backend)

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `change_status` | Cambiar estado del usuario | `{ status, customStatus }` |
| `heartbeat` | Heartbeat periódico | `{ timestamp, status }` |
| `activity_update` | Actualizar actividad | `{ activity, timestamp }` |

### Eventos del Servidor (Backend → Frontend)

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `status_updated` | Estado actualizado | `{ userId, status, timestamp }` |
| `heartbeat_ack` | Confirmación de heartbeat | `{ success, timestamp }` |
| `user_connected` | Usuario conectado | `{ userId, status }` |
| `user_disconnected` | Usuario desconectado | `{ userId }` |

## 🗄️ Modelos de Base de Datos

### UserStatus Model
```javascript
const userStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    required: true,
    default: 'available'
  },
  customStatus: String,
  lastActivity: {
    type: Date,
    default: Date.now
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: true
  }
});
```

### StatusType Model
```javascript
const statusTypeSchema = new mongoose.Schema({
  value: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  color: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['work', 'break', 'out'],
    required: true 
  },
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  description: String,
  icon: { type: String, default: 'fas fa-circle' }
});
```

## 🔧 Endpoints REST

### Gestión de Estados
- `GET /user-status/my-status` - Obtener estado actual del usuario
- `POST /user-status/change-status` - Cambiar estado del usuario
- `GET /user-status/all-users` - Obtener estados de todos los usuarios

### Heartbeat y Actividad
- `POST /user-status/heartbeat` - Enviar heartbeat
- `POST /user-status/activity` - Actualizar actividad del usuario
- `POST /user-status/sync` - Sincronizar estado

### Tipos de Estado
- `GET /status-types` - Obtener todos los tipos de estado
- `GET /status-types/categories` - Obtener categorías
- `GET /status-types/default` - Obtener estado por defecto
- `GET /status-types/validate` - Validar sincronización de estados

## 🎯 Estados Disponibles

### Categoría: Trabajo (Sí se puede asignar trabajo)
- `available` - Disponible (estado por defecto)
- `busy` - Ocupado
- `on_call` - En llamada
- `focus` - Enfoque

### Categoría: Descanso (No se debe asignar trabajo)
- `break` - Descanso
- `lunch` - Almuerzo
- `meeting` - En reunión
- `training` - En capacitación
- `do_not_disturb` - No molestar

### Categoría: Fuera (Conectado pero no trabajando)
- `away` - Ausente
- `out_of_office` - Fuera de oficina
- `offline` - Desconectado

## 🔍 Sistema de Validación

### Componente StatusValidation
- Valida sincronización entre frontend y backend
- Detecta estados faltantes o extra
- Muestra diferencias en labels/categorías
- Validación automática al cargar

### Script de Inicialización
```bash
node scripts/initializeStatusTypes.js
```
- Inicializa estados en la base de datos
- Verifica estados faltantes
- Configura estado por defecto

## ⚡ Configuración de Tiempos

| Operación | Intervalo | Descripción |
|-----------|-----------|-------------|
| Heartbeat | 30 segundos | Mantener conexión activa |
| Sincronización | 60 segundos | Sincronizar estado con backend |
| Cooldown | 5 segundos | Evitar sobrescritura de cambios manuales |
| Timeout WebSocket | 10 segundos | Detectar desconexiones |

## 🚨 Manejo de Errores

### Reconexión Automática
```javascript
// WebSocket reconexión automática
websocketService.socket.on('disconnect', () => {
  console.log('WebSocket desconectado, intentando reconectar...');
  setTimeout(() => {
    websocketService.connect();
  }, 3000);
});
```

### Fallback a API REST
```javascript
// Si WebSocket falla, usar API REST
if (!websocketService.isConnected) {
  console.log('WebSocket no disponible, usando API REST');
  await axios.post('/user-status/change-status', { status });
}
```

### Estados de Fallback
```javascript
// Estados de respaldo si no se pueden cargar del servidor
const fallbackStatuses = [
  { value: 'available', label: 'Disponible', color: '#00d25b' },
  { value: 'busy', label: 'Ocupado', color: '#2196f3' },
  // ... más estados
];
```

## 📊 Monitoreo y Logs

### Logs del Frontend
- `🔄` - Operaciones en progreso
- `✅` - Operaciones exitosas
- `❌` - Errores
- `⚠️` - Advertencias
- `⏳` - Operaciones en espera

### Logs del Backend
- `🔍` - Validaciones
- `📡` - Eventos WebSocket
- `💓` - Heartbeats
- `👤` - Operaciones de usuario

## 🔄 Flujo Completo de un Cambio de Estado

1. **Usuario cambia estado** en el frontend
2. **Se marca cambio manual** y se activa cooldown
3. **Se actualiza store** inmediatamente
4. **Se envía por WebSocket** (si está conectado)
5. **Se envía por API REST** como respaldo
6. **Backend actualiza BD** y notifica a otros usuarios
7. **Se confirma cambio** al frontend
8. **Cooldown previene** sobrescritura por sincronización automática

## 🎯 Beneficios del Sistema

- ✅ **Sincronización en tiempo real** entre frontend y backend
- ✅ **Prevención de pérdida de datos** por desconexiones
- ✅ **Respeto a cambios manuales** del usuario
- ✅ **Fallback robusto** con múltiples mecanismos
- ✅ **Monitoreo visual** del estado de sincronización
- ✅ **Validación automática** de integridad de datos

## 🔮 Consideraciones Futuras

- Implementar persistencia de estados en localStorage
- Agregar notificaciones push para cambios de estado
- Implementar historial de cambios de estado
- Agregar métricas de uso y performance
- Implementar estados personalizados por organización 