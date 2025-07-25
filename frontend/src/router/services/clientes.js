import axios from "./axios";

export default {
	findClientes: async () => {
		const info = await axios.post("/clientes");
		return info.data;
	}
}
