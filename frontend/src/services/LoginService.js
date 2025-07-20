import axios from "./axios";

export default {
	sendLogin: async (task) => {
		let data = task;

		const info = await axios.post("/login",data)

		return info.data;
	},
	addUser: async (task) => {
		let data = task;

		const info = await axios.post("/addUser",data)

		return info.data;
	},
	validateUser: async (task) => {
		let data = task;

		const info = await axios.post("/exists",data)

		return info.data;
	},
}