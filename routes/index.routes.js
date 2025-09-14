const { Router } = require("express");
const router = Router();
const axios = require("axios");

const login = require("../controllers/general")
const userStatusRoutes = require("./userStatus.routes");
const statusTypeRoutes = require("./statusType.routes");
const User = require("../models/users");
const Tipificacion = require("../models/tipificacion");

// 🔄 CONTADOR GLOBAL PARA ROUND ROBIN
let roundRobinCounter = 0;

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

// 🚀 Endpoint para tipificación - ASIGNACIÓN DIRECTA POR IDAGENT DEL SISTEMA TELEFÓNICO
router.get('/api/tipificacion/formulario', async (req, res) => {
  try {
    const params = req.query;
    console.log('📞 Nueva solicitud de tipificación:', params);
    
    // 🚨 VALIDACIÓN OBLIGATORIA: idAgent es requerido
    if (!params.idAgent) {
      return res.status(400).json({ 
        success: false, 
        message: 'El parámetro idAgent es obligatorio' 
      });
    }

    // 🎯 CRM: BUSCAR CLIENTE EXISTENTE POR CÉDULA
    let clienteExistente = null;
    let historialCliente = [];
    
    if (params.cedula) {
      const Cliente = require('../models/cliente');
      try {
        clienteExistente = await Cliente.buscarPorCedula(params.cedula);
        if (clienteExistente) {
          console.log(`👤 Cliente existente encontrado: ${clienteExistente.nombres} ${clienteExistente.apellidos}`);
          historialCliente = clienteExistente.obtenerHistorial(5); // Últimas 5 interacciones
          console.log(`📋 Historial del cliente: ${historialCliente.length} interacciones`);
        } else {
          console.log(`🆕 Cliente nuevo - cédula: ${params.cedula}`);
        }
      } catch (error) {
        console.error('❌ Error buscando cliente:', error);
        // Continuar sin cliente existente
      }
    }
    
    // 🎯 DETERMINAR PRIORIDAD AUTOMÁTICAMENTE
    let priority = 1; // Por defecto: prioridad baja
    let customerSegment = 'standard';
    let estimatedTime = 5; // 5 minutos por defecto
    
    // Lógica de priorización inteligente
    if (params.priority && !isNaN(params.priority)) {
      priority = Math.min(Math.max(parseInt(params.priority), 1), 5);
    } else {
      // Auto-determinar prioridad basada en criterios
      if (params.customerSegment === 'premium') {
        priority = 4;
        customerSegment = 'premium';
        estimatedTime = 3;
      } else if (params.urgente === 'true' || params.callback === 'true') {
        priority = 3;
        estimatedTime = 4;
      } else if (params.tipoDocumento === 'CC' && params.cedula && params.cedula.length > 8) {
        priority = 2; // Cédulas largas pueden ser empresariales
      }
    }
    
    console.log(`🎯 Prioridad asignada: ${priority} (${priority === 5 ? 'CRÍTICA' : priority === 4 ? 'ALTA' : priority === 3 ? 'MEDIA' : priority === 2 ? 'NORMAL' : 'BAJA'})`);
    console.log(`👤 Segmento cliente: ${customerSegment}`);
    console.log(`⏱️ Tiempo estimado: ${estimatedTime} minutos`);
    console.log(`🎯 ID Agent del sistema telefónico: ${params.idAgent}`);
    
    // 🚨 BUSCAR AGENTE POR IDAGENT EN LA BASE DE DATOS
    const User = require('../models/users');
    const UserStatus = require('../models/userStatus');
    
    // 🎯 BUSCAR AGENTE ESPECÍFICO POR IDAGENT
    let assignedAgent = await User.findOne({ 
      idAgent: params.idAgent,
      active: true 
    }).lean();
    
    // Si no encuentra agente específico, buscar cualquier agente activo
    if (!assignedAgent) {
      console.log(`⚠️ No se encontró agente con idAgent: ${params.idAgent}, buscando cualquier agente activo...`);
      
      // Buscar cualquier usuario activo
      assignedAgent = await User.findOne({ 
        active: true 
      }).lean();
      
      if (!assignedAgent) {
        // Si no hay usuarios, crear uno temporal para la prueba
        console.log('🆕 Creando usuario temporal para la prueba...');
        assignedAgent = {
          _id: new require('mongoose').Types.ObjectId(),
          name: 'Agente Temporal',
          correo: 'agente@temporal.com',
          idAgent: params.idAgent,
          active: true
        };
      }
    }
    
    console.log(`✅ Agente encontrado: ${assignedAgent.name} (${assignedAgent.correo})`);
    
    // Obtener estado actual del agente
    const userStatus = await UserStatus.findOne({ 
      userId: assignedAgent._id 
    }).lean();
    
    if (!userStatus) {
      return res.status(400).json({ 
        success: false, 
        message: `El agente ${assignedAgent.name} no tiene estado registrado en el sistema`,
        agentInfo: {
          idAgent: params.idAgent,
          agentName: assignedAgent.name,
          agentEmail: assignedAgent.correo,
          reason: 'no_status_registered'
        }
      });
    }
    
    // Verificar que el agente esté activo
    if (!userStatus.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: `El agente ${assignedAgent.name} no está activo en la plataforma`,
        agentInfo: {
          idAgent: params.idAgent,
          agentName: assignedAgent.name,
          agentEmail: assignedAgent.correo,
          currentStatus: userStatus.status,
          reason: 'agent_inactive'
        }
      });
    }
    
    // Verificar que el agente esté en un estado de trabajo
    const StatusType = require('../models/statusType');
    const statusType = await StatusType.findOne({ 
      value: userStatus.status, 
      isActive: true 
    }).lean();
    
    if (!statusType) {
      return res.status(400).json({ 
        success: false, 
        message: `El estado '${userStatus.status}' del agente ${assignedAgent.name} no es válido`,
        agentInfo: {
          idAgent: params.idAgent,
          agentName: assignedAgent.name,
          agentEmail: assignedAgent.correo,
          currentStatus: userStatus.status,
          reason: 'invalid_status'
        }
      });
    }
    
    let statusAutoChanged = false;
    let previousStatus = null;
    
    if (statusType.category !== 'work') {
      console.log(`🔄 Agente ${assignedAgent.name} está en estado '${statusType.label}' (${statusType.category})`);
      console.log(`🚀 CAMBIANDO AUTOMÁTICAMENTE A ESTADO DE TRABAJO...`);
      
      // Guardar estado anterior
      previousStatus = userStatus.status;
      statusAutoChanged = true;
      
      // Buscar el mejor estado de trabajo disponible
      const workStatusTypes = await StatusType.find({ 
        category: 'work', 
        isActive: true 
      }).sort({ order: 1 }).lean();
      
      if (workStatusTypes.length === 0) {
        return res.status(500).json({ 
          success: false, 
          message: `No hay estados de trabajo disponibles para cambiar al agente ${assignedAgent.name}`,
          agentInfo: {
            idAgent: params.idAgent,
            agentName: assignedAgent.name,
            agentEmail: assignedAgent.correo,
            currentStatus: userStatus.status,
            reason: 'no_work_states_available'
          }
        });
      }
      
      // Seleccionar estado de trabajo (preferir 'busy' cuando recibe llamada)
      let targetWorkStatus = workStatusTypes.find(st => st.value === 'busy') || 
                            workStatusTypes.find(st => st.value === 'on_call') ||
                            workStatusTypes.find(st => st.value === 'available') ||
                            workStatusTypes[0];
      
      console.log(`🎯 Cambiando estado de '${userStatus.status}' a '${targetWorkStatus.value}' (${targetWorkStatus.label})`);
      
      try {
        // Actualizar el estado del usuario
        const updatedUserStatus = await UserStatus.findOneAndUpdate(
          { userId: assignedAgent._id },
          { 
            status: targetWorkStatus.value,
            isActive: true,
            lastSeen: new Date(),
            color: targetWorkStatus.color,
            label: targetWorkStatus.label
          },
          { new: true }
        );
        
        if (!updatedUserStatus) {
          return res.status(500).json({ 
            success: false, 
            message: `Error actualizando estado del agente ${assignedAgent.name}`,
            agentInfo: {
              idAgent: params.idAgent,
              agentName: assignedAgent.name,
              reason: 'status_update_failed'
            }
          });
        }
        
        console.log(`✅ Estado del agente ${assignedAgent.name} cambiado exitosamente a '${targetWorkStatus.label}'`);
        
        // Publicar cambio de estado por MQTT
        const mqttService = req.app.get('mqttService');
        if (mqttService) {
          // Publicar cambio de estado general
          mqttService.publishUserStatusChange(assignedAgent._id, assignedAgent.name, targetWorkStatus.value, targetWorkStatus.label, targetWorkStatus.color);
          
          // Publicar evento específico para cambio automático al usuario
          const statusChangeData = {
            userId: assignedAgent._id,
            userName: assignedAgent.name,
            oldStatus: userStatus.status,
            newStatus: targetWorkStatus.value,
            newLabel: targetWorkStatus.label,
            newColor: targetWorkStatus.color,
            changedBy: 'system_auto_assignment',
            reason: 'incoming_call',
            timestamp: new Date().toISOString()
          };
          
          const userSpecificTopic = `telefonia/users/status-change/${assignedAgent._id}`;
          mqttService.publish(userSpecificTopic, statusChangeData);
          
          console.log(`📡 Evento de cambio automático publicado en: ${userSpecificTopic}`);
        }
        
        // Actualizar la variable local para continuar con el flujo
        userStatus.status = targetWorkStatus.value;
        userStatus.isActive = true;
        
      } catch (error) {
        console.error(`❌ Error cambiando estado del agente ${assignedAgent.name}:`, error);
        return res.status(500).json({ 
          success: false, 
          message: `Error interno cambiando estado del agente ${assignedAgent.name}`,
          agentInfo: {
            idAgent: params.idAgent,
            agentName: assignedAgent.name,
            reason: 'status_change_error',
            error: error.message
          }
        });
      }
    }
    
    console.log(`📊 Estado del agente: ${userStatus.status} (${statusType.label}) - ✅ VÁLIDO PARA TRABAJO`);
    
    // Verificar conexión MQTT/WebSocket (opcional pero recomendado)
    const hasConnection = userStatus.socketId || userStatus.sessionId;
    if (!hasConnection) {
      console.warn(`⚠️ El agente ${assignedAgent.name} no tiene conexión MQTT/WebSocket activa`);
      // No bloquear la asignación, pero advertir
    } else {
      console.log(`🔌 Agente conectado - SocketId: ${userStatus.socketId || 'N/A'}, SessionId: ${userStatus.sessionId || 'N/A'}`);
    }
    
    // Calcular carga de trabajo del agente
    const pendingCount = await Tipificacion.countDocuments({ 
      assignedTo: assignedAgent._id, 
      status: 'pending' 
    });
    
    console.log(`📋 Carga de trabajo actual: ${pendingCount} tipificaciones pendientes`);
    
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
    // Usar el userId del agente encontrado por idAgent
    const userIdPlano = assignedAgent._id;
    console.log('DEBUG assignedAgent:', assignedAgent);
    console.log('DEBUG userIdPlano:', userIdPlano);
    const topic = `telefonia/tipificacion/nueva/${userIdPlano}`;
    
    // 🎯 FUNCIÓN DE MAPEO PARA VALORES DEL MODELO
    const mapearValores = (valor, tipo) => {
      const mapeos = {
        tipoDocumento: {
          'CC': 'Cédula de ciudadanía',
          'CE': 'Cédula de extranjería',
          'TI': 'Tarjeta de identidad',
          'PA': 'Pasaporte',
          'PTP': 'Permiso temporal de permanencia'
        },
        nivelEscolaridad: {
          'Universitario': 'Universitario (pregrado)',
          'Tecnico': 'Técnico',
          'Tecnologo': 'Tecnólogo',
          'Postgrado': 'Postgrado (Especialización)'
        }
      };
      
      return mapeos[tipo]?.[valor] || valor;
    };

    // 🎯 CONSTRUIR DATOS DEL CLIENTE (priorizar datos existentes)
    const datosCliente = {
      // Información básica
      cedula: params.cedula || '',
      tipoDocumento: mapearValores(params.tipoDocumento, 'tipoDocumento') || '',
      
      // Información personal (usar datos existentes si están disponibles)
      nombres: clienteExistente?.nombres || params.nombres || '',
      apellidos: clienteExistente?.apellidos || params.apellidos || '',
      fechaNacimiento: clienteExistente?.fechaNacimiento || params.fechaNacimiento || '',
      sexo: clienteExistente?.sexo || params.sexo || '',
      
      // Ubicación
      pais: clienteExistente?.pais || params.pais || '',
      departamento: clienteExistente?.departamento || params.departamento || '',
      ciudad: clienteExistente?.ciudad || params.ciudad || '',
      direccion: clienteExistente?.direccion || params.direccion || '',
      
      // Contacto
      telefono: clienteExistente?.telefono || params.telefono || '',
      correo: clienteExistente?.correo || params.correo || '',
      
      // Demográficos
      nivelEscolaridad: mapearValores(clienteExistente?.nivelEscolaridad || params.nivelEscolaridad, 'nivelEscolaridad') || '',
      grupoEtnico: clienteExistente?.grupoEtnico || params.grupoEtnico || '',
      discapacidad: clienteExistente?.discapacidad || params.discapacidad || ''
    };

    const tipificacionData = {
      idLlamada: params.idLlamada,
      cedula: params.cedula,
      tipoDocumento: params.tipoDocumento,
      observacion: params.observacion,
      historial: historialCliente, // ✅ Historial del cliente existente
      arbol: arbolTipificaciones, // ✅ Árbol real de la BD
      assignedTo: userIdPlano,
      assignedToName: assignedAgent.name || 'Usuario',
      timestamp: new Date().toISOString(),
      type: 'nueva_tipificacion',
      
      // 🎯 DATOS DEL CLIENTE (con prioridad a datos existentes)
      ...datosCliente,
      
      // 🎯 METADATOS CRM (se actualizará después de crear/actualizar el cliente)
      clienteExistente: !!clienteExistente,
      totalInteracciones: clienteExistente?.totalInteracciones || 0,
      fechaUltimaInteraccion: clienteExistente?.fechaUltimaInteraccion || null
    };
    
    console.log('📤 Enviando tipificación por MQTT:');
    console.log(`   - Topic: ${topic}`);
    console.log(`   - Agente: ${assignedAgent.name}`);
    console.log(`   - ID Llamada: ${params.idLlamada}`);
    console.log(`   - Árbol: ${arbolTipificaciones.length} nodos`);
    
    // 1. Crear la nueva tipificación (pending)
    let tipificacionDoc = null;
    try {
      // Calcular posición en cola del agente
      const currentQueuePosition = await Tipificacion.countDocuments({ 
        assignedTo: userIdPlano, 
        status: 'pending' 
      }) + 1;
      
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
        type: 'nueva_tipificacion',
        
        // CAMPOS DEL CLIENTE - INFORMACIÓN PERSONAL
        nombres: params.nombres || '',
        apellidos: params.apellidos || '',
        fechaNacimiento: params.fechaNacimiento ? new Date(params.fechaNacimiento) : null,
        
        // UBICACIÓN
        pais: params.pais || '',
        departamento: params.departamento || '',
        ciudad: params.ciudad || '',
        direccion: params.direccion || '',
        
        // CONTACTO
        telefono: params.telefono || '',
        correo: params.correo || '',
        
        // DEMOGRÁFICOS
        sexo: params.sexo || '',
        nivelEscolaridad: params.nivelEscolaridad || '',
        grupoEtnico: params.grupoEtnico || '',
        discapacidad: params.discapacidad || '',
        
        // NUEVOS CAMPOS DE GESTIÓN DE COLAS
        priority: priority,
        customerSegment: customerSegment,
        estimatedTime: estimatedTime,
        queuePosition: currentQueuePosition,
        callbackRequested: params.callback === 'true',
        skillRequired: params.skill || 'general',
        timeInQueue: 0 // Se calculará dinámicamente
      });
      // Tipificación creada exitosamente
    } catch (err) {
      console.error('❌ Error creando registro de tipificación:', err);
    }

    // 2. Buscar historial (ahora sí existe la nueva y las anteriores)
    let historialPrevio = [];
    try {
      // Buscando historial
      historialPrevio = await Tipificacion.find({
        idLlamada: params.idLlamada,
        status: 'success',
        _id: { $ne: tipificacionDoc?._id }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
      if (historialPrevio.length === 0) {
        historialPrevio = await Tipificacion.find({
          cedula: params.cedula,
          status: 'success',
          _id: { $ne: tipificacionDoc?._id }
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      }
    } catch (err) {
      console.error('❌ Error buscando historial de tipificaciones:', err);
    }

    // 🎯 CRM: SOLO CREAR/ACTUALIZAR CLIENTE SIN AGREGAR INTERACCIÓN (se hará al completar)
    if (params.cedula) {
      console.log('🎯 INICIANDO CREACIÓN/ACTUALIZACIÓN DE CLIENTE CRM (sin interacción)');
      console.log('📋 Datos del cliente:', JSON.stringify(datosCliente, null, 2));
      
      try {
        const Cliente = require('../models/cliente');
        console.log('✅ Modelo Cliente importado correctamente');
        
        // Solo crear o actualizar cliente, SIN agregar interacción
        console.log('🔄 Llamando a Cliente.crearOActualizar...');
        const clienteActualizado = await Cliente.crearOActualizar(datosCliente);
        console.log(`✅ Cliente ${clienteActualizado.nombres} ${clienteActualizado.apellidos} creado/actualizado en CRM`);
        console.log('📊 Cliente ID:', clienteActualizado._id);
        console.log('📊 Total interacciones:', clienteActualizado.totalInteracciones);
        
        // NO agregar interacción aquí - se hará al completar la tipificación
        console.log('⏭️ Interacción se agregará al completar la tipificación');
        
        // Actualizar datos del cliente en tipificacionData
        // Si el cliente se creó o ya existía, marcarlo como existente
        tipificacionData.clienteExistente = true;
        tipificacionData.totalInteracciones = clienteActualizado.totalInteracciones;
        tipificacionData.fechaUltimaInteraccion = clienteActualizado.fechaUltimaInteraccion;
        
        console.log('🎉 CRM COMPLETADO EXITOSAMENTE (sin duplicar interacción)');
        console.log('📊 Datos actualizados para MQTT:');
        console.log(`   - clienteExistente: ${tipificacionData.clienteExistente}`);
        console.log(`   - totalInteracciones: ${tipificacionData.totalInteracciones}`);
        console.log(`   - fechaUltimaInteraccion: ${tipificacionData.fechaUltimaInteraccion}`);
        
      } catch (error) {
        console.error('❌ Error creando/actualizando cliente:', error);
        console.error('❌ Stack trace:', error.stack);
        // Continuar sin fallar la tipificación
      }
    } else {
      console.log('⚠️ No se proporcionó cédula, saltando creación de cliente CRM');
    }

    // 3. Asigna el historial y publica MQTT
    tipificacionData.historial = historialPrevio;
    
    if (mqttService && mqttService.publish) {
      mqttService.publish(topic, tipificacionData);
    } else {
      console.error('❌ mqttService no disponible');
    }
    
    res.json({ 
      success: true, 
      assignedTo: userIdPlano,
      assignedToName: assignedAgent.name,
      historial: historialPrevio,
      message: `Tipificación enviada por MQTT a ${assignedAgent.name}${statusAutoChanged ? ' (estado cambiado automáticamente)' : ''}`,
      method: 'Asignación directa por idAgent del sistema telefónico',
      agentInfo: {
        idAgent: params.idAgent,
        agentName: assignedAgent.name,
        agentEmail: assignedAgent.correo,
        agentStatus: userStatus ? userStatus.status : 'sin_estado',
        pendingCount: pendingCount,
        statusAutoChanged: statusAutoChanged,
        previousStatus: previousStatus
      }
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
    const { 
      idLlamada, cedula, tipoDocumento, observacion, historial, arbol, assignedTo, 
      nivel1, nivel2, nivel3, nivel4, nivel5,
      // Campos del cliente
      nombres, apellidos, fechaNacimiento, pais, departamento, ciudad, direccion,
      telefono, correo, sexo, nivelEscolaridad, grupoEtnico, discapacidad
    } = req.body;
    
    // Buscar la tipificación pendiente por idLlamada y assignedTo
    const Tipificacion = require('../models/tipificacion');
    const tip = await Tipificacion.findOne({ idLlamada, assignedTo, status: 'pending' });
    if (!tip) {
      return res.status(404).json({ success: false, message: 'Tipificación no encontrada' });
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
        console.log(`✅ Cliente ${clienteActualizado.nombres} ${clienteActualizado.apellidos} actualizado en CRM`);
        
        // Agregar nueva interacción al cliente
        const nuevaInteraccion = {
          idLlamada: idLlamada,
          fecha: new Date(),
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
        console.log(`✅ INTERACCIÓN FINAL agregada al historial del cliente (tipificación completada)`);
        
      } catch (error) {
        console.error('❌ Error actualizando cliente en CRM:', error);
        // Continuar sin fallar la tipificación
      }
    }
    
    // Actualizar campos básicos de la tipificación
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
    
    // Actualizar campos del cliente en la tipificación
    tip.nombres = nombres || tip.nombres;
    tip.apellidos = apellidos || tip.apellidos;
    tip.fechaNacimiento = fechaNacimiento ? new Date(fechaNacimiento) : tip.fechaNacimiento;
    tip.pais = pais || tip.pais;
    tip.departamento = departamento || tip.departamento;
    tip.ciudad = ciudad || tip.ciudad;
    tip.direccion = direccion || tip.direccion;
    tip.telefono = telefono || tip.telefono;
    tip.correo = correo || tip.correo;
    tip.sexo = sexo || tip.sexo;
    tip.nivelEscolaridad = nivelEscolaridad || tip.nivelEscolaridad;
    tip.grupoEtnico = grupoEtnico || tip.grupoEtnico;
    tip.discapacidad = discapacidad || tip.discapacidad;
    
    tip.status = 'success';
    await tip.save();
    
    // Respuesta con información del CRM
    res.json({ 
      success: true, 
      message: 'Tipificación actualizada', 
      tipificacion: tip,
      crm: {
        clienteActualizado: !!clienteActualizado,
        totalInteracciones: clienteActualizado?.totalInteracciones || 0
      }
    });
  } catch (error) {
    console.error('❌ Error actualizando tipificación:', error);
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
    
    console.log(`📋 Cola de ${userId}: ${pendingTipificaciones.length} pendientes, ${agentCompleted} completadas`);
    
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
    console.error('❌ Error obteniendo cola:', error);
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
    console.log('🔍 Estados de trabajo en BD:', workStatusTypes.map(s => ({ value: s.value, label: s.label, category: s.category })));
    
    const workStatusValues = workStatusTypes.map(st => st.value);
    
    // Buscar usuarios activos con estados de trabajo
    const activeUserStatuses = await UserStatus.find({ 
      isActive: true,
      status: { $in: workStatusValues }
    }).populate('userId').lean();
    
    console.log(`👥 Usuarios activos con estados de trabajo: ${activeUserStatuses.length}`);
    
    const availableUsers = [];
    
    for (const userStatus of activeUserStatuses) {
      if (userStatus.userId) {
        const user = userStatus.userId;
        
        console.log(`👤 Usuario ${user.name}:`, {
          status: userStatus.status,
          isActive: userStatus.isActive,
          label: userStatus.label
        });
        
        const statusType = await StatusType.findOne({ value: userStatus.status, isActive: true });
        
        console.log(`📋 StatusType para '${userStatus.status}':`, statusType ? {
          value: statusType.value,
          category: statusType.category,
          isActive: statusType.isActive
        } : 'No encontrado');
        
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
    
    console.log(`📊 Comparación: StateManager: ${stateManagerUsers.length}, Base de datos: ${availableUsers.length}`);
    
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
    console.error('❌ Error creando solicitud de reporte:', error);
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
    console.log('🔄 Iniciando asignación automática de tipificaciones pendientes...');
    
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
      console.log('✅ No hay tipificaciones pendientes sin asignar');
      return { assigned: 0, message: 'No hay tipificaciones pendientes' };
    }
    
    console.log(`📋 Encontradas ${unassignedTipificaciones.length} tipificaciones sin asignar`);
    
    // 🚨 CAMBIO: OBTENER USUARIOS ACTIVOS DIRECTAMENTE DE LA BASE DE DATOS
    const StatusType = require('../models/statusType');
    const UserStatus = require('../models/userStatus');
    const User = require('../models/users');
    
    // Obtener estados de trabajo
    const workStatusTypes = await StatusType.find({ category: 'work', isActive: true }).lean();
    const workStatusValues = workStatusTypes.map(st => st.value);
    
    console.log('🎯 Estados de trabajo disponibles:', workStatusValues);
    
    // BUSCAR USUARIOS ACTIVOS CON ESTADOS DE TRABAJO DIRECTAMENTE EN BD
    const activeUserStatuses = await UserStatus.find({ 
      isActive: true,
      status: { $in: workStatusValues }
    }).populate('userId').lean();
    
    console.log(`👥 Usuarios activos encontrados en assignPendingTipificaciones: ${activeUserStatuses.length}`);
    
    if (activeUserStatuses.length === 0) {
      console.log('⚠️ No hay agentes disponibles para trabajar');
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
      console.log('⚠️ No hay agentes disponibles para trabajar');
      return { assigned: 0, message: 'No hay agentes disponibles' };
    }
    
    console.log(`👥 ${availableUsers.length} agentes disponibles`);
    
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
      console.log('⚠️ No hay agentes disponibles');
      return { assigned: 0, message: 'No hay agentes disponibles' };
    }
    
    console.log(`🎯 ${availableAgents.length} agentes disponibles`);
    
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
        console.log(`📡 Tipificación ${tipificacion.idLlamada} enviada por MQTT a ${selectedAgent.name}`);
      }
      
      assignedCount++;
      console.log(`✅ Asignada tipificación ${tipificacion.idLlamada} a ${selectedAgent.name} (${selectedAgent.pendingCount + 1} pendientes)`);
    }
    
    console.log(`🎉 Asignación completada: ${assignedCount} tipificaciones asignadas`);
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
      fecha: new Date(),
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
    console.log('🧪 PROBANDO CREACIÓN DE CLIENTE CRM...');
    
    const Cliente = require('../models/cliente');
    console.log('✅ Modelo Cliente importado');
    
    const datosPrueba = {
      cedula: '123456789',
      tipoDocumento: 'CC',
      nombres: 'Cliente Prueba',
      apellidos: 'Test',
      telefono: '3000000000',
      correo: 'prueba@test.com'
    };
    
    console.log('📋 Datos de prueba:', datosPrueba);
    
    const cliente = await Cliente.crearOActualizar(datosPrueba);
    console.log('✅ Cliente creado:', cliente._id);
    
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

// Exportar la función de asignación automática para uso en otros módulos
module.exports = router;
module.exports.assignPendingTipificaciones = assignPendingTipificaciones;
