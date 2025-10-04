# 🌳 Administración del Árbol de Tipificación

## 📋 Descripción
El sistema permite administrar el árbol de tipificación mediante la subida de archivos JSON. El árbol define la estructura jerárquica de categorías para clasificar las llamadas del call center.

## 🚀 Endpoints Disponibles

### 1. **Obtener Árbol Actual**
```http
GET /api/tree
```
**Descripción:** Obtiene el árbol de tipificación actual desde la base de datos.

**Respuesta:**
```json
{
  "success": true,
  "tree": {
    "_id": "...",
    "name": "tipificaciones",
    "description": "...",
    "isActive": true,
    "root": [...],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 2. **Subir Archivo JSON del Árbol** ⭐
```http
POST /api/tree/upload
Content-Type: multipart/form-data
```
**Descripción:** Sube un archivo JSON con la estructura del árbol de tipificación.

**Parámetros:**
- `treeFile` (file): Archivo JSON con la estructura del árbol

**Requisitos:**
- Solo administradores pueden subir archivos
- Archivo debe ser JSON válido
- Tamaño máximo: 5MB
- Estructura debe ser un array de nodos raíz

**Respuesta:**
```json
{
  "success": true,
  "message": "Árbol de tipificación actualizado correctamente",
  "tree": {
    "_id": "...",
    "name": "tipificaciones",
    "description": "...",
    "nodeCount": 4,
    "uploadedBy": "Nombre del Admin",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. **Descargar Árbol Actual**
```http
GET /api/tree/download
```
**Descripción:** Descarga el árbol actual como archivo JSON.

**Requisitos:**
- Solo administradores pueden descargar

**Respuesta:** Archivo JSON descargable

### 4. **Inicializar Árbol por Defecto**
```http
POST /api/tree/initialize
```
**Descripción:** Crea un árbol básico por defecto si no existe ninguno.

**Requisitos:**
- Solo administradores

## 📁 Estructura del Archivo JSON

### Formato Requerido
El archivo JSON debe ser un **array de nodos raíz**:

```json
[
  {
    "value": "consulta",
    "label": "Consulta",
    "children": [
      {
        "value": "consulta_academica",
        "label": "Consulta Académica",
        "children": [
          {
            "value": "consulta_matricula",
            "label": "Consulta sobre Matrícula",
            "children": []
          }
        ]
      }
    ]
  }
]
```

### Estructura de Nodos
Cada nodo debe tener:
- `value` (string): Identificador único del nodo
- `label` (string): Etiqueta visible para el usuario
- `children` (array): Array de nodos hijos (opcional)

### Ejemplo Completo
Ver archivo: `ejemplo_arbol_tipificacion.json`

## 🔧 Cómo Usar

### 1. **Crear tu Archivo JSON**
1. Usa el archivo `ejemplo_arbol_tipificacion.json` como plantilla
2. Modifica la estructura según tus necesidades
3. Asegúrate de que cada nodo tenga `value` y `label`

### 2. **Subir el Archivo**
1. Accede como administrador al sistema
2. Usa una herramienta como Postman o curl:

```bash
curl -X POST http://localhost:3000/api/tree/upload \
  -H "Cookie: connect.sid=tu_session_cookie" \
  -F "treeFile=@mi_arbol.json"
```

### 3. **Verificar la Subida**
```bash
curl -X GET http://localhost:3000/api/tree \
  -H "Cookie: connect.sid=tu_session_cookie"
```

## 🔒 Seguridad

- **Autenticación:** Requiere sesión de usuario activa
- **Autorización:** Solo administradores pueden subir/descargar
- **Validación:** Estructura JSON validada antes de guardar
- **Límites:** Archivos máximo 5MB
- **Limpieza:** Archivos temporales se eliminan automáticamente

## 📊 Flujo del Sistema

1. **Subida:** Admin sube archivo JSON
2. **Validación:** Sistema valida estructura y formato
3. **Desactivación:** Árbol anterior se marca como inactivo
4. **Creación:** Nuevo árbol se guarda como activo
5. **Distribución:** Nuevo árbol se envía a agentes via MQTT
6. **Uso:** Agentes usan nueva estructura en tipificaciones

## 🚨 Notas Importantes

- **Backup:** Siempre haz backup del árbol antes de subir uno nuevo
- **Formato:** El archivo debe ser JSON válido, no JavaScript
- **Estructura:** Cada nodo debe tener `value` y `label` obligatorios
- **Jerarquía:** Los `children` son opcionales y pueden estar vacíos
- **Unicidad:** Los valores (`value`) deben ser únicos en todo el árbol

## 🔍 Troubleshooting

### Error: "No se proporcionó archivo"
- Asegúrate de enviar el archivo con el nombre `treeFile`

### Error: "El archivo no es un JSON válido"
- Verifica que el archivo sea JSON válido
- Usa un validador JSON online

### Error: "Estructura del árbol inválida"
- Cada nodo debe tener `value` y `label`
- Verifica que no haya nodos duplicados

### Error: "Acceso denegado"
- Asegúrate de estar logueado como administrador
- Verifica que tu sesión esté activa
