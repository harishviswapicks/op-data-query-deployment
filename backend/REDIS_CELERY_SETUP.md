# Redis and Celery Setup Guide

This guide covers the setup and configuration of Redis and Celery for the Operational Data Querying platform.

## Overview

Our platform uses:
- **Redis** as a message broker and result backend for Celery
- **Celery** for asynchronous task processing (report generation, scheduling, etc.)
- **Celery Beat** for periodic task scheduling
- **Flower** for Celery monitoring

## Quick Start

### 1. Install Redis

**macOS (with Homebrew):**
```bash
brew install redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
```

**CentOS/RHEL:**
```bash
sudo yum install redis
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Start All Services

```bash
# Using our management script
./manage_redis_celery.sh start-all

# Or manually
redis-server --daemonize yes
./start_celery.sh
```

### 4. Test the Setup

```bash
# Test Redis and Celery connections
python3 redis_setup.py

# Or using the management script
./manage_redis_celery.sh test
```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
CELERY_WORKER_CONCURRENCY=4
```

### Celery Configuration

The Celery app is configured in `tasks/celery_app.py` with:

- **Broker**: Redis for message queuing
- **Backend**: Redis for result storage
- **Serialization**: JSON format
- **Timezone**: UTC
- **Worker Settings**: Optimized for report generation

### Scheduled Tasks

Our platform includes these scheduled tasks:

| Task | Schedule | Purpose |
|------|----------|---------|
| `check-scheduled-reports` | Every minute | Check and execute due reports |
| `cleanup-old-executions` | Daily at 2 AM | Clean up old report executions |
| `health-check` | Every 15 minutes | Monitor system health |

## Management Scripts

### Using the Management Script

```bash
# Start everything
./manage_redis_celery.sh start-all

# Check status
./manage_redis_celery.sh status

# Stop everything
./manage_redis_celery.sh stop-all

# Run tests
./manage_redis_celery.sh test

# View help
./manage_redis_celery.sh help
```

### Manual Commands

```bash
# Start Redis
redis-server --daemonize yes

# Start Celery worker
celery -A tasks.celery_app worker --loglevel=info --concurrency=4

# Start Celery beat scheduler
celery -A tasks.celery_app beat --loglevel=info

# Start Flower monitoring
celery -A tasks.celery_app flower --port=5555
```

## Docker Setup

### Using Docker Compose

```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The `docker-compose.yml` includes:
- Redis server with persistence
- Celery worker with health checks
- Celery beat scheduler
- Flower monitoring interface

## Monitoring

### Flower Dashboard

Access the Celery monitoring dashboard at:
- **URL**: http://localhost:5555
- **Features**: Task monitoring, worker stats, broker info

### Redis Monitoring

```bash
# Connect to Redis CLI
redis-cli

# Monitor Redis commands in real-time
redis-cli monitor

# Get Redis info
redis-cli info

# Check Redis memory usage
redis-cli info memory
```

### Health Checks

The platform includes built-in health checks:

```python
# Manual health check
from tasks.report_tasks import health_check
result = health_check.delay()
print(result.get())
```

## Troubleshooting

### Common Issues

**1. Redis Connection Refused**
```bash
# Check if Redis is running
redis-cli ping

# Start Redis if not running
redis-server --daemonize yes
```

**2. Celery Worker Not Starting**
```bash
# Check for errors
celery -A tasks.celery_app worker --loglevel=debug

# Check Redis connection
python3 redis_setup.py
```

**3. Tasks Not Executing**
```bash
# Check active workers
celery -A tasks.celery_app inspect active

# Check scheduled tasks
celery -A tasks.celery_app inspect scheduled
```

**4. Memory Issues**
```bash
# Check Redis memory usage
redis-cli info memory

# Clear Redis data (careful!)
redis-cli flushall
```

### Logs and Debugging

**View Celery Logs:**
```bash
# If using log files
tail -f celery.log

# Or check system logs
journalctl -u celery-worker -f
```

**Debug Mode:**
```bash
# Start worker in debug mode
celery -A tasks.celery_app worker --loglevel=debug

# Run tasks synchronously for testing
# Set CELERY_TASK_ALWAYS_EAGER=True in settings
```

## Performance Tuning

### Redis Configuration

For production, consider these Redis settings in `redis.conf`:

```
# Memory management
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Network
tcp-keepalive 300
timeout 0
```

### Celery Configuration

Tune Celery settings based on your workload:

```python
# In celery_app.py
celery_app.conf.update({
    'worker_concurrency': 4,  # Adjust based on CPU cores
    'worker_prefetch_multiplier': 1,  # Reduce for long-running tasks
    'task_soft_time_limit': 300,  # 5 minutes
    'task_time_limit': 600,  # 10 minutes
    'worker_max_tasks_per_child': 1000,  # Restart workers periodically
})
```

## Security Considerations

### Redis Security

```bash
# Bind Redis to localhost only
redis-server --bind 127.0.0.1

# Use password authentication
redis-server --requirepass your_password
```

### Network Security

- Use Redis AUTH for password protection
- Bind Redis to specific interfaces
- Use SSL/TLS for production deployments
- Implement proper firewall rules

## Integration with Main Application

### FastAPI Integration

The Celery tasks are integrated with the FastAPI application:

```python
# In routers/scheduling.py
from tasks.report_tasks import generate_single_report

@router.post("/reports/{report_id}/generate")
async def trigger_report_generation(report_id: str):
    task = generate_single_report.delay(report_id, user_id)
    return {"task_id": task.id, "status": "queued"}
```

### Task Results

```python
# Check task status
from tasks.celery_app import celery_app

result = celery_app.AsyncResult(task_id)
print(f"Status: {result.status}")
print(f"Result: {result.result}")
```

## Next Steps

After setting up Redis and Celery:

1. **Test the setup**: Run `python3 redis_setup.py`
2. **Start services**: Use `./manage_redis_celery.sh start-all`
3. **Monitor**: Check Flower dashboard at http://localhost:5555
4. **Configure BigQuery**: Set up BigQuery authentication
5. **Configure Slack**: Set up Slack app integration

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs for error messages
3. Test individual components with the provided scripts
4. Ensure all dependencies are installed correctly 