# Sistema de Estados de Usuario - Ministerio de Educación

## 📋 Descripción

Sistema de estados de presencia en tiempo real que permite a los usuarios mostrar su disponibilidad (activo, en break, ocupado, etc.) y ver el estado de otros usuarios en la aplicación.

## 🎯 Estados Disponibles

### Estados Predefinidos

| Estado | Color | Descripción |
|--------|-------|-------------|
| `online` | 🟢 Verde | En línea y disponible |
| `busy` | 🔴 Rojo | Ocupado, no molestar |
| `away` | 🟡 Amarillo | Ausente temporalmente |
| `break` | 🟠 Naranja | En descanso |
| `meeting` | 🟣 Púrpura | En reunión |
| `lunch` | 🟣 Rosa | Almorzando |
| `vacation` | 🔵 Azul | De vacaciones |
| `sick` | ⚫ Gris | Enfermo |

### Estado Personalizado
Los usuarios pueden escribir su propio estado personalizado (máximo 100 caracteres).

## 🏗️ Arquitectura

### Componentes Backend

1. **Modelo UserStatus** (`models/userStatus.js`)
   - Almacena estados de usuarios en MongoDB
   - Incluye timestamps y metadatos
   - Métodos para actualizar y consultar estados

2. **UserStatusService** (`services/userStatusService.js`)
   - Lógica de negocio para estados
   - Comunicación en tiempo real via Socket.IO
   - Gestión de colores y etiquetas

3. **Rutas API** (`routes/userStatus.routes.js`)
   - Endpoints REST para gestión de estados
   - Autenticación y autorización
   - Consultas y estadísticas

### Componentes Frontend

1. **UserStatusSelector** (`frontend/src/components/UserStatusSelector.vue`)
   - Componente Vue para mostrar y cambiar estados
   - Modal para selección de estado
   - Lista de usuarios activos en tiempo real

2. **Integración en Sidebar**
   - Componente integrado en la navegación lateral
   - Actualización automática de estados
   - Indicadores visuales de presencia

## 📡 API Endpoints

### Obtener Estado del Usuario
```http
GET /api/user-status/my-status
```

**Respuesta:**
```json
{
  "success": true,
  "status": {
    "status": "online",
    "customStatus": "Trabajando en reportes",
    "isActive": true,
    "lastSeen": "2024-01-15T10:30:00Z"
  }
}
```

### Cambiar Estado
```http
POST /api/user-status/change-status
Content-Type: application/json

{
  "status": "busy",
  "customStatus": "En reunión importante"
}
```

### Obtener Usuarios Activos
```http
GET /api/user-status/active-users
```

### Obtener Usuarios por Estado
```http
GET /api/user-status/users-by-status/online
```

### Obtener Estadísticas
```http
GET /api/user-status/stats
```

### Estados Disponibles
```http
GET /api/user-status/available-statuses
```

## 🔌 Eventos Socket.IO

### Cliente → Servidor

```javascript
// Cambiar estado
socket.emit('change_status', {
  status: 'busy',
  customStatus: 'En reunión'
});

// Solicitar usuarios activos
socket.emit('get_active_users');

// Solicitar estadísticas
socket.emit('get_status_stats');

// Actualizar actividad
socket.emit('update_activity');
```

### Servidor → Cliente

```javascript
// Cambio de estado de cualquier usuario
socket.on('user_status_changed', (data) => {
  console.log(`${data.userName} cambió a: ${data.status}`);
});

// Cambio del propio estado
socket.on('own_status_changed', (data) => {
  console.log('Tu estado cambió a:', data.status);
});

// Lista de usuarios activos
socket.on('active_users_list', (users) => {
  console.log('Usuarios activos:', users);
});

// Estadísticas de estados
socket.on('status_stats', (stats) => {
  console.log('Estadísticas:', stats);
});
```

## 🎨 Uso del Componente Vue

### Importar y Usar

```vue
<template>
  <div>
    <UserStatusSelector />
  </div>
</template>

<script>
import UserStatusSelector from '@/components/UserStatusSelector.vue';

export default {
  components: {
    UserStatusSelector
  }
};
</script>
```

### Integración en Sidebar

El componente ya está integrado en la sidebar del sistema. Se muestra en la parte inferior de la navegación lateral.

