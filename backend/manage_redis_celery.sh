#!/bin/bash

# Redis and Celery Management Script
# This script helps manage Redis and Celery services for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to check if Redis is running
check_redis() {
    if redis-cli ping > /dev/null 2>&1; then
        print_status "Redis is running"
        return 0
    else
        print_error "Redis is not running"
        return 1
    fi
}

# Function to start Redis
start_redis() {
    print_header "Starting Redis Server"
    
    if check_redis; then
        print_warning "Redis is already running"
        return 0
    fi
    
    # Check if Redis is installed
    if ! command -v redis-server &> /dev/null; then
        print_error "Redis is not installed"
        echo "Install Redis:"
        echo "  macOS: brew install redis"
        echo "  Ubuntu: sudo apt-get install redis-server"
        echo "  CentOS/RHEL: sudo yum install redis"
        return 1
    fi
    
    print_status "Starting Redis server..."
    redis-server --daemonize yes
    sleep 2
    
    if check_redis; then
        print_status "Redis started successfully"
        return 0
    else
        print_error "Failed to start Redis"
        return 1
    fi
}

# Function to stop Redis
stop_redis() {
    print_header "Stopping Redis Server"
    
    if ! check_redis; then
        print_warning "Redis is not running"
        return 0
    fi
    
    print_status "Stopping Redis server..."
    redis-cli shutdown
    sleep 2
    
    if ! check_redis; then
        print_status "Redis stopped successfully"
        return 0
    else
        print_error "Failed to stop Redis"
        return 1
    fi
}

# Function to start Celery workers
start_celery() {
    print_header "Starting Celery Services"
    
    if ! check_redis; then
        print_error "Redis is not running. Please start Redis first."
        return 1
    fi
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_error "Virtual environment not found. Please create and activate venv first."
        return 1
    fi
    
    # Set environment variables
    export PYTHONPATH="${PYTHONPATH}:$(pwd)"
    
    print_status "Starting Celery worker..."
    source venv/bin/activate && celery -A tasks.celery_app worker --loglevel=info --concurrency=4 --detach
    
    print_status "Starting Celery beat scheduler..."
    source venv/bin/activate && celery -A tasks.celery_app beat --loglevel=info --detach
    
    print_status "Starting Celery Flower monitoring..."
    if source venv/bin/activate && celery flower --help > /dev/null 2>&1; then
        source venv/bin/activate && celery -A tasks.celery_app flower --port=5555 --detach
    else
        print_warning "Flower not available. Install with: pip install flower"
    fi
    
    sleep 3
    print_status "Celery services started successfully"
    print_status "Flower monitoring available at: http://localhost:5555"
}

# Function to stop Celery workers
stop_celery() {
    print_header "Stopping Celery Services"
    
    print_status "Stopping Celery workers..."
    pkill -f "celery.*worker" || print_warning "No Celery workers found"
    
    print_status "Stopping Celery beat scheduler..."
    pkill -f "celery.*beat" || print_warning "No Celery beat scheduler found"
    
    print_status "Stopping Celery Flower..."
    pkill -f "celery.*flower" || print_warning "No Celery Flower found"
    
    print_status "Celery services stopped"
}

# Function to check status
status() {
    print_header "Service Status"
    
    # Check Redis
    if check_redis; then
        print_status "✅ Redis: Running"
    else
        print_error "❌ Redis: Not Running"
    fi
    
    # Check Celery worker
    if pgrep -f "celery.*worker" > /dev/null; then
        print_status "✅ Celery Worker: Running"
    else
        print_error "❌ Celery Worker: Not Running"
    fi
    
    # Check Celery beat
    if pgrep -f "celery.*beat" > /dev/null; then
        print_status "✅ Celery Beat: Running"
    else
        print_error "❌ Celery Beat: Not Running"
    fi
    
    # Check Celery flower
    if pgrep -f "celery.*flower" > /dev/null; then
        print_status "✅ Celery Flower: Running (http://localhost:5555)"
    else
        print_error "❌ Celery Flower: Not Running"
    fi
}

# Function to test setup
test_setup() {
    print_header "Testing Redis and Celery Setup"
    
    if [ -f "redis_setup.py" ]; then
        python3 redis_setup.py
    else
        print_error "redis_setup.py not found"
        return 1
    fi
}

# Function to show logs
show_logs() {
    print_header "Showing Celery Logs"
    
    if [ -f "celery.log" ]; then
        tail -f celery.log
    else
        print_warning "No celery.log file found"
        print_status "Celery logs might be in system logs or stdout"
    fi
}

# Function to clean up
cleanup() {
    print_header "Cleaning Up Redis and Celery"
    
    stop_celery
    stop_redis
    
    # Clean up log files
    rm -f celery.log celerybeat.pid
    
    print_status "Cleanup completed"
}

# Function to show help
show_help() {
    echo "Redis and Celery Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start-redis     Start Redis server"
    echo "  stop-redis      Stop Redis server"
    echo "  start-celery    Start Celery worker, beat, and flower"
    echo "  stop-celery     Stop all Celery services"
    echo "  start-all       Start Redis and Celery services"
    echo "  stop-all        Stop all services"
    echo "  status          Show status of all services"
    echo "  test            Run Redis and Celery tests"
    echo "  logs            Show Celery logs"
    echo "  cleanup         Stop all services and clean up"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start-all     # Start everything"
    echo "  $0 status        # Check what's running"
    echo "  $0 stop-all      # Stop everything"
}

# Main script logic
case "${1:-help}" in
    "start-redis")
        start_redis
        ;;
    "stop-redis")
        stop_redis
        ;;
    "start-celery")
        start_celery
        ;;
    "stop-celery")
        stop_celery
        ;;
    "start-all")
        start_redis && start_celery
        ;;
    "stop-all")
        stop_celery && stop_redis
        ;;
    "status")
        status
        ;;
    "test")
        test_setup
        ;;
    "logs")
        show_logs
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac 