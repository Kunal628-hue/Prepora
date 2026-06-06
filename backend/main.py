import logging
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from backend.config import settings
from backend.database import engine, Base, get_db
from backend import models, schemas, crud, llm, report
from backend.problems_data import get_all_problems, get_problems_by_category, get_categories, get_total_count

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Initialize database tables
logger.info("Initializing database tables...")
Base.metadata.create_all(bind=engine)

# Check and execute sqlite schema migration for tech_stack JSON column
try:
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("SELECT tech_stack FROM interview_sessions LIMIT 1"))
except Exception:
    logger.info("Database migration: Adding tech_stack column to interview_sessions table...")
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN tech_stack TEXT"))
        logger.info("Database migration successful.")
    except Exception as e:
        logger.error(f"Database migration failed: {e}")

app = FastAPI(title="Prepora API", description="AI Interview Coaching Platform Backend")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "provider": settings.LLM_PROVIDER}

import hashlib

@app.post("/api/auth/signup", response_model=schemas.UserResponse)
async def signup(payload: schemas.UserSignupRequest, db: Session = Depends(get_db)):
    """Create a new user profile and optionally auto-schedule the first mock interview."""
    existing_user = crud.get_user_by_email(db, payload.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email address is already registered.")
    
    # 1. Create the user profile in DB
    db_user = crud.create_user(db, payload)
    
    # 2. If scheduled_time is provided (Onboarding Step 3 calendar slot),
    # auto-generate the first mock session linked to this user profile.
    if payload.scheduled_time:
        logger.info(f"Auto-generating mock interview on signup for user: {db_user.email}")
        role = db_user.role_targeting or "Frontend Engineer"
        level = "Mid-level"
        
        session_in = schemas.InterviewSessionCreate(
            user_id=db_user.id,
            role=role,
            level=level,
            mode="text",  # default mode for onboarding
            scheduled_time=payload.scheduled_time
        )
        db_session = crud.create_session(db, session_in)
        
        # Call LLM to generate the first question
        first_question_text = await llm.generate_first_question(role=role, level=level)
        question_in = schemas.InterviewQuestionCreate(
            session_id=db_session.id,
            question_text=first_question_text,
            question_order=1
        )
        crud.create_question(db, question_in)
        
    return db_user

@app.post("/api/auth/login", response_model=schemas.UserResponse)
def login(payload: schemas.UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate email and password credentials."""
    db_user = crud.get_user_by_email(db, payload.email)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    # Verify password hash
    password_hash = hashlib.sha256(payload.password.encode()).hexdigest()
    if db_user.password_hash != password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    return db_user

@app.post("/api/resume/parse")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    """Upload a resume (PDF/Photo) and parse its target role, level, and tech stack."""
    logger.info(f"Received resume upload: {file.filename}, content_type: {file.content_type}")
    
    # Read file content
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024: # Limit to 10MB
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB.")
        
    mime_type = file.content_type
    # Fallback/normalize common mime types if missing or generic
    if not mime_type or mime_type == "application/octet-stream":
        if file.filename.lower().endswith(".pdf"):
            mime_type = "application/pdf"
        elif file.filename.lower().endswith(".png"):
            mime_type = "image/png"
        elif file.filename.lower().endswith((".jpg", ".jpeg")):
            mime_type = "image/jpeg"
        else:
            mime_type = "application/pdf" # default fallback
            
    parsed_info = await llm.parse_resume(contents, mime_type)
    return parsed_info

@app.post("/api/interviews/start", response_model=schemas.InterviewSessionResponse)
async def start_interview(session_in: schemas.InterviewSessionCreate, db: Session = Depends(get_db)):
    """Initialize a new interview session and generate the first question."""
    logger.info(f"Starting interview session for role: {session_in.role}, level: {session_in.level}")
    
    # 1. Create the session in DB
    db_session = crud.create_session(db, session_in)
    
    # 2. Call LLM to generate the first question, including tech stack
    first_question_text = await llm.generate_first_question(
        role=db_session.role,
        level=db_session.level,
        tech_stack=db_session.tech_stack
    )
    
    # 3. Save the first question in DB
    question_in = schemas.InterviewQuestionCreate(
        session_id=db_session.id,
        question_text=first_question_text,
        question_order=1
    )
    crud.create_question(db, question_in)
    
    # Refresh to load questions relationships
    db.refresh(db_session)
    return db_session

@app.post("/api/interviews/{session_id}/respond", response_model=schemas.AnswerSubmitResponse)
async def submit_response(session_id: str, payload: schemas.AnswerSubmitRequest, db: Session = Depends(get_db)):
    """Evaluate candidate response to current question and generate next question (up to 5 total)."""
    db_session = crud.get_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    if db_session.status != "active":
        raise HTTPException(status_code=400, detail="Interview session is already completed")

    # Find the current question (latest question that has not been answered yet)
    questions = sorted(db_session.questions, key=lambda x: x.question_order)
    if not questions:
         raise HTTPException(status_code=400, detail="No questions generated for this session")
         
    current_q = questions[-1]
    if current_q.user_answer is not None:
         raise HTTPException(status_code=400, detail="Current question has already been answered")

    logger.info(f"Evaluating response for Question {current_q.question_order} in session {session_id}")

    # 1. Evaluate the user's answer
    evaluation = await llm.evaluate_answer(
        question=current_q.question_text,
        answer=payload.answer,
        role=db_session.role,
        level=db_session.level
    )
    
    # 2. Update the current question in DB with feedback
    from datetime import datetime
    crud.update_question(
        db,
        question_id=current_q.id,
        user_answer=payload.answer,
        critique=evaluation.get("critique"),
        score=evaluation.get("score", 0),
        model_answer=evaluation.get("model_answer"),
        answered_at=datetime.utcnow()
    )

    # 3. Determine if interview is finished (limit to 5 questions)
    max_questions = 5
    current_order = current_q.question_order
    is_finished = current_order >= max_questions

    next_q_response = None
    if not is_finished:
        # Build transcript of answered questions so far for context
        answered_turns = []
        # Update db_session relation
        db.refresh(db_session)
        sorted_qs = sorted(db_session.questions, key=lambda x: x.question_order)
        for q in sorted_qs:
            if q.user_answer is not None:
                answered_turns.append({
                    "question": q.question_text,
                    "answer": q.user_answer
                })
        
        # Generate the next question text
        next_question_text = await llm.generate_next_question(
            role=db_session.role,
            level=db_session.level,
            tech_stack=db_session.tech_stack,
            transcript=answered_turns
        )
        
        # Save next question to DB
        next_q_in = schemas.InterviewQuestionCreate(
            session_id=session_id,
            question_text=next_question_text,
            question_order=current_order + 1
        )
        db_next_q = crud.create_question(db, next_q_in)
        next_q_response = schemas.InterviewQuestionResponse.model_validate(db_next_q)
    
    return schemas.AnswerSubmitResponse(
        critique=evaluation.get("critique"),
        score=evaluation.get("score", 0),
        model_answer=evaluation.get("model_answer"),
        next_question=next_q_response,
        is_finished=is_finished
    )

@app.post("/api/interviews/{session_id}/end", response_model=schemas.InterviewSessionResponse)
async def end_interview(
    session_id: str, 
    cheating_detected: bool = False, 
    cheating_details: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """Force complete interview session and trigger overall evaluation & scoring."""
    db_session = crud.get_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    if db_session.status == "completed":
        return db_session

    logger.info(f"Finalizing and evaluating session: {session_id} (Cheating: {cheating_detected})")

    # Build transcript of answered questions
    transcript = []
    for q in db_session.questions:
        # Include questions even if the last one was not answered (we skip it)
        if q.user_answer is not None:
            transcript.append({
                "question": q.question_text,
                "answer": q.user_answer
            })

    if not transcript:
        # If no questions answered, just close session with 0 scores
        feedback = "Interview ended before any questions were answered."
        if cheating_detected:
            feedback = f"[PROCTOR ALERT: SYSTEM TERMINATED] This interview was terminated due to a failure to meet exam integrity guidelines. Specific Cheating Vector(s): {cheating_details or 'Multiple violations'}."
        db_session = crud.update_session(
            db,
            session_id=session_id,
            status="completed",
            overall_score=0,
            feedback_summary=feedback,
            strengths=[],
            weaknesses=[f"Terminated for cheating: {cheating_details}"] if cheating_detected else [],
            technical_score=0,
            communication_score=0,
            problem_solving_score=0,
            structure_score=0
        )
        return db_session

    # 1. Generate final session report cards via LLM
    eval_result = await llm.evaluate_session(
        role=db_session.role,
        level=db_session.level,
        tech_stack=db_session.tech_stack,
        transcript=transcript
    )

    # 2. Adjust scores and feedback if cheating was detected
    if cheating_detected:
        overall_score = 10
        technical_score = 10
        communication_score = 10
        problem_solving_score = 10
        structure_score = 10
        
        detail_msg = cheating_details or "Multiple integrity violations detected"
        feedback_summary = (
            f"[PROCTOR ALERT: SYSTEM TERMINATED] This interview was terminated due to a failure to meet "
            f"exam integrity guidelines. Multiple violations of the proctor constraints were recorded. "
            f"Specific Cheating Vector(s): {detail_msg}.\n\n"
            f"Original Performance feedback: {eval_result.get('feedback_summary', '')}"
        )
        strengths = eval_result.get("strengths", [])
        weaknesses = eval_result.get("weaknesses", []) + [
            f"Failed proctor integrity guidelines (Violations: {detail_msg})"
        ]
    else:
        overall_score = eval_result.get("overall_score", 0)
        feedback_summary = eval_result.get("feedback_summary", "")
        strengths = eval_result.get("strengths", [])
        weaknesses = eval_result.get("weaknesses", [])
        technical_score = eval_result.get("technical_score", 0)
        communication_score = eval_result.get("communication_score", 0)
        problem_solving_score = eval_result.get("problem_solving_score", 0)
        structure_score = eval_result.get("structure_score", 0)

    # 3. Save overall feedback and change status to completed
    db_session = crud.update_session(
        db,
        session_id=session_id,
        status="completed",
        overall_score=overall_score,
        feedback_summary=feedback_summary,
        strengths=strengths,
        weaknesses=weaknesses,
        technical_score=technical_score,
        communication_score=communication_score,
        problem_solving_score=problem_solving_score,
        structure_score=structure_score
    )

    return db_session

@app.get("/api/interviews/{session_id}", response_model=schemas.InterviewSessionResponse)
def get_interview(session_id: str, db: Session = Depends(get_db)):
    db_session = crud.get_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return db_session

@app.get("/api/interviews", response_model=List[schemas.InterviewSessionListResponse])
def list_interviews(user_id: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    if user_id:
        return crud.get_sessions_by_user(db, user_id=user_id, skip=skip, limit=limit)
    return crud.get_sessions(db, skip=skip, limit=limit)

@app.get("/api/interviews/{session_id}/report")
def download_pdf_report(session_id: str, db: Session = Depends(get_db)):
    """Generate and stream the ReportLab PDF evaluation report."""
    db_session = crud.get_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    if db_session.status != "completed":
        raise HTTPException(
            status_code=400, 
            detail="Session report is not available. Please end the interview first."
        )

    # Format session object to dictionary for the report builder
    # Note: SQLAlchemy models need to be parsed to dict
    session_data = {
        "role": db_session.role,
        "level": db_session.level,
        "created_at": db_session.created_at,
        "overall_score": db_session.overall_score,
        "feedback_summary": db_session.feedback_summary,
        "strengths": db_session.strengths,
        "weaknesses": db_session.weaknesses,
        "technical_score": db_session.technical_score,
        "communication_score": db_session.communication_score,
        "problem_solving_score": db_session.problem_solving_score,
        "structure_score": db_session.structure_score,
        "questions": [
            {
                "question_order": q.question_order,
                "question_text": q.question_text,
                "user_answer": q.user_answer,
                "critique": q.critique,
                "score": q.score,
                "model_answer": q.model_answer
            }
            for q in db_session.questions
        ]
    }

    try:
        pdf_stream = report.generate_pdf_report(session_data)
        role_slug = db_session.role.lower().replace(" ", "_")
        filename = f"prepora_report_{role_slug}_{session_id[:8]}.pdf"
        
        return StreamingResponse(
            pdf_stream,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Cache-Control": "no-cache"
            }
        )
    except Exception as e:
        logger.error(f"Error compiling PDF for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

# ──── PROBLEMS / FORGE SHEET ENDPOINTS ────

@app.get("/api/problems")
def list_all_problems(category: Optional[str] = None):
    """Return DSA problems. Optionally filter by category."""
    if category:
        problems = get_problems_by_category(category)
        if not problems:
            raise HTTPException(status_code=404, detail=f"Category '{category}' not found")
        return {"category": category, "count": len(problems), "problems": problems}
    
    all_problems = get_all_problems()
    return {
        "categories": get_categories(),
        "total_count": get_total_count(),
        "problems": all_problems
    }

@app.get("/api/problems/categories")
def list_categories():
    """Return list of all problem categories with counts."""
    all_problems = get_all_problems()
    return {
        "categories": [
            {"name": cat, "count": len(probs)}
            for cat, probs in all_problems.items()
        ],
        "total_count": get_total_count()
    }
