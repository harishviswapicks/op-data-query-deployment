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
        base_instruction = """You are a helpful AI assistant for a data platform. You provide quick, concise responses to user queries.

IMPORTANT: You have access to powerful tools for data analysis. When users ask about datasets, tables, or data queries, you MUST use the appropriate tools:
- Use list_available_datasets() when asked about available datasets
- Use search_datasets_by_keyword(keyword) to find datasets containing specific terms (e.g., "deposit", "user", "revenue")
- Use list_tables_in_dataset(dataset_id) when asked about tables in a dataset
- Use execute_bigquery(sql_query) when asked to run SQL queries
- Use get_table_schema(table_name) when asked about table structure
- Use preview_table_data(dataset_id, table_id) when asked to preview data

For trend analysis: Start with search_datasets_by_keyword() to find relevant datasets, then explore specific ones.
Always call the appropriate tool functions to get real data instead of giving generic responses."""
        
        if user_role == "analyst":
            return f"""{base_instruction}
            
You specialize in:
- Data analysis and insights using BigQuery tools
- SQL query assistance with real data execution
- Chart and visualization recommendations
- Business intelligence support
- Statistical analysis

When users ask about data:
1. First call the appropriate tool to get actual data
2. Then provide analysis based on the real results
3. Keep responses focused and actionable
4. For complex analysis requests, suggest upgrading to deep research mode

Example: If asked "what datasets are available?", call list_available_datasets() and show the actual results."""
        
        else:  # general_employee
            return f"""{base_instruction}
            
You help with:
- General business questions using real data
- Data exploration with proper tools
- Report generation based on actual datasets
- Simple analytics with real results
- Data interpretation from live sources

When users ask about data:
1. Use the available tools to get real information
2. Present results in clear, non-technical language
3. Focus on actionable insights

Example: If asked "what data do we have?", call list_available_datasets() and explain what's available."""
    
    def _get_deep_agent_instruction(self, user_role: str) -> str:
        """Get system instruction for deep agent based on user role."""
        base_instruction = """You are an advanced AI research assistant for a data platform. You provide comprehensive, detailed analysis and research.

CRITICAL: You have access to powerful BigQuery tools and MUST use them to provide real, data-driven insights:
- ALWAYS call list_available_datasets() when asked about available data
- ALWAYS call search_datasets_by_keyword(keyword) to find datasets containing specific terms
- ALWAYS call list_tables_in_dataset(dataset_id) to explore table structures
- ALWAYS call execute_bigquery(sql_query) to run analytical queries
- ALWAYS call get_table_schema(table_name) to understand data structure
- ALWAYS call preview_table_data(dataset_id, table_id) to examine actual data

For trend analysis: Start with search_datasets_by_keyword() to find relevant datasets efficiently.
Never provide generic responses - always use tools to get real data first, then provide comprehensive analysis."""
        
        if user_role == "analyst":
            return f"""{base_instruction}
            
You specialize in:
- Complex data analysis and statistical modeling using real BigQuery data
- Advanced SQL query optimization with actual execution
- Multi-dimensional data exploration with live datasets
- Predictive analytics based on current data
- Performance analysis using real metrics
- Research methodology with data validation

Your deep research process:
1. Use tools to gather comprehensive data from multiple sources
2. Execute multiple analytical queries to understand patterns
3. Cross-reference different datasets for insights
4. Provide thorough analysis with statistical confidence
5. Show your work with actual data and query results
6. Include actionable recommendations based on real findings

Example: For "analyze user engagement", call list_available_datasets(), explore relevant tables, run engagement queries, and provide data-driven insights."""
        
        else:  # general_employee
            return f"""{base_instruction}
            
You provide:
- Comprehensive research on business questions using real data
- Detailed data explanations with actual examples
- Step-by-step analysis showing your data sources
- Multiple perspectives on data insights from various datasets
- Actionable recommendations based on real findings

Your research approach:
1. Use tools to explore all available data sources
2. Gather relevant information from multiple datasets
3. Present findings in clear, accessible language
4. Provide context and explanations for technical concepts
5. Make complex analysis accessible while maintaining thoroughness

Example: For "how is our business performing?", explore datasets, analyze key metrics, and provide comprehensive business insights."""
    
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
                self.list_available_datasets,
                self.search_datasets_by_keyword,
                self.list_tables_in_dataset,
                self.get_table_schema,
                self.execute_bigquery,
                self.preview_table_data,
                self.create_chart_config,
                self.analyze_query_performance
            ])
        
        # General employee gets simplified data tools
        if user.role == "general_employee":
            tools.extend([
                self.list_available_datasets,
                self.search_datasets_by_keyword,
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
            from bigquery_client import bigquery_service
            
            result = bigquery_service.execute_query(sql_query)
            
            if result["success"]:
                # Format results for AI agent
                summary = f"Query executed successfully!\n"
                summary += f"Rows returned: {result['row_count']}\n"
                summary += f"Columns: {', '.join(result['columns'])}\n\n"
                
                # Include sample data
                if result["data"]:
                    summary += "Sample data:\n"
                    for i, row in enumerate(result["data"][:5]):  # Show first 5 rows
                        summary += f"Row {i+1}: {row}\n"
                    
                    if result["row_count"] > 5:
                        summary += f"... and {result['row_count'] - 5} more rows\n"
                
                return summary
            else:
                return f"Query failed: {result['error']}"
                
        except Exception as e:
            logger.error(f"Error executing BigQuery: {e}")
            return f"Error executing query: {str(e)}"
    
    def get_table_schema(self, table_name: str) -> str:
        """Get schema information for a BigQuery table."""
        try:
            from bigquery_client import bigquery_service
            
            # Parse table name (dataset.table)
            if "." in table_name:
                dataset_id, table_id = table_name.split(".", 1)
            else:
                # Default dataset if none specified
                dataset_id = "your_dataset"
                table_id = table_name
            
            result = bigquery_service.get_table_schema(dataset_id, table_id)
            
            if result["success"]:
                schema_text = f"Table: {result['table_id']}\n"
                schema_text += f"Rows: {result['row_count']:,}\n"
                schema_text += f"Columns:\n"
                
                for field in result["schema"]:
                    desc = f" - {field['description']}" if field['description'] else ""
                    schema_text += f"  {field['name']} ({field['type']}){desc}\n"
                
                return schema_text
            else:
                return f"Error getting schema: {result['error']}"
                
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
    
    def list_available_datasets(self) -> str:
        """List all available BigQuery datasets."""
        logger.info("🔍 list_available_datasets() called")
        try:
            from bigquery_client import bigquery_service
            logger.info("✅ bigquery_service imported successfully")
            
            datasets = bigquery_service.list_datasets()
            logger.info(f"📊 Found {len(datasets)} datasets")
            
            if not datasets:
                logger.warning("⚠️ No datasets found, returning mock data message")
                return "No datasets found or BigQuery not configured. Using mock data for demonstration."
            
            datasets_text = "Available datasets:\n"
            for dataset in datasets:
                mock_indicator = " (MOCK DATA)" if dataset.get("mock") else ""
                datasets_text += f"📁 {dataset['dataset_id']}{mock_indicator}\n"
                datasets_text += f"   Location: {dataset.get('location', 'Unknown')}\n"
                if dataset.get('created'):
                    datasets_text += f"   Created: {dataset['created']}\n"
                datasets_text += "\n"
            
            logger.info(f"✅ Successfully formatted datasets response (length: {len(datasets_text)})")
            return datasets_text.strip()
            
        except Exception as e:
            logger.error(f"❌ Error in list_available_datasets: {e}")
            import traceback
            logger.error(f"🔧 Full traceback: {traceback.format_exc()}")
            return f"Error listing datasets: {str(e)}"
    
    def search_datasets_by_keyword(self, keyword: str) -> str:
        """Search for datasets that contain the specified keyword in their name."""
        logger.info(f"🔍 search_datasets_by_keyword() called with keyword: {keyword}")
        try:
            from bigquery_client import bigquery_service
            logger.info("✅ bigquery_service imported successfully for search")
            
            datasets = bigquery_service.list_datasets()
            logger.info(f"📊 Searching through {len(datasets)} datasets for keyword: {keyword}")
            
            # Filter datasets by keyword (case-insensitive)
            keyword_lower = keyword.lower()
            matching_datasets = []
            for dataset in datasets:
                dataset_name = dataset['dataset_id'].lower()
                if keyword_lower in dataset_name:
                    matching_datasets.append(dataset)
            
            logger.info(f"🎯 Found {len(matching_datasets)} datasets matching '{keyword}'")
            
            if not matching_datasets:
                return f"No datasets found containing the keyword '{keyword}'. You may want to try different search terms or use list_available_datasets() to see all available datasets."
            
            # Format results
            results_text = f"Found {len(matching_datasets)} datasets containing '{keyword}':\n\n"
            for dataset in matching_datasets:
                results_text += f"📁 {dataset['dataset_id']}\n"
                results_text += f"   Location: {dataset.get('location', 'Unknown')}\n\n"
            
            # Add suggestion for next steps
            if len(matching_datasets) == 1:
                dataset_name = matching_datasets[0]['dataset_id']
                results_text += f"💡 To explore this dataset further, you can use:\n"
                results_text += f"   list_tables_in_dataset('{dataset_name}')"
            elif len(matching_datasets) <= 5:
                results_text += f"💡 To explore any of these datasets, use list_tables_in_dataset() with the dataset name."
            
            logger.info(f"✅ Successfully formatted search results (length: {len(results_text)})")
            return results_text.strip()
            
        except Exception as e:
            logger.error(f"❌ Error in search_datasets_by_keyword: {e}")
            import traceback
            logger.error(f"🔧 Full traceback: {traceback.format_exc()}")
            return f"Error searching datasets by keyword '{keyword}': {str(e)}"
    
    def list_tables_in_dataset(self, dataset_id: str) -> str:
        """List all tables in a specific dataset."""
        logger.info(f"🔍 list_tables_in_dataset() called with dataset_id: {dataset_id}")
        try:
            from bigquery_client import bigquery_service
            logger.info("✅ bigquery_service imported successfully for tables")
            
            tables = bigquery_service.list_tables(dataset_id)
            logger.info(f"📊 Found {len(tables) if tables else 0} tables in dataset '{dataset_id}'")
            
            if not tables:
                logger.warning(f"⚠️ No tables found in dataset '{dataset_id}'")
                return f"No tables found in dataset '{dataset_id}' or dataset doesn't exist."
            
            tables_text = f"Tables in dataset '{dataset_id}':\n\n"
            for table in tables:
                mock_indicator = " (MOCK DATA)" if table.get("mock") else ""
                tables_text += f"📊 {table['table_id']}{mock_indicator}\n"
                tables_text += f"   Rows: {table.get('num_rows', 'Unknown'):,}\n"
                tables_text += f"   Size: {table.get('size_bytes', 0):,} bytes\n"
                if table.get('modified'):
                    tables_text += f"   Modified: {table['modified']}\n"
                tables_text += "\n"
            
            logger.info(f"✅ Successfully formatted tables response (length: {len(tables_text)})")
            return tables_text.strip()
            
        except Exception as e:
            logger.error(f"❌ Error in list_tables_in_dataset: {e}")
            import traceback
            logger.error(f"🔧 Full traceback: {traceback.format_exc()}")
            return f"Error listing tables in dataset '{dataset_id}': {str(e)}"
    
    def preview_table_data(self, dataset_id: str, table_id: str, limit: int = 10) -> str:
        """Preview sample data from a table."""
        try:
            from bigquery_client import bigquery_service
            
            result = bigquery_service.preview_table(dataset_id, table_id, limit)
            
            if not result["success"]:
                return f"Error previewing table: {result.get('error', 'Unknown error')}"
            
            preview_text = f"Preview of {dataset_id}.{table_id} (showing {min(limit, result['row_count'])} of {result['row_count']} rows):\n\n"
            preview_text += f"Columns: {', '.join(result['columns'])}\n\n"
            
            if result["data"]:
                for i, row in enumerate(result["data"][:limit], 1):
                    preview_text += f"Row {i}: {row}\n"
            else:
                preview_text += "No data found in table.\n"
            
            mock_indicator = "\n🔧 Note: This is mock data since BigQuery is not configured." if result.get("mock") else ""
            
            return preview_text + mock_indicator
            
        except Exception as e:
            logger.error(f"Error previewing table: {e}")
            return f"Error previewing table {dataset_id}.{table_id}: {str(e)}"

# Global AI service instance
ai_service = AIService() 