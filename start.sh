#!/bin/bash
PORT=${1:-8000}
echo "🌞 Summer Goals server starting on http://localhost:$PORT"
echo "   Press Ctrl+C to stop"
echo ""
python3 -m http.server "$PORT"