## 🔧 Configuración

### Variables de Entorno

```env
# Configuración de sesiones (ya configurado en app.js)
SESSION_SECRET=tu_clave_secreta
NODE_ENV=development
```

### Base de Datos

El sistema crea automáticamente la colección `userStatus` en MongoDB con los siguientes índices:

- `userId`: Índice único para búsquedas por usuario
- `status`: Índice para filtrar por estado
- `isActive`: Índice para usuarios activos
- `lastSeen`: Índice para ordenamiento temporal

## 📊 Monitoreo y Estadísticas

### Estadísticas Disponibles

```javascript
{
  byStatus: [
    { _id: 'online', count: 5 },
    { _id: 'busy', count: 2 },
    { _id: 'away', count: 1 }
  ],
  totalActive: 8,
  totalUsers: 10,
  statusColors: { /* colores por estado */ },
  statusLabels: { /* etiquetas por estado */ }
}
```

### Logs Automáticos

- Conexiones/desconexiones de usuarios
- Cambios de estado
- Actividad de usuarios
- Errores del sistema

## 🚀 Casos de Uso

### 1. Usuario Inicia Sesión
```javascript
// Automáticamente se establece como 'online'
await userStatusService.initializeUserStatus(userId, sessionId, ipAddress);
```

### 2. Usuario Cambia Estado
```javascript
// Cambiar a ocupado
await userStatusService.changeUserStatus(userId, 'busy', 'En reunión');

// Cambiar a descanso
await userStatusService.changeUserStatus(userId, 'break');
```

### 3. Usuario Se Desconecta
```javascript
// Automáticamente se marca como 'offline'
await userStatusService.disconnectUser(userId);
```

### 4. Monitoreo de Actividad
```javascript
// Actualizar actividad cada 30 segundos
setInterval(() => {
  socket.emit('update_activity');
}, 30000);
```

## 🔄 Mantenimiento

### Limpieza Automática

El sistema limpia automáticamente estados antiguos:

```javascript
// Limpiar usuarios offline por más de 24 horas
await userStatusService.cleanupOldStatuses();
```

### Monitoreo de Rendimiento

- Estados por usuario: Máximo 1KB
- Tiempo de vida: 24 horas
- Limpieza automática: Cada hora
- Actualización de actividad: Cada 30 segundos

## 🎯 Características Avanzadas

### Estados Personalizados
Los usuarios pueden escribir estados personalizados como:
- "Trabajando en reporte mensual"
- "En llamada con cliente"
- "Revisando documentación"

### Indicadores Visuales
- Puntos de color según el estado
- Tiempo de última actividad
- Lista de usuarios activos en tiempo real

### Notificaciones
- Cambios de estado en tiempo real
- Usuarios que se conectan/desconectan
- Actividad del equipo

## 🆘 Solución de Problemas

### Problemas Comunes

1. **Estado no se actualiza**
   - Verificar conexión Socket.IO
   - Revisar logs del servidor
   - Comprobar autenticación

2. **Usuarios no aparecen en lista**
   - Verificar que estén autenticados
   - Comprobar que tengan estado inicializado
   - Revisar permisos de base de datos

3. **Socket.IO no conecta**
   - Verificar URL del servidor
   - Comprobar CORS
   - Revisar puerto del servidor

### Debug

```javascript
// Habilitar logs detallados
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  userStatusService.on('statusChanged', (data) => {
    console.log('Estado cambiado:', data);
  });
}
```

## 📝 Notas Importantes

1. **Autenticación**: Todos los endpoints requieren autenticación
2. **Tiempo Real**: Los cambios se reflejan inmediatamente
3. **Persistencia**: Los estados se guardan en MongoDB
4. **Limpieza**: Estados antiguos se limpian automáticamente
5. **Escalabilidad**: Sistema preparado para múltiples usuarios

## 🎉 ¡Sistema Listo!

El sistema de estados de usuario está completamente implementado y listo para usar. Los usuarios pueden:

- ✅ Ver su estado actual
- ✅ Cambiar entre estados predefinidos
- ✅ Escribir estados personalizados
- ✅ Ver otros usuarios activos
- ✅ Recibir actualizaciones en tiempo real
- ✅ Monitorear actividad del equipo 