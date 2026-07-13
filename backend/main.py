import logging
from fastapi import FastAPI, Request, Depends, HTTPException, status, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import httpx
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

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

# Check and execute sqlite schema migration for company_name column
try:
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("SELECT company_name FROM interview_sessions LIMIT 1"))
except Exception:
    logger.info("Database migration: Adding company_name column to interview_sessions table...")
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN company_name TEXT"))
        logger.info("Database migration successful.")
    except Exception as e:
        logger.error(f"Database migration failed: {e}")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Prepora API", description="AI Interview Coaching Platform Backend")
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Maximum 10 requests per minute allowed."}
    )

# WebSocket Notifications Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New WebSocket client connected. Active connections count: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Active connections count: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        payload = json.dumps(message)
        logger.info(f"Broadcasting notification message: {payload}")
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")

notification_manager = ConnectionManager()

@app.websocket("/api/notifications/ws")
async def websocket_endpoint(websocket: WebSocket):
    await notification_manager.connect(websocket)
    try:
        while True:
            # Maintain the connection, check for incoming client pings or text
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        notification_manager.disconnect(websocket)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def seed_company_tracks_data(db: Session):
    # Check if we already have companies in the database
    if db.query(models.Company).first() is not None:
        logger.info("Company tracks data already seeded.")
        return

    logger.info("Seeding company tracks database...")

    # Define the 6 companies
    companies_data = [
        {
            "name": "Google",
            "description": "Focus on complex data structures and distributed systems.",
            "difficulty": "HARD",
            "tags": ["SWE", "ML", "SRE"],
            "problems_count": 142,
            "mock_questions_count": 12,
            "problems": [
                {"name": "Median of Two Sorted Arrays", "difficulty": "HARD", "topic": "BINARY SEARCH"},
                {"name": "Text Justification", "difficulty": "HARD", "topic": "STRING"},
                {"name": "Longest Substring with At Most K Distinct Characters", "difficulty": "MEDIUM", "topic": "SLIDING WINDOW"},
                {"name": "Word Ladder", "difficulty": "HARD", "topic": "BFS"},
                {"name": "Two Sum", "difficulty": "EASY", "topic": "HASH TABLE"},
                {"name": "Trapping Rain Water", "difficulty": "HARD", "topic": "TWO POINTERS"},
                {"name": "3Sum", "difficulty": "MEDIUM", "topic": "TWO POINTERS"}
            ],
            "tips": [
                {"title": "Optimize beyond brute force", "content": "Google expects you to provide the most efficient solution possible. While a brute-force approach is a good starting point to show you understand the problem, quickly pivot to analyzing Big O complexity and finding ways to optimize time and space.", "order": 1},
                {"title": "Clarify constraints early", "content": "Before you write a single line of code, ask about the input size, types, and edge cases (e.g., 'Can the array be empty?', 'Are there negative numbers?'). This demonstrates rigorous thinking and prevents rework.", "order": 2},
                {"title": "Think out loud while coding", "content": "The interviewer cares about your thought process as much as your code. Vocalize your logic, explain why you're choosing a specific data structure, and narrate your debugging steps as you go.", "order": 3},
                {"title": "Test your solution manually", "content": "Dry run your code with a small example input. Step through the logic line-by-line to catch off-by-one errors or logical gaps before the interviewer points them out.", "order": 4}
            ],
            "user_tips": [
                {"content": "Focus heavily on Graphs and Trees. My entire onsite was tree traversal and BFS/DFS variations.", "author": "@alex_dev", "time_ago": "2 days ago", "likes": 12},
                {"content": "Don't ignore the behavioral questions. They really do care about how you resolve conflict within a team.", "author": "@sarah_codes", "time_ago": "5 days ago", "likes": 8},
                {"content": "Mentioned scalability once and the interviewer's face lit up. Definitely think about systems even in LeetCode style questions.", "author": "@josh_tech", "time_ago": "1 week ago", "likes": 24}
            ]
        },
        {
            "name": "Amazon",
            "description": "Emphasis on Leadership Principles and scalable architecture.",
            "difficulty": "MEDIUM",
            "tags": ["SWE", "PM", "CLOUD"],
            "problems_count": 98,
            "mock_questions_count": 24,
            "problems": [
                {"name": "LRU Cache", "difficulty": "HARD", "topic": "DESIGN"},
                {"name": "Two Sum", "difficulty": "EASY", "topic": "HASH TABLE"},
                {"name": "Merge Intervals", "difficulty": "MEDIUM", "topic": "SORTING"},
                {"name": "Course Schedule", "difficulty": "MEDIUM", "topic": "GRAPH"},
                {"name": "Best Time to Buy and Sell Stock", "difficulty": "EASY", "topic": "ARRAY"}
            ],
            "tips": [
                {"title": "Study the Leadership Principles", "content": "Amazon aligns all evaluation with the 16 Leadership Principles (LPs). Integrate Customer Obsession and Bias for Action into your design answers.", "order": 1},
                {"title": "STAR behavioral framework", "content": "Structure your answers using Situation, Task, Action, Result. Quantify your achievements (e.g. 'reduced latency by 30%').", "order": 2}
            ],
            "user_tips": [
                {"content": "Make sure you have 2 stories for each Leadership Principle. They will grill you deep.", "author": "@LP_master", "time_ago": "3 days ago", "likes": 15},
                {"content": "The system design portion was heavily focused on scaling their retail services.", "author": "@cloud_architect", "time_ago": "1 week ago", "likes": 19}
            ]
        },
        {
            "name": "Meta",
            "description": "Optimizing for speed and efficiency in algorithmic thinking.",
            "difficulty": "HARD",
            "tags": ["SWE", "FRONTEND", "MOBILE"],
            "problems_count": 115,
            "mock_questions_count": 18,
            "problems": [
                {"name": "3Sum", "difficulty": "MEDIUM", "topic": "TWO POINTERS"},
                {"name": "Subarray Sum Equals K", "difficulty": "MEDIUM", "topic": "HASH TABLE"},
                {"name": "Valid Palindrome", "difficulty": "EASY", "topic": "TWO POINTERS"},
                {"name": "Longest Substring Without Repeating Characters", "difficulty": "MEDIUM", "topic": "SLIDING WINDOW"}
            ],
            "tips": [
                {"title": "Solve 2 medium problems in 45 mins", "content": "Meta's screening is fast-paced. You are expected to code quickly and run through complexity calculations on the fly.", "order": 1},
                {"title": "Facebook-specific products", "content": "Be ready to talk about architecture design for News Feed, Instagram Stories, or WhatsApp Messaging systems.", "order": 2}
            ],
            "user_tips": [
                {"content": "Practice directly from the Meta top-50 tagged LeetCode list. I got verbatim two problems from it.", "author": "@meta_swe", "time_ago": "4 days ago", "likes": 42},
                {"content": "Explain space complexity clearly; they really care about runtime efficiency.", "author": "@fb_coder", "time_ago": "6 days ago", "likes": 11}
            ]
        },
        {
            "name": "Microsoft",
            "description": "Broad focus on OOP design and fundamental data structures.",
            "difficulty": "MEDIUM",
            "tags": ["SWE", "FULLSTACK", "PM"],
            "problems_count": 86,
            "mock_questions_count": 15,
            "problems": [
                {"name": "Reverse Linked List", "difficulty": "EASY", "topic": "LINKED LIST"},
                {"name": "Binary Tree Level Order Traversal", "difficulty": "MEDIUM", "topic": "TREE"},
                {"name": "Valid Parentheses", "difficulty": "EASY", "topic": "STACK"}
            ],
            "tips": [
                {"title": "Master OOP & Design Patterns", "content": "Microsoft values modular, maintainable, and clean code. Be ready to explain SOLID design principles.", "order": 1},
                {"title": "Explain trade-offs clearly", "content": "Always compare multiple solutions (e.g. Iterative vs Recursive) before writing code.", "order": 2}
            ],
            "user_tips": [
                {"content": "Got a lot of questions about Windows OS internals and pointers during my systems interview.", "author": "@c_sharp_guy", "time_ago": "1 day ago", "likes": 5},
                {"content": "Collaborative culture, they want to see how you receive hints and suggestions.", "author": "@ms_dev", "time_ago": "10 days ago", "likes": 9}
            ]
        },
        {
            "name": "Apple",
            "description": "Deep dive into low-level systems and performance optimization.",
            "difficulty": "HARD",
            "tags": ["FIRMWARE", "SWE", "IOS"],
            "problems_count": 74,
            "mock_questions_count": 10,
            "problems": [
                {"name": "Rotate Image", "difficulty": "MEDIUM", "topic": "MATRIX"},
                {"name": "Copy List with Random Pointer", "difficulty": "MEDIUM", "topic": "LINKED LIST"},
                {"name": "Invert Binary Tree", "difficulty": "EASY", "topic": "TREE"}
            ],
            "tips": [
                {"title": "Low-level optimization", "content": "Apple questions often involve raw memory access, pointer arithmetic, or GPU/hardware interface constraints.", "order": 1},
                {"title": "Attention to detail", "content": "Pixel-perfect correctness on frontend/iOS or edge-case safety on systems is heavily tested.", "order": 2}
            ],
            "user_tips": [
                {"content": "Brush up on C/C++ memory management, alignment, and caches.", "author": "@ios_dev_apple", "time_ago": "3 days ago", "likes": 21},
                {"content": "Apple values secrecy and product focus. Mention user experience in design.", "author": "@steve_fan", "time_ago": "2 weeks ago", "likes": 13}
            ]
        },
        {
            "name": "Netflix",
            "description": "Specialized tracks for high-concurrency systems and culture fit.",
            "difficulty": "HARD",
            "tags": ["SYSTEMS", "ML", "SWE"],
            "problems_count": 62,
            "mock_questions_count": 14,
            "problems": [
                {"name": "Number of Islands", "difficulty": "MEDIUM", "topic": "GRAPH"},
                {"name": "Course Schedule II", "difficulty": "MEDIUM", "topic": "GRAPH"},
                {"name": "Climbing Stairs", "difficulty": "EASY", "topic": "DYNAMIC PROGRAMMING"}
            ],
            "tips": [
                {"title": "High throughput systems", "content": "Netflix focuses on real-time stream caching, CDN distribution, and fallback resilience under load.", "order": 1},
                {"title": "Netflix Keeper Test Culture", "content": "Make sure you read their culture deck thoroughly. Freedom and Responsibility is key.", "order": 2}
            ],
            "user_tips": [
                {"content": "System design round asked to architecture a distributed video streaming CDN.", "author": "@concurrency_wizard", "time_ago": "2 days ago", "likes": 31},
                {"content": "Be direct and self-motivated in your behavioral answers. They pay top of market but expect autonomy.", "author": "@netflix_eng", "time_ago": "1 week ago", "likes": 18}
            ]
        }
    ]

    for comp in companies_data:
        db_comp = models.Company(
            name=comp["name"],
            description=comp["description"],
            difficulty=comp["difficulty"],
            tags=comp["tags"],
            problems_count=comp["problems_count"],
            mock_questions_count=comp["mock_questions_count"]
        )
        db.add(db_comp)
        db.flush() # get the company ID

        # Add problems
        for p in comp["problems"]:
            db_p = models.TrackProblem(
                company_id=db_comp.id,
                name=p["name"],
                difficulty=p["difficulty"],
                topic=p["topic"]
            )
            db.add(db_p)

        # Add tips
        for t in comp["tips"]:
            db_t = models.CompanyTip(
                company_id=db_comp.id,
                title=t["title"],
                content=t["content"],
                order=t["order"]
            )
            db.add(db_t)

        # Add user tips
        for ut in comp["user_tips"]:
            db_ut = models.UserFeedbackTip(
                company_id=db_comp.id,
                content=ut["content"],
                author=ut["author"],
                time_ago=ut["time_ago"],
                likes=ut["likes"]
            )
            db.add(db_ut)

    db.commit()
    logger.info("Successfully seeded company tracks data.")

