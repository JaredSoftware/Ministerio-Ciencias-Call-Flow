<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-lg-12">
        <div class="row">
          <div class="col-lg-3 col-md-6 col-12">
            <card
              :title="stats.money.title"
              :value="stats.money.value"
              :percentage="stats.money.percentage"
              :iconClass="stats.money.iconClass"
              :iconBackground="stats.money.iconBackground"
              :detail="stats.money.detail"
              directionReverse
            ></card>
          </div>
          <div class="col-lg-3 col-md-6 col-12">
            <card
              :title="stats.users.title"
              :value="stats.users.value"
              :percentage="stats.users.percentage"
              :iconClass="stats.users.iconClass"
              :iconBackground="stats.users.iconBackground"
              :detail="stats.users.detail"
              directionReverse
            ></card>
          </div>
          <div class="col-lg-3 col-md-6 col-12">
            <card
              :title="stats.clients.title"
              :value="stats.clients.value"
              :percentage="stats.clients.percentage"
              :iconClass="stats.clients.iconClass"
              :iconBackground="stats.clients.iconBackground"
              :percentageColor="stats.clients.percentageColor"
              :detail="stats.clients.detail"
              directionReverse
            ></card>
          </div>
          <div class="col-lg-3 col-md-6 col-12">
            <card
              :title="stats.sales.title"
              :value="stats.sales.value"
              :percentage="stats.sales.percentage"
              :iconClass="stats.sales.iconClass"
              :iconBackground="stats.sales.iconBackground"
              :detail="stats.sales.detail"
              directionReverse
            ></card>
          </div>
        </div>
        <div class="row">
          <div class="col-lg-7 mb-lg">
            <!-- line chart -->
            <div class="card z-index-2">
              <gradient-line-chart />
            </div>
          </div>
          <div class="col-lg-5">
            <carousel />
          </div>
        </div>
        <div class="row mt-4">
          <div class="col-lg-7 mb-lg-0 mb-4">
            <div class="card">
              <div class="p-3 pb-0 card-header">
                <div class="d-flex justify-content-between">
                  <h6 class="mb-2">Sales by Country</h6>
                </div>
              </div>
              <div class="table-responsive">
                <table class="table align-items-center">
                  <tbody>
                    <tr v-for="(sale, index) in sales" :key="index">
                      <td class="w-30">
                        <div class="px-2 py-1 d-flex align-items-center">
                          <div>
                            <img :src="sale.flag" alt="Country flag" />
                          </div>
                          <div class="ms-4">
                            <p class="mb-0 text-xs font-weight-bold">Country:</p>
                            <h6 class="mb-0 text-sm">{{ sale.country }}</h6>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="text-center">
                          <p class="mb-0 text-xs font-weight-bold">Sales:</p>
                          <h6 class="mb-0 text-sm">{{ sale.sales }}</h6>
                        </div>
                      </td>
                      <td>
                        <div class="text-center">
                          <p class="mb-0 text-xs font-weight-bold">Value:</p>
                          <h6 class="mb-0 text-sm">{{ sale.value }}</h6>
                        </div>
                      </td>
                      <td class="text-sm align-middle">
                        <div class="text-center col">
                          <p class="mb-0 text-xs font-weight-bold">Bounce:</p>
                          <h6 class="mb-0 text-sm">{{ sale.bounce }}</h6>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="col-lg-5">
            <categories-card />
          </div>
        </div>
        
        <!-- Validación de Estados -->
        <div class="row mt-4">
          <div class="col-12">
            <StatusValidation />
          </div>
        </div>
        


      </div>
    </div>
  </div>
</template>
<script>
/* eslint-disable vue/no-unused-components */
import Card from "@/examples/Cards/Card.vue";
import GradientLineChart from "@/examples/Charts/chart.vue";
import Carousel from "./components/Carousel.vue";
import CategoriesCard from "./components/CategoriesCard.vue";
import websocketService from '@/router/services/websocketService';
import sessionSync from '@/router/services/sessionSync';
import StatusValidation from "@/components/StatusValidation.vue";
import { mqttService } from '@/router/services/mqttService';

import US from "@/assets/img/icons/flags/US.png";
import DE from "@/assets/img/icons/flags/DE.png";
import GB from "@/assets/img/icons/flags/GB.png";
import BR from "@/assets/img/icons/flags/BR.png";

