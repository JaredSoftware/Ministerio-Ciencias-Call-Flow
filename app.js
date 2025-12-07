const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const i18n = require("i18n");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const cors = require("cors");
const session = require("express-session");
const schedule = require("node-schedule");
const serveStatic = require("serve-static");
const puppeteer = require("puppeteer");
const kardexSchema = require("./models/kardex");
const historicoCartera = require("./models/historicoCartera");
const mongoose = require("mongoose");
const simpleMoneyMask = require("simple-mask-money");
const http = require("http");
const socketIo = require("socket.io");
const stateManager = require("./services/stateManager");
const MQTTService = require("./services/mqttService");
const net = require('net');
const ws = require('ws');
const aedes = require('aedes')();
const websocketStream = require('websocket-stream');
require('./backend/reportCron');

app.set("port", process.env.PORT || 9035);
app.set("views", path.join(__dirname, "views"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(morgan("dev"));
require("dotenv").config();

// --- MQTT Broker embebido ---

// Puerto TCP estándar MQTT (cambiado para evitar conflictos)
const MQTT_PORT = 1884;
const mqttServer = net.createServer(aedes.handle);
mqttServer.listen(MQTT_PORT, function () {
});

// Puerto WebSocket para MQTT (para el frontend)
const WS_PORT = 9001;
const mqttHttpServer = http.createServer();
const wsServer = new ws.Server({ server: mqttHttpServer });
wsServer.on('connection', function (socket, request) {
  const stream = websocketStream(socket, { objectMode: true });
  aedes.handle(stream, request);
});
mqttHttpServer.listen(WS_PORT, function () {
});

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:8080", // URL del frontend Vue
    methods: ["GET", "POST"],
    credentials: true
  }
});
// Configurar sesiones mejoradas
// Intentar usar Redis si está disponible, sino usar MemoryStore
let sessionStore = null;
try {
  const RedisStore = require("connect-redis").default;
  const redis = require("redis");
  
  const redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    }
  });

  redisClient.on('error', (err) => {
    console.error('❌ Error en Redis para sesiones:', err);
  });

  redisClient.on('connect', () => {
    console.log('🔄 Conectando Redis para sesiones...');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis para sesiones conectado');
  });

  // Conectar Redis (no bloqueante)
  redisClient.connect().catch((err) => {
    console.error('❌ Error conectando Redis para sesiones:', err);
    console.log('⚠️ Usando MemoryStore para sesiones (no recomendado para producción)');
  });

  sessionStore = new RedisStore({ 
    client: redisClient,
    prefix: 'session:'
  });
  
  console.log('✅ Redis Store configurado para sesiones');
} catch (error) {
  console.warn('⚠️ connect-redis no disponible, usando MemoryStore:', error.message);
  console.warn('⚠️ Para producción, instala: npm install connect-redis');
  sessionStore = null; // Usará MemoryStore por defecto
}

const sessionMiddleware = session({
  store: sessionStore || undefined, // Si es null, usa MemoryStore por defecto
  secret: process.env.SESSION_SECRET || "ministerio_educacion_secret_key",
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax'
  },
  name: 'ministerio_educacion_session'
});

app.use(sessionMiddleware);

// Compartir sesión con Socket.IO de forma más robusta
io.use((socket, next) => {
  
  // Envolver la request para Socket.IO
  const req = socket.request;
  const res = {};
  
  sessionMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ Error en sessionMiddleware:', err);
      return next(err);
    }
    
    
    if (req.session?.user) {
    } else {
    }
    
    next();
  });
});

// Removido el middleware que establecía Access-Control-Allow-Origin: "*"
// ya que interfiere con las credenciales de CORS

// Configurar CORS para permitir credenciales
app.use(cors({
  origin: function (origin, callback) {
    // Permitir localhost y la IP del servidor
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:9035',
      'http://172.16.116.10:9035',
      'http://172.16.116.10:8080'
    ];
    
    // Permitir requests sin origin (como Postman, apps móviles, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todos por ahora
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true, // Permitir cookies y credentials
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
}));
// 🚀 DIST se maneja con ruta catch-all más abajo (después de las rutas)
// app.use(serveStatic(path.join(__dirname, "./dist"))); // Movido a catch-all
// Configurar express-session

//const srvRenderFunctions = require(path.resolve(__dirname, 'services', 'renderfn.js'));

// Configurar i18n
i18n.configure({
  locales: ["en", "es"],
  defaultLocale: "en",
  directory: __dirname + "/locales",
  objectNotation: true,
});

app.use(i18n.init);

//multer and calls from json
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const storage = multer.diskStorage({
  destination: path.join(__dirname, "public/csv/upload"),
  filename: (req, file, cb, filename) => {
    cb(null, file.originalname);
  },
});
app.use(multer({ storage: storage }).single("csv"));

//db
const { db, pool } = require("./db");
/*
Start Config from db
*/
//

/**
 * End config db
 */
/**
 * Esta es una función que realiza alguna operación.
 * @param {string} plantilla - plantilla que se usar
 * @param {string} variables - las vairables que se pintaran en ejs.
 * @param {string} fileName - nombre del archivo pdf que se generara
 * @returns {string} Una cadena que describe el resultado de la operación.
 */
