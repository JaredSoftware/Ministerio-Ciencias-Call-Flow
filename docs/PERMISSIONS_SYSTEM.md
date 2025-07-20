# Sistema de Permisos - Ministerio de Educación

## 📋 Descripción

El sistema implementa un control de acceso basado en permisos granulares que permite definir exactamente qué funcionalidades puede acceder cada usuario según su rol.

## 🏗️ Arquitectura

### Componentes Principales

1. **Modelo de Roles** (`models/roles.js`)
   - Define la estructura de permisos por módulo
   - Permisos granulares por funcionalidad
   - Estados activo/inactivo

2. **Modelo de Usuarios** (`models/users.js`)
   - Asociación con roles mediante ObjectId
   - Estados activo/inactivo

3. **Servicio de Permisos** (`frontend/src/services/permissions.js`)
   - Cache inteligente de permisos
   - Validación de acceso a rutas
   - Verificación de elementos de UI

4. **Router Guards** (`frontend/src/router/index.js`)
   - Protección de rutas basada en permisos
   - Redirección automática según permisos

## 🔐 Estructura de Permisos

### Módulos Disponibles

#### 1. **users** - Gestión de Usuarios
- `view`: Ver lista de usuarios
- `create`: Crear nuevos usuarios
- `edit`: Editar usuarios existentes
- `delete`: Eliminar usuarios

#### 2. **monitoring** - Monitoreo y Reportes
- `viewActiveUsers`: Ver usuarios activos en tiempo real
- `viewUserStates`: Ver estados de usuarios
- `viewReports`: Ver reportes del sistema
- `exportData`: Exportar datos

#### 3. **finance** - Gestión Financiera
- `viewAbonos`: Ver abonos
- `createAbonos`: Crear abonos
- `viewSaldos`: Ver saldos
- `viewBilling`: Ver facturación

#### 4. **system** - Configuración del Sistema
- `manageRoles`: Gestionar roles y permisos
- `systemConfig`: Configuración del sistema
- `viewLogs`: Ver logs del sistema

#### 5. **operations** - Operaciones
- `viewTables`: Ver tablas de datos
- `viewViajes`: Ver viajes
- `viewKardex`: Ver kardex
- `exportReports`: Exportar reportes

## 👥 Roles Predefinidos

### 🔴 **Administrador**
**Descripción**: Acceso completo al sistema
**Permisos**:
- ✅ Todos los permisos habilitados
- 📊 Monitoreo completo
- 👥 Gestión completa de usuarios
- 💰 Acceso total a finanzas
- ⚙️ Configuración del sistema

### 🟡 **Supervisor**
**Descripción**: Acceso a monitoreo y reportes
**Permisos**:
- 👥 Ver usuarios
- 📊 Monitoreo completo (usuarios activos, estados, reportes)
- 💰 Ver abonos, saldos y facturación
- 📋 Ver logs del sistema
- 📊 Operaciones completas con exportación

### 🟢 **Asesor**
**Descripción**: Acceso limitado a finanzas y operaciones básicas
**Permisos**:
- 💰 Ver abonos, crear abonos, ver saldos
- 📊 Ver tablas y viajes
- ❌ Sin acceso a monitoreo
- ❌ Sin acceso a gestión de usuarios

### 🔵 **Contador**
**Descripción**: Acceso completo a finanzas y reportes
**Permisos**:
- 💰 Acceso completo a finanzas
- 📊 Ver reportes y exportar datos
- 📋 Ver tablas y exportar reportes

### 🟣 **Auditor**
**Descripción**: Acceso de solo lectura a todo el sistema
**Permisos**:
- 👥 Ver usuarios
- 📊 Monitoreo completo (solo lectura)
- 💰 Ver finanzas (solo lectura)
- 📋 Ver logs
- 📊 Ver operaciones (solo lectura)

## 🛡️ Implementación

### Backend

#### Modelo de Roles
```javascript
const rolesSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  descripcion: { type: String, default: "" },
  permissions: {
    users: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    monitoring: {
      viewActiveUsers: { type: Boolean, default: false },
      viewUserStates: { type: Boolean, default: false },
      viewReports: { type: Boolean, default: false },
      exportData: { type: Boolean, default: false }
    },
    // ... otros módulos
  },
  isActive: { type: Boolean, default: true }
});
```

#### Endpoint de Roles
```javascript
// POST /api/role
role: async (req, res) => {
  const token = req.body.token;
  const decoded = jwt.decode(token, "g8SlhhpH6O");
  
  if (decoded) {
    const role = await rol.findOne({ _id: decoded.role });
    res.send(role);
  }
}
```

### Frontend

