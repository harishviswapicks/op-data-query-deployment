# AI Data Platform - Analyst Backend

FastAPI backend for the AI Data Platform analyst functionality. This backend provides comprehensive APIs for data analysis, BigQuery integration, research jobs, chart generation, and scheduling.

## Features

- **Chat Interface**: Support for both quick and deep research modes
- **BigQuery Integration**: Table browsing, schema inspection, and query execution
- **Research Jobs**: Long-running deep analysis tasks with progress tracking
- **Quick Analytics**: Pre-built analysis presets for common tasks
- **Chart Generation**: Data visualization capabilities
- **Scheduling**: Recurring reports and analysis
- **Authentication**: JWT-based authentication with role-based access

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run the application:
```bash
uvicorn main:app --reload --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints Overview

### Authentication (`/api/auth`)
- `POST /validate` - Validate JWT token
- `POST /refresh` - Refresh JWT token
- `GET /me` - Get current user information

### Chat (`/api/chat`)
- `POST /send` - Send message to AI agent (quick/deep mode)
- `GET /history/{user_id}` - Get chat history
- `DELETE /history/{user_id}` - Clear chat history
- `POST /upgrade-to-deep` - Upgrade query to deep research

### BigQuery (`/api/bigquery`)
- `GET /tables` - Get available BigQuery tables
- `GET /tables/{table_id}` - Get table details
- `GET /tables/{table_id}/schema` - Get table schema
- `GET /tables/{table_id}/preview` - Preview table data
- `POST /query` - Execute SQL query
- `GET /query/{query_id}/status` - Get query status
- `GET /query/{query_id}/results` - Get query results
- `POST /validate-query` - Validate SQL syntax

### Research Jobs (`/api/research`)
- `POST /jobs` - Create research job
- `GET /jobs` - Get research jobs
- `GET /jobs/{job_id}` - Get job details
- `PUT /jobs/{job_id}/cancel` - Cancel job
- `GET /jobs/{job_id}/progress` - Get job progress
- `GET /jobs/{job_id}/results` - Get job results
- `DELETE /jobs/{job_id}` - Delete job
- `GET /jobs/active/count` - Get active jobs count

### Analytics (`/api/analytics`)
- `GET /presets` - Get quick analysis presets
- `GET /presets/{preset_id}` - Get preset details
- `POST /presets/{preset_id}/execute` - Execute preset
- `GET /kpis/daily` - Get daily KPIs
- `GET /kpis/weekly` - Get weekly KPIs
- `GET /user-growth` - Get user growth metrics
- `GET /revenue/breakdown` - Get revenue breakdown
- `GET /sports/top-performers` - Get top performers
- `GET /insights/trending` - Get trending insights

### Charts (`/api/charts`)
- `POST /create` - Create chart
- `GET /templates` - Get chart templates
- `GET /{chart_id}` - Get chart
- `PUT /{chart_id}` - Update chart
- `DELETE /{chart_id}` - Delete chart
- `POST /{chart_id}/export` - Export chart
- `GET /user/{user_id}` - Get user charts
- `POST /generate-from-query` - Generate chart from SQL

### Scheduling (`/api/scheduling`)
- `POST /reports` - Create scheduled report
- `GET /reports` - Get scheduled reports
- `GET /reports/{report_id}` - Get report details
- `PUT /reports/{report_id}` - Update report
- `DELETE /reports/{report_id}` - Delete report
- `PUT /reports/{report_id}/enable` - Enable report
- `PUT /reports/{report_id}/disable` - Disable report
- `POST /reports/{report_id}/run` - Run report now
- `GET /reports/{report_id}/history` - Get execution history
- `GET /next-runs` - Get upcoming runs

## Data Models

### Core Models
- `User` - User information and role
- `ChatMessage` - Chat message with metadata
- `BigQueryTable` - Table schema and metadata
- `ResearchJob` - Long-running analysis job
- `QuickPreset` - Pre-built analysis template
- `ChartConfig` - Chart configuration and styling
- `ScheduledReport` - Recurring report configuration

### Agent Modes
- **Quick Mode**: Fast responses (<30 seconds), immediate insights
- **Deep Mode**: Comprehensive analysis (5-10 minutes), background processing

## Architecture

```
Frontend (Next.js) → Backend (FastAPI) → BigQuery/Database
                                      → Research Queue (Celery)
                                      → Chart Generation
                                      → Scheduling System
```

## Development

### Project Structure
```
backend/
├── main.py              # FastAPI application
├── models.py            # Pydantic models
├── requirements.txt     # Dependencies
├── routers/            # API route modules
│   ├── auth.py         # Authentication
│   ├── chat.py         # Chat interface
│   ├── bigquery.py     # BigQuery integration
│   ├── research.py     # Research jobs
│   ├── analytics.py    # Quick analytics
│   ├── charts.py       # Chart generation
│   └── scheduling.py   # Report scheduling
└── README.md           # This file
```

### Adding New Endpoints

1. Define models in `models.py`
2. Create router in `routers/`
3. Add router to `main.py`
4. Implement endpoint logic
5. Add tests

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/dbname

# BigQuery
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
BIGQUERY_PROJECT_ID=your-project-id

# Redis (for Celery)
REDIS_URL=redis://localhost:6379

# JWT
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002
```

## Next Steps

1. Implement authentication logic
2. Set up BigQuery connection
3. Implement chat processing logic
4. Set up Celery for background jobs
5. Implement chart generation
6. Set up scheduling system
7. Add comprehensive error handling
8. Add logging and monitoring
9. Write tests
10. Deploy to production

## Contributing

1. Follow FastAPI best practices
2. Use type hints throughout
3. Add docstrings to all endpoints
4. Include proper error handling
5. Write tests for new features
