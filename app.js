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

app.set("port", process.env.PORT || 9035);
app.set("views", path.join(__dirname, "views"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(morgan("dev"));
require("dotenv").config();

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
    sameSite: 'lax',
    domain: 'localhost' // Especificar dominio
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

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // Permitir solicitudes desde cualquier origen
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Configurar CORS para permitir credenciales
app.use(cors({
  origin: "http://localhost:8080", // URL del frontend Vue
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
      name: user.name,
      email: user.correo,
      role: user.role,
      socketId: socket.id
    });
    
    // Inicializar estado de usuario en la base de datos
    try {
      const UserStatus = require('./models/userStatus');
      await UserStatus.upsertStatus(user._id, {
        status: 'online',
        isActive: true,
        socketId: socket.id,
        sessionId: session.sessionID
      });
      
      console.log(`✅ Usuario ${user.name} inicializado correctamente`);
      
      // Enviar estado actual al usuario
      const userStatus = await UserStatus.getUserStatus(user._id);
      socket.emit('own_status_changed', userStatus);
      
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
    console.log('🔄 Cambio de estado solicitado:', data);
    
    if (session?.user?._id) {
      try {
        const user = session.user;
        console.log(`   - Usuario: ${user.name}`);
        console.log(`   - Nuevo estado: ${data.status}`);
        console.log(`   - Estado personalizado: ${data.customStatus || 'Ninguno'}`);
        
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
        
        // Emitir cambio a todos los usuarios
        io.emit('user_status_changed', {
          userId: user._id,
          userName: user.name,
          status: updatedStatus
        });
        
        // Enviar lista actualizada de usuarios activos
        await emitActiveUsersList();
        
        console.log(`✅ Estado cambiado exitosamente para ${user.name}`);
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
  
  // Manejar desconexión
  socket.on('disconnect', async () => {
    console.log('Usuario desconectado:', socket.id);
    
    if (session && session.user) {
      // Desregistrar usuario del StateManager
      stateManager.unregisterUser(session.user._id);
      
      // Marcar usuario como desconectado
      try {
        const UserStatus = require('./models/userStatus');
        const userStatus = await UserStatus.getUserStatus(session.user._id);
        if (userStatus) {
          userStatus.isActive = false;
          userStatus.socketId = null;
          await userStatus.save();
        }
        
        // Emitir lista actualizada
        await emitActiveUsersList();
      } catch (error) {
        console.error('Error desconectando usuario:', error);
      }
      
      console.log(`Usuario ${session.user.name} desconectado`);
    }
  });
});

// Función para emitir lista de usuarios activos
async function emitActiveUsersList() {
  try {
    const UserStatus = require('./models/userStatus');
    const activeUsers = await UserStatus.getActiveUsers();
    
    io.emit('active_users_list', activeUsers);
    console.log(`📊 Lista de usuarios activos emitida: ${activeUsers.length} usuarios`);
  } catch (error) {
    console.error('❌ Error emitiendo lista de usuarios activos:', error);
  }
}

// Inicializar StateManager
stateManager.initialize(io);

// Hacer Socket.IO y StateManager disponibles globalmente
app.set('io', io);
app.set('stateManager', stateManager);

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

module.exports = { app, server, io };
