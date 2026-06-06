import json
import logging
import httpx
from typing import Dict, Any, List
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

async def generate_first_question(role: str, level: str) -> str:
    """Generate the initial interview question based on role and level."""
    prompt = (
        f"You are an expert interviewer. Generate the first interview question for a candidate interviewing for "
        f"a {level}-level {role} position. The question should be challenging and directly relevant to the role. "
        f"Respond with ONLY the question text itself. Do not include any greeting, introduction, or markdown formatting."
    )
    
    try:
        response = await generate_llm_response(prompt)
        if response:
            return response
    except Exception:
        pass
    
    # Demo fallback
    return MOCK_QUESTIONS[0]

async def generate_next_question(role: str, level: str, transcript: List[Dict[str, str]]) -> str:
    """Generate the next interview question based on history."""
    transcript_str = ""
    for turn in transcript:
        transcript_str += f"Interviewer: {turn.get('question')}\nCandidate: {turn.get('answer')}\n\n"
        
    prompt = (
        f"You are an expert interviewer conducting a {level}-level {role} interview. "
        f"Here is the transcript of the interview so far:\n\n{transcript_str}"
        f"Based on the previous questions and answers, generate the next logical interview question. "
        f"It should follow the natural flow of the conversation, dive deeper into their previous answer if appropriate, "
        f"or shift to a new area of competencies. Respond with ONLY the question text itself. "
        f"Do not include any pleasantries or introductory phrases."
    )
    
    try:
        response = await generate_llm_response(prompt)
        if response:
            return response
    except Exception:
        pass
    
    # Demo fallback
    order = len(transcript)
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
    return random.choice(MOCK_CRITIQUES)

async def evaluate_session(role: str, level: str, transcript: List[Dict[str, str]]) -> Dict[str, Any]:
    """Perform final grading on the full interview session."""
    transcript_str = ""
    for turn in transcript:
        transcript_str += f"Question: {turn.get('question')}\nCandidate Response: {turn.get('answer')}\n\n"
        
    prompt = (
        f"You are an expert interviewer grading a candidate's full mock interview for a {level}-level {role} position.\n"
        f"Here is the transcript of the interview:\n\n{transcript_str}"
        f"Please perform a complete performance review and output a JSON object with the following keys:\n"
        f"- 'overall_score': An integer score from 0 to 100.\n"
        f"- 'feedback_summary': A comprehensive paragraph summarizing their performance and readiness.\n"
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
    return MOCK_SESSION_EVALUATION
