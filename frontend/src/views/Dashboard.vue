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
                  <h6 class="mb-2">📊 Top 5 Agentes - Tipificaciones Hoy</h6>
                </div>
              </div>
              <div class="table-responsive">
                <table class="table align-items-center">
                  <tbody>
                    <tr v-for="(agente, index) in topAgentes" :key="index">
                      <td class="w-30">
                        <div class="px-2 py-1 d-flex align-items-center">
                          <div>
                            <div :class="['avatar avatar-sm me-3', getBadgeColor(index)]">
                              {{ index + 1 }}
                            </div>
                          </div>
                          <div class="ms-2">
                            <p class="mb-0 text-xs font-weight-bold">Agente:</p>
                            <h6 class="mb-0 text-sm">{{ agente.nombre }}</h6>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="text-center">
                          <p class="mb-0 text-xs font-weight-bold">Completadas:</p>
                          <h6 class="mb-0 text-sm">{{ agente.completadas }}</h6>
                        </div>
                      </td>
                      <td>
                        <div class="text-center">
                          <p class="mb-0 text-xs font-weight-bold">En Cola:</p>
                          <h6 class="mb-0 text-sm">{{ agente.pendientes }}</h6>
                        </div>
                      </td>
                      <td class="text-sm align-middle">
                        <div class="text-center col">
                          <p class="mb-0 text-xs font-weight-bold">Efectividad:</p>
                          <h6 class="mb-0 text-sm">{{ agente.efectividad }}%</h6>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="topAgentes.length === 0">
                      <td colspan="4" class="text-center">
                        <p class="text-sm text-secondary mb-0">No hay datos disponibles</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="card">
              <div class="p-3 pb-0 card-header">
                <h6 class="mb-0">👥 Estados de Agentes</h6>
              </div>
              <div class="p-3 card-body">
                <div v-for="(estado, index) in estadosAgentes" :key="index" class="mb-3">
                  <div class="d-flex justify-content-between mb-1">
                    <p class="text-xs mb-0">
                      <span :style="{color: estado.color}">●</span>
                      {{ estado.label }}
                    </p>
                    <p class="text-xs font-weight-bold mb-0">{{ estado.count }} agentes</p>
                  </div>
                  <div class="progress">
                    <div 
                      class="progress-bar" 
                      :style="{width: estado.porcentaje + '%', backgroundColor: estado.color}"
                      role="progressbar"
                    ></div>
                  </div>
                </div>
                <div v-if="estadosAgentes.length === 0" class="text-center">
                  <p class="text-sm text-secondary mb-0">No hay datos disponibles</p>
                </div>
              </div>
            </div>
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
          title: "👥 Agentes Conectados",
          value: "0",
          percentage: "0%",
          iconClass: "ni ni-badge",
          detail: "en tiempo real",
          iconBackground: "bg-gradient-success",
        },
        users: {
          title: "📊 Clientes CRM",
          value: "0",
          percentage: "0%",
          iconClass: "ni ni-single-02",
          iconBackground: "bg-gradient-primary",
          detail: "total registrados",
        },
        clients: {
          title: "📞 Tipificaciones Hoy",
          value: "0",
          percentage: "0%",
          iconClass: "ni ni-mobile-button",
          percentageColor: "text-success",
          iconBackground: "bg-gradient-info",
          detail: "desde las 00:00 hrs",
        },
        sales: {
          title: "⏳ Llamadas en Cola",
          value: "0",
          percentage: "0%",
          iconClass: "ni ni-time-alarm",
          iconBackground: "bg-gradient-warning",
          detail: "pendientes de asignar",
        },
      },
      mqttTopics: [],
      statsInterval: null,
      topAgentes: [],
      estadosAgentes: [],
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
        
        // 🎯 CARGAR ESTADÍSTICAS DEL CRM
        console.log('🔄 PASO 4: Cargando estadísticas del CRM...');
        await this.cargarEstadisticasCRM();
        
        // 🔄 CONFIGURAR ACTUALIZACIÓN AUTOMÁTICA CADA 30 SEGUNDOS
        this.statsInterval = setInterval(() => {
          this.cargarEstadisticasCRM();
        }, 30000);
        
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
    async cargarEstadisticasCRM() {
      try {
        const userId = this.$store.state.user?.id || this.$store.state.user?._id;
        if (!userId) {
          console.warn('⚠️ No hay usuario para cargar estadísticas');
          return;
        }
        
        // Publicar solicitud de estadísticas por MQTT
        const topicSolicitud = `crm/estadisticas/solicitar/${userId}`;
        const topicRespuesta = `crm/estadisticas/respuesta/${userId}`;
        
        // Suscribirse a la respuesta
        const callback = (data) => {
          console.log('📊 Estadísticas CRM recibidas:', data);
          this.actualizarEstadisticas(data);
        };
        
        // Limpiar suscripción anterior si existe
        if (this.mqttTopics.length > 0) {
          this.mqttTopics.forEach(topic => {
            mqttService.off(topic, callback);
          });
        }
        
        // Nueva suscripción
        mqttService.on(topicRespuesta, callback);
        this.mqttTopics.push(topicRespuesta);
        
        // Publicar solicitud
        mqttService.publish(topicSolicitud, {
          timestamp: new Date().toISOString()
        });
        
        console.log('📡 Solicitud de estadísticas publicada');
      } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
      }
    },
    
    actualizarEstadisticas(data) {
      // Agentes Conectados
      this.stats.money.value = String(data.agentesConectados || 0);
      const agentesAyer = data.agentesAyer || 0;
      if (agentesAyer > 0) {
        const cambio = ((data.agentesConectados - agentesAyer) / agentesAyer * 100).toFixed(1);
        this.stats.money.percentage = `${cambio > 0 ? '+' : ''}${cambio}%`;
      } else {
        this.stats.money.percentage = '+100%';
      }
      
      // Clientes CRM
      this.stats.users.value = String(data.totalClientes || 0);
      const clientesSemanaAnterior = data.clientesSemanaAnterior || 1;
      const cambioClientes = ((data.totalClientes - clientesSemanaAnterior) / clientesSemanaAnterior * 100).toFixed(1);
      this.stats.users.percentage = `${cambioClientes > 0 ? '+' : ''}${cambioClientes}%`;
      this.stats.users.detail = 'desde la semana pasada';
      
      // Tipificaciones Hoy
      this.stats.clients.value = String(data.tipificacionesHoy || 0);
      const tipificacionesAyer = data.tipificacionesAyer || 1;
      const cambioTipificaciones = ((data.tipificacionesHoy - tipificacionesAyer) / tipificacionesAyer * 100).toFixed(1);
      this.stats.clients.percentage = `${cambioTipificaciones > 0 ? '+' : ''}${cambioTipificaciones}%`;
      this.stats.clients.percentageColor = cambioTipificaciones > 0 ? 'text-success' : 'text-danger';
      this.stats.clients.detail = 'comparado con ayer';
      
      // Llamadas en Cola
      this.stats.sales.value = String(data.llamadasEnCola || 0);
      this.stats.sales.percentage = data.llamadasEnCola > 0 ? 'Activas' : 'Sin cola';
      this.stats.sales.detail = data.llamadasEnCola > 0 ? 'esperando asignación' : 'sin llamadas pendientes';
      
      // Top Agentes
      this.topAgentes = data.topAgentes || [];
      
      // Estados de Agentes
      this.estadosAgentes = data.estadosAgentes || [];
    },
    
    getBadgeColor(index) {
      const colors = ['bg-gradient-warning', 'bg-gradient-info', 'bg-gradient-success', 'bg-gradient-primary', 'bg-gradient-secondary'];
      return colors[index] || 'bg-gradient-secondary';
    }
  },
  beforeUnmount() {
    console.log('Dashboard unmounting - NO desconectar WebSocket (gestión global)');
    
    // Limpiar intervalo de estadísticas
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    
    // Limpiar suscripciones MQTT
    if (this.mqttTopics.length > 0) {
      this.mqttTopics.forEach(topic => {
        mqttService.off(topic);
      });
    }
    
    // NO desconectar MQTT aquí, debe mantenerse para toda la sesión
  },
};
</script>
