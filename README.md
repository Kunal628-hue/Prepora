# Prepora

## Setup

Before running the application, copy the example environment configuration files to their active locations and fill in your real values:

### Backend Configuration
1. Navigate to the `backend` directory.
2. Copy `backend/.env.example` to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Open `backend/.env` and configure your API keys (e.g., `GROQ_API_KEY`, `GEMINI_API_KEY`) and set `LLM_PROVIDER` to either `groq` or `gemini`.

### Frontend Configuration
1. Navigate to the `frontend` directory.
2. Copy `frontend/.env.example` to `frontend/.env.local` (or `.env`):
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```
3. Open `frontend/.env.local` and confirm that `NEXT_PUBLIC_API_URL` points to your running backend server (default: `http://127.0.0.1:8000`).

## Running the Application

### 1. Start the Backend Server
You can start the FastAPI backend from either the project root or the `backend` directory:

#### Option A: From the Project Root Directory (`Prepora/`)
```bash
backend/.venv/bin/python -m uvicorn backend.main:app --reload --port 8000
```

#### Option B: From the `backend/` Directory
```bash
# Activate the environment and run with PYTHONPATH pointing to the parent folder:
source .venv/bin/activate
PYTHONPATH=.. python -m uvicorn main:app --reload --port 8000
```
*(Or without activating: `PYTHONPATH=.. .venv/bin/python -m uvicorn main:app --reload --port 8000`)*

### 2. Start the Frontend Dev Server
Navigate to the `frontend` directory and start the Next.js development server:
```bash
cd frontend
npm run dev
```
