import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role_targeting = Column(String, nullable=True)
    skills = Column(JSON, nullable=True)             # List[str]
    target_companies = Column(JSON, nullable=True)   # List[str]
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role = Column(String, nullable=False)
    level = Column(String, nullable=False)
    mode = Column(String, default="voice")  # "voice" or "text"
    scheduled_time = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active")  # "active" or "completed"
    
    # Overall Feedback Metrics (populated upon completion)
    overall_score = Column(Integer, nullable=True)
    feedback_summary = Column(Text, nullable=True)
    strengths = Column(JSON, nullable=True)      # List[str]
    weaknesses = Column(JSON, nullable=True)     # List[str]
    
    # Metric scores
    technical_score = Column(Integer, nullable=True)
    communication_score = Column(Integer, nullable=True)
    problem_solving_score = Column(Integer, nullable=True)
    structure_score = Column(Integer, nullable=True)
    
    tech_stack = Column(JSON, nullable=True)     # List[str]
    company_name = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan")

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    user_answer = Column(Text, nullable=True)
    critique = Column(Text, nullable=True)
    score = Column(Integer, nullable=True)
    model_answer = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    answered_at = Column(DateTime, nullable=True)
    question_order = Column(Integer, nullable=False)

    # Relationships
    session = relationship("InterviewSession", back_populates="questions")


class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String, nullable=False)
    tags = Column(JSON, nullable=True)  # List[str]
    problems_count = Column(Integer, default=0)
    mock_questions_count = Column(Integer, default=0)

    # Relationships
    problems = relationship("TrackProblem", back_populates="company", cascade="all, delete-orphan")
    tips = relationship("CompanyTip", back_populates="company", cascade="all, delete-orphan")
    user_tips = relationship("UserFeedbackTip", back_populates="company", cascade="all, delete-orphan")


class TrackProblem(Base):
    __tablename__ = "track_problems"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    link = Column(String, default="/setup")

    # Relationships
    company = relationship("Company", back_populates="problems")


class CompanyTip(Base):
    __tablename__ = "company_tips"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    order = Column(Integer, default=0)

    # Relationships
    company = relationship("Company", back_populates="tips")


class UserFeedbackTip(Base):
    __tablename__ = "user_feedback_tips"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    author = Column(String, nullable=False)
    time_ago = Column(String, nullable=False)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="user_tips")
