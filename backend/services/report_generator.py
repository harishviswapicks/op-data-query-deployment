import logging
import json
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from ai.service import AIService
from slack.service import SlackService
from database import (
    get_db, get_scheduled_report_by_id, get_user_by_id, create_report_execution,
    update_report_execution, update_scheduled_report, get_reports_due_for_execution
)
from models import User, AgentMode, ScheduledReport

# Add NBA-agent-pattern imports
from google.cloud import bigquery
from tabulate import tabulate

logger = logging.getLogger(__name__)

class PrizePicksReportTools:
    """BigQuery tools for PrizePicks analytics - NBA agent pattern"""
    
    def __init__(self):
        self.project_id = "prizepicksanalytics"
        try:
            self.client = bigquery.Client(project=self.project_id)
            logger.info(f"Connected to BigQuery project: {self.project_id}")
        except Exception as e:
            logger.warning(f"BigQuery connection failed: {e}")
            self.client = None
    
    def query_data(self, sql_query: str) -> str:
        """Execute BigQuery query - NBA agent pattern"""
        try:
            if not self.client:
                return self._mock_query_result(sql_query)
            
            query_job = self.client.query(sql_query)
            results = query_job.result()
            
            rows = []
            headers = []
            
            for i, row in enumerate(results):
                if i == 0:
                    headers = list(row.keys())
                rows.append(list(row.values()))
            
            if not rows:
                return "No results found for the query."
            
            table_str = tabulate(rows, headers=headers, tablefmt="grid")
            return f"Found {len(rows)} results:\n{table_str}"
            
        except Exception as e:
            logger.error(f"BigQuery query error: {e}")
            return f"Error executing query: {str(e)}"
    
    def _mock_query_result(self, sql_query: str) -> str:
        """Mock data for testing"""
        from datetime import datetime, timedelta
        
        today = datetime.now()
        yesterday = today - timedelta(days=1)
        
        # Generate different mock data based on query type
        if "revenue" in sql_query.lower():
            mock_data = [
                ["Total Revenue", 125000.50, 2800, 44.64],
                ["Yesterday", 118750.25, 2650, 44.81],
                ["7-Day Avg", 121500.00, 2725, 44.59],
            ]
            headers = ["Metric", "Revenue", "Transactions", "Avg_Value"]
        elif "user" in sql_query.lower():
            mock_data = [
                ["Active Users", 15420],
                ["New Users", 1240],
                ["Returning Users", 14180],
            ]
            headers = ["User_Type", "Count"]
        elif "pick" in sql_query.lower():
            mock_data = [
                ["NBA", 8450, 0.647],
                ["NFL", 6230, 0.623],
                ["MLB", 4120, 0.671],
            ]
            headers = ["Sport", "Pick_Count", "Success_Rate"]
        else:
            mock_data = [
                ["Sample", yesterday.strftime("%Y-%m-%d"), 125000.50],
            ]
            headers = ["Type", "Date", "Value"]
        
        table_str = tabulate(mock_data, headers=headers, tablefmt="grid")
        return f"MOCK DATA - {table_str}\n🔧 Connect BigQuery for real data"

# Initialize global tools instance
prizepicks_tools = PrizePicksReportTools()

