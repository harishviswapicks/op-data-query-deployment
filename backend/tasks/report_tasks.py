import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from celery import current_task
from sqlalchemy.orm import Session

from tasks.celery_app import celery_app
from services.report_generator import report_generator
from database import (
    get_db, get_reports_due_for_execution, 
    ReportExecutionDB, ScheduledReportDB
)

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name="tasks.report_tasks.generate_single_report")
def generate_single_report(self, report_id: str, user_id: str, force_run: bool = False) -> Dict[str, Any]:
    """
    Celery task to generate a single report.
    """
    try:
        logger.info(f"Starting report generation task for report {report_id}")
        
        # Update task state
        self.update_state(
            state="PROGRESS",
            meta={"status": "Starting report generation", "progress": 0}
        )
        
        # Generate the report
        result = report_generator.generate_report(report_id, user_id, force_run)
        
        # Update task state based on result
        if result["status"] == "completed":
            self.update_state(
                state="SUCCESS",
                meta={
                    "status": "Report generated successfully",
                    "progress": 100,
                    "execution_id": result["execution_id"],
                    "slack_sent": result.get("slack_sent", False)
                }
            )
        elif result["status"] == "failed":
            self.update_state(
                state="FAILURE",
                meta={
                    "status": "Report generation failed",
                    "error": result.get("error", "Unknown error"),
                    "execution_id": result["execution_id"]
                }
            )
        
        logger.info(f"Report generation task completed for report {report_id}: {result['status']}")
        return result
        
    except Exception as e:
        logger.error(f"Error in report generation task: {e}")
        self.update_state(
            state="FAILURE",
            meta={"status": "Task failed", "error": str(e)}
        )
        raise

@celery_app.task(name="tasks.report_tasks.check_and_run_scheduled_reports")
def check_and_run_scheduled_reports() -> Dict[str, Any]:
    """
    Celery task that runs every minute to check for due reports and execute them.
    """
    try:
        logger.info("Checking for scheduled reports due for execution")
        
        # Get all reports due for execution
        db = next(get_db())
        due_reports = get_reports_due_for_execution(db)
        db.close()
        
        if not due_reports:
            logger.info("No reports due for execution")
            return {"status": "no_reports", "message": "No reports due for execution"}
        
        logger.info(f"Found {len(due_reports)} reports due for execution")
        
        # Queue each report for execution
        queued_tasks = []
        for report in due_reports:
            try:
                # Queue the report generation task
                task = generate_single_report.delay(report.id, report.user_id)
                queued_tasks.append({
                    "report_id": report.id,
                    "report_name": report.name,
                    "task_id": task.id,
                    "user_id": report.user_id
                })
                logger.info(f"Queued report {report.name} (ID: {report.id}) with task ID: {task.id}")
                
            except Exception as e:
                logger.error(f"Error queuing report {report.id}: {e}")
        
        return {
            "status": "success",
            "reports_found": len(due_reports),
            "tasks_queued": len(queued_tasks),
            "queued_tasks": queued_tasks
        }
        
    except Exception as e:
        logger.error(f"Error in scheduled report check task: {e}")
        return {"status": "error", "error": str(e)}

