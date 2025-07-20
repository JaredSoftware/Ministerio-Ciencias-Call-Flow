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
		let data = {
			'token': localStorage.getItem("TokenRole")
		};

		const info = await axios.post('/role', data);

		return info.data;
	},
	sendRoles: async () => {
		let data = {
			'token': localStorage.getItem("TokenRole")
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