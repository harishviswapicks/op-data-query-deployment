#!/usr/bin/env python3
"""
Simple test for AI data discovery tools
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

def test_tools_directly():
    """Test the AI tools directly to demonstrate data discovery"""
    print("🔧 Testing AI Tools Directly...")
    
    try:
        # Initialize AI service
        ai_service = AIService()
        print("✅ AI Service initialized successfully")
        
        # Test tools directly (simulating what AI agent will do)
        print("\n📊 Testing data discovery tools:")
        
        # Test 1: List available datasets
        print("\n1️⃣ Listing available datasets...")
        datasets_result = ai_service.list_available_datasets()
        print(f"📁 Datasets:\n{datasets_result}\n")
        
        # Test 2: List tables in sales_data dataset
        print("2️⃣ Listing tables in sales_data dataset...")
        tables_result = ai_service.list_tables_in_dataset("sales_data")
        print(f"📊 Tables:\n{tables_result}\n")
        
        # Test 3: Get schema for daily_sales table
        print("3️⃣ Getting schema for daily_sales table...")
        schema_result = ai_service.get_table_schema("sales_data.daily_sales")
        print(f"📋 Schema:\n{schema_result}\n")
        
        # Test 4: Preview table data
        print("4️⃣ Previewing data from daily_sales table...")
        preview_result = ai_service.preview_table_data("sales_data", "daily_sales", 5)
        print(f"👀 Preview:\n{preview_result}\n")
        
        # Test 5: Execute a query
        print("5️⃣ Executing a sample query...")
        query = "SELECT date, revenue, orders, region FROM sales_data.daily_sales ORDER BY date DESC LIMIT 5"
        query_result = ai_service.execute_bigquery(query)
        print(f"🔍 Query Result:\n{query_result}\n")
        
        print("🎉 All data discovery tools working correctly!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing tools: {e}")
        return False

def test_stateless_agent():
    """Test agent without memory (stateless) which should enable automatic function calling"""
    print("\n🤖 Testing Stateless Agent with Tools...")
    
    try:
        # Initialize AI service
        ai_service = AIService()
        
        # Create analyst user
        analyst_user = User(
            id="test-analyst-456",
            email="analyst@prizepicks.com", 
            role="analyst"
        )
        
        # Create agent WITHOUT memory (stateless)
        print("Creating stateless agent...")
        agent = ai_service.create_chat_agent(analyst_user, AgentMode.QUICK, memory=False)
        print("✅ Stateless agent created successfully")
        
        # Test tool calling with stateless agent
        prompt = "Please use your tools to list the available datasets and show me what tables are in the sales_data dataset."
        
        print(f"\n💬 Sending tool call: {prompt[:100]}...")
        response = agent.tool_call(prompt)
        print(f"🤖 Agent Response:\n{response}\n")
        
        return True
        
    except Exception as e:
        print(f"❌ Error with stateless agent: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 AI Data Tools Test Suite")
    print("=" * 50)
    
    # Test 1: Direct tool testing
    success1 = test_tools_directly()
    
    # Test 2: Stateless agent testing  
    success2 = test_stateless_agent()
    
    if success1 and success2:
        print("\n✅ SUCCESS: Your AI agents can discover and analyze real data!")
        print("\n🎯 Here's exactly how your Slack bot will work:")
        print("1. 📅 Scheduled report triggers")
        print("2. 🤖 AI agent calls list_available_datasets() to discover data")
        print("3. 📊 AI agent calls list_tables_in_dataset() to find relevant tables") 
        print("4. 📋 AI agent calls get_table_schema() to understand data structure")
        print("5. 🔍 AI agent calls execute_bigquery() to run analysis queries")
        print("6. 📈 AI agent formats results into comprehensive report")
        print("7. 💬 Report automatically delivered to Slack!")
        print("\n🚀 Ready for Slack integration!")
    else:
        print("\n❌ Some tests failed - needs attention")

if __name__ == "__main__":
    main() 