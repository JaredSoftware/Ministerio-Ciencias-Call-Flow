const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionPromise = null;
  }

  // Conectar a Redis
  async connect() {
    if (this.isConnected && this.client) {
      return this.client;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const redisHost = process.env.REDIS_HOST || 'localhost';
        const redisPort = process.env.REDIS_PORT || 6379;

        this.client = redis.createClient({
          socket: {
            host: redisHost,
            port: redisPort
          }
        });

        this.client.on('error', (err) => {
          console.error('❌ Error en Redis:', err);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          console.log('🔄 Conectando a Redis...');
        });

        this.client.on('ready', () => {
          console.log('✅ Redis conectado y listo');
          this.isConnected = true;
          resolve(this.client);
        });

        this.client.on('end', () => {
          console.log('❌ Redis desconectado');
          this.isConnected = false;
        });

        this.client.connect().catch(reject);

      } catch (error) {
        console.error('❌ Error inicializando Redis:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Guardar tipificación pendiente para un agente
  async addTipificacionPendiente(idAgent, tipificacionData) {
    try {
      await this.connect();
      
      const key = `tipificacion:pending:${idAgent}`;
      const tipificacionId = tipificacionData.idLlamada || Date.now().toString();
      
      // Guardar la tipificación con su ID como identificador
      await this.client.hSet(
        `tipificacion:${tipificacionId}`,
        {
          idAgent: idAgent,
          data: JSON.stringify(tipificacionData),
          createdAt: new Date().toISOString(),
          status: 'pending'
        }
      );

      // Agregar a la cola del agente (lista ordenada por prioridad)
      const priority = tipificacionData.priority || 1;
      await this.client.zAdd(key, {
        score: priority,
        value: tipificacionId
      });

      // Establecer TTL de 24 horas para la tipificación
      await this.client.expire(`tipificacion:${tipificacionId}`, 86400);
      await this.client.expire(key, 86400);

      console.log(`✅ Tipificación ${tipificacionId} guardada en Redis para agente ${idAgent}`);
      
      return tipificacionId;
    } catch (error) {
      console.error('❌ Error guardando tipificación en Redis:', error);
      throw error;
    }
  }

  // Obtener siguiente tipificación pendiente para un agente (sin remover de la cola)
  async getNextTipificacionPendiente(idAgent) {
    try {
      await this.connect();
      
      const key = `tipificacion:pending:${idAgent}`;
      
      // Obtener la tipificación con mayor prioridad (mayor score = mayor prioridad)
      // REV: true para obtener de mayor a menor score
      const result = await this.client.zRange(key, 0, 0, { REV: true });
      
      if (!result || result.length === 0) {
        return null;
      }

      const tipificacionId = result[0];
      const tipificacionData = await this.client.hGetAll(`tipificacion:${tipificacionId}`);
      
      if (!tipificacionData || !tipificacionData.data) {
        // Si no existe, limpiar de la cola
        await this.client.zRem(key, tipificacionId);
        return null;
      }

      return {
        id: tipificacionId,
        ...JSON.parse(tipificacionData.data),
        createdAt: tipificacionData.createdAt,
        status: tipificacionData.status
      };
    } catch (error) {
      console.error('❌ Error obteniendo tipificación pendiente:', error);
      throw error;
    }
  }

  // Obtener todas las tipificaciones pendientes de un agente
  async getAllTipificacionesPendientes(idAgent) {
    try {
      await this.connect();
      
      const key = `tipificacion:pending:${idAgent}`;
      
      // 🚀 OBTENER TODOS LOS IDs (de mayor a menor prioridad, luego por orden de creación)
      // REV: true para obtener de mayor a menor score (prioridad)
      const tipificacionIds = await this.client.zRange(key, 0, -1, { REV: true });
      
      console.log(`📋 [Redis] Obteniendo tipificaciones para agente ${idAgent}: ${tipificacionIds.length} IDs encontrados`, tipificacionIds);
      
      if (!tipificacionIds || tipificacionIds.length === 0) {
        return [];
      }

      const tipificaciones = [];
      const errores = [];
      
      for (const tipificacionId of tipificacionIds) {
        try {
          const tipificacionData = await this.client.hGetAll(`tipificacion:${tipificacionId}`);
          
          if (tipificacionData && tipificacionData.data) {
            const parsedData = JSON.parse(tipificacionData.data);
            tipificaciones.push({
              id: tipificacionId,
              ...parsedData,
              createdAt: tipificacionData.createdAt,
              status: tipificacionData.status
            });
          } else {
            console.warn(`⚠️ [Redis] Tipificación ${tipificacionId} sin datos, limpiando de cola`);
            // Limpiar de la cola si no tiene datos
            await this.client.zRem(key, tipificacionId);
          }
        } catch (parseError) {
          console.error(`❌ [Redis] Error parseando tipificación ${tipificacionId}:`, parseError);
          errores.push(tipificacionId);
        }
      }
      
      // Limpiar tipificaciones con errores de la cola
      if (errores.length > 0) {
        for (const errorId of errores) {
          await this.client.zRem(key, errorId);
        }
      }
      
      console.log(`✅ [Redis] Devolviendo ${tipificaciones.length} tipificaciones válidas para agente ${idAgent}`);
      
      return tipificaciones;
    } catch (error) {
      console.error('❌ Error obteniendo todas las tipificaciones pendientes:', error);
      throw error;
    }
  }

  // Marcar tipificación como atendida (remover de cola)
  async marcarTipificacionAtendida(idAgent, tipificacionId) {
    try {
      await this.connect();
      
      const key = `tipificacion:pending:${idAgent}`;
      
      // Remover de la cola
      await this.client.zRem(key, tipificacionId);
      
      // Actualizar status en el hash
      await this.client.hSet(`tipificacion:${tipificacionId}`, 'status', 'attended');
      
      console.log(`✅ Tipificación ${tipificacionId} marcada como atendida para agente ${idAgent}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error marcando tipificación como atendida:', error);
      throw error;
    }
  }

  // Obtener tipificación específica por ID
  async getTipificacionById(tipificacionId) {
    try {
      await this.connect();
      
      const tipificacionData = await this.client.hGetAll(`tipificacion:${tipificacionId}`);
      
      if (!tipificacionData || !tipificacionData.data) {
        return null;
      }

      return {
        id: tipificacionId,
        ...JSON.parse(tipificacionData.data),
        createdAt: tipificacionData.createdAt,
        status: tipificacionData.status
      };
    } catch (error) {
      console.error('❌ Error obteniendo tipificación por ID:', error);
      throw error;
    }
  }

  // Contar tipificaciones pendientes de un agente
  async countTipificacionesPendientes(idAgent) {
    try {
      await this.connect();
      
      const key = `tipificacion:pending:${idAgent}`;
      return await this.client.zCard(key);
    } catch (error) {
      console.error('❌ Error contando tipificaciones pendientes:', error);
      return 0;
    }
  }

  // Desconectar
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('🔌 Redis desconectado');
    }
  }

  // Verificar conexión
  async ping() {
    try {
      await this.connect();
      return await this.client.ping();
    } catch (error) {
      console.error('❌ Error en ping de Redis:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
const redisService = new RedisService();

module.exports = redisService;

