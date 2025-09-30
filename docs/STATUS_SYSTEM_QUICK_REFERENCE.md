# Referencia Rápida - Sistema de Estados

## 🚨 CRÍTICO: Mecanismo de Cooldown

**Problema Original**: Usuario cambiaba estado manualmente → App lo sobrescribía automáticamente.

**Solución**: Cooldown de 5 segundos después de cambio manual.

```javascript
// StatusSyncService - NO MODIFICAR SIN CONSIDERAR
this.cooldownPeriod = 5000; // 5 segundos críticos
```

## 📁 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `frontend/src/services/statusSync.js` | Sincronización continua + cooldown |
| `frontend/src/components/UserStatusConfigurator.vue` | UI cambio de estados |
| `frontend/src/components/StatusSyncMonitor.vue` | Monitor visual |
| `frontend/src/components/StatusValidation.vue` | Validación estados |
| `models/statusType.js` | Definición estados backend |
| `routes/statusType.routes.js` | Endpoints estados |
| `scripts/initializeStatusTypes.js` | Inicializar BD |

## 🔄 Flujo de Cambio de Estado

1. **Usuario cambia estado** → `UserStatusConfigurator`
2. **Se marca cambio manual** → `StatusSyncService.onManualStatusChange()`
3. **Se activa cooldown** → 5 segundos de protección
4. **Se actualiza store** → Inmediatamente
5. **Se envía al backend** → WebSocket + API REST
6. **Cooldown previene** → Sincronización automática

## ⏰ Tiempos Importantes

- **Heartbeat**: 30 segundos
- **Sincronización**: 60 segundos  
- **Cooldown**: 5 segundos ⚠️ CRÍTICO
- **Timeout WS**: 10 segundos

## 🗄️ Estados (12 total)

### Trabajo (4)
- `available` - Disponible (DEFAULT)
- `busy` - Ocupado
- `on_call` - En llamada
- `focus` - Enfoque

### Descanso (5)
- `break` - Descanso
- `lunch` - Almuerzo
- `meeting` - En reunión
- `training` - En capacitación
- `do_not_disturb` - No molestar

### Fuera (3)
- `away` - Ausente
- `out_of_office` - Fuera de oficina
- `offline` - Desconectado

## 🔧 Comandos Útiles

```bash
# Inicializar estados en BD
node scripts/initializeStatusTypes.js

# Validar sincronización
# Ir a Dashboard → Componente StatusValidation
```

## ⚠️ Problemas Comunes

| Problema | Síntoma | Solución |
|----------|---------|----------|
| Estados faltantes | Frontend muestra menos estados | `node scripts/initializeStatusTypes.js` |
| Cambios se revierten | Cooldown no funciona | Verificar `cooldownPeriod = 5000` |
| No sincroniza | WebSocket desconectado | Sistema tiene fallback automático |
| Solo fallback | No carga desde `/status-types` | Verificar endpoint |

## 🎯 NO MODIFICAR SIN CONSIDERAR

- **Tiempo de cooldown** (5 segundos)
- **Estado por defecto** (`available`)
- **Mecanismo de cooldown** en `StatusSyncService`
- **Flujo de sincronización** básico

## 📡 Eventos WebSocket

### Cliente → Servidor
- `change_status` - Cambio manual
- `heartbeat` - Cada 30s
- `activity_update` - Actividad

### Servidor → Cliente  
- `status_updated` - Confirmación
- `heartbeat_ack` - Confirmación heartbeat
- `user_connected/disconnected` - Conexión

## 🔍 Validación

- **Componente**: `StatusValidation.vue`
- **Endpoint**: `/status-types/validate`
- **Ubicación**: Dashboard (automático)

---

**Objetivo**: Sincronización constante respetando cambios manuales del usuario. 