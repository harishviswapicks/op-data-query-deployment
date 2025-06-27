from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models import (
    ScheduledReport, ScheduleRequest, User, SlackWorkspaceRequest, 
    SlackWorkspace, ReportExecution, SlackReportRequest
)
from routers.auth import get_current_user
from database import (
    get_db, create_scheduled_report, get_scheduled_reports, 
    get_scheduled_report_by_id, update_scheduled_report,
    delete_scheduled_report, create_slack_workspace
)
from tasks.report_tasks import generate_single_report, force_run_report
from slack.service import slack_service

router = APIRouter()

@router.post("/reports", response_model=ScheduledReport)
async def create_scheduled_report_endpoint(
    request: ScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new scheduled report
    """
    try:
        # Calculate next run time
        next_run = _calculate_next_run(request.schedule)
        
        # Prepare report data
        report_data = {
            "id": str(uuid.uuid4()),
            "name": request.name,
            "description": request.description,
            "query": request.query,
            "schedule_config": request.schedule.dict(),
            "user_id": request.user_id,
            "next_run": next_run,
            "enabled": True
        }
        
        # Add Slack configuration if provided
        if request.slack_config:
            report_data.update({
                "notification_type": request.slack_config.notification_type,
                "slack_channel": request.slack_config.slack_channel,
                "slack_user_id": request.slack_config.slack_user_id
            })
        
        # Create the report
        db_report = create_scheduled_report(db, report_data)
        
        # Convert to response model
        response = ScheduledReport(
            id=db_report.id,
            name=db_report.name,
            description=db_report.description,
            query=db_report.query,
            schedule=request.schedule,
            user_id=db_report.user_id,
            created_at=db_report.created_at,
            last_run=db_report.last_run,
            next_run=db_report.next_run,
            slack_config=request.slack_config
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating scheduled report: {str(e)}")

@router.get("/reports", response_model=List[ScheduledReport])
async def get_scheduled_reports_endpoint(
    user_id: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get scheduled reports for a user
    """
    try:
        # Use current user's ID if not specified
        if not user_id:
            user_id = current_user.id
        
        # Get reports from database
        db_reports = get_scheduled_reports(db, user_id, active_only)
        
        # Convert to response models
        reports = []
        for db_report in db_reports:
            # Parse schedule config
            schedule_config = db_report.schedule_config
            
            # Parse Slack config
            slack_config = None
            if hasattr(db_report, 'notification_type') and db_report.notification_type != 'none':
                slack_config = {
                    "notification_type": db_report.notification_type,
                    "slack_channel": getattr(db_report, 'slack_channel', None),
                    "slack_user_id": getattr(db_report, 'slack_user_id', None)
                }
            
            report = ScheduledReport(
                id=db_report.id,
                name=db_report.name,
                description=db_report.description,
                query=db_report.query,
                schedule=schedule_config,
                user_id=db_report.user_id,
                created_at=db_report.created_at,
                last_run=db_report.last_run,
                next_run=db_report.next_run,
                slack_config=slack_config
            )
            reports.append(report)
        
        return reports
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving scheduled reports: {str(e)}")

@router.get("/reports/{report_id}", response_model=ScheduledReport)
async def get_scheduled_report(
    report_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get details of a specific scheduled report
    """
    # TODO: Return scheduled report details
    pass

@router.put("/reports/{report_id}", response_model=ScheduledReport)
async def update_scheduled_report(
    report_id: str,
    request: ScheduleRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Update a scheduled report
    """
    # TODO: Update scheduled report configuration
    pass

@router.delete("/reports/{report_id}")
async def delete_scheduled_report(
    report_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a scheduled report
    """
    # TODO: Delete scheduled report
    pass

@router.put("/reports/{report_id}/enable")
async def enable_scheduled_report(
    report_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Enable a scheduled report
    """
    # TODO: Enable scheduled report execution
    pass

@router.put("/reports/{report_id}/disable")
async def disable_scheduled_report(
    report_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Disable a scheduled report
    """
    # TODO: Disable scheduled report execution
    pass

@router.post("/reports/{report_id}/run")
async def run_report_now(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run a scheduled report immediately
    """
    try:
        # Verify report exists and user has access
        db_report = get_scheduled_report_by_id(db, report_id)
        if not db_report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if db_report.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Queue the report for immediate execution
        task = force_run_report.delay(report_id, current_user.id)
        
        return {
            "message": "Report queued for execution",
            "task_id": task.id,
            "report_id": report_id,
            "status": "queued"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running report: {str(e)}")

@router.get("/reports/{report_id}/history")
async def get_report_execution_history(
    report_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """
    Get execution history for a scheduled report
    """
    # TODO: Return report execution history
    pass

@router.get("/next-runs")
async def get_upcoming_report_runs(
    user_id: Optional[str] = None,
    hours: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get upcoming scheduled report runs
    """
    try:
        # Use current user's ID if not specified
        if not user_id:
            user_id = current_user.id
        
        # Calculate time window
        end_time = datetime.utcnow() + timedelta(hours=hours)
        
        # Get user's reports
        db_reports = get_scheduled_reports(db, user_id, enabled_only=True)
        
        # Filter reports that will run within the time window
        upcoming_runs = []
        for report in db_reports:
            if report.next_run <= end_time:
                upcoming_runs.append({
                    "report_id": report.id,
                    "report_name": report.name,
                    "next_run": report.next_run.isoformat(),
                    "user_id": report.user_id,
                    "schedule_frequency": report.schedule_config.get("frequency", "unknown")
                })
        
        # Sort by next run time
        upcoming_runs.sort(key=lambda x: x["next_run"])
        
        return {
            "upcoming_runs": upcoming_runs,
            "time_window_hours": hours,
            "total_upcoming": len(upcoming_runs)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving upcoming runs: {str(e)}")

# Slack Integration Endpoints

@router.post("/slack/workspace")
async def add_slack_workspace(
    request: SlackWorkspaceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a Slack workspace for report notifications
    """
    try:
        # Add the workspace using the service
        success = slack_service.add_workspace(
            request.team_id,
            request.team_name,
            request.bot_token,
            request.app_token,
            request.webhook_url
        )
        
        if success:
            return {"message": "Slack workspace added successfully", "team_id": request.team_id}
        else:
            raise HTTPException(status_code=400, detail="Failed to add Slack workspace")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding Slack workspace: {str(e)}")

@router.get("/slack/test/{team_id}")
async def test_slack_connection(
    team_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Test connection to a Slack workspace
    """
    try:
        success, message = slack_service.test_workspace_connection(team_id)
        
        return {
            "team_id": team_id,
            "connection_status": "success" if success else "failed",
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing Slack connection: {str(e)}")

# Helper functions

def _calculate_next_run(schedule_config) -> datetime:
    """Calculate the next run time based on schedule configuration."""
    current_time = datetime.utcnow()
    frequency = schedule_config.frequency
    
    if frequency == "daily":
        return current_time + timedelta(days=1)
    elif frequency == "weekly":
        return current_time + timedelta(weeks=1)
    elif frequency == "monthly":
        return current_time + timedelta(days=30)  # Simplified monthly calculation
    else:
        return current_time + timedelta(days=1)  # Default to daily
