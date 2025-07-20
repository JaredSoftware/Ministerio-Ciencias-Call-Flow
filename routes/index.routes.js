const { Router } = require("express");
const router = Router();
const axios = require("axios");

const login = require("../controllers/general")
const userStatusRoutes = require("./userStatus.routes");
const User = require("../models/users");

// Rutas de estado de usuario
router.use("/user-status", userStatusRoutes);

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

// User status routes
router.use("/api/user-status", userStatusRoutes);

module.exports = router;
