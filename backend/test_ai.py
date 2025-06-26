#!/usr/bin/env python3
"""
Test script for AI functionality integration
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

def test_ai_service():
    """Test the AI service functionality"""
    print("🔧 Testing AI Service Integration...")
    
    # Check if API key is set
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("❌ GOOGLE_API_KEY environment variable not set")
        print("Please set your Google API key:")
        print("export GOOGLE_API_KEY='your-api-key-here'")
        return False
    
    print(f"✅ API key found (ends with: ...{api_key[-4:]})")
    
    try:
        # Initialize AI service
        ai_service = AIService()
        print("✅ AI Service initialized successfully")
        
        # Create a test user
        test_user = User(
            id="test-user-123",
            email="test@example.com",
            role="analyst"
        )
        
        # Test quick agent creation
        print("\n🤖 Testing Quick Agent...")
        quick_agent = ai_service.create_chat_agent(test_user, AgentMode.QUICK)
        print("✅ Quick agent created successfully")
        
        # Test basic chat functionality
        test_message = "Hello! Can you help me understand what you can do?"
        print(f"\n💬 Testing chat with message: '{test_message}'")
        
        response = quick_agent.chat(test_message)
        print(f"🤖 Quick Agent Response: {response[:200]}...")
        
        # Test deep agent creation
        print("\n🧠 Testing Deep Agent...")
        deep_agent = ai_service.create_chat_agent(test_user, AgentMode.DEEP)
        print("✅ Deep agent created successfully")
        
        # Test tool calling functionality
        print("\n🔧 Testing tool calling...")
        tool_message = "What tools do you have available for data analysis?"
        tool_response = quick_agent.tool_call(tool_message)
        print(f"🔧 Tool Response: {tool_response[:200]}...")
        
        print("\n🎉 All tests passed! AI integration is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 AI Integration Test Suite")
    print("=" * 40)
    
    success = test_ai_service()
    
    if success:
        print("\n✅ AI integration is ready!")
        print("\nNext steps:")
        print("1. Start your backend server: python main.py")
        print("2. Test the /api/chat/send endpoint")
        print("3. Try both quick and deep agent modes")
    else:
        print("\n❌ AI integration needs attention")
        print("\nTroubleshooting:")
        print("1. Ensure GOOGLE_API_KEY is set")
        print("2. Install dependencies: pip install -r requirements.txt")
        print("3. Check your Google API quota")

if __name__ == "__main__":
    main() 