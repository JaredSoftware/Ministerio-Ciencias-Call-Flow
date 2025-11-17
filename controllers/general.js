const config = require("./config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
//models
const users = require("../models/users");
const tokens = require("../models/tokens");
const moment = require("moment/moment");
const rol = require("../models/roles");
const qs = require("qs");
const clientes = require("../models/clietes");
const historicoCartera = require("../models/historicoCartera");
const csv = require("csvtojson");
const mongoose = require("mongoose");
//schemas
const platanoViajeSchema = require("../models/platano");
const kardexSchema = require("../models/kardex");
const schemaAbono = require("../models/abono");
const simpleMoneyMask = require("simple-mask-money");
const { v4: uuidv4 } = require("uuid");
const async = require("async");

module.exports = {
  form: async (req, res) => {
    try {
      if (config.pay === false) {
        console.error('[AUTH] ❌ Login fallido: Token disabled', {
          email: req.body.email,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
        res.send({ login: false, error: "token disabled" });
      } else {
        if (!req.body.email || !req.body.password) {
          console.error('[AUTH] ❌ Login fallido: Faltan credenciales', {
            hasEmail: !!req.body.email,
            hasPassword: !!req.body.password,
            ip: req.ip,
            userAgent: req.get('user-agent')
          });
          res.send({
            login: false,
            error: "por favor ingrese correo y contraseña",
          });
        } else {
          const FindUser = await users.findOne({
            correo: req.body.email,
          });

          const projection = {
            password: 0,
            role: 0,
            active: 0,
          };

          const UserWithCredentials = await users.findOne(
            {
              _id: FindUser._id,
            },
            projection
          );

          if (FindUser) {
            // Verificar contraseña usando bcrypt
            const isPasswordValid = await bcrypt.compare(req.body.password, FindUser.password);
            if (isPasswordValid) {
              if (!FindUser.active == false) {
                req.session.user = FindUser;
                req.session.userId = FindUser._id;
                req.session.userName = FindUser.name;
                req.session.userEmail = FindUser.correo;
                
                req.session.save((err) => {
                  if (err) {
                    console.error('[AUTH] ❌ Error guardando sesión:', {
                      error: err.message,
                      userId: FindUser._id,
                      sessionId: req.sessionID,
                      ip: req.ip,
                      timestamp: new Date().toISOString()
                    });
                  }
                });
                
                // Crear un token con la información del usuario
                const role = await rol.findOne({ _id: FindUser.role });

                const token = jwt.sign({ userId: FindUser._id }, "g8SlhhpH6O", {
                  expiresIn: "1h",
                });
                const tokenRole = jwt.sign({ role: role._id }, "g8SlhhpH6O");

                if (req.body.rememberme == true) {
                  const crearToken = new tokens({
                    token: token,
                    name: FindUser.name,
                    whenWasMaked: moment().format("YYYY-MM-DD"),
                  });
                  await crearToken.save();
                }

                // Actualizar estado global del usuario
                const stateManager = req.app.get('stateManager');
                if (stateManager) {
                  stateManager.setUserState(FindUser._id, {
                    isLoggedIn: true,
                    lastLogin: new Date(),
                    role: role,
                    sessionId: req.sessionID
                  });
                  
                  // Enviar notificación de login
                  stateManager.sendGlobalNotification({
                    type: 'user_login',
                    message: `${FindUser.name} ha iniciado sesión`,
                    userId: FindUser._id,
                    userName: FindUser.name
                  });
                }

                // Asignar estado por defecto al usuario
                try {
                  const UserStatus = require('../models/userStatus');
                  
                  
                  // Crear o actualizar el estado del usuario (usará el estado por defecto automáticamente)
                  await UserStatus.upsertStatus(FindUser._id, {
                    isActive: true,
                    sessionId: req.sessionID
                  });
                  

                  // 🚨 EMITIR EVENTOS SOLO POR MQTT (NO WEBSOCKET)
                  try {
                    const mqttService = req.app.get('mqttService');
                    // Publicar usuario conectado por MQTT
                    mqttService.publishUserConnected(FindUser._id, FindUser.name, FindUser.role);
                    // Publicar lista de usuarios activos por MQTT
                    const activeUsers = await UserStatus.getActiveUsers();
                    mqttService.publishActiveUsersList(activeUsers);
                  } catch (pubsubError) {
                    console.error('❌ Error emitiendo eventos MQTT (login):', pubsubError);
                  }
                } catch (statusError) {
                  console.error('❌ Error asignando estado dinámico:', statusError);
                }


                res.send({
                  user: true,
                  login: true,
                  error: null,
                  token,
                  tokenRole,
                  role: role,
                  user: UserWithCredentials,
                });
              } else {
                console.error('[AUTH] ❌ Login fallido: Usuario no activo', {
                  email: req.body.email,
                  userId: FindUser._id,
                  ip: req.ip,
                  userAgent: req.get('user-agent')
                });
                res.send({ login: false, error: "Usuario no activo" });
              }
            } else {
              console.error('[AUTH] ❌ Login fallido: Contraseña incorrecta', {
                email: req.body.email,
                userId: FindUser?._id,
                ip: req.ip,
                userAgent: req.get('user-agent')
              });
              res.send({ user: true, login: false, error: null });
            }
          } else {
            console.error('[AUTH] ❌ Login fallido: Usuario no encontrado', {
              email: req.body.email,
              ip: req.ip,
              userAgent: req.get('user-agent')
            });
            res.send({ user: false, login: false, error: null });
          }
        }
      }
    } catch (error) {
      console.error('[AUTH] ❌ Error crítico en login:', {
        error: error.message,
        stack: error.stack,
        email: req.body?.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });
      res.status(500).send({ login: false, error: "Error interno del servidor" });
    }
  },
  makeUser: async (req, res) => {
    try {
      if (!req.body.email || !req.body.password || !req.body.name) {
        res.send({
          success: false,
          error: "por favor ingrese correo, contraseña y nombre",
        });
        return;
      }
      
      // Verificar si el correo ya existe
      const existingUser = await users.findOne({ correo: req.body.email });
      if (existingUser) {
        res.send({
          success: false,
          error: "El correo electrónico ya está registrado",
        });
        return;
      }
      
      // Verificar si el idAgent ya existe (solo si se proporciona y no está vacío)
      if (req.body.idAgent && req.body.idAgent.trim() !== '') {
        const existingAgent = await users.findOne({ idAgent: req.body.idAgent.trim() });
        if (existingAgent) {
          res.send({
            success: false,
            error: "El ID Agente ya está registrado. Debe ser único para cada persona.",
          });
          return;
        }
      }
      
      // Buscar rol "asesor" o crear uno por defecto
      let role = await rol.findOne({ nombre: "asesor" });
      if (!role) {
        // Si no existe el rol asesor, crear uno por defecto
        role = new rol({
          nombre: "asesor",
          permissions: ["read", "write"]
        });
        await role.save();
      }
      
      // Cifrar la contraseña antes de guardar
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
      
      const makeUser = new users({
        correo: req.body.email,
        password: hashedPassword,
        name: req.body.name,
        lastName: req.body.lastName,
        Phone: req.body.Phone,
        ID: req.body.ID,
        idAgent: req.body.idAgent && req.body.idAgent.trim() !== '' ? req.body.idAgent.trim() : undefined, // Campo único para identificar al agente
        role: role._id,
        active: false,
      });
      await makeUser.save();
      res.send({ success: true, user: makeUser });
    } catch (error) {
      console.error('Error creando usuario:', error);
      res.status(500).send({ success: false, error: "Error al crear usuario" });
    }
  },
  updateUser: async (req, res) => {
    try {
      
      if (!req.body.id) {
        return res.send({
          success: false,
          error: "por favor ingrese el id del usuario",
        });
      }
      
      // Si se está actualizando el email, verificar que no exista
      if (req.body.email) {
        const existingUser = await users.findOne({ 
          correo: req.body.email,
          _id: { $ne: req.body.id } // Excluir el usuario actual
        });
        
        if (existingUser) {
          res.send({
            success: false,
            error: "El correo electrónico ya está registrado por otro usuario",
          });
          return;
        }
      }

      // Si se está actualizando el idAgent, verificar que no exista
      if (req.body.idAgent && req.body.idAgent.trim() !== '') {
        const existingAgent = await users.findOne({ 
          idAgent: req.body.idAgent.trim(),
          _id: { $ne: req.body.id } // Excluir el usuario actual
        });
        
        if (existingAgent) {
          res.send({
            success: false,
            error: "El ID Agente ya está registrado por otro usuario. Debe ser único para cada persona.",
          });
          return;
        }
      }
      
      var dataForUpdate = {};
      if (req.body.email) {
        dataForUpdate.correo = req.body.email;
      }
      if (req.body.name) {
        dataForUpdate.name = req.body.name;
      }
      if (req.body.idAgent !== undefined) {
        // Actualizar idAgent (puede ser vacío para limpiarlo)
        dataForUpdate.idAgent = req.body.idAgent && req.body.idAgent.trim() !== '' ? req.body.idAgent.trim() : undefined;
      }
      if (req.body.password) {
        // Cifrar la nueva contraseña antes de actualizar
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        dataForUpdate.password = hashedPassword;
      }


      // Verificar si el usuario existe
      let existingUser;
      try {
        existingUser = await users.findById(req.body.id);
      } catch (findError) {
        console.error('🔍 Error buscando usuario:', findError);
        return res.send({ 
          success: false, 
          error: "Error al buscar el usuario: " + findError.message
        });
      }
      
      if (!existingUser) {
        return res.send({ 
          success: false, 
          error: "Usuario no encontrado"
        });
      }

      const update = await users.updateOne(
        { _id: req.body.id },
        dataForUpdate
      );


      if (update.modifiedCount > 0) {
        res.send({ 
          success: true, 
          update,
          message: "Usuario actualizado correctamente"
        });
      } else {
        res.send({ 
          success: false, 
          error: "No se realizaron cambios en el usuario"
        });
      }
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      res.send({ 
        success: false, 
        error: "Error interno del servidor al actualizar usuario"
      });
    }
  },
  // Endpoint temporal para listar todos los usuarios
  listUsers: async (req, res) => {
    try {
      const allUsers = await users.find({}, '_id name correo idAgent').limit(10);
      res.send({
        success: true,
        users: allUsers,
        count: allUsers.length
      });
    } catch (error) {
      console.error('Error listando usuarios:', error);
      res.send({
        success: false,
        error: "Error interno del servidor"
      });
    }
  },
  // Endpoint temporal para verificar si un usuario existe
  checkUser: async (req, res) => {
    try {
      const { id } = req.body;
      
      const user = await users.findById(id);
      if (user) {
        res.send({
          success: true,
          user: {
            _id: user._id,
            name: user.name,
            email: user.correo,
            idAgent: user.idAgent
          }
        });
      } else {
        res.send({
          success: false,
          error: "Usuario no encontrado"
        });
      }
    } catch (error) {
      console.error('Error verificando usuario:', error);
      res.send({
        success: false,
        error: "Error interno del servidor"
      });
    }
  },
  // Endpoint simple para verificar usuario por ID en URL
  checkUserById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await users.findById(id);
      if (user) {
        res.send({
          success: true,
          user: {
            _id: user._id,
            name: user.name,
            email: user.correo,
            idAgent: user.idAgent
          }
        });
      } else {
        res.send({
          success: false,
          error: "Usuario no encontrado"
        });
      }
    } catch (error) {
      console.error('Error verificando usuario:', error);
      res.send({
        success: false,
        error: "Error interno del servidor"
      });
    }
  },
  deletUser: async (req, res) => {
    try {
      if (!req.body.id) {
        return res.send({
          success: false,
          error: "por favor ingrese el id del usuario",
        });
      }
      
      const deleteOneUser = await users.deleteOne({ _id: req.body.id });

      if (deleteOneUser.deletedCount > 0) {
        res.send({ 
          success: true, 
          deleteOneUser,
          message: "Usuario eliminado correctamente"
        });
      } else {
        res.send({ 
          success: false, 
          error: "Usuario no encontrado o ya eliminado"
        });
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      res.send({ 
        success: false, 
        error: "Error interno del servidor al eliminar usuario"
      });
    }
  },
  userToken: async (req, res) => {
    try {
      const { token } = req.body;
      const info = await tokens.find({ token });
      if (info.length > 0) {
        res.send({ token: true });
      } else {
        res.send({ token: false });
      }
    } catch (error) {
    }
  },
  userEmailExist: async (req, res) => {
    try {
      if (!req.body.email) {
        res.send({
          login: false,
          error: "por favor ingrese correo y contraseña",
        });
      } else {
        const FindUser = await users.findOne({
          correo: req.body.email,
        });

        if (FindUser) {
          res.send({ user: true, error: null });
        } else {
          res.send({ user: false, error: null });
        }
      }
    } catch (error) {
    }
  },
  makerRole: async (req, res) => {
    try {
      // Validaciones básicas
      if (!req.body.role || !req.body.role.trim()) {
        return res.status(400).send({ 
          success: false, 
          error: "El nombre del rol es requerido" 
        });
      }

      if (!req.body.permissions) {
        return res.status(400).send({ 
          success: false, 
          error: "Los permisos son requeridos" 
        });
      }

      // Verificar si el rol ya existe
      const existingRole = await rol.findOne({ nombre: req.body.role.trim() });
      if (existingRole) {
        return res.status(400).send({ 
          success: false, 
          error: "Ya existe un rol con ese nombre" 
        });
      }

      // Crear el rol
      const addRole = new rol({
        nombre: req.body.role.trim(),
        permissions: req.body.permissions,
        descripcion: req.body.descripcion || `Rol ${req.body.role.trim()}`,
        isActive: true
      });

      const savedRole = await addRole.save();
      

      res.status(201).send({ 
        success: true, 
        role: savedRole,
        message: `Rol '${savedRole.nombre}' creado exitosamente`
      });

    } catch (error) {
      console.error('❌ Error creando rol:', error);
      res.status(500).send({ 
        success: false, 
        error: "Error interno del servidor al crear rol"
      });
    }
  },
  role: async (req, res) => {
    try {
      const token = req.body.token;
      const getDecodeInfo = await jwt.decode(token, "g8SlhhpH6O");

      if (getDecodeInfo && getDecodeInfo.userId) {
        // Buscar el usuario primero
        const user = await users.findOne({ _id: getDecodeInfo.userId });
        if (user && user.role) {
          // Ahora buscar el rol del usuario
          const addRole = await rol.findOne({ _id: user.role });
          res.send(addRole);
        } else {
          res.send({
            login: false,
            error: {
              role: null,
              message: "Usuario sin rol asignado",
            },
          });
        }
      } else {
        res.send({
          login: false,
          error: {
            role: null,
            message: "no se econtro un role para este usuario",
          },
        });
      }
    } catch (error) {
    }
  },
  roles: async (req, res) => {
    try {
      const addRole = await rol.find();
      res.send(addRole);
    } catch (error) {
    }
  },
  allUsers: async (req, res) => {
    try {
      const projection = {
        password: 0,
      };

      const roles = await rol.find();
      const body = qs.parse(req.body);
      const roleUser = body.role;

      const rolesKeepIds = [];
      // Ahora, filtra los roles que tienen menos o igual permisos que el rol del usuario.
      const rolesToKeep = roles.filter(
        (rol) => rol.permissions.length <= roleUser.permissions.length
      );

      rolesToKeep.map((x) => {
        rolesKeepIds.push({ role: x._id });
      });

      // Actualiza el rol del usuario con los roles que tienen menos o igual permisos que el rol del usuario.

      const addRole = await users.find({ $or: rolesKeepIds }, projection);

      res.send(addRole);
    } catch (error) {
    }
  },
  roleChanger: async (req, res) => {
    try {
      const user = qs.parse(req.body.user);
      const addRole = await users.findOneAndUpdate(
        { _id: req.body.id },
        { role: req.body.role },
        { new: true }
      );
      if (user._id === req.body.id) {
        res.send({ addRole, restart: true });
      } else {
        res.send({ addRole, restart: false });
      }
    } catch (error) {
    }
  },
  statChanger: async (req, res) => {
    try {
      const user = qs.parse(req.body.user);
      const addRole = await users.findOneAndUpdate(
        { _id: req.body.id },
        { active: req.body.active },
        { new: true }
      );
      if (user._id === req.body.id) {
        res.send({ addRole, restart: true });
      } else {
        res.send({ addRole, restart: false });
      }
    } catch (error) {
    }
  },
  changePassword: async (req, res) => {
    try {
      if (!req.body.userId || !req.body.currentPassword || !req.body.newPassword) {
        res.send({
          success: false,
          error: "Se requiere userId, contraseña actual y nueva contraseña"
        });
        return;
      }

      // Buscar el usuario
      const user = await users.findById(req.body.userId);
      if (!user) {
        res.send({
          success: false,
          error: "Usuario no encontrado"
        });
        return;
      }

      // Verificar la contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        res.send({
          success: false,
          error: "La contraseña actual es incorrecta"
        });
        return;
      }

      // Cifrar la nueva contraseña
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(req.body.newPassword, saltRounds);

      // Actualizar la contraseña
      const updatedUser = await users.findByIdAndUpdate(
        req.body.userId,
        { 
          password: hashedNewPassword,
          updatedAt: new Date()
        },
        { new: true }
      );

      res.send({
        success: true,
        message: "Contraseña actualizada correctamente",
        user: {
          _id: updatedUser._id,
          email: updatedUser.correo,
          name: updatedUser.name
        }
      });

    } catch (error) {
      res.status(500).send({
        success: false,
        error: "Error interno del servidor"
      });
    }
  },
  generateHashedPassword: async (req, res) => {
    try {
      // Función de utilidad para generar contraseñas hasheadas (solo para desarrollo)
      if (!req.body.password) {
        res.send({
          success: false,
          error: "Se requiere una contraseña"
        });
        return;
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

      res.send({
        success: true,
        originalPassword: req.body.password,
        hashedPassword: hashedPassword
      });

    } catch (error) {
      res.status(500).send({
        success: false,
        error: "Error al generar hash de contraseña"
      });
    }
  }
};
