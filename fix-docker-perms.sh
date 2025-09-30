#!/bin/bash
echo "🐳 Corrigiendo permisos después de Docker..."

# Corregir permisos de frontend
if [ -d "frontend/node_modules" ]; then
    echo "🔧 Corrigiendo permisos de frontend/node_modules..."
    sudo chown -R crm:crm frontend/node_modules/
fi

# Corregir permisos de backend si existe
if [ -d "node_modules" ]; then
    echo "🔧 Corrigiendo permisos de backend/node_modules..."
    sudo chown -R crm:crm node_modules/
fi

# Corregir permisos de logs
if [ -d "logs" ]; then
    echo "🔧 Corrigiendo permisos de logs..."
    sudo chown -R crm:crm logs/
fi

echo "✅ Permisos corregidos"
