# Sistema MQTT Centralizado - Frontend

## Descripción General

El sistema MQTT ha sido completamente refactorizado para centralizar toda la configuración y gestión de conexiones MQTT en el frontend. Esto elimina la duplicación de código y proporciona una gestión unificada de todas las comunicaciones en tiempo real.

## Arquitectura

### 1. Configuración Centralizada (`mqttConfig.js`)

Toda la configuración MQTT se centraliza en un solo archivo:

```javascript
import { MQTT_CONFIG, MQTT_UTILS, getMQTTConfig } from '@/services/mqttConfig'
```

#### Configuración por Entorno
- **Development**: `ws://localhost:9001`
- **Staging**: `wss://staging-mqtt.yourdomain.com:9001`
- **Production**: `wss://mqtt.yourdomain.com:9001`

#### Topics Organizados por Categoría
- **Status**: Estados de usuario
- **Notifications**: Notificaciones del sistema
- **System**: Eventos del sistema
- **User**: Comunicación específica por usuario
- **Telephony**: Llamadas y telefonía
- **Chat**: Mensajería y chat

### 2. Servicio MQTT Unificado (`mqttService.js`)

Un solo servicio que maneja todas las conexiones MQTT:

```javascript
import { mqttService } from '@/services/mqttService'
```

## Uso del Sistema

### 1. Conexión Inicial (Dashboard)

La conexión MQTT se establece una sola vez en el Dashboard:

```javascript
// En Dashboard.vue
import { mqttService } from '@/services/mqttService'

async mounted() {
  // ... código de autenticación ...
  
  // Conectar MQTT globalmente
  await mqttService.connect(null, syncResult.user.id, syncResult.user.name);
  
  // Configurar callbacks del sistema
  mqttService.onSystemEvent('onConnect', () => {
    console.log('🎉 MQTT conectado exitosamente');
  });
}
```

### 2. Uso en Componentes

Los componentes solo necesitan suscribirse a los eventos que necesitan:

```javascript
// En cualquier componente
import { mqttService } from '@/services/mqttService'

mounted() {
  // Suscribirse a cambios de estado
  mqttService.onStatusChange((data) => {
    console.log('Estado cambiado:', data);
  });
  
  // Suscribirse a usuarios activos
  mqttService.onActiveUsersUpdate((data) => {
    console.log('Usuarios activos:', data);
  });
  
  // Suscribirse a conexiones de usuario
  mqttService.onUserConnected((data) => {
    console.log('Usuario conectado:', data);
  });
  
  // Suscribirse a desconexiones
  mqttService.onUserDisconnected((data) => {
    console.log('Usuario desconectado:', data);
  });
}
```

### 3. Métodos Disponibles

#### Métodos de Conexión
- `connect(brokerUrl, userId, userName)`: Conectar al broker
- `disconnect()`: Desconectar completamente
- `getConnectionInfo()`: Obtener información de conexión
- `getStats()`: Obtener estadísticas

#### Métodos de Suscripción
- `onStatusChange(callback)`: Cambios de estado
- `onActiveUsersUpdate(callback)`: Lista de usuarios activos
- `onUserConnected(callback)`: Usuarios conectados
- `onUserDisconnected(callback)`: Usuarios desconectados
- `onNotification(callback)`: Notificaciones
- `onSystemEvent(callback)`: Eventos del sistema

#### Métodos de Publicación
- `publish(topic, data)`: Publicar mensaje
- `on(topic, callback, category)`: Suscribirse a topic específico
- `off(topic, callback, category)`: Remover listener

#### Métodos de Gestión
- `clearListeners(category)`: Limpiar listeners por categoría
- `onSystemEvent(event, callback)`: Configurar callbacks del sistema

## Ventajas del Sistema Centralizado

### 1. Eliminación de Duplicación
- Una sola conexión MQTT para toda la aplicación
- Configuración centralizada
- Gestión unificada de listeners

### 2. Mejor Gestión de Recursos
- Conexión persistente durante toda la sesión
- Reconexión automática
- Limpieza automática de listeners