const GeneratorPFd = async (plantilla, variables, fileName) => {
  let html = await require("ejs").renderFile(`views/${plantilla}`, variables);
  const ubicacionFile = path.resolve(
    __dirname,
    "public",
    "pdf",
    `${fileName}.pdf`
  );
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Establecer el contenido HTML de la página
  await page.setContent(html);

  // Generar el PDF
  const creadoFile = await page.pdf({ path: ubicacionFile, format: "A4" });

  await browser.close();

  return creadoFile;
};
//GeneratorPFd("informe.html", { var1: "hola" }, "jared");
const srvRenderFunctions = require(path.resolve(
  __dirname,
  "services",
  "renderfn.js"
));
app.use((req, res, next) => {
  res.locals.db = db;
  res.locals.pool = pool;
  res.locals.GeneratorPFd = GeneratorPFd;
  res.locals.renderPartial = srvRenderFunctions.renderPartial;
  next();
});

app.use(
  "/jquery",
  express.static(path.join(__dirname, "node_modules", "jquery", "dist"))
);
app.use(
  "/bootstrap",
  express.static(path.join(__dirname, "node_modules", "bootstrap", "dist"))
);
app.use(
  "/sweetalert",
  express.static(path.join(__dirname, "node_modules", "sweetalert2", "dist"))
);
app.use(
  "/chart.js",
  express.static(path.join(__dirname, "node_modules", "chart.js", "dist"))
);
app.use(
  "/axios",
  express.static(path.join(__dirname, "node_modules", "axios", "dist"))
);
app.use(
  "/qs",
  express.static(path.join(__dirname, "node_modules", "@types", "timers"))
);
app.use(
  "/vue",
  express.static(path.join(__dirname, "node_modules", "vue", "dist"))
);
//app.use("/fontAwesome",express.static(path.join(__dirname, "node_modules","font-awesome")));
//app.use((req, res, next)=>{res.locals.db = {MongoClient, url, client,dbName},next();});

//routes
app.use(require("./routes/index.routes"));

// 🚀 SERVIR ARCHIVOS ESTÁTICOS DEL DIST (si existen)
// Solo archivos estáticos (JS, CSS, imágenes), no index.html
app.use(express.static(path.join(__dirname, "./dist"), {
  index: false, // No servir index.html automáticamente
  fallthrough: true // Continuar al siguiente middleware si el archivo no existe
}));

// 🚀 RUTA CATCH-ALL: Manejar ambas visuales
// - Si dist/index.html existe: servir el frontend Vue.js
// - Si no existe: devolver 404 o manejar según necesidad
app.get('*', (req, res, next) => {
  // Solo manejar rutas que no sean APIs ni archivos estáticos
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/') || req.path.startsWith('/mqtt') || req.path.startsWith('/public/')) {
    return next();
  }
  
  const distIndexPath = path.join(__dirname, 'dist', 'index.html');
  const fs = require('fs');
  
  // Verificar si dist/index.html existe
  if (fs.existsSync(distIndexPath)) {
    // Servir el frontend Vue.js (SPA routing)
    res.sendFile(distIndexPath);
  } else {
    // Si dist está vacío, las rutas API y EJS ya manejaron las solicitudes
    // Si llegamos aquí, es una ruta no encontrada
    next();
  }
});

//static
app.use(express.static(path.join(__dirname, "public")));