@app.on_event("startup")
def startup_event():
    # LLM Provider Startup Logging
    provider = settings.LLM_PROVIDER
    api_key = settings.GEMINI_API_KEY if provider == "gemini" else settings.GROQ_API_KEY
    masked_key = f"***{api_key[-4:]}" if api_key and len(api_key) >= 4 else "Not Configured"
    logger.info(f"Active LLM Provider: {provider.upper()}")
    logger.info(f"API Key Present: {masked_key}")

    logger.info("Running startup task: Seeding database tables...")
    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        seed_company_tracks_data(db)
    except Exception as e:
        logger.error(f"Seeding database failed: {e}")
    finally:
        db.close()

@app.get("/api/companies", response_model=List[schemas.CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    """Fetch all company tracks from database."""
    companies = db.query(models.Company).all()
    return companies

@app.get("/api/companies/{company_name}", response_model=schemas.CompanyResponse)
def get_company_detail(company_name: str, db: Session = Depends(get_db)):
    """Fetch detail page data for a specific company track (case-insensitive)."""
    company = db.query(models.Company).filter(models.Company.name.ilike(company_name)).first()
    if not company:
        raise HTTPException(status_code=404, detail=f"Company track for '{company_name}' not found.")
    return company

@app.post("/api/companies/{company_id}/tips", response_model=schemas.UserFeedbackTipResponse)
def create_company_user_tip(company_id: str, payload: schemas.UserFeedbackTipCreate, db: Session = Depends(get_db)):
    """Add a new community feedback tip for a company."""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company track not found.")
    
    db_tip = models.UserFeedbackTip(
        company_id=company_id,
        content=payload.content,
        author=payload.author or "@user",
        time_ago=payload.time_ago or "Just now",
        likes=0
    )
    db.add(db_tip)
    db.commit()
    db.refresh(db_tip)
    return db_tip

@app.post("/api/companies/{company_id}/tips/{tip_id}/like", response_model=schemas.UserFeedbackTipResponse)
def like_company_user_tip(company_id: str, tip_id: str, db: Session = Depends(get_db)):
    """Increment the likes counter for a community feedback tip."""
    tip = db.query(models.UserFeedbackTip).filter(
        models.UserFeedbackTip.id == tip_id,
        models.UserFeedbackTip.company_id == company_id
    ).first()
    
    if not tip:
        raise HTTPException(status_code=404, detail="Feedback tip not found.")
    
    tip.likes += 1
    db.commit()
    db.refresh(tip)
    return tip

@app.get("/api/health")
def health_check():
    provider = settings.LLM_PROVIDER
    api_key = settings.GEMINI_API_KEY if provider == "gemini" else settings.GROQ_API_KEY
    return {
        "status": "healthy", 
        "provider": provider,
        "api_key_configured": bool(api_key)
    }

import bcrypt

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
        
    # Verify password hash using direct bcrypt via crud helper
    if not crud.verify_password(payload.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    # Auto-upgrade legacy hash to bcrypt on successful login
    if not (db_user.password_hash.startswith("$2b$") or db_user.password_hash.startswith("$2a$")):
        try:
            db_user.password_hash = crud.get_password_hash(payload.password)
            db.commit()
            logger.info(f"Auto-upgraded legacy SHA-256 password hash to bcrypt for user: {db_user.email}")
        except Exception as e:
            logger.error(f"Failed to auto-upgrade password hash: {e}")
            
    return db_user


@app.post("/api/audio/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe an uploaded audio file using Groq's Whisper API."""
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="Groq API key is not configured. Transcription is unavailable."
        )

    logger.info(f"Received audio transcription request: {file.filename}, content_type: {file.content_type}")
    
    file_bytes = await file.read()
    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}"
    }
    
    files = {
        "file": (file.filename or "audio.webm", file_bytes, file.content_type or "audio/webm")
    }
    data = {
        "model": "whisper-large-v3"
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, headers=headers, files=files, data=data)
            res.raise_for_status()
            res_data = res.json()
            return {"text": res_data.get("text", "")}
    except Exception as e:
        logger.error(f"Error calling Groq Whisper API: {e}")
        raise HTTPException(status_code=500, detail=f"Whisper transcription failed: {str(e)}")

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

import httpx

@app.post("/api/audio/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe audio using Groq's Whisper API."""
    if not settings.GROQ_API_KEY:
        # Fallback if no API key
        return {"text": "I heard something, but speech-to-text requires a Groq API key."}
        
    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}"
    }
    
    file_bytes = await file.read()
    files = {
        "file": (file.filename or "audio.webm", file_bytes, file.content_type or "audio/webm")
    }
    data = {
        "model": "whisper-large-v3",
        "response_format": "json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, headers=headers, data=data, files=files)
            res.raise_for_status()
            res_data = res.json()
            return {"text": res_data.get("text", "")}
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        raise HTTPException(status_code=500, detail="Failed to transcribe audio")

@app.post("/api/interviews/start", response_model=schemas.InterviewSessionResponse)
async def start_interview(session_in: schemas.InterviewSessionCreate, db: Session = Depends(get_db)):
    """Initialize a new interview session and generate the first question."""
    logger.info(f"Starting interview session for role: {session_in.role}, level: {session_in.level}")
    
    # 1. Create the session in DB
    db_session = crud.create_session(db, session_in)
    
    # 2. Call LLM to generate the first question, including tech stack and company
    first_question_text = await llm.generate_first_question(
        role=db_session.role,
        level=db_session.level,
        tech_stack=db_session.tech_stack,
        company_name=db_session.company_name
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
    
    # Broadcast real-time notification
    await notification_manager.broadcast({
        "text": f"🎯 New {db_session.level} {db_session.role} mock interview session initialized!",
        "icon": "🎯"
    })
    
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

    # 1. Evaluate the user's answer (bypass LLM call if question was skipped)
    if payload.answer == "[Question skipped by candidate]":
        evaluation = {
            "critique": "Question skipped by candidate.",
            "score": 0,
            "model_answer": "No benchmark answer generated for skipped questions."
        }
    else:
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
            transcript=answered_turns,
            company_name=db_session.company_name
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

    # Broadcast real-time notification
    grade = "A+" if overall_score >= 95 else "A" if overall_score >= 90 else "A-" if overall_score >= 85 else "B+" if overall_score >= 80 else "B" if overall_score >= 75 else "B-" if overall_score >= 70 else "C+" if overall_score >= 65 else "C" if overall_score >= 60 else "D"
    await notification_manager.broadcast({
        "text": f"🎉 Interview completed! You scored {overall_score}% ({grade}) in the {db_session.role} mock interview.",
        "icon": "🎉"
    })

    return db_session

@app.get("/api/interviews/{session_id}", response_model=schemas.InterviewSessionResponse)
def get_interview(session_id: str, db: Session = Depends(get_db)):
    db_session = crud.get_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return db_session

@app.delete("/api/interviews/{session_id}")
def delete_interview(session_id: str, db: Session = Depends(get_db)):
    """Cancel and delete a scheduled or active mock interview session."""
    logger.info(f"Deleting/Cancelling interview session: {session_id}")
    db_session = crud.get_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    db.delete(db_session)
    db.commit()
    return {"status": "success", "message": "Interview session successfully cancelled."}


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


# ──── NEW AI FEATURE ENDPOINTS ────

@app.post("/api/ai/resume-gap-analysis", response_model=schemas.ResumeGapAnalysisResponse)
@limiter.limit("10/minute")
async def resume_gap_analysis(request: Request, payload: schemas.ResumeGapAnalysisRequest):
    """Analyze resume skills against a job description to find missing skills and provide a roadmap."""
    result = await llm.analyze_resume_gap(
        role=payload.role,
        level=payload.level,
        tech_stack=payload.tech_stack,
        job_description=payload.job_description
    )
    # Broadcast real-time notification
    match_pct = result.match_percentage if hasattr(result, "match_percentage") else result.get("match_percentage", 0) if isinstance(result, dict) else 0
    await notification_manager.broadcast({
        "text": f"📄 Resume gap analysis completed for {payload.role}! Fit Score: {match_pct}%.",
        "icon": "📄"
    })

    return result

@app.post("/api/ai/copilot-hint", response_model=schemas.CopilotHintResponse)
@limiter.limit("10/minute")
async def copilot_hint(request: Request, payload: schemas.CopilotHintRequest):
    """Provide a targeted copilot hint (code structure, complexity, or edge cases) for a question."""
    hint_text = await llm.get_copilot_hint(
        question_text=payload.question_text,
        answer_draft=payload.answer_draft,
        hint_type=payload.hint_type
    )
    return {"hint": hint_text}

@app.post("/api/ai/companion-chat", response_model=schemas.CompanionChatResponse)
@limiter.limit("10/minute")
async def companion_chat(request: Request, payload: schemas.CompanionChatRequest):
    """Chat with the AI Interview Companion for support or clarification."""
    history_dicts = [{"role": msg.role, "content": msg.content} for msg in payload.history]
    reply = await llm.get_companion_reply(
        question_text=payload.question_text,
        answer_draft=payload.answer_draft,
        history=history_dicts,
        message=payload.message
    )
    return {"response": reply}

@app.post("/api/ai/negotiate", response_model=schemas.NegotiateResponse)
@limiter.limit("10/minute")
async def negotiate(request: Request, payload: schemas.NegotiateRequest):
    """Simulate a salary offer negotiation roleplay turn with an AI recruiter."""
    history_dicts = [{"role": msg.role, "content": msg.content} for msg in payload.history]
    result = await llm.get_negotiate_reply(
        history=history_dicts,
        message=payload.message
    )
    # Broadcast real-time notification
    offer_str = result.current_offer if hasattr(result, "current_offer") else result.get("current_offer", "") if isinstance(result, dict) else ""
    await notification_manager.broadcast({
        "text": f"💬 Recruiter Sarah adjusted offer package to {offer_str}",
        "icon": "💬"
    })

    return result

@app.get("/api/users/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.put("/api/users/{user_id}", response_model=schemas.UserResponse)
async def update_user_settings(user_id: str, payload: schemas.UserUpdateRequest, db: Session = Depends(get_db)):
    db_user = crud.update_user(db, user_id, **payload.dict(exclude_unset=True))
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Broadcast settings update via WebSocket
    await notification_manager.broadcast({
        "text": f"⚙️ Workspace settings updated! Target role: {db_user.role_targeting}.",
        "icon": "⚙️"
    })
    
    return db_user