### 3. Configuración Flexible
- Configuración por entorno
- Topics organizados por categoría
- QoS configurable por tipo de mensaje

### 4. Debugging Mejorado
- Logging centralizado
- Estadísticas de conexión
- Información detallada de estado

## Migración desde el Sistema Anterior

### Cambios en Importaciones
```javascript
// Antes
import { mqttSingleton } from '@/services/mqttService'

// Ahora
import { mqttService } from '@/services/mqttService'
```

### Cambios en Métodos
```javascript
// Antes
mqttSingleton.on(mqttSingleton.topics.statusChanged, callback)

// Ahora
mqttService.onStatusChange(callback)
```

### Cambios en Conexión
```javascript
// Antes
await mqttSingleton.connect('ws://localhost:9001', userId)

// Ahora
await mqttService.connect(null, userId, userName)
```

## Configuración Avanzada

### Variables de Entorno
```bash
# .env
VUE_APP_MQTT_BROKER_URL=ws://localhost:9001
VUE_APP_MQTT_USE_TLS=false
VUE_APP_MQTT_LOG_LEVEL=debug
```

### Configuración Personalizada
```javascript
import { getMQTTConfig } from '@/services/mqttConfig'

const customConfig = getMQTTConfig('production');
customConfig.broker.url = 'wss://custom-mqtt.com:9001';
```

## Troubleshooting

### Problemas Comunes

1. **Conexión Fallida**
   - Verificar que el broker esté ejecutándose
   - Verificar la URL del broker en la configuración
   - Verificar credenciales si se requieren

2. **Listeners No Funcionan**
   - Verificar que la conexión esté establecida
   - Verificar que el topic sea correcto
   - Verificar que el callback esté registrado

3. **Mensajes No Llegan**
   - Verificar QoS del topic
   - Verificar que el topic esté suscrito
   - Verificar logs del broker

### Debugging
```javascript
// Obtener información de conexión
console.log(mqttService.getConnectionInfo());

// Obtener estadísticas
console.log(mqttService.getStats());

// Verificar estado de conexión
console.log('Conectado:', mqttService.isConnected);
```

## Mejores Prácticas

1. **Conexión Única**: Conectar MQTT solo una vez en el Dashboard
2. **Limpieza de Listeners**: Remover listeners en `beforeUnmount`
3. **Manejo de Errores**: Siempre manejar errores de conexión
4. **Logging**: Usar logging para debugging
5. **Configuración**: Usar variables de entorno para configuración

## Ejemplos Completos

### Componente con MQTT
```vue
<template>
  <div>
    <div v-if="mqttConnected" class="badge bg-success">
      MQTT Conectado
    </div>
    <div v-else class="badge bg-warning">
      MQTT Desconectado
    </div>
  </div>
</template>

<script>
import { mqttService } from '@/services/mqttService'

export default {
  data() {
    return {
      mqttConnected: false,
      users: []
    }
  },
  
  mounted() {
    // Verificar conexión
    this.mqttConnected = mqttService.isConnected;
    
    // Suscribirse a eventos
    mqttService.onStatusChange(this.handleStatusChange);
    mqttService.onActiveUsersUpdate(this.handleActiveUsers);
    
    // Configurar callback de conexión
    mqttService.onSystemEvent('onConnect', () => {
      this.mqttConnected = true;
    });
    
    mqttService.onSystemEvent('onDisconnect', () => {
      this.mqttConnected = false;
    });
  },
  
  beforeUnmount() {
    // Limpiar listeners
    mqttService.off('telefonia/users/status/changed', this.handleStatusChange, 'status');
    mqttService.off('telefonia/users/active/list', this.handleActiveUsers, 'status');
  },
  
  methods: {
    handleStatusChange(data) {
      console.log('Estado cambiado:', data);
    },
    
    handleActiveUsers(data) {
      this.users = data.users;
    }
  }
}
</script>
```

Este sistema centralizado proporciona una base sólida y escalable para todas las comunicaciones MQTT en el frontend. 