import axios from "./axios";

export default {
	sendToken: async (task) => {
		let data = {
			'token': task.token
		}

		const info = await axios.post("/token", data);

		return info.data;
	},
	//roles
	sendRole: async () => {
		const token = sessionStorage.getItem("token") || sessionStorage.getItem("TokenRole") || localStorage.getItem("token") || localStorage.getItem("TokenRole");
		
		// Cache del rol para evitar requests innecesarios
		const cachedRole = localStorage.getItem('cachedRole');
		const cachedToken = localStorage.getItem('cachedRoleToken');
		
		if (cachedRole && cachedToken === token) {
			const cachedPermissions = localStorage.getItem('cachedRolePermissions');
			console.log('✅ Usando rol desde cache:', cachedRole);
			return { 
				nombre: cachedRole,
				permissions: cachedPermissions ? JSON.parse(cachedPermissions) : null
			};
		}
		
		console.log('🔍 Token para roles:', token ? 'Existe' : 'No existe');
		
		let data = {
			'token': token
		};

		console.log('🔄 Enviando request a /role...');
		const info = await axios.post('/role', data);
		console.log('✅ Respuesta de roles recibida:', info.data);

		// El backend devuelve el objeto completo del rol
		if (info.data && info.data.nombre) {
			// Guardar en cache tanto el nombre como los permisos
			localStorage.setItem('cachedRole', info.data.nombre);
			localStorage.setItem('cachedRolePermissions', JSON.stringify(info.data.permissions));
			localStorage.setItem('cachedRoleToken', token);
			// Limpiar timestamp de intento fallido
			localStorage.removeItem('lastRoleAttempt');
			console.log('💾 Rol y permisos guardados en cache:', info.data.nombre);
			
			// Devolver tanto el nombre como los permisos
			return { 
				nombre: info.data.nombre,
				permissions: info.data.permissions
			};
		} else {
			console.error('❌ No se pudo obtener el nombre del rol. Respuesta:', info.data);
			// Si la respuesta está vacía, limpiar cache y devolver null
			localStorage.removeItem('cachedRole');
			localStorage.removeItem('cachedRolePermissions');
			localStorage.removeItem('cachedRoleToken');
			return { nombre: null, permissions: null };
		}
	},
	sendRoles: async () => {
		let data = {
			'token': sessionStorage.getItem("TokenRole") || localStorage.getItem("TokenRole")
		};

		const info = await axios.post("/roles",data)

		return info.data;
	},
	sendAllUsers: async (role) => {
		let data = {
			role
		};

		const info = await axios.post("/allUsers",data)

		return info.data;
	},
}