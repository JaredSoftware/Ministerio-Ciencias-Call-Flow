# Configuración Dinámica de URLs

## Descripción

Este sistema permite que las conexiones MQTT y WebSocket se adapten automáticamente al entorno donde se despliega la aplicación, sin necesidad de cambiar código manualmente.

## Cómo Funciona

### Detección Automática de Entorno

El sistema detecta automáticamente:

1. **URL Base**: Extrae la URL del navegador (protocolo, hostname, puerto)
2. **Entorno**: Determina si es desarrollo o producción basado en el hostname
3. **URLs de Conexión**: Construye las URLs apropiadas para cada servicio

### Configuración por Entorno

#### Desarrollo
- **MQTT**: `ws://localhost:9001`
- **WebSocket**: `http://localhost:9035`
- **API**: `http://localhost:9035`

#### Producción
- **MQTT**: `ws://[hostname]:9001` o `wss://[hostname]:9001`
- **WebSocket**: `http://[hostname]:9035` o `https://[hostname]:9035`
- **API**: `http://[hostname]` o `https://[hostname]`

## Ejemplos de Uso

### En desarrollo local
```
URL del navegador: http://localhost:8080
MQTT: ws://localhost:9001
WebSocket: http://localhost:9035
```

### En servidor de producción
```
URL del navegador: https://mi-servidor.com
MQTT: wss://mi-servidor.com:9001
WebSocket: https://mi-servidor.com:9035
```

### En servidor con puerto personalizado
```
URL del navegador: https://mi-servidor.com:3000
MQTT: wss://mi-servidor.com:9001
WebSocket: https://mi-servidor.com:9035
```

## Ventajas

1. **Sin configuración manual**: No necesitas cambiar URLs al hacer deploy
2. **Funciona en cualquier servidor**: Se adapta automáticamente
3. **Soporte para HTTP/HTTPS**: Detecta el protocolo automáticamente
4. **Debug integrado**: Logs detallados para troubleshooting

## Archivos Modificados

- `environment.js`: Configuración dinámica principal
- `mqttConfig.js`: Usa URLs dinámicas para MQTT
- `websocketService.js`: Usa URLs dinámicas para WebSocket
- `App.vue`: Integra la configuración dinámica

## Debug

Para ver la configuración actual, revisa la consola del navegador. Se mostrará:

```
🌐 Información del entorno:
   - URL Base: https://mi-servidor.com
   - Es desarrollo: false
   - WebSocket URL: https://mi-servidor.com:9035
   - MQTT Broker URL: wss://mi-servidor.com:9001
   - API URL: https://mi-servidor.com
```

