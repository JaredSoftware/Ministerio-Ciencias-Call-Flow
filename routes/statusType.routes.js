const express = require('express');
const router = express.Router();
const StatusType = require('../models/statusType');
const { requireAuth } = require('../middleware/stateMiddleware');

// Middleware para logging de peticiones
const logRequest = (req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - Session: ${!!req.session}, User: ${!!req.session?.user}`);
  next();
};

// Aplicar logging a todas las rutas
router.use(logRequest);

// Ruta de prueba simple
router.get('/test', (req, res) => {
  console.log('🧪 GET /status-types/test - Ruta de prueba');
  res.json({ 
    success: true, 
    message: 'Ruta de status-types funcionando',
    timestamp: new Date().toISOString()
  });
});

// Inicializar estados por defecto
router.post('/initialize', async (req, res) => {
  try {
    await StatusType.initializeDefaultStatuses();
    res.json({ 
      success: true, 
      message: 'Estados inicializados correctamente' 
    });
  } catch (error) {
    console.error('Error inicializando estados:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Obtener todos los estados activos
router.get('/', async (req, res) => {
  console.log('🔄 GET /status-types - Obteniendo todos los estados...');
  try {
    const statuses = await StatusType.getActiveStatuses();
    console.log(`✅ Estados obtenidos: ${statuses.length} estados`);
    res.json({ 
      success: true, 
      statuses: statuses 
    });
  } catch (error) {
    console.error('❌ Error obteniendo estados:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Obtener estados por categoría
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const statuses = await StatusType.getByCategory(category);
    res.json({ 
      success: true, 
      statuses: statuses,
      category: category
    });
  } catch (error) {
    console.error('Error obteniendo estados por categoría:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Obtener estado por defecto
router.get('/default', async (req, res) => {
  try {
    const defaultStatus = await StatusType.getDefaultStatus();
    res.json({ 
      success: true, 
      status: defaultStatus 
    });
  } catch (error) {
    console.error('Error obteniendo estado por defecto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Crear nuevo estado (solo admin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { value, label, color, category, description, icon, order } = req.body;
    
    // Validar que el usuario sea admin
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado' 
      });
    }
    
    const newStatus = new StatusType({
      value,
      label,
      color,
      category,
      description,
      icon,
      order
    });
    
    await newStatus.save();
    
    res.json({ 
      success: true, 
      status: newStatus,
      message: 'Estado creado correctamente'
    });
  } catch (error) {
    console.error('Error creando estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Actualizar estado (solo admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validar que el usuario sea admin
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado' 
      });
    }
    
    const updatedStatus = await StatusType.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!updatedStatus) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estado no encontrado' 
      });
    }
    
    res.json({ 
      success: true, 
      status: updatedStatus,
      message: 'Estado actualizado correctamente'
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Desactivar estado (solo admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el usuario sea admin
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado' 
      });
    }
    
    const status = await StatusType.findById(id);
    if (!status) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estado no encontrado' 
      });
    }
    
    // No permitir desactivar el estado por defecto
    if (status.isDefault) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede desactivar el estado por defecto' 
      });
    }
    
    status.isActive = false;
    await status.save();
    
    res.json({ 
      success: true, 
      message: 'Estado desactivado correctamente'
    });
  } catch (error) {
    console.error('Error desactivando estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Obtener categorías disponibles
router.get('/categories', async (req, res) => {
  console.log('🔄 GET /status-types/categories - Obteniendo categorías...');
  try {
    // Solo devolver los valores de las categorías, no objetos completos
    const categories = ['work', 'break', 'out'];
    
    console.log(`✅ Categorías obtenidas: ${categories.length} categorías`);
    res.json({ 
      success: true, 
      categories: categories 
    });
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

module.exports = router; 