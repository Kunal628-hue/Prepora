from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any

# Question Schemas
class InterviewQuestionBase(BaseModel):
    question_text: str
    question_order: int

class InterviewQuestionCreate(InterviewQuestionBase):
    session_id: str

class InterviewQuestionResponse(InterviewQuestionBase):
    id: str
    session_id: str
    user_answer: Optional[str] = None
    critique: Optional[str] = None
    score: Optional[int] = None
    model_answer: Optional[str] = None
    created_at: datetime
    answered_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Session Schemas
class InterviewSessionBase(BaseModel):
    role: str
    level: str
    mode: str = "voice"
    scheduled_time: Optional[str] = None
    tech_stack: Optional[List[str]] = None

class InterviewSessionCreate(InterviewSessionBase):
    user_id: Optional[str] = None

class InterviewSessionResponse(InterviewSessionBase):
    id: str
    user_id: Optional[str] = None
    created_at: datetime
    status: str
    overall_score: Optional[int] = None
    feedback_summary: Optional[str] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    technical_score: Optional[int] = None
    communication_score: Optional[int] = None
    problem_solving_score: Optional[int] = None
    structure_score: Optional[int] = None
    questions: List[InterviewQuestionResponse] = []

    class Config:
        from_attributes = True

class InterviewSessionListResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    role: str
    level: str
    mode: str
    scheduled_time: Optional[str] = None
    created_at: datetime
    status: str
    overall_score: Optional[int] = None
    tech_stack: Optional[List[str]] = None

    class Config:
        from_attributes = True

# Request Schemas
class AnswerSubmitRequest(BaseModel):
    answer: str

class AnswerSubmitResponse(BaseModel):
    critique: str
    score: int
    model_answer: str
    next_question: Optional[InterviewQuestionResponse] = None
    is_finished: bool

# User Schemas
class UserSignupRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role_targeting: Optional[str] = "Fresher"
    skills: Optional[List[str]] = []
    target_companies: Optional[List[str]] = []
    scheduled_time: Optional[str] = None  # Step 3 calendar slot

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role_targeting: Optional[str] = None
    skills: Optional[List[str]] = []
    target_companies: Optional[List[str]] = []
    created_at: datetime

    class Config:
        from_attributes = True

