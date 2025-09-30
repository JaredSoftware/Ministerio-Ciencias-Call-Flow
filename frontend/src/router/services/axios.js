import axios from "axios";
import https from "https";
import environmentConfig from "@/config/environment";

// Evita la verificación de certificados SSL
const agent = new https.Agent({
  rejectUnauthorized: false,
});

const axiosInstance = axios.create({
  // baseURL: "http://localhost:9035/api/",
  baseURL: `${environmentConfig.getApiUrl()}/api/`,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  httpsAgent: agent,
  withCredentials: true,
  // withCredentials se configura por petición cuando sea necesario
});

export default axiosInstance;
