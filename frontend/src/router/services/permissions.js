import tokens from './tokens';

class PermissionsService {
  constructor() {
    this.userPermissions = null;
    this.userRole = null;
    this.lastUpdate = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Obtiene los permisos del usuario actual
   */
  async getUserPermissions() {
    // Verificar cache en memoria
    if (this.userPermissions && this.lastUpdate && 
        (Date.now() - this.lastUpdate) < this.cacheTimeout) {
      return this.userPermissions;
    }

    // Verificar cache en localStorage primero
    const storedPermissions = localStorage.getItem('userPermissions');
    const storedRole = localStorage.getItem('userRoleName');
    const cachedToken = localStorage.getItem('cachedRoleToken');
    const currentToken = localStorage.getItem('token') || localStorage.getItem('TokenRole');
    
    // Si tenemos permisos en localStorage y el token coincide, usar cache
    if (storedPermissions && storedRole && cachedToken === currentToken) {
      try {
        this.userPermissions = JSON.parse(storedPermissions);
        this.userRole = storedRole;
        this.lastUpdate = Date.now();
        return this.userPermissions;
      } catch (error) {
        console.error('❌ Error parseando permisos desde localStorage:', error);
      }
    }

    // Si no hay cache válido, hacer request al servidor
    try {
      const roleData = await tokens.sendRole();
      
      if (roleData && roleData.permissions) {
        this.userPermissions = roleData.permissions;
        this.userRole = roleData.nombre;
        this.lastUpdate = Date.now();
        
        // Guardar en localStorage como backup
        localStorage.setItem('userPermissions', JSON.stringify(this.userPermissions));
        localStorage.setItem('userRoleName', this.userRole);
        
        return this.userPermissions;
      } else {
        console.warn('⚠️ No se pudieron obtener permisos del servidor, usando fallback');
        return this.getFallbackPermissions();
      }
    } catch (error) {
      console.error('❌ Error obteniendo permisos del servidor:', error);
      return this.getFallbackPermissions();
    }
  }

  /**
   * Permisos de fallback desde localStorage
   */
  getFallbackPermissions() {
    try {
      const storedPermissions = localStorage.getItem('userPermissions');
      if (storedPermissions) {
        this.userPermissions = JSON.parse(storedPermissions);
        this.userRole = localStorage.getItem('userRoleName');
        return this.userPermissions;
      }
    } catch (error) {
      console.error('❌ Error leyendo permisos desde localStorage:', error);
    }
    
    // Permisos mínimos por defecto
    return {
      users: { view: false, create: false, edit: false, delete: false },
      monitoring: { viewActiveUsers: false, viewUserStates: false, viewReports: false, exportData: false },
      finance: { viewAbonos: false, createAbonos: false, viewSaldos: false, viewBilling: false },
      system: { manageRoles: false, systemConfig: false, viewLogs: false },
      operations: { viewTables: false, viewViajes: false, viewKardex: false, exportReports: false },
      admin: { manageTree: false, systemSettings: false, userManagement: false }
    };
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} module - Módulo (users, monitoring, finance, system, operations)
   * @param {string} permission - Permiso específico (view, create, edit, delete, etc.)
   */
  async hasPermission(module, permission) {
    const permissions = await this.getUserPermissions();
    
    if (!permissions || !permissions[module]) {
      console.warn(`⚠️ Módulo '${module}' no encontrado en permisos`);
      return false;
    }

    const hasAccess = permissions[module][permission] === true;
    return hasAccess;
  }

  /**
   * Verifica si el usuario tiene cualquiera de los permisos especificados
   * @param {Array} permissionChecks - Array de objetos {module, permission}
   */
  async hasAnyPermission(permissionChecks) {
    for (const check of permissionChecks) {
      if (await this.hasPermission(check.module, check.permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   * @param {Array} permissionChecks - Array de objetos {module, permission}
   */
  async hasAllPermissions(permissionChecks) {
    for (const check of permissionChecks) {
      if (!(await this.hasPermission(check.module, check.permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Obtiene el nombre del rol del usuario
   */
  async getUserRole() {
    if (!this.userRole) {
      await this.getUserPermissions();
    }
    return this.userRole;
  }

  /**
   * Verifica si el usuario puede acceder a una ruta específica
   * @param {string} routeName - Nombre de la ruta
   */
  async canAccessRoute(routeName) {
    const routePermissions = {
      '/Users': [{ module: 'users', permission: 'view' }],
      '/active-users': [{ module: 'monitoring', permission: 'viewActiveUsers' }],
      '/abonos': [{ module: 'finance', permission: 'viewAbonos' }],
      '/saldos': [{ module: 'finance', permission: 'viewSaldos' }],
      '/tables': [{ module: 'operations', permission: 'viewTables' }],
      '/viajes': [{ module: 'operations', permission: 'viewViajes' }],
      '/billing': [{ module: 'finance', permission: 'viewBilling' }],
      '/reportes': [{ module: 'monitoring', permission: 'viewReports' }],
      '/tree-admin': [{ module: 'admin', permission: 'manageTree' }],
      '/profile': [], // Acceso libre para usuarios autenticados
      '/dashboard': [], // Acceso libre para usuarios autenticados
    };

    const requiredPermissions = routePermissions[routeName];
    
    // Si no hay permisos requeridos, permitir acceso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Verificar si tiene al menos uno de los permisos requeridos
    return await this.hasAnyPermission(requiredPermissions);
  }

  /**
   * Limpia el cache de permisos
   */
  clearCache() {
    this.userPermissions = null;
    this.userRole = null;
    this.lastUpdate = null;
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('userRoleName');
    localStorage.removeItem('cachedRole');
    localStorage.removeItem('cachedRolePermissions');
    localStorage.removeItem('cachedRoleToken');
  }

  /**
   * Verifica permisos para mostrar elementos de UI
   */
  async canShowUIElement(elementType) {
    const uiPermissions = {
      'sidebar-users': [{ module: 'users', permission: 'view' }],
      'sidebar-active-users': [{ module: 'monitoring', permission: 'viewActiveUsers' }],
      'sidebar-abonos': [{ module: 'finance', permission: 'viewAbonos' }],
      'sidebar-saldos': [{ module: 'finance', permission: 'viewSaldos' }],
      'sidebar-tables': [{ module: 'operations', permission: 'viewTables' }],
      'sidebar-viajes': [{ module: 'operations', permission: 'viewViajes' }],
      'sidebar-tree-admin': [{ module: 'admin', permission: 'manageTree' }],
      'sidebar-admin-panels': [{ module: 'admin', permission: 'systemConfig' }],
      'button-create-user': [{ module: 'users', permission: 'create' }],
      'button-edit-user': [{ module: 'users', permission: 'edit' }],
      'button-delete-user': [{ module: 'users', permission: 'delete' }],
      'button-export-data': [{ module: 'monitoring', permission: 'exportData' }],
    };

    const requiredPermissions = uiPermissions[elementType];
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    return await this.hasAnyPermission(requiredPermissions);
  }
}

// Instancia singleton
const permissionsService = new PermissionsService();

export default permissionsService; 