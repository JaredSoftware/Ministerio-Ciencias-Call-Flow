<template>
  <div class="py-4 container-fluid">
    <!-- Estado de carga -->
    <div v-if="isLoadingData" class="alert alert-info alert-dismissible fade show" role="alert">
      <div class="d-flex align-items-center">
        <div class="spinner-border spinner-border-sm me-2" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <span>⏳ Cargando estadísticas en tiempo real del CRM...</span>
      </div>
    </div>
    
    <!-- Error de carga -->
    <div v-if="dataLoadError && !isLoadingData" class="alert alert-warning alert-dismissible fade show" role="alert">
      <strong>⚠️ Atención:</strong> {{ dataLoadError }}
      <button type="button" class="btn-close" @click="dataLoadError = null" aria-label="Close"></button>
    </div>
    
    <div class="row">
      <div class="col-lg-12">
        <div class="row">
          <div class="col-lg-4 col-md-6 col-12">
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
          <div class="col-lg-4 col-md-6 col-12">
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
          <div class="col-lg-4 col-md-6 col-12">
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
        </div>
        <div class="row">
          <div class="col-lg-7 mb-lg">
            <!-- Gráfica de Tipificaciones por Hora -->
            <div class="card z-index-2">
              <div class="card-header pb-0">
                <h6>📈 Tipificaciones por Hora - Hoy</h6>
                <p class="text-sm">
                  <span class="font-weight-bold">{{ tipificacionesPorHora.reduce((a, b) => a + b.count, 0) }} llamadas</span> procesadas hoy
                </p>
              </div>
              <div class="card-body p-3">
                <div class="chart">
                  <canvas id="chart-tipificaciones-hora" class="chart-canvas" height="300"></canvas>
                  <!-- Fallback si Chart.js no funciona -->
                  <div v-if="chartError" class="chart-fallback">
                    <div class="text-center p-4">
                      <h6 class="text-muted">📈 Tipificaciones por Hora</h6>
                      <div class="d-flex justify-content-between align-items-end" style="height: 200px;">
                        <div v-for="(item, index) in tipificacionesPorHora" :key="index" class="d-flex flex-column align-items-center">
                          <div class="bg-primary rounded" :style="{height: (item.count * 10) + 'px', width: '20px', marginBottom: '5px'}"></div>
                          <small class="text-muted">{{item.hora}}:00</small>
                          <small class="text-primary font-weight-bold">{{item.count}}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-5">
            <!-- Gráfica de Distribución por Nivel 1 -->
            <div class="card">
              <div class="card-header pb-0">
                <h6>🎯 Distribución de Tipificaciones</h6>
                <p class="text-sm">
                  <span v-if="distribucionNivel1.length > 0" class="font-weight-bold">
                    {{ distribucionNivel1.reduce((a, b) => a + b.count, 0) }} tipificaciones
                  </span>
                  <span v-else class="text-secondary">Por categoría principal (Nivel 1)</span>
                </p>
              </div>
              <div class="card-body p-3">
                <div class="chart" style="position: relative;">
                  <canvas id="chart-distribucion-nivel1" class="chart-canvas" height="300"></canvas>
                  <!-- Fallback si Chart.js no funciona -->
                  <div v-if="chartError" class="chart-fallback">
                    <div class="text-center p-4">
                      <h6 class="text-muted">🎯 Distribución por Categorías</h6>
                      <div class="row">
                        <div v-for="(item, index) in distribucionNivel1" :key="index" class="col-6 mb-3">
                          <div class="d-flex align-items-center">
                            <div class="rounded-circle me-2" :style="{width: '20px', height: '20px', backgroundColor: ['#667eea', '#48bb78', '#ed8936', '#f56565', '#9f7aea'][index]}"></div>
                            <div>
                              <small class="text-muted">{{item.nivel1}}</small>
                              <div class="font-weight-bold text-primary">{{item.count}}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="distribucionNivel1.length === 0" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; width: 100%;">
                    <i class="ni ni-chart-pie-35 text-secondary" style="font-size: 48px; opacity: 0.3;"></i>
                    <p class="text-sm text-secondary mt-2 mb-0">No hay tipificaciones completadas hoy</p>
                  </div>
                </div>
              </div>
            </div>
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


      </div>
    </div>
  </div>
</template>
<script>
/* eslint-disable vue/no-unused-components */
import Card from "@/examples/Cards/Card.vue";
import websocketService from '@/router/services/websocketService';
import sessionSync from '@/router/services/sessionSync';
import { mqttService } from '@/router/services/mqttService';
import Chart from 'chart.js/auto';

