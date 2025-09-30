# 📊 Sistema CRM con Arquitectura Pub/Sub MQTT

## 📋 Índice
- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Topics MQTT](#topics-mqtt)
- [Componentes](#componentes)
- [Flujos de Datos](#flujos-de-datos)
- [Guía de Uso](#guía-de-uso)
- [Código de Ejemplo](#código-de-ejemplo)

---

## 📖 Descripción General

Sistema completo de CRM (Customer Relationship Management) implementado con arquitectura **Pub/Sub usando MQTT** para búsqueda, visualización y edición de clientes. **NO usa HTTP**, toda la comunicación es por MQTT para máxima eficiencia y escalabilidad.

### ✨ Características Principales

- 🔍 **Búsqueda de Clientes**: Por cédula o rango de fechas
- 👤 **Vista Detallada**: Información completa del cliente organizada por secciones
- ✏️ **Edición de Datos**: Formulario completo para actualizar información
- 📞 **Historial de Interacciones**: Todas las tipificaciones y llamadas del cliente
- 📡 **100% Pub/Sub**: Comunicación asíncrona sin bloqueos
- 📊 **Paginación**: Manejo eficiente de grandes volúmenes de datos
- 📤 **Exportación CSV**: Descarga de resultados

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA PUB/SUB                     │
└─────────────────────────────────────────────────────────────┘

Frontend (Vue.js)                    Backend (Node.js + MongoDB)
     │                                        │
     │  PUBLISH                               │
     ├──► crm/clientes/buscar/cedula/{userId}─┤
     │                                        │
     │                                   [Busca en BD]
     │                                        │
     │                               PUBLISH  │
     │  ◄─── crm/clientes/resultado/{userId}─┤
     │  SUBSCRIBE                             │
     │                                        │
     │  [Muestra resultados en tabla]         │
     │                                        │
     │  [Usuario hace clic en "Ver Detalles"] │
     │                                        │
     │  [Abre Modal CRM con 3 tabs]           │
     │   - Información                        │
     │   - Editar                             │
     │   - Historial                          │
     │                                        │
     │  [Usuario edita y guarda]              │
     │                                        │
     │  PUBLISH                               │
     ├──► crm/clientes/actualizar/{userId}──►│
     │                                        │
     │                               [Actualiza BD]
     │                                        │
     │                               PUBLISH  │
     │  ◄─── crm/clientes/actualizado/{userId}┤
     │  SUBSCRIBE                             │
     │                                        │
     │  [Actualiza lista local]               │
     └────────────────────────────────────────┘
```

---

## 📡 Topics MQTT

### 🔍 Búsqueda de Clientes

#### 1. Búsqueda por Cédula

**Topic Request:**
```
crm/clientes/buscar/cedula/{userId}
```

**Payload:**
```json
{
  "cedula": "1234567890",
  "timestamp": "2025-09-30T12:00:00.000Z"
}
```

**Topic Response:**
```
crm/clientes/resultado/{userId}
```

**Payload:**
```json
{
  "success": true,
  "tipoBusqueda": "cedula",
  "clientes": [{
    "_id": "...",
    "cedula": "1234567890",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "telefono": "3001234567",
    "correo": "juan@email.com",
    "totalInteracciones": 5,
    "fechaUltimaInteraccion": "2025-09-30T10:00:00.000Z",
    "interacciones": [...]
  }],
  "count": 1,
  "timestamp": "2025-09-30T12:00:01.000Z"
}
```

#### 2. Búsqueda por Rango de Fechas (con paginación)

**Topic Request:**
```
crm/clientes/buscar/fechas/{userId}
```

**Payload:**
```json
{
  "fechaInicio": "2025-09-01",
  "fechaFin": "2025-09-30",
  "page": 1,
  "limit": 50,
  "timestamp": "2025-09-30T12:00:00.000Z"
}
```

**Topic Response:**
```
crm/clientes/resultado/{userId}
```

**Payload:**
```json
{
  "success": true,
  "tipoBusqueda": "fechas",
  "clientes": [...],
  "count": 50,
  "total": 150,
  "page": 1,
  "limit": 50,
  "hasMore": true,
  "timestamp": "2025-09-30T12:00:01.000Z"
}
```

### 🔄 Actualización de Clientes

**Topic Request:**
```
crm/clientes/actualizar/{userId}
```

**Payload:**
```json
{
  "cedula": "1234567890",
  "datosActualizados": {
    "nombres": "Juan Carlos",
    "apellidos": "Pérez Gómez",
    "telefono": "3001234567",
    "correo": "juancarlos@email.com",
    "pais": "Colombia",
    "departamento": "Cundinamarca",
    "ciudad": "Bogotá",
    "direccion": "Calle 123 #45-67",
    "sexo": "Masculino",
    "nivelEscolaridad": "Universitario (pregrado)",
    "grupoEtnico": "",
    "discapacidad": ""
  },
  "timestamp": "2025-09-30T12:00:00.000Z"
}
```

**Topic Response:**
```
crm/clientes/actualizado/{userId}
```

**Payload:**
```json
{
  "success": true,
  "cliente": {
    "_id": "...",
    "cedula": "1234567890",
    "nombres": "Juan Carlos",
    "apellidos": "Pérez Gómez",
    ...
  },
  "timestamp": "2025-09-30T12:00:01.000Z"
}
```

---

## 🧩 Componentes

### 1. **Reportes.vue** - Vista Principal de Búsqueda

**Ubicación:** `frontend/src/views/Reportes.vue`

**Responsabilidades:**
- Interfaz de búsqueda (por cédula o fechas)
- Tabla de resultados
- Integración con componente CRM
- Exportación a CSV
- Paginación

**Métodos Principales:**

```javascript
// Configurar MQTT al montar el componente
async setupMQTT() {
  const userId = this.$store.state.user?.id;
  this.mqttTopic = `crm/clientes/resultado/${userId}`;
  mqttService.on(this.mqttTopic, this.handleResultados);
}

// Buscar clientes por MQTT
async buscarClientes() {
  const userId = this.$store.state.user?.id;
  
  if (this.tipoBusqueda === 'cedula') {
    mqttService.publish(`crm/clientes/buscar/cedula/${userId}`, {
      cedula: this.cedulaBusqueda,
      timestamp: new Date().toISOString()
    });
  } else {
    mqttService.publish(`crm/clientes/buscar/fechas/${userId}`, {
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      page: this.currentPage,
      limit: 50,
      timestamp: new Date().toISOString()
    });
  }
}

// Manejar resultados MQTT
handleResultados(data) {
  if (data.tipoBusqueda === 'cedula') {
    this.clientes = data.clientes || [];
  } else {
    // Paginación: agregar resultados
    this.clientes = [...this.clientes, ...(data.clientes || [])];
    this.hasMore = data.hasMore;
    this.totalClientes = data.total;
  }
  this.loading = false;
  this.busquedaRealizada = true;
}

// Abrir modal CRM
verDetalles(cliente) {
  this.clienteSeleccionado = cliente;
}

// Actualizar cliente en lista
handleClienteActualizado(datosActualizados) {
  const index = this.clientes.findIndex(c => c.cedula === datosActualizados.cedula);
  if (index !== -1) {
    this.clientes[index] = { ...this.clientes[index], ...datosActualizados };
    this.clienteSeleccionado = this.clientes[index];
  }
}
```

---

### 2. **ClienteCRM.vue** - Modal CRM Completo

**Ubicación:** `frontend/src/components/ClienteCRM.vue`

**Responsabilidades:**
- Mostrar información del cliente en 3 tabs
- Permitir edición de todos los campos
- Mostrar historial de interacciones
- Publicar actualizaciones por MQTT

**Props:**
```javascript
props: {
  cliente: {
    type: Object,
    required: true
  }
}
```

**Events:**
```javascript
// Cerrar modal
this.$emit('cerrar');

// Cliente actualizado
this.$emit('cliente-actualizado', datosActualizados);
```

**Tabs:**

#### Tab 1: Información
- 📋 Información Básica (cédula, nombres, apellidos, sexo, fecha nacimiento)
- 📍 Ubicación y Contacto (país, departamento, ciudad, dirección, teléfono, correo)
- 📊 Información Demográfica (nivel escolaridad, grupo étnico, discapacidad)

#### Tab 2: Editar
- Formulario completo con todos los campos
- Validaciones
- Botones Cancelar/Guardar
- Estado de guardado

#### Tab 3: Historial
- Lista de todas las interacciones
- Detalles de cada tipificación
- Árbol de niveles
- Fechas y observaciones

**Métodos Principales:**

```javascript
// Guardar cambios por MQTT
async guardarCambios() {
  const userId = this.$store.state.user?.id;
  
  mqttService.publish(`crm/clientes/actualizar/${userId}`, {
    cedula: this.clienteEditado.cedula,
    datosActualizados: this.clienteEditado,
    timestamp: new Date().toISOString()
  });
  
  this.$emit('cliente-actualizado', this.clienteEditado);
  this.tabActiva = 'info';
}

// Cancelar edición
cancelarEdicion() {
  this.inicializarEdicion();
  this.tabActiva = 'info';
}

// Formatear fechas
formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-ES');
}

formatFechaHora(fecha) {
  return new Date(fecha).toLocaleString('es-ES');
}
```

---

### 3. **Backend MQTT Listeners** - app.js

**Ubicación:** `app.js` (líneas 705-866)

**Listeners Implementados:**

```javascript
// Suscribirse a topics
mqttService.client.subscribe('crm/clientes/buscar/cedula/+');
mqttService.client.subscribe('crm/clientes/buscar/fechas/+');
mqttService.client.subscribe('crm/clientes/actualizar/+');

mqttService.client.on('message', async (topic, message) => {
  // 1. Búsqueda por cédula
  if (topic.startsWith('crm/clientes/buscar/cedula/')) {
    const data = JSON.parse(message.toString());
    const userId = topic.split('/').pop();
    const { cedula } = data;
    
    const cliente = await Cliente.findOne({ cedula, activo: true });
    
    mqttService.publish(`crm/clientes/resultado/${userId}`, {
      success: !!cliente,
      tipoBusqueda: 'cedula',
      clientes: cliente ? [cliente] : [],
      count: cliente ? 1 : 0,
      timestamp: new Date().toISOString()
    });
  }
  
  // 2. Búsqueda por fechas
  if (topic.startsWith('crm/clientes/buscar/fechas/')) {
    const data = JSON.parse(message.toString());
    const userId = topic.split('/').pop();
    const { fechaInicio, fechaFin, page = 1, limit = 50 } = data;
    
    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);
    
    const skip = (page - 1) * limit;
    const clientes = await Cliente.find({
      activo: true,
      'interacciones.fecha': { $gte: inicio, $lte: fin }
    })
    .sort({ fechaUltimaInteraccion: -1 })
    .skip(skip)
    .limit(limit);
    
    const total = await Cliente.countDocuments({
      activo: true,
      'interacciones.fecha': { $gte: inicio, $lte: fin }
    });
    
    mqttService.publish(`crm/clientes/resultado/${userId}`, {
      success: true,
      tipoBusqueda: 'fechas',
      clientes: clientes,
      count: clientes.length,
      total: total,
      page: page,
      limit: limit,
      hasMore: total > (page * limit),
      timestamp: new Date().toISOString()
    });
  }
  
  // 3. Actualización de cliente
  if (topic.startsWith('crm/clientes/actualizar/')) {
    const data = JSON.parse(message.toString());
    const userId = topic.split('/').pop();
    const { cedula, datosActualizados } = data;
    
    const cliente = await Cliente.findOne({ cedula, activo: true });
    
    if (cliente) {
      Object.keys(datosActualizados).forEach(key => {
        if (key !== 'cedula' && key !== '_id' && datosActualizados[key] !== undefined) {
          cliente[key] = datosActualizados[key];
        }
      });
      
      await cliente.save();
      
      mqttService.publish(`crm/clientes/actualizado/${userId}`, {
        success: true,
        cliente: cliente,
        timestamp: new Date().toISOString()
      });
    }
  }
});
```

---

## 🔄 Flujos de Datos

### Flujo 1: Búsqueda por Cédula

```
1. Usuario ingresa cédula en Reportes.vue
2. Usuario hace clic en "Buscar"
3. Frontend publica en: crm/clientes/buscar/cedula/{userId}
4. Backend recibe mensaje MQTT
5. Backend busca en MongoDB
6. Backend publica resultado en: crm/clientes/resultado/{userId}
7. Frontend recibe resultado MQTT
8. Frontend muestra cliente en tabla
9. Usuario hace clic en "Ver Detalles"
10. Se abre modal ClienteCRM.vue
```

### Flujo 2: Búsqueda por Fechas con Paginación

```
1. Usuario selecciona rango de fechas
2. Usuario hace clic en "Buscar"
3. Frontend publica en: crm/clientes/buscar/fechas/{userId} (page=1)
4. Backend busca primeros 50 registros
5. Backend publica resultados con hasMore=true
6. Frontend muestra resultados
7. Usuario scroll hasta el final
8. Frontend publica: crm/clientes/buscar/fechas/{userId} (page=2)
9. Backend envía siguientes 50 registros
10. Frontend agrega resultados a la lista
```

### Flujo 3: Edición de Cliente

```
1. Usuario abre ClienteCRM desde "Ver Detalles"
2. Usuario cambia a tab "Editar"
3. Usuario modifica campos
4. Usuario hace clic en "Guardar Cambios"
5. Frontend publica en: crm/clientes/actualizar/{userId}
6. Backend recibe y actualiza MongoDB
7. Backend publica confirmación en: crm/clientes/actualizado/{userId}
8. Frontend recibe confirmación
9. Frontend actualiza lista local
10. Frontend cierra tab de edición y muestra tab de información
11. Usuario ve cambios reflejados
```

---

## 📚 Guía de Uso

### Para Usuarios Finales

#### 1. Buscar Cliente por Cédula

1. Ir a **Reportes** en el menú
2. Seleccionar modo **"Búsqueda por Cédula"**
3. Ingresar número de cédula
4. Hacer clic en **"🔍 Buscar Cliente"**
5. Ver resultado en la tabla
6. Hacer clic en **"Ver Detalles"** para abrir CRM

#### 2. Buscar Clientes por Fecha

1. Ir a **Reportes** en el menú
2. Seleccionar modo **"Búsqueda por Fechas"**
3. Seleccionar fecha inicial y final
4. Hacer clic en **"🔍 Buscar Clientes"**
5. Ver resultados en la tabla
6. Scroll para cargar más resultados (paginación automática)
7. Hacer clic en **"Cargar Más"** si hay más registros

#### 3. Ver y Editar Cliente

1. Hacer clic en **"Ver Detalles"** en cualquier cliente
2. Se abre el modal CRM con 3 tabs:
   - **📋 Información**: Ver todos los datos
   - **✏️ Editar**: Modificar campos
   - **📞 Historial**: Ver interacciones
3. Para editar:
   - Cambiar a tab **"Editar"**
   - Modificar los campos necesarios
   - Hacer clic en **"💾 Guardar Cambios"**
4. Para cerrar: Hacer clic en **"×"** o fuera del modal

#### 4. Exportar Resultados

1. Después de una búsqueda con resultados
2. Hacer clic en **"📥 Exportar CSV"**
3. Se descarga archivo con todos los clientes visibles

---

### Para Desarrolladores

#### 1. Agregar Nuevo Campo al CRM

**Paso 1: Modelo (backend)**
```javascript
// models/cliente.js
{
  nuevoCampo: {
    type: String,
    default: ''
  }
}
```

**Paso 2: Componente CRM (frontend)**
```vue
<!-- ClienteCRM.vue - Tab Información -->
<div class="info-item">
  <span class="info-label text-dark">Nuevo Campo:</span>
  <span class="info-valor text-dark">{{ cliente.nuevoCampo || '-' }}</span>
</div>

<!-- ClienteCRM.vue - Tab Editar -->
<div class="form-grupo">
  <label class="text-dark">Nuevo Campo</label>
  <input v-model="clienteEditado.nuevoCampo" type="text" class="form-input bg-white text-dark" />
</div>
```

**Paso 3: Inicialización**
```javascript
// ClienteCRM.vue - methods
inicializarEdicion() {
  this.clienteEditado = {
    ...
    nuevoCampo: this.cliente.nuevoCampo || ''
  };
}
```

#### 2. Agregar Nuevo Tipo de Búsqueda

**Paso 1: Backend (app.js)**
```javascript
if (topic.startsWith('crm/clientes/buscar/nuevo/')) {
  const data = JSON.parse(message.toString());
  const userId = topic.split('/').pop();
  const { parametro } = data;
  
  const clientes = await Cliente.find({ parametro });
  
  mqttService.publish(`crm/clientes/resultado/${userId}`, {
    success: true,
    tipoBusqueda: 'nuevo',
    clientes: clientes,
    count: clientes.length,
    timestamp: new Date().toISOString()
  });
}
```

**Paso 2: Frontend (Reportes.vue)**
```javascript
async buscarPorNuevo() {
  const userId = this.$store.state.user?.id;
  
  mqttService.publish(`crm/clientes/buscar/nuevo/${userId}`, {
    parametro: this.parametroBusqueda,
    timestamp: new Date().toISOString()
  });
}
```

---

## 💡 Código de Ejemplo

### Uso Completo del CRM

```vue
<template>
  <div>
    <!-- Búsqueda -->
    <input v-model="cedula" placeholder="Ingrese cédula" />
    <button @click="buscar">Buscar</button>
    
    <!-- Resultados -->
    <div v-for="cliente in clientes" :key="cliente._id">
      {{ cliente.nombres }} {{ cliente.apellidos }}
      <button @click="verDetalles(cliente)">Ver Detalles</button>
    </div>
    
    <!-- Modal CRM -->
    <ClienteCRM
      v-if="clienteSeleccionado"
      :cliente="clienteSeleccionado"
      @cerrar="clienteSeleccionado = null"
      @cliente-actualizado="handleActualizado"
    />
  </div>
</template>

<script>
import { mqttService } from '@/router/services/mqttService';
import ClienteCRM from '@/components/ClienteCRM.vue';

export default {
  components: { ClienteCRM },
  data() {
    return {
      cedula: '',
      clientes: [],
      clienteSeleccionado: null,
      mqttTopic: ''
    };
  },
  mounted() {
    const userId = this.$store.state.user?.id;
    this.mqttTopic = `crm/clientes/resultado/${userId}`;
    mqttService.on(this.mqttTopic, this.handleResultados);
  },
  beforeUnmount() {
    mqttService.off(this.mqttTopic, this.handleResultados);
  },
  methods: {
    buscar() {
      const userId = this.$store.state.user?.id;
      mqttService.publish(`crm/clientes/buscar/cedula/${userId}`, {
        cedula: this.cedula,
        timestamp: new Date().toISOString()
      });
    },
    
    handleResultados(data) {
      this.clientes = data.clientes || [];
    },
    
    verDetalles(cliente) {
      this.clienteSeleccionado = cliente;
    },
    
    handleActualizado(datos) {
      const index = this.clientes.findIndex(c => c.cedula === datos.cedula);
      if (index !== -1) {
        this.clientes[index] = { ...this.clientes[index], ...datos };
      }
    }
  }
};
</script>
```

---

## 🔒 Seguridad

### Validaciones Implementadas

1. **Usuario ID**: Todas las operaciones requieren ID de usuario válido
2. **Cédula Única**: No se puede cambiar la cédula al editar
3. **Campos Protegidos**: `_id` no se puede modificar
4. **Estado Activo**: Solo se buscan clientes con `activo: true`

### Mejores Prácticas

- ✅ Usar siempre el `userId` del store autenticado
- ✅ Validar datos antes de publicar por MQTT
- ✅ Limpiar listeners MQTT en `beforeUnmount`
- ✅ Manejar errores de conexión MQTT
- ✅ No exponer información sensible en logs

---

## 📊 Métricas y Monitoreo

### Logs del Sistema

```javascript
// Backend logs
console.log(`🔍 MQTT: Búsqueda por cédula: ${cedula}`);
console.log(`✅ Cliente encontrado: ${cliente.nombres}`);
console.log(`🔄 MQTT: Actualizar cliente: ${cedula}`);
console.log(`✅ Cliente actualizado: ${cliente.nombres}`);

// Frontend logs
console.log('📡 Solicitud de búsqueda enviada por MQTT');
console.log('✅ Resultados recibidos:', data);
console.log('✅ Cliente actualizado en la lista');
```

---

## 🚀 Optimizaciones

### Performance

1. **Paginación**: Carga incremental de 50 registros
2. **MQTT**: Comunicación asíncrona sin bloqueos
3. **Listeners Únicos**: Un listener por usuario
4. **Cleanup**: Desuscripción automática al desmontar

### Escalabilidad

1. **Topics Personalizados**: Un topic por usuario evita colisiones
2. **QoS MQTT**: Garantiza entrega de mensajes
3. **MongoDB Indexes**: Índices en cédula y fechas para búsquedas rápidas

---

## 📝 Notas Importantes

⚠️ **Importante**: NO usar HTTP para búsquedas. TODO es por MQTT.

⚠️ **Recordar**: Limpiar listeners MQTT en `beforeUnmount`.

⚠️ **Considerar**: El `userId` debe venir siempre del store autenticado.

⚠️ **Validar**: Los datos antes de guardar en el backend.

---

## 🎯 Roadmap Futuro

- [ ] Agregar búsqueda por nombre/apellido
- [ ] Implementar filtros avanzados
- [ ] Agregar notas a clientes
- [ ] Exportar historial individual
- [ ] Gráficas de interacciones
- [ ] Notificaciones de cambios en tiempo real
- [ ] Sincronización offline
- [ ] Auditoría de cambios

---

## 📞 Soporte

Para dudas o problemas con el CRM, revisar:
1. Logs del backend (líneas 705-866 de `app.js`)
2. Consola del navegador (mensajes MQTT)
3. Estado de conexión MQTT
4. Autenticación del usuario

---

**Última actualización:** 30 de Septiembre de 2025
**Versión:** 1.0.0
**Autor:** Sistema CRM MinisterioEducacion
