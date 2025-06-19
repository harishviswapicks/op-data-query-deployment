from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from models import ChatRequest, ChatResponse, ChatMessage, User
from routers.auth import get_current_user

router = APIRouter()

@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send a message to the AI agent (quick or deep mode)
    """
    # TODO: Process chat message based on agent mode
    # - Quick mode: Return immediate response
    # - Deep mode: Create research job and return acknowledgment
    pass

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
    # TODO: Retrieve chat history from database
    pass

@router.delete("/history/{user_id}")
async def clear_chat_history(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Clear chat history for a user
    """
    # TODO: Clear chat history from database
    pass

@router.post("/upgrade-to-deep")
async def upgrade_to_deep_research(
    message: str,
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Upgrade a quick query to deep research mode
    """
    # TODO: Create deep research job from quick query
    pass
