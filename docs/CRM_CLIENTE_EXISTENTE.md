# 👤 Sistema CRM: Cliente Existente/Nuevo

## 📋 Descripción

Sistema para identificar y mostrar si un cliente que llama es nuevo o ya ha interactuado anteriormente con el CRM, mostrando su historial de interacciones.

## 🎯 Funcionalidad

### **Badge Visual en Modal de Tipificación**

Cuando se asigna una nueva tipificación, el modal muestra uno de dos badges:

#### **Cliente Existente 👤**
```
┌─────────────────────────────────────┐
│ 👤 Cliente Existente  3 interacciones│
└─────────────────────────────────────┘
```
- Color: Verde degradado
- Muestra: Total de interacciones previas
- Se muestra cuando: `clienteExistente === true && totalInteracciones > 0`

#### **Cliente Nuevo 🆕**
```
┌──────────────────────┐
│ 🆕 Cliente Nuevo     │
└──────────────────────┘
```
- Color: Azul/Púrpura degradado
- Se muestra cuando: `clienteExistente === false || totalInteracciones === 0`

## 🔧 Flujo Técnico

### **1. Backend: Búsqueda de Cliente**

Cuando llega una nueva llamada en `routes/index.routes.js`:

```javascript
// Líneas 273-292
if (params.cedula) {
  const Cliente = require('../models/cliente');
  clienteExistente = await Cliente.buscarPorCedula(params.cedula);
  
  if (clienteExistente) {
    console.log(`👤 Cliente existente encontrado`);
    console.log(`   - Total Interacciones: ${clienteExistente.totalInteracciones}`);
    historialCliente = clienteExistente.obtenerHistorial(5);
  } else {
    console.log(`🆕 Cliente NO encontrado - Se creará uno nuevo`);
  }
}
```

### **2. Backend: Envío de Datos CRM por MQTT**

```javascript
// Líneas 636-639
const tipificacionData = {
  // ... otros campos
  clienteExistente: !!clienteExistente,
  totalInteracciones: clienteExistente ? 
    (clienteExistente.totalInteracciones || clienteExistente.interacciones?.length || 0) : 0,
  fechaUltimaInteraccion: clienteExistente?.fechaUltimaInteraccion || null
};

// Publicar por MQTT
mqttService.publish(topic, tipificacionData);
```

### **3. Frontend: Recepción y Visualización**

En `Work.vue`:

```javascript
// Líneas 838-851
const esClienteExistente = data.clienteExistente === true;
const totalInteracciones = data.totalInteracciones || 0;

if (esClienteExistente && totalInteracciones > 0) {
  this.modalData.esClienteExistente = true;
  this.modalData.totalInteracciones = totalInteracciones;
  this.modalData.fechaUltimaInteraccion = data.fechaUltimaInteraccion;
} else {
  this.modalData.esClienteExistente = false;
  this.modalData.totalInteracciones = 0;
}
```

## 📊 Modelo de Datos

### **Modelo Cliente** (`models/cliente.js`)

```javascript
{
  cedula: String (required, unique),
  tipoDocumento: String (opcional),
  nombres: String,
  apellidos: String,
  
  // Array de interacciones
  interacciones: [{
    idLlamada: String,
    fecha: Date,
    tipo: String,
    observacion: String,
    agente: ObjectId,
    estado: String,
    nivel1-5: String
  }],
  
  // Metadatos CRM
  totalInteracciones: Number (default: 0),
  fechaUltimaInteraccion: Date,
  fechaCreacion: Date
}
```

### **Variables Clave**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `clienteExistente` | Boolean | `true` si se encontró en BD por cédula |
| `totalInteracciones` | Number | Contador de interacciones previas |
| `fechaUltimaInteraccion` | Date | Última vez que interactuó |
| `interacciones` | Array | Historial completo de interacciones |

## 🔍 Lógica de Detección

```javascript
// Cliente es considerado EXISTENTE si:
clienteExistente === true && totalInteracciones > 0

// Cliente es considerado NUEVO si:
clienteExistente === false || totalInteracciones === 0
```

### **Fallback para totalInteracciones:**
```javascript
clienteExistente.totalInteracciones || clienteExistente.interacciones?.length || 0
```

Primero busca el campo `totalInteracciones`, si no existe cuenta el array `interacciones`.

## 🐛 Problema Resuelto: tipoDocumento Requerido

### **Problema Original:**
```
Error: Cliente validation failed: tipoDocumento: Path `tipoDocumento` is required.
```

El sistema telefónico no siempre envía `tipoDocumento`, causando que el cliente no se pueda crear.

### **Solución:**
```javascript
// models/cliente.js - Línea 11-16
tipoDocumento: {
  type: String,
  required: false,  // ← Cambiado de true a false
  enum: ['', 'Cédula de ciudadanía', ...],
  default: ''
}
```

## 📈 Información Adicional en Modal

Cuando es cliente existente, el modal muestra:

```
┌─────────────────────────────────────┐
│ 👤 Cliente Existente  3 interacciones│
│                                      │
│ Información del Cliente              │
│ ├─ Nombres: Juan Pérez              │
│ ├─ Teléfono: 3001234567             │
│                                      │
│ ✅ Total Interacciones: 3           │
│ ✅ Última Interacción: 29/09/2025   │
└─────────────────────────────────────┘
```

## 🎨 Estilos CSS

Los badges CRM tienen estilos definidos en `Work.vue`:

```css
/* Cliente Existente - Verde */
.crm-badge.existing {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

/* Cliente Nuevo - Azul/Púrpura */
.crm-badge.new {
  background: linear-gradient(135deg, #007bff, #6610f2);
  color: white;
}
```

## 🔗 Archivos Relacionados

- `frontend/src/views/Work.vue` - Vista principal
- `routes/index.routes.js` - Lógica de backend
- `models/cliente.js` - Modelo de datos del cliente
- `models/tipificacion.js` - Modelo de tipificación

## 📝 Notas

- Los datos CRM se envían **solo por MQTT**, no se guardan en la colección `tipificaciones`
- La colección `clientes` es la fuente de verdad para el historial
- El campo `clienteExistente` se calcula en tiempo real en cada asignación
