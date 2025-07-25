const { Router } = require("express");
const router = Router();
const axios = require("axios");

const login = require("../controllers/general")
const userStatusRoutes = require("./userStatus.routes");
const statusTypeRoutes = require("./statusType.routes");
const User = require("../models/users");

// Rutas de estado de usuario
router.use("/api/user-status", userStatusRoutes);
router.use("/api/status-types", statusTypeRoutes);

// login and users
router.post("/api/login", login.form);

router.post("/api/addUser", login.makeUser);

router.post("/api/updateUser", login.updateUser);

router.post("/api/deleteUser", login.deletUser);

router.post("/api/token", login.userToken);

router.post("/api/exists", login.userEmailExist);

router.post("/api/role", login.role);

router.post("/api/roles", login.roles);

router.post("/api/allUsers", login.allUsers);

router.post("/api/change/role", login.roleChanger);

router.post("/api/makerRole", login.makerRole);

router.post("/api/change/stat", login.statChanger);

// Password management routes
router.post("/api/changePassword", login.changePassword);

// Utility route for development (remove in production)
router.post("/api/generateHash", login.generateHashedPassword);

// Ruta simple para verificar autenticación
router.get("/api/auth/check", (req, res) => {
  console.log('🔍🔍🔍 VERIFICANDO AUTENTICACIÓN 🔍🔍🔍');
  console.log('   - Session:', !!req.session);
  console.log('   - User:', !!req.session?.user);
  console.log('   - Session ID:', req.sessionID);
  console.log('   - Session data:', req.session);
  console.log('   - Cookies:', req.headers.cookie);
  
  if (req.session?.user) {
    console.log('✅ Usuario autenticado:', req.session.user.name);
    res.json({
      authenticated: true,
      user: {
        name: req.session.user.name,
        email: req.session.user.correo,
        id: req.session.user._id
      },
      sessionId: req.sessionID
    });
  } else {
    console.log('❌ Usuario no autenticado');
    res.json({
      authenticated: false,
      message: 'Usuario no autenticado',
      sessionId: req.sessionID,
      sessionKeys: Object.keys(req.session || {}),
      cookies: req.headers.cookie
    });
  }
});

// ENDPOINT DE PRUEBA SIMPLE
router.get("/api/test/session", (req, res) => {
  console.log('🧪🧪🧪 TEST SESSION ENDPOINT 🧪🧪🧪');
  console.log('   - Session ID:', req.sessionID);
  console.log('   - Session:', req.session);
  console.log('   - Headers:', req.headers);
  
  res.json({
    sessionId: req.sessionID,
    session: req.session,
    hasUser: !!req.session?.user,
    userName: req.session?.user?.name || 'No user'
  });
});

// ENDPOINT PARA DEBUGGEAR COOKIES
router.get("/api/test/cookies", (req, res) => {
  console.log('🍪🍪🍪 TEST COOKIES ENDPOINT 🍪🍪🍪');
  console.log('   - Cookies header:', req.headers.cookie);
  console.log('   - All headers:', req.headers);
  
  res.json({
    cookies: req.headers.cookie || 'No cookies',
    hasRememberMe: req.headers.cookie?.includes('rememberMe'),
    allHeaders: req.headers
  });
});

