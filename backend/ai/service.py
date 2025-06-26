import os
import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from .gemini import Agent
from models import ChatMessage, MessageSender, AgentMode, User, ChatRequest, ChatResponse
from database import get_db, create_chat_message, get_chat_history as db_get_chat_history, get_user_by_id
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class AIService:
    """Service class that integrates the AI Agent with the backend functionality."""
    
    def __init__(self):
        self.api_key = os.environ.get("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")
            
    def create_chat_agent(self, user: User, agent_mode: AgentMode, memory: bool = True) -> Agent:
        """Create an AI agent for chat functionality."""
        
        # Determine model and system instruction based on agent mode and user role
        if agent_mode == AgentMode.QUICK:
            model = "gemini-1.5-flash"
            system_instruction = self._get_quick_agent_instruction(user.role)
        else:  # DEEP mode
            model = "gemini-2.0-flash-exp"
            system_instruction = self._get_deep_agent_instruction(user.role)
        
        # Create tools based on user role
        tools = self._get_tools_for_user(user)
        
        agent = Agent(
            model=model,
            name=f"{agent_mode.value}_agent_{user.role}",
            api_key=self.api_key,
            system_instruction=system_instruction,
            memory=memory,
            tools=tools
        )
        
        return agent
    
    def _get_quick_agent_instruction(self, user_role: str) -> str:
        """Get system instruction for quick agent based on user role."""
        base_instruction = """You are a helpful AI assistant for a data platform. You provide quick, concise responses to user queries."""
        
        if user_role == "analyst":
            return f"""{base_instruction}
            
You specialize in:
- Data analysis and insights
- SQL query assistance
- Chart and visualization recommendations
- Business intelligence support
- Statistical analysis

Keep responses focused and actionable. For complex analysis requests, suggest upgrading to deep research mode."""
        
        else:  # general_employee
            return f"""{base_instruction}
            
You help with:
- General business questions
- Data exploration
- Report generation
- Simple analytics
- Data interpretation

Keep explanations clear and non-technical when possible."""
    
    def _get_deep_agent_instruction(self, user_role: str) -> str:
        """Get system instruction for deep agent based on user role."""
        base_instruction = """You are an advanced AI research assistant for a data platform. You provide comprehensive, detailed analysis and research."""
        
        if user_role == "analyst":
            return f"""{base_instruction}
            
You specialize in:
- Complex data analysis and statistical modeling
- Advanced SQL query optimization
- Multi-dimensional data exploration
- Predictive analytics
- Performance analysis
- Research methodology

Provide thorough analysis, show your work, and include statistical confidence where appropriate."""
        
        else:  # general_employee
            return f"""{base_instruction}
            
You provide:
- Comprehensive research on business questions
- Detailed data explanations
- Step-by-step analysis
- Multiple perspectives on data insights
- Actionable recommendations

Make complex analysis accessible while maintaining thoroughness."""
    
    def _get_tools_for_user(self, user: User) -> List:
        """Get available tools based on user role."""
        tools = []
        
        # Basic tools for all users
        tools.extend([
            self.get_user_info,
            self.save_chat_message,
            self.get_chat_history
        ])
        
        # Role-specific tools
        if user.role == "analyst":
            tools.extend([
                self.execute_bigquery,
                self.get_table_schema,
                self.create_chart_config,
                self.analyze_query_performance
            ])
        
        # General employee gets simplified data tools
        if user.role == "general_employee":
            tools.extend([
                self.simple_data_query,
                self.get_basic_analytics
            ])
            
        return tools
    
    # Tool Functions
    def get_user_info(self, user_id: str) -> str:
        """Get user information."""
        try:
            db = next(get_db())
            user = get_user_by_id(db, user_id)
            db.close()
            
            if user:
                return f"User: {user.email}, Role: {user.role}"
            return "User not found"
        except Exception as e:
            logger.error(f"Error getting user info: {e}")
            return f"Error retrieving user information: {str(e)}"
    
    def save_chat_message(self, user_id: str, content: str, sender: str) -> str:
        """Save a chat message to the database."""
        try:
            db = next(get_db())
            message_id = str(uuid.uuid4())
            
            create_chat_message(
                db=db,
                message_id=message_id,
                content=content,
                sender=sender,
                user_id=user_id
            )
            db.close()
            
            return f"Message saved with ID: {message_id}"
        except Exception as e:
            logger.error(f"Error saving chat message: {e}")
            return f"Error saving message: {str(e)}"
    
    def get_chat_history(self, user_id: str, limit: int = 10) -> str:
        """Get recent chat history for a user."""
        try:
            db = next(get_db())
            messages = db_get_chat_history(db, user_id, limit)
            db.close()
            
            if not messages:
                return "No chat history found"
            
            history = []
            for message in reversed(messages):  # Reverse to show oldest first
                history.append(f"{message.sender}: {message.content} ({message.timestamp})")
            
            return "\n".join(history)
        except Exception as e:
            logger.error(f"Error getting chat history: {e}")
            return f"Error retrieving chat history: {str(e)}"
    
    def execute_bigquery(self, sql_query: str) -> str:
        """Execute a BigQuery SQL query and return results."""
        try:
            # This would integrate with your existing BigQuery functionality
            # For now, return a placeholder
            return f"BigQuery would execute: {sql_query}"
        except Exception as e:
            logger.error(f"Error executing BigQuery: {e}")
            return f"Error executing query: {str(e)}"
    
    def get_table_schema(self, table_name: str) -> str:
        """Get schema information for a BigQuery table."""
        try:
            # Integrate with existing BigQuery schema functionality
            return f"Schema for table {table_name}: [columns would be listed here]"
        except Exception as e:
            logger.error(f"Error getting table schema: {e}")
            return f"Error retrieving schema: {str(e)}"
    
    def create_chart_config(self, chart_type: str, data_description: str) -> str:
        """Create a chart configuration based on data description."""
        try:
            config = {
                "type": chart_type,
                "title": f"Chart for {data_description}",
                "description": data_description
            }
            return json.dumps(config, indent=2)
        except Exception as e:
            logger.error(f"Error creating chart config: {e}")
            return f"Error creating chart configuration: {str(e)}"
    
    def analyze_query_performance(self, sql_query: str) -> str:
        """Analyze SQL query performance and provide optimization suggestions."""
        try:
            # Basic query analysis - could be enhanced with actual performance metrics
            suggestions = []
            
            if "SELECT *" in sql_query.upper():
                suggestions.append("Consider specifying only needed columns instead of SELECT *")
            
            if "ORDER BY" not in sql_query.upper() and "LIMIT" in sql_query.upper():
                suggestions.append("Consider adding ORDER BY when using LIMIT")
            
            if suggestions:
                return "Performance suggestions:\n" + "\n".join(f"- {s}" for s in suggestions)
            else:
                return "Query looks well-optimized"
        except Exception as e:
            logger.error(f"Error analyzing query performance: {e}")
            return f"Error analyzing query: {str(e)}"
    
    def simple_data_query(self, question: str) -> str:
        """Execute simple data queries for general employees."""
        try:
            # Simplified interface for non-analysts
            return f"Processing simple query: {question}"
        except Exception as e:
            logger.error(f"Error in simple data query: {e}")
            return f"Error processing query: {str(e)}"
    
    def get_basic_analytics(self, metric: str) -> str:
        """Get basic analytics for general employees."""
        try:
            # Basic analytics functionality
            return f"Basic analytics for {metric}: [data would be shown here]"
        except Exception as e:
            logger.error(f"Error getting basic analytics: {e}")
            return f"Error retrieving analytics: {str(e)}"

# Global AI service instance
ai_service = AIService() 