// Manejo de Socket.IO
io.on('connection', async (socket) => {
  
  // Obtener información de la sesión
  const session = socket.request.session;
  
  if (session && session.user) {
    const user = session.user;
    
    // Unir al usuario a una sala basada en su rol o ID
    socket.join(`user_${user._id}`);
    socket.join(`role_${user.role}`);
    
    // Registrar usuario en StateManager
    stateManager.registerUser(user._id, {
      userId: user._id, // <-- Forzar string plano aquí
      name: user.name,
      email: user.correo,
      role: user.role,
      socketId: socket.id
    });
    
    // Inicializar estado de usuario en la base de datos
    try {
      const UserStatus = require('./models/userStatus');
      
      
      await UserStatus.upsertStatus(user._id, {
        isActive: true,
        socketId: socket.id,
        sessionId: session.sessionID
      });
      
      
      // Enviar estado actual al usuario
      const userStatus = await UserStatus.getUserStatus(user._id);
      socket.emit('own_status_changed', userStatus);
      
      // 🚨 PUBLICAR EVENTO MQTT DE CONEXIÓN
      try {
        const mqttService = app.get('mqttService');
        if (mqttService && mqttService.isConnected) {
          mqttService.publishUserConnected(user._id, user.name, user.role);
        }
      } catch (mqttError) {
        console.error('❌ Error publicando evento MQTT de conexión:', mqttError);
      }
      
      // Enviar lista de usuarios activos
      await emitActiveUsersList();
      
    } catch (error) {
      console.error(`❌ Error inicializando usuario ${user.name}:`, error);
    }
  } else {
  }
  
  // Manejar eventos de estado de la aplicación
  socket.on('user_action', (data) => {
    
    if (session?.user?._id) {
      // Actualizar estado del usuario
      stateManager.updateUserActivity(session.user._id);
      
      // Emitir a todos los usuarios conectados
      io.emit('user_activity', {
        userId: session.user._id,
        userName: session.user.name,
        action: data.action,
        timestamp: new Date()
      });
    }
  });
  
  // Manejar cambios de estado en tiempo real
  socket.on('state_change', (data) => {
    
    if (session?.user?._id) {
      // Actualizar estado en StateManager
      stateManager.setUserState(session.user._id, data.state);
    }
    
    // Emitir a usuarios específicos basado en permisos
    if (data.broadcast) {
      io.emit('state_updated', data);
    } else {
      socket.broadcast.emit('state_updated', data);
    }
  });
  
  // Manejar flujo de trabajo
  socket.on('workflow_update', (data) => {
    
    if (session?.user?._id) {
      stateManager.handleWorkflow({
        userId: session.user._id,
        ...data
      });
    }
  });
  
  // Manejar notificaciones
  socket.on('send_notification', (data) => {
    
    if (data.targetUsers) {
      stateManager.sendNotification(data.targetUsers, data);
    } else {
      stateManager.sendGlobalNotification(data);
    }
  });
  
  // Solicitar estadísticas de estado
  socket.on('get_state_stats', () => {
    const stats = stateManager.getStateStats();
    socket.emit('state_stats', stats);
  });
  
  // Manejar cambios de estado de usuario
  socket.on('change_status', async (data) => {
    
    if (session?.user?._id) {
      try {
        const user = session.user;
        
        const UserStatus = require('./models/userStatus');
        const userStatus = await UserStatus.getUserStatus(user._id);
        
        if (userStatus) {
          await userStatus.changeStatus(data.status, data.customStatus);
        } else {
          await UserStatus.upsertStatus(user._id, {
            status: data.status,
            customStatus: data.customStatus,
            isActive: true
          });
        }
        
        // Obtener estado actualizado
        const updatedStatus = await UserStatus.getUserStatus(user._id);
        
        // Enviar estado actualizado al usuario
        socket.emit('own_status_changed', updatedStatus);
        
        // 🚨 SISTEMA PUB/SUB - Emitir a TODOS los usuarios conectados
        io.emit('user_status_changed', {
          userId: user._id,
          userName: user.name,
          status: updatedStatus,
          timestamp: new Date().toISOString()
        });
        
        // 🚨 SISTEMA PUB/SUB - Emitir lista actualizada inmediatamente
        await emitActiveUsersList();
        
        // 🚨 EVENTO ESPECÍFICO para tabla de usuarios activos
        io.emit('active_users_updated', {
          type: 'status_change',
          userId: user._id,
          userName: user.name,
          newStatus: updatedStatus.status,
          newLabel: updatedStatus.label,
          newColor: updatedStatus.color,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Error cambiando estado:', error);
        socket.emit('status_change_error', { error: error.message });
      }
    } else {
    }
  });
  
  // Solicitar lista de usuarios activos
  socket.on('get_active_users', async () => {
    try {
      await emitActiveUsersList();
    } catch (error) {
      console.error('Error obteniendo usuarios activos:', error);
    }
  });
  
  // Sincronización de estado desde el frontend
  socket.on('status_sync', async (data) => {
    
    if (session?.user?._id) {
      try {
        const user = session.user;
        const { status } = data;
        
        
        // Actualizar estado en la base de datos
        const UserStatus = require('./models/userStatus');
        const userStatus = await UserStatus.getUserStatus(user._id);
        
        if (userStatus) {
          await userStatus.changeStatus(status.status, status.customStatus);
        } else {
          await UserStatus.upsertStatus(user._id, {
            status: status.status,
            customStatus: status.customStatus,
            isActive: true
          });
        }
        
        // Obtener estado actualizado
        const updatedStatus = await UserStatus.getUserStatus(user._id);
        
        // Confirmar sincronización al cliente
        socket.emit('status_sync_confirmed', {
          success: true,
          status: updatedStatus,
          syncTime: new Date().toISOString()
        });
        
        // Notificar a otros usuarios del cambio
        socket.broadcast.emit('user_status_changed', {
          userId: user._id,
          userName: user.name,
          status: updatedStatus
        });
        
        
      } catch (error) {
        console.error('❌ Error sincronizando estado:', error);
        socket.emit('status_sync_error', { error: error.message });
      }
    }
  });
  
  // Heartbeat desde Socket.IO
  socket.on('heartbeat', async (data) => {
    if (session?.user?._id) {
      try {
        const user = session.user;
        
        // Actualizar actividad del usuario y asegurar que socketId está actualizado
        const UserStatus = require('./models/userStatus');
        let userStatus = await UserStatus.getUserStatus(user._id);
        
        if (userStatus) {
          // Actualizar lastSeen
          await userStatus.updateActivity();
          
          // Si el socketId cambió, actualizarlo
          if (userStatus.socketId !== socket.id) {
            userStatus.socketId = socket.id;
            userStatus.isActive = true;
            await userStatus.save();
          } else if (!userStatus.isActive) {
            // Si no está activo, reactivarlo
            userStatus.isActive = true;
            await userStatus.save();
          }
        } else {
          // Crear estado si no existe
          await UserStatus.upsertStatus(user._id, {
            isActive: true,
            socketId: socket.id,
            sessionId: session.sessionID
          });
        }
        
        // Confirmar heartbeat
        socket.emit('heartbeat_confirmed', {
          success: true,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Error procesando heartbeat:', error);
      }
    }
  });
  
  // Actualizar actividad del usuario
  socket.on('update_activity', async (data) => {
    if (session?.user?._id) {
      try {
        const user = session.user;
        
        // Actualizar lastSeen
        const UserStatus = require('./models/userStatus');
        const userStatus = await UserStatus.getUserStatus(user._id);
        if (userStatus) {
          await userStatus.updateActivity();
        }
        
        // Confirmar actualización
        socket.emit('activity_updated', {
          success: true,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Error actualizando actividad:', error);
      }
    }
  });
  
  // Actualizar actividad del usuario
  socket.on('update_activity', async () => {
    if (session?.user?._id) {
      try {
        const UserStatus = require('./models/userStatus');
        const userStatus = await UserStatus.getUserStatus(session.user._id);
        if (userStatus) {
          await userStatus.updateActivity();
        }
      } catch (error) {
        console.error('Error actualizando actividad:', error);
      }
    }
  });
  
  // 🚨 MANEJAR DESCONEXIÓN CON LIMPIEZA PUB/SUB
  socket.on('disconnect', async (reason) => {
    
    if (session && session.user) {
      
      // Desregistrar usuario del StateManager
      stateManager.unregisterUser(session.user._id);
      
      // 🚨 LIMPIEZA ROBUSTA DE SESIÓN
      try {
        const UserStatus = require('./models/userStatus');
        const userStatus = await UserStatus.getUserStatus(session.user._id);
        if (userStatus) {
          userStatus.isActive = false;
          userStatus.status = 'offline';
          userStatus.socketId = null;
          userStatus.lastActivity = new Date();
          await userStatus.save();
          
        }
        
        // 🚨 PUBLICAR EVENTO MQTT DE DESCONEXIÓN
        try {
          const mqttService = app.get('mqttService');
          if (mqttService && mqttService.isConnected) {
            mqttService.publishUserDisconnected(session.user._id, session.user.name);
          }
        } catch (mqttError) {
          console.error('❌ Error publicando evento MQTT de desconexión:', mqttError);
        }
        
        // 🚨 EMITIR EVENTOS PUB/SUB DE DESCONEXIÓN
        io.emit('user_disconnected', {
          userId: session.user._id,
          userName: session.user.name,
          timestamp: new Date().toISOString()
        });
        
        // 🚨 EMITIR EVENTO ESPECÍFICO PARA TABLA
        io.emit('active_users_updated', {
          type: 'user_disconnected',
          userId: session.user._id,
          userName: session.user.name,
          newStatus: 'offline',
          newLabel: 'Desconectado',
          newColor: '#6c757d',
          timestamp: new Date().toISOString()
        });
        
        // Emitir lista actualizada
        await emitActiveUsersList();
        
      } catch (error) {
        console.error('❌ Error limpiando sesión:', error);
      }
      
    } else {
    }
  });
});

// Función para emitir lista de usuarios activos
async function emitActiveUsersList() {
  try {
    const UserStatus = require('./models/userStatus');
    
    // Limpiar usuarios fantasma antes de obtener la lista
    await UserStatus.cleanupGhostUsers();
    
    const activeUsers = await UserStatus.getActiveUsers();
    
    // Emitir via Socket.IO
    io.emit('active_users_list', activeUsers);
    
    // 🚨 PUBLICAR VIA MQTT
    try {
      const mqttService = app.get('mqttService');
      if (mqttService && mqttService.isConnected) {
        mqttService.publishActiveUsersList(activeUsers);
      }
    } catch (mqttError) {
      console.error('❌ Error publicando lista via MQTT:', mqttError);
    }
    
  } catch (error) {
    console.error('❌ Error emitiendo lista de usuarios activos:', error);
  }
}

// Inicializar StateManager
stateManager.initialize(io);

// 🚀 INICIALIZAR BASE DE DATOS CON ESTADOS DESPUÉS DE LA CONEXIÓN
const { initializeDatabase } = require('./initDb');

// Esperar a que se establezca la conexión a MongoDB
mongoose.connection.once('open', async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
});

// 🚨 INICIALIZAR MQTT PARA COMUNICACIÓN PUB/SUB
const mqttService = new MQTTService();
mqttService.connect('mqtt://localhost:1884')
  .then(() => {
    // Suscribirse a topics necesarios
    if (mqttService.client) {
      // Topic de heartbeat
      mqttService.client.subscribe('telefonia/users/heartbeat/+');
      
      // Topics de búsqueda de clientes CRM
      mqttService.client.subscribe('crm/clientes/buscar/cedula/+');
      mqttService.client.subscribe('crm/clientes/buscar/fechas/+');
      mqttService.client.subscribe('crm/clientes/listar/todos/+');
      mqttService.client.subscribe('crm/clientes/actualizar/+');
      
      // Topics de búsqueda de tipificaciones
      mqttService.client.subscribe('crm/tipificaciones/buscar/fechas/+');
      
      // Topic de estadísticas del Dashboard
      mqttService.client.subscribe('crm/estadisticas/solicitar/+');
      
      mqttService.client.on('message', async (topic, message) => {
        // Heartbeat
        if (topic.startsWith('telefonia/users/heartbeat/')) {
          try {
            const data = JSON.parse(message.toString());
            const userId = data.userId;
            if (userId) {
              const UserStatus = require('./models/userStatus');
              const userStatus = await UserStatus.getUserStatus(userId);
              if (userStatus) {
                await userStatus.updateActivity();
              }
            }
          } catch (err) {
            console.error('❌ Error procesando heartbeat MQTT:', err);
          }
        }
        
        // 🔍 Búsqueda por cédula
        if (topic.startsWith('crm/clientes/buscar/cedula/')) {
          try {
            const data = JSON.parse(message.toString());
            const userId = topic.split('/').pop();
            const { cedula } = data;
            
            
            const Cliente = require('./models/cliente');
            const cliente = await Cliente.findOne({ cedula: cedula, activo: true });
            
            const resultTopic = `crm/clientes/resultado/${userId}`;
            
            if (cliente) {
              mqttService.publish(resultTopic, {
                success: true,
                tipoBusqueda: 'cedula',
                clientes: [cliente],
                count: 1,
                timestamp: new Date().toISOString()
              });
            } else {
              mqttService.publish(resultTopic, {
                success: false,
                tipoBusqueda: 'cedula',
                clientes: [],
                count: 0,
                message: 'Cliente no encontrado',
                timestamp: new Date().toISOString()
              });
            }
          } catch (err) {
            console.error('❌ Error en búsqueda por cédula MQTT:', err);
          }
        }
        
        // 🔍 Búsqueda por fechas
        if (topic.startsWith('crm/clientes/buscar/fechas/')) {
          try {
            const data = JSON.parse(message.toString());
            const userId = topic.split('/').pop();
            const { fechaInicio, fechaFin, page = 1, limit = 50 } = data;
            
            
            const Cliente = require('./models/cliente');
            
            // Convertir fechas - Colombia está en UTC-5
            // Cuando el usuario busca "2025-10-28", quiere desde las 00:00 hasta las 23:59 hora Colombia
            // Eso equivale a 05:00 UTC del día 28 hasta las 04:59 UTC del día 29
            const inicio = new Date(fechaInicio + 'T00:00:00-05:00');
            const fin = new Date(fechaFin + 'T23:59:59.999-05:00');
            
            // Buscar con paginación
            const skip = (page - 1) * limit;
            const clientes = await Cliente.find({
              activo: true,
              'interacciones.fecha': {
                $gte: inicio,
                $lte: fin
              }
            })
            .sort({ fechaUltimaInteraccion: -1 })
            .skip(skip)
            .limit(limit);
            
            const total = await Cliente.countDocuments({
              activo: true,
              'interacciones.fecha': {
                $gte: inicio,
                $lte: fin
              }
            });
            
            
            const resultTopic = `crm/clientes/resultado/${userId}`;
            mqttService.publish(resultTopic, {
              success: true,
              tipoBusqueda: 'fechas',
              clientes: clientes,
              count: clientes.length,
              total: total,
              page: page,
              limit: limit,
              hasMore: total > (page * limit),
              timestamp: new Date().toISOString()
            });
          } catch (err) {
            console.error('❌ Error en búsqueda por fechas MQTT:', err);
          }
        }
        
        // 📋 Listar todos los clientes (paginado)
        if (topic.startsWith('crm/clientes/listar/todos/')) {
          try {
            const data = JSON.parse(message.toString());
            const userId = topic.split('/').pop();
            const { page = 1, limit = 50, search = '' } = data;
            
            const Cliente = require('./models/cliente');
            
            // Filtro base: activos
            let query = { activo: true };
            
            // Si hay búsqueda textual (opcional)
            if (search) {
                const searchRegex = new RegExp(search, 'i');
                query.$or = [
                    { cedula: searchRegex },
                    { nombres: searchRegex },
                    { apellidos: searchRegex },
                    { correo: searchRegex }
                ];
            }
            
            const skip = (page - 1) * limit;
            
            const clientes = await Cliente.find(query)
            .sort({ fechaUltimaInteraccion: -1 })
            .skip(skip)
            .limit(limit);
            
            const total = await Cliente.countDocuments(query);
            
            const resultTopic = `crm/clientes/resultado/${userId}`;
            mqttService.publish(resultTopic, {
              success: true,
              tipoBusqueda: 'todos',
              clientes: clientes,
              count: clientes.length,
              total: total,
              page: page,
              limit: limit,
              hasMore: total > (page * limit),
              timestamp: new Date().toISOString()
            });
            
          } catch (err) {
            console.error('❌ Error listando todos los clientes MQTT:', err);
          }
        }
        
        // 🔄 Actualización de cliente
        if (topic.startsWith('crm/clientes/actualizar/')) {
          try {
            const data = JSON.parse(message.toString());
            const userId = topic.split('/').pop();
            const { cedula, datosActualizados } = data;
            
            
            const Cliente = require('./models/cliente');
            const cliente = await Cliente.findOne({ cedula: cedula, activo: true });
            
            if (!cliente) {
              mqttService.publish(`crm/clientes/actualizado/${userId}`, {
                success: false,
                message: 'Cliente no encontrado',
                timestamp: new Date().toISOString()
              });
              return;
            }
            
            // Actualizar campos
            Object.keys(datosActualizados).forEach(key => {
              if (key !== 'cedula' && key !== '_id' && datosActualizados[key] !== undefined) {
                cliente[key] = datosActualizados[key];
              }
            });
            
            await cliente.save();
            
            
            mqttService.publish(`crm/clientes/actualizado/${userId}`, {
              success: true,
              cliente: cliente,
              timestamp: new Date().toISOString()
            });
          } catch (err) {
            console.error('❌ Error en actualización de cliente MQTT:', err);
          }
        }
        
        // 📊 Estadísticas del Dashboard
        if (topic.startsWith('crm/estadisticas/solicitar/')) {
          try {
            const data = JSON.parse(message.toString());
            const userId = topic.split('/').pop();
            
            const Cliente = require('./models/cliente');
            const Tipificacion = require('./models/tipificacion');
            const UserStatus = require('./models/userStatus');
            const StatusType = require('./models/statusType');
            
            // 1. Agentes Conectados (estados de trabajo activos)
            const workStatusTypes = await StatusType.find({ category: 'work', isActive: true });
            const workStatusValues = workStatusTypes.map(st => st.value);
            
            const agentesConectados = await UserStatus.countDocuments({
              isActive: true,
              status: { $in: workStatusValues }
            });
            
            // Agentes ayer (para comparación)
            const ayer = new Date();
            ayer.setDate(ayer.getDate() - 1);
            ayer.setHours(0, 0, 0, 0);
            const ayerFin = new Date(ayer);
            ayerFin.setHours(23, 59, 59, 999);
            
            // Simplificado: asumir mismo número o calcular de logs si existe
            const agentesAyer = agentesConectados; // Simplificado
            
            // 2. Total Clientes CRM
            const totalClientes = await Cliente.countDocuments({ activo: true });
            
            // Clientes semana anterior
            const semanaAnterior = new Date();
            semanaAnterior.setDate(semanaAnterior.getDate() - 7);
            const clientesSemanaAnterior = await Cliente.countDocuments({
              activo: true,
              fechaCreacion: { $lt: semanaAnterior }
            });
            
            // 3. Tipificaciones Hoy
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const hoyFin = new Date();
            hoyFin.setHours(23, 59, 59, 999);
            
            const tipificacionesHoy = await Tipificacion.countDocuments({
              createdAt: { $gte: hoy, $lte: hoyFin },
              status: 'success'
            });
            
            // Tipificaciones ayer
            const tipificacionesAyer = await Tipificacion.countDocuments({
              createdAt: { $gte: ayer, $lte: ayerFin },
              status: 'success'
            });
            
            // 4. Llamadas en Cola (pendientes)
            const llamadasEnCola = await Tipificacion.countDocuments({
              status: 'pending'
            });
            
            // 5. Top 5 Agentes del Día
            const User = require('./models/users');
            const topAgentesData = await Tipificacion.aggregate([
              {
                $match: {
                  createdAt: { $gte: hoy, $lte: hoyFin },
                  assignedTo: { $exists: true, $ne: null }
                }
              },
              {
                $group: {
                  _id: '$assignedTo',
                  completadas: {
                    $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
                  },
                  pendientes: {
                    $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                  },
                  total: { $sum: 1 }
                }
              },
              {
                $sort: { completadas: -1 }
              },
              {
                $limit: 5
              }
            ]);
            
            // Enriquecer con nombres de agentes
            const topAgentes = await Promise.all(
              topAgentesData.map(async (agente) => {
                const user = await User.findById(agente._id).select('name');
                const efectividad = agente.total > 0 
                  ? Math.round((agente.completadas / agente.total) * 100) 
                  : 0;
                  
                return {
                  nombre: user ? user.name : 'Desconocido',
                  completadas: agente.completadas,
                  pendientes: agente.pendientes,
                  efectividad: efectividad
                };
              })
            );
            
            // 6. Distribución de Estados de Agentes
            const allUserStatuses = await UserStatus.find({ isActive: true }).populate('userId');
            
            const estadosMap = {};
            let totalAgentesActivos = 0;
            
            for (const userStatus of allUserStatuses) {
              if (userStatus.userId) {
                totalAgentesActivos++;
                const estado = userStatus.status;
                if (!estadosMap[estado]) {
                  estadosMap[estado] = {
                    count: 0,
                    label: userStatus.label || estado,
                    color: userStatus.color || '#6366f1'
                  };
                }
                estadosMap[estado].count++;
              }
            }
            
            // Convertir a array y calcular porcentajes
            const estadosAgentes = Object.keys(estadosMap).map(key => ({
              label: estadosMap[key].label,
              count: estadosMap[key].count,
              color: estadosMap[key].color,
              porcentaje: totalAgentesActivos > 0 
                ? Math.round((estadosMap[key].count / totalAgentesActivos) * 100) 
                : 0
            })).sort((a, b) => b.count - a.count);
            
            // 7. Tipificaciones por Hora del Día
            const tipificacionesPorHora = [];
            for (let hora = 0; hora < 24; hora++) {
              const horaInicio = new Date(hoy);
              horaInicio.setHours(hora, 0, 0, 0);
              const horaFin = new Date(hoy);
              horaFin.setHours(hora, 59, 59, 999);
              
              const count = await Tipificacion.countDocuments({
                createdAt: { $gte: horaInicio, $lte: horaFin },
                status: 'success'
              });
              
              tipificacionesPorHora.push({
                hora: hora,
                count: count
              });
            }
            
            // 8. Distribución por Nivel 1 (Top 8 categorías)
            const distribucionNivel1Data = await Tipificacion.aggregate([
              {
                $match: {
                  createdAt: { $gte: hoy, $lte: hoyFin },
                  status: 'success'
                }
              },
              {
                $group: {
                  _id: {
                    $cond: [
                      { $or: [
                        { $eq: ['$nivel1', ''] },
                        { $eq: ['$nivel1', null] }
                      ]},
                      'Sin categoría',
                      '$nivel1'
                    ]
                  },
                  count: { $sum: 1 }
                }
              },
              {
                $sort: { count: -1 }
              },
              {
                $limit: 8
              }
            ]);
            
            const distribucionNivel1 = distribucionNivel1Data.map(item => ({
              nivel1: item._id || 'Sin categoría',
              count: item.count
            }));
            
            
            const estadisticasCalculadas = {
              agentesConectados,
              agentesAyer,
              totalClientes,
              clientesSemanaAnterior,
              tipificacionesHoy,
              tipificacionesAyer,
              llamadasEnCola,
              topAgentes,
              estadosAgentes,
              tipificacionesPorHora,
              distribucionNivel1,
              timestamp: new Date().toISOString()
            };
            
            
            // Publicar estadísticas
            const topicRespuesta = `crm/estadisticas/respuesta/${userId}`;
            
            mqttService.publish(topicRespuesta, estadisticasCalculadas);
            
            
          } catch (err) {
            console.error('❌ Error calculando estadísticas MQTT:', err);
          }
        }
        
        // 📊 Búsqueda de Tipificaciones por Fechas
        if (topic.startsWith('crm/tipificaciones/buscar/fechas/')) {
          try {
            const data = JSON.parse(message.toString());
            const userId = topic.split('/').pop();
            const { fechaInicio, fechaFin, page = 1, limit = 100 } = data;
            
            
            const Tipificacion = require('./models/tipificacion');
            const User = require('./models/users');
            
            // Convertir fechas - Colombia está en UTC-5
            // Cuando el usuario busca "2025-10-28", quiere desde las 00:00 hasta las 23:59 hora Colombia
            // Eso equivale a 05:00 UTC del día 28 hasta las 04:59 UTC del día 29
            const inicio = new Date(fechaInicio + 'T00:00:00-05:00');
            const fin = new Date(fechaFin + 'T23:59:59.999-05:00');
            
            
            // Buscar tipificaciones con paginación
            const skip = (page - 1) * limit;
            
            // Primero contar todas sin paginación
            const totalSinFiltro = await Tipificacion.countDocuments({});
            
            // 🕐 Buscar por createdAt, updatedAt o timestamp (para incluir tipificaciones actualizadas hoy)
            // Si una tipificación se creó ayer pero se actualizó hoy, debe aparecer en la búsqueda de hoy
            const tipificaciones = await Tipificacion.find({
              $or: [
                { createdAt: { $gte: inicio, $lte: fin } },
                { updatedAt: { $gte: inicio, $lte: fin } },
                { timestamp: { $gte: inicio, $lte: fin } }
              ],
              status: 'success' // Solo mostrar tipificaciones completadas
            })
            .sort({ updatedAt: -1, createdAt: -1 }) // Ordenar por fecha de actualización primero
            .skip(skip)
            .limit(limit)
            .lean();
            
            
            // Enriquecer con datos de agente (cliente ya está en la tipificación)
            const tipificacionesEnriquecidas = await Promise.all(
              tipificaciones.map(async (tipif) => {
                // Obtener agente
                let agente = null;
                if (tipif.assignedTo) {
                  try {
                    const user = await User.findById(tipif.assignedTo).select('name email').lean();
                    if (user) {
                      agente = {
                        _id: user._id,
                        nombre: user.name,
                        email: user.email
                      };
                    }
                  } catch (err) {
                    console.warn(`⚠️ Error obteniendo agente ${tipif.assignedTo}:`, err.message);
                  }
                }
                
                // Cliente: usar datos de la tipificación (ya están ahí)
                const cliente = {
                  cedula: tipif.cedula || '',
                  tipoDocumento: tipif.tipoDocumento || '',
                  nombres: tipif.nombres || '',
                  apellidos: tipif.apellidos || '',
                  telefono: tipif.telefono || '',
                  correo: tipif.correo || '',
                  ciudad: tipif.ciudad || '',
                  departamento: tipif.departamento || '',
                  pais: tipif.pais || ''
                };
                
                // Calcular duración en minutos si existe
                let duracionMinutos = 0;
                if (tipif.duracion) {
                  duracionMinutos = Math.round(tipif.duracion / 60);
                } else if (tipif.startTime && tipif.endTime) {
                  const start = new Date(tipif.startTime);
                  const end = new Date(tipif.endTime);
                  duracionMinutos = Math.round((end - start) / 1000 / 60);
                } else if (tipif.timeInQueue) {
                  duracionMinutos = Math.round(tipif.timeInQueue);
                }
                
                // 🕐 Usar updatedAt si existe (fecha de última actualización), sino createdAt o timestamp
                const fechaMostrar = tipif.updatedAt || tipif.createdAt || tipif.timestamp || tipif.fecha;
                
                return {
                  _id: tipif._id,
                  fecha: fechaMostrar,
                  agente: agente,
                  cliente: cliente,
                  nivel1: tipif.nivel1 || '',
                  nivel2: tipif.nivel2 || '',
                  nivel3: tipif.nivel3 || '',
                  nivel4: tipif.nivel4 || '',
                  nivel5: tipif.nivel5 || '',
                  observaciones: tipif.observacion || tipif.observaciones || '',
                  duracionMinutos: duracionMinutos,
                  status: tipif.status,
                  idLlamada: tipif.idLlamada || ''
                };
              })
            );
            
            // Contar total con el mismo filtro
            const total = await Tipificacion.countDocuments({
              $or: [
                { createdAt: { $gte: inicio, $lte: fin } },
                { updatedAt: { $gte: inicio, $lte: fin } },
                { timestamp: { $gte: inicio, $lte: fin } }
              ],
              status: 'success' // Solo contar tipificaciones completadas
            });
            
            
            
            const resultTopic = `crm/tipificaciones/resultado/${userId}`;
            mqttService.publish(resultTopic, {
              success: true,
              tipificaciones: tipificacionesEnriquecidas,
              count: tipificacionesEnriquecidas.length,
              total: total,
              page: page,
              limit: limit,
              hasMore: total > (page * limit),
              timestamp: new Date().toISOString()
            });
            
            
          } catch (err) {
            console.error('❌ Error en búsqueda de tipificaciones MQTT:', err);
            const userId = topic.split('/').pop();
            const resultTopic = `crm/tipificaciones/resultado/${userId}`;
            mqttService.publish(resultTopic, {
              success: false,
              tipificaciones: [],
              count: 0,
              total: 0,
              error: err.message,
              timestamp: new Date().toISOString()
            });
          }
        }
      });
    }
  })
  .catch((error) => {
    console.error('❌ Error inicializando servicio MQTT:', error);
  });

// Hacer Socket.IO, StateManager y MQTT disponibles globalmente
app.set('io', io);
app.set('stateManager', stateManager);
app.set('mqttService', mqttService);

// 🚨 LIMPIEZA AUTOMÁTICA DE SESIONES FANTASMA CADA 2 MINUTOS
setInterval(async () => {
  try {
    
    const UserStatus = require('./models/userStatus');
    
    // Limpiar usuarios inactivos (más de 5 minutos sin heartbeat)
    // ⚠️ IMPORTANTE: Usar lastSeen (no lastActivity) porque es el campo que actualiza el heartbeat
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const io = app.get('io');
    
    // Obtener usuarios que podrían estar inactivos
    const potentiallyInactiveUsers = await UserStatus.find({
      isActive: true,
      lastSeen: { $lt: fiveMinutesAgo }
    }).lean();
    
    let cleanedCount = 0;
    
    // Verificar cada usuario para ver si realmente está desconectado
    for (const userStatus of potentiallyInactiveUsers) {
      let shouldMarkInactive = false;
      
      // Si no tiene socketId, marcarlo como inactivo
      if (!userStatus.socketId) {
        shouldMarkInactive = true;
      } else {
        // Si tiene socketId, verificar si el socket realmente está conectado
        try {
          if (io && io.sockets) {
            const socket = io.sockets.sockets.get(userStatus.socketId);
            if (!socket || !socket.connected) {
              // Socket no existe o no está conectado
              shouldMarkInactive = true;
            }
            // Si el socket existe y está conectado, mantenerlo activo
          } else {
            // Si no hay io disponible, usar el campo lastSeen como criterio
            shouldMarkInactive = true;
          }
        } catch (socketError) {
          // Error verificando socket, asumir que está desconectado
          shouldMarkInactive = true;
        }
      }
      
      // Marcar como inactivo si corresponde
      if (shouldMarkInactive) {
        await UserStatus.updateOne(
          { _id: userStatus._id },
          {
            isActive: false,
            status: 'offline'
          }
        );
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Limpieza automática: ${cleanedCount} usuarios marcados como inactivos`);
      // Emitir lista actualizada después de la limpieza
      await emitActiveUsersList();
    }
    
  } catch (error) {
    console.error('❌ Error en limpieza automática:', error);
  }
}, 2 * 60 * 1000); // Cada 2 minutos

const job = schedule.scheduleJob("0 0 23 * * *", async function () {
  let modeloKardex = mongoose.model(
    `660f0fccec23b700dae2135f_kardex`,
    kardexSchema,
    `660f0fccec23b700dae2135f_kardex`
  );
  const cartera = await modeloKardex.find({
    nombreClienteFinal: { $ne: "jared" },
  });

  let carteraTotal = 0;
  let carteraAfavor = 0;
  cartera.map((x) => {
    carteraTotal += simpleMoneyMask.formatToNumber(x.deuda);
    carteraAfavor += simpleMoneyMask.formatToNumber(x.aFavor);
  });
  let carteraTotalDinero = simpleMoneyMask.formatToCurrency(
    carteraTotal - carteraAfavor
  );
  let modeloHistoricoCartera = mongoose.model(
    `660f0fccec23b700dae2135f_historicoCartera`,
    historicoCartera,
    `660f0fccec23b700dae2135f_historicoCartera`
  );
  let carteraCliente = new modeloHistoricoCartera({
    valor: carteraTotalDinero,
  });
  carteraCliente.save();
});

//404 error
app.use((req, res, next) => {
  //res.status(404).render("404.html");
  res.status(404).send("404.html");
});

module.exports = { app, server, io, emitActiveUsersList };

aedes.on('client', function (client) {
  aedes.publish({
    topic: 'activeUsers/connected',
    payload: JSON.stringify({ clientId: client.id, username: client?.connDetails?.username || client?.username }),
    qos: 0,
    retain: false
  });
});

aedes.on('clientDisconnect', function (client) {
  aedes.publish({
    topic: 'activeUsers/disconnected',
    payload: JSON.stringify({ clientId: client.id, username: client?.connDetails?.username || client?.username }),
    qos: 0,
    retain: false
  });
});

aedes.authenticate = function (client, username, password, callback) {
  
  // Permitir conexiones sin autenticación para el backend interno
  if (client && client.id && client.id.startsWith('backend_')) {
    callback(null, true);
    return;
  }
  
  // Para otros clientes, permitir si tienen username o si no lo requieren
  if (username || !username) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};
