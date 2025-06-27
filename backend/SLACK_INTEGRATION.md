# Slack Integration for Automated Report Generation

## Overview

This system provides automated report generation with Slack notifications, allowing you to:

- Schedule daily, weekly, or monthly reports
- Send reports to Slack channels or direct messages
- Use AI agents to generate comprehensive reports
- Monitor report execution status
- Manage multiple Slack workspaces

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Scheduled     │    │     Celery       │    │   AI Agents     │
│    Reports      ├────┤   Task Queue     ├────┤   (Gemini)      │
│   Database      │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FastAPI       │    │   Report         │    │   Slack         │
│    Endpoints    │    │   Generator      │    │   Service       │
│                 │    │   Service        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Add the following to your `.env` file:

```bash
# Required: Google API Key for AI agents
GOOGLE_API_KEY="your-google-api-key"

# Required: Redis for Celery
CELERY_BROKER_URL="redis://localhost:6379/0"
CELERY_RESULT_BACKEND="redis://localhost:6379/0"

# Optional: Google Cloud Project for BigQuery
GOOGLE_CLOUD_PROJECT="your-project-id"
```

### 3. Database Setup

The system will automatically create the required tables:

```bash
cd backend
python -c "from database import create_tables; create_tables()"
```

### 4. Start Services

Start the main FastAPI application:

```bash
cd backend
python main.py
```

In another terminal, start the Celery services:

```bash
cd backend
./start_celery.sh
```

## Slack Setup

### 1. Create a Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Enter your app name and select your workspace

### 2. Configure Bot Permissions

Add the following OAuth scopes to your bot:

**Bot Token Scopes:**
- `channels:read` - View basic information about public channels
- `chat:write` - Send messages as the bot
- `users:read` - View people in the workspace
- `im:write` - Send direct messages

### 3. Install App to Workspace

1. Install the app to your workspace
2. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 4. Add Slack Workspace to System

```bash
curl -X POST "http://localhost:8000/api/scheduling/slack/workspace" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "team_id": "YOUR_TEAM_ID",
  "team_name": "Your Team Name",
  "bot_token": "xoxb-your-bot-token"
}'
```

## Usage

### 1. Create Scheduled Report

```bash
curl -X POST "http://localhost:8000/api/scheduling/reports" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "name": "Daily Sales Report",
  "description": "Daily sales performance analysis",
  "query": "SELECT * FROM sales WHERE date >= CURRENT_DATE - INTERVAL 1 DAY",
  "schedule": {
    "frequency": "daily",
    "time": "09:00",
    "timezone": "UTC",
    "enabled": true
  },
  "user_id": "your-user-id",
  "slack_config": {
    "notification_type": "channel",
    "slack_channel": "#sales-reports"
  }
}'
```

### 2. Schedule Configuration Options

**Frequency Options:**
- `daily` - Runs every day
- `weekly` - Runs every week
- `monthly` - Runs every month

**Slack Notification Types:**
- `none` - No Slack notification
- `channel` - Send to a specific channel
- `dm` - Send as direct message

### 3. Managing Reports

