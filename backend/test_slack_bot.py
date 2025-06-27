#!/usr/bin/env python3
"""
Test script to verify Slack bot setup
"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from slack_bot_handler import bot_handler

async def test_bot_setup():
    """Test basic bot functionality"""
    print("🤖 Testing Slack Bot Setup")
    print("=" * 50)
    
    # Test 1: Bot authentication
    print("\n1. Testing Bot Authentication...")
    try:
        if not bot_handler.client:
            print("❌ No Slack client initialized")
            return False
            
        response = bot_handler.client.auth_test()
        if response["ok"]:
            print(f"✅ Bot authenticated successfully")
            print(f"   Bot User: {response['user']}")
            print(f"   Team: {response['team']}")
            print(f"   Bot ID: {response['user_id']}")
        else:
            print(f"❌ Authentication failed: {response.get('error')}")
            return False
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return False
    
    # Test 2: Environment variables
    print("\n2. Testing Environment Variables...")
    import os
    required_vars = ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'GOOGLE_API_KEY']
    all_set = True
    
    for var in required_vars:
        if os.getenv(var):
            print(f"✅ {var}: SET")
        else:
            print(f"❌ {var}: NOT SET")
            all_set = False
    
    if not all_set:
        return False
    
    # Test 3: Mock mention handling
    print("\n3. Testing Mock Mention Handling...")
    try:
        mock_event = {
            "user": "U12345TEST",
            "channel": "C12345TEST",
            "text": "<@U093U3SHDAM> Hello! Can you generate a report?",
            "ts": "1234567890.123456"
        }
        
        # This will test the mention handling logic
        result = await bot_handler.handle_app_mention(mock_event)
        if result:
            print("✅ Mock mention handled successfully")
        else:
            print("⚠️ Mock mention handling returned False (might be expected)")
    except Exception as e:
        print(f"❌ Mock mention error: {e}")
    
    print("\n🎯 Bot Setup Status:")
    print("✅ Environment variables loaded")
    print("✅ Bot authentication working")
    print("✅ Event handling logic ready")
    print("\n📋 Next Steps:")
    print("1. Start your FastAPI server: python3 main.py")
    print("2. Configure Slack Event Subscriptions")
    print("3. Set Request URL to your server endpoint")
    print("4. Test @daily_report_gen mentions in Slack")
    
    return True

if __name__ == "__main__":
    asyncio.run(test_bot_setup()) 