import os
import logging
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import uuid

from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from sqlalchemy.orm import Session

from database import (
    get_db, create_slack_workspace, get_slack_workspace_by_team_id,
    get_active_slack_workspaces, create_report_execution, update_report_execution
)
from models import SlackWorkspace, ReportExecution

logger = logging.getLogger(__name__)

class SlackService:
    """Service for handling Slack integrations and automated report delivery."""
    
    def __init__(self):
        self.clients: Dict[str, WebClient] = {}
        self._load_workspace_clients()
    
    def _load_workspace_clients(self):
        """Load Slack clients for all active workspaces."""
        try:
            db = next(get_db())
            workspaces = get_active_slack_workspaces(db)
            
            for workspace in workspaces:
                self.clients[workspace.team_id] = WebClient(token=workspace.bot_token)
            
            db.close()
            logger.info(f"Loaded {len(self.clients)} Slack workspace clients")
        except Exception as e:
            logger.error(f"Error loading Slack workspace clients: {e}")
    
    def add_workspace(self, team_id: str, team_name: str, bot_token: str, 
                      app_token: str = None, webhook_url: str = None) -> bool:
        """Add a new Slack workspace configuration."""
        try:
            # Test the bot token
            client = WebClient(token=bot_token)
            auth_response = client.auth_test()
            
            if not auth_response["ok"]:
                logger.error(f"Invalid bot token for team {team_id}")
                return False
            
            # Save to database
            db = next(get_db())
            workspace_data = {
                "id": str(uuid.uuid4()),
                "team_id": team_id,
                "team_name": team_name,
                "bot_token": bot_token,
                "app_token": app_token,
                "webhook_url": webhook_url
            }
            
            create_slack_workspace(db, workspace_data)
            db.close()
            
            # Add to active clients
            self.clients[team_id] = client
            
            logger.info(f"Successfully added Slack workspace: {team_name} ({team_id})")
            return True
            
        except Exception as e:
            logger.error(f"Error adding Slack workspace: {e}")
            return False
    
    def get_client(self, team_id: str) -> Optional[WebClient]:
        """Get Slack client for a specific team."""
        return self.clients.get(team_id)
    
    def send_report_to_channel(self, team_id: str, channel: str, report_data: Dict[str, Any], 
                              execution_id: str) -> Optional[str]:
        """Send a formatted report to a Slack channel."""
        try:
            client = self.get_client(team_id)
            if not client:
                logger.error(f"No Slack client found for team {team_id}")
                return None
            
            # Format the report message
            message_blocks = self._format_report_message(report_data)
            
            # Send the message
            response = client.chat_postMessage(
                channel=channel,
                blocks=message_blocks,
                text=f"📊 Report: {report_data.get('name', 'Scheduled Report')}"
            )
            
            if response["ok"]:
                # Update execution record with Slack message timestamp
                db = next(get_db())
                update_report_execution(db, execution_id, {
                    "slack_message_ts": response["ts"]
                })
                db.close()
                
                logger.info(f"Successfully sent report to channel {channel}")
                return response["ts"]
            else:
                logger.error(f"Failed to send message to channel: {response.get('error')}")
                return None
                
        except SlackApiError as e:
            logger.error(f"Slack API error: {e.response['error']}")
            return None
        except Exception as e:
            logger.error(f"Error sending report to channel: {e}")
            return None
    
    def send_report_dm(self, team_id: str, user_id: str, report_data: Dict[str, Any], 
                       execution_id: str) -> Optional[str]:
        """Send a formatted report as a direct message."""
        try:
            client = self.get_client(team_id)
            if not client:
                logger.error(f"No Slack client found for team {team_id}")
                return None
            
            # Open DM conversation
            dm_response = client.conversations_open(users=user_id)
            if not dm_response["ok"]:
                logger.error(f"Failed to open DM with user {user_id}")
                return None
            
            channel_id = dm_response["channel"]["id"]
            
            # Format the report message
            message_blocks = self._format_report_message(report_data)
            
            # Send the message
            response = client.chat_postMessage(
                channel=channel_id,
                blocks=message_blocks,
                text=f"📊 Your scheduled report: {report_data.get('name', 'Report')}"
            )
            
            if response["ok"]:
                # Update execution record
                db = next(get_db())
                update_report_execution(db, execution_id, {
                    "slack_message_ts": response["ts"]
                })
                db.close()
                
                logger.info(f"Successfully sent report DM to user {user_id}")
                return response["ts"]
            else:
                logger.error(f"Failed to send DM: {response.get('error')}")
                return None
                
        except SlackApiError as e:
            logger.error(f"Slack API error: {e.response['error']}")
            return None
        except Exception as e:
            logger.error(f"Error sending report DM: {e}")
            return None
    
    def update_report_message(self, team_id: str, channel: str, message_ts: str, 
                             report_data: Dict[str, Any]) -> bool:
        """Update an existing report message with new data."""
        try:
            client = self.get_client(team_id)
            if not client:
                return False
            
            message_blocks = self._format_report_message(report_data)
            
            response = client.chat_update(
                channel=channel,
                ts=message_ts,
                blocks=message_blocks,
                text=f"📊 Report: {report_data.get('name', 'Updated Report')}"
            )
            
            return response["ok"]
            
        except Exception as e:
            logger.error(f"Error updating report message: {e}")
            return False
    
    def _format_report_message(self, report_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Format report data into Slack message blocks."""
        blocks = []
        
        # Header block
        blocks.append({
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"📊 {report_data.get('name', 'Scheduled Report')}"
            }
        })
        
        # Report info section
        info_fields = []
        
        if report_data.get('description'):
            info_fields.append({
                "type": "mrkdwn",
                "text": f"*Description:*\n{report_data['description']}"
            })
        
        if report_data.get('execution_time'):
            info_fields.append({
                "type": "mrkdwn",
                "text": f"*Generated:*\n{report_data['execution_time']}"
            })
        
        if report_data.get('query'):
            info_fields.append({
                "type": "mrkdwn",
                "text": f"*Query:*\n```{report_data['query'][:200]}{'...' if len(report_data['query']) > 200 else ''}```"
            })
        
        if info_fields:
            blocks.append({
                "type": "section",
                "fields": info_fields
            })
        
        # Results section
        if report_data.get('results'):
            results = report_data['results']
            
            if isinstance(results, dict):
                # Handle structured results
                if results.get('summary'):
                    blocks.append({
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Summary:*\n{results['summary']}"
                        }
                    })
                
                if results.get('key_metrics'):
                    metrics_text = "\n".join([
                        f"• *{metric['name']}:* {metric['value']}"
                        for metric in results['key_metrics']
                    ])
                    blocks.append({
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Key Metrics:*\n{metrics_text}"
                        }
                    })
                
                if results.get('data_table'):
                    # Format table data
                    table_text = self._format_table_for_slack(results['data_table'])
                    blocks.append({
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Data:*\n```{table_text}```"
                        }
                    })
            
            elif isinstance(results, str):
                # Handle text results
                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Results:*\n{results}"
                    }
                })
        
        # Add footer with timestamp
        blocks.append({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"Generated on {datetime.utcnow().strftime('%Y-%m-%d at %H:%M UTC')}"
                }
            ]
        })
        
        return blocks
    
    def _format_table_for_slack(self, table_data: List[Dict[str, Any]], max_rows: int = 10) -> str:
        """Format table data for display in Slack."""
        if not table_data:
            return "No data available"
        
        # Get column headers
        headers = list(table_data[0].keys()) if table_data else []
        
        # Create table string
        table_lines = []
        
        # Header row
        header_line = " | ".join(headers)
        table_lines.append(header_line)
        table_lines.append("-" * len(header_line))
        
        # Data rows (limited to max_rows)
        for i, row in enumerate(table_data[:max_rows]):
            row_line = " | ".join(str(row.get(col, "")) for col in headers)
            table_lines.append(row_line)
        
        if len(table_data) > max_rows:
            table_lines.append(f"... and {len(table_data) - max_rows} more rows")
        
        return "\n".join(table_lines)
    
    def send_error_notification(self, team_id: str, channel: str, error_message: str, 
                               report_name: str) -> bool:
        """Send an error notification to Slack."""
        try:
            client = self.get_client(team_id)
            if not client:
                return False
            
            blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "❌ Report Generation Failed"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Report:* {report_name}\n*Error:* {error_message}\n*Time:* {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
                    }
                }
            ]
            
            response = client.chat_postMessage(
                channel=channel,
                blocks=blocks,
                text=f"Report generation failed: {report_name}"
            )
            
            return response["ok"]
            
        except Exception as e:
            logger.error(f"Error sending error notification: {e}")
            return False
    
    def test_workspace_connection(self, team_id: str) -> Tuple[bool, str]:
        """Test connection to a Slack workspace."""
        try:
            client = self.get_client(team_id)
            if not client:
                return False, "No client found for team"
            
            response = client.auth_test()
            if response["ok"]:
                return True, f"Connected as {response['user']} in {response['team']}"
            else:
                return False, response.get("error", "Unknown error")
                
        except Exception as e:
            return False, str(e)

# Global Slack service instance
slack_service = SlackService() 