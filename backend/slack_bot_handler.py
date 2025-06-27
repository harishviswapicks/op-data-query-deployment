#!/usr/bin/env python3
"""
Slack Bot Event Handler - Makes your bot interactive
Connects Slack mentions to your AI chat system
"""
import os
import logging
from typing import Dict, Any
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from fastapi import APIRouter, Request, HTTPException
import hmac
import hashlib
import time
import json
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Import your existing services
from ai.service import ai_service
from models import User, AgentMode
from slack.service import slack_service

logger = logging.getLogger(__name__)
router = APIRouter()

class SlackBotHandler:
    """Handles interactive Slack bot events"""
    
    def __init__(self):
        self.signing_secret = os.getenv("SLACK_SIGNING_SECRET")
        self.bot_token = os.getenv("SLACK_BOT_TOKEN")
        self.team_id = os.getenv("SLACK_TEAM_ID", "T8H1C5NQ0")
        
        if self.bot_token:
            self.client = WebClient(token=self.bot_token)
        else:
            self.client = None
            logger.warning("No Slack bot token found")
    
    def verify_slack_signature(self, body: str, timestamp: str, signature: str) -> bool:
        """Verify request is from Slack"""
        if not self.signing_secret:
            return False
        
        # Check timestamp is recent (within 5 minutes)
        if abs(time.time() - int(timestamp)) > 300:
            return False
        
        # Create expected signature
        sig_basestring = f'v0:{timestamp}:{body}'
        expected_signature = 'v0=' + hmac.new(
            self.signing_secret.encode(),
            sig_basestring.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)
    
    async def handle_app_mention(self, event: Dict[str, Any]) -> bool:
        """Handle @bot mentions"""
        try:
            user_id = event.get("user")
            channel = event.get("channel")
            text = event.get("text", "").strip()
            
            # Remove bot mention from text - get bot user ID from client
            bot_user_id = None
            try:
                if self.client:
                    auth_response = self.client.auth_test()
                    if auth_response["ok"]:
                        bot_user_id = auth_response["user_id"]
            except:
                pass
            
            # Clean the text by removing bot mention
            if bot_user_id:
                text = text.replace(f"<@{bot_user_id}>", "").strip()
            
            if not text:
                text = "Hello! How can I help you with PrizePicks analytics today?"
            
            logger.info(f"Bot mentioned by {user_id} in {channel}: {text}")
            
            # Create a mock user for the Slack interaction
            slack_user = User(
                id=f"slack_{user_id}",
                email=f"{user_id}@slack.user",
                role="analyst"  # Default role for Slack users
            )
            
            # Determine agent mode based on keywords
            agent_mode = AgentMode.DEEP if any(word in text.lower() for word in [
                "analyze", "comprehensive", "detailed", "deep", "report", "trends"
            ]) else AgentMode.QUICK
            
            # Get AI response
            agent = ai_service.create_chat_agent(slack_user, agent_mode)
            
            # Add PrizePicks context to the prompt
            enhanced_prompt = f"""
            You're responding to a PrizePicks team member in Slack. 
            Context: PrizePicks daily fantasy sports platform
            
            User question: {text}
            
            Provide a helpful, concise response about PrizePicks analytics, data, or operations.
            If they're asking for reports or analysis, offer to generate specific insights.
            Keep it professional but friendly for Slack.
            """
            
            ai_response = agent.tool_call(enhanced_prompt)
            
            # Send response back to Slack
            if self.client and channel:
                response = self.client.chat_postMessage(
                    channel=channel,
                    text=ai_response,
                    thread_ts=event.get("ts")  # Reply in thread if possible
                )
                
                if response["ok"]:
                    logger.info(f"Sent AI response to {channel}")
                    return True
                else:
                    logger.error(f"Failed to send message: {response.get('error')}")
            
            return False
            
        except Exception as e:
            logger.error(f"Error handling app mention: {e}")
            
            # Send error message to user
            if self.client and event.get("channel"):
                try:
                    self.client.chat_postMessage(
                        channel=event["channel"],
                        text="🤖 Sorry, I encountered an error processing your request. Please try again or contact support.",
                        thread_ts=event.get("ts")
                    )
                except:
                    pass
            
            return False
    
    async def handle_direct_message(self, event: Dict[str, Any]) -> bool:
        """Handle direct messages to the bot"""
        try:
            user_id = event.get("user")
            channel = event.get("channel")
            text = event.get("text", "").strip()
            
            if not text:
                return False
            
            logger.info(f"DM from {user_id}: {text}")
            
            # Create user for DM
            slack_user = User(
                id=f"slack_{user_id}",
                email=f"{user_id}@slack.user", 
                role="analyst"
            )
            
            # DMs get quick mode by default
            agent = ai_service.create_chat_agent(slack_user, AgentMode.QUICK)
            
            prompt = f"""
            You're in a private DM with a PrizePicks team member.
            Be helpful and professional.
            
            Question: {text}
            
            Provide a direct, useful response about PrizePicks data or operations.
            """
            
            ai_response = agent.tool_call(prompt)
            
            # Send DM response
            if self.client and channel:
                response = self.client.chat_postMessage(
                    channel=channel,
                    text=ai_response
                )
                
                if response["ok"]:
                    logger.info(f"Sent DM response to {user_id}")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error handling DM: {e}")
            return False

# Global handler instance
bot_handler = SlackBotHandler()

@router.post("/slack/events")
async def slack_events(request: Request):
    """Handle Slack events (mentions, DMs, etc.)"""
    try:
        body = await request.body()
        body_str = body.decode("utf-8")
        
        # Get headers
        timestamp = request.headers.get("X-Slack-Request-Timestamp", "")
        signature = request.headers.get("X-Slack-Signature", "")
        
        # Verify request is from Slack
        if not bot_handler.verify_slack_signature(body_str, timestamp, signature):
            raise HTTPException(status_code=403, detail="Invalid Slack signature")
        
        # Parse event data
        data = json.loads(body_str)
        
        # Handle URL verification challenge
        if data.get("type") == "url_verification":
            return {"challenge": data.get("challenge")}
        
        # Handle events
        if data.get("type") == "event_callback":
            event = data.get("event", {})
            event_type = event.get("type")
            
            # Ignore bot messages
            if event.get("bot_id") or event.get("user") == "USLACKBOT":
                return {"ok": True}
            
            # Handle app mentions (@bot)
            if event_type == "app_mention":
                await bot_handler.handle_app_mention(event)
            
            # Handle direct messages
            elif event_type == "message" and event.get("channel_type") == "im":
                await bot_handler.handle_direct_message(event)
        
        return {"ok": True}
        
    except Exception as e:
        logger.error(f"Slack event handling error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/slack/test")
async def test_slack_bot():
    """Test endpoint to verify bot is working"""
    if not bot_handler.client:
        return {"status": "error", "message": "Bot not configured"}
    
    try:
        # Test auth
        response = bot_handler.client.auth_test()
        if response["ok"]:
            return {
                "status": "success",
                "bot_user": response["user"],
                "team": response["team"],
                "message": "Bot is ready for interactions!"
            }
        else:
            return {"status": "error", "message": response.get("error")}
    except Exception as e:
        return {"status": "error", "message": str(e)} 