export default {
  name: "dashboard-default",
  components: {
    Card,
    GradientLineChart,
    Carousel,
    CategoriesCard,
    StatusValidation
  },
  data() {
    return {
      stats: {
        money: {
          title: "Today's Money",
          value: "$53,000",
          percentage: "+55%",
          iconClass: "ni ni-money-coins",
          detail: "since yesterday",
          iconBackground: "bg-gradient-primary",
        },
        users: {
          title: "Today's Users",
          value: "2,300",
          percentage: "+3%",
          iconClass: "ni ni-world",
          iconBackground: "bg-gradient-danger",
          detail: "since last week",
        },
        clients: {
          title: "New Clients",
          value: "+3,462",
          percentage: "-2%",
          iconClass: "ni ni-paper-diploma",
          percentageColor: "text-danger",
          iconBackground: "bg-gradient-success",
          detail: "since last quarter",
        },
        sales: {
          title: "Sales",
          value: "$103,430",
          percentage: "+5%",
          iconClass: "ni ni-cart",
          iconBackground: "bg-gradient-warning",
          detail: "than last month",
        },
      },
      sales: {
        us: {
          country: "United States",
          sales: 2500,
          value: "$230,900",
          bounce: "29.9%",
          flag: US,
        },
        germany: {
          country: "Germany",
          sales: "3.900",
          value: "$440,000",
          bounce: "40.22%",
          flag: DE,
        },
        britain: {
          country: "Great Britain",
          sales: "1.400",
          value: "$190,700",
          bounce: "23.44%",
          flag: GB,
        },
        brasil: {
          country: "Brasil",
          sales: "562",
          value: "$143,960",
          bounce: "32.14%",
          flag: BR,
        },
      },
    };
  },
  async mounted() {
    console.log('🚀 Dashboard mounted - Iniciando proceso automático...');
    
    // Esperar un poco para que se complete la navegación
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      let syncResult;
      
      // 1. INTENTAR SINCRONIZACIÓN NORMAL PRIMERO
      console.log('🔄 PASO 1: Sincronizando sesión (automático)...');
      syncResult = await sessionSync.syncSession();
      
      // 2. SI FALLA, INTENTAR AUTO-LOGIN DESDE COOKIE
      if (!syncResult.success) {
        console.log('⚠️ Sincronización falló, intentando auto-login desde cookie...');
        const autoLoginResult = await sessionSync.autoLoginFromCookie();
        
        if (autoLoginResult.success) {
          console.log('✅ Auto-login desde cookie exitoso');
          syncResult = autoLoginResult;
        }
      }
      
      // 3. CONECTAR WEBSOCKET
      if (syncResult.success) {
        console.log('✅ Sesión activa:', syncResult.user.name);
        
        // Conectar WebSocket con información del usuario
        console.log('🔄 PASO 2: Conectando WebSocket con usuario autenticado...');
        await websocketService.connect(syncResult.user);
        console.log('✅ WebSocket conectado con usuario:', syncResult.user.name);
        
        // 🚨 CONECTAR MQTT GLOBALMENTE UNA SOLA VEZ
        console.log('🔄 PASO 3: Conectando MQTT globalmente...');
        try {
          await mqttService.connect(null, syncResult.user.id, syncResult.user.name);
          console.log('✅ MQTT conectado globalmente para:', syncResult.user.name);
          
          // Configurar callbacks del sistema
          mqttService.onSystemEvent('onConnect', () => {
            console.log('🎉 MQTT conectado exitosamente');
          });
          
          mqttService.onSystemEvent('onError', (error) => {
            console.error('❌ Error en MQTT:', error);
          });
          
        } catch (mqttError) {
          console.error('❌ Error conectando MQTT:', mqttError);
        }
        
        // Inicializar sincronización continua de estados
        console.log('✅ Sincronización continua inicializada');
        
      } else {
        console.log('❌ No se pudo establecer sesión:', syncResult.message);
        console.log('⚠️ Intentando conectar WebSocket sin autenticación...');
        await websocketService.connect();
      }
      
    } catch (error) {
      console.error('❌ Error en mounted:', error);
      // Intentar conectar WebSocket de todas formas
      try {
        console.log('🔄 Conectando WebSocket como fallback...');
        await websocketService.connect();
      } catch (wsError) {
        console.error('❌ Error conectando WebSocket:', wsError);
      }
    }
  },
  async activated() {
    // Se ejecuta cuando el componente se activa (navegación)
    console.log('Dashboard activated - Sincronizando sesión y verificando WebSocket...');
    setTimeout(async () => {
      try {
        // Sincronizar sesión
        const syncResult = await sessionSync.syncSession();
        if (syncResult.success) {
          console.log('✅ Sesión sincronizada en activated:', syncResult.user.name);
        }
        
        // Conectar WebSocket
        await websocketService.connect();
      } catch (error) {
        console.error('❌ Error en activated:', error);
      }
    }, 1000);
  },
  methods: {
  },
  beforeUnmount() {
    console.log('Dashboard unmounting - NO desconectar WebSocket (gestión global)');
    // Eliminar websocketService.disconnect();
    // NO desconectar MQTT aquí, debe mantenerse para toda la sesión
  },
};
</script>
