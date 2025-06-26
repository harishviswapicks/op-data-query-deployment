from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
import uuid
import logging

from models import ChatRequest, ChatResponse, ChatMessage, User, MessageSender, AgentMode
from routers.auth import get_current_user
from ai.service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/test", response_model=ChatResponse)
async def test_ai_chat(message: str, agent_mode: str = "quick"):
    """
    Test endpoint for AI chat without authentication (for testing only)
    """
    try:
        # Create a test user
        test_user = User(
            id="test-user-123",
            email="test@example.com",
            role="analyst"
        )
        
        # Convert agent_mode string to enum
        mode = AgentMode.QUICK if agent_mode.lower() == "quick" else AgentMode.DEEP
        
        # Create AI agent for the test user and mode
        agent = ai_service.create_chat_agent(test_user, mode)
        
        # Process the message with the agent
        response_text = agent.tool_call(message)
        
        # Create response message
        response_message = ChatMessage(
            id=str(uuid.uuid4()),
            content=response_text,
            sender=MessageSender.QUICK_AGENT if mode == AgentMode.QUICK else MessageSender.DEEP_AGENT,
            username=None,
            timestamp=datetime.now(),
            metadata={"agent_mode": mode.value, "user_role": test_user.role}
        )
        
        # Return the response
        return ChatResponse(
            message=response_message,
            research_job_id=None
        )
        
    except Exception as e:
        logger.error(f"Error in test chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing your message: {str(e)}"
        )

@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send a message to the AI agent (quick or deep mode)
    """
    try:
        # Create AI agent for the current user and mode
        agent = ai_service.create_chat_agent(current_user, request.agent_mode)
        
        # Process the message with the agent
        if request.agent_mode.value == "quick":
            # Quick mode: Return immediate response
            response_text = agent.tool_call(request.message)
        else:
            # Deep mode: Also use tool_call for comprehensive research
            response_text = agent.tool_call(request.message)
        
        # Create response message
        response_message = ChatMessage(
            id=str(uuid.uuid4()),
            content=response_text,
            sender=MessageSender.QUICK_AGENT if request.agent_mode.value == "quick" else MessageSender.DEEP_AGENT,
            username=None,
            timestamp=datetime.now(),
            metadata={"agent_mode": request.agent_mode.value, "user_role": current_user.role}
        )
        
        # Return the response
        return ChatResponse(
            message=response_message,
            research_job_id=None  # Could be used for deep mode job tracking
        )
        
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing your message: {str(e)}"
        )

@router.get("/history/{user_id}", response_model=List[ChatMessage])
async def get_chat_history(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """
    Get chat history for a user
    """
    try:
        # Ensure user can only access their own history
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own chat history"
            )
        
        # For now, return empty list - can be implemented later with proper type handling
        return []
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving chat history: {str(e)}"
        )

@router.delete("/history/{user_id}")
async def clear_chat_history(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Clear chat history for a user
    """
    try:
        # Ensure user can only clear their own history
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only clear your own chat history"
            )
        
        from database import get_db, clear_chat_history as db_clear_chat_history
        
        db = next(get_db())
        success = db_clear_chat_history(db, user_id)
        db.close()
        
        if success:
            return {"message": "Chat history cleared successfully"}
        else:
            return {"message": "No chat history found to clear"}
            
    except Exception as e:
        logger.error(f"Error clearing chat history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing chat history: {str(e)}"
        )

@router.post("/upgrade-to-deep")
async def upgrade_to_deep_research(
    message: str,
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Upgrade a quick query to deep research mode
    """
    try:
        # Ensure user can only upgrade their own queries
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only upgrade your own queries"
            )
        
        from models import AgentMode
        
        # Create deep agent and process the message
        agent = ai_service.create_chat_agent(current_user, AgentMode.DEEP)
        enhanced_prompt = f"Please provide a comprehensive deep analysis of: {message}"
        response_text = agent.tool_call(enhanced_prompt)
        
        return {
            "message": "Query upgraded to deep research mode",
            "response": response_text
        }
        
    except Exception as e:
        logger.error(f"Error upgrading to deep research: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error upgrading query: {str(e)}"
        )
