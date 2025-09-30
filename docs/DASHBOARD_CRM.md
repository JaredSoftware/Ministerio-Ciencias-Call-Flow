# 📊 Dashboard CRM - Documentación Completa

## 📋 Índice
- [Descripción General](#descripción-general)
- [Métricas y Visualizaciones](#métricas-y-visualizaciones)
- [Arquitectura Técnica](#arquitectura-técnica)
- [Flujos de Datos](#flujos-de-datos)
- [Gráficas Interactivas](#gráficas-interactivas)
- [Actualización en Tiempo Real](#actualización-en-tiempo-real)
- [Guía de Uso](#guía-de-uso)

---

## 📖 Descripción General

El Dashboard CRM es un **centro de control en tiempo real** que proporciona una visión completa del estado del sistema de call center y CRM. Utiliza **arquitectura Pub/Sub con MQTT** para actualización automática sin necesidad de recargar la página.

### ✨ Características Principales

- 📊 **8 Visualizaciones Diferentes** (4 cards + 2 gráficas + 2 tablas)
- ⚡ **Actualización Automática** cada 30 segundos
- 📡 **100% MQTT Pub/Sub** - Sin polling HTTP
- 📈 **Gráficas Interactivas** con Chart.js
- 🎨 **Diseño Responsive** adaptable a cualquier pantalla
- 🔄 **Datos en Tiempo Real** desde MongoDB

---

## 📊 Métricas y Visualizaciones

### 1. 👥 Agentes Conectados

**Card Superior Izquierda**

**Qué muestra:**
- Número actual de agentes conectados y trabajando
- Comparación con el día anterior
- Cambio porcentual

**Cálculo:**
```javascript
UserStatus.countDocuments({
  isActive: true,
  status: { $in: workStatusValues } // Estados de categoría 'work'
})
```

**Ejemplo de Visualización:**
```
👥 AGENTES CONECTADOS
8
+25% ↑
en tiempo real
```

**Datos que incluye:**
- `agentesConectados`: Número actual
- `agentesAyer`: Número del día anterior
- `percentage`: Cambio porcentual calculado

---

### 2. 📊 Clientes CRM

**Card Superior Centro-Izquierda**

**Qué muestra:**
- Total de clientes registrados activos en el sistema
- Comparación con la semana anterior
- Tasa de crecimiento

**Cálculo:**
```javascript
Cliente.countDocuments({ activo: true })
```

**Ejemplo de Visualización:**
```
📊 CLIENTES CRM
1,250
+5.9% ↑
desde la semana pasada
```

**Datos que incluye:**
- `totalClientes`: Total actual
- `clientesSemanaAnterior`: Total hace 7 días
- `percentage`: Crecimiento semanal

---

### 3. 📞 Tipificaciones Hoy

**Card Superior Centro-Derecha**

**Qué muestra:**
- Llamadas completadas desde las 00:00 hrs del día actual
- Comparación con el día anterior
- Indicador de productividad

**Cálculo:**
```javascript
Tipificacion.countDocuments({
  createdAt: { $gte: hoy, $lte: hoyFin },
  status: 'success'
})
```

**Ejemplo de Visualización:**
```
📞 TIPIFICACIONES HOY
168
+18.3% ↑
comparado con ayer
```

**Colores del Indicador:**
- Verde (↑): Más tipificaciones que ayer
- Rojo (↓): Menos tipificaciones que ayer

---

### 4. ⏳ Llamadas en Cola

**Card Superior Derecha**

**Qué muestra:**
- Tipificaciones pendientes de asignar a agentes
- Estado del sistema (Activas/Sin cola)
- Indicador de carga

**Cálculo:**
```javascript
Tipificacion.countDocuments({
  status: 'pending'
})
```

**Ejemplo de Visualización:**
```
⏳ LLAMADAS EN COLA
7
Activas
esperando asignación
```

**Estados:**
- **Activas**: Hay llamadas pendientes
- **Sin cola**: No hay llamadas esperando

---

### 5. 📈 Tipificaciones por Hora

**Gráfica de Líneas - Panel Izquierdo (70% ancho)**

**Qué muestra:**
- Distribución de tipificaciones completadas por cada hora del día (0-23 hrs)
- Tendencias de actividad durante la jornada
- Horas pico y valles de trabajo

**Tipo de Gráfica:**
- **Chart.js Line Chart** con área rellena
- 24 puntos de datos (una por hora)
- Línea suavizada con `tension: 0.4`
- Tooltips interactivos

**Cálculo:**
```javascript
// Para cada hora de 0 a 23
for (let hora = 0; hora < 24; hora++) {
  const count = await Tipificacion.countDocuments({
    createdAt: { $gte: horaInicio, $lte: horaFin },
    status: 'success'
  });
  tipificacionesPorHora.push({ hora, count });
}
```

**Ejemplo Visual:**
```
📈 Tipificaciones por Hora - Hoy
168 llamadas procesadas hoy

    ┌─────────────────────────────┐
 20 │         ╱╲                  │
    │       ╱    ╲      ╱╲        │
 15 │     ╱        ╲  ╱    ╲      │
    │   ╱            ╲╱      ╲    │
 10 │ ╱                       ╲   │
    └─────────────────────────────┘
    0  3  6  9  12 15 18 21 24
```

**Configuración de Colores:**
- Línea: `rgba(102, 126, 234, 1)` - Azul morado
- Área: `rgba(102, 126, 234, 0.1)` - Azul morado transparente
- Puntos: Blanco con borde azul

**Interactividad:**
- Hover sobre puntos muestra tooltip
- Tooltip formato: "X tipificaciones"
- Animación suave al cargar

---

### 6. 🎯 Distribución de Tipificaciones

**Gráfica de Dona - Panel Derecho (30% ancho)**

**Qué muestra:**
- Distribución porcentual de tipificaciones por categoría principal (nivel1)
- Top 8 categorías más utilizadas
- Porcentajes calculados automáticamente

**Tipo de Gráfica:**
- **Chart.js Doughnut Chart**
- Máximo 8 categorías
- Leyenda con valores y porcentajes
- 8 colores diferenciados

**Cálculo:**
```javascript
Tipificacion.aggregate([
  {
    $match: {
      createdAt: { $gte: hoy, $lte: hoyFin },
      status: 'success'
    }
  },
  {
    $group: {
      _id: {
        $cond: [
          { $or: [
            { $eq: ['$nivel1', ''] },
            { $eq: ['$nivel1', null] }
          ]},
          'Sin categoría',
          '$nivel1'
        ]
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 8 }
])
```

**Ejemplo Visual:**
```
🎯 Distribución de Tipificaciones
168 tipificaciones

        ╱───────╲
      ╱           ╲
     │             │
      ╲           ╱
        ╲───────╱

Académico: 45 (26.8%)
Financiero: 38 (22.6%)
Administrativo: 32 (19.0%)
Inscripciones: 28 (16.7%)
Certificados: 15 (8.9%)
Consultas: 8 (4.8%)
Sin categoría: 2 (1.2%)
```

**Paleta de Colores:**
1. `rgba(102, 126, 234, 0.8)` - Azul morado
2. `rgba(72, 187, 120, 0.8)` - Verde
3. `rgba(237, 137, 54, 0.8)` - Naranja
4. `rgba(245, 101, 101, 0.8)` - Rojo
5. `rgba(159, 122, 234, 0.8)` - Violeta
6. `rgba(66, 153, 225, 0.8)` - Azul
7. `rgba(236, 201, 75, 0.8)` - Amarillo
8. `rgba(237, 100, 166, 0.8)` - Rosa

**Categoría "Sin categoría":**
- Agrupa tipificaciones donde `nivel1` está vacío o es null
- Permite visualizar tipificaciones sin clasificar
- Útil para identificar necesidad de capacitación

**Estado Vacío:**
- Muestra icono de gráfica en gris
- Mensaje: "No hay tipificaciones completadas hoy"
- No renderiza gráfica vacía

---

### 7. 📊 Top 5 Agentes - Tipificaciones Hoy

**Tabla Rankings - Panel Izquierdo Inferior (70% ancho)**

**Qué muestra:**
- Ranking de los 5 agentes más productivos del día
- Tipificaciones completadas por agente
- Llamadas en cola de cada agente
- Porcentaje de efectividad

**Cálculo:**
```javascript
Tipificacion.aggregate([
  {
    $match: {
      createdAt: { $gte: hoy, $lte: hoyFin },
      assignedTo: { $exists: true, $ne: null }
    }
  },
  {
    $group: {
      _id: '$assignedTo',
      completadas: {
        $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
      },
      pendientes: {
        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
      },
      total: { $sum: 1 }
    }
  },
  { $sort: { completadas: -1 } },
  { $limit: 5 }
])
```

**Ejemplo de Tabla:**
```
┌───────────────────────────────────────────────┐
│ 📊 Top 5 Agentes - Tipificaciones Hoy        │
├────┬─────────────┬────────────┬────────┬──────┤
│ #  │ Agente      │ Completadas│ En Cola│ Efec.│
├────┼─────────────┼────────────┼────────┼──────┤
│ 🥇 │ María       │     45     │   3    │ 93%  │
│ 🥈 │ Juan        │     38     │   2    │ 95%  │
│ 🥉 │ Ana         │     32     │   1    │ 97%  │
│ 4  │ Pedro       │     28     │   4    │ 87%  │
│ 5  │ Luis        │     25     │   2    │ 92%  │
└────┴─────────────┴────────────┴────────┴──────┘
```

**Badges de Posición:**
- 🥇 1° - `bg-gradient-warning` (Amarillo/Oro)
- 🥈 2° - `bg-gradient-info` (Azul/Plata)
- 🥉 3° - `bg-gradient-success` (Verde/Bronce)
- 4° - `bg-gradient-primary` (Azul primario)
- 5° - `bg-gradient-secondary` (Gris)

**Métricas por Agente:**
- **Completadas**: Tipificaciones con `status: 'success'`
- **En Cola**: Tipificaciones con `status: 'pending'`
- **Efectividad**: `(completadas / total) * 100`

**Enriquecimiento de Datos:**
```javascript
const user = await User.findById(agente._id).select('name');
```

---

### 8. 👥 Estados de Agentes

**Card con Barras de Progreso - Panel Derecho Inferior (30% ancho)**

**Qué muestra:**
- Distribución de agentes por estado actual
- Barras de progreso visuales por estado
- Porcentaje de cada estado del total
- Cantidad de agentes en cada estado

**Cálculo:**
```javascript
const allUserStatuses = await UserStatus.find({ isActive: true }).populate('userId');

const estadosMap = {};
for (const userStatus of allUserStatuses) {
  const estado = userStatus.status;
  if (!estadosMap[estado]) {
    estadosMap[estado] = {
      count: 0,
      label: userStatus.label,
      color: userStatus.color
    };
  }
  estadosMap[estado].count++;
}

// Convertir a array y calcular porcentajes
const estadosAgentes = Object.keys(estadosMap).map(key => ({
  label: estadosMap[key].label,
  count: estadosMap[key].count,
  color: estadosMap[key].color,
  porcentaje: (estadosMap[key].count / totalAgentes) * 100
})).sort((a, b) => b.count - a.count);
```

**Ejemplo Visual:**
```
┌───────────────────────────────┐
│ 👥 Estados de Agentes         │
├───────────────────────────────┤
│ ● Disponible     5 agentes    │
│ ████████████░░░░░░░░ 60%      │
│                               │
│ ● Ocupado        2 agentes    │
│ █████░░░░░░░░░░░░░░░ 24%      │
│                               │
│ ● En llamada     1 agente     │
│ ███░░░░░░░░░░░░░░░░░ 12%      │
│                               │
│ ● Descanso       1 agente     │
│ █░░░░░░░░░░░░░░░░░░░ 4%       │
└───────────────────────────────┘
```

**Colores Dinámicos:**
- Los colores se obtienen directamente del modelo `StatusType`
- Cada estado tiene su color definido en la BD
- Ejemplos:
  - Disponible: `#48bb78` (Verde)
  - Ocupado: `#ed8936` (Naranja)
  - Desconectado: `#6c757d` (Gris)
  - En llamada: `#4299e1` (Azul)

**Ordenamiento:**
- Estados ordenados por cantidad (descendente)
- El estado con más agentes aparece primero

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

**Frontend:**
- Vue.js 3
- Chart.js v3+
- Bootstrap/Argon Design
- MQTT.js (cliente)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- MQTT (broker Mosquitto en puerto 1884)
- Aggregation Pipeline de MongoDB

### Flujo de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                   DASHBOARD CRM                         │
│                  (Dashboard.vue)                        │
└─────────────────────────────────────────────────────────┘
                        │
                        │ mounted()
                        ↓
┌─────────────────────────────────────────────────────────┐
│              cargarEstadisticasCRM()                    │
│                                                         │
│  1. Obtiene userId del Vuex Store                      │
│  2. Suscribe a: crm/estadisticas/respuesta/{userId}    │
│  3. Publica en: crm/estadisticas/solicitar/{userId}    │
└─────────────────────────────────────────────────────────┘
                        │
                        │ MQTT Publish
                        ↓
┌─────────────────────────────────────────────────────────┐
│                  MQTT BROKER                            │
│              (Mosquitto:1884)                           │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Topic: crm/estadisticas/solicitar/+
                        ↓
┌─────────────────────────────────────────────────────────┐
│              BACKEND LISTENER                           │
│                  (app.js)                               │
│                                                         │
│  Escucha: crm/estadisticas/solicitar/{userId}          │
│  Líneas: 872-1095                                       │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Queries MongoDB
                        ↓
┌─────────────────────────────────────────────────────────┐
│                   MONGODB                               │
│                                                         │
│  Collections:                                           │
│  - UserStatus (agentes conectados)                      │
│  - Cliente (clientes CRM)                               │
│  - Tipificacion (llamadas)                              │
│  - User (datos de agentes)                              │
│  - StatusType (tipos de estado)                         │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Resultados
                        ↓
┌─────────────────────────────────────────────────────────┐
│         CÁLCULOS Y AGREGACIONES                         │
│                                                         │
│  1. Agentes Conectados (count)                          │
│  2. Total Clientes (count)                              │
│  3. Tipificaciones Hoy (count + date range)             │
│  4. Llamadas en Cola (count pending)                    │
│  5. Top 5 Agentes (aggregate + sort + limit)            │
│  6. Estados Agentes (populate + group)                  │
│  7. Tipificaciones por Hora (24 queries)                │
│  8. Distribución Nivel1 (aggregate + cond)              │
└─────────────────────────────────────────────────────────┘
                        │
                        │ MQTT Publish
                        ↓
┌─────────────────────────────────────────────────────────┐
│                  MQTT BROKER                            │
│     Publica en: crm/estadisticas/respuesta/{userId}    │
└─────────────────────────────────────────────────────────┐
                        │
                        │ MQTT Subscribe
                        ↓
┌─────────────────────────────────────────────────────────┐
│              FRONTEND RECIBE                            │
│          actualizarEstadisticas(data)                   │
│                                                         │
│  1. Actualiza stats (cards)                             │
│  2. Actualiza topAgentes                                │
│  3. Actualiza estadosAgentes                            │
│  4. Renderiza chartHora                                 │
│  5. Renderiza chartDistribucion                         │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Render
                        ↓
┌─────────────────────────────────────────────────────────┐
│              DASHBOARD ACTUALIZADO                      │
│                                                         │
│  ✅ Cards con nuevos valores                            │
│  ✅ Tabla Top Agentes actualizada                       │
│  ✅ Barras de Estados actualizadas                      │
│  ✅ Gráfica de Hora re-renderizada                      │
│  ✅ Gráfica de Distribución re-renderizada              │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Cada 30 segundos
                        ↓
                  [Vuelve a empezar]
```

---

## 🔄 Flujos de Datos

### Flujo 1: Carga Inicial del Dashboard

```
1. Usuario navega a /dashboard
2. Dashboard.vue mounted()
3. Espera 500ms para sincronización
4. Conecta WebSocket
5. Conecta MQTT globalmente
6. Llama a cargarEstadisticasCRM()
7. Suscribe a topic de respuesta
8. Publica solicitud en topic de request
9. Backend recibe y calcula
10. Backend publica respuesta
11. Frontend recibe y actualiza
12. Renderiza gráficas
13. Configura intervalo de 30s
```

### Flujo 2: Actualización Automática

```
1. setInterval() ejecuta cada 30 segundos
2. Llama a cargarEstadisticasCRM()
3. Publica nueva solicitud por MQTT
4. Backend calcula datos frescos
5. Backend publica respuesta actualizada
6. Frontend recibe datos
7. Destruye gráficas anteriores
8. Re-renderiza gráficas con nuevos datos
9. Actualiza cards y tablas
10. Usuario ve cambios sin recargar
```

### Flujo 3: Renderizado de Gráficas

**Gráfica de Hora:**
```javascript
renderChartHora() {
  1. Obtiene canvas element
  2. Destruye chart anterior si existe
  3. Extrae labels (horas 0-23)
  4. Extrae data (counts)
  5. Crea nuevo Chart.js instance
  6. Configura opciones (colores, tooltips, scales)
  7. Renderiza en canvas
}
```

**Gráfica de Distribución:**
```javascript
renderChartDistribucion() {
  1. Obtiene canvas element
  2. Valida que hay datos
  3. Si no hay datos: renderiza placeholder
  4. Destruye chart anterior si existe
  5. Extrae labels (categorías)
  6. Extrae data (counts)
  7. Asigna colores del array de 8 colores
  8. Crea Chart.js Doughnut
  9. Configura leyenda personalizada con %
  10. Renderiza en canvas
}
```

---

## 📡 Topics MQTT

### Topic de Solicitud

**Pattern:**
```
crm/estadisticas/solicitar/{userId}
```

**Ejemplo:**
```
crm/estadisticas/solicitar/68bc7d9c4a2b6af524d58b21
```

**Payload:**
```json
{
  "timestamp": "2025-09-30T16:04:25.238Z"
}
```

**Quién publica:** Frontend (Dashboard.vue)
**Quién escucha:** Backend (app.js líneas 872-1095)

---

### Topic de Respuesta

**Pattern:**
```
crm/estadisticas/respuesta/{userId}
```

**Ejemplo:**
```
crm/estadisticas/respuesta/68bc7d9c4a2b6af524d58b21
```

**Payload Completo:**
```json
{
  "agentesConectados": 8,
  "agentesAyer": 6,
  "totalClientes": 1250,
  "clientesSemanaAnterior": 1180,
  "tipificacionesHoy": 168,
  "tipificacionesAyer": 142,
  "llamadasEnCola": 7,
  "topAgentes": [
    {
      "nombre": "María",
      "completadas": 45,
      "pendientes": 3,
      "efectividad": 93
    },
    {
      "nombre": "Juan",
      "completadas": 38,
      "pendientes": 2,
      "efectividad": 95
    }
    // ... hasta 5 agentes
  ],
  "estadosAgentes": [
    {
      "label": "Disponible",
      "count": 5,
      "color": "#48bb78",
      "porcentaje": 60
    },
    {
      "label": "Ocupado",
      "count": 2,
      "color": "#ed8936",
      "porcentaje": 24
    }
    // ... todos los estados activos
  ],
  "tipificacionesPorHora": [
    { "hora": 0, "count": 2 },
    { "hora": 1, "count": 5 },
    { "hora": 8, "count": 15 },
    { "hora": 9, "count": 22 },
    // ... 24 horas
  ],
  "distribucionNivel1": [
    { "nivel1": "Académico", "count": 45 },
    { "nivel1": "Financiero", "count": 38 },
    { "nivel1": "Administrativo", "count": 32 },
    { "nivel1": "Sin categoría", "count": 2 }
    // ... hasta 8 categorías
  ],
  "timestamp": "2025-09-30T16:04:25.238Z"
}
```

**Quién publica:** Backend (app.js)
**Quién escucha:** Frontend (Dashboard.vue)

---

## 🎨 Gráficas Interactivas

### Chart.js - Configuración Global

**Importación:**
```javascript
import Chart from 'chart.js/auto';
```

**Instancias:**
```javascript
data() {
  return {
    chartHora: null,          // Instancia de gráfica de líneas
    chartDistribucion: null   // Instancia de gráfica de dona
  }
}
```

---

### Gráfica de Líneas - Tipificaciones por Hora

**Configuración Completa:**

```javascript
this.chartHora = new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['0:00', '1:00', ..., '23:00'],
    datasets: [{
      label: 'Tipificaciones',
      data: [2, 5, 8, 12, ...], // 24 valores
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
```

**Características:**
- Línea suavizada (`tension: 0.4`)
- Área rellena con transparencia
- Puntos visibles en cada hora
- Tooltips personalizados
- Sin leyenda (innecesaria)
- Eje Y comienza en 0
- Grid solo en Y

---

### Gráfica de Dona - Distribución

**Configuración Completa:**

```javascript
this.chartDistribucion = new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['Académico', 'Financiero', ...],
    datasets: [{
      data: [45, 38, 32, ...],
      backgroundColor: [
        'rgba(102, 126, 234, 0.8)',
        'rgba(72, 187, 120, 0.8)',
        'rgba(237, 137, 54, 0.8)',
        'rgba(245, 101, 101, 0.8)',
        'rgba(159, 122, 234, 0.8)',
        'rgba(66, 153, 225, 0.8)',
        'rgba(236, 201, 75, 0.8)',
        'rgba(237, 100, 166, 0.8)'
      ],
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
          font: { size: 12 },
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
```

**Características:**
- Leyenda personalizada con valores y %
- 8 colores diferenciados
- Bordes blancos entre segmentos
- Tooltips con porcentajes calculados
- Posición de leyenda: bottom
- Padding de 15px en leyenda

---

## ⚡ Actualización en Tiempo Real

### Intervalo Automático

**Configuración:**
```javascript
// En mounted()
this.statsInterval = setInterval(() => {
  this.cargarEstadisticasCRM();
}, 30000); // 30 segundos
```

**Limpieza:**
```javascript
// En beforeUnmount()
if (this.statsInterval) {
  clearInterval(this.statsInterval);
}
```

**Flujo:**
1. Cada 30 segundos llama a `cargarEstadisticasCRM()`
2. Publica nueva solicitud por MQTT
3. Backend calcula datos frescos de MongoDB
4. Backend publica respuesta
5. Frontend actualiza automáticamente
6. Gráficas se re-renderizan

---

### Destrucción de Gráficas

**Importante para evitar memory leaks:**

```javascript
renderChartHora() {
  // Destruir gráfica anterior si existe
  if (this.chartHora) {
    this.chartHora.destroy();
  }
  
  // Crear nueva gráfica
  this.chartHora = new Chart(ctx, {...});
}
```

**Por qué es necesario:**
- Chart.js mantiene referencias al canvas
- Sin destruir, se acumulan instancias en memoria
- Cada actualización crearía una nueva sin limpiar la anterior
- `destroy()` libera todos los recursos

---

## 🔒 Seguridad y Validaciones

### Validación de Usuario

```javascript
const userId = this.$store.state.user?.id || this.$store.state.user?._id;
if (!userId) {
  console.warn('⚠️ No hay usuario para cargar estadísticas');
  return;
}
```

**Topics Personalizados:**
- Cada usuario tiene su propio topic
- Pattern: `crm/estadisticas/{tipo}/{userId}`
- No hay riesgo de recibir datos de otros usuarios

---

### Validación de Datos

**Gráfica de Distribución:**
```javascript
if (!this.distribucionNivel1 || this.distribucionNivel1.length === 0) {
  // Renderizar estado vacío
  // Mostrar mensaje informativo
  return;
}
```

**Prevención de Errores:**
```javascript
const ctx = document.getElementById('chart-hora');
if (!ctx) {
  console.warn('⚠️ Canvas no encontrado');
  return;
}
```

---

## 📊 Queries MongoDB Optimizadas

### 1. Agentes Conectados

**Query:**
```javascript
const workStatusTypes = await StatusType.find({ 
  category: 'work', 
  isActive: true 
});

const agentesConectados = await UserStatus.countDocuments({
  isActive: true,
  status: { $in: workStatusValues }
});
```

**Índices Recomendados:**
```javascript
UserStatus:
  - { isActive: 1, status: 1 }

StatusType:
  - { category: 1, isActive: 1 }
```

---

### 2. Top 5 Agentes (Aggregation Pipeline)

**Pipeline Completo:**
```javascript
const topAgentesData = await Tipificacion.aggregate([
  // Stage 1: Filtrar tipificaciones de hoy
  {
    $match: {
      createdAt: { $gte: hoy, $lte: hoyFin },
      assignedTo: { $exists: true, $ne: null }
    }
  },
  // Stage 2: Agrupar por agente
  {
    $group: {
      _id: '$assignedTo',
      completadas: {
        $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
      },
      pendientes: {
        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
      },
      total: { $sum: 1 }
    }
  },
  // Stage 3: Ordenar por completadas
  {
    $sort: { completadas: -1 }
  },
  // Stage 4: Limitar a top 5
  {
    $limit: 5
  }
]);
```

**Índices Recomendados:**
```javascript
Tipificacion:
  - { createdAt: -1, assignedTo: 1, status: 1 }
  - { assignedTo: 1, status: 1 }
```

**Optimización:**
- Pipeline eficiente: filter → group → sort → limit
- Usa `$cond` para contar estados específicos
- Evita múltiples queries

---

### 3. Distribución por Nivel 1

**Aggregation con Condicional:**
```javascript
const distribucionNivel1Data = await Tipificacion.aggregate([
  // Filtrar tipificaciones completadas de hoy
  {
    $match: {
      createdAt: { $gte: hoy, $lte: hoyFin },
      status: 'success'
    }
  },
  // Agrupar con lógica condicional
  {
    $group: {
      _id: {
        $cond: [
          { $or: [
            { $eq: ['$nivel1', ''] },
            { $eq: ['$nivel1', null] }
          ]},
          'Sin categoría',
          '$nivel1'
        ]
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 8 }
]);
```

**Índices Recomendados:**
```javascript
Tipificacion:
  - { createdAt: -1, status: 1, nivel1: 1 }
  - { status: 1, nivel1: 1 }
```

**Lógica Especial:**
- Agrupa `nivel1` vacíos o null como "Sin categoría"
- Permite visualizar tipificaciones sin clasificar
- Top 8 categorías más frecuentes

---

### 4. Tipificaciones por Hora

**Loop Optimizado:**
```javascript
const tipificacionesPorHora = [];
for (let hora = 0; hora < 24; hora++) {
  const horaInicio = new Date(hoy);
  horaInicio.setHours(hora, 0, 0, 0);
  
  const horaFin = new Date(hoy);
  horaFin.setHours(hora, 59, 59, 999);
  
  const count = await Tipificacion.countDocuments({
    createdAt: { $gte: horaInicio, $lte: horaFin },
    status: 'success'
  });
  
  tipificacionesPorHora.push({ hora, count });
}
```

**Índice Recomendado:**
```javascript
Tipificacion:
  - { createdAt: -1, status: 1 }
```

**Optimización Posible:**
```javascript
// Alternativa con aggregation (más eficiente)
const tipificacionesPorHora = await Tipificacion.aggregate([
  {
    $match: {
      createdAt: { $gte: hoy, $lte: hoyFin },
      status: 'success'
    }
  },
  {
    $group: {
      _id: { $hour: '$createdAt' },
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
]);
```

---

## 📝 Guía de Uso

### Para Usuarios Finales

#### 1. Acceder al Dashboard

1. Iniciar sesión en el sistema
2. Navegar a **Dashboard** desde el menú lateral
3. El Dashboard carga automáticamente en 1-2 segundos
4. Las estadísticas se actualizan cada 30 segundos

#### 2. Interpretar las Métricas

**Cards Superiores:**
- **Verde ↑**: Mejora respecto al período anterior
- **Rojo ↓**: Disminución respecto al período anterior
- **Números grandes**: Valores actuales
- **Texto pequeño**: Contexto temporal

**Gráfica de Hora:**
- Picos altos: Horas con más actividad
- Valles: Horas con menos llamadas
- Útil para: Planificar turnos, identificar horas pico

**Gráfica de Distribución:**
- Segmentos grandes: Categorías más frecuentes
- Segmentos pequeños: Categorías menos usadas
- Útil para: Entender tipos de consultas, capacitación

**Top Agentes:**
- Ranking diario de productividad
- Efectividad = calidad del trabajo
- Útil para: Reconocimientos, identificar necesidades de apoyo

**Estados de Agentes:**
- Distribución actual del equipo
- Barras largas: Estados más comunes
- Útil para: Gestión de recursos, balanceo de carga

---

### Para Desarrolladores

#### 1. Agregar Nueva Métrica

**Paso 1: Backend - Calcular Dato**
```javascript
// En app.js, dentro del listener de estadísticas

// Calcular nueva métrica
const nuevaMetrica = await Modelo.find({...});

// Agregar al payload MQTT
mqttService.publish(`crm/estadisticas/respuesta/${userId}`, {
  // ... métricas existentes
  nuevaMetrica: nuevaMetrica
});
```

**Paso 2: Frontend - Recibir y Mostrar**
```javascript
// En Dashboard.vue

// Agregar variable en data()
data() {
  return {
    nuevaMetrica: null
  }
}

// Actualizar en actualizarEstadisticas()
actualizarEstadisticas(data) {
  this.nuevaMetrica = data.nuevaMetrica;
}

// Mostrar en template
<div>{{ nuevaMetrica }}</div>
```

---

#### 2. Modificar Intervalo de Actualización

**Cambiar de 30s a otro valor:**
```javascript
// En Dashboard.vue, método mounted()

// Cambiar 30000 (30s) por el valor deseado en milisegundos
this.statsInterval = setInterval(() => {
  this.cargarEstadisticasCRM();
}, 60000); // 60 segundos (1 minuto)
```

**Valores recomendados:**
- `10000` - 10 segundos (muy frecuente, mayor carga)
- `30000` - 30 segundos (balanceado, recomendado)
- `60000` - 60 segundos (menos carga, actualizaciones más lentas)
- `300000` - 5 minutos (datos casi estáticos)

---

#### 3. Agregar Nueva Gráfica

**Paso 1: Agregar Canvas en Template**
```html
<canvas id="mi-nueva-grafica" class="chart-canvas" height="300"></canvas>
```

**Paso 2: Agregar Variables en data()**
```javascript
data() {
  return {
    miNuevaGrafica: null,
    datosNuevaGrafica: []
  }
}
```

**Paso 3: Crear Método de Renderizado**
```javascript
renderMiNuevaGrafica() {
  const ctx = document.getElementById('mi-nueva-grafica');
  if (!ctx) return;
  
  if (this.miNuevaGrafica) {
    this.miNuevaGrafica.destroy();
  }
  
  this.miNuevaGrafica = new Chart(ctx, {
    type: 'bar', // o 'pie', 'line', 'radar', etc.
    data: {
      labels: this.datosNuevaGrafica.map(d => d.label),
      datasets: [{
        data: this.datosNuevaGrafica.map(d => d.value),
        backgroundColor: '#667eea'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
```

**Paso 4: Llamar en actualizarEstadisticas()**
```javascript
actualizarEstadisticas(data) {
  // ... otras actualizaciones
  this.datosNuevaGrafica = data.nuevaGrafica || [];
  this.renderMiNuevaGrafica();
}
```

---

## 🐛 Debugging y Troubleshooting

### Logs del Sistema

**Frontend (Browser Console):**
```javascript
'🚀 Dashboard mounted - Iniciando proceso automático...'
'🔄 PASO 4: Cargando estadísticas del CRM...'
'📡 Solicitud de estadísticas publicada'
'📊 Estadísticas CRM recibidas: {...}'
'📊 Distribución Nivel 1 recibida: [...]'
```

**Backend (Terminal):**
```javascript
'📊 MQTT: Solicitud de estadísticas para usuario: {userId}'
'📊 Estadísticas calculadas:'
'   - Agentes Conectados: X'
'   - Total Clientes: Y'
'   - Tipificaciones Hoy: Z'
'   - Distribución Nivel 1 detalle: [...]'
'📤 Mensaje MQTT publicado en crm/estadisticas/respuesta/{userId}'
```

---

### Problemas Comunes

#### 1. Gráficas No se Muestran

**Síntomas:**
- Canvas vacío
- Error en consola

**Causas Posibles:**
- Canvas ID incorrecto
- Chart.js no importado
- Datos vacíos sin validación

**Solución:**
```javascript
// Verificar que el ID coincide
const ctx = document.getElementById('chart-hora'); // ← Revisar ID

// Verificar que Chart está importado
import Chart from 'chart.js/auto';

// Validar datos antes de renderizar
if (!this.datosGrafica || this.datosGrafica.length === 0) {
  console.warn('No hay datos para renderizar');
  return;
}
```

---

#### 2. Datos No se Actualizan

**Síntomas:**
- Dashboard muestra siempre los mismos valores
- No hay actualizaciones automáticas

**Causas Posibles:**
- MQTT desconectado
- Intervalo no configurado
- Topic incorrecto

**Solución:**
```javascript
// Verificar conexión MQTT
console.log('MQTT conectado:', mqttService.isConnected);

// Verificar que el intervalo se creó
console.log('Intervalo activo:', !!this.statsInterval);

// Verificar topic correcto
console.log('Topic suscrito:', this.mqttTopic);
```

---

#### 3. "distribucionNivel1: []" Vacío

**Síntomas:**
- Gráfica de distribución vacía
- Backend log muestra 0 categorías

**Causas:**
- No hay tipificaciones completadas hoy
- Todas las tipificaciones tienen `status: 'pending'`
- Las tipificaciones no tienen `nivel1` (ahora se agrupan como "Sin categoría")

**Solución:**
```javascript
// Verificar que hay tipificaciones con status success
db.tipificaciones.find({
  createdAt: { $gte: ISODate("2025-09-30T00:00:00Z") },
  status: 'success'
}).count()

// Revisar distribución de nivel1
db.tipificaciones.aggregate([
  { $match: { status: 'success' } },
  { $group: { _id: '$nivel1', count: { $sum: 1 } } }
])
```

---

## 📈 Mejoras Futuras

### Corto Plazo

- [ ] Agregar filtro por rango de fechas
- [ ] Exportar dashboard a PDF
- [ ] Comparación con mes anterior
- [ ] Alertas cuando llamadas en cola > X
- [ ] Gráfica de tiempo promedio de atención

### Mediano Plazo

- [ ] Dashboard personalizable (drag & drop)
- [ ] Métricas por departamento/área
- [ ] Predicciones con ML
- [ ] Notificaciones push
- [ ] Dashboard móvil optimizado

### Largo Plazo

- [ ] BI completo con análisis avanzado
- [ ] Integración con otras plataformas
- [ ] Reportes automáticos por email
- [ ] KPIs personalizados
- [ ] Dashboards multi-tenant

---

## 🔗 Referencias

### Tecnologías Utilizadas

- [Vue.js 3](https://vuejs.org/)
- [Chart.js](https://www.chartjs.org/)
- [MQTT.js](https://github.com/mqttjs/MQTT.js)
- [MongoDB Aggregation](https://www.mongodb.com/docs/manual/aggregation/)
- [Bootstrap 5](https://getbootstrap.com/)

### Documentación Relacionada

- [CRM_PUBSUB_MQTT.md](./CRM_PUBSUB_MQTT.md) - Sistema CRM completo
- [MQTT_ARCHITECTURE.md](./MQTT_ARCHITECTURE.md) - Arquitectura MQTT
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Endpoints del sistema

---

**Última actualización:** 30 de Septiembre de 2025  
**Versión:** 1.0.0  
**Autor:** Sistema CRM MinisterioEducacion
