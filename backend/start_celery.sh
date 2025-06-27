#!/bin/bash

# Start Celery worker and beat scheduler for automated report generation
# This script should be run in the backend directory

echo "Starting Celery services for automated report generation..."

# Set environment variables
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Function to clean up processes on exit
cleanup() {
    echo "Stopping Celery services..."
    pkill -f "celery.*worker"
    pkill -f "celery.*beat"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Celery worker in background
echo "Starting Celery worker..."
celery -A tasks.celery_app worker --loglevel=info --concurrency=4 &
WORKER_PID=$!

# Wait a moment for worker to start
sleep 3

# Start Celery beat scheduler in background
echo "Starting Celery beat scheduler..."
celery -A tasks.celery_app beat --loglevel=info &
BEAT_PID=$!

echo "Celery services started successfully!"
echo "Worker PID: $WORKER_PID"
echo "Beat PID: $BEAT_PID"
echo ""
echo "The following scheduled tasks are running:"
echo "  - check-scheduled-reports: Every minute"
echo "  - cleanup-old-executions: Daily at 2 AM UTC"
echo "  - health-check: Every 15 minutes"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes to finish
wait $WORKER_PID $BEAT_PID 