export default {
  name: "dashboard-default",
  components: {
    Card
  },
  data() {
    return {
      stats: {
        money: {
          title: "👥 Agentes Conectados",
          value: "...",
          percentage: "...",
          iconClass: "ni ni-badge",
          detail: "cargando...",
          iconBackground: "bg-gradient-success",
        },
        users: {
          title: "📊 Clientes CRM",
          value: "...",
          percentage: "...",
          iconClass: "ni ni-single-02",
          iconBackground: "bg-gradient-primary",
          detail: "cargando...",
        },
        clients: {
          title: "📞 Tipificaciones Hoy",
          value: "...",
          percentage: "...",
          iconClass: "ni ni-mobile-button",
          percentageColor: "text-success",
          iconBackground: "bg-gradient-info",
          detail: "cargando...",
        },
      },
      mqttTopics: [],
      statsInterval: null,
      topAgentes: [],
      estadosAgentes: [],
      tipificacionesPorHora: [],
      distribucionNivel1: [],
      chartHora: null,
      chartDistribucion: null,
      isLoadingData: true, // Flag para mostrar estado de carga
      dataLoadError: null, // Errores de carga
    };
  },
  async mounted() {
    
    // Esperar un poco para que se complete la navegación
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      let syncResult;
      
      // 1. INTENTAR SINCRONIZACIÓN NORMAL PRIMERO
      syncResult = await sessionSync.syncSession();
      
      // 2. SI FALLA, INTENTAR AUTO-LOGIN DESDE COOKIE
      if (!syncResult.success) {
        const autoLoginResult = await sessionSync.autoLoginFromCookie();
        
        if (autoLoginResult.success) {
          syncResult = autoLoginResult;
        }
      }
      
      // 3. CONECTAR WEBSOCKET Y MQTT
      let user = null;
      
      if (syncResult.success) {
        user = syncResult.user;
      } else {
        // Si no se pudo sincronizar pero hay usuario en sessionStorage, usarlo
        try {
          const userStr = sessionStorage.getItem('user');
          if (userStr) {
            const qs = await import('qs');
            user = qs.default.parse(userStr);
            
            // Actualizar store con el usuario
            this.$store.commit('setUser', user);
          }
        } catch (err) {
          console.error('❌ Error recuperando usuario de sessionStorage:', err);
        }
      }
      
      if (user) {
        
        // Conectar WebSocket con información del usuario
        await websocketService.connect(user);
        
        // 🚨 CONECTAR MQTT GLOBALMENTE UNA SOLA VEZ
        try {
          await mqttService.connect(null, user._id || user.id, user.name);
          
          // Configurar callbacks del sistema
          mqttService.onSystemEvent('onConnect', () => {
          });
          
          mqttService.onSystemEvent('onError', (error) => {
            console.error('❌ Error en MQTT:', error);
            this.dataLoadError = 'Error de conexión MQTT';
          });
          
        } catch (mqttError) {
          console.error('❌ Error conectando MQTT:', mqttError);
          this.dataLoadError = 'No se pudo conectar al sistema de mensajería';
        }
        
        // 🎯 CARGAR ESTADÍSTICAS REALES DEL CRM (SIN DATOS FALSOS)
        await this.cargarEstadisticasCRM();
        
        // 🔄 CONFIGURAR ACTUALIZACIÓN AUTOMÁTICA CADA 30 SEGUNDOS
        this.statsInterval = setInterval(() => {
          this.cargarEstadisticasCRM();
        }, 30000);
        
        // Inicializar sincronización continua de estados
        
      } else {
        this.dataLoadError = 'No se pudo identificar al usuario. Por favor, vuelve a iniciar sesión.';
        this.isLoadingData = false;
        await websocketService.connect();
      }
      
    } catch (error) {
      console.error('❌ Error en mounted:', error);
      this.dataLoadError = 'Error de inicialización: ' + error.message;
      this.isLoadingData = false;
      
      // Intentar conectar WebSocket de todas formas
      try {
        await websocketService.connect();
      } catch (wsError) {
        console.error('❌ Error conectando WebSocket:', wsError);
      }
    }
  },
  async activated() {
    // Se ejecuta cuando el componente se activa (navegación)
    setTimeout(async () => {
      try {
        // Sincronizar sesión
        await sessionSync.syncSession();
        
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
        // Intentar obtener usuario del store o de sessionStorage
        let userId = this.$store.state.user?.id || this.$store.state.user?._id;
        
        // Si no está en el store, intentar desde sessionStorage
        if (!userId) {
          try {
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
              const qs = await import('qs');
              const user = qs.default.parse(userStr);
              userId = user.id || user._id;
            }
          } catch (err) {
            console.error('❌ Error parseando usuario de sessionStorage:', err);
          }
        }
        
        if (!userId) {
          console.warn('⚠️ No hay usuario para cargar estadísticas');
          console.warn('   - Store user:', this.$store.state.user);
          console.warn('   - SessionStorage user:', sessionStorage.getItem('user'));
          this.dataLoadError = 'Usuario no identificado';
          this.isLoadingData = false;
          return;
        }
        
        
        // 🔄 INTENTAR RECONECTAR MQTT SI NO ESTÁ CONECTADO
        if (!mqttService.isConnected && !mqttService.isConnecting) {
          console.warn('⚠️ MQTT no conectado, intentando reconectar...');
          try {
            const user = this.$store.state.user;
            if (user && (user._id || user.id)) {
              // Intentar reconectar con un timeout corto
              await Promise.race([
                mqttService.connect(null, user._id || user.id, user.name),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
              ]);
            }
          } catch (reconnectError) {
            console.warn('⚠️ No se pudo reconectar MQTT:', reconnectError);
            // Continuar de todas formas, puede que se conecte después
          }
        }
        
        // Si aún no está conectado después de intentar reconectar, esperar un poco más
        if (!mqttService.isConnected) {
          // Esperar hasta 2 segundos más si está conectando
          let waitTime = 0;
          while (!mqttService.isConnected && mqttService.isConnecting && waitTime < 2000) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitTime += 100;
          }
        }
        
        // Verificar nuevamente después de esperar
        if (!mqttService.isConnected) {
          console.warn('⚠️ MQTT no está conectado después de intentar reconectar, no se pueden cargar estadísticas');
          // NO mostrar error si es la primera carga, solo si ya se había cargado antes
          if (!this.statsInterval) {
            // Primera carga, solo mostrar warning en consola
            console.warn('⚠️ Estadísticas no disponibles: MQTT no conectado');
          } else {
            // Actualización automática, mostrar warning pero no bloquear
            console.warn('⚠️ No se puede actualizar estadísticas: MQTT no conectado');
          }
          this.isLoadingData = false;
          return;
        }
        
        // Publicar solicitud de estadísticas por MQTT
        const topicSolicitud = `crm/estadisticas/solicitar/${userId}`;
        const topicRespuesta = `crm/estadisticas/respuesta/${userId}`;
        
        
        // Suscribirse a la respuesta
        const callback = (data) => {
          this.actualizarEstadisticas(data);
          this.isLoadingData = false;
          this.dataLoadError = null;
        };
        
        // Limpiar suscripción anterior si existe
        if (this.mqttTopics.length > 0) {
          this.mqttTopics.forEach(topic => {
            mqttService.off(topic);
          });
          this.mqttTopics = [];
        }
        
        // Nueva suscripción
        mqttService.on(topicRespuesta, callback);
        this.mqttTopics.push(topicRespuesta);
        
        // Publicar solicitud
        const published = mqttService.publish(topicSolicitud, {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`
        });
        
        if (!published) {
          console.error('❌ No se pudo publicar solicitud de estadísticas');
          this.dataLoadError = 'No se pudo enviar solicitud';
          this.isLoadingData = false;
        }
        
        // Timeout para detectar si no llegan datos
        setTimeout(() => {
          if (this.isLoadingData) {
            console.warn('⚠️ Timeout esperando estadísticas del backend');
            this.dataLoadError = 'Tiempo de espera agotado. Reintentando...';
            
            // Reintentar una vez
            mqttService.publish(topicSolicitud, {
              timestamp: new Date().toISOString(),
              requestId: `req_retry_${Date.now()}`
            });
            
            // Timeout final
            setTimeout(() => {
              if (this.isLoadingData) {
                this.isLoadingData = false;
                this.dataLoadError = 'No se pudieron cargar las estadísticas. Por favor, recarga la página.';
              }
            }, 5000);
          }
        }, 5000);
        
      } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        this.dataLoadError = 'Error: ' + error.message;
        this.isLoadingData = false;
      }
    },
    
    actualizarEstadisticas(data) {
      // Actualizar estadísticas del dashboard
      
      // Agentes Conectados
      this.stats.money.value = String(data.agentesConectados || 0);
      this.stats.money.detail = 'en tiempo real';
      const agentesAyer = data.agentesAyer || 0;
      if (agentesAyer > 0) {
        const cambio = ((data.agentesConectados - agentesAyer) / agentesAyer * 100).toFixed(1);
        this.stats.money.percentage = `${cambio > 0 ? '+' : ''}${cambio}%`;
      } else {
        this.stats.money.percentage = data.agentesConectados > 0 ? '+100%' : '0%';
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
      
      // Top Agentes
      this.topAgentes = data.topAgentes || [];
      
      // Estados de Agentes
      this.estadosAgentes = data.estadosAgentes || [];
      
      // Tipificaciones por Hora
      this.tipificacionesPorHora = data.tipificacionesPorHora || [];
      
      // Distribución por Nivel 1
      this.distribucionNivel1 = data.distribucionNivel1 || [];
      
      // Actualizar gráficas en tiempo real
      // Si las gráficas ya existen, actualizarlas sin recrear
      // Si no existen, crearlas
      this.$nextTick(() => {
        if (this.chartHora && this.chartHora.canvas && this.chartHora.canvas.parentNode) {
          // Actualizar gráfica existente (TIEMPO REAL)
          this.updateChartHora();
        } else {
          // Crear gráfica por primera vez
          this.renderChartHora();
        }
        
        if (this.chartDistribucion && this.chartDistribucion.canvas && this.chartDistribucion.canvas.parentNode) {
          // Actualizar gráfica existente (TIEMPO REAL)
          this.updateChartDistribucion();
        } else {
          // Crear gráfica por primera vez
          this.renderChartDistribucion();
        }
      });
      
    },
    
    getBadgeColor(index) {
      const colors = ['bg-gradient-warning', 'bg-gradient-info', 'bg-gradient-success', 'bg-gradient-primary', 'bg-gradient-secondary'];
      return colors[index] || 'bg-gradient-secondary';
    },
    
    updateChartHora() {
      // Actualizar datos de la gráfica existente sin recrearla (TIEMPO REAL)
      
      if (!this.chartHora) {
        console.warn('⚠️ Gráfica no existe, creando nueva...');
        this.renderChartHora();
        return;
      }
      
      const labels = this.tipificacionesPorHora.map(item => `${item.hora}:00`);
      const data = this.tipificacionesPorHora.map(item => item.count);
      
      // Actualizar los datos sin recrear la gráfica
      this.chartHora.data.labels = labels;
      this.chartHora.data.datasets[0].data = data;
      
      // Aplicar la actualización con animación suave
      this.chartHora.update('active');
      
    },
    
    renderChartHora() {
      
      // Verificar que el canvas existe y está en el DOM
      const ctx = document.getElementById('chart-tipificaciones-hora');
      if (!ctx || !ctx.parentNode) {
        console.warn('⚠️ Canvas chart-tipificaciones-hora no encontrado o no está en el DOM');
        return;
      }
      
      
      // 🔥 USAR Chart.getChart() PARA VERIFICAR Y DESTRUIR GRÁFICAS EXISTENTES
      try {
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
          try {
            existingChart.destroy();
          } catch (error) {
            console.warn('⚠️ Error destruyendo gráfica existente con Chart.getChart():', error);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo gráfica existente:', error);
      }
      
      // Destruir gráfica anterior de forma completamente segura
      if (this.chartHora) {
        try {
          // Verificar que la instancia de Chart.js sea válida
          if (this.chartHora && typeof this.chartHora.destroy === 'function') {
            // Verificar que el canvas exista en el DOM antes de destruir
            const existingCanvas = document.getElementById('chart-tipificaciones-hora');
            if (existingCanvas && this.chartHora.canvas === existingCanvas) {
              this.chartHora.destroy();
            }
          }
        } catch (error) {
          console.warn('⚠️ Error destruyendo instancia local:', error);
        }
        this.chartHora = null;
      }
      
      const labels = this.tipificacionesPorHora.map(item => `${item.hora}:00`);
      const data = this.tipificacionesPorHora.map(item => item.count);
      
      
      try {
        this.chartError = false; // Resetear flag de error
        this.chartHora = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Tipificaciones',
            data: data,
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(102, 126, 234, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleColor: '#fff',
              bodyColor: '#fff',
              callbacks: {
                label: function(context) {
                  return `${context.parsed.y} tipificaciones`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: '#666'
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            x: {
              ticks: {
                color: '#666'
              },
              grid: {
                display: false
              }
            }
          }
        }
      });
      
      } catch (error) {
        console.error('❌ Error creando gráfica de hora:', error);
        this.chartError = true; // Activar fallback HTML
        this.chartHora = null;
      }
    },
    
    updateChartDistribucion() {
      // Actualizar datos de la gráfica existente sin recrearla (TIEMPO REAL)
      
      if (!this.chartDistribucion) {
        console.warn('⚠️ Gráfica no existe, creando nueva...');
        this.renderChartDistribucion();
        return;
      }
      
      const labels = this.distribucionNivel1.map(item => item.nivel1);
      const data = this.distribucionNivel1.map(item => item.count);
      
      // Actualizar los datos sin recrear la gráfica
      this.chartDistribucion.data.labels = labels;
      this.chartDistribucion.data.datasets[0].data = data;
      
      // Aplicar la actualización con animación suave
      this.chartDistribucion.update('active');
      
    },
    
    renderChartDistribucion() {
      
      // Verificar que el canvas existe y está en el DOM
      const ctx = document.getElementById('chart-distribucion-nivel1');
      if (!ctx || !ctx.parentNode) {
        console.warn('⚠️ Canvas chart-distribucion-nivel1 no encontrado o no está en el DOM');
        return;
      }
      
      
      // 🔥 USAR Chart.getChart() PARA VERIFICAR Y DESTRUIR GRÁFICAS EXISTENTES
      try {
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
          try {
            existingChart.destroy();
          } catch (error) {
            console.warn('⚠️ Error destruyendo gráfica existente con Chart.getChart():', error);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo gráfica existente:', error);
      }
      
      // Destruir gráfica anterior de forma completamente segura
      if (this.chartDistribucion) {
        try {
          // Verificar que la instancia de Chart.js sea válida
          if (this.chartDistribucion && typeof this.chartDistribucion.destroy === 'function') {
            // Verificar que el canvas exista en el DOM antes de destruir
            const existingCanvas = document.getElementById('chart-distribucion-nivel1');
            if (existingCanvas && this.chartDistribucion.canvas === existingCanvas) {
              this.chartDistribucion.destroy();
            }
          }
        } catch (error) {
          console.warn('⚠️ Error destruyendo instancia local:', error);
        }
        this.chartDistribucion = null;
      }
      
      // Si no hay datos, mostrar mensaje
      if (!this.distribucionNivel1 || this.distribucionNivel1.length === 0) {
        
        // Mostrar gráfica vacía con mensaje
        this.chartDistribucion = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Sin datos'],
            datasets: [{
              data: [1],
              backgroundColor: ['rgba(200, 200, 200, 0.3)'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: false
              }
            }
          }
        });
        return;
      }
      
      const labels = this.distribucionNivel1.map(item => item.nivel1 || 'Sin categoría');
      const data = this.distribucionNivel1.map(item => item.count);
      const colors = [
        'rgba(102, 126, 234, 0.8)',
        'rgba(72, 187, 120, 0.8)',
        'rgba(237, 137, 54, 0.8)',
        'rgba(245, 101, 101, 0.8)',
        'rgba(159, 122, 234, 0.8)',
        'rgba(66, 153, 225, 0.8)',
        'rgba(236, 201, 75, 0.8)',
        'rgba(237, 100, 166, 0.8)'
      ];
      
      try {
        this.chartError = false; // Resetear flag de error
        this.chartDistribucion = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.slice(0, data.length),
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                font: {
                  size: 12
                },
                generateLabels: function(chart) {
                  const data = chart.data;
                  if (data.labels.length && data.datasets.length) {
                    return data.labels.map((label, i) => {
                      const value = data.datasets[0].data[i];
                      const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return {
                        text: `${label}: ${value} (${percentage}%)`,
                        fillStyle: data.datasets[0].backgroundColor[i],
                        hidden: false,
                        index: i
                      };
                    });
                  }
                  return [];
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleColor: '#fff',
              bodyColor: '#fff',
              callbacks: {
                label: function(context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                  return `${context.parsed} llamadas (${percentage}%)`;
                }
              }
            }
          }
        }
      });
      
      } catch (error) {
        console.error('❌ Error creando gráfica de distribución:', error);
        this.chartError = true; // Activar fallback HTML
        this.chartDistribucion = null;
      }
    }
  },
  beforeUnmount() {
    
    // Destruir gráficas de Chart.js
    if (this.chartHora) {
      try {
        this.chartHora.destroy();
      } catch (error) {
        console.warn('⚠️ Error destruyendo chartHora:', error);
      }

    }
    
    if (this.chartDistribucion) {
      try {
        this.chartDistribucion.destroy();
      } catch (error) {
        console.warn('⚠️ Error destruyendo chartDistribucion:', error);
      }
    }
    
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

<style scoped>
.chart-fallback {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: 10;
}

.chart-canvas {
  transition: opacity 0.3s ease;
}

.chart-fallback + .chart-canvas {
  opacity: 0;
}
</style>

