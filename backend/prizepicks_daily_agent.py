#!/usr/bin/env python3
"""
PrizePicks Daily Report Agent - Based on NBA agent pattern from ai-toolkit
"""
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from google.cloud import bigquery
from tabulate import tabulate

# Load environment variables
load_dotenv()

# Import AI Agent
from ai.gemini import Agent

class PrizePicksReportTools:
    """BigQuery tools for PrizePicks analytics - based on NBA agent pattern"""
    
    def __init__(self):
        self.project_id = "prizepicksanalytics"  # Your project ID
        try:
            self.client = bigquery.Client(project=self.project_id)
            print(f"✅ Connected to BigQuery project: {self.project_id}")
        except Exception as e:
            print(f"⚠️  BigQuery connection failed: {e}")
            self.client = None
    
    def get_schema(self, table_name: str) -> str:
        """Get the schema of the table - NBA agent pattern"""
        try:
            if not self.client:
                return "BigQuery client not available - using mock schema"
            
            table = self.client.get_table(table_name)
            schema_info = []
            for field in table.schema:
                schema_info.append([
                    field.name, 
                    field.field_type, 
                    field.mode, 
                    field.description or ""
                ])
            
            schema_table = tabulate(
                schema_info,
                headers=["Column Name", "Type", "Mode", "Description"],
                tablefmt="grid"
            )
            return schema_table
        except Exception as e:
            return f"Error getting schema: {str(e)}"
    
    def query_data(self, sql_query: str) -> str:
        """Execute a BigQuery query and return results - NBA agent pattern"""
        try:
            if not self.client:
                # Return mock data for testing
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
            
            result = f"Found {len(rows)} results:\n{table_str}"
            
            return result
            
        except Exception as e:
            error_msg = f"Error executing query: {str(e)}"
            return error_msg
    
    def _mock_query_result(self, sql_query: str) -> str:
        """Mock data for testing when BigQuery is not available"""
        # Generate realistic daily metrics
        today = datetime.now()
        yesterday = today - timedelta(days=1)
        
        mock_data = [
            ["Daily Revenue", yesterday.strftime("%Y-%m-%d"), 125000.50, 2800, 44.64],
            ["Daily Revenue", (yesterday - timedelta(days=1)).strftime("%Y-%m-%d"), 118750.25, 2650, 44.81],
            ["Daily Revenue", (yesterday - timedelta(days=2)).strftime("%Y-%m-%d"), 132100.75, 2950, 44.78],
        ]
        
        headers = ["Metric", "Date", "Revenue", "Transactions", "Avg_Value"]
        
        table_str = tabulate(mock_data, headers=headers, tablefmt="grid")
        
        return f"MOCK DATA - Found {len(mock_data)} results:\n{table_str}\n\n🔧 Connect BigQuery for real data"

# Initialize tools
tools = PrizePicksReportTools()

def create_daily_report_agent():
    """Create PrizePicks daily report agent - based on NBA agent pattern"""
    
    # Get schema information (you'll replace this with your actual table names)
    sample_table = "your_dataset.daily_transactions"  # Replace with actual table
    schema = "Schema will be loaded when BigQuery is connected"
    
    agent = Agent(
        name="prizepicks_daily_agent",
        model="gemini-2.0-flash-exp",  # Using latest model like NBA agent
        system_instruction=f"""
        Date: {datetime.now().strftime("%Y-%m-%d")}

        You are a PrizePicks Analytics Expert with a PhD in Business Analytics and Sports Statistics.

        Your job is to create comprehensive daily business reports by analyzing PrizePicks operational data.

        IMPORTANT: Always provide complete responses that include:
        1. Executive Summary
        2. Key Metrics Analysis
        3. Trends and Insights
        4. Recommendations
        5. SQL queries used (at the end)
        6. Respond in Markdown format

        PROJECT: prizepicksanalytics
        
        You can only write SELECT statements - never INSERT, UPDATE, or DELETE.
        
        Daily Report Structure:
        1. **📊 Executive Summary**
        2. **💰 Revenue Metrics**  
        3. **👥 User Activity**
        4. **🎯 Pick Performance**
        5. **📈 Trends & Insights**
        6. **🔧 Recommendations**
        7. **📝 SQL Queries Used**

        Always format numbers with commas and currency symbols where appropriate.
        
        TABLE SCHEMAS: {schema}
        """,
        tools=[tools.query_data],
        memory=False  # Stateless like NBA agent
    )
    
    return agent