// Endpoint para sincronizar autenticación con sesión Express
router.post("/api/auth/sync-session", async (req, res) => {
  console.log('🔄 Sincronizando autenticación con sesión Express...');
  console.log('📥 Request body:', req.body);
  console.log('📥 Headers:', req.headers);
  
  const { token } = req.body;
  
  if (!token) {
    console.log('❌ No se recibió token en el body');
    return res.status(400).json({
      success: false,
      message: 'Token requerido'
    });
  }
  
  try {
    // Decodificar el JWT directamente
    const jwt = require("jsonwebtoken");
    const decoded = jwt.decode(token, "g8SlhhpH6O");
    
    console.log('🔍 Token decodificado:', decoded);
    console.log('🔍 ¿Tiene userId?:', !!decoded?.userId);
    console.log('🔍 ¿Tiene role?:', !!decoded?.role);
    
    if (decoded && decoded.userId) {
      console.log('✅ Token válido, userId:', decoded.userId);
      
      // Buscar usuario en la base de datos
      const user = await User.findOne({ _id: decoded.userId });
      
      if (user) {
        console.log('✅ Usuario encontrado:', user.name);
        
        // Guardar en sesión Express
        req.session.user = user;
        req.session.userId = user._id;
        req.session.userName = user.name;
        req.session.userEmail = user.correo;
        
        req.session.save((err) => {
          if (err) {
            console.error('❌ Error guardando sesión:', err);
            return res.status(500).json({
              success: false,
              message: 'Error guardando sesión'
            });
          }
          
          console.log('✅ Sesión sincronizada correctamente');
          console.log('   - User:', user.name);
          console.log('   - Session ID:', req.sessionID);
          
          res.json({
            success: true,
            user: {
              name: user.name,
              email: user.correo,
              id: user._id
            },
            sessionId: req.sessionID
          });
        });
      } else {
        console.log('❌ Usuario no encontrado en BD');
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado en la base de datos'
        });
      }
    } else {
      console.log('❌ Token inválido o sin userId');
      res.status(401).json({
        success: false,
        message: 'Token inválido o sin información de usuario'
      });
    }
  } catch (error) {
    console.error('❌ Error sincronizando sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor: ' + error.message
    });
  }
});

// Endpoint para inicializar WebSocket con sesión
router.post("/api/websocket/init", (req, res) => {
  console.log('🔄 Inicializando WebSocket con sesión...');
  console.log('   - Session:', !!req.session);
  console.log('   - User:', !!req.session?.user);
  console.log('   - Session ID:', req.sessionID);
  console.log('   - Session keys:', Object.keys(req.session || {}));
  
  if (req.session?.user) {
    console.log('✅ Usuario encontrado en sesión HTTP');
    res.json({
      success: true,
      user: {
        name: req.session.user.name,
        email: req.session.user.correo,
        id: req.session.user._id
      },
      sessionId: req.sessionID
    });
  } else {
    console.log('❌ No hay usuario en sesión HTTP');
    res.status(401).json({
      success: false,
      message: 'Usuario no autenticado',
      sessionId: req.sessionID,
      sessionKeys: Object.keys(req.session || {})
    });
  }
});

