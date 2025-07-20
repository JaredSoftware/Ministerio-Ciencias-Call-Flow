const stateManager = require('../services/stateManager');

// Middleware para manejar estados de usuario
const userStateMiddleware = (req, res, next) => {
  // Agregar métodos de estado al objeto de respuesta
  res.updateUserState = (state) => {
    if (req.session && req.session.user) {
      stateManager.setUserState(req.session.user._id, state);
    }
  };

  res.getUserState = () => {
    if (req.session && req.session.user) {
      return stateManager.getUserState(req.session.user._id);
    }
    return null;
  };

  res.sendNotification = (targetUsers, notification) => {
    stateManager.sendNotification(targetUsers, notification);
  };

  res.sendGlobalNotification = (notification) => {
    stateManager.sendGlobalNotification(notification);
  };

  res.updateWorkflow = (workflowData) => {
    if (req.session && req.session.user) {
      stateManager.handleWorkflow({
        userId: req.session.user._id,
        ...workflowData
      });
    }
  };

  next();
};

// Middleware para verificar si el usuario está autenticado
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'No autorizado' });
  }
};

// Middleware para verificar roles específicos
const requireRole = (roles) => {
  return (req, res, next) => {
    if (req.session && req.session.user) {
      const userRole = req.session.user.role;
      if (Array.isArray(roles)) {
        if (roles.includes(userRole)) {
          next();
        } else {
          res.status(403).json({ error: 'Acceso denegado' });
        }
      } else {
        if (userRole === roles) {
          next();
        } else {
          res.status(403).json({ error: 'Acceso denegado' });
        }
      }
    } else {
      res.status(401).json({ error: 'No autorizado' });
    }
  };
};

// Middleware para registrar actividad del usuario
const logUserActivity = (action) => {
  return (req, res, next) => {
    if (req.session && req.session.user) {
      // Actualizar actividad en StateManager
      stateManager.updateUserActivity(req.session.user._id);
      
      // Emitir evento de actividad si hay Socket.IO disponible
      const io = req.app.get('io');
      if (io) {
        io.emit('user_activity', {
          userId: req.session.user._id,
          userName: req.session.user.name,
          action: action,
          timestamp: new Date()
        });
      }
    }
    next();
  };
};

// Middleware para manejar estados de flujo de trabajo
const workflowStateMiddleware = (workflowType) => {
  return (req, res, next) => {
    // Agregar métodos específicos del flujo
    res.setWorkflowStep = (step, data = {}) => {
      if (req.session && req.session.user) {
        stateManager.handleWorkflow({
          userId: req.session.user._id,
          workflowType,
          step,
          data
        });
      }
    };

    res.getWorkflowState = () => {
      if (req.session && req.session.user) {
        const userState = stateManager.getUserState(req.session.user._id);
        return userState?.workflow || null;
      }
      return null;
    };

    next();
  };
};

module.exports = {
  userStateMiddleware,
  requireAuth,
  requireRole,
  logUserActivity,
  workflowStateMiddleware
}; 