**List Reports:**
```bash
curl -X GET "http://localhost:8000/api/scheduling/reports" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Run Report Immediately:**
```bash
curl -X POST "http://localhost:8000/api/scheduling/reports/{report_id}/run" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Upcoming Runs:**
```bash
curl -X GET "http://localhost:8000/api/scheduling/next-runs?hours=24" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Tables

### scheduled_reports
Stores scheduled report configurations:
- `id` - Unique report identifier
- `name` - Report name
- `description` - Report description
- `query` - SQL query or analysis prompt
- `schedule_config` - JSON schedule configuration
- `user_id` - Owner user ID
- `next_run` - Next scheduled execution time
- `enabled` - Whether the report is active
- `notification_type` - Slack notification type
- `slack_channel` - Target Slack channel
- `slack_user_id` - Target Slack user for DMs

### report_executions
Tracks report execution history:
- `id` - Execution identifier
- `report_id` - Associated report
- `status` - Execution status (pending, running, completed, failed)
- `started_at` - Execution start time
- `completed_at` - Execution completion time
- `result_data` - Generated report data
- `error_message` - Error details if failed
- `slack_message_ts` - Slack message timestamp

### slack_workspaces
Manages Slack workspace configurations:
- `id` - Workspace identifier
- `team_id` - Slack team ID
- `team_name` - Slack team name
- `bot_token` - Slack bot token
- `is_active` - Whether workspace is active

## Celery Tasks

### Scheduled Tasks

1. **check-scheduled-reports** (Every minute)
   - Finds reports due for execution
   - Queues report generation tasks

2. **cleanup-old-executions** (Daily at 2 AM UTC)
   - Removes old execution records
   - Keeps last 30 days by default

3. **health-check** (Every 15 minutes)
   - Monitors system health
   - Checks database connectivity
   - Reports active tasks

### On-Demand Tasks

1. **generate-single-report**
   - Generates individual reports
   - Updates execution status
   - Sends Slack notifications

2. **force-run-report**
   - Immediately executes a report
   - Bypasses schedule checks

3. **bulk-report-generation**
   - Processes multiple reports
   - Provides progress updates

## AI Integration

### Agent Modes

**Quick Mode (`gemini-1.5-flash`):**
- Fast responses (1-3 seconds)
- Basic analysis
- Simple queries

**Deep Mode (`gemini-2.0-flash-exp`):**
- Comprehensive analysis (5-15 seconds)
- Complex insights
- Detailed recommendations

### Report Generation Process

1. **Prompt Creation**: AI-optimized prompts based on:
   - Report query/description
   - Schedule frequency (daily/weekly/monthly)
   - User role (analyst/general employee)

2. **AI Processing**: 
   - Uses appropriate agent mode
   - Generates structured analysis
   - Extracts key insights and metrics

3. **Report Formatting**:
   - Structures AI response
   - Creates Slack-formatted blocks
   - Includes charts and tables

## Slack Message Format

Reports are sent as rich Slack messages with:

### Header
- Report name with 📊 icon
- Execution timestamp

### Content Sections
- **Description**: Report purpose and scope
- **Summary**: Key findings from AI analysis
- **Key Metrics**: Important numbers and KPIs
- **Data Tables**: Formatted data display
- **Insights**: AI-generated insights
- **Recommendations**: Actionable next steps

### Footer
- Generation timestamp
- Report execution details

## Monitoring and Troubleshooting

### Health Check Endpoint

```bash
curl -X GET "http://localhost:8000/api/health" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Slack Integration

```bash
curl -X GET "http://localhost:8000/api/scheduling/slack/test/YOUR_TEAM_ID" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### View Celery Status

```bash
# Check active tasks
celery -A tasks.celery_app inspect active

# Check worker stats
celery -A tasks.celery_app inspect stats

# Monitor task events
celery -A tasks.celery_app events
```

### Common Issues

1. **Reports Not Running**
   - Check Celery worker is running
   - Verify Redis is accessible
   - Check report `enabled` status

2. **Slack Messages Not Sending**
   - Verify bot token is valid
   - Check bot permissions
   - Ensure channel/user exists

3. **AI Generation Failing**
   - Verify `GOOGLE_API_KEY` is set
   - Check API quota limits
   - Review error logs

## Performance Considerations

### Scaling

- **Celery Workers**: Increase concurrency for more parallel reports
- **Redis**: Use Redis Cluster for high availability
- **Database**: Consider PostgreSQL for production

### Resource Management

- **Memory**: AI agents consume memory during execution
- **API Limits**: Google Gemini has rate limits
- **Concurrency**: Limit concurrent report generations

### Optimization

- **Caching**: Cache common queries and results
- **Batching**: Group similar reports together
- **Scheduling**: Distribute report times to avoid spikes

## Security

### Authentication
- All endpoints require JWT authentication
- Users can only access their own reports

### API Keys
- Store sensitive keys in environment variables
- Rotate Slack bot tokens regularly
- Monitor API usage

### Data Privacy
- Report data is stored temporarily
- Clean up old executions automatically
- Limit data retention periods

## Advanced Features

### Custom Report Types
- Extend `ReportGenerationService` for custom logic
- Add new AI tools for specific domains
- Create report templates

### Multiple Workspaces
- Support multiple Slack workspaces
- Workspace-specific configurations
- Cross-workspace reporting

### Integration Extensions
- Add Microsoft Teams support
- Email notifications
- Webhook integrations

This system provides a robust foundation for automated reporting with AI-powered insights delivered directly to your team's Slack workspace! 