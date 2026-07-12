import os
import re

file_path = "/Users/rohitkgupta/Planora/Prepora/backend/main.py"
with open(file_path, "r") as f:
    content = f.read()

# 1. Add Request to fastapi import if not there
if "Request" not in content[:500]:
    content = content.replace("from fastapi import FastAPI,", "from fastapi import FastAPI, Request,")

# 2. Add slowapi imports and setup after app = FastAPI()
if "slowapi" not in content:
    setup_code = """
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
"""
    content = content.replace("app = FastAPI(title=\"Prepora API\")", "app = FastAPI(title=\"Prepora API\")" + setup_code)

# 3. Add @limiter.limit("10/minute") and Request parameter to endpoints
endpoints = [
    ("/api/ai/resume-gap-analysis", "resume_gap_analysis(payload: schemas.ResumeGapAnalysisRequest"),
    ("/api/ai/copilot-hint", "copilot_hint(payload: schemas.CopilotHintRequest"),
    ("/api/ai/companion-chat", "companion_chat(payload: schemas.CompanionChatRequest"),
    ("/api/ai/negotiate", "negotiate(payload: schemas.NegotiateRequest")
]

for url, func_start in endpoints:
    if "@limiter.limit" not in content.split(url)[-1][:200]:
        # Insert @limiter.limit above the def
        content = content.replace(f'def {func_start}', f'@limiter.limit("10/minute")\ndef {func_start}')
        
        # Add request: Request to function arguments
        new_func_start = f'{func_start.split("(")[0]}(request: Request, {func_start.split("(")[1]}'
        content = content.replace(f'def {func_start}', f'def {new_func_start}')

with open(file_path, "w") as f:
    f.write(content)