// 🚀 Endpoint para tipificación - SOLO MQTT/StateManager (NO BASE DE DATOS PARA ESTADOS)
router.get('/api/tipificacion/formulario', async (req, res) => {
  try {
    const params = req.query;
    console.log('📞 Nueva solicitud de tipificación:', params);
    
    // ✅ OBTENER USUARIOS CONECTADOS DESDE STATEMANAGER (MEMORIA)
    const stateManager = require('../services/stateManager');
    const connectedUsers = stateManager.getConnectedUsers();

    // Filtrar solo usuarios con statusType.category === 'work'
    const StatusType = require('../models/statusType');
    const UserStatus = require('../models/userStatus');
    const availableUsers = [];
    for (const user of connectedUsers) {
      console.log('🔍 Usuario conectado:', user);
      
      // Buscar el estado actual del usuario en la tabla userStatuses
      const userStatus = await UserStatus.findOne({ userId: user.userId });
      
      if (userStatus && userStatus.status) {
        console.log('🔍 UserStatus encontrado:', userStatus.status);
        
        // Buscar la categoría del status en StatusType
        const statusType = await StatusType.findOne({ value: userStatus.status, isActive: true });
        console.log('🔍 StatusType:', statusType);
        
        if (statusType && statusType.category === 'work') {
          availableUsers.push(user);
        }
      }
    }

    console.log('👥 Usuariosnectados enStateManager:', connectedUsers.length);
    console.log('👥 Usuarios disponibles para asignar:', availableUsers.length);
    availableUsers.forEach(user => {
      console.log(`  - ${user.name || user.userId}: conectado desde ${user.connectedAt}, status: ${user.status}`);
    });

    // 🎯 Seleccionar agente disponible (usuario conectado y disponible para trabajo)
    if (!availableUsers || availableUsers.length === 0) {
      console.warn('⚠️ No hay usuarios disponibles para asignar trabajo');
      return res.status(400).json({ 
        success: false, 
        message: 'No hay agentes disponibles (ningún usuario disponible para trabajar)' 
      });
    }

    // Usar el primer usuario disponible como agente asignado
    const assignedAgent = availableUsers[0];
    console.log('🎯 Agente asignado:', assignedAgent.name || assignedAgent.userId);
    
    // 🌳 Buscar árbol de tipificaciones desde BD
    const Tree = require('../models/tree');
    const arbolDocument = await Tree.getTipificacionesTree();
    const arbolTipificaciones = arbolDocument ? arbolDocument.root : [];
    
    console.log('🌳 Árbol de tipificaciones encontrado:', arbolTipificaciones ? 'SÍ' : 'NO');
    console.log('📊 Cantidad de nodos raíz:', arbolTipificaciones.length);
    
    // 📋 Crear historial básico para la nueva tipificación (solo el item actual)
    const historialNuevo = [
      {
        _id: Date.now(),
        idLlamada: params.idLlamada,
        cedula: params.cedula,
        tipoDocumento: params.tipoDocumento,
        observacion: params.observacion,
        createdAt: new Date(),
      }
    ];
    
    // 📡 ENVIAR POR MQTT AL AGENTE ASIGNADO
    const mqttService = req.app.get('mqttService');
    // Obtener el userId plano del agente (puede estar anidado o ser string)
    let userIdPlano;
    if (assignedAgent.userId && typeof assignedAgent.userId === 'object') {
      userIdPlano = assignedAgent.userId._id;
    } else {
      userIdPlano = assignedAgent.userId || assignedAgent._id;
    }
    console.log('DEBUG assignedAgent:', assignedAgent);
    console.log('DEBUG userIdPlano:', userIdPlano);
    const topic = `telefonia/tipificacion/nueva/${userIdPlano}`;
    
    const tipificacionData = {
      idLlamada: params.idLlamada,
      cedula: params.cedula,
      tipoDocumento: params.tipoDocumento,
      observacion: params.observacion,
      historial: [], // Se llenará después
      arbol: arbolTipificaciones, // ✅ Árbol real de la BD
      assignedTo: userIdPlano,
      assignedToName: assignedAgent.name || 'Usuario',
      timestamp: new Date().toISOString(),
      type: 'nueva_tipificacion'
    };
    
    console.log('📤 Enviando tipificación por MQTT:');
    console.log(`   - Topic: ${topic}`);
    console.log(`   - Agente: ${assignedAgent.name}`);
    console.log(`   - ID Llamada: ${params.idLlamada}`);
    console.log(`   - Árbol: ${arbolTipificaciones.length} nodos`);
    
    // 1. Crear la nueva tipificación (pending)
    const Tipificacion = require('../models/tipificacion');
    let tipificacionDoc = null;
    try {
      tipificacionDoc = await Tipificacion.create({
        idLlamada: params.idLlamada,
        cedula: params.cedula,
        tipoDocumento: params.tipoDocumento,
        observacion: params.observacion,
        nivel1: params.nivel1,
        nivel2: params.nivel2,
        nivel3: params.nivel3,
        nivel4: params.nivel4,
        nivel5: params.nivel5,
        historial: historialNuevo, // Solo el item actual
        arbol: arbolTipificaciones,
        assignedTo: userIdPlano,
        assignedToName: assignedAgent.name || 'Usuario',
        status: 'pending',
        timestamp: new Date(),
        type: 'nueva_tipificacion'
      });
      console.log('✅ Registro de tipificación creado en MongoDB (pending)');
    } catch (err) {
      console.error('❌ Error creando registro de tipificación:', err);
    }

    // 2. Buscar historial (ahora sí existe la nueva y las anteriores)
    let historialPrevio = [];
    try {
      console.log('Buscando historial para:', { idLlamada: params.idLlamada, cedula: params.cedula });
      historialPrevio = await Tipificacion.find({
        idLlamada: params.idLlamada,
        status: 'success',
        _id: { $ne: tipificacionDoc?._id }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
      console.log('Historial por idLlamada:', historialPrevio);
      if (historialPrevio.length === 0) {
        historialPrevio = await Tipificacion.find({
          cedula: params.cedula,
          status: 'success',
          _id: { $ne: tipificacionDoc?._id }
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
        console.log('Historial por cedula:', historialPrevio);
      }
    } catch (err) {
      console.error('❌ Error buscando historial de tipificaciones:', err);
    }

    // 3. Asigna el historial y publica MQTT
    tipificacionData.historial = historialPrevio;
    mqttService.publish(topic, tipificacionData);
    
    console.log('✅ Tipificación enviada exitosamente por MQTT');
    
    res.json({ 
      success: true, 
      assignedTo: userIdPlano,
      assignedToName: assignedAgent.name,
      historial: historialPrevio,
      message: `Tipificación enviada por MQTT a ${assignedAgent.name}`,
      method: 'StateManager + MQTT (sin BD para estados)'
    });
    
  } catch (error) {
    console.error('❌ Error en /api/tipificacion/formulario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Endpoint para actualizar tipificación (desde el frontend)
router.post('/api/tipificacion/actualizar', async (req, res) => {
  try {
    const { idLlamada, cedula, tipoDocumento, observacion, historial, arbol, assignedTo, nivel1, nivel2, nivel3, nivel4, nivel5 } = req.body;
    const Tipificacion = require('../models/tipificacion');
    // Buscar la tipificación pendiente por idLlamada y assignedTo
    const tip = await Tipificacion.findOne({ idLlamada, assignedTo, status: 'pending' });
    if (!tip) {
      return res.status(404).json({ success: false, message: 'Tipificación no encontrada' });
    }
    // Actualizar campos y marcar como success
    tip.cedula = cedula;
    tip.tipoDocumento = tipoDocumento;
    tip.observacion = observacion;
    tip.nivel1 = nivel1;
    tip.nivel2 = nivel2;
    tip.nivel3 = nivel3;
    tip.nivel4 = nivel4;
    tip.nivel5 = nivel5;
    tip.historial = historial || tip.historial;
    tip.arbol = arbol || tip.arbol;
    tip.status = 'success';
    await tip.save();
    res.json({ success: true, message: 'Tipificación actualizada', tipificacion: tip });
  } catch (error) {
    console.error('❌ Error actualizando tipificación:', error);
    res.status(500).json({ success: false, message: 'Error actualizando tipificación', error: error.message });
  }
});

// Endpoint para cancelar tipificación (desde el frontend)
router.post('/api/tipificacion/cancelar', async (req, res) => {
  try {
    const { idLlamada, assignedTo } = req.body;
    const Tipificacion = require('../models/tipificacion');
    // Buscar la tipificación pendiente por idLlamada y assignedTo
    const tip = await Tipificacion.findOne({ idLlamada, assignedTo, status: 'pending' });
    if (!tip) {
      return res.status(404).json({ success: false, message: 'Tipificación no encontrada o ya procesada' });
    }
    tip.status = 'cancelada_por_agente';
    await tip.save();
    res.json({ success: true, message: 'Tipificación cancelada por el agente', tipificacion: tip });
  } catch (error) {
    console.error('❌ Error cancelando tipificación:', error);
    res.status(500).json({ success: false, message: 'Error cancelando tipificación', error: error.message });
  }
});


module.exports = router;
