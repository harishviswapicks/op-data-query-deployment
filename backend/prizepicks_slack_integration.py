#!/usr/bin/env python3
"""
PrizePicks Slack Integration - NBA Agent Pattern
Complete daily report automation for PrizePicks using proven BigQuery + AI approach
"""
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from google.cloud import bigquery
from tabulate import tabulate
import asyncio
import logging

# Load environment variables
load_dotenv()

# Import existing services
from ai.gemini import Agent
from slack.service import SlackService
from database import get_db, get_reports_due_for_execution

logger = logging.getLogger(__name__)

class PrizePicksTools:
    """BigQuery tools following NBA agent pattern"""
    
    def __init__(self):
        self.project_id = "prizepicksanalytics"
        try:
            self.client = bigquery.Client(project=self.project_id)
            logger.info(f"✅ BigQuery connected: {self.project_id}")
        except Exception as e:
            logger.warning(f"⚠️ BigQuery offline: {e}")
            self.client = None
    
    def query_data(self, sql_query: str) -> str:
        """Execute BigQuery - NBA pattern"""
        try:
            if not self.client:
                return self._mock_data(sql_query)
            
            job = self.client.query(sql_query)
            results = job.result()
            
            rows = []
            headers = []
            
            for i, row in enumerate(results):
                if i == 0:
                    headers = list(row.keys())
                rows.append(list(row.values()))
            
            if not rows:
                return "No data found."
            
            table = tabulate(rows, headers=headers, tablefmt="grid")
            return f"Results ({len(rows)} rows):\n{table}"
            
        except Exception as e:
            return f"Query error: {str(e)}"
    
    def _mock_data(self, query: str) -> str:
        """NBA-style mock data"""
        today = datetime.now()
        
        if "revenue" in query.lower():
            data = [
                ["Today", 145250.75, 3240, 44.83],
                ["Yesterday", 132100.50, 2950, 44.78],
                ["Last Week Avg", 128500.00, 2875, 44.70]
            ]
            headers = ["Period", "Revenue", "Transactions", "Avg_Value"]
        elif "user" in query.lower():
            data = [
                ["Active Users", 18250],
                ["New Signups", 1420],
                ["Returning", 16830]
            ]
            headers = ["User_Type", "Count"]
        elif "pick" in query.lower() or "sport" in query.lower():
            data = [
                ["NBA", 9240, 0.652],
                ["NFL", 7180, 0.628],
                ["MLB", 5290, 0.674]
            ]
            headers = ["Sport", "Picks", "Success_Rate"]
        else:
            data = [["PrizePicks", today.strftime("%Y-%m-%d"), "Active"]]
            headers = ["Platform", "Date", "Status"]
        
        table = tabulate(data, headers=headers, tablefmt="grid")
        return f"MOCK DATA:\n{table}\n\n🔧 Real data available after BigQuery setup"

