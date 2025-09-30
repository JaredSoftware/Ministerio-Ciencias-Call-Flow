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
  console.log('🚀 Broker MQTT TCP escuchando en puerto', MQTT_PORT);
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
  console.log('🚀 Broker MQTT WebSocket escuchando en puerto', WS_PORT);
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
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "ministerio_educacion_secret_key",
  resave: false,
  saveUninitialized: true, // Cambiar a true para crear sesiones
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax'
    // Sin domain para que funcione en cualquier dominio/IP
  },
  name: 'ministerio_educacion_session'
});

app.use(sessionMiddleware);

// Compartir sesión con Socket.IO de forma más robusta
io.use((socket, next) => {
  console.log('🔍 Socket.IO middleware - Verificando sesión...');
  
  // Envolver la request para Socket.IO
  const req = socket.request;
  const res = {};
  
  sessionMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ Error en sessionMiddleware:', err);
      return next(err);
    }
    
    console.log('✅ Session middleware ejecutado');
    console.log('   - Session ID:', req.sessionID);
    console.log('   - Session data:', req.session);
    console.log('   - User en session:', !!req.session?.user);
    console.log('   - Session keys:', Object.keys(req.session || {}));
    
    if (req.session?.user) {
      console.log('👤 Usuario autenticado:', req.session.user.name);
    } else {
      console.log('❌ No hay usuario en la sesión');
      console.log('   - Posibles causas:');
      console.log('     * Login no completado');
      console.log('     * Sesión expirada');
      console.log('     * Cookies no compartidas');
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
app.use(serveStatic(path.join(__dirname, "./dist")));
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
//app.use("/fontAwesome",express.static(path.join(__dirname, "node_modules","font-awesome")));
//app.use((req, res, next)=>{res.locals.db = {MongoClient, url, client,dbName},next();});

//routes
app.use(require("./routes/index.routes"));
//static
app.use(express.static(path.join(__dirname, "public")));

// Manejo de Socket.IO
io.on('connection', async (socket) => {
  console.log('🔌 Usuario conectado:', socket.id);
  
  // Obtener información de la sesión
  const session = socket.request.session;
  console.log('   - Session existe:', !!session);
  console.log('   - User en session:', !!session?.user);
  
  if (session && session.user) {
    const user = session.user;
    console.log(`👤 Usuario autenticado: ${user.name} (${user._id})`);
    
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
      
      console.log(`🔄 Inicializando estado para ${user.name} en Socket.IO`);
      
      await UserStatus.upsertStatus(user._id, {
        isActive: true,
        socketId: socket.id,
        sessionId: session.sessionID
      });
      
      console.log(`✅ Usuario ${user.name} inicializado correctamente con estado dinámico`);
      
      // Enviar estado actual al usuario
      const userStatus = await UserStatus.getUserStatus(user._id);
      socket.emit('own_status_changed', userStatus);
      
      // 🚨 PUBLICAR EVENTO MQTT DE CONEXIÓN
      try {
        const mqttService = app.get('mqttService');
        if (mqttService && mqttService.isConnected) {
          console.log(`📤 Publicando conexión de ${user.name} via MQTT`);
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
    console.log('⚠️ Usuario no autenticado, solo Socket.IO conectado');
  }
  
  // Manejar eventos de estado de la aplicación
  socket.on('user_action', (data) => {
    console.log('Acción del usuario:', data);
    
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
    console.log('Cambio de estado:', data);
    
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
    console.log('Actualización de flujo:', data);
    
    if (session?.user?._id) {
      stateManager.handleWorkflow({
        userId: session.user._id,
        ...data
      });
    }
  });
  
  // Manejar notificaciones
  socket.on('send_notification', (data) => {
    console.log('Enviando notificación:', data);
    
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
    console.log('🚨 WEBSOCKET: Cambio manual de estado recibido:', data);
    
    if (session?.user?._id) {
      try {
        const user = session.user;
        console.log(`🚨 WEBSOCKET: Usuario ${user.name} cambió manualmente a: ${data.status}`);
        console.log(`   - Estado personalizado: ${data.customStatus || 'Ninguno'}`);
        console.log(`   - Session ID: ${session.sessionID}`);
        console.log(`   - Socket ID: ${socket.id}`);
        
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
        
        console.log(`✅ WEBSOCKET: Estado cambiado exitosamente para ${user.name}`);
        console.log(`   - Nuevo estado: ${updatedStatus.status} (${updatedStatus.label})`);
        console.log(`   - Color: ${updatedStatus.color}`);
        console.log(`   - Eventos emitidos: own_status_changed, user_status_changed, active_users_updated`);
      } catch (error) {
        console.error('❌ Error cambiando estado:', error);
        socket.emit('status_change_error', { error: error.message });
      }
    } else {
      console.log('❌ Usuario no autenticado, no se puede cambiar estado');
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
    console.log('🔄 Sincronización de estado recibida:', data);
    
    if (session?.user?._id) {
      try {
        const user = session.user;
        const { status } = data;
        
        console.log(`   - Usuario: ${user.name}`);
        console.log(`   - Estado: ${status.status}`);
        console.log(`   - Session ID: ${session.sessionID}`);
        
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
        
        console.log(`✅ Estado sincronizado para ${user.name}`);
        
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
        console.log(`💓 Heartbeat recibido de ${user.name} via Socket.IO`);
        
        // Actualizar actividad del usuario
        const UserStatus = require('./models/userStatus');
        const userStatus = await UserStatus.getUserStatus(user._id);
        if (userStatus) {
          await userStatus.updateActivity();
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
        console.log(`🔄 Actualizando actividad de ${user.name}`);
        
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
    console.log('🔌 Usuario desconectado:', socket.id);
    console.log('   - Razón:', reason);
    
    if (session && session.user) {
      console.log(`🧹 Limpiando sesión de: ${session.user.name}`);
      
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
          
          console.log(`✅ Sesión limpiada para: ${session.user.name}`);
        }
        
        // 🚨 PUBLICAR EVENTO MQTT DE DESCONEXIÓN
        try {
          const mqttService = app.get('mqttService');
          if (mqttService && mqttService.isConnected) {
            console.log(`📤 Publicando desconexión de ${session.user.name} via MQTT`);
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
      
      console.log(`🔌 Usuario ${session.user.name} completamente desconectado`);
    } else {
      console.log('⚠️ Desconexión sin sesión de usuario');
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
        console.log(`📤 Lista de usuarios activos publicada via MQTT: ${activeUsers.length} usuarios`);
      }
    } catch (mqttError) {
      console.error('❌ Error publicando lista via MQTT:', mqttError);
    }
    
    console.log(`📊 Lista de usuarios activos emitida: ${activeUsers.length} usuarios`);
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
  console.log('✅ Conexión a MongoDB establecida, inicializando estados...');
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
    console.log('✅ Servicio MQTT inicializado correctamente');
    // Suscribirse al topic de heartbeat
    if (mqttService.client) {
      mqttService.client.subscribe('telefonia/users/heartbeat/+');
      mqttService.client.on('message', async (topic, message) => {
        if (topic.startsWith('telefonia/users/heartbeat/')) {
          try {
            const data = JSON.parse(message.toString());
            const userId = data.userId;
            if (userId) {
              const UserStatus = require('./models/userStatus');
              const userStatus = await UserStatus.getUserStatus(userId);
              if (userStatus) {
                await userStatus.updateActivity();
                console.log(`💓 Heartbeat MQTT recibido y actualizado para usuario: ${userId}`);
              }
            }
          } catch (err) {
            console.error('❌ Error procesando heartbeat MQTT:', err);
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
    console.log('🧹 Ejecutando limpieza automática de sesiones fantasma...');
    
    const UserStatus = require('./models/userStatus');
    
    // Limpiar usuarios inactivos (más de 3 minutos sin heartbeat)
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const result = await UserStatus.updateMany(
      { 
        isActive: true, 
        lastActivity: { $lt: threeMinutesAgo } 
      },
      { 
        isActive: false,
        status: 'offline'
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Limpieza automática: ${result.modifiedCount} sesiones fantasma eliminadas`);
      
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
  console.log('🔗 Cliente MQTT conectado:', client ? client.id : client, 'username:', client?.connDetails?.username || client?.username);
  aedes.publish({
    topic: 'activeUsers/connected',
    payload: JSON.stringify({ clientId: client.id, username: client?.connDetails?.username || client?.username }),
    qos: 0,
    retain: false
  });
});

aedes.on('clientDisconnect', function (client) {
  console.log('❌ Cliente MQTT desconectado:', client ? client.id : client, 'username:', client?.connDetails?.username || client?.username);
  aedes.publish({
    topic: 'activeUsers/disconnected',
    payload: JSON.stringify({ clientId: client.id, username: client?.connDetails?.username || client?.username }),
    qos: 0,
    retain: false
  });
});

aedes.authenticate = function (client, username, password, callback) {
  console.log('Autenticando MQTT:', {
    clientId: client && client.id,
    username,
    password: password && password.toString()
  });
  
  // Permitir conexiones sin autenticación para el backend interno
  if (client && client.id && client.id.startsWith('backend_')) {
    console.log('✅ Autenticación MQTT permitida para backend interno');
    callback(null, true);
    return;
  }
  
  // Para otros clientes, permitir si tienen username o si no lo requieren
  if (username || !username) {
    console.log('✅ Autenticación MQTT permitida');
    callback(null, true);
  } else {
    console.log('❌ Autenticación MQTT rechazada');
    callback(null, false);
  }
};