@celery_app.task(name="tasks.report_tasks.cleanup_old_executions")
def cleanup_old_executions(days_to_keep: int = 30) -> Dict[str, Any]:
    """
    Celery task to cleanup old report executions.
    """
    try:
        logger.info(f"Cleaning up report executions older than {days_to_keep} days")
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        db = next(get_db())
        
        # Delete old executions
        deleted_count = db.query(ReportExecutionDB).filter(
            ReportExecutionDB.started_at < cutoff_date
        ).delete()
        
        db.commit()
        db.close()
        
        logger.info(f"Cleaned up {deleted_count} old report executions")
        
        return {
            "status": "success",
            "deleted_count": deleted_count,
            "cutoff_date": cutoff_date.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in cleanup task: {e}")
        return {"status": "error", "error": str(e)}

@celery_app.task(name="tasks.report_tasks.health_check")
def health_check() -> Dict[str, Any]:
    """
    Celery task for health monitoring.
    """
    try:
        # Check database connectivity
        db = next(get_db())
        
        # Count active reports
        active_reports = db.query(ScheduledReportDB).filter(
            ScheduledReportDB.enabled == True
        ).count()
        
        # Count recent executions (last 24 hours)
        recent_cutoff = datetime.utcnow() - timedelta(hours=24)
        recent_executions = db.query(ReportExecutionDB).filter(
            ReportExecutionDB.started_at >= recent_cutoff
        ).count()
        
        db.close()
        
        # Check Celery worker status
        inspect = celery_app.control.inspect()
        active_tasks = inspect.active()
        
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "active_reports": active_reports,
            "recent_executions_24h": recent_executions,
            "active_celery_tasks": len(active_tasks) if active_tasks else 0,
            "celery_workers": list(active_tasks.keys()) if active_tasks else []
        }
        
        logger.info(f"Health check completed: {health_status}")
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

@celery_app.task(name="tasks.report_tasks.test_slack_integration")
def test_slack_integration(team_id: str) -> Dict[str, Any]:
    """
    Celery task to test Slack integration.
    """
    try:
        from slack.service import slack_service
        
        success, message = slack_service.test_workspace_connection(team_id)
        
        return {
            "status": "success" if success else "failed",
            "team_id": team_id,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error testing Slack integration: {e}")
        return {
            "status": "error",
            "team_id": team_id,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@celery_app.task(name="tasks.report_tasks.force_run_report")
def force_run_report(report_id: str, user_id: str) -> Dict[str, Any]:
    """
    Celery task to force run a report immediately.
    """
    try:
        logger.info(f"Force running report {report_id} for user {user_id}")
        
        result = report_generator.generate_report(report_id, user_id, force_run=True)
        
        logger.info(f"Force run completed for report {report_id}: {result['status']}")
        return result
        
    except Exception as e:
        logger.error(f"Error in force run task: {e}")
        return {"status": "error", "error": str(e)}

@celery_app.task(name="tasks.report_tasks.bulk_report_generation")
def bulk_report_generation(report_ids: list, user_id: str) -> Dict[str, Any]:
    """
    Celery task to generate multiple reports in bulk.
    """
    try:
        logger.info(f"Starting bulk report generation for {len(report_ids)} reports")
        
        results = {
            "total": len(report_ids),
            "completed": [],
            "failed": [],
            "skipped": []
        }
        
        for i, report_id in enumerate(report_ids):
            try:
                # Update progress
                current_task.update_state(
                    state="PROGRESS",
                    meta={
                        "status": f"Processing report {i+1} of {len(report_ids)}",
                        "progress": int((i / len(report_ids)) * 100)
                    }
                )
                
                result = report_generator.generate_report(report_id, user_id, force_run=True)
                
                if result["status"] == "completed":
                    results["completed"].append({
                        "report_id": report_id,
                        "execution_id": result["execution_id"]
                    })
                elif result["status"] == "failed":
                    results["failed"].append({
                        "report_id": report_id,
                        "error": result.get("error", "Unknown error")
                    })
                else:
                    results["skipped"].append({
                        "report_id": report_id,
                        "reason": result.get("message", "Unknown reason")
                    })
                    
            except Exception as e:
                results["failed"].append({
                    "report_id": report_id,
                    "error": str(e)
                })
        
        # Final update
        current_task.update_state(
            state="SUCCESS",
            meta={
                "status": "Bulk generation completed",
                "progress": 100,
                "results": results
            }
        )
        
        logger.info(f"Bulk report generation completed: {results}")
        return results
        
    except Exception as e:
        logger.error(f"Error in bulk report generation: {e}")
        current_task.update_state(
            state="FAILURE",
            meta={"status": "Bulk generation failed", "error": str(e)}
        )
        raise 