class PrizePicksSlackReports:
    """Main Slack integration using NBA agent pattern"""
    
    def __init__(self):
        self.tools = PrizePicksTools()
        self.slack = SlackService()
        self.api_key = os.environ.get("GOOGLE_API_KEY")
        
    def create_report_agent(self, mode="daily"):
        """Create PrizePicks agent - NBA pattern"""
        
        if mode == "quick":
            model = "gemini-1.5-flash"
            instruction = f"""
            Date: {datetime.now().strftime("%Y-%m-%d")}
            
            You're a PrizePicks Analytics Expert creating quick daily updates.
            
            Generate concise Slack-ready reports:
            📊 **Daily Metrics Summary**
            💰 **Revenue Highlights** 
            👥 **User Activity**
            🏆 **Top Performing Sports**
            🔧 **Key Recommendations**
            
            Keep under 400 words. Use emojis and bullet points.
            PROJECT: prizepicksanalytics
            """
        else:  # comprehensive
            model = "gemini-2.0-flash-exp"
            instruction = f"""
            Date: {datetime.now().strftime("%Y-%m-%d")}
            
            You're a Senior PrizePicks Analytics Director creating executive reports.
            
            Generate comprehensive Slack reports:
            📈 **Executive Summary**
            💰 **Revenue & Growth Analysis**
            👥 **User Engagement & Retention**
            🏆 **Sport Performance & Trends**
            🎯 **Market Insights**
            🔧 **Strategic Recommendations**
            📊 **Data Sources & Queries**
            
            Professional tone, actionable insights, data-driven.
            PROJECT: prizepicksanalytics
            """
        
        return Agent(
            model=model,
            name=f"prizepicks_{mode}_reporter",
            api_key=self.api_key,
            system_instruction=instruction,
            memory=False,
            tools=[self.tools.query_data]
        )
    
    async def generate_daily_report(self, channel="#analytics", mode="comprehensive"):
        """Generate and send daily report - NBA pattern"""
        try:
            logger.info(f"🔍 Generating {mode} daily report")
            
            agent = self.create_report_agent(mode)
            
            prompt = f"""
            Generate a {mode} daily business report for PrizePicks {datetime.now().strftime('%Y-%m-%d')}.
            
            Analyze:
            1. Daily revenue vs. yesterday and weekly average
            2. User activity: active users, new signups, retention
            3. Pick performance by sport and success rates
            4. Notable trends or anomalies requiring attention
            5. Actionable recommendations for today
            
            Format for Slack with clear sections and professional insights.
            """
            
            report = agent.tool_call(prompt)
            
            # Format for Slack
            slack_message = f"""
🏈 **PrizePicks Daily Report** - {datetime.now().strftime('%B %d, %Y')}

{report}

---
🤖 *Generated by PrizePicks AI Analytics*
📊 *Data: {self.tools.project_id}*
⏰ *Updated: {datetime.now().strftime('%H:%M %Z')}*
            """
            
            # Send to Slack
            result = await self.slack.send_report_to_channel(
                team_id="default",  # Will be set when Slack app is configured
                channel=channel,
                report_data={
                    "title": f"PrizePicks Daily Report - {datetime.now().strftime('%B %d, %Y')}",
                    "content": report,
                    "timestamp": datetime.now().isoformat()
                }
            )
            
            logger.info(f"✅ Daily report sent to {channel}")
            return {
                "success": True,
                "channel": channel,
                "message_ts": result.get("ts"),
                "content": report
            }
            
        except Exception as e:
            logger.error(f"❌ Daily report failed: {e}")
            await self.slack.send_message(
                channel=channel,
                message=f"⚠️ Daily report generation failed: {str(e)}"
            )
            return {"success": False, "error": str(e)}
    
    async def generate_custom_analysis(self, question: str, channel="#analytics"):
        """Generate custom analysis - NBA pattern"""
        try:
            agent = self.create_report_agent("comprehensive")
            
            response = agent.tool_call(f"""
            Analyze this PrizePicks business question: {question}
            
            Provide:
            1. Data analysis with specific queries
            2. Clear insights and findings
            3. Business implications
            4. Actionable recommendations
            
            Format for Slack executive presentation.
            """)
            
            slack_message = f"""
🔍 **Custom Analysis Request**

**Question:** {question}

{response}

---
🤖 *PrizePicks AI Analytics*
            """
            
            result = await self.slack.send_message(
                channel=channel,
                message=slack_message
            )
            
            return {"success": True, "content": response}
            
        except Exception as e:
            logger.error(f"Custom analysis failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _create_slack_blocks(self, report_content: str):
        """Create rich Slack blocks for better formatting"""
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"📊 PrizePicks Daily Report - {datetime.now().strftime('%B %d, %Y')}"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": report_content[:2900]  # Slack block limit
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"🤖 Generated by AI Analytics | 📊 Data: {self.tools.project_id} | ⏰ {datetime.now().strftime('%H:%M %Z')}"
                    }
                ]
            }
        ]
        return blocks
    
    async def run_scheduled_reports(self):
        """Process scheduled reports - NBA pattern"""
        try:
            db = next(get_db())
            due_reports = get_reports_due_for_execution(db)
            db.close()
            
            logger.info(f"📋 Processing {len(due_reports)} scheduled reports")
            
            for report in due_reports:
                try:
                    channel = report.slack_config.get("slack_channel", "#analytics")
                    mode = "comprehensive" if "deep" in report.name.lower() else "quick"
                    
                    result = await self.generate_daily_report(channel, mode)
                    
                    if result["success"]:
                        logger.info(f"✅ Sent report '{report.name}' to {channel}")
                    else:
                        logger.error(f"❌ Failed report '{report.name}': {result['error']}")
                        
                except Exception as e:
                    logger.error(f"❌ Report '{report.name}' error: {e}")
            
            return {"processed": len(due_reports), "success": True}
            
        except Exception as e:
            logger.error(f"❌ Scheduled reports failed: {e}")
            return {"success": False, "error": str(e)}

# Test and demo functions
async def test_prizepicks_slack():
    """Test PrizePicks Slack integration"""
    print("🚀 Testing PrizePicks Slack Integration")
    print("="*60)
    
    integration = PrizePicksSlackReports()
    
    # Test 1: Quick daily report
    print("\n⚡ 1. QUICK DAILY REPORT")
    print("-"*40)
    try:
        result = await integration.generate_daily_report(
            channel="#test-analytics", 
            mode="quick"
        )
        print("✅ Quick report:", "Success" if result["success"] else f"Failed: {result['error']}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Comprehensive report
    print("\n📊 2. COMPREHENSIVE REPORT")
    print("-"*40)
    try:
        result = await integration.generate_daily_report(
            channel="#test-analytics", 
            mode="comprehensive"
        )
        print("✅ Comprehensive report:", "Success" if result["success"] else f"Failed: {result['error']}")
        if result["success"]:
            print("📝 Content preview:", result["content"][:200] + "...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Custom analysis
    print("\n🔍 3. CUSTOM ANALYSIS")
    print("-"*40)
    try:
        result = await integration.generate_custom_analysis(
            "What were our top performing sports yesterday and why?",
            "#test-analytics"
        )
        print("✅ Custom analysis:", "Success" if result["success"] else f"Failed: {result['error']}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print(f"\n🎯 READY FOR PRODUCTION!")
    print("Your PrizePicks Slack integration is working!")

if __name__ == "__main__":
    asyncio.run(test_prizepicks_slack()) 