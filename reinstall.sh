#!/bin/bash

# Script para reinstalar la app en el iPhone con debugging

echo "🔧 Reinstalando IntuitJourney en iPhone..."
echo ""

# Limpiar Metro bundler cache
echo "🧹 Limpiando caché de Metro..."
npx expo start --clear

# Ejecutar en device
echo "📱 Instalando en iPhone..."
echo "⚠️  IMPORTANTE: Cuando se abra la app, da permisos de:"
echo "   - Micrófono"
echo "   - Reconocimiento de voz"
echo ""
echo "📋 Luego revisa los logs de Metro para ver los mensajes de debugging"
echo ""

# Ejecutar
npm run ios -- --device
