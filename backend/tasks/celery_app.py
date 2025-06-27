import os
from celery import Celery
from celery.schedules import crontab

# Initialize Celery app
celery_app = Celery(
    "operational_data_querying",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
    include=["tasks.report_tasks"]
)

# Configure Celery
celery_app.conf.update({
    "task_serializer": "json",
    "accept_content": ["json"],
    "result_serializer": "json",
    "timezone": "UTC",
    "enable_utc": True,
    "result_expires": 3600,
    "task_always_eager": False,  # Set to True for testing without Redis
})

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    # Run report scheduler every minute to check for due reports
    "check-scheduled-reports": {
        "task": "tasks.report_tasks.check_and_run_scheduled_reports",
        "schedule": crontab(minute="*"),  # Every minute
    },
    # Cleanup old executions daily at 2 AM
    "cleanup-old-executions": {
        "task": "tasks.report_tasks.cleanup_old_executions",
        "schedule": crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    # Health check every 15 minutes
    "health-check": {
        "task": "tasks.report_tasks.health_check",
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
    },
}

# Configure worker settings
celery_app.conf.worker_prefetch_multiplier = 1
celery_app.conf.worker_max_tasks_per_child = 1000 