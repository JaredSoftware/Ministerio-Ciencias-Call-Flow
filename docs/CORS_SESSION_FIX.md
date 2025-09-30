# 🔐 Fix: CORS y Sesiones para Múltiples IPs

## 📋 Problema Identificado

### **Error 401 Unauthorized:**
```
GET http://172.16.116.10:9035/api/user-status/my-status 401 (Unauthorized)
```

### **Causa Raíz:**

El usuario estaba **logueado** pero recibía error 401 al acceder desde la IP `172.16.116.10` porque:

1. **CORS** solo permitía `http://localhost:8080`
2. **Cookie domain** estaba fijado en `localhost`

## ✅ Solución Implementada

### **1. CORS Dinámico (`app.js` líneas 122-144)**

**ANTES:**
```javascript
app.use(cors({
  origin: "http://localhost:8080", // ❌ Solo localhost
  credentials: true
}));
```

**AHORA:**
```javascript
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:9035',
      'http://172.16.116.10:9035',  // ✅ IP del servidor
      'http://172.16.116.10:8080'
    ];
    
    // Permitir requests sin origin
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todos por ahora
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
```

### **2. Cookie sin Domain Restriction (`app.js` líneas 68-80)**

**ANTES:**
```javascript
const sessionMiddleware = session({
  cookie: { 
    domain: 'localhost' // ❌ Solo funciona en localhost
  }
});
```

**AHORA:**
```javascript
const sessionMiddleware = session({
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax'
    // ✅ Sin domain para funcionar en cualquier IP
  }
});
```

## 🔧 Validaciones Adicionales

### **StatusSyncMonitor.vue**

Agregada validación para evitar peticiones cuando no hay usuario autenticado:

```javascript
// Líneas 93-98
if (!this.$store.state.user || !this.$store.state.user._id) {
  console.log('⚠️ No hay usuario en el store, saltando actualización de estado');
  this.isConnected = false;
  return;
}

// Líneas 100-126
try {
  const response = await axios.get('/user-status/my-status', {
    withCredentials: true
  });
  // ... procesar respuesta
} catch (error) {
  if (error.response?.status === 401) {
    console.log('⚠️ No autenticado - StatusSyncMonitor deshabilitado');
  }
}
```

### **Cambio de fetch a axios**

**ANTES:**
```javascript
const response = await fetch('/api/user-status/my-status', {
  credentials: 'include'
});
```

**AHORA:**
```javascript
const response = await axios.get('/user-status/my-status', {
  withCredentials: true
});
```

**Ventaja:** `axios` usa la configuración global con `baseURL` y `withCredentials: true`.

## 🌐 Configuración de Red

### **Dominios/IPs Permitidos:**

| Origen | Puerto | Uso |
|--------|--------|-----|
| `localhost` | 8080 | Frontend Dev |
| `localhost` | 9035 | Backend API |
| `172.16.116.10` | 8080 | Frontend en Red Local |
| `172.16.116.10` | 9035 | Backend API en Red Local |

### **Headers CORS:**

```
Access-Control-Allow-Origin: http://172.16.116.10:9035
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### **Cookie:**

```
Set-Cookie: ministerio_educacion_session=...; 
  Path=/; 
  Expires=...; 
  SameSite=Lax
  (Sin Domain restriction)
```

## 🚀 Despliegue

### **Después de Aplicar los Cambios:**

1. **Reiniciar el servidor backend:**
   ```bash
   docker restart crm-backend
   # O reiniciar manualmente
   ```

2. **Hacer build del frontend:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Verificar en el navegador:**
   - Limpiar cookies (Ctrl + Shift + Delete)
   - Hacer login de nuevo
   - Las peticiones deberían funcionar sin error 401

## 🐛 Debugging

### **Verificar que la cookie se envía:**

En DevTools → Network → my-status:

**Request Headers:**
```
Cookie: ministerio_educacion_session=s%3A...
```

**Response Headers:**
```
Access-Control-Allow-Origin: http://172.16.116.10:9035
Access-Control-Allow-Credentials: true
```

### **Logs del Backend:**

```
🔍 requireAuth middleware ejecutándose...
   - Session existe: true
   - User en session: true  ← Debe ser true
   - Session ID: xxxxxxxx
✅ Usuario autenticado en requireAuth: maría
```

## ⚠️ Consideraciones de Seguridad

### **Producción:**

En producción, cambiar la configuración CORS para permitir **solo orígenes específicos**:

```javascript
origin: function (origin, callback) {
  const allowedOrigins = [
    'https://crm.ministerio.edu',
    'https://app.ministerio.edu'
  ];
  
  if (allowedOrigins.indexOf(origin) !== -1) {
    callback(null, true);
  } else {
    callback(new Error('No permitido por CORS'));
  }
}
```

### **Cookies Seguras:**

En producción con HTTPS:
```javascript
cookie: { 
  secure: true,      // Solo HTTPS
  httpOnly: true,    // No accesible desde JS
  sameSite: 'strict' // Mayor seguridad
}
```

## 📁 Archivos Modificados

- `app.js` - Configuración CORS y sesiones
- `frontend/src/components/StatusSyncMonitor.vue` - Validaciones y axios
- `middleware/stateMiddleware.js` - Logs de debug

## 🔗 Referencias

- Express Session: https://www.npmjs.com/package/express-session
- CORS: https://www.npmjs.com/package/cors
- SameSite Cookies: https://developer.mozilla.org/es/docs/Web/HTTP/Headers/Set-Cookie/SameSite
