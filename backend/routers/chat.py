from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
import uuid
import logging

from models import ChatRequest, ChatResponse, ChatMessage, User, MessageSender, AgentMode
from routers.auth import get_current_user
from ai.service import ai_service
from database import get_db, create_chat_message, get_chat_history as db_get_chat_history

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
        
        # Create response message with proper metadata structure
        response_message = ChatMessage(
            id=str(uuid.uuid4()),
            content=response_text,
            sender=MessageSender.QUICK_AGENT if mode == AgentMode.QUICK else MessageSender.DEEP_AGENT,
            username=None,
            timestamp=datetime.now(),
            metadata={
                "agent_mode": mode.value, 
                "user_role": test_user.role,
                "processing_time": 1500 if mode == AgentMode.DEEP else 800,
                "data_sources": ["bigquery", "analytics"] if test_user.role == "analyst" else ["notion", "slack"],
                "confidence": 85 if mode == AgentMode.QUICK else 92,
                "can_upgrade_to_deep": mode == AgentMode.QUICK
            }
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
        # First save the user's message to maintain history
        db = next(get_db())
        user_message_id = str(uuid.uuid4())
        create_chat_message(
            db=db,
            message_id=user_message_id,
            content=request.message,
            sender="user",
            user_id=current_user.id
        )
        
        # Load recent chat history for memory (last 10 messages)
        recent_messages = db_get_chat_history(db, current_user.id, limit=10)
        db.close()
        
        # Convert to format expected by Agent class
        chat_history = []
        for msg in reversed(recent_messages):  # Reverse to get chronological order
            sender_value = str(msg.sender).lower()  # Convert to string for comparison
            if sender_value == "user":
                chat_history.append({"role": "user", "content": msg.content})
            else:
                chat_history.append({"role": "model", "content": msg.content})
        
        # Create AI agent for the current user and mode with memory
        agent = ai_service.create_chat_agent(current_user, request.agent_mode, memory=True)
        
        # Inject recent chat history into agent memory
        if chat_history:
            logger.info(f"Loading {len(chat_history)} previous messages into agent memory")
            agent.inject_messages(chat_history)
        
        # Enhance the user prompt to better trigger tool usage for data queries
        enhanced_prompt = request.message
        if any(keyword in request.message.lower() for keyword in ['trends', 'data', 'dataset', 'query', 'show', 'analyze', 'find']):
            enhanced_prompt = f"""User query: {request.message}

Please analyze this request and use your available tools to provide real data insights. If the user is asking about trends, datasets, or specific data, make sure to:
1. Search for relevant datasets using list_available_datasets()
2. Explore specific datasets using list_tables_in_dataset() 
3. Execute queries using execute_bigquery() when appropriate
4. Provide actual data-driven answers, not generic responses"""
        
        # Process the message with the agent
        if request.agent_mode.value == "quick":
            # Quick mode: Return immediate response
            response_text = agent.tool_call(enhanced_prompt)
        else:
            # Deep mode: Also use tool_call for comprehensive research
            response_text = agent.tool_call(enhanced_prompt)
        
        # Save the agent's response to maintain history
        db = next(get_db())
        response_message_id = str(uuid.uuid4())
        agent_sender = "quick_agent" if request.agent_mode.value == "quick" else "deep_agent"
        create_chat_message(
            db=db,
            message_id=response_message_id,
            content=response_text,
            sender=agent_sender,
            user_id=current_user.id
        )
        db.close()
        
        # Create response message with proper metadata structure
        response_message = ChatMessage(
            id=response_message_id,
            content=response_text,
            sender=MessageSender.QUICK_AGENT if request.agent_mode.value == "quick" else MessageSender.DEEP_AGENT,
            username=None,
            timestamp=datetime.now(),
            metadata={
                "agent_mode": request.agent_mode.value, 
                "user_role": current_user.role,
                "processing_time": 2000 if request.agent_mode.value == "deep" else 900,
                "data_sources": ["bigquery", "analytics"] if current_user.role == "analyst" else ["notion", "slack"],
                "confidence": 88 if request.agent_mode.value == "quick" else 94,
                "can_upgrade_to_deep": request.agent_mode.value == "quick",
                "memory_loaded": len(chat_history) > 0,
                "history_messages_count": len(chat_history)
            }
        )
        
        # Return the response
        return ChatResponse(
            message=response_message,
            research_job_id=None  # Could be used for deep mode job tracking
        )
        
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
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
