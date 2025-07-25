import axios from "./axios";

export default {
	rolChanger: async (id,role,) => {
		let data = {
			id,
			role,
			user:localStorage.getItem("user")
		};

		const info = await axios.post("/change/role",data)

		return info.data;
	},
	statChanger: async (id,active) => {
		let data = {
			id,
			active,
			user:localStorage.getItem("user")
		};

		const info = await axios.post("/change/stat",data)

		return info.data;
	},
}