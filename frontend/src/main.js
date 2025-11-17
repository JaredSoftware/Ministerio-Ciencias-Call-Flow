import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";
import router from "./router";
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";
import ArgonDashboard from "./argon-dashboard";
// import Popper from "popper.js"; // Deshabilitado temporalmente
import VueGoodTablePlugin from 'vue-good-table-next';
import 'vue-good-table-next/dist/vue-good-table-next.css'
import WebSocketPlugin from "./plugins/websocket";
import { mqttService } from "./router/services/mqttService";
import environmentConfig from "./config/environment";

const appInstance = createApp(App);
appInstance.use(store);
appInstance.use(router);
appInstance.use(ArgonDashboard);
appInstance.use(VueGoodTablePlugin);
appInstance.use(WebSocketPlugin);

// Configurar Popper.js globalmente - DESHABILITADO TEMPORALMENTE
// appInstance.config.globalProperties.$popper = Popper;

appInstance.mount("#app");

// Inicializar MQTT después de que la app esté montada usando configuración dinámica
const mqttUrl = environmentConfig.getMQTTBrokerUrl();
mqttService.connect(mqttUrl).then(() => {
}).catch((error) => {
  console.error('❌ Error conectando MQTT Service:', error);
});