from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import os
from typing import Generator

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# Create SQLAlchemy engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Database models
class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable for migration compatibility
    role = Column(String, nullable=False, default="analyst")
    profile_completed = Column(Boolean, nullable=False, default=False)  # Track profile setup completion
    user_preferences = Column(JSON, nullable=True)  # Store user preferences and agent config
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChatMessageDB(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    sender = Column(String, nullable=False)
    username = Column(String, nullable=True)
    user_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    message_metadata = Column(JSON, nullable=True)

class ResearchJobDB(Base):
    __tablename__ = "research_jobs"
    
    id = Column(String, primary_key=True, index=True)
    query = Column(Text, nullable=False)
    type = Column(String, nullable=False)
    agent_mode = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    progress = Column(String, nullable=False, default="0.0")
    estimated_duration = Column(String, nullable=False, default="300")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    user_id = Column(String, nullable=False)
    priority = Column(String, nullable=False, default="normal")
    results = Column(JSON, nullable=True)

class ScheduledReportDB(Base):
    __tablename__ = "scheduled_reports"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    query = Column(Text, nullable=False)
    schedule_config = Column(JSON, nullable=False)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_run = Column(DateTime, nullable=True)
    next_run = Column(DateTime, nullable=False)
    enabled = Column(Boolean, default=True)
    # Slack integration fields
    slack_channel = Column(String, nullable=True)
    slack_user_id = Column(String, nullable=True)
    notification_type = Column(String, nullable=False, default="none")  # none, channel, dm

class SlackWorkspaceDB(Base):
    __tablename__ = "slack_workspaces"
    
    id = Column(String, primary_key=True, index=True)
    team_id = Column(String, nullable=False, unique=True)
    team_name = Column(String, nullable=False)
    bot_token = Column(String, nullable=False)
    app_token = Column(String, nullable=True)
    webhook_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class ReportExecutionDB(Base):
    __tablename__ = "report_executions"
    
    id = Column(String, primary_key=True, index=True)
    report_id = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending, running, completed, failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    result_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    slack_message_ts = Column(String, nullable=True)  # Slack message timestamp for updates

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database operations
def get_user_by_email(db: Session, email: str) -> UserDB:
    return db.query(UserDB).filter(UserDB.email == email).first()

def get_user_by_id(db: Session, user_id: str) -> UserDB:
    return db.query(UserDB).filter(UserDB.id == user_id).first()

def create_user(db: Session, user_id: str, email: str, role: str = "analyst") -> UserDB:
    db_user = UserDB(
        id=user_id,
        email=email,
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_password(db: Session, user_id: str, password_hash: str) -> bool:
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db_user.password_hash = password_hash
        db_user.updated_at = datetime.utcnow()
        db.commit()
        return True
    return False

def update_user_profile(db: Session, user_id: str, role: str, preferences: dict) -> bool:
    """Update user profile completion status and preferences"""
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db_user.role = role
        db_user.profile_completed = True
        db_user.user_preferences = preferences
        db_user.updated_at = datetime.utcnow()
        db.commit()
        return True
    return False

def create_chat_message(db: Session, message_id: str, content: str, sender: str, user_id: str, username: str = None, metadata: dict = None) -> ChatMessageDB:
    db_message = ChatMessageDB(
        id=message_id,
        content=content,
        sender=sender,
        user_id=user_id,
        username=username,
        message_metadata=metadata
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_chat_history(db: Session, user_id: str, limit: int = 50, offset: int = 0) -> list[ChatMessageDB]:
    return db.query(ChatMessageDB).filter(
        ChatMessageDB.user_id == user_id
    ).order_by(ChatMessageDB.timestamp.desc()).offset(offset).limit(limit).all()

def clear_chat_history(db: Session, user_id: str) -> bool:
    deleted_count = db.query(ChatMessageDB).filter(ChatMessageDB.user_id == user_id).delete()
    db.commit()
    return deleted_count > 0

# Scheduled Report operations
def create_scheduled_report(db: Session, report_data: dict) -> ScheduledReportDB:
    db_report = ScheduledReportDB(**report_data)
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def get_scheduled_reports(db: Session, user_id: str = None, enabled_only: bool = True) -> list[ScheduledReportDB]:
    query = db.query(ScheduledReportDB)
    if user_id:
        query = query.filter(ScheduledReportDB.user_id == user_id)
    if enabled_only:
        query = query.filter(ScheduledReportDB.enabled == True)
    return query.all()

def get_scheduled_report_by_id(db: Session, report_id: str) -> ScheduledReportDB:
    return db.query(ScheduledReportDB).filter(ScheduledReportDB.id == report_id).first()

def update_scheduled_report(db: Session, report_id: str, update_data: dict) -> ScheduledReportDB:
    db_report = get_scheduled_report_by_id(db, report_id)
    if db_report:
        for key, value in update_data.items():
            setattr(db_report, key, value)
        db.commit()
        db.refresh(db_report)
    return db_report

def delete_scheduled_report(db: Session, report_id: str) -> bool:
    deleted_count = db.query(ScheduledReportDB).filter(ScheduledReportDB.id == report_id).delete()
    db.commit()
    return deleted_count > 0

# Slack Workspace operations
def create_slack_workspace(db: Session, workspace_data: dict) -> SlackWorkspaceDB:
    db_workspace = SlackWorkspaceDB(**workspace_data)
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    return db_workspace

def get_slack_workspace_by_team_id(db: Session, team_id: str) -> SlackWorkspaceDB:
    return db.query(SlackWorkspaceDB).filter(SlackWorkspaceDB.team_id == team_id).first()

def get_active_slack_workspaces(db: Session) -> list[SlackWorkspaceDB]:
    return db.query(SlackWorkspaceDB).filter(SlackWorkspaceDB.is_active == True).all()

# Report Execution operations
def create_report_execution(db: Session, execution_data: dict) -> ReportExecutionDB:
    db_execution = ReportExecutionDB(**execution_data)
    db.add(db_execution)
    db.commit()
    db.refresh(db_execution)
    return db_execution

def update_report_execution(db: Session, execution_id: str, update_data: dict) -> ReportExecutionDB:
    db_execution = db.query(ReportExecutionDB).filter(ReportExecutionDB.id == execution_id).first()
    if db_execution:
        for key, value in update_data.items():
            setattr(db_execution, key, value)
        db.commit()
        db.refresh(db_execution)
    return db_execution

def get_reports_due_for_execution(db: Session) -> list[ScheduledReportDB]:
    """Get reports that are due for execution"""
    current_time = datetime.utcnow()
    return db.query(ScheduledReportDB).filter(
        ScheduledReportDB.enabled == True,
        ScheduledReportDB.next_run <= current_time
    ).all() 