def generate_daily_report(custom_question: str = None) -> str:
    """Generate a daily report - NBA agent pattern"""
    agent = create_daily_report_agent()
    
    if custom_question:
        question = custom_question
    else:
        # Default daily report request
        question = f"""
        Generate a comprehensive daily business report for PrizePicks for {datetime.now().strftime('%Y-%m-%d')}.
        
        Please analyze:
        1. Daily revenue and transaction volumes
        2. User engagement and activity patterns
        3. Pick success rates and popular sports
        4. Geographic performance if available
        5. Comparison to previous days/weeks
        6. Any notable trends or anomalies
        
        Provide actionable insights and recommendations for the executive team.
        """
    
    print(f"🔍 Generating daily report...")
    response = agent.tool_call(question)
    return str(response)

def generate_deep_research_report(question: str) -> str:
    """Generate deep research report with multiple iterations - NBA agent pattern"""
    agent = create_daily_report_agent()
    
    # Create reflection agent for feedback
    reflection_agent = Agent(
        name="prizepicks_reflection_agent",
        model="gemini-2.0-flash-exp",
        system_instruction=f"""
        You are a senior analytics consultant reviewing PrizePicks business reports.
        Your job is to provide constructive feedback to improve the analysis depth and insights.
        
        Focus on:
        - Data completeness and accuracy
        - Business insight quality
        - Actionable recommendations
        - Executive-level clarity
        
        Always push for deeper analysis and more specific recommendations.
        """,
        memory=False
    )
    
    research = ""
    
    # Initial research
    response = agent.tool_call(f"""
        You are conducting deep research for PrizePicks executives.
        
        Generate a comprehensive analytical report that includes:
        1. Executive Summary with key findings
        2. Detailed metrics analysis
        3. Trend identification and root cause analysis
        4. Strategic recommendations
        5. Risk assessment
        6. All SQL queries used
        
        Original question: {question}
        
        Make this report executive-ready with clear insights and actionable recommendations.
    """)
    
    research += response + "\n\n"
    
    # Iterative improvement (like NBA agent)
    for attempt in range(2, 4):  # 2 more iterations
        feedback = reflection_agent.chat(f"""
        Original question: {question}
        
        Current research report: {research}
        
        Latest response: {response}
        
        Provide critical feedback to improve this report for PrizePicks executives.
        What additional analysis is needed? What insights are missing?
        """)
        
        response = agent.tool_call(f"""
        You are improving your research report. Attempt {attempt} of 3.
        
        Original question: {question}
        
        Feedback received: {feedback}
        
        Current research: {research}
        
        Enhance the report based on the feedback. Add deeper analysis and better insights.
        """)
        
        research += response + "\n\n"
    
    # Final summary
    summary = agent.chat(f"""
    Provide a final executive summary of your research findings.
    
    Structure:
    # 📊 PrizePicks Analytics Report
    ## Executive Summary
    ## Key Findings
    ## Strategic Recommendations
    ## Appendix: SQL Queries
    
    Original question: {question}
    Complete research: {research}
    """)
    
    return str(summary)

# Test functions
def test_prizepicks_agent():
    """Test the PrizePicks agent with sample questions"""
    print("🚀 Testing PrizePicks Daily Report Agent")
    print("=" * 60)
    
    # Test 1: Basic daily report
    print("\n📊 1. GENERATING DAILY REPORT")
    print("-" * 40)
    try:
        report = generate_daily_report()
        print("✅ Daily Report Generated:")
        print(report[:500] + "..." if len(report) > 500 else report)
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Custom analysis
    print("\n🔍 2. CUSTOM ANALYSIS")
    print("-" * 40)
    try:
        custom_report = generate_daily_report(
            "Analyze yesterday's peak usage hours and revenue patterns"
        )
        print("✅ Custom Analysis:")
        print(custom_report[:300] + "..." if len(custom_report) > 300 else custom_report)
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_prizepicks_agent() 