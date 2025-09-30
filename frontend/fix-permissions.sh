#!/bin/bash
echo "🔧 Verificando permisos de node_modules..."
if [ -d "node_modules" ]; then
    OWNER=$(ls -ld node_modules/ | awk '{print $3}')
    if [ "$OWNER" != "$(whoami)" ]; then
        echo "⚠️  node_modules pertenece a: $OWNER"
        echo "🔧 Corrigiendo permisos..."
        sudo chown -R $(whoami):$(whoami) node_modules/
        echo "✅ Permisos corregidos"
    else
        echo "✅ Permisos correctos: $(whoami)"
    fi
else
    echo "📁 node_modules no existe"
fi
