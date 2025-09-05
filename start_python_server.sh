#!/bin/bash

# Stop any existing Node.js processes
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "node.*express" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Start Python server
cd python_server
export NODE_ENV=development
export PORT=5000
echo "Starting Python FastAPI server on port 5000..."
python main.py