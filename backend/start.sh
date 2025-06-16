#!/bin/bash
# Production startup script

# Use PORT environment variable if available, default to 8000
PORT=${PORT:-8000}

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT