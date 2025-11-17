const { Router } = require("express");
const router = Router();
const axios = require("axios");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const login = require("../controllers/general")
const userStatusRoutes = require("./userStatus.routes");
const statusTypeRoutes = require("./statusType.routes");
const User = require("../models/users");
const Tipificacion = require("../models/tipificacion");

// 🕐 HELPER: Fechas en UTC-5 (Colombia)
const { getFechaColombia } = require('../utils/fechaColombia');

// 🔄 CONTADOR GLOBAL PARA ROUND ROBIN
let roundRobinCounter = 0;

// 🚨 HELPER PARA LOGS ESTRUCTURADOS TIPO MORGAN
const tipificacionLogger = {
  formatTimestamp: () => {
    const date = new Date();
    return date.toISOString().replace('T', ' ').substring(0, 19);
  },
  
  logDeployment: (req, agentInfo, tipificacionInfo, status, reason = null) => {
    const timestamp = tipificacionLogger.formatTimestamp();
    const method = 'TIPIF';
    const statusSymbol = status === 'success' ? '✅' : '❌';
    const statusText = status === 'success' ? 'DESPLEGADA' : 'RECHAZADA';
    
    let logLine = `${timestamp} ${statusSymbol} [${method}] ${statusText} | `;
    logLine += `idLlamada:${tipificacionInfo.idLlamada || 'N/A'} | `;
    logLine += `agente:${agentInfo.name || 'N/A'} (idAgent:${agentInfo.idAgent || 'N/A'}) | `;
    logLine += `userId:${agentInfo.userId || 'N/A'} | `;
    
    if (status === 'success') {
      logLine += `topic:telefonia/tipificacion/nueva/${agentInfo.userId} | `;
      logLine += `MQTT:${tipificacionInfo.mqttPublished ? 'PUBLISHED' : 'FAILED'} | `;
      logLine += `cedula:${tipificacionInfo.cedula || 'N/A'}`;
    } else {
      logLine += `RAZON:${reason || 'UNKNOWN'} | `;
      if (agentInfo.detailedReasons) {
        logLine += `detalles:[${agentInfo.detailedReasons.join(', ')}] | `;
      }
      if (agentInfo.timeSinceLastSeen) {
        logLine += `ultimaActividad:${agentInfo.timeSinceLastSeen}`;
      }
    }
    
    console.log(logLine);
  },
  
  logValidation: (req, stage, result, details = {}) => {
    const timestamp = tipificacionLogger.formatTimestamp();
    const symbol = result === 'pass' ? '✓' : '✗';
    let logLine = `${timestamp} ${symbol} [VALIDATE] ${stage} | `;
    
    if (result === 'pass') {
      logLine += `OK`;
    } else {
      logLine += `FAIL: ${details.message || 'Unknown error'}`;
    }
    
    if (Object.keys(details).length > 0) {
      logLine += ` | ${JSON.stringify(details)}`;
    }
    
    console.log(logLine);
  }
};

// 🔐 Middleware para verificar que el usuario sea administrador
const requireAdmin = async (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
  }
  
  try {
    // Verificar si el usuario tiene el rol de administrador
    if (req.session.user.role === 'admin' || req.session.user.role === 'administrador') {
      return next();
    }
    
    // Si no es admin por rol, verificar permisos específicos
    const Role = require('../models/role');
    const userRole = await Role.findById(req.session.user.role);
    
    if (!userRole) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado. No tienes permisos para gestionar el árbol de tipificación.' 
      });
    }
    
    // Verificar si tiene permiso admin.manageTree
    if (userRole.permissions?.admin?.manageTree === true) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. No tienes permisos para gestionar el árbol de tipificación.' 
    });
    
  } catch (error) {
    console.error('❌ Error verificando permisos:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error verificando permisos del usuario',
      error: error.message
    });
  }
};

// 📁 CONFIGURACIÓN DE MULTER PARA SUBIR ARCHIVOS
const upload = multer({
  dest: '/tmp/', // Usar directorio temporal del sistema
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir archivos JSON y CSV
    if (file.mimetype === 'application/json' || 
        file.mimetype === 'text/csv' ||
        file.originalname.endsWith('.json') || 
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos JSON y CSV'), false);
    }
  }
});

// Rutas de estado de usuario
router.use("/api/user-status", userStatusRoutes);
router.use("/api/status-types", statusTypeRoutes);

// login and users
router.post("/api/login", login.form);

router.post("/api/addUser", login.makeUser);

router.post("/api/updateUser", login.updateUser);

router.post("/api/checkUser", login.checkUser);

router.get("/api/listUsers", login.listUsers);

router.get("/api/checkUser/:id", login.checkUserById);

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
  
  if (req.session?.user) {
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
  
  res.json({
    sessionId: req.sessionID,
    session: req.session,
    hasUser: !!req.session?.user,
    userName: req.session?.user?.name || 'No user'
  });
});

// ENDPOINT PARA DEBUGGEAR COOKIES
router.get("/api/test/cookies", (req, res) => {
  
  res.json({
    cookies: req.headers.cookie || 'No cookies',
    hasRememberMe: req.headers.cookie?.includes('rememberMe'),
    allHeaders: req.headers
  });
});

