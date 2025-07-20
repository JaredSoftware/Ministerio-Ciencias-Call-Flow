const mongoose = require("mongoose");

const roles = new mongoose.Schema(
	{
		nombre: { 
			type: String, 
			required: true,
			unique: true 
		},
		descripcion: { 
			type: String, 
			default: "" 
		},
		permissions: {
			// Permisos de usuarios y administración
			users: {
				view: { type: Boolean, default: false },
				create: { type: Boolean, default: false },
				edit: { type: Boolean, default: false },
				delete: { type: Boolean, default: false }
			},
			// Permisos de monitoreo y reportes
			monitoring: {
				viewActiveUsers: { type: Boolean, default: false },
				viewUserStates: { type: Boolean, default: false },
				viewReports: { type: Boolean, default: false },
				exportData: { type: Boolean, default: false }
			},
			// Permisos financieros
			finance: {
				viewAbonos: { type: Boolean, default: false },
				createAbonos: { type: Boolean, default: false },
				viewSaldos: { type: Boolean, default: false },
				viewBilling: { type: Boolean, default: false }
			},
			// Permisos de configuración del sistema
			system: {
				manageRoles: { type: Boolean, default: false },
				systemConfig: { type: Boolean, default: false },
				viewLogs: { type: Boolean, default: false }
			},
			// Permisos de datos y operaciones
			operations: {
				viewTables: { type: Boolean, default: false },
				viewViajes: { type: Boolean, default: false },
				viewKardex: { type: Boolean, default: false },
				exportReports: { type: Boolean, default: false }
			}
		},
		// Estado del rol
		isActive: { 
			type: Boolean, 
			default: true 
		}
	},
	{
		versionKey: false,
		timestamps: true,
	}
);

// Índices para optimización
roles.index({ nombre: 1 });
roles.index({ isActive: 1 });

module.exports = mongoose.model("roles", roles, "roles");