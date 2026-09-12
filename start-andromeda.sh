#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  ANDROMEDA OS — Local AI Operating System"
echo "  \"One Soul. Hundreds of Minds.\""
echo "========================================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js 18+ (e.g. sudo apt install nodejs npm or via nvm)"
    exit 1
fi

# Check for dependencies
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies..."
    npm install
fi

echo "[INFO] Initializing Andromeda Server on http://localhost:3000..."
npm run dev
