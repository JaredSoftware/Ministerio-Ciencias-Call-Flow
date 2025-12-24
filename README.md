# 📞 CallFlow - Sistema CRM para Call Center

Sistema completo de gestión de relaciones con clientes (CRM) y call center desarrollado para el Ministerio de Ciencias, con arquitectura moderna basada en microservicios, comunicación en tiempo real mediante MQTT Pub/Sub y gestión avanzada de tipificaciones.

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características Principales](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Docker](#-docker)
- [API y Endpoints](#-api-y-endpoints)
- [Documentación Adicional](#-documentación-adicional)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 🎯 Descripción

**CallFlow** es una plataforma integral de gestión de call center diseñada para manejar grandes volúmenes de llamadas, tipificaciones y relaciones con clientes. El sistema implementa una arquitectura moderna con comunicación asíncrona mediante MQTT, permitiendo escalabilidad y rendimiento óptimo.

### Casos de Uso Principales

- 📞 Gestión de llamadas entrantes y salientes
- 👥 Administración de agentes y estados en tiempo real
- 📊 Dashboard con métricas y estadísticas en vivo
- 🌳 Sistema de tipificación jerárquico y configurable
- 📋 Gestión completa de clientes y su historial
- 📈 Reportes y exportación de datos
- 🔐 Sistema de permisos y roles granular

---

## ✨ Características Principales

### 🚀 Funcionalidades Core

- **Dashboard en Tiempo Real**: Visualización de métricas, gráficas interactivas y estadísticas actualizadas automáticamente cada 30 segundos
- **Gestión de Clientes**: CRUD completo con búsqueda avanzada, historial de interacciones y exportación a Excel
- **Sistema de Tipificaciones**: Árbol jerárquico configurable para categorizar llamadas en múltiples niveles
- **Gestión de Agentes**: Control de estados, disponibilidad y asignación automática de llamadas
- **Arquitectura Pub/Sub**: Comunicación asíncrona mediante MQTT para máxima eficiencia
- **Exportación de Datos**: Generación de reportes en formato Excel (.xlsx)
- **Zona Horaria**: Configuración para Colombia (UTC-5) con manejo correcto de fechas

### 📊 Dashboard

- **Métricas en Tiempo Real**:
  - Agentes conectados
  - Total de clientes CRM
  - Tipificaciones del día
  - Llamadas en cola

- **Gráficas Interactivas**:
  - Tipificaciones por hora del día
  - Distribución por categorías (Nivel 1)
  - Top 5 agentes con mejor rendimiento
  - Estados de agentes

### 🔄 Comunicación en Tiempo Real

- **MQTT Pub/Sub**: Sistema de mensajería asíncrona para actualizaciones instantáneas
- **WebSocket**: Conexiones persistentes para notificaciones en vivo
- **Socket.IO**: Sincronización de estados entre clientes

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DEL SISTEMA                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │      │   Backend    │      │   MongoDB    │
│   (Vue.js)   │◄────►│  (Node.js)   │◄────►│  (Database)  │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                     │
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Nginx      │      │   MQTT       │      │   Redis      │
│  (Reverse    │      │  (Broker)    │      │  (Sessions)  │
│   Proxy)     │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
```

### Componentes Principales

- **Frontend**: Aplicación Vue.js 3 con diseño responsive
- **Backend**: API REST + MQTT en Node.js/Express
- **Base de Datos**: MongoDB para persistencia de datos
- **Cache/Sesiones**: Redis para gestión de sesiones
- **Broker MQTT**: Aedes (embebido) para comunicación Pub/Sub
- **Proxy Reverso**: Nginx para servir archivos estáticos y SSL

---

## 🛠️ Tecnologías

### Backend
- **Node.js** 18.x (LTS)
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **Redis** - Cache y sesiones
- **MQTT (Aedes)** - Broker de mensajería
- **Socket.IO** - WebSockets en tiempo real
- **PM2** - Gestor de procesos
- **Docker** - Contenedores

### Frontend
- **Vue.js** 3.x - Framework progresivo
- **Vue Router** - Enrutamiento
- **Vuex** - Gestión de estado
- **Chart.js** - Gráficas interactivas
- **Bootstrap** 5 - Framework CSS
- **XLSX** - Exportación a Excel
- **Axios** - Cliente HTTP
- **MQTT.js** - Cliente MQTT

### DevOps
- **Docker Compose** - Orquestación de contenedores
- **Nginx** - Servidor web y proxy reverso
- **PM2** - Gestión de procesos en producción

---

## 📦 Requisitos

### Software Necesario

- **Node.js** >= 18.x (LTS recomendado)
- **npm** >= 9.x
- **Docker** >= 20.x (opcional, para desarrollo con contenedores)
- **Docker Compose** >= 2.x (opcional)
- **MongoDB** >= 6.x (si no se usa Docker)
- **Redis** >= 7.x (si no se usa Docker)

### Sistema Operativo

- Linux (Ubuntu 20.04+ recomendado)
- macOS
- Windows (con WSL2 recomendado)

---

## 🚀 Instalación

### Opción 1: Instalación con Docker (Recomendado)

1. **Clonar el repositorio**
```bash
git clone https://github.com/JaredSoftware/Ministerio-Ciencias-Call-Flow.git
cd Ministerio-Ciencias-Call-Flow
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Construir y levantar contenedores**
```bash
docker-compose up -d --build
```

4. **Verificar que los servicios estén corriendo**
```bash
docker-compose ps
```

### Opción 2: Instalación Manual

1. **Instalar dependencias del backend**
```bash
npm install
```

2. **Instalar dependencias del frontend**
```bash
cd frontend
npm install
cd ..
```

3. **Construir el frontend**
```bash
cd frontend
npm run build
cd ..
```

4. **Configurar MongoDB y Redis**
   - Asegúrate de que MongoDB y Redis estén corriendo
   - Configura las variables de entorno en `.env`

5. **Inicializar la base de datos**
```bash
node initDb.js
```

6. **Iniciar el servidor**
```bash
npm start
# O con PM2:
pm2 start index.js --name callflow
```

---

## 🔐 Acceso al Repositorio

Este repositorio es **privado**. Para que el cliente pueda acceder y descargar el código, hay dos opciones:

### Opción 1: Agregar como Colaborador (Recomendado)

1. **El propietario del repositorio debe agregar al cliente como colaborador:**
   - Ir a: `https://github.com/JaredSoftware/Ministerio-Ciencias-Call-Flow/settings/access`
   - Clic en "Add people" o "Invite a collaborator"
   - Ingresar el usuario de GitHub del cliente o su email
   - Seleccionar el nivel de acceso: **Read** (solo lectura) o **Write** (lectura y escritura)
   - El cliente recibirá una invitación por email

2. **El cliente debe aceptar la invitación:**
   - Revisar el email de invitación de GitHub
   - Clic en "Accept invitation"
   - Iniciar sesión en GitHub si es necesario

3. **Una vez aceptada la invitación, el cliente puede clonar el repositorio:**
```bash
git clone https://github.com/JaredSoftware/Ministerio-Ciencias-Call-Flow.git
cd Ministerio-Ciencias-Call-Flow
```

### Opción 2: Token de Acceso Personal

Si el cliente no tiene cuenta de GitHub o prefieres usar un token:

1. **Crear un token de acceso personal:**
   - El propietario del repositorio debe ir a: `https://github.com/settings/tokens`
   - Clic en "Generate new token" → "Generate new token (classic)"
   - Nombre: "Cliente - Ministerio Ciencias"
   - Expiración: Configurar según necesidad
   - Permisos: Marcar `repo` (acceso completo a repositorios privados)
   - Generar y copiar el token (solo se muestra una vez)

2. **Compartir el token de forma segura** con el cliente (usar canal seguro, no email sin cifrar)

3. **El cliente puede clonar usando el token:**
```bash
git clone https://[TOKEN]@github.com/JaredSoftware/Ministerio-Ciencias-Call-Flow.git
cd Ministerio-Ciencias-Call-Flow
```

**Ejemplo:**
```bash
git clone https://ghp_xxxxxxxxxxxxxxxxxxxx@github.com/JaredSoftware/Ministerio-Ciencias-Call-Flow.git
```

### Descargar como ZIP (Sin Git)

Si el cliente solo necesita descargar el código una vez sin usar Git:

1. **Acceder al repositorio** (con invitación aceptada o token)
2. **Clic en el botón verde "Code"**
3. **Seleccionar "Download ZIP"**
4. **Extraer el archivo ZIP** en su máquina local

### Notas de Seguridad

- ⚠️ **Nunca compartir tokens en repositorios públicos o código**
- ⚠️ **Los tokens deben tener fecha de expiración**
- ⚠️ **Revocar tokens si se comprometen o ya no se necesitan**
- ✅ **Recomendado**: Usar la opción de colaborador para mejor control de acceso

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=27017
DB_USER=admin
DB_PASSWORD=password123
DB=menv

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Servidor
PORT=9035
NODE_ENV=production

# MQTT
MQTT_PORT=1884
MQTT_WS_PORT=9001

# Zona Horaria
TZ=America/Bogota

# Seguridad
SESSION_SECRET=tu_secret_key_aqui
JWT_SECRET=tu_jwt_secret_aqui
```

### Configuración de MongoDB

El sistema requiere una base de datos MongoDB. Si usas Docker, se configura automáticamente. Si no:

1. Instala MongoDB
2. Crea un usuario administrador
3. Configura las credenciales en `.env`

### Configuración de Redis

Redis se usa para gestión de sesiones. Con Docker se configura automáticamente. Si no:

1. Instala Redis
2. Configura la conexión en `.env`

---

## 📖 Uso

### Acceso al Sistema

1. **Abrir el navegador** en `http://localhost` (o el dominio configurado)
2. **Iniciar sesión** con tus credenciales
3. **Navegar** por las diferentes secciones:
   - Dashboard: Métricas y estadísticas
   - Clientes: Gestión de clientes
   - Tipificaciones: Historial de llamadas
   - Usuarios: Administración de usuarios
   - Reportes: Exportación de datos

### Funcionalidades Principales

#### Dashboard
- Visualiza métricas en tiempo real
- Gráficas de tipificaciones por hora
- Top agentes y distribución de trabajo

#### Gestión de Clientes
- Buscar clientes por cédula, nombre, correo o teléfono
- Ver historial completo de interacciones
- Editar información del cliente
- Exportar datos a Excel

#### Tipificaciones
- Filtrar por rango de fechas
- Ver detalles de cada tipificación
- Exportar reportes a Excel

#### Administración
- Gestionar usuarios y permisos
- Configurar árbol de tipificación
- Ver usuarios activos en tiempo real

---

## 📁 Estructura del Proyecto

```
Ministerio-Ciencias-Call-Flow/
├── backend/              # Scripts del backend
│   └── reportCron.js     # Tareas programadas
├── controllers/          # Controladores
│   ├── config.js
│   └── general.js
├── docs/                 # Documentación técnica
│   ├── CRM_PUBSUB_MQTT.md
│   ├── DASHBOARD_CRM.md
│   └── ...
├── frontend/             # Aplicación Vue.js
│   ├── src/
│   │   ├── components/  # Componentes Vue
│   │   ├── router/       # Configuración de rutas
│   │   ├── store/        # Vuex store
│   │   └── views/        # Vistas principales
│   └── package.json
├── middleware/           # Middlewares de Express
├── models/               # Modelos de Mongoose
│   ├── cliente.js
│   ├── tipificacion.js
│   ├── users.js
│   └── ...
├── routes/               # Rutas de la API
│   ├── index.routes.js
│   └── ...
├── services/             # Servicios
│   ├── mqttService.js
│   ├── stateManager.js
│   └── ...
├── utils/                # Utilidades
│   └── fechaColombia.js  # Manejo de zona horaria
├── views/                # Plantillas EJS
├── nginx/                # Configuración Nginx
├── public/               # Archivos estáticos
├── docker-compose.yml    # Configuración Docker
├── Dockerfile            # Imagen Docker
├── app.js                # Aplicación principal
├── index.js              # Punto de entrada
└── package.json          # Dependencias
```

---

## 🐳 Docker

### Servicios Docker

El proyecto incluye 4 servicios principales:

1. **mongodb**: Base de datos MongoDB
   - Puerto: `37017:27017`
   - Volumen persistente: `mongodb_data`

2. **redis**: Cache y sesiones
   - Puerto: `6379:6379`
   - Volumen persistente: `redis_data`

3. **app**: Aplicación Node.js
   - Puerto HTTP: `9035:9035`
   - Puerto MQTT WS: `9001:9001`
   - Zona horaria: `America/Bogota`

4. **nginx**: Proxy reverso y servidor web
   - Puerto HTTP: `80:80`
   - Puerto HTTPS: `443:443`

### Comandos Docker Útiles

```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Reiniciar un servicio
docker-compose restart app

# Detener todos los servicios
docker-compose down

# Reconstruir contenedores
docker-compose up -d --build

# Ver estado de servicios
docker-compose ps
```

---

## 🔌 API y Endpoints

### Endpoints Principales

#### Autenticación
- `POST /api/login` - Iniciar sesión
- `POST /api/logout` - Cerrar sesión
- `GET /api/auth/sync-session` - Sincronizar sesión

#### Clientes
- `GET /api/crm/clientes` - Listar clientes (con paginación y búsqueda)
- `GET /api/crm/cliente/:cedula` - Obtener cliente por cédula
- `PUT /api/crm/cliente/:cedula` - Actualizar cliente
- `GET /api/tipificacion/historial/cliente/:cedula` - Historial de tipificaciones

#### Tipificaciones
- `GET /api/tipificaciones` - Listar tipificaciones
- `POST /api/tipificacion` - Crear tipificación
- `PUT /api/tipificacion/:id` - Actualizar tipificación

#### Dashboard
- Las estadísticas se obtienen mediante MQTT:
  - Topic: `crm/estadisticas/solicitar/:userId`
  - Respuesta: `crm/estadisticas/respuesta/:userId`

#### Árbol de Tipificación
- `GET /api/tree` - Obtener árbol actual
- `POST /api/tree/upload` - Subir nuevo árbol (JSON)
- `GET /api/tree/download` - Descargar árbol actual

### Comunicación MQTT

El sistema usa MQTT para comunicación asíncrona. Topics principales:

- `crm/clientes/buscar/cedula/:userId` - Búsqueda por cédula
- `crm/clientes/buscar/fechas/:userId` - Búsqueda por fechas
- `crm/tipificaciones/buscar/fechas/:userId` - Búsqueda de tipificaciones
- `crm/estadisticas/solicitar/:userId` - Solicitar estadísticas
- `telefonia/users/connected` - Usuario conectado
- `telefonia/users/disconnected` - Usuario desconectado

---

## 📚 Documentación Adicional

La documentación detallada se encuentra en la carpeta `docs/`:

- **[CRM_PUBSUB_MQTT.md](./docs/CRM_PUBSUB_MQTT.md)** - Arquitectura Pub/Sub y MQTT
- **[DASHBOARD_CRM.md](./docs/DASHBOARD_CRM.md)** - Documentación completa del Dashboard
- **[ARBOL_TIPIFICACION_README.md](./ARBOL_TIPIFICACION_README.md)** - Sistema de tipificaciones
- **[STATUS_SYSTEM_QUICK_REFERENCE.md](./docs/STATUS_SYSTEM_QUICK_REFERENCE.md)** - Sistema de estados

---

## 🔧 Desarrollo

### Scripts Disponibles

```bash
# Backend
npm start          # Iniciar servidor (producción)
npm test           # Iniciar con nodemon (desarrollo)

# Frontend
cd frontend
npm run serve      # Servidor de desarrollo
npm run build      # Construir para producción
npm run lint       # Linter
```

### Estructura de Desarrollo

- **Backend**: Código en `app.js`, `routes/`, `models/`, `services/`
- **Frontend**: Código en `frontend/src/`
- **Build**: El frontend se construye en `dist/` en la raíz

### Zona Horaria

El sistema está configurado para **Colombia (UTC-5)**:
- Contenedor Docker configurado con `TZ=America/Bogota`
- Utilidades en `utils/fechaColombia.js` para manejo de fechas
- Todas las fechas se guardan y muestran en hora Colombia

---

## 🧪 Testing

```bash
# Ejecutar tests (si están configurados)
npm test
```

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código

- Usar ESLint para mantener consistencia
- Seguir las convenciones de Vue.js y Node.js
- Documentar funciones complejas
- Escribir commits descriptivos

---

## 📝 Licencia

Este proyecto es privado y propiedad del Ministerio de Ciencias.

---

## 👥 Autores

- **Jared Software** - Desarrollo inicial y mantenimiento

---

## 📞 Soporte

Para soporte, contacta al equipo de desarrollo o abre un issue en el repositorio.

---

## 🗺️ Roadmap

- [ ] Mejoras en el sistema de permisos
- [ ] Integración con más sistemas telefónicos
- [ ] Dashboard avanzado con más métricas
- [ ] API REST completa documentada
- [ ] Tests automatizados
- [ ] Mejoras en la exportación de reportes

---

## 🙏 Agradecimientos

- Ministerio de Ciencias por el apoyo y requerimientos
- Comunidad open source por las librerías utilizadas

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2025
