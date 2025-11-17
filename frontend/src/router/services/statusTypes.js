import axios from './axios';

class StatusTypesService {
  constructor() {
    this.statuses = [];
    this.categories = [];
    this.defaultStatus = null;
  }

  // Cargar todos los estados disponibles
  async loadStatuses() {
    try {
      const response = await axios.get('/status-types', {
        withCredentials: true
      });
      
      
      if (response.data.success) {
        this.statuses = response.data.statuses;
        return this.statuses;
      } else {
        console.error('❌ Response no exitosa:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ Error cargando estados:', error);
      return [];
    }
  }

  // Cargar estados por categoría
  async loadStatusesByCategory(category) {
    try {
      const response = await axios.get(`/status-types/category/${category}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        return response.data.statuses;
      }
    } catch (error) {
      console.error('❌ Error cargando estados por categoría:', error);
      return [];
    }
  }

  // Cargar categorías disponibles
  async loadCategories() {
    try {
      const response = await axios.get('/status-types/categories', {
        withCredentials: true
      });
      
      
      if (response.data.success) {
        this.categories = response.data.categories;
        return this.categories;
      } else {
        console.error('❌ Response no exitosa para categorías:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ Error cargando categorías:', error);
      return [];
    }
  }

  // Obtener estado por defecto
  async getDefaultStatus() {
    try {
      const response = await axios.get('/status-types/default', {
        withCredentials: true
      });
      
      if (response.data.success) {
        this.defaultStatus = response.data.status;
        return this.defaultStatus;
      }
    } catch (error) {
      console.error('❌ Error obteniendo estado por defecto:', error);
      return null;
    }
  }

  // Obtener estado por valor - COMPLETAMENTE DINÁMICO
  getStatusByValue(value) {
    // Primero buscar en los estados predefinidos
    const predefinedStatus = this.statuses.find(status => status.value === value);
    if (predefinedStatus) {
      return predefinedStatus;
    }
    
    // Si no se encuentra, crear un estado dinámico con el valor tal como viene
    return {
      value: value,
      label: value, // Usar el valor como label
      color: '#6c757d', // Color por defecto (gris para offline)
      icon: 'fas fa-times-circle',
      category: 'custom'
    };
  }

  // Obtener estados por categoría
  getStatusesByCategory(category) {
    return this.statuses.filter(status => status.category === category);
  }

  // Agrupar estados por categoría
  getStatusesGroupedByCategory() {
    const grouped = {};
    
    this.statuses.forEach(status => {
      if (!grouped[status.category]) {
        grouped[status.category] = [];
      }
      grouped[status.category].push(status);
    });
    
    return grouped;
  }

  // Obtener categoría por valor
  getCategoryByValue(value) {
    const status = this.getStatusByValue(value);
    return status ? status.category : null;
  }

  // Obtener color por valor
  getColorByValue(value) {
    const status = this.getStatusByValue(value);
    return status ? status.color : '#6c757d';
  }

  // Obtener label por valor
  getLabelByValue(value) {
    const status = this.getStatusByValue(value);
    return status ? status.label : value || 'Desconectado';
  }

  // Obtener icono por valor
  getIconByValue(value) {
    const status = this.getStatusByValue(value);
    return status ? status.icon : 'fas fa-times-circle';
  }

  // Inicializar el servicio
  async initialize() {
    
    await Promise.all([
      this.loadStatuses(),
      this.loadCategories(),
      this.getDefaultStatus()
    ]);
    
  }

  // Recargar datos
  async refresh() {
    await this.initialize();
  }
}

// Crear instancia singleton
const statusTypesService = new StatusTypesService();

export default statusTypesService; 