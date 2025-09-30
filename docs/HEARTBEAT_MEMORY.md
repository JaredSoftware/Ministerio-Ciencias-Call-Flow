# Memoria del Sistema de Heartbeat y Estados

## 🧠 Contexto Importante para Futuras Interacciones

### Problema Original del Usuario
El usuario reportó que cuando cambiaba manualmente su estado, la aplicación lo volvía a cambiar automáticamente, sobrescribiendo su selección. Esto causaba frustración porque el sistema de sincronización no respetaba los cambios manuales del usuario.

### Solución Implementada
Se implementó un sistema de **cooldown** que previene la sincronización automática durante 5 segundos después de un cambio manual del usuario.

## 🔧 Componentes Clave del Sistema

### 1. StatusSyncService (frontend/src/services/statusSync.js)
- **Responsabilidad**: Sincronización continua entre frontend y backend
- **Funcionalidades**:
  - Heartbeat cada 30 segundos
  - Sincronización cada 60 segundos
  - Cooldown de 5 segundos para cambios manuales
  - Fallback a API REST si WebSocket falla

### 2. UserStatusConfigurator (frontend/src/components/UserStatusConfigurator.vue)
- **Responsabilidad**: Interfaz para cambiar estados
- **Características**:
  - Estados dinámicos cargados desde el backend
  - Estados de fallback si no se pueden cargar
  - Actualización inmediata del store al cambiar estado
  - Integración con StatusSyncService

### 3. StatusSyncMonitor (frontend/src/components/StatusSyncMonitor.vue)
- **Responsabilidad**: Monitor visual del estado de sincronización
- **Indicadores**:
  - Estado de conexión WebSocket
  - Estado de sincronización
  - Último heartbeat
  - Estado de cooldown

## 🛡️ Mecanismo de Cooldown - CRÍTICO

### Código Clave
```javascript
// En StatusSyncService
constructor() {
  this.lastManualChange = null;
  this.cooldownPeriod = 5000; // 5 segundos
}

onManualStatusChange(status) {
  this.lastManualChange = new Date();
  this.currentStatus = status;
  
  // Actualizar store inmediatamente
  this.$store.commit('setUserStatus', {
    status: status,
    lastActivity: new Date().toISOString()
  });
}

isInCooldown() {
  if (!this.lastManualChange) return false;
  const timeSinceChange = Date.now() - this.lastManualChange.getTime();
  return timeSinceChange < this.cooldownPeriod;
}

async syncStatus() {
  if (this.isInCooldown()) {
    console.log('⏳ En cooldown, saltando sincronización...');
    return;
  }
  // Continuar sincronización normal
}
```

### Por Qué Es Importante
- **Previene sobrescritura** de cambios manuales
- **Mejora UX** al respetar la intención del usuario
- **Mantiene sincronización** después del período de cooldown

## 📡 Eventos WebSocket Clave

### Frontend → Backend
- `change_status`: Cambio manual de estado
- `heartbeat`: Latido cada 30 segundos
- `activity_update`: Actualización de actividad

### Backend → Frontend
- `status_updated`: Confirmación de cambio de estado
- `heartbeat_ack`: Confirmación de heartbeat
- `user_connected/disconnected`: Cambios de conexión

## 🗄️ Estados Disponibles

### Trabajo (4 estados)
- `available` - Disponible (DEFAULT)
- `busy` - Ocupado
- `on_call` - En llamada
- `focus` - Enfoque

### Descanso (5 estados)
- `break` - Descanso
- `lunch` - Almuerzo
- `meeting` - En reunión
- `training` - En capacitación
- `do_not_disturb` - No molestar

### Fuera (3 estados)
- `away` - Ausente
- `out_of_office` - Fuera de oficina
- `offline` - Desconectado

## 🔍 Sistema de Validación

### Componente StatusValidation
- Valida sincronización entre frontend y backend
- Detecta estados faltantes
- Muestra diferencias en configuración

### Endpoint /status-types/validate
- Compara estados esperados vs actuales
- Reporta estados faltantes/extra
- Valida configuración de categorías

## ⚠️ Problemas Comunes y Soluciones

### 1. Estados Faltantes
**Síntoma**: Frontend muestra menos estados que el backend
**Solución**: Ejecutar `node scripts/initializeStatusTypes.js`

### 2. Sincronización Sobrescribiendo Cambios
**Síntoma**: Cambios manuales se revierten automáticamente
**Solución**: Verificar que el cooldown esté funcionando (5 segundos)

### 3. WebSocket Desconectado
**Síntoma**: Estados no se sincronizan en tiempo real
**Solución**: Sistema tiene fallback a API REST automático

### 4. Estados No Se Cargaron
**Síntoma**: Solo se ven estados de fallback
**Solución**: Verificar conexión a `/status-types` endpoint

## 🎯 Configuraciones Importantes

### Tiempos de Sincronización
- **Heartbeat**: 30 segundos
- **Sincronización**: 60 segundos
- **Cooldown**: 5 segundos
- **Timeout WebSocket**: 10 segundos

### Estado Por Defecto
- **Valor**: `available`
- **Label**: `Disponible`
- **Color**: `#00d25b`
- **Categoría**: `work`

## 🔄 Flujo de Inicialización

1. **Dashboard mounted** → Sincronizar sesión
2. **Sesión exitosa** → Conectar WebSocket
3. **WebSocket conectado** → Inicializar StatusSyncService
4. **StatusSyncService** → Iniciar heartbeat y sincronización
5. **Cargar estados** → Desde `/status-types` o fallback

## 📊 Logs Importantes

### Frontend
- `🔄` - Operaciones en progreso
- `✅` - Operaciones exitosas
- `❌` - Errores
- `⏳` - En cooldown

### Backend
- `💓` - Heartbeats recibidos
- `📡` - Eventos WebSocket
- `👤` - Cambios de estado de usuario

## 🚨 Consideraciones para Futuras Modificaciones

### NO Modificar Sin Considerar
- **Tiempo de cooldown** (5 segundos) - Afecta UX
- **Intervalo de heartbeat** (30 segundos) - Afecta conexión
- **Estado por defecto** (`available`) - Afecta experiencia inicial

### Modificaciones Seguras
- Agregar nuevos estados (solo en backend)
- Cambiar colores o labels
- Modificar intervalos de sincronización
- Agregar nuevos eventos WebSocket

### Requiere Testing
- Cambios en el mecanismo de cooldown
- Modificaciones en el flujo de sincronización
- Cambios en el estado por defecto
- Nuevas categorías de estados

## 🎯 Objetivo del Sistema

**Mantener sincronización constante entre frontend y backend respetando siempre la intención del usuario, especialmente sus cambios manuales de estado.**

---

*Esta memoria debe ser consultada antes de hacer modificaciones al sistema de estados para evitar romper la funcionalidad crítica del cooldown y la sincronización.* 