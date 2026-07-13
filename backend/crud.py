from sqlalchemy.orm import Session
from backend.models import InterviewSession, InterviewQuestion, User
from backend.schemas import InterviewSessionCreate, InterviewQuestionCreate
from backend import schemas
from datetime import datetime

def get_session(db: Session, session_id: str):
    return db.query(InterviewSession).filter(InterviewSession.id == session_id).first()

def get_sessions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).offset(skip).limit(limit).all()

def get_sessions_by_user(db: Session, user_id: str, skip: int = 0, limit: int = 100):
    return db.query(InterviewSession).filter(InterviewSession.user_id == user_id).order_by(InterviewSession.created_at.desc()).offset(skip).limit(limit).all()

def create_session(db: Session, session_in: InterviewSessionCreate):
    db_session = InterviewSession(
        user_id=session_in.user_id,
        role=session_in.role,
        level=session_in.level,
        mode=session_in.mode,
        scheduled_time=session_in.scheduled_time,
        tech_stack=session_in.tech_stack,
        company_name=session_in.company_name,
        status="active"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

# User CRUD Helpers
import bcrypt

import hashlib

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Try bcrypt verification
    try:
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        pass
        
    # Fallback to legacy sha256 matching
    try:
        legacy_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
        return legacy_hash == hashed_password
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email.lower().strip()).first()

def get_user(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user_in: schemas.UserSignupRequest):
    # Hash password using direct bcrypt helper
    password_hash = get_password_hash(user_in.password)
    db_user = User(
        full_name=user_in.full_name,
        email=user_in.email.lower().strip(),
        password_hash=password_hash,
        role_targeting=user_in.role_targeting,
        skills=user_in.skills,
        target_companies=user_in.target_companies
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_question(db: Session, question_in: InterviewQuestionCreate):
    db_question = InterviewQuestion(
        session_id=question_in.session_id,
        question_text=question_in.question_text,
        question_order=question_in.question_order
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def update_question(db: Session, question_id: str, **kwargs):
    db_question = db.query(InterviewQuestion).filter(InterviewQuestion.id == question_id).first()
    if db_question:
        for key, value in kwargs.items():
            setattr(db_question, key, value)
        db.commit()
        db.refresh(db_question)
    return db_question

def update_session(db: Session, session_id: str, **kwargs):
    db_session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if db_session:
        for key, value in kwargs.items():
            setattr(db_session, key, value)
        db.commit()
        db.refresh(db_session)
    return db_session

def update_user(db: Session, user_id: str, **kwargs):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        for key, value in kwargs.items():
            if value is not None:
                setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user

