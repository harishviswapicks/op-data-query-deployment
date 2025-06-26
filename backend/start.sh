#!/bin/bash

# Default to port 8000 if PORT is not set
PORT=${PORT:-8000}

echo "Starting application on port: $PORT"

# Start uvicorn with the correct port
exec uvicorn main:app --host 0.0.0.0 --port $PORT 