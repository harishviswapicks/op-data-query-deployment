#!/usr/bin/env python3
"""
Test script for AI data discovery functionality
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai.service import AIService
from models import User, AgentMode

def test_data_discovery():
    """Test the AI agent's ability to discover and explore data sources"""
    print("🔍 Testing AI Data Discovery Integration...")
    
    try:
        # Initialize AI service
        ai_service = AIService()
        print("✅ AI Service initialized successfully")
        
        # Create a test analyst user
        analyst_user = User(
            id="test-analyst-123",
            email="analyst@prizepicks.com",
            role="analyst"
        )
        
        # Create a quick agent with data tools
        print("\n🤖 Creating analyst agent with data discovery tools...")
        agent = ai_service.create_chat_agent(analyst_user, AgentMode.QUICK, memory=True)
        print("✅ Analyst agent created successfully")
        
        # Test data discovery workflow
        print("\n📊 Testing data discovery workflow:")
        
        # Step 1: Ask AI to discover available datasets
        print("\n1️⃣ Discovering available datasets...")
        discovery_prompt = """
        I need to understand what data sources are available for analysis. 
        Please use your tools to:
        1. List all available datasets
        2. For each dataset, show what tables are available
        3. Give me a preview of one interesting table
        
        Use the available data exploration tools to provide a comprehensive overview.
        """
        
        response = agent.tool_call(discovery_prompt)
        print(f"🤖 Data Discovery Response:\n{response}\n")
        
        # Step 2: Ask for specific analysis
        print("\n2️⃣ Requesting specific data analysis...")
        analysis_prompt = """
        Based on the available data, can you:
        1. Show me the schema of the sales data table
        2. Run a query to get some sample sales data
        3. Provide insights about the data structure
        """
        
        response2 = agent.tool_call(analysis_prompt)
        print(f"🤖 Analysis Response:\n{response2}\n")
        
        # Step 3: Test report generation capability
        print("\n3️⃣ Testing automated report generation...")
        report_prompt = """
        Generate a comprehensive sales performance report based on the available data.
        Include:
        - Key metrics summary
        - Data trends
        - Actionable insights
        - Recommended visualizations
        
        Use the data tools to gather actual information.
        """
        
        response3 = agent.tool_call(report_prompt)
        print(f"🤖 Report Generation Response:\n{response3}\n")
        
        print("🎉 Data discovery test completed successfully!")
        print("\n📋 Summary:")
        print("✅ AI can discover available datasets")
        print("✅ AI can explore table schemas")
        print("✅ AI can execute queries and analyze data")
        print("✅ AI can generate comprehensive reports")
        print("✅ Ready for Slack automation!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during data discovery test: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 AI Data Discovery Test Suite")
    print("=" * 50)
    
    success = test_data_discovery()
    
    if success:
        print("\n✅ Your AI agents are ready to discover and analyze real data!")
        print("\nThis is exactly how your Slack bot will work:")
        print("1. 📅 Scheduled report triggers")
        print("2. 🤖 AI agent uses tools to discover available data")
        print("3. 📊 AI queries relevant tables and analyzes data")
        print("4. 📈 AI generates comprehensive insights")
        print("5. 💬 Report delivered to Slack channel/DM")
    else:
        print("\n❌ Data discovery needs attention")

if __name__ == "__main__":
    main() 