#### Servicio de Permisos
```javascript
class PermissionsService {
  async getUserPermissions() {
    // Cache inteligente con timeout de 5 minutos
    if (this.userPermissions && this.lastUpdate && 
        (Date.now() - this.lastUpdate) < this.cacheTimeout) {
      return this.userPermissions;
    }
    
    // Obtener desde servidor
    const roleData = await tokens.sendRole();
    this.userPermissions = roleData.permissions;
    return this.userPermissions;
  }
  
  async hasPermission(module, permission) {
    const permissions = await this.getUserPermissions();
    return permissions[module]?.[permission] === true;
  }
}
```

#### Router Guards
```javascript
router.beforeEach(async (to, from, next) => {
  // Verificar autenticación
  if (!store.getters.isLoggedIn) {
    next("/signin");
    return;
  }
  
  // Verificar permisos específicos
  const routePermissions = to.meta.permissions;
  if (routePermissions && routePermissions.length > 0) {
    const hasAccess = await permissionsService.hasAnyPermission(routePermissions);
    if (!hasAccess) {
      next('/dashboard');
      return;
    }
  }
  
  next();
});
```

#### Sidebar Condicional
```javascript
// En SidenavList.vue
async canShowElement(elementType) {
  return await permissionsService.canShowUIElement(elementType);
}
```

## 🔄 Cache y Optimización

### Cache Inteligente
- **Timeout**: 5 minutos
- **Almacenamiento**: localStorage + memoria
- **Validación**: Por token de usuario
- **Limpieza**: Automática en logout

### Optimizaciones
- ✅ Evita requests innecesarios
- ✅ Cache por usuario
- ✅ Fallback a permisos mínimos
- ✅ Limpieza automática

## 🚀 Uso en el Sistema

### 1. **Rutas Protegidas**
```javascript
{
  path: "/active-users",
  name: "ActiveUsers",
  component: ActiveUsers,
  meta: {
    requiresAuth: true,
    permissions: [{ module: 'monitoring', permission: 'viewActiveUsers' }]
  },
}
```

### 2. **Elementos de UI**
```javascript
// En componentes Vue
async mounted() {
  this.canViewUsers = await permissionsService.hasPermission('users', 'view');
  this.canCreateUsers = await permissionsService.hasPermission('users', 'create');
}
```

### 3. **Sidebar Dinámico**
```javascript
// Mostrar opciones según permisos
<li v-if="await canShowElement('sidebar-users')">
  <sidenav-item url="/Users" navText="Users" />
</li>
```

## 📊 Monitoreo y Debug

### Logs del Sistema
- ✅ Verificación de permisos
- ✅ Cache hits/misses
- ✅ Errores de permisos
- ✅ Accesos denegados

### Debug en Desarrollo
```javascript
// Habilitar logs detallados
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('🔍 Verificando permiso:', module, permission);
  console.log('📋 Permisos actuales:', permissions);
}
```

## 🔧 Mantenimiento

### Crear Nuevo Rol
1. Definir permisos en el modelo
2. Crear rol en la base de datos
3. Asignar a usuarios según necesidad

### Agregar Nuevo Permiso
1. Agregar al esquema de roles
2. Actualizar roles existentes
3. Modificar frontend para usar el permiso

### Migración de Roles
```javascript
// Script de migración
const migrationScript = async () => {
  const roles = await Role.find({});
  for (const role of roles) {
    // Actualizar permisos según nueva estructura
    await role.save();
  }
};
```

## 🆘 Solución de Problemas

### Problemas Comunes

1. **Usuario no ve opciones del sidebar**
   - Verificar que tenga rol asignado
   - Limpiar cache del navegador
   - Verificar permisos del rol

2. **Acceso denegado a rutas**
   - Verificar meta.permissions en la ruta
   - Comprobar permisos del usuario
   - Revisar logs del router guard

3. **Cache no se actualiza**
   - Forzar logout/login
   - Limpiar localStorage
   - Verificar timeout del cache

### Debug
```javascript
// Verificar permisos del usuario actual
const permissions = await permissionsService.getUserPermissions();
console.log('Permisos actuales:', permissions);

// Verificar rol asignado
const role = await tokens.sendRole();
console.log('Rol actual:', role.nombre);
```

## 📝 Notas Importantes

1. **Siempre verificar permisos** antes de mostrar funcionalidades
2. **Usar cache inteligente** para optimizar performance
3. **Limpiar cache** en logout para seguridad
4. **Documentar nuevos permisos** cuando se agreguen
5. **Probar con diferentes roles** antes de desplegar

## 🔐 Seguridad

- ✅ Validación en frontend y backend
- ✅ Cache por usuario específico
- ✅ Timeout automático de sesiones
- ✅ Limpieza de datos sensibles
- ✅ Logs de acceso y errores 