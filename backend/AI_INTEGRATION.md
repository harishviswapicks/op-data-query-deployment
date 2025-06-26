# AI Integration Guide

## Overview

This document explains the AI functionality that has been integrated into the operational-data-querying backend using the ai-toolkit.

## What's Been Integrated

### 1. Core AI Framework
- **Agent Class**: Powerful AI agent wrapper around Google Gemini models
- **Automatic Function Calling**: AI can call Python functions based on natural language
- **Memory Management**: Maintains conversation context across interactions
- **Role-Based Agents**: Different capabilities for analysts vs general employees

### 2. AI Service (`backend/ai/service.py`)
- **AIService Class**: Main service that integrates AI with the FastAPI backend
- **Role-Based Tools**: Different AI tools available based on user role
- **System Instructions**: Customized prompts for quick vs deep analysis modes

### 3. Chat Integration (`backend/routers/chat.py`)
- **Send Message**: AI-powered chat with quick/deep modes
- **Chat History**: Retrieve conversation history (basic implementation)
- **Clear History**: Clear user chat history
- **Upgrade to Deep**: Convert quick queries to comprehensive analysis

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Environment Variables
```bash
# Required: Google API key for Gemini
export GOOGLE_API_KEY="your-google-api-key-here"

# Optional: Google Cloud Project (for BigQuery integration)
export GOOGLE_CLOUD_PROJECT="your-project-id"
```

### 3. Test the Integration
```bash
cd backend
python test_ai.py
```

## Agent Modes

### Quick Mode (`gemini-1.5-flash`)
- **Purpose**: Fast, immediate responses
- **Use Cases**: Simple questions, quick analysis, basic data exploration
- **Response Time**: ~1-3 seconds
- **Capabilities**: Basic tools, concise answers

### Deep Mode (`gemini-2.0-flash-exp`)
- **Purpose**: Comprehensive analysis and research
- **Use Cases**: Complex analysis, detailed research, multi-step problem solving
- **Response Time**: ~5-15 seconds
- **Capabilities**: Advanced tools, thorough analysis

## User Roles

### Analyst Role
**Available Tools:**
- `get_user_info`: Retrieve user information
- `save_chat_message`: Save conversation to database
- `get_chat_history`: Retrieve conversation history
- `execute_bigquery`: Execute SQL queries (placeholder)
- `get_table_schema`: Get database schema information
- `create_chart_config`: Generate chart configurations
- `analyze_query_performance`: SQL optimization suggestions

### General Employee Role
**Available Tools:**
- `get_user_info`: Retrieve user information
- `save_chat_message`: Save conversation to database
- `get_chat_history`: Retrieve conversation history
- `simple_data_query`: Simplified data queries
- `get_basic_analytics`: Basic analytics functionality

## API Endpoints

### Send Message
```bash
POST /api/chat/send
Content-Type: application/json

{
  "message": "What are the top 5 sales performers this quarter?",
  "agent_mode": "quick",
  "user_id": "user-123",
  "context": {}
}
```

### Get Chat History
```bash
GET /api/chat/history/{user_id}?limit=50&offset=0
```

### Clear Chat History
```bash
DELETE /api/chat/history/{user_id}
```

### Upgrade to Deep Research
```bash
POST /api/chat/upgrade-to-deep
Content-Type: application/json

{
  "message": "Analyze quarterly sales performance",
  "user_id": "user-123"
}
```

## Example Usage

### Quick Analysis
```python
# User asks: "What's our revenue this month?"
# Quick agent responds with: "Based on the available data tools, I can help you analyze revenue. Let me check..."
```

### Deep Analysis
```python
# User asks: "Analyze our customer acquisition trends and predict next quarter"
# Deep agent provides: Comprehensive analysis with multiple data points, statistical insights, and predictions
```

## Integration Points

### 1. Database Integration
- Chat messages are saved to the database
- User information is retrieved from the database
- Chat history is maintained per user

### 2. BigQuery Integration (Ready for Implementation)
- `execute_bigquery` tool is prepared for SQL query execution
- `get_table_schema` tool can retrieve database schema
- Natural language to SQL conversion capability

### 3. Chart Generation
- `create_chart_config` tool generates chart configurations
- Integration ready for visualization libraries

## Next Steps

### 1. Complete BigQuery Integration
```python
def execute_bigquery(self, sql_query: str) -> str:
    # Implement actual BigQuery execution
    # Use existing BigQuery client from the project
    pass
```

### 2. Enhance Tool Functions
- Add more sophisticated data analysis tools
- Implement actual chart generation
- Add file upload/download capabilities

### 3. Memory and Persistence
- Implement conversation memory across sessions
- Add conversation export/import
- Enhance message metadata

### 4. Advanced Features
- Add streaming responses for long analyses
- Implement multi-agent conversations
- Add scheduled analysis capabilities

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```bash
   # Set your Google API key
   export GOOGLE_API_KEY="your-key-here"
   ```

2. **Import Errors**
   ```bash
   # Install missing dependencies
   pip install google-genai termcolor tabulate
   ```

3. **Database Connection Issues**
   ```bash
   # Ensure database is initialized
   python -c "from database import create_tables; create_tables()"
   ```

### Testing
```bash
# Test AI functionality
python test_ai.py

# Test full backend
python main.py
```

## Architecture

```
Frontend Request
    ↓
FastAPI Router (/api/chat/send)
    ↓
AI Service (ai/service.py)
    ↓
Agent Creation (role-based)
    ↓
Gemini API (google-genai)
    ↓
Tool Execution (if needed)
    ↓
Database Operations
    ↓
Response to Frontend
```

## Security Considerations

- API keys are stored in environment variables
- User authentication is enforced on all endpoints
- Users can only access their own chat history
- Tool access is role-based and restricted

## Performance

- **Quick Mode**: ~1-3 seconds response time
- **Deep Mode**: ~5-15 seconds response time
- **Memory**: Conversation history maintained in memory during session
- **Concurrency**: Supports multiple simultaneous conversations

This AI integration provides a solid foundation for building intelligent data analysis capabilities into your platform! 