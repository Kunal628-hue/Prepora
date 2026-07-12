import json
import logging
import httpx
from typing import Dict, Any, List, Optional
from backend.config import settings

logger = logging.getLogger(__name__)

# Mock responses for Demo Mode (if no API keys are provided)
MOCK_QUESTIONS = [
    "Could you describe a challenging project you worked on recently? What was your role, and how did you overcome the main obstacles?",
    "How do you approach optimizing application performance? Can you give me a specific example where you diagnosed and fixed a performance bottleneck?",
    "How do you handle conflicts or disagreements in technical design decisions within your team?",
    "Can you explain the difference between optimistic and pessimistic locking, and when you would use each?",
    "How do you ensure your code is secure and resilient against common vulnerabilities like SQL injection or XSS?"
]

MOCK_CRITIQUES = [
    {
        "critique": "You provided a structured response using the STAR method. Your description of the project background was clear. However, you could have gone into more technical details about the specific tools and architectural patterns you chose, and quantified the results (e.g., percentage improvement in speed or conversion).",
        "score": 82,
        "model_answer": "In my recent project, a microservices-based e-commerce system, we faced a 40% drop in checkout performance. I led the migration of our session storage to Redis and implemented optimistic concurrency control. This reduced checkout latency by 65% (from 1200ms to 420ms) and solved database deadlock issues under high load. A perfect response details the Situation, Task, actions taken, and concrete metrics achieved."
    },
    {
        "critique": "Excellent answer outlining browser rendering critical path optimization. You clearly explained image lazy loading, code splitting, and bundle size reduction. To make this answer even stronger, mention Core Web Vitals specifically (such as LCP, FID, and CLS) and how you measured them using Chrome DevTools or Lighthouse.",
        "score": 88,
        "model_answer": "When diagnosing performance issues, I start with Chrome DevTools Performance panel and Lighthouse to assess Core Web Vitals. For a high LCP, I optimize the critical rendering path by adding fetchpriority='high' to hero images, inline critical CSS, and defer non-critical Javascript. In a past role, these actions reduced LCP from 4.2s to 1.8s, improving mobile conversions by 12%."
    },
    {
        "critique": "Your answer demonstrates strong emotional intelligence and leadership. You focused on collaboration and objective data-driven debates. Adding a specific anecdote where a disagreement led to a better product outcome would make this highly compelling.",
        "score": 85,
        "model_answer": "When technical conflicts arise, I align the team around objective constraints like scalability, maintenance cost, and business deadlines. In a previous project, half the team wanted to use GraphQL while others preferred REST. I organized a time-boxed proof of concept where we measured development speed and API latency. The REST API proved faster to implement for our MVP. We documented this decision in a RFC document, and the team aligned smoothly."
    }
]

MOCK_SESSION_EVALUATION = {
    "overall_score": 85,
    "feedback_summary": "The candidate demonstrated strong communication skills, solid technical fundamentals, and a practical approach to system design and team collaboration. They structure answers well, although they could provide more quantitative details to prove impact.",
    "strengths": [
        "Structured thinking using the STAR method for behavioral answers.",
        "Good understanding of frontend and backend optimization strategies.",
        "Collaborative and data-driven approach to technical disagreements."
    ],
    "weaknesses": [
        "Needs to include more concrete numbers, metrics, or KPIs in project descriptions.",
        "Could expand on security practices and common vulnerability mitigation during code reviews.",
        "Should discuss trade-offs and alternative designs more explicitly before choosing a solution."
    ],
    "technical_score": 83,
    "communication_score": 88,
    "problem_solving_score": 84,
    "structure_score": 85
}

async def generate_llm_response(prompt: str, response_json: bool = False) -> str:
    """Helper to query the configured LLM API (Gemini or Groq) with async httpx."""
    provider = settings.LLM_PROVIDER.lower()
    
    # 1. Gemini AI Studio Configuration
    if provider == "gemini" and settings.GEMINI_API_KEY:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        
        contents = [{"parts": [{"text": prompt}]}]
        data = {"contents": contents}
        if response_json:
            data["generationConfig"] = {"responseMimeType": "application/json"}

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, json=data, headers=headers)
                res.raise_for_status()
                res_data = res.json()
                
                # Extract response text
                text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip()
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            raise e

    # 2. Groq API Configuration (OpenAI Compatible)
    elif provider == "groq" and settings.GROQ_API_KEY:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Use Meta Llama 3.3 70B Versatile as default high-quality model
        model = "llama-3.3-70b-versatile"
        
        data = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }
        if response_json:
            data["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, json=data, headers=headers)
                res.raise_for_status()
                res_data = res.json()
                text = res_data["choices"][0]["message"]["content"]
                return text.strip()
        except Exception as e:
            logger.error(f"Error calling Groq API: {e}")
            raise e

    # 3. Fallback / Demo Mode
    logger.warning("No API keys found or configured. Operating in DEMO MODE.")
    return ""

async def generate_first_question(role: str, level: str, tech_stack: Optional[List[str]] = None) -> str:
    """Generate the initial interview question based on role, level, and tech stack."""
    tech_stack_str = ", ".join(tech_stack) if tech_stack else "general technical skills"
    prompt = (
        f"You are an expert interviewer. Generate the first interview question for a candidate interviewing for "
        f"a {level}-level {role} position. The candidate's resume shows they have experience in the following tech stack: {tech_stack_str}.\n"
        f"Start the interview by asking a highly relevant technical concept question based on this tech stack and role.\n"
        f"Respond with ONLY the question text itself. Do not include any greeting, introduction, or markdown formatting."
    )
    
    try:
        response = await generate_llm_response(prompt)
        if response:
            return response
    except Exception:
        pass
    
    # Demo fallback
    logger.warning("Serving mock data because LLM API call failed or is unconfigured.")
    return MOCK_QUESTIONS[0]

async def generate_next_question(role: str, level: str, transcript: List[Dict[str, str]], tech_stack: Optional[List[str]] = None) -> str:
    """Generate the next interview question based on history, tech stack, and session progression."""
    tech_stack_str = ", ".join(tech_stack) if tech_stack else "general technical skills"
    transcript_str = ""
    for turn in transcript:
        transcript_str += f"Interviewer: {turn.get('question')}\nCandidate: {turn.get('answer')}\n\n"
        
    current_question_number = len(transcript) + 1
    
    prompt = (
        f"You are an expert, conversational, and direct technical interviewer conducting a {level}-level {role} interview.\n"
        f"Candidate's Tech Stack: {tech_stack_str}\n"
        f"This is a 5-question interview. The candidate has completed {len(transcript)} turns and is now on question {current_question_number} of 5.\n\n"
        f"Here is the transcript of the interview so far:\n"
        f"-----\n"
        f"{transcript_str}"
        f"-----\n\n"
        f"CRITICAL GUIDELINE FOR A REAL INTERVIEWER:\n"
        f"A great interviewer listens carefully to the candidate's last response and decides if it warrants a follow-up probe or a new question:\n"
        f"1. Examine the candidate's LAST response. If it is short, vague, lacks detail, fails to discuss design trade-offs, "
        f"or has potential bugs/inefficiencies (such as a slow O(N^2) time complexity or unhandled edge cases in a coding problem), "
        f"generate a direct, specific follow-up question asking them to explain, optimize, clarify, or refine their approach. "
        f"Do not introduce a new topic in this case. Speak like a real interviewer digging deeper (e.g., 'In your answer you mentioned... but how would you handle...', or 'Your approach works, but what is its time complexity and can we do better?').\n"
        f"2. If the candidate's last response was already comprehensive, deep, and complete (or if the transition to a new round is necessary, e.g. starting the DSA coding round), "
        f"then generate the next question according to the stage guidelines below:\n\n"
        f"STAGE GUIDELINES for question {current_question_number}:\n"
    )
    
    if current_question_number in [3, 4]:
        prompt += (
            f"- This is the Data Structures and Algorithms (DSA) round. If you are starting this round, present a specific, clear algorithmic coding problem "
            f"appropriate for a {level} level (e.g., dynamic programming, string manipulation, binary trees, arrays, graphs). Ask them to explain their approach "
            f"and analyze time and space complexities. If they are already in the DSA round, ask them to optimize their previous approach or address key edge cases."
        )
    elif current_question_number == 5:
        prompt += (
            f"- This is the final question. Either ask a follow-up optimization question on their DSA solution, or ask a system design / behavioral question to wrap up."
        )
    else:
        prompt += (
            f"- Ask a technology-specific question focused on their tech stack ({tech_stack_str}) or experience level."
        )
        
    prompt += (
        f"\n\nRespond with ONLY the question text itself. Do not include any greeting, pleasantries, introductory phrases (like 'Here is the next question:'), or markdown metadata. "
        f"The response must be exactly what the interviewer says to the candidate."
    )
    
    try:
        response = await generate_llm_response(prompt)
        if response:
            return response
    except Exception:
        pass
    
    # Demo fallback
    order = len(transcript)
    logger.warning("Serving mock data because LLM API call failed or is unconfigured.")
    if order < len(MOCK_QUESTIONS):
        return MOCK_QUESTIONS[order]
    return "What other challenges did you encounter in this project and how did you resolve them?"

async def evaluate_answer(question: str, answer: str, role: str, level: str) -> Dict[str, Any]:
    """Evaluate a single answer, returning critique, score, and model answer."""
    prompt = (
        f"You are an expert interviewer evaluating a candidate's response in a {level}-level {role} interview.\n"
        f"Question Asked: {question}\n"
        f"Candidate's Answer: {answer}\n\n"
        f"Analyze the candidate's answer for accuracy, technical depth, structure, and clarity. "
        f"Provide your feedback in a JSON object with the following keys:\n"
        f"- 'critique': A short, detailed critique outlining strengths and constructive steps to improve (2-3 sentences).\n"
        f"- 'score': An integer score between 0 and 100.\n"
        f"- 'model_answer': A paragraph demonstrating a perfect, top-tier response to this question.\n"
        f"Ensure the response is valid, parseable JSON only."
    )
    
    try:
        response = await generate_llm_response(prompt, response_json=True)
        if response:
            return json.loads(response)
    except Exception as e:
        logger.error(f"Failed to parse LLM evaluation response: {e}")
    
    # Demo fallback
    import random
    logger.warning("Serving mock data because LLM API call failed or is unconfigured.")
    return random.choice(MOCK_CRITIQUES)

async def evaluate_session(role: str, level: str, transcript: List[Dict[str, str]], tech_stack: Optional[List[str]] = None) -> Dict[str, Any]:
    """Perform final grading on the full interview session, evaluating tech stack alignment and DSA competence."""
    tech_stack_str = ", ".join(tech_stack) if tech_stack else "general technical skills"
    transcript_str = ""
    for turn in transcript:
        transcript_str += f"Question: {turn.get('question')}\nCandidate Response: {turn.get('answer')}\n\n"
        
    prompt = (
        f"You are an expert interviewer grading a candidate's full mock interview for a {level}-level {role} position.\n"
        f"Candidate's Tech Stack: {tech_stack_str}\n\n"
        f"Here is the transcript of the interview:\n\n{transcript_str}"
        f"Please perform a complete performance review, checking their proficiency in their tech stack "
        f"and how they performed in the DSA coding round (specifically checking code correctness and Big O complexity accuracy).\n"
        f"Output a JSON object with the following keys:\n"
        f"- 'overall_score': An integer score from 0 to 100.\n"
        f"- 'feedback_summary': A comprehensive paragraph summarizing their performance, readiness, and DSA competence.\n"
        f"- 'strengths': A list of 3 specific strengths demonstrated (list of strings).\n"
        f"- 'weaknesses': A list of 3 specific weaknesses or areas of improvement (list of strings).\n"
        f"- 'technical_score': Integer (0-100) reflecting tech competency/accuracy.\n"
        f"- 'communication_score': Integer (0-100) reflecting clarity, speed, and structured communication.\n"
        f"- 'problem_solving_score': Integer (0-100) reflecting system-level thinking and methodology.\n"
        f"- 'structure_score': Integer (0-100) reflecting structure of answers (e.g. STAR/CAR format).\n"
        f"Ensure your output is valid JSON only."
    )
    
    try:
        response = await generate_llm_response(prompt, response_json=True)
        if response:
            return json.loads(response)
    except Exception as e:
        logger.error(f"Failed to parse LLM session evaluation: {e}")
        
    # Demo fallback
    logger.warning("Serving mock data because LLM API call failed or is unconfigured.")
    return MOCK_SESSION_EVALUATION

async def parse_resume(file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
    """Parse a resume file (PDF or Image) using Gemini 2.5 Flash multimodal capabilities."""
    import base64
    base64_data = base64.b64encode(file_bytes).decode("utf-8")
    
    prompt = (
        "You are a professional resume parser. Analyze the attached resume and extract the following information:\n"
        "1. 'role': The most appropriate target software developer/engineer role matching the candidate's background (e.g. 'Frontend Engineer', 'Backend Engineer', 'Fullstack Engineer', 'Data Scientist', 'Mobile Developer', 'DevOps Engineer').\n"
        "2. 'level': The inferred experience level (choose exactly one of: 'Junior', 'Mid-level', 'Senior').\n"
        "3. 'tech_stack': A list of the key programming languages, frameworks, libraries, databases, and core dev tools mentioned (e.g. ['React', 'Python', 'SQL', 'Docker']).\n\n"
        "Respond with a valid JSON object containing only these three keys. Do not include any markdown code block formatting (like ```json) or leading/trailing explanation text."
    )
    
    # Check if Gemini is configured
    if settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        
        data = {
            "contents": [{
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": base64_data
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        
        try:
            async with httpx.AsyncClient(timeout=35.0) as client:
                res = await client.post(url, json=data, headers=headers)
                res.raise_for_status()
                res_data = res.json()
                text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text.strip())
        except Exception as e:
            logger.error(f"Error parsing resume via Gemini: {e}")
            
    # Fallback to general parsing mock
    return {
        "role": "Fullstack Engineer",
        "level": "Mid-level",
        "tech_stack": ["React", "Node.js", "Python", "SQL"]
    }


# New AI Feature Implementations

async def analyze_resume_gap(role: str, level: str, tech_stack: List[str], job_description: str) -> Dict[str, Any]:
    """Analyze a resume against a target job description and return match metrics and a roadmap."""
    tech_stack_str = ", ".join(tech_stack) if tech_stack else "General Technical Skills"
    prompt = (
        f"You are a professional tech recruiter and technical screen coordinator. "
        f"Analyze this candidate's profile:\n"
        f"- Target Role: {role}\n"
        f"- Experience Level: {level}\n"
        f"- Tech Stack: {tech_stack_str}\n\n"
        f"Against this target Job Description:\n"
        f"-----\n"
        f"{job_description}\n"
        f"-----\n\n"
        f"Evaluate the profile for fit and output a JSON object containing the following keys:\n"
        f"- 'match_score': An integer between 0 and 100 indicating percentage match fit.\n"
        f"- 'missing_skills': A list of up to 4 key technical skills, tools, or frameworks required/preferred in the job description that are missing from the candidate's profile.\n"
        f"- 'soft_skills_tips': A list of 2 practical communication or behavioral tips tailored for interviews at this role/level.\n"
        f"- 'roadmap': A 5-day customized preparation roadmap. This must be a list of 5 objects, each with 'day' (1 to 5), 'focus' (short title string), and 'tasks' (list of exactly 2 actionable practice task strings).\n\n"
        f"Ensure your output is valid, parseable JSON only."
    )
    
    try:
        response = await generate_llm_response(prompt, response_json=True)
        if response:
            return json.loads(response)
    except Exception as e:
        logger.error(f"Error generating resume gap analysis: {e}")
        
    # Fallback mock gap report
    return {
        "match_score": 75,
        "missing_skills": ["System Design Architecture", "Kubernetes", "Redis Caching"],
        "soft_skills_tips": [
            "Be prepared to use the STAR method to structure your behavioral responses.",
            "Focus on explaining the trade-offs of your architectural choices clearly."
        ],
        "roadmap": [
            {"day": 1, "focus": "System Design Fundamentals", "tasks": ["Review caching topologies and horizontal scaling strategies.", "Solve 2 mock System Design problems."]},
            {"day": 2, "focus": "High Availability Databases", "tasks": ["Study relational vs non-relational persistence models.", "Understand database partitioning."]},
            {"day": 3, "focus": "Container Orchestration", "tasks": ["Learn Kubernetes architecture and Pod lifecycle.", "Read about deployment strategies like Blue-Green."]},
            {"day": 4, "focus": "Behavioral Alignment", "tasks": ["Draft STAR stories for previous challenging scale conflicts.", "Record yourself answering 3 behavioral mock prompts."]},
            {"day": 5, "focus": "Final Synthesis & Drill", "tasks": ["Run a full-length mock technical practice session.", "Review key complexity constraints."]}
        ]
    }

async def get_copilot_hint(question_text: str, answer_draft: str, hint_type: str) -> str:
    """Generate a target hint based on current coding question and draft answer."""
    prompt = (
        f"You are a friendly, encouraging AI Interview Copilot. The candidate is solving this question:\n"
        f"\"{question_text}\"\n\n"
        f"Their current draft response or code in the editor is:\n"
        f"\"{answer_draft}\"\n\n"
        f"They have requested a hint of type: \"{hint_type}\" (where 'code' means code/logic structure, "
        f"'complexity' means time/space complexity optimization, and 'edge_cases' means boundary conditions).\n\n"
        f"Generate a helpful, concise hint. DO NOT give away the complete code or full answer directly. "
        f"Guide them conceptually. Keep it to 2-3 sentences max."
    )
    
    try:
        response = await generate_llm_response(prompt)
        if response:
            return response
    except Exception as e:
        logger.error(f"Error generating copilot hint: {e}")
        
    return "Consider breaking down the problem into smaller subproblems or double checking the boundary cases of your input."

async def get_companion_reply(question_text: str, answer_draft: str, history: List[Dict[str, str]], message: str) -> str:
    """Respond as a supportive peer chatbot companion during the active interview."""
    history_str = ""
    for msg in history[-6:]:  # limit context to last 6 turns
        role = "Candidate" if msg.get("role") == "user" else "Companion"
        history_str += f"{role}: {msg.get('content')}\n"
        
    prompt = (
        f"You are a supportive, encouraging AI Interview Companion chat buddy. "
        f"The candidate is currently taking a mock interview and is dealing with this question:\n"
        f"\"{question_text}\"\n\n"
        f"Their current answer draft in progress is:\n"
        f"\"{answer_draft}\"\n\n"
        f"Here is your recent chat history:\n{history_str}\n"
        f"Candidate: {message}\n\n"
        f"Respond as the friendly companion. Give encouraging tips, clarify concepts, or support them. "
        f"Keep your response warm, conversational, and brief (1-3 sentences max). Do not solve the question for them."
    )
    
    try:
        response = await generate_llm_response(prompt)
        if response:
            return response
    except Exception as e:
        logger.error(f"Error generating companion reply: {e}")
        
    return "Keep going, you're doing great! Let me know if you need help with any specific concepts."

async def get_negotiate_reply(history: List[Dict[str, str]], message: str) -> Dict[str, Any]:
    """Recruiter simulator roleplay for salary offer negotiation."""
    history_str = ""
    for msg in history[-8:]:
        role = "Candidate" if msg.get("role") == "user" else "Recruiter"
        history_str += f"{role}: {msg.get('content')}\n"
        
    prompt = (
        f"You are a professional tech Recruiter negotiating an offer package with a software engineer candidate.\n"
        f"- Target Role: Mid-level Software Engineer\n"
        f"- Recruiters base offer: $120,000 base salary + $10,000 signing bonus.\n"
        f"- Recruiters maximum budget cap: $155,000 base salary + $15,000 signing bonus.\n\n"
        f"Negotiation transcript so far:\n{history_str}\n"
        f"Candidate counter-offer/argument: {message}\n\n"
        f"Evaluate the candidate's request. Be polite, business-firm, and realistic. "
        f"Decide whether to increase your offer, accept their counter-offer, or reject it if it's completely unreasonable (above budget cap).\n"
        f"Output your decision in a valid JSON object only, containing the following keys:\n"
        f"- 'recruiter_reply': A conversational, realistic reply to the candidate (2-3 sentences).\n"
        f"- 'current_offer': The current base salary value in dollars (e.g. '$130,000'). Update this only if you increase your offer.\n"
        f"- 'negotiation_score': An integer (0-100) scoring their negotiation etiquette, clarity, and leverage reasoning.\n"
        f"- 'leverage_rating': A short descriptor of their strategy (e.g., 'Weak leverage', 'Professional counter-offer', 'Aggressive demand').\n"
        f"- 'status': One of: 'active' (negotiation in progress), 'accepted' (if you accept their offer/they accept your final offer), 'rejected' (if they refuse standard guidelines and negotiation breaks down).\n\n"
        f"Ensure output is valid, parseable JSON only."
    )
    
    try:
        response = await generate_llm_response(prompt, response_json=True)
        if response:
            return json.loads(response)
    except Exception as e:
        logger.error(f"Error generating negotiation reply: {e}")
        
    return {
        "recruiter_reply": "Thank you for the response. I've reviewed the numbers, and I can stretch our base offer to $130,000 base. How does that sound?",
        "current_offer": "$130,000",
        "negotiation_score": 70,
        "leverage_rating": "Reasonable request",
        "status": "active"
    }

