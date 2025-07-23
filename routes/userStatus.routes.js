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
    console.log('🔍 Obteniendo estado para usuario:', req.session.user.name);
    
    const userStatus = await UserStatus.getUserStatus(req.session.user._id);
    
    if (!userStatus) {
      console.log('⚠️ Usuario sin estado, creando estado por defecto...');
      // Crear estado por defecto si no existe
      const newStatus = await UserStatus.upsertStatus(req.session.user._id, {
        isActive: true,
        sessionId: req.sessionID
      });
      console.log('✅ Estado creado:', newStatus.status);
      return res.json({ success: true, status: newStatus });
    }

    console.log('✅ Estado encontrado:', userStatus.status);
    res.json({ success: true, status: userStatus });
  } catch (error) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Cambiar estado del usuario (sin requireAuth, solo Pub/Sub)
router.post('/change-status', async (req, res) => {
  try {
    const { userId, userName, status, customStatus } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ success: false, message: 'userId y status requeridos' });
    }
    const UserStatus = require('../models/userStatus');
    // Cambiar estado en la base de datos
    await UserStatus.upsertStatus(userId, {
      status,
      customStatus,
      isActive: status !== 'offline',
      lastSeen: new Date()
    });
    // Obtener estado actualizado
    const updatedStatus = await UserStatus.getUserStatus(userId);
    // Publicar evento MQTT
    const mqttService = req.app.get('mqttService');
    mqttService.publishUserStatusChange(userId, userName, status, updatedStatus.label, updatedStatus.color);
    // Publicar lista de usuarios activos
    const activeUsers = await UserStatus.getActiveUsers();
    mqttService.publishActiveUsersList(activeUsers);
    res.json({ success: true, status: updatedStatus, message: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Endpoint para login (sin requireAuth, solo Pub/Sub)
router.post('/login-pubsub', async (req, res) => {
  try {
    const { userId, userName } = req.body;
    if (!userId || !userName) {
      return res.status(400).json({ success: false, message: 'userId y userName requeridos' });
    }
    const UserStatus = require('../models/userStatus');
    await UserStatus.upsertStatus(userId, {
      status: 'online',
      isActive: true,
      lastSeen: new Date()
    });
    // Publicar evento MQTT
    const mqttService = req.app.get('mqttService');
    mqttService.publishUserConnected(userId, userName);
    // Publicar lista de usuarios activos
    const activeUsers = await UserStatus.getActiveUsers();
    mqttService.publishActiveUsersList(activeUsers);
    res.json({ success: true, message: 'Login Pub/Sub exitoso' });
  } catch (error) {
    console.error('Error en login Pub/Sub:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Endpoint para logout (sin requireAuth, solo Pub/Sub)
router.post('/logout-pubsub', async (req, res) => {
  try {
    const { userId, userName } = req.body;
    if (!userId || !userName) {
      return res.status(400).json({ success: false, message: 'userId y userName requeridos' });
    }
    const UserStatus = require('../models/userStatus');
    await UserStatus.upsertStatus(userId, {
      status: 'offline',
      isActive: false,
      lastSeen: new Date()
    });
    // Publicar evento MQTT
    const mqttService = req.app.get('mqttService');
    mqttService.publishUserDisconnected(userId, userName);
    // Publicar lista de usuarios activos
    const activeUsers = await UserStatus.getActiveUsers();
    mqttService.publishActiveUsersList(activeUsers);
    res.json({ success: true, message: 'Logout Pub/Sub exitoso' });
  } catch (error) {
    console.error('Error en logout Pub/Sub:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Endpoint para inicializar estados por defecto
router.post('/init-status-types', async (req, res) => {
  try {
    console.log('🔄 Inicializando tipos de estado por defecto...');
    
    const StatusType = require('../models/statusType');
    
    // Limpiar estados existentes y reinicializar
    await StatusType.deleteMany({});
    console.log('🧹 Estados existentes eliminados');
    
    await StatusType.initializeDefaultStatuses();
    
    const statuses = await StatusType.getActiveStatuses();
    console.log(`✅ ${statuses.length} tipos de estado inicializados`);
    
    res.json({
      success: true,
      message: 'Tipos de estado inicializados correctamente',
      statuses: statuses
    });
  } catch (error) {
    console.error('Error inicializando tipos de estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Endpoint para debug de roles
router.get('/debug-roles', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Verificando roles...');
    
    const User = require('../models/users');
    const Role = require('../models/roles');
    
    // Obtener todos los roles
    const allRoles = await Role.find({}, 'nombre _id');
    console.log('✅ Roles en BD:', allRoles.length);
    allRoles.forEach(role => {
      console.log(`   - ${role.nombre} (${role._id})`);
    });
    
    // Obtener usuarios con roles
    const usersWithRoles = await User.find({}, 'name correo role').populate('role', 'nombre');
    console.log('✅ Usuarios con roles:', usersWithRoles.length);
    
    usersWithRoles.forEach(user => {
      console.log(`👤 ${user.name} (${user.correo})`);
      console.log(`   - Rol ID: ${user.role}`);
      console.log(`   - Rol objeto:`, user.role);
      console.log(`   - Rol nombre: ${user.role?.nombre || 'Sin nombre'}`);
    });
    
    res.json({
      success: true,
      roles: allRoles,
      users: usersWithRoles,
      roleCount: allRoles.length,
      userCount: usersWithRoles.length
    });
  } catch (error) {
    console.error('Error en debug de roles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Endpoint de debug para ver todos los usuarios
router.get('/debug-all-users', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Solicitando todos los usuarios...');
    
    const User = require('../models/users');
    const allUsers = await User.find({}, 'name correo role active').populate('role', 'nombre');
    const allUserStatuses = await UserStatus.find().populate({
      path: 'userId',
      select: 'name correo role',
      populate: {
        path: 'role',
        select: 'nombre'
      }
    });
    
    console.log('✅ Usuarios en BD:', allUsers.length);
    console.log('✅ Estados de usuario:', allUserStatuses.length);
    
    // Log detallado de usuarios
    allUsers.forEach(user => {
      console.log(`👤 Usuario: ${user.name}`);
      console.log(`   - Email: ${user.correo}`);
      console.log(`   - Rol: ${user.role}`);
      console.log(`   - Rol nombre: ${user.role?.nombre}`);
      console.log(`   - Activo: ${user.active}`);
    });
    
    res.json({
      success: true,
      users: allUsers,
      userStatuses: allUserStatuses,
      userCount: allUsers.length,
      statusCount: allUserStatuses.length
    });
  } catch (error) {
    console.error('Error en debug:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Obtener lista de usuarios activos (sin requireAuth)
router.get('/active-users', async (req, res) => {
  try {
    const UserStatus = require('../models/userStatus');
    const activeUsers = await UserStatus.getActiveUsers();
    res.json({ success: true, users: activeUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
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

// Endpoint para inicializar estado del usuario
router.post('/init-status', requireAuth, async (req, res) => {
  try {
    console.log('🔄 Inicializando estado para usuario:', req.session.user.name);
    console.log('   - Session ID:', req.sessionID);
    
    // Verificar si ya existe un estado
    let userStatus = await UserStatus.getUserStatus(req.session.user._id);
    
    if (!userStatus) {
      console.log('⚠️ Usuario sin estado, creando estado inicial...');
      
      // Obtener el estado por defecto
      const StatusType = require('../models/statusType');
      const defaultStatus = await StatusType.getDefaultStatus();
      
      if (!defaultStatus) {
        console.log('⚠️ No hay estado por defecto, inicializando tipos de estado...');
        await StatusType.initializeDefaultStatuses();
      }
      
      userStatus = await UserStatus.upsertStatus(req.session.user._id, {
        isActive: true,
        sessionId: req.sessionID
      });
      console.log('✅ Estado inicial creado');
    } else {
      console.log('✅ Estado existente encontrado, actualizando actividad...');
      await userStatus.updateActivity();
      userStatus.sessionId = req.sessionID;
      await userStatus.save();
    }
    
    res.json({
      success: true,
      status: userStatus,
      message: 'Estado inicializado correctamente'
    });
  } catch (error) {
    console.error('Error inicializando estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Endpoint para forzar estado por defecto (limpia estado existente)
router.post('/force-default-status', requireAuth, async (req, res) => {
  try {
    console.log('🔄 Forzando estado por defecto para usuario:', req.session.user.name);
    console.log('   - Session ID:', req.sessionID);
    
    // Eliminar estado existente
    await UserStatus.deleteOne({ userId: req.session.user._id });
    console.log('🧹 Estado existente eliminado');
    
    // Obtener el estado por defecto
    const StatusType = require('../models/statusType');
    const defaultStatus = await StatusType.getDefaultStatus();
    
    if (!defaultStatus) {
      console.log('⚠️ No hay estado por defecto, inicializando tipos de estado...');
      await StatusType.initializeDefaultStatuses();
    }
    
    // Crear nuevo estado con el estado por defecto
    const userStatus = await UserStatus.upsertStatus(req.session.user._id, {
      isActive: true,
      sessionId: req.sessionID
    });
    
    console.log(`✅ Estado por defecto asignado: ${userStatus.status} (${userStatus.label})`);
    
    res.json({
      success: true,
      status: userStatus,
      message: 'Estado por defecto forzado correctamente'
    });
  } catch (error) {
    console.error('Error forzando estado por defecto:', error);
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
    
    // Aceptar cualquier estado sin validación
    console.log(`✅ Aceptando estado: ${status}`);
    
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
    
    // 🚨 EMITIR EVENTO EN TIEMPO REAL VIA MQTT
    try {
      const mqttService = req.app.get('mqttService');
      
      console.log('📤 Publicando cambio de estado via MQTT...');
      
      // Publicar cambio de estado
      const published = mqttService.publishUserStatusChange(
        req.session.user._id,
        req.session.user.name,
        status,
        updatedStatus.label,
        updatedStatus.color
      );
      
      if (published) {
        console.log('✅ Evento de cambio de estado publicado via MQTT');
        
        // También publicar lista actualizada de usuarios
        const UserStatus = require('../models/userStatus');
        const activeUsers = await UserStatus.getActiveUsers();
        mqttService.publishActiveUsersList(activeUsers);
        
      } else {
        console.log('⚠️ No se pudo publicar evento MQTT');
      }
      
    } catch (mqttError) {
      console.error('❌ Error emitiendo evento MQTT:', mqttError);
    }
    
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

// Obtener todos los usuarios con sus estados (solo administradores)
router.get('/all-users', requireAuth, async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.session.user.role !== 'administrador') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado. Solo administradores pueden ver esta información.' 
      });
    }

    console.log('👥 Administrador solicitando lista de usuarios activos...');

    // Obtener todos los usuarios con sus estados
    const userStatuses = await UserStatus.find({})
      .populate('userId', 'name email role avatar')
      .sort({ lastActivity: -1 });

    // Formatear la respuesta
    const users = userStatuses.map(userStatus => {
      const user = userStatus.userId;
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: userStatus.status,
        customStatus: userStatus.customStatus,
        lastActivity: userStatus.lastActivity,
        lastHeartbeat: userStatus.lastHeartbeat,
        isOnline: userStatus.isOnline,
        ipAddress: userStatus.ipAddress,
        sessionId: userStatus.sessionId
      };
    });

    console.log(`✅ ${users.length} usuarios encontrados`);

    res.json({ 
      success: true, 
      users: users 
    });
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Endpoint para marcar usuario como desconectado
router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userName = req.session.user.name;
    const UserStatus = require('../models/userStatus');
    // Marcar usuario como inactivo y offline
    await UserStatus.upsertStatus(userId, {
      status: 'offline',
      isActive: false
    });
    // 🚨 EMITIR EVENTOS SOLO POR MQTT (NO WEBSOCKET)
    try {
      const mqttService = req.app.get('mqttService');
      // Publicar usuario desconectado por MQTT
      mqttService.publishUserDisconnected(userId, userName);
      // Publicar lista de usuarios activos por MQTT
      const activeUsers = await UserStatus.getActiveUsers();
      mqttService.publishActiveUsersList(activeUsers);
    } catch (pubsubError) {
      console.error('❌ Error emitiendo eventos MQTT (desconexión):', pubsubError);
    }
    res.json({ success: true, message: 'Usuario desconectado correctamente' });
  } catch (error) {
    console.error('Error desconectando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener todos los roles (público)
router.get('/roles', async (req, res) => {
  try {
    const Role = require('../models/roles');
    const roles = await Role.find({}, 'nombre _id');
    res.json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

module.exports = router; 