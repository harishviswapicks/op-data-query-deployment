from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum

# Enums
class AgentMode(str, Enum):
    QUICK = "quick"
    DEEP = "deep"

class MessageSender(str, Enum):
    USER = "user"
    QUICK_AGENT = "quick_agent"
    DEEP_AGENT = "deep_agent"

class ResearchJobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class ChartType(str, Enum):
    LINE = "line"
    BAR = "bar"
    PIE = "pie"
    SCATTER = "scatter"
    AREA = "area"

# Base Models
class User(BaseModel):
    id: str
    email: str
    password: Optional[str] = None  # Optional for migration compatibility
    role: Literal["analyst", "general_employee"]
    profile_completed: bool = False  # Track if user has completed profile setup
    user_preferences: Optional[Dict[str, Any]] = None  # Store user preferences and agent config

# Chat Models
class ChatMessage(BaseModel):
    id: str
    content: str
    sender: MessageSender
    username: Optional[str] = None
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str
    agent_mode: AgentMode
    user_id: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    message: ChatMessage
    research_job_id: Optional[str] = None

# BigQuery Models
class BigQueryColumn(BaseModel):
    name: str
    type: str
    nullable: bool
    description: Optional[str] = None

class BigQueryTable(BaseModel):
    id: str
    name: str
    description: str
    schema: List[BigQueryColumn]
    last_updated: datetime
    row_count: int
    data_freshness: Literal["realtime", "hourly", "daily"]
    query_complexity: Literal["simple", "moderate", "complex"]
    estimated_query_time: int

class QueryRequest(BaseModel):
    sql: str
    table_id: Optional[str] = None
    user_id: str

class QueryResponse(BaseModel):
    query_id: str
    results: List[Dict[str, Any]]
    columns: List[str]
    row_count: int
    execution_time: float

# Research Job Models
class ResearchJob(BaseModel):
    id: str
    query: str
    type: Literal["analyst", "general"]
    agent_mode: AgentMode
    status: ResearchJobStatus
    progress: float
    estimated_duration: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    user_id: str
    priority: Literal["low", "normal", "high"]
    results: Optional[Dict[str, Any]] = None

class ResearchJobRequest(BaseModel):
    query: str
    agent_mode: AgentMode
    user_id: str
    priority: Literal["low", "normal", "high"] = "normal"

# Analytics Models
class QuickPreset(BaseModel):
    id: str
    name: str
    description: str
    query: str
    category: str
    estimated_time: int

class AnalyticsRequest(BaseModel):
    preset_id: str
    user_id: str
    parameters: Optional[Dict[str, Any]] = None

class AnalyticsResponse(BaseModel):
    preset_id: str
    results: Dict[str, Any]
    charts: Optional[List[Dict[str, Any]]] = None
    insights: List[str]
    execution_time: float

# Chart Models
class ChartConfig(BaseModel):
    type: ChartType
    title: str
    x_axis: str
    y_axis: str
    data_source: str
    filters: Optional[Dict[str, Any]] = None
    styling: Optional[Dict[str, Any]] = None

class ChartRequest(BaseModel):
    config: ChartConfig
    user_id: str

class ChartResponse(BaseModel):
    chart_id: str
    config: ChartConfig
    data: List[Dict[str, Any]]
    image_url: Optional[str] = None

# Scheduling Models
class ScheduleConfig(BaseModel):
    frequency: Literal["daily", "weekly", "monthly"]
    time: str  # HH:MM format
    timezone: str
    enabled: bool = True

class SlackConfig(BaseModel):
    notification_type: Literal["none", "channel", "dm"]
    slack_channel: Optional[str] = None
    slack_user_id: Optional[str] = None

class ScheduledReport(BaseModel):
    id: str
    name: str
    description: str
    query: str
    schedule: ScheduleConfig
    user_id: str
    created_at: datetime
    last_run: Optional[datetime] = None
    next_run: datetime
    slack_config: Optional[SlackConfig] = None

class ScheduleRequest(BaseModel):
    name: str
    description: str
    query: str
    schedule: ScheduleConfig
    user_id: str
    slack_config: Optional[SlackConfig] = None

# Slack Integration Models
class SlackWorkspace(BaseModel):
    id: str
    team_id: str
    team_name: str
    webhook_url: Optional[str] = None
    created_at: datetime
    is_active: bool = True

class SlackWorkspaceRequest(BaseModel):
    team_id: str
    team_name: str
    bot_token: str
    app_token: Optional[str] = None
    webhook_url: Optional[str] = None

class ReportExecution(BaseModel):
    id: str
    report_id: str
    user_id: str
    status: Literal["pending", "running", "completed", "failed"]
    started_at: datetime
    completed_at: Optional[datetime] = None
    result_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    slack_message_ts: Optional[str] = None

class SlackReportRequest(BaseModel):
    report_id: str
    user_id: str
    force_run: bool = False

# Authentication Models
class TokenData(BaseModel):
    user_id: str
    email: str
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str

class SetPasswordRequest(BaseModel):
    email: str
    password: str

class ResetPasswordRequest(BaseModel):
    user_id: str
    new_password: str

class ProfileSetupRequest(BaseModel):
    email: str
    role: Literal["analyst", "general_employee"]
    preferences: Dict[str, Any]
    agent_config: Dict[str, Any]

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: User
