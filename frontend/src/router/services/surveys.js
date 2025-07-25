import axios from "./axios";

export default {
	dataFromTable: async (fi,ff) => {
		let data = {
			fi,
			ff
		};

		const info = await axios.post("/postgres/calls",data)

		return info.data;
	}
}