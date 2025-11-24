#!/bin/bash
set -e

echo "🚀 Starting KIMO..."

# Tentar rodar migrations com timeout de 30 segundos
echo "📦 Running database migrations..."
timeout 30s npx prisma migrate deploy || {
  echo "⚠️  Migration timeout or failed, but continuing..."
  echo "💡 Migrations can be run manually later if needed"
}

# Iniciar aplicação
echo "✅ Starting application..."
node dist/index.js