class ReportGenerationService:
    """Enhanced report generation using NBA agent pattern"""
    
    def __init__(self):
        self.ai_service = AIService()
        self.slack_service = SlackService()
        
        # Add PrizePicks tools
        self.tools = prizepicks_tools
        
    def create_specialized_agent(self, user_role: str, agent_mode: str) -> Agent:
        """Create specialized agent with PrizePicks BigQuery tools - NBA pattern"""
        
        if agent_mode == "quick":
            model = "gemini-1.5-flash"
            system_instruction = f"""
            Date: {datetime.now().strftime("%Y-%m-%d")}
            
            You are a PrizePicks Analytics Expert generating quick daily reports.
            
            Create concise, actionable reports with:
            1. **📊 Key Metrics Summary**
            2. **💰 Revenue Highlights**
            3. **👥 User Activity**
            4. **🎯 Top Insights**
            5. **🔧 Quick Recommendations**
            
            PROJECT: prizepicksanalytics
            Always use SELECT statements only.
            Format numbers with commas and currency symbols.
            Keep responses focused and under 500 words.
            """
        else:  # deep mode
            model = "gemini-2.0-flash-exp"
            system_instruction = f"""
            Date: {datetime.now().strftime("%Y-%m-%d")}
            
            You are a PrizePicks Senior Analytics Expert creating comprehensive reports.
            
            Generate detailed executive-ready reports with:
            1. **📊 Executive Summary**
            2. **💰 Revenue Analysis & Trends**
            3. **👥 User Engagement & Growth**
            4. **🎯 Pick Performance by Sport**
            5. **📈 Market Insights & Patterns**
            6. **🔧 Strategic Recommendations**
            7. **📝 SQL Queries Used**
            
            PROJECT: prizepicksanalytics
            Provide deep analysis with statistical insights.
            Always include comparison to previous periods.
            Make recommendations actionable for executives.
            """
        
        agent = Agent(
            model=model,
            name=f"prizepicks_{agent_mode}_agent",
            api_key=self.ai_service.api_key,
            system_instruction=system_instruction,
            memory=False,  # Stateless like NBA agent
            tools=[self.tools.query_data]
        )
        
        return agent

    async def generate_report(self, report_config: Dict[str, Any], user_role: str = "analyst") -> Dict[str, Any]:
        """Generate report using NBA agent pattern"""
        try:
            # Determine agent mode based on report type
            agent_mode = "deep" if report_config.get("comprehensive", False) else "quick"
            
            # Create specialized agent
            agent = self.create_specialized_agent(user_role, agent_mode)
            
            # Generate report query based on config
            report_request = self._build_report_request(report_config)
            
            logger.info(f"Generating {agent_mode} report with PrizePicks agent")
            
            # Generate the report
            report_content = agent.tool_call(report_request)
            
            return {
                "success": True,
                "content": str(report_content),
                "agent_mode": agent_mode,
                "queries_executed": "Multiple BigQuery operations",
                "data_source": "PrizePicksAnalytics BigQuery" if self.tools.client else "Mock Data"
            }
            
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "content": "Report generation failed. Please check logs."
            }
    
    def _build_report_request(self, config: Dict[str, Any]) -> str:
        """Build report request based on configuration"""
        report_type = config.get("type", "daily")
        date = config.get("date", datetime.now().strftime("%Y-%m-%d"))
        
        if report_type == "daily":
            return f"""
            Generate a comprehensive daily business report for PrizePicks for {date}.
            
            Analyze these key areas:
            1. Daily revenue and transaction volumes vs. previous periods
            2. User engagement: active users, new signups, retention
            3. Pick performance: success rates by sport, popular picks
            4. Geographic and demographic insights if available
            5. Notable trends, anomalies, or opportunities
            6. Actionable recommendations for tomorrow
            
            Focus on actionable insights for the executive team.
            """
        elif report_type == "weekly":
            return f"""
            Generate a weekly performance summary for PrizePicks ending {date}.
            
            Provide analysis on:
            1. Week-over-week revenue and growth trends
            2. User acquisition and retention metrics
            3. Sport-specific performance and seasonality
            4. Market opportunities and competitive insights
            5. Strategic recommendations for next week
            
            Include statistical significance and confidence levels where appropriate.
            """
        else:
            # Custom report
            return config.get("custom_query", "Generate a general business performance report.")
    
    def generate_report(self, report_id: str, user_id: str, force_run: bool = False) -> Dict[str, Any]:
        """Generate a report using AI agents and send to Slack."""
        execution_id = str(uuid.uuid4())
        
        try:
            db = next(get_db())
            
            # Get report configuration
            report = get_scheduled_report_by_id(db, report_id)
            if not report:
                raise ValueError(f"Report {report_id} not found")
            
            # Get user information
            user = get_user_by_id(db, user_id)
            if not user:
                raise ValueError(f"User {user_id} not found")
            
            # Check if report should run
            if not force_run and not self._should_run_report(report):
                return {
                    "status": "skipped",
                    "message": "Report not due for execution"
                }
            
            # Create execution record
            execution_data = {
                "id": execution_id,
                "report_id": report_id,
                "user_id": user_id,
                "status": "running"
            }
            create_report_execution(db, execution_data)
            
            # Generate report using AI
            logger.info(f"Generating report {report.name} for user {user.email}")
            report_data = self._generate_report_with_ai(report, user)
            
            # Update execution with results
            update_report_execution(db, execution_id, {
                "status": "completed",
                "completed_at": datetime.utcnow(),
                "result_data": report_data
            })
            
            # Send to Slack if configured
            slack_success = self._send_to_slack(report, report_data, execution_id)
            
            # Update next run time
            self._update_next_run_time(db, report)
            
            db.close()
            
            return {
                "status": "completed",
                "execution_id": execution_id,
                "report_data": report_data,
                "slack_sent": slack_success
            }
            
        except Exception as e:
            logger.error(f"Error generating report {report_id}: {e}")
            
            # Update execution with error
            try:
                db = next(get_db())
                update_report_execution(db, execution_id, {
                    "status": "failed",
                    "completed_at": datetime.utcnow(),
                    "error_message": str(e)
                })
                db.close()
            except:
                pass
            
            return {
                "status": "failed",
                "execution_id": execution_id,
                "error": str(e)
            }
    
    def _should_run_report(self, report) -> bool:
        """Check if a report should run based on its schedule."""
        if not report.enabled:
            return False
        
        current_time = datetime.utcnow()
        return report.next_run <= current_time
    
    def _generate_report_with_ai(self, report, user: User) -> Dict[str, Any]:
        """Generate report content using AI agents."""
        
        # Parse schedule config to determine agent mode
        schedule_config = report.schedule_config
        
        # Use deep mode for complex reports, quick mode for simple ones
        agent_mode = AgentMode.DEEP if schedule_config.get('use_deep_analysis', False) else AgentMode.QUICK
        
        # Create AI agent for the user
        agent = self.ai_service.create_chat_agent(user, agent_mode, memory=False)
        
        # Prepare the report generation prompt
        prompt = self._create_report_prompt(report, schedule_config)
        
        # Generate the report
        logger.info(f"Sending prompt to {agent_mode.value} agent")
        response = agent.run(prompt)
        
        # Parse and structure the response
        report_data = self._parse_ai_response(response, report)
        
        return report_data
    
    def _create_report_prompt(self, report, schedule_config: Dict[str, Any]) -> str:
        """Create a comprehensive prompt for report generation."""
        
        base_prompt = f"""
Generate a comprehensive report based on the following query:

**Report Name:** {report.name}
**Description:** {report.description or 'No description provided'}
**Query:** {report.query}

Please provide:
1. A clear summary of the analysis
2. Key metrics and findings
3. Data insights and trends
4. Actionable recommendations
5. Any relevant visualizations or charts (describe what charts would be helpful)

Format the response as a structured report that can be easily shared in Slack.
"""
        
        # Add schedule-specific context
        frequency = schedule_config.get('frequency', 'daily')
        
        if frequency == 'daily':
            base_prompt += "\n\nThis is a daily report. Focus on today's data and recent trends."
        elif frequency == 'weekly':
            base_prompt += "\n\nThis is a weekly report. Focus on this week's data and compare with previous weeks."
        elif frequency == 'monthly':
            base_prompt += "\n\nThis is a monthly report. Focus on this month's data and monthly trends."
        
        # Add any special instructions
        if schedule_config.get('special_instructions'):
            base_prompt += f"\n\nSpecial Instructions: {schedule_config['special_instructions']}"
        
        return base_prompt
    
    def _parse_ai_response(self, response: str, report) -> Dict[str, Any]:
        """Parse and structure the AI response into a report format."""
        
        # Try to extract structured data from the response
        report_data = {
            "name": report.name,
            "description": report.description,
            "query": report.query,
            "execution_time": datetime.utcnow().isoformat(),
            "ai_response": response
        }
        
        # Try to extract specific sections from the response
        sections = self._extract_report_sections(response)
        
        if sections:
            report_data["results"] = {
                "summary": sections.get("summary", ""),
                "key_metrics": sections.get("key_metrics", []),
                "insights": sections.get("insights", []),
                "recommendations": sections.get("recommendations", []),
                "raw_response": response
            }
        else:
            # Fallback to simple text response
            report_data["results"] = response
        
        return report_data
    
    def _extract_report_sections(self, response: str) -> Optional[Dict[str, Any]]:
        """Extract structured sections from AI response."""
        try:
            sections = {}
            
            # Simple text parsing - could be enhanced with more sophisticated NLP
            lines = response.split('\n')
            current_section = None
            current_content = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check for section headers
                if any(keyword in line.lower() for keyword in ['summary', 'key metrics', 'insights', 'recommendations']):
                    # Save previous section
                    if current_section and current_content:
                        sections[current_section] = '\n'.join(current_content)
                    
                    # Start new section
                    if 'summary' in line.lower():
                        current_section = 'summary'
                    elif 'key metrics' in line.lower() or 'metrics' in line.lower():
                        current_section = 'key_metrics'
                    elif 'insights' in line.lower():
                        current_section = 'insights'
                    elif 'recommendations' in line.lower():
                        current_section = 'recommendations'
                    
                    current_content = []
                else:
                    current_content.append(line)
            
            # Save final section
            if current_section and current_content:
                sections[current_section] = '\n'.join(current_content)
            
            return sections if sections else None
            
        except Exception as e:
            logger.error(f"Error extracting report sections: {e}")
            return None
    
    def _send_to_slack(self, report, report_data: Dict[str, Any], execution_id: str) -> bool:
        """Send report to Slack based on configuration."""
        try:
            # Get Slack configuration from report
            slack_config = getattr(report, 'slack_config', None)
            if not slack_config:
                # Check old format
                notification_type = getattr(report, 'notification_type', 'none')
                if notification_type == 'none':
                    return True  # No Slack notification needed
                
                slack_config = {
                    'notification_type': notification_type,
                    'slack_channel': getattr(report, 'slack_channel', None),
                    'slack_user_id': getattr(report, 'slack_user_id', None)
                }
            
            # For now, assume we're using the first available Slack workspace
            # In a real implementation, you'd need to determine which workspace to use
            db = next(get_db())
            workspaces = self.slack_service._load_workspace_clients() 
            
            if not self.slack_service.clients:
                logger.warning("No Slack workspaces configured")
                return False
            
            # Use the first available workspace (you might want to make this configurable)
            team_id = list(self.slack_service.clients.keys())[0]
            
            if slack_config['notification_type'] == 'channel' and slack_config.get('slack_channel'):
                return self.slack_service.send_report_to_channel(
                    team_id, 
                    slack_config['slack_channel'], 
                    report_data, 
                    execution_id
                ) is not None
            
            elif slack_config['notification_type'] == 'dm' and slack_config.get('slack_user_id'):
                return self.slack_service.send_report_dm(
                    team_id,
                    slack_config['slack_user_id'],
                    report_data,
                    execution_id
                ) is not None
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending report to Slack: {e}")
            return False
    
    def _update_next_run_time(self, db: Session, report) -> None:
        """Update the next run time for a scheduled report."""
        try:
            schedule_config = report.schedule_config
            frequency = schedule_config.get('frequency', 'daily')
            
            # Calculate next run time
            current_time = datetime.utcnow()
            
            if frequency == 'daily':
                next_run = current_time + timedelta(days=1)
            elif frequency == 'weekly':
                next_run = current_time + timedelta(weeks=1)
            elif frequency == 'monthly':
                # Simple monthly calculation - add 30 days
                next_run = current_time + timedelta(days=30)
            else:
                next_run = current_time + timedelta(days=1)  # Default to daily
            
            # Update the report
            update_scheduled_report(db, report.id, {
                'last_run': current_time,
                'next_run': next_run
            })
            
        except Exception as e:
            logger.error(f"Error updating next run time: {e}")
    
    def get_pending_reports(self) -> List[Dict[str, Any]]:
        """Get all reports that are pending execution."""
        try:
            db = next(get_db())
            reports = get_reports_due_for_execution(db)
            db.close()
            
            return [
                {
                    "id": report.id,
                    "name": report.name,
                    "user_id": report.user_id,
                    "next_run": report.next_run.isoformat(),
                    "enabled": report.enabled
                }
                for report in reports
            ]
            
        except Exception as e:
            logger.error(f"Error getting pending reports: {e}")
            return []
    
    def run_scheduled_reports(self) -> Dict[str, Any]:
        """Run all reports that are due for execution."""
        results = {
            "executed": [],
            "failed": [],
            "skipped": []
        }
        
        try:
            pending_reports = self.get_pending_reports()
            logger.info(f"Found {len(pending_reports)} reports due for execution")
            
            for report_info in pending_reports:
                try:
                    result = self.generate_report(
                        report_info["id"],
                        report_info["user_id"],
                        force_run=False
                    )
                    
                    if result["status"] == "completed":
                        results["executed"].append({
                            "report_id": report_info["id"],
                            "report_name": report_info["name"],
                            "execution_id": result["execution_id"]
                        })
                    elif result["status"] == "skipped":
                        results["skipped"].append({
                            "report_id": report_info["id"],
                            "report_name": report_info["name"],
                            "reason": result["message"]
                        })
                    else:
                        results["failed"].append({
                            "report_id": report_info["id"],
                            "report_name": report_info["name"],
                            "error": result.get("error", "Unknown error")
                        })
                        
                except Exception as e:
                    results["failed"].append({
                        "report_id": report_info["id"],
                        "report_name": report_info["name"],
                        "error": str(e)
                    })
            
            logger.info(f"Report execution completed: {len(results['executed'])} executed, {len(results['failed'])} failed, {len(results['skipped'])} skipped")
            
        except Exception as e:
            logger.error(f"Error running scheduled reports: {e}")
            results["error"] = str(e)
        
        return results

# Global report generation service instance
report_generator = ReportGenerationService() 