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
        res.send({ login: false, error: "token disabled" });
        console.log("token disabled");
      } else {
        if (!req.body.email || !req.body.password) {
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
                console.log('🔄 Estableciendo sesión para usuario:', FindUser.name);
                req.session.user = FindUser;
                req.session.userId = FindUser._id;
                req.session.userName = FindUser.name;
                req.session.userEmail = FindUser.correo;
                
                req.session.save((err) => {
                  if (err) {
                    console.error('❌ Error guardando sesión:', err);
                  } else {
                    console.log('✅ Sesión guardada correctamente');
                    console.log('   - User ID:', req.session.userId);
                    console.log('   - User Name:', req.session.userName);
                    console.log('   - Session ID:', req.sessionID);
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

                console.log('✅✅✅ LOGIN COMPLETADO - SESIÓN ESTABLECIDA ✅✅✅');
                console.log('   - Usuario:', FindUser.name);
                console.log('   - Session ID:', req.sessionID);
                console.log('   - User ID en sesión:', req.session.userId);
                console.log('   - Session keys:', Object.keys(req.session));

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
                res.send({ login: false, error: "Usuario no activo" });
              }
            } else {
              res.send({ user: true, login: false, error: null });
            }
          } else {
            res.send({ user: false, login: false, error: null });
          }
        }
      }
    } catch (error) {
      console.log(error);
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
        role: role._id,
        active: false,
      });
      await makeUser.save();
      res.send({ success: true, user: makeUser });
    } catch (error) {
      console.log(error);
      res.status(500).send({ success: false, error: "Error al crear usuario" });
    }
  },
  updateUser: async (req, res) => {
    try {
      if (!req.body.id) {
        res.send({
          login: false,
          error: "por favor ingrese el id del usuario",
        });
      } else {
        var dataForUpdate = {};
        if (req.body.email) {
          dataForUpdate.correo = req.body.email;
        }
        if (req.body.password) {
          // Cifrar la nueva contraseña antes de actualizar
          const saltRounds = 12;
          const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
          dataForUpdate.password = hashedPassword;
        }

        const update = await users.updateOne(
          { _id: req.body.id },
          dataForUpdate
        );

        res.send({ update });
      }
    } catch (error) {
      console.log(error);
    }
  },
  deletUser: async (req, res) => {
    try {
      if (!req.body.id) {
        res.send({
          login: false,
          error: "por favor ingrese el id del usuario",
        });
      } else {
        const deleteOneUser = await users.deleteOne({ _id: req.body.id });

        res.send({ deleteOneUser });
      }
    } catch (error) {
      console.log(error);
    }
  },
  userToken: async (req, res) => {
    try {
      const { token } = req.body;
      console.log(token);
      const info = await tokens.find({ token });
      if (info.length > 0) {
        res.send({ token: true });
      } else {
        res.send({ token: false });
      }
    } catch (error) {
      console.log(error);
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
      console.log(error);
    }
  },
  makerRole: async (req, res) => {
    try {
      if (!req.body.role || !req.body.permissions) {
        res.send({ error: "necesita un nombre de rol y permisos" });
      } else {
        const addRole = new rol({
          nombre: req.body.role,
          permissions: req.body.permissions,
        });
        res.send(await addRole.save());
      }
    } catch (error) {
      console.log(error);
    }
  },
  role: async (req, res) => {
    try {
      const token = req.body.token;
      const getDecodeInfo = await jwt.decode(token, "g8SlhhpH6O");

      if (getDecodeInfo) {
        const addRole = await rol.findOne({ _id: getDecodeInfo.role });
        res.send(addRole);
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
      console.log(error);
    }
  },
  roles: async (req, res) => {
    try {
      const addRole = await rol.find();
      res.send(addRole);
    } catch (error) {
      console.log(error);
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
      console.log(error);
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
      console.log(error);
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
      console.log(error);
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
      console.log(error);
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
      console.log(error);
      res.status(500).send({
        success: false,
        error: "Error al generar hash de contraseña"
      });
    }
  }
};