// Endpoint para sincronizar autenticación con sesión Express
router.post("/api/auth/sync-session", async (req, res) => {
  
  const { token } = req.body;
  
  if (!token) {
    console.error('[AUTH] ❌ Error: Token requerido en sync-session', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      hasBody: !!req.body
    });
    return res.status(400).json({
      success: false,
      message: 'Token requerido'
    });
  }
  
  try {
    // Decodificar el JWT directamente
    const jwt = require("jsonwebtoken");
    const decoded = jwt.decode(token, "g8SlhhpH6O");
    
    
    if (decoded && decoded.userId) {
      
      // Buscar usuario en la base de datos
      const user = await User.findOne({ _id: decoded.userId });
      
      if (user) {
        
        // Guardar en sesión Express
        req.session.user = user;
        req.session.userId = user._id;
        req.session.userName = user.name;
        req.session.userEmail = user.correo;
        
        req.session.save((err) => {
          if (err) {
            console.error('[AUTH] ❌ Error guardando sesión:', {
              error: err.message,
              userId: user._id,
              sessionId: req.sessionID,
              ip: req.ip,
              timestamp: new Date().toISOString()
            });
            return res.status(500).json({
              success: false,
              message: 'Error guardando sesión'
            });
          }
          
          
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
        console.error('[AUTH] ❌ Error: Usuario no encontrado', {
          userId: decoded.userId,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado en la base de datos'
        });
      }
    } else {
      console.error('[AUTH] ❌ Error: Token inválido', {
        hasDecoded: !!decoded,
        hasUserId: decoded?.userId,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      res.status(401).json({
        success: false,
        message: 'Token inválido o sin información de usuario'
      });
    }
  } catch (error) {
    console.error('[AUTH] ❌ Error crítico sincronizando sesión:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor: ' + error.message
    });
  }
});

// Endpoint para inicializar WebSocket con sesión
router.post("/api/websocket/init", (req, res) => {
  
  if (req.session?.user) {
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
    res.status(401).json({
      success: false,
      message: 'Usuario no autenticado',
      sessionId: req.sessionID,
      sessionKeys: Object.keys(req.session || {})
    });
  }
});

// 🚀 Endpoint para GENERAR tipificación en Redis - Solo guarda datos
router.get('/api/tipificacion/formulario', async (req, res) => {
  try {
    const params = req.query;
    
    // 🚨 VALIDACIÓN: idAgent es requerido
    if (!params.idAgent) {
      return res.status(400).json({ 
        success: false, 
        message: 'El parámetro idAgent es obligatorio' 
      });
    }

    // 🔧 DECODIFICAR IDAGENT DEL SISTEMA TELEFÓNICO
    let idAgentReal = params.idAgent;
    try {
      const decodedIdAgent = decodeURIComponent(params.idAgent);
      const match = decodedIdAgent.match(/^(\d+)/);
      if (match && match[1]) {
        idAgentReal = match[1];
      }
    } catch (error) {
      console.error('❌ Error decodificando idAgent:', error);
    }
    
    // 🚨 VALIDAR QUE EL AGENTE EXISTA
    const User = require('../models/users');
    const assignedAgent = await User.findOne({ 
      idAgent: idAgentReal,
      active: true 
    }).lean();
    
    if (!assignedAgent) {
      return res.status(404).json({
        success: false,
        message: `Agente con idAgent ${idAgentReal} no encontrado`,
        error: 'AGENT_NOT_FOUND'
      });
    }
    
    // 🚀 GUARDAR EN REDIS (todos los datos tal cual vienen del sistema telefónico)
    const redisService = require('../services/redisService');
    const Tipificacion = require('../models/tipificacion');
    
    const tipificacionData = {
      ...params, // Guardar todos los parámetros recibidos
      idAgent: idAgentReal,
      assignedTo: assignedAgent._id,
      assignedToName: assignedAgent.name,
      timestamp: new Date().toISOString()
    };
    
    try {
      // 1. Guardar en Redis
      await redisService.addTipificacionPendiente(idAgentReal, tipificacionData);
      console.log(`✅ Tipificación ${params.idLlamada || 'N/A'} guardada en Redis para agente ${idAgentReal}`);
      
      // 2. 🚀 CREAR REGISTRO EN MONGODB CON STATUS 'pending' (para poder actualizarlo después)
      try {
        // Verificar si ya existe
        const existingTip = await Tipificacion.findOne({ 
          idLlamada: params.idLlamada, 
          assignedTo: assignedAgent._id 
        });
    
        if (!existingTip) {
          // Crear nuevo registro en MongoDB con status 'pending'
          await Tipificacion.create({
            idLlamada: params.idLlamada || `temp_${Date.now()}`,
            cedula: params.cedula || '',
            tipoDocumento: params.tipoDocumento || '',
            observacion: params.observacion || '',
            nivel1: params.nivel1 || '',
            nivel2: params.nivel2 || '',
            nivel3: params.nivel3 || '',
            nivel4: params.nivel4 || '',
            nivel5: params.nivel5 || '',
            historial: params.historial || [],
            arbol: params.arbol || [],
            assignedTo: assignedAgent._id,
            assignedToName: assignedAgent.name,
            nombres: params.nombres || '',
            apellidos: params.apellidos || '',
            fechaNacimiento: params.fechaNacimiento ? new Date(params.fechaNacimiento) : null,
            pais: params.pais || '',
            departamento: params.departamento || '',
            ciudad: params.ciudad || '',
            direccion: params.direccion || '',
            telefono: params.telefono || '',
            correo: params.correo || '',
            sexo: params.sexo || '',
            nivelEscolaridad: params.nivelEscolaridad || '',
            grupoEtnico: params.grupoEtnico || '',
            discapacidad: params.discapacidad || '',
            status: 'pending', // ⚠️ IMPORTANTE: status 'pending' para poder actualizarlo
            timestamp: getFechaColombia(),
            priority: params.priority || 1
          });
          console.log(`✅ Registro creado en MongoDB con status 'pending' para idLlamada ${params.idLlamada}`);
        } else {
          console.log(`ℹ️ Registro ya existe en MongoDB para idLlamada ${params.idLlamada}`);
        }
      } catch (mongoError) {
        console.error('⚠️ Error creando registro en MongoDB (continuando...):', mongoError.message);
        // Continuar aunque falle MongoDB, Redis es lo principal
      }
      
      // 3. 🚀 EMITIR EVENTO POR SOCKET.IO PARA ACTUALIZACIÓN EN TIEMPO REAL
      const io = req.app.get('io');
      if (io) {
        // Emitir a la sala del agente específico por idAgent
        io.to(`agent_${idAgentReal}`).emit('nueva_tipificacion', {
          idAgent: idAgentReal,
          tipificacion: tipificacionData,
          timestamp: new Date().toISOString()
        });
        console.log(`📡 Evento Socket.IO emitido para agente ${idAgentReal}`);
      }
      
      res.json({ 
        success: true, 
        message: `Tipificación guardada en Redis y MongoDB para ${assignedAgent.name}`,
        idAgent: idAgentReal,
        agentName: assignedAgent.name
      });
    } catch (redisError) {
      console.error('❌ Error guardando en Redis:', redisError);
      res.status(500).json({ 
        success: false, 
        message: 'Error guardando tipificación en Redis',
        error: redisError.message 
      });
    }
    
  } catch (error) {
    console.error('[TIPIFICACION] ❌ Error crítico:', error);
    res.status(500).json({ 
          success: false, 
      message: 'Error interno del servidor',
      error: error.message 
        });
      }
});

// 🚀 NUEVO ENDPOINT: GET /api/tipificacion/formulario/:idAgente
// Renderiza el formulario de tipificación directamente desde el backend con actualizaciones en tiempo real
router.get('/api/tipificacion/formulario/:idAgente', async (req, res) => {
  try {
    const { idAgente } = req.params;
    
    // Buscar agente por idAgent
    const User = require('../models/users');
    const redisService = require('../services/redisService');
    
    // Buscar agente
    const agent = await User.findOne({ 
      idAgent: idAgente,
      active: true 
    }).lean();
    
    if (!agent) {
      return res.status(404).render('error', {
        message: `Agente con idAgent ${idAgente} no encontrado`,
        error: 'AGENT_NOT_FOUND'
      });
    }
    
    // Obtener todas las tipificaciones pendientes desde Redis (sin remover)
    const tipificacionesPendientes = await redisService.getAllTipificacionesPendientes(idAgente);
    
    // 🚀 ENRIQUECER TIPIFICACIONES CON DATOS ACTUALIZADOS DEL CRM
    const Cliente = require('../models/cliente');
    const tipificacionesEnriquecidas = await Promise.all(
      tipificacionesPendientes.map(async (tip) => {
        // Si tiene cédula, buscar datos actualizados del cliente en el CRM
        if (tip.cedula) {
          try {
            const cliente = await Cliente.buscarPorCedula(tip.cedula);
            if (cliente) {
              // Enriquecer tipificación con datos actualizados del CRM
              return {
                ...tip,
                tipoDocumento: cliente.tipoDocumento || tip.tipoDocumento || '',
                nombres: cliente.nombres || tip.nombres || '',
                apellidos: cliente.apellidos || tip.apellidos || '',
                fechaNacimiento: cliente.fechaNacimiento || tip.fechaNacimiento || '',
                sexo: cliente.sexo || tip.sexo || '',
                pais: cliente.pais || tip.pais || 'Colombia',
                departamento: cliente.departamento || tip.departamento || '',
                ciudad: cliente.ciudad || tip.ciudad || '',
                direccion: cliente.direccion || tip.direccion || '',
                telefono: cliente.telefono || tip.telefono || '',
                correo: cliente.correo || tip.correo || '',
                nivelEscolaridad: cliente.nivelEscolaridad || tip.nivelEscolaridad || '',
                grupoEtnico: cliente.grupoEtnico || tip.grupoEtnico || '',
                discapacidad: cliente.discapacidad || tip.discapacidad || ''
    };
            }
          } catch (error) {
            console.error(`❌ Error enriqueciendo tipificación ${tip.idLlamada}:`, error);
          }
        }
        // Si no hay cliente en CRM, retornar tipificación original
        return tip;
      })
    );
    
    // Obtener árbol de tipificaciones
    const Tree = require('../models/tree');
    const arbolDocument = await Tree.getTipificacionesTree();
    const arbol = arbolDocument ? arbolDocument.root : [];
    
    // Obtener WebSocket URL para el frontend
    const wsUrl = process.env.WEBSOCKET_URL || `http://${req.get('host')}`;
    
    // Renderizar formulario con soporte para tiempo real (usar .html explícitamente)
    res.render('tipificacion-formulario.html', {
      agent: {
        idAgent: idAgente,
        name: agent.name,
        email: agent.correo,
        userId: agent._id
      },
      tipificaciones: tipificacionesEnriquecidas,
      arbol: arbol,
      hasTipificaciones: tipificacionesEnriquecidas.length > 0,
      websocketUrl: wsUrl,
      // Datos para JavaScript del frontend
      config: {
        idAgent: idAgente,
        agentId: agent._id.toString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error renderizando formulario de tipificación:', error);
    res.status(500).render('error', {
      message: 'Error cargando formulario de tipificación',
      error: error.message
    });
  }
});

// 🚀 ENDPOINT SSE: Server-Sent Events para actualizaciones en tiempo real
router.get('/api/tipificacion/stream/:idAgente', async (req, res) => {
  try {
    const { idAgente } = req.params;
    
    // Configurar headers para SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const redisService = require('../services/redisService');
    let lastCount = 0;
    
    // Función para enviar actualización
    const sendUpdate = async () => {
      try {
        const count = await redisService.countTipificacionesPendientes(idAgente);
        
        if (count !== lastCount) {
          const tipificacionesPendientes = await redisService.getAllTipificacionesPendientes(idAgente);
          
          // 🚀 ENRIQUECER TIPIFICACIONES CON DATOS ACTUALIZADOS DEL CRM (por cédula)
          const Cliente = require('../models/cliente');
          const tipificacionesEnriquecidas = await Promise.all(
            tipificacionesPendientes.map(async (tip) => {
              // Si tiene cédula, buscar datos actualizados del cliente en el CRM
              if (tip.cedula) {
                try {
                  const cliente = await Cliente.buscarPorCedula(tip.cedula);
                  if (cliente) {
                    // Enriquecer tipificación con datos actualizados del CRM
                    return {
                      ...tip,
                      tipoDocumento: cliente.tipoDocumento || tip.tipoDocumento || '',
                      nombres: cliente.nombres || tip.nombres || '',
                      apellidos: cliente.apellidos || tip.apellidos || '',
                      fechaNacimiento: cliente.fechaNacimiento || tip.fechaNacimiento || '',
                      sexo: cliente.sexo || tip.sexo || '',
                      pais: cliente.pais || tip.pais || 'Colombia',
                      departamento: cliente.departamento || tip.departamento || '',
                      ciudad: cliente.ciudad || tip.ciudad || '',
                      direccion: cliente.direccion || tip.direccion || '',
                      telefono: cliente.telefono || tip.telefono || '',
                      correo: cliente.correo || tip.correo || '',
                      nivelEscolaridad: cliente.nivelEscolaridad || tip.nivelEscolaridad || '',
                      grupoEtnico: cliente.grupoEtnico || tip.grupoEtnico || '',
                      discapacidad: cliente.discapacidad || tip.discapacidad || ''
                    };
                  }
                } catch (error) {
                  console.error(`❌ Error enriqueciendo tipificación ${tip.idLlamada} en SSE:`, error);
                }
              }
              // Si no hay cliente en CRM, retornar tipificación original
              return tip;
            })
          );
          
          res.write(`data: ${JSON.stringify({
            type: 'update',
            count: count,
            tipificaciones: tipificacionesEnriquecidas,
            timestamp: new Date().toISOString()
          })}\n\n`);
          lastCount = count;
        } else {
          // Heartbeat para mantener conexión viva
          res.write(`data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`);
        }
      } catch (error) {
        console.error('❌ Error en SSE:', error);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: error.message
        })}\n\n`);
      }
    };
    
    // Enviar actualización inicial
    await sendUpdate();
    
    // Enviar actualizaciones cada 2 segundos
    const interval = setInterval(async () => {
      if (!res.writableEnded) {
        await sendUpdate();
      } else {
        clearInterval(interval);
      }
    }, 2000);
    
    // Limpiar al cerrar conexión
    req.on('close', () => {
      clearInterval(interval);
      res.end();
      });
      
  } catch (error) {
    console.error('❌ Error en SSE stream:', error);
    res.status(500).end();
    }
});

// 🚀 Endpoint GET para obtener tipificaciones pendientes (para recarga inmediata)
router.get('/api/tipificacion/pendientes/:idAgente', async (req, res) => {
  try {
    const { idAgente } = req.params;
    const redisService = require('../services/redisService');
    
    // Obtener tipificaciones desde Redis
    const tipificacionesPendientes = await redisService.getAllTipificacionesPendientes(idAgente);
    
    // 🚀 ENRIQUECER TIPIFICACIONES CON DATOS ACTUALIZADOS DEL CRM (por cédula)
    const Cliente = require('../models/cliente');
    const tipificacionesEnriquecidas = await Promise.all(
      tipificacionesPendientes.map(async (tip) => {
        // Si tiene cédula, buscar datos actualizados del cliente en el CRM
        if (tip.cedula) {
          try {
            const cliente = await Cliente.buscarPorCedula(tip.cedula);
            if (cliente) {
              // Enriquecer tipificación con datos actualizados del CRM
              return {
                ...tip,
                tipoDocumento: cliente.tipoDocumento || tip.tipoDocumento || '',
                nombres: cliente.nombres || tip.nombres || '',
                apellidos: cliente.apellidos || tip.apellidos || '',
                fechaNacimiento: cliente.fechaNacimiento || tip.fechaNacimiento || '',
                sexo: cliente.sexo || tip.sexo || '',
                pais: cliente.pais || tip.pais || 'Colombia',
                departamento: cliente.departamento || tip.departamento || '',
                ciudad: cliente.ciudad || tip.ciudad || '',
                direccion: cliente.direccion || tip.direccion || '',
                telefono: cliente.telefono || tip.telefono || '',
                correo: cliente.correo || tip.correo || '',
                nivelEscolaridad: cliente.nivelEscolaridad || tip.nivelEscolaridad || '',
                grupoEtnico: cliente.grupoEtnico || tip.grupoEtnico || '',
                discapacidad: cliente.discapacidad || tip.discapacidad || ''
              };
            }
          } catch (error) {
            console.error(`❌ Error enriqueciendo tipificación ${tip.idLlamada}:`, error);
          }
        }
        // Si no hay cliente en CRM, retornar tipificación original
        return tip;
      })
    );
    
    res.json({
      success: true,
      tipificaciones: tipificacionesEnriquecidas,
      count: tipificacionesEnriquecidas.length
    });
      } catch (error) {
    console.error('❌ Error obteniendo tipificaciones pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tipificaciones pendientes',
      error: error.message
    });
  }
});

// 🚀 Endpoint GET para obtener historial de tipificaciones del cliente (por cédula)
// IMPORTANTE: Solo devuelve datos del cliente, NO información del agente
router.get('/api/tipificacion/historial/cliente/:cedula', async (req, res) => {
      try {
    const { cedula } = req.params;
    const { limite = 20 } = req.query;
    
    if (!cedula || cedula === '-') {
      return res.json({
        success: true,
        historial: [],
        count: 0
      });
      }
    
    const Tipificacion = require('../models/tipificacion');
    
    // Buscar TODAS las tipificaciones completadas del cliente (por cédula)
    // NO filtrar por agente, solo por cédula del cliente
    const historial = await Tipificacion.find({ 
      cedula: cedula,
      status: 'success'
    })
    .select('idLlamada cedula tipoDocumento nombres apellidos telefono correo observacion nivel1 nivel2 nivel3 nivel4 nivel5 timestamp') // Solo datos del cliente
    .sort({ timestamp: -1 }) // Más recientes primero
    .limit(parseInt(limite))
    .lean();
    
    res.json({ 
      success: true, 
      historial: historial,
      count: historial.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial del cliente:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo historial del cliente',
      error: error.message 
    });
  }
});

// Endpoint para actualizar tipificación (desde el frontend)
router.post('/api/tipificacion/actualizar', async (req, res) => {
  try {
    // 🚨 VALIDACIÓN: Parámetros requeridos
    if (!req.body.idLlamada || !req.body.assignedTo) {
      console.error('[TIPIFICACION] ❌ Error actualizando: Faltan parámetros requeridos', {
        hasIdLlamada: !!req.body.idLlamada,
        hasAssignedTo: !!req.body.assignedTo,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan parámetros requeridos: idLlamada y assignedTo son obligatorios' 
      });
    }
    // 🔧 DECODIFICAR CARACTERES ESPECIALES (tildes, acentos, etc.)
    const decodeText = (text) => {
      if (!text) return text;
      
      try {
        // 1. Decodificar URL encoding primero
        let decoded = decodeURIComponent(text);
        
        // 2. Decodificar HTML entities
        const entities = {
          '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
          '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
          '&ntilde;': 'ñ', '&Ntilde;': 'Ñ', '&uuml;': 'ü', '&Uuml;': 'Ü',
          '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
          // Entidades numéricas comunes
          '&#225;': 'á', '&#233;': 'é', '&#237;': 'í', '&#243;': 'ó', '&#250;': 'ú',
          '&#193;': 'Á', '&#201;': 'É', '&#205;': 'Í', '&#211;': 'Ó', '&#218;': 'Ú',
          '&#241;': 'ñ', '&#209;': 'Ñ'
        };
        
        decoded = decoded.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
          return entities[entity] || entity;
        });
        
        // 3. Limpiar caracteres de control y espacios extra
        decoded = decoded.replace(/\s+/g, ' ').trim();
        
        return decoded;
        
      } catch (error) {
        console.error(`❌ Error decodificando texto "${text}":`, error);
        return text; // Retornar original si hay error
      }
    };

    let { 
      idLlamada, cedula, tipoDocumento, observacion, historial, arbol, assignedTo, 
      nivel1, nivel2, nivel3, nivel4, nivel5,
      // Campos del cliente
      nombres, apellidos, fechaNacimiento, pais, departamento, ciudad, direccion,
      telefono, correo, sexo, nivelEscolaridad, grupoEtnico, discapacidad
    } = req.body;
    
    // Decodificar todos los campos de texto que pueden contener tildes
    const fieldsToDecode = [
      'nombres', 'apellidos', 'observacion', 'nivel1', 'nivel2', 'nivel3', 'nivel4', 'nivel5',
      'pais', 'departamento', 'ciudad', 'direccion', 'sexo', 'nivelEscolaridad', 
      'grupoEtnico', 'discapacidad'
    ];
    
    fieldsToDecode.forEach(field => {
      if (req.body[field]) {
        req.body[field] = decodeText(req.body[field], field);
        // Actualizar la variable también
        if (field === 'nombres') nombres = req.body[field];
        if (field === 'apellidos') apellidos = req.body[field];
        if (field === 'observacion') observacion = req.body[field];
        if (field === 'nivel1') nivel1 = req.body[field];
        if (field === 'nivel2') nivel2 = req.body[field];
        if (field === 'nivel3') nivel3 = req.body[field];
        if (field === 'nivel4') nivel4 = req.body[field];
        if (field === 'nivel5') nivel5 = req.body[field];
        if (field === 'pais') pais = req.body[field];
        if (field === 'departamento') departamento = req.body[field];
        if (field === 'ciudad') ciudad = req.body[field];
        if (field === 'direccion') direccion = req.body[field];
        if (field === 'sexo') sexo = req.body[field];
        if (field === 'nivelEscolaridad') nivelEscolaridad = req.body[field];
        if (field === 'grupoEtnico') grupoEtnico = req.body[field];
        if (field === 'discapacidad') discapacidad = req.body[field];
      }
    });
    
    // 🚀 BUSCAR TIPIFICACIÓN EN REDIS PRIMERO (nueva arquitectura)
    const redisService = require('../services/redisService');
    const User = require('../models/users');
    const Tipificacion = require('../models/tipificacion');
    
    // Obtener idAgent del usuario para buscar en Redis
    const user = await User.findById(assignedTo).lean();
    if (!user || !user.idAgent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado o sin idAgent' 
      });
    }
    
    // Buscar en Redis primero
    const tipificacionesRedis = await redisService.getAllTipificacionesPendientes(user.idAgent);
    let tipificacionData = tipificacionesRedis.find(t => 
      (t.idLlamada || t.id) === idLlamada
    );
    
    // Si no está en Redis, buscar en MongoDB (fallback)
    let tip = null;
    if (!tipificacionData) {
      tip = await Tipificacion.findOne({ idLlamada, assignedTo, status: 'pending' });
    if (!tip) {
      console.error('[TIPIFICACION] ❌ Error actualizando: Tipificación no encontrada', {
        idLlamada,
        assignedTo,
          idAgent: user.idAgent,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
        return res.status(404).json({ 
          success: false, 
          message: 'Tipificación no encontrada en Redis ni MongoDB' 
        });
      }
      // Convertir MongoDB doc a objeto plano
      tipificacionData = tip.toObject ? tip.toObject() : tip;
    }
    
    // 🎯 CRM: CREAR O ACTUALIZAR CLIENTE
    let clienteActualizado = null;
    if (cedula) {
      const Cliente = require('../models/cliente');
      
      // Datos del cliente para crear/actualizar
      const datosCliente = {
        cedula: cedula,
        tipoDocumento: tipoDocumento,
        nombres: nombres || '',
        apellidos: apellidos || '',
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        sexo: sexo || '',
        pais: pais || '',
        departamento: departamento || '',
        ciudad: ciudad || '',
        direccion: direccion || '',
        telefono: telefono || '',
        correo: correo || '',
        nivelEscolaridad: nivelEscolaridad || '',
        grupoEtnico: grupoEtnico || '',
        discapacidad: discapacidad || ''
      };
      
      try {
        // Crear o actualizar cliente
        clienteActualizado = await Cliente.crearOActualizar(datosCliente);
        
        // Agregar nueva interacción al cliente
        const nuevaInteraccion = {
          idLlamada: idLlamada,
          fecha: getFechaColombia(), // 🕐 UTC-5 (Colombia)
          tipo: 'tipificacion',
          observacion: observacion || '',
          agente: assignedTo,
          estado: 'completada',
          nivel1: nivel1 || '',
          nivel2: nivel2 || '',
          nivel3: nivel3 || '',
          nivel4: nivel4 || '',
          nivel5: nivel5 || '',
          arbol: arbol || []
        };
        
        await clienteActualizado.agregarInteraccion(nuevaInteraccion);
        
      } catch (error) {
        console.error('❌ Error actualizando cliente en CRM:', error);
        // Continuar sin fallar la tipificación
      }
    }
    
    // 🚀 GUARDAR EN MONGODB (crear o actualizar)
    let tipificacionDoc = null;
    try {
      // Buscar si ya existe en MongoDB
      tipificacionDoc = await Tipificacion.findOne({ idLlamada, assignedTo });
      
      if (tipificacionDoc) {
        // Actualizar existente
        tipificacionDoc.cedula = cedula;
        tipificacionDoc.tipoDocumento = tipoDocumento;
        tipificacionDoc.observacion = observacion;
        tipificacionDoc.nivel1 = nivel1;
        tipificacionDoc.nivel2 = nivel2;
        tipificacionDoc.nivel3 = nivel3;
        tipificacionDoc.nivel4 = nivel4;
        tipificacionDoc.nivel5 = nivel5;
        tipificacionDoc.historial = historial || tipificacionDoc.historial;
        tipificacionDoc.arbol = arbol || tipificacionDoc.arbol;
        tipificacionDoc.nombres = nombres || tipificacionDoc.nombres;
        tipificacionDoc.apellidos = apellidos || tipificacionDoc.apellidos;
        tipificacionDoc.fechaNacimiento = fechaNacimiento ? new Date(fechaNacimiento) : tipificacionDoc.fechaNacimiento;
        tipificacionDoc.pais = pais || tipificacionDoc.pais;
        tipificacionDoc.departamento = departamento || tipificacionDoc.departamento;
        tipificacionDoc.ciudad = ciudad || tipificacionDoc.ciudad;
        tipificacionDoc.direccion = direccion || tipificacionDoc.direccion;
        tipificacionDoc.telefono = telefono || tipificacionDoc.telefono;
        tipificacionDoc.correo = correo || tipificacionDoc.correo;
        tipificacionDoc.sexo = sexo || tipificacionDoc.sexo;
        tipificacionDoc.nivelEscolaridad = nivelEscolaridad || tipificacionDoc.nivelEscolaridad;
        tipificacionDoc.grupoEtnico = grupoEtnico || tipificacionDoc.grupoEtnico;
        tipificacionDoc.discapacidad = discapacidad || tipificacionDoc.discapacidad;
        tipificacionDoc.status = 'success';
        await tipificacionDoc.save();
      } else {
        // Crear nuevo registro
        tipificacionDoc = await Tipificacion.create({
          idLlamada,
          cedula,
          tipoDocumento,
          observacion,
          nivel1,
          nivel2,
          nivel3,
          nivel4,
          nivel5,
          historial: historial || [],
          arbol: arbol || [],
          assignedTo,
          assignedToName: user.name || '',
          nombres: nombres || '',
          apellidos: apellidos || '',
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
          pais: pais || '',
          departamento: departamento || '',
          ciudad: ciudad || '',
          direccion: direccion || '',
          telefono: telefono || '',
          correo: correo || '',
          sexo: sexo || '',
          nivelEscolaridad: nivelEscolaridad || '',
          grupoEtnico: grupoEtnico || '',
          discapacidad: discapacidad || '',
          status: 'success',
          timestamp: getFechaColombia()
        });
      }
    } catch (error) {
      console.error('❌ Error guardando en MongoDB:', error);
      // Continuar aunque falle MongoDB
    }
    
    // 🚀 REMOVER DE REDIS (ya fue atendida)
    try {
      const tipificacionId = tipificacionData.id || tipificacionData.idLlamada || idLlamada;
      await redisService.marcarTipificacionAtendida(user.idAgent, tipificacionId);
      console.log(`✅ Tipificación ${idLlamada} removida de Redis y guardada en MongoDB`);
    } catch (redisError) {
      console.error('❌ Error removiendo de Redis:', redisError);
      // Continuar aunque falle Redis
    }
    
    // Respuesta con información del CRM
    res.json({ 
      success: true, 
      message: 'Tipificación actualizada y guardada', 
      tipificacion: tipificacionDoc || tipificacionData,
      crm: {
        clienteActualizado: !!clienteActualizado,
        totalInteracciones: clienteActualizado?.totalInteracciones || 0
      }
    });
  } catch (error) {
    console.error('[TIPIFICACION] ❌ Error crítico actualizando tipificación:', {
      error: error.message,
      stack: error.stack,
      idLlamada: req.body.idLlamada,
      assignedTo: req.body.assignedTo,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: 'Error actualizando tipificación', error: error.message });
  }
});

// Endpoint para obtener cola de trabajo del agente
router.get('/api/tipificacion/cola/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Obtener tipificaciones pendientes del agente con cálculo de tiempo en cola
    const pendingTipificaciones = await Tipificacion.find({ 
      assignedTo: userId, 
      status: 'pending' 
    })
    .sort({ 
      priority: -1,      // Prioridad alta primero (5 -> 1)
      createdAt: 1       // Luego por antigüedad (FIFO)
    })
    .lean();
    
    // Calcular tiempo en cola para cada tipificación
    const now = new Date();
    pendingTipificaciones.forEach(tip => {
      const createdAt = new Date(tip.createdAt);
      tip.timeInQueue = Math.floor((now - createdAt) / (1000 * 60)); // en minutos
      
      // Determinar texto de prioridad
      tip.priorityText = tip.priority === 5 ? 'CRÍTICA' : 
                        tip.priority === 4 ? 'ALTA' : 
                        tip.priority === 3 ? 'MEDIA' : 
                        tip.priority === 2 ? 'NORMAL' : 'BAJA';
      
      // Color de prioridad para UI
      tip.priorityColor = tip.priority === 5 ? '#dc3545' : 
                         tip.priority === 4 ? '#fd7e14' : 
                         tip.priority === 3 ? '#ffc107' : 
                         tip.priority === 2 ? '#28a745' : '#6c757d';
    });
    
    // Obtener estadísticas generales
    const totalPending = await Tipificacion.countDocuments({ status: 'pending' });
    const agentCompleted = await Tipificacion.countDocuments({ 
      assignedTo: userId, 
      status: 'success' 
    });
    
    
    res.json({
      success: true,
      queue: pendingTipificaciones,
      stats: {
        pending: pendingTipificaciones.length,
        completed: agentCompleted,
        totalSystemPending: totalPending
      }
    });
    
  } catch (error) {
    console.error('[TIPIFICACION] ❌ Error obteniendo cola:', {
      error: error.message,
      userId: req.params.userId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo cola de trabajo',
      error: error.message 
    });
  }
});

// Endpoint para ver agentes conectados (DEBUG)
router.get('/api/agentes/conectados', async (req, res) => {
  try {
    const StatusType = require('../models/statusType');
    const UserStatus = require('../models/userStatus');
    const User = require('../models/users');
    const Tipificacion = require('../models/tipificacion');
    
    // 🚨 CAMBIO: BUSCAR DIRECTAMENTE EN LA BASE DE DATOS
    
    // Debug: mostrar todos los estados de trabajo
    const workStatusTypes = await StatusType.find({ category: 'work', isActive: true }).lean();
    
    const workStatusValues = workStatusTypes.map(st => st.value);
    
    // Buscar usuarios activos con estados de trabajo
    const activeUserStatuses = await UserStatus.find({ 
      isActive: true,
      status: { $in: workStatusValues }
    }).populate('userId').lean();
    
    
    const availableUsers = [];
    
    for (const userStatus of activeUserStatuses) {
      if (userStatus.userId) {
        const user = userStatus.userId;
        
        const statusType = await StatusType.findOne({ value: userStatus.status, isActive: true });
        
        if (statusType && statusType.category === 'work') {
          // Contar tipificaciones pendientes
          const pendingCount = await Tipificacion.countDocuments({ 
            assignedTo: user._id, 
            status: 'pending' 
          });
          
          availableUsers.push({
            userId: user._id,
            name: user.name,
            email: user.correo,
            userIdPlano: user._id,
            pendingCount,
            status: userStatus.status,
            category: statusType.category,
            socketId: userStatus.socketId,
            sessionId: userStatus.sessionId,
            lastSeen: userStatus.lastSeen
          });
        }
      }
    }
    
    // También mostrar información del stateManager para comparación
    const stateManager = require('../services/stateManager');
    const stateManagerUsers = stateManager.getConnectedUsers();
    
    
    res.json({
      success: true,
      totalConnected: activeUserStatuses.length,
      workAvailable: availableUsers.length,
      agents: availableUsers,
      workStatusTypes: workStatusTypes,
      roundRobinCounter: roundRobinCounter,
      debug: {
        stateManagerUsers: stateManagerUsers.length,
        dbUsers: activeUserStatuses.length,
        workStatusValues: workStatusValues
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo agentes conectados:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo agentes conectados',
      error: error.message 
    });
  }
});

// Endpoint para cancelar tipificación (desde el frontend)
router.post('/api/tipificacion/cancelar', async (req, res) => {
  try {
    const { idLlamada, assignedTo } = req.body;
    // Buscar la tipificación pendiente por idLlamada y assignedTo
    const tip = await Tipificacion.findOne({ idLlamada, assignedTo, status: 'pending' });
    if (!tip) {
      console.error('[TIPIFICACION] ❌ Error cancelando: Tipificación no encontrada', {
        idLlamada,
        assignedTo,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      return res.status(404).json({ success: false, message: 'Tipificación no encontrada o ya procesada' });
    }
    tip.status = 'cancelada_por_agente';
    await tip.save();
    res.json({ success: true, message: 'Tipificación cancelada por el agente', tipificacion: tip });
  } catch (error) {
    console.error('[TIPIFICACION] ❌ Error crítico cancelando tipificación:', {
      error: error.message,
      idLlamada: req.body.idLlamada,
      assignedTo: req.body.assignedTo,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: 'Error cancelando tipificación', error: error.message });
  }
});

// Endpoint para solicitar generación de reporte
router.post('/api/reportes/solicitar', async (req, res) => {
  try {
    const { fechaInicio, fechaFin, nombreArchivo } = req.body;
    const Report = require('../models/report');
    const user = req.session?.user || {};
    const nuevoReporte = await Report.create({
      fechaInicio,
      fechaFin,
      nombreArchivo,
      solicitadoPor: {
        correo: user.correo || '',
        userId: user._id || ''
      },
      status: 'pendiente'
    });
    res.json({ success: true, reporte: nuevoReporte });
  } catch (error) {
    console.error('[REPORTES] ❌ Error creando solicitud de reporte:', {
      error: error.message,
      fechaInicio: req.body.fechaInicio,
      fechaFin: req.body.fechaFin,
      usuario: req.session?.user?.name || 'No autenticado',
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: 'Error creando solicitud de reporte', error: error.message });
  }
});

// Endpoint para obtener los reportes solicitados por el usuario autenticado
router.get('/api/reportes/mis-reportes', async (req, res) => {
  try {
    const Report = require('../models/report');
    const user = req.session?.user || {};
    const query = [];
    if (user.correo) query.push({ 'solicitadoPor.correo': user.correo });
    if (user._id) query.push({ 'solicitadoPor.userId': user._id });
    const reportes = await Report.find(query.length ? { $or: query } : {})
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, reportes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo reportes', error: error.message });
  }
});

// 🚀 FUNCIÓN PARA ASIGNAR AUTOMÁTICAMENTE TIPIFICACIONES PENDIENTES
async function assignPendingTipificaciones() {
  try {
    
    // Obtener tipificaciones sin asignar (status: 'pending' y assignedTo: null o vacío)
    const unassignedTipificaciones = await Tipificacion.find({ 
      status: 'pending',
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null },
        { assignedTo: '' }
      ]
    })
    .sort({ 
      priority: -1,      // Prioridad alta primero (5 -> 1)
      createdAt: 1       // Luego por antigüedad (FIFO)
    })
    .lean();
    
    if (unassignedTipificaciones.length === 0) {
      return { assigned: 0, message: 'No hay tipificaciones pendientes' };
    }
    
    
    // 🚨 CAMBIO: OBTENER USUARIOS ACTIVOS DIRECTAMENTE DE LA BASE DE DATOS
    const StatusType = require('../models/statusType');
    const UserStatus = require('../models/userStatus');
    const User = require('../models/users');
    
    // Obtener estados de trabajo
    const workStatusTypes = await StatusType.find({ category: 'work', isActive: true }).lean();
    const workStatusValues = workStatusTypes.map(st => st.value);
    
    
    // BUSCAR USUARIOS ACTIVOS CON ESTADOS DE TRABAJO DIRECTAMENTE EN BD
    const activeUserStatuses = await UserStatus.find({ 
      isActive: true,
      status: { $in: workStatusValues }
    }).populate('userId').lean();
    
    
    if (activeUserStatuses.length === 0) {
      return { assigned: 0, message: 'No hay agentes disponibles' };
    }
    
    // Transformar a formato compatible
    const availableUsers = [];
    for (const userStatus of activeUserStatuses) {
      if (userStatus.userId) {
        availableUsers.push({
          userId: userStatus.userId._id,
          name: userStatus.userId.name,
          email: userStatus.userId.correo,
          status: userStatus.status,
          socketId: userStatus.socketId,
          sessionId: userStatus.sessionId
        });
      }
    }
    
    if (availableUsers.length === 0) {
      return { assigned: 0, message: 'No hay agentes disponibles' };
    }
    
    
    // Obtener carga de trabajo actual de cada agente
    const agentWorkloads = await Promise.all(
      availableUsers.map(async (user) => {
        let userIdPlano;
        if (user.userId && typeof user.userId === 'object') {
          userIdPlano = user.userId._id;
        } else {
          userIdPlano = user.userId || user._id;
        }
        
        const pendingCount = await Tipificacion.countDocuments({ 
          assignedTo: userIdPlano, 
          status: 'pending' 
        });
        
        return {
          agent: user,
          userId: userIdPlano,
          pendingCount,
          name: user.name || user.userId
        };
      })
    );
    
    // Usar todos los agentes disponibles (sin limitación de cantidad)
    const availableAgents = agentWorkloads;
    
    if (availableAgents.length === 0) {
      return { assigned: 0, message: 'No hay agentes disponibles' };
    }
    
    
    // Asignar tipificaciones usando round robin
    let assignedCount = 0;
    const mqttService = require('../services/mqttService');
    
    for (let i = 0; i < unassignedTipificaciones.length && assignedCount < availableAgents.length; i++) {
      const tipificacion = unassignedTipificaciones[i];
      const agentIndex = assignedCount % availableAgents.length;
      const selectedAgent = availableAgents[agentIndex];
      
      // Actualizar la tipificación con el agente asignado
      await Tipificacion.findByIdAndUpdate(tipificacion._id, {
        assignedTo: selectedAgent.userId,
        assignedToName: selectedAgent.name
      });
      
      // Preparar datos para MQTT
      const tipificacionData = {
        ...tipificacion,
        assignedTo: selectedAgent.userId,
        assignedToName: selectedAgent.name,
        historial: tipificacion.historial || []
      };
      
      // Publicar por MQTT al agente específico
      const topic = `telefonia/tipificacion/nueva/${selectedAgent.userId}`;
      if (mqttService && mqttService.publish) {
        mqttService.publish(topic, tipificacionData);
      }
      
      assignedCount++;
    }
    
    return { 
      assigned: assignedCount, 
      message: `${assignedCount} tipificaciones asignadas automáticamente`,
      agents: availableAgents.map(a => ({ name: a.name, pendingCount: a.pendingCount }))
    };
    
  } catch (error) {
    console.error('❌ Error en asignación automática:', error);
    return { assigned: 0, message: 'Error en asignación automática', error: error.message };
  }
}

// Endpoint para forzar asignación de tipificaciones pendientes
router.post('/api/tipificacion/assign-pending', async (req, res) => {
  try {
    const result = await assignPendingTipificaciones();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Error forzando asignación:', error);
    res.status(500).json({
      success: false,
      message: 'Error forzando asignación de tipificaciones',
      error: error.message
    });
  }
});

// 🎯 ENDPOINTS CRM - GESTIÓN DE CLIENTES

// Endpoint para actualizar datos del cliente (desde modal de edición)
router.post('/api/crm/cliente/actualizar', async (req, res) => {
  try {
    const {
      cedula,
      tipoDocumento,
      nombres,
      apellidos,
      fechaNacimiento,
      sexo,
      pais,
      departamento,
      ciudad,
      direccion,
      telefono,
      correo,
      nivelEscolaridad,
      grupoEtnico,
      discapacidad
    } = req.body;

    if (!cedula) {
      return res.status(400).json({
        success: false,
        message: 'La cédula es obligatoria'
      });
    }

    const Cliente = require('../models/cliente');
    
    // Datos del cliente para crear/actualizar
    const datosCliente = {
      cedula: cedula,
      tipoDocumento: tipoDocumento || '',
      nombres: nombres || '',
      apellidos: apellidos || '',
      fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
      sexo: sexo || '',
      pais: pais || 'Colombia',
      departamento: departamento || '',
      ciudad: ciudad || '',
      direccion: direccion || '',
      telefono: telefono || '',
      correo: correo || '',
      nivelEscolaridad: nivelEscolaridad || '',
      grupoEtnico: grupoEtnico || '',
      discapacidad: discapacidad || ''
    };

    // Crear o actualizar cliente en el CRM
    const clienteActualizado = await Cliente.crearOActualizar(datosCliente);

    res.json({
      success: true,
      message: 'Cliente actualizado correctamente en el CRM',
      cliente: {
        _id: clienteActualizado._id,
        cedula: clienteActualizado.cedula,
        tipoDocumento: clienteActualizado.tipoDocumento,
        nombres: clienteActualizado.nombres,
        apellidos: clienteActualizado.apellidos,
        fechaNacimiento: clienteActualizado.fechaNacimiento,
        sexo: clienteActualizado.sexo,
        pais: clienteActualizado.pais,
        departamento: clienteActualizado.departamento,
        ciudad: clienteActualizado.ciudad,
        direccion: clienteActualizado.direccion,
        telefono: clienteActualizado.telefono,
        correo: clienteActualizado.correo,
        nivelEscolaridad: clienteActualizado.nivelEscolaridad,
        grupoEtnico: clienteActualizado.grupoEtnico,
        discapacidad: clienteActualizado.discapacidad,
        fechaUltimaInteraccion: clienteActualizado.fechaUltimaInteraccion,
        totalInteracciones: clienteActualizado.totalInteracciones
      }
    });
  } catch (error) {
    console.error('❌ Error actualizando cliente en CRM:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando cliente en el CRM',
      error: error.message
    });
  }
});

// Endpoint para buscar cliente por cédula
router.get('/api/crm/cliente/:cedula', async (req, res) => {
  try {
    const { cedula } = req.params;
    const Cliente = require('../models/cliente');
    
    const cliente = await Cliente.buscarPorCedula(cedula);
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }
    
    // Obtener historial completo
    const historial = cliente.obtenerHistorial(20); // Últimas 20 interacciones
    
    res.json({
      success: true,
      cliente: {
        _id: cliente._id,
        cedula: cliente.cedula,
        tipoDocumento: cliente.tipoDocumento,
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        fechaNacimiento: cliente.fechaNacimiento,
        sexo: cliente.sexo,
        pais: cliente.pais,
        departamento: cliente.departamento,
        ciudad: cliente.ciudad,
        direccion: cliente.direccion,
        telefono: cliente.telefono,
        correo: cliente.correo,
        nivelEscolaridad: cliente.nivelEscolaridad,
        grupoEtnico: cliente.grupoEtnico,
        discapacidad: cliente.discapacidad,
        fechaCreacion: cliente.fechaCreacion,
        fechaUltimaInteraccion: cliente.fechaUltimaInteraccion,
        totalInteracciones: cliente.totalInteracciones,
        activo: cliente.activo,
        notas: cliente.notas
      },
      historial: historial
    });
  } catch (error) {
    console.error('❌ Error buscando cliente:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error buscando cliente',
      error: error.message 
    });
  }
});

// Endpoint para obtener historial de interacciones de un cliente
router.get('/api/crm/cliente/:cedula/historial', async (req, res) => {
  try {
    const { cedula } = req.params;
    const { limite = 10, offset = 0 } = req.query;
    
    const Cliente = require('../models/cliente');
    const cliente = await Cliente.buscarPorCedula(cedula);
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }
    
    const historial = cliente.interacciones
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limite));
    
    res.json({
      success: true,
      historial: historial,
      total: cliente.totalInteracciones,
      limite: parseInt(limite),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo historial',
      error: error.message 
    });
  }
});

// Endpoint para agregar nota a un cliente
router.post('/api/crm/cliente/:cedula/nota', async (req, res) => {
  try {
    const { cedula } = req.params;
    const { contenido, agente } = req.body;
    
    if (!contenido) {
      return res.status(400).json({ 
        success: false, 
        message: 'El contenido de la nota es obligatorio' 
      });
    }
    
    const Cliente = require('../models/cliente');
    const cliente = await Cliente.buscarPorCedula(cedula);
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }
    
    // Agregar nota
    cliente.notas.push({
      fecha: getFechaColombia(), // 🕐 UTC-5 (Colombia)
      agente: agente || null,
      contenido: contenido
    });
    
    await cliente.save();
    
    res.json({
      success: true,
      message: 'Nota agregada correctamente',
      nota: cliente.notas[cliente.notas.length - 1]
    });
  } catch (error) {
    console.error('❌ Error agregando nota:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error agregando nota',
      error: error.message 
    });
  }
});

// Endpoint para buscar clientes (búsqueda general)
router.get('/api/crm/clientes', async (req, res) => {
  try {
    const { 
      q = '', // Query de búsqueda
      limite = 20, 
      offset = 0,
      ordenar = 'fechaUltimaInteraccion',
      direccion = 'desc'
    } = req.query;
    
    const Cliente = require('../models/cliente');
    
    // Construir filtro de búsqueda
    let filtro = { activo: true };
    
    if (q) {
      filtro.$or = [
        { cedula: { $regex: q, $options: 'i' } },
        { nombres: { $regex: q, $options: 'i' } },
        { apellidos: { $regex: q, $options: 'i' } },
        { correo: { $regex: q, $options: 'i' } },
        { telefono: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Construir ordenamiento
    const sort = {};
    sort[ordenar] = direccion === 'desc' ? -1 : 1;
    
    const clientes = await Cliente.find(filtro)
      .sort(sort)
      .limit(parseInt(limite))
      .skip(parseInt(offset))
      .select('cedula tipoDocumento nombres apellidos telefono correo fechaUltimaInteraccion totalInteracciones');
    
    const total = await Cliente.countDocuments(filtro);
    
    res.json({
      success: true,
      clientes: clientes,
      total: total,
      limite: parseInt(limite),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('❌ Error buscando clientes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error buscando clientes',
      error: error.message 
    });
  }
});

// 🧪 ENDPOINT DE PRUEBA PARA CRM
router.get('/api/test/crm', async (req, res) => {
  try {
    
    const Cliente = require('../models/cliente');
    
    const datosPrueba = {
      cedula: '123456789',
      tipoDocumento: 'CC',
      nombres: 'Cliente Prueba',
      apellidos: 'Test',
      telefono: '3000000000',
      correo: 'prueba@test.com'
    };
    
    
    const cliente = await Cliente.crearOActualizar(datosPrueba);
    
    res.json({
      success: true,
      message: 'Cliente de prueba creado exitosamente',
      cliente: {
        _id: cliente._id,
        cedula: cliente.cedula,
        nombres: cliente.nombres,
        apellidos: cliente.apellidos
      }
    });
    
  } catch (error) {
    console.error('❌ Error en prueba CRM:', error);
    res.status(500).json({
      success: false,
      message: 'Error en prueba CRM',
      error: error.message
    });
  }
});

// 🌳 ENDPOINTS PARA ADMINISTRAR ÁRBOL DE TIPIFICACIÓN

// Función para convertir CSV a estructura JSON jerárquica
function csvToJsonTree(csvData) {
  // 🔧 DECODIFICAR CARACTERES ESPECIALES EN CSV
  const decodeText = (text) => {
    if (!text) return text;
    
    try {
      // 1. Intentar diferentes decodificaciones
      let decoded = text;
      
      // Si contiene caracteres de reemplazo UTF-8, intentar recuperar
      if (text.includes('')) {
        try {
          decoded = Buffer.from(text, 'latin1').toString('utf8');
        } catch (e) {
        }
      }
      
      // 2. Decodificar URL encoding
      try {
        const urlDecoded = decodeURIComponent(decoded);
        if (urlDecoded !== decoded) {
          decoded = urlDecoded;
        }
      } catch (e) {
      }
      
      // 3. Decodificar HTML entities
      const entities = {
        '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
        '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
        '&ntilde;': 'ñ', '&Ntilde;': 'Ñ', '&uuml;': 'ü', '&Uuml;': 'Ü',
        '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
        // Entidades numéricas comunes
        '&#225;': 'á', '&#233;': 'é', '&#237;': 'í', '&#243;': 'ó', '&#250;': 'ú',
        '&#193;': 'Á', '&#201;': 'É', '&#205;': 'Í', '&#211;': 'Ó', '&#218;': 'Ú',
        '&#241;': 'ñ', '&#209;': 'Ñ'
      };
      
      const beforeEntities = decoded;
      decoded = decoded.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
        return entities[entity] || entity;
      });
      if (beforeEntities !== decoded) {
      }
      
      // 4. Limpiar caracteres de control y espacios extra
      decoded = decoded.replace(/\s+/g, ' ').trim();
      
      return decoded;
      
    } catch (error) {
      console.error(`❌ CSV: Error decodificando texto "${text}":`, error);
      return text; // Retornar original si hay error
    }
  };

  const tree = [];
  const nodeMap = new Map();
  
  
  csvData.forEach((row, rowIndex) => {
    // Decodificar cada nivel del CSV
    const levels = [
      row.nivel1,
      row.nivel2, 
      row.nivel3,
      row.nivel4,
      row.nivel5
    ].map(level => level ? decodeText(level) : level)
     .filter(level => level && level.trim() !== '');
    
    
    let currentPath = '';
    let parentNode = null;
    
    levels.forEach((level, index) => {
      const path = currentPath + (currentPath ? '|' : '') + level;
      const value = path.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      if (!nodeMap.has(path)) {
        const newNode = {
          value: value,
          label: level, // ✅ Usar el nivel decodificado
          children: []
        };
        
        nodeMap.set(path, newNode);
        
        if (index === 0) {
          // Es un nodo raíz
          tree.push(newNode);
        } else if (parentNode) {
          // Es un nodo hijo
          parentNode.children.push(newNode);
        }
      }
      
      parentNode = nodeMap.get(path);
      currentPath = path;
    });
  });
  
  return tree;
}

// Endpoint de prueba para verificar que el servidor funciona
router.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para crear árbol de tipificación (solo para administradores)
router.post('/api/tree/create', requireAdmin, async (req, res) => {
  try {
    
    // Crear un árbol simple desde datos CSV predefinidos
    const csvData = [
      { nivel1: 'Consulta', nivel2: 'General', nivel3: '', nivel4: '', nivel5: '' },
      { nivel1: 'Consulta', nivel2: 'Académica', nivel3: 'Matrícula', nivel4: '', nivel5: '' },
      { nivel1: 'Consulta', nivel2: 'Académica', nivel3: 'Programas', nivel4: '', nivel5: '' },
      { nivel1: 'Consulta', nivel2: 'Administrativa', nivel3: 'Pagos', nivel4: '', nivel5: '' },
      { nivel1: 'Reclamo', nivel2: 'Académico', nivel3: 'Calificaciones', nivel4: '', nivel5: '' },
      { nivel1: 'Reclamo', nivel2: 'Académico', nivel3: 'Profesores', nivel4: '', nivel5: '' },
      { nivel1: 'Reclamo', nivel2: 'Administrativo', nivel3: 'Servicio', nivel4: '', nivel5: '' },
      { nivel1: 'Reclamo', nivel2: 'Administrativo', nivel3: 'Atención', nivel4: '', nivel5: '' },
      { nivel1: 'Sugerencia', nivel2: 'Mejoras', nivel3: '', nivel4: '', nivel5: '' },
      { nivel1: 'Solicitud', nivel2: 'Información', nivel3: '', nivel4: '', nivel5: '' },
      { nivel1: 'Solicitud', nivel2: 'Documentos', nivel3: '', nivel4: '', nivel5: '' }
    ];
    
    
    // Convertir CSV a estructura JSON jerárquica
    const treeData = csvToJsonTree(csvData);
    
    // Actualizar o crear el árbol en la base de datos
    const Tree = require('../models/tree');
    
    // Buscar el árbol existente para actualizarlo
    let existingTree = await Tree.findOne({ name: 'tipificaciones' });
    
    if (existingTree) {
      // ✅ ACTUALIZAR el árbol existente
      existingTree.description = 'Árbol de tipificaciones actualizado';
      existingTree.isActive = true;
      existingTree.root = treeData;
      existingTree.updatedAt = new Date();
      
      const savedTree = await existingTree.save();
    } else {
      // Solo crear si no existe
      const newTree = new Tree({
        name: 'tipificaciones',
        description: 'Árbol de tipificaciones actualizado',
        isActive: true,
        root: treeData
      });
      
      const savedTree = await newTree.save();
    }
    
    res.json({
      success: true,
      message: 'Árbol de tipificación creado exitosamente',
      tree: {
        _id: savedTree._id,
        name: savedTree.name,
        description: savedTree.description,
        isActive: savedTree.isActive,
        root: savedTree.root,
        createdAt: savedTree.createdAt,
        updatedAt: savedTree.updatedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error creando árbol:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Endpoint de prueba simple sin multer
router.post('/api/simple-test', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Endpoint simple funcionando',
      body: req.body,
      headers: req.headers
    });
  } catch (error) {
    console.error('❌ Error en prueba simple:', error);
    res.status(500).json({
      success: false,
      message: 'Error en prueba simple',
      error: error.message
    });
  }
});

// Endpoint de prueba sin multer para recibir archivos
router.post('/api/raw-upload', (req, res) => {
  try {
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      res.json({
        success: true,
        message: 'Raw upload recibido',
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        bodyLength: body.length
      });
    });
  } catch (error) {
    console.error('❌ Error en raw upload:', error);
    res.status(500).json({
      success: false,
      message: 'Error en raw upload',
      error: error.message
    });
  }
});

// Endpoint de prueba para subir archivos
router.post('/api/test-upload', upload.any(), (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Archivo recibido correctamente',
      files: req.files ? req.files.map(f => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size
      })) : null
    });
  } catch (error) {
    console.error('❌ Error en prueba de upload:', error);
    res.status(500).json({
      success: false,
      message: 'Error en prueba de upload',
      error: error.message
    });
  }
});


// Endpoint para obtener el árbol actual
router.get('/api/tree', async (req, res) => {
  try {
    
    const Tree = require('../models/tree');
    
    // Buscar el árbol más reciente y activo
    let arbolDocument = await Tree.findOne({ isActive: true }).sort({ updatedAt: -1 }).lean();
    
    if (!arbolDocument) {
      // Si no hay ningún árbol, crear uno por defecto
      const defaultTree = new Tree({
        name: 'tipificaciones',
        description: 'Árbol de tipificaciones por defecto',
        isActive: true,
        root: [
          {
            value: 'consulta',
            label: 'Consulta',
            children: [
              {
                value: 'consulta_general',
                label: 'General',
                children: []
              }
            ]
          }
        ]
      });
      
      arbolDocument = await defaultTree.save();
    }
    
    
    res.json({
      success: true,
      tree: {
        _id: arbolDocument._id,
        name: arbolDocument.name,
        description: arbolDocument.description,
        isActive: arbolDocument.isActive,
        root: arbolDocument.root,
        createdAt: arbolDocument.createdAt,
        updatedAt: arbolDocument.updatedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo árbol:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Endpoint para subir archivo JSON del árbol de tipificación (sin multer para evitar errores)
router.post('/api/tree/upload', async (req, res) => {
  try {
    
    const { tree, fileName } = req.body;
    
    if (!tree) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó el árbol en la petición'
      });
    }
    
    
    let treeData;
    
    // Si el árbol viene con estructura completa (name, description, root)
    if (tree.root && Array.isArray(tree.root)) {
      treeData = tree.root;
    } 
    // Si el árbol es directamente un array de nodos
    else if (Array.isArray(tree)) {
      treeData = tree;
    } 
    else {
      return res.status(400).json({
        success: false,
        message: 'Formato de árbol inválido. Debe ser un array de nodos o un objeto con propiedad "root"'
      });
    }
    
    
    // Validar estructura del árbol
    if (!treeData || !Array.isArray(treeData)) {
      return res.status(400).json({
        success: false,
        message: 'El archivo debe contener un array de nodos raíz'
      });
    }
    
    // Validar estructura de cada nodo
    const validateNode = (node, path = '') => {
      if (!node.value || !node.label) {
        throw new Error(`Nodo en ${path}: debe tener 'value' y 'label'`);
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child, index) => {
          validateNode(child, `${path}[${index}].children`);
        });
      }
    };
    
    try {
      treeData.forEach((node, index) => {
        validateNode(node, `[${index}]`);
      });
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Estructura del árbol inválida',
        error: validationError.message
      });
    }
    
    // Actualizar o crear el árbol en la base de datos
    const Tree = require('../models/tree');
    
    // Buscar el árbol existente para actualizarlo
    let existingTree = await Tree.findOne({ name: 'tipificaciones' });
    
    const treeName = tree.name || 'tipificaciones';
    const treeDescription = tree.description || `Árbol subido desde ${fileName || 'archivo'} el ${new Date().toLocaleDateString()}`;
    
    let savedTree;
    
    if (existingTree) {
      // ✅ ACTUALIZAR el árbol existente
      existingTree.description = treeDescription;
      existingTree.isActive = true;
      existingTree.root = treeData;
      existingTree.updatedAt = new Date();
      
      savedTree = await existingTree.save();
    } else {
      // Solo crear si no existe
      const newTree = new Tree({
        root: treeData,
        name: treeName,
        description: treeDescription,
        isActive: true,
        version: tree.version || '1.0'
      });
      
      // Marcar root como modificado (importante para Mixed types)
      newTree.markModified('root');
      
      savedTree = await newTree.save();
    }
    
    
    // Verificar inmediatamente que se guardó correctamente (con .lean() para ver datos puros)
    const verificacion = await Tree.findById(savedTree._id).lean();
    
    res.json({
      success: true,
      message: `Árbol de tipificación actualizado correctamente desde ${fileName || 'archivo'}`,
      tree: {
        _id: savedTree._id,
        name: savedTree.name,
        description: savedTree.description,
        nodeCount: treeData.length,
        uploadedBy: req.session?.user?.name || 'Usuario',
        uploadedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error subiendo árbol:', error);
    
    // Limpiar archivo temporal si existe
    if (req.file && fs.existsSync(req.file.path)) {
      // Archivo procesado exitosamente
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Endpoint para descargar el árbol actual como archivo JSON
router.get('/api/tree/download', requireAdmin, async (req, res) => {
  try {
    
    const Tree = require('../models/tree');
    const arbolDocument = await Tree.getTipificacionesTree();
    
    if (!arbolDocument) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró árbol de tipificaciones'
      });
    }
    
    // Preparar datos para descarga
    const downloadData = {
      name: arbolDocument.name,
      description: arbolDocument.description,
      version: arbolDocument.updatedAt.toISOString(),
      exportedBy: req.session.user.name,
      exportedAt: new Date().toISOString(),
      root: arbolDocument.root
    };
    
    // Configurar headers para descarga
    const filename = `arbol_tipificacion_${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    
    res.json(downloadData);
    
  } catch (error) {
    console.error('❌ Error descargando árbol:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Endpoint temporal para dar permisos de administrador (SOLO PARA DESARROLLO)
router.post('/api/admin/give-permissions', async (req, res) => {
  try {
    
    // Crear permisos de administrador temporal
    const adminPermissions = {
      users: { view: true, create: true, edit: true, delete: true },
      monitoring: { viewActiveUsers: true, viewUserStates: true, viewReports: true, exportData: true },
      finance: { viewAbonos: true, createAbonos: true, viewSaldos: true, viewBilling: true },
      system: { manageRoles: true, systemConfig: true, viewLogs: true },
      operations: { viewTables: true, viewViajes: true, viewKardex: true, exportReports: true },
      admin: { manageTree: true, systemSettings: true, userManagement: true }
    };
    
    // Guardar en localStorage para que el frontend lo use
    res.json({
      success: true,
      message: 'Permisos de administrador dados temporalmente',
      permissions: adminPermissions,
      instructions: 'Copia estos permisos y pégalos en localStorage como "userPermissions" en el navegador'
    });
    
  } catch (error) {
    console.error('❌ Error dando permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error dando permisos',
      error: error.message
    });
  }
});

// Endpoint para crear árbol por defecto (si no existe)
router.post('/api/tree/initialize', requireAdmin, async (req, res) => {
  try {
    
    const Tree = require('../models/tree');
    
    // Verificar si ya existe un árbol
    const existingTree = await Tree.getTipificacionesTree();
    if (existingTree) {
      return res.json({
        success: true,
        message: 'Ya existe un árbol de tipificación',
        tree: existingTree
      });
    }
    
    // Crear árbol por defecto
    const defaultTree = new Tree({
      root: [
        {
          value: 'consulta',
          label: 'Consulta',
          children: [
            {
              value: 'consulta_academica',
              label: 'Consulta Académica',
              children: []
            },
            {
              value: 'consulta_administrativa',
              label: 'Consulta Administrativa',
              children: []
            }
          ]
        },
        {
          value: 'reclamo',
          label: 'Reclamo',
          children: [
            {
              value: 'reclamo_academico',
              label: 'Reclamo Académico',
              children: []
            },
            {
              value: 'reclamo_administrativo',
              label: 'Reclamo Administrativo',
              children: []
            }
          ]
        },
        {
          value: 'sugerencia',
          label: 'Sugerencia',
          children: []
        }
      ],
      name: 'tipificaciones',
      description: 'Árbol de tipificación por defecto del sistema',
      isActive: true
    });
    
    await defaultTree.save();
    
    res.json({
      success: true,
      message: 'Árbol de tipificación inicializado correctamente',
      tree: defaultTree
    });
    
  } catch (error) {
    console.error('❌ Error inicializando árbol:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Exportar la función de asignación automática para uso en otros módulos
module.exports = router;
module.exports.assignPendingTipificaciones = assignPendingTipificaciones;
