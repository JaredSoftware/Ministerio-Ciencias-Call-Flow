const express = require('express');
const router = express.Router();
const UserStatus = require('../models/userStatus');
const { requireAuth } = require('../middleware/stateMiddleware');

// Ruta de prueba para verificar sesión
router.get('/test-session', (req, res) => {
  console.log('🔍 Probando sesión...');
  console.log('   - Session existe:', !!req.session);
  console.log('   - User existe:', !!req.session?.user);
  console.log('   - Session ID:', req.sessionID);
  console.log('   - Headers:', req.headers);
  
  if (req.session?.user) {
    console.log('   - Usuario:', req.session.user.name);
    console.log('   - ID:', req.session.user._id);
  }
  
  res.json({
    sessionExists: !!req.session,
    userExists: !!req.session?.user,
    sessionId: req.sessionID,
    user: req.session?.user ? {
      name: req.session.user.name,
      id: req.session.user._id,
      email: req.session.user.correo
    } : null
  });
});

// Obtener estado del usuario actual
router.get('/my-status', requireAuth, async (req, res) => {
  try {
    const userStatus = await UserStatus.getUserStatus(req.session.user._id);
    
    if (!userStatus) {
      // Crear estado por defecto si no existe
      const newStatus = await UserStatus.upsertStatus(req.session.user._id, {
        status: 'online',
        isActive: true
      });
      return res.json({ success: true, status: newStatus });
    }

    res.json({ success: true, status: userStatus });
  } catch (error) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Cambiar estado del usuario
router.post('/change-status', requireAuth, async (req, res) => {
  try {
    console.log('🔄 Cambio de estado solicitado:', req.body);
    console.log('✅ Usuario autenticado:', req.session.user.name);

    const { status, customStatus } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Estado requerido' 
      });
    }

    const userStatus = await UserStatus.getUserStatus(req.session.user._id);
    
    if (userStatus) {
      await userStatus.changeStatus(status, customStatus);
    } else {
      await UserStatus.upsertStatus(req.session.user._id, {
        status,
        customStatus,
        isActive: true
      });
    }

    // Obtener el estado actualizado
    const updatedStatus = await UserStatus.getUserStatus(req.session.user._id);
    
    res.json({ 
      success: true, 
      status: updatedStatus,
      message: 'Estado actualizado correctamente'
    });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Obtener lista de usuarios activos
router.get('/active-users', async (req, res) => {
  try {
    const activeUsers = await UserStatus.getActiveUsers();
    
    res.json({ 
      success: true, 
      users: activeUsers,
      count: activeUsers.length
    });
  } catch (error) {
    console.error('Error obteniendo usuarios activos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Obtener usuarios por estado específico
router.get('/users-by-status/:status', requireAuth, async (req, res) => {
  try {
    const { status } = req.params;
    const userStatusService = req.app.get('userStatusService');
    const users = await userStatusService.getUsersByStatus(status);
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error obteniendo usuarios por estado:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de estados
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userStatusService = req.app.get('userStatusService');
    const stats = await userStatusService.getStatusStats();
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estados disponibles
router.get('/available-statuses', requireAuth, async (req, res) => {
  try {
    const StatusType = require('../models/statusType');
    const statuses = await StatusType.getActiveStatuses();
    
    res.json({
      success: true,
      statuses: statuses
    });
  } catch (error) {
    console.error('Error obteniendo estados disponibles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Endpoint para heartbeat - mantener conexión activa
router.post('/heartbeat', requireAuth, async (req, res) => {
  try {
    console.log('💓 Heartbeat recibido de:', req.session.user.name);
    console.log('   - Timestamp:', req.body.timestamp);
    console.log('   - Last Sync:', req.body.lastSync);
    
    // Actualizar lastSeen del usuario
    const userStatus = await UserStatus.getUserStatus(req.session.user._id);
    if (userStatus) {
      await userStatus.updateActivity();
      console.log('✅ Actividad actualizada para heartbeat');
    }
    
    res.json({
      success: true,
      message: 'Heartbeat recibido',
      timestamp: new Date().toISOString(),
      sessionId: req.sessionID
    });
  } catch (error) {
    console.error('Error procesando heartbeat:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Endpoint para actualizar actividad del usuario
router.post('/update-activity', requireAuth, async (req, res) => {
  try {
    console.log('🔄 Actualizando actividad de:', req.session.user.name);
    console.log('   - Timestamp:', req.body.timestamp);
    
    // Actualizar lastSeen del usuario
    const userStatus = await UserStatus.getUserStatus(req.session.user._id);
    if (userStatus) {
      await userStatus.updateActivity();
      console.log('✅ Actividad actualizada');
    }
    
    res.json({
      success: true,
      message: 'Actividad actualizada',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error actualizando actividad:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Endpoint para sincronización de estado
router.post('/sync-status', requireAuth, async (req, res) => {
  try {
    console.log('🔄 Sincronización de estado solicitada por:', req.session.user.name);
    console.log('   - Estado actual:', req.body.status);
    console.log('   - Session ID:', req.sessionID);
    
    const { status, customStatus } = req.body;
    
    // Actualizar estado del usuario
    const userStatus = await UserStatus.getUserStatus(req.session.user._id);
    if (userStatus) {
      await userStatus.changeStatus(status, customStatus);
    } else {
      await UserStatus.upsertStatus(req.session.user._id, {
        status,
        customStatus,
        isActive: true
      });
    }
    
    // Obtener estado actualizado
    const updatedStatus = await UserStatus.getUserStatus(req.session.user._id);
    
    console.log('✅ Estado sincronizado exitosamente');
    
    res.json({
      success: true,
      status: updatedStatus,
      message: 'Estado sincronizado correctamente',
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sincronizando estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Actualizar actividad del usuario
router.post('/update-activity', requireAuth, async (req, res) => {
  try {
    const userStatus = await UserStatus.getUserStatus(req.session.user._id);
    
    if (userStatus) {
      await userStatus.updateActivity();
    } else {
      // Crear estado si no existe
      await UserStatus.upsertStatus(req.session.user._id, {
        status: 'online',
        isActive: true
      });
    }

    res.json({ success: true, message: 'Actividad actualizada' });
  } catch (error) {
    console.error('Error actualizando actividad:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Obtener estado de un usuario específico
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userStatus = await UserStatus.getUserStatus(userId);
    
    if (!userStatus) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estado de usuario no encontrado' 
      });
    }

    res.json({ success: true, status: userStatus });
  } catch (error) {
    console.error('Error obteniendo estado de usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Obtener historial de estados del usuario
router.get('/my-history', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const userStatus = await UserStatus.findOne({ userId: req.session.user._id });
    
    if (!userStatus) {
      return res.json({
        success: true,
        history: [],
        total: 0
      });
    }
    
    // Aquí podrías implementar un historial de cambios de estado
    // Por ahora retornamos el estado actual
    res.json({
      success: true,
      history: [userStatus],
      total: 1
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

module.exports = router; 