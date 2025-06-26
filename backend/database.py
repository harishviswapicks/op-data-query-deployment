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