import os

path = "/Users/rohitkgupta/Planora/Prepora/backend/llm.py"
with open(path, "r") as f:
    content = f.read()

# Add mock warning
warning = '    logger.warning("Serving mock data because LLM API call failed or is unconfigured.")\n'

content = content.replace('    return MOCK_QUESTIONS[0]', warning + '    return MOCK_QUESTIONS[0]')
content = content.replace('    if order < len(MOCK_QUESTIONS):', warning + '    if order < len(MOCK_QUESTIONS):')
content = content.replace('    return random.choice(MOCK_CRITIQUES)', warning + '    return random.choice(MOCK_CRITIQUES)')
content = content.replace('    return MOCK_SESSION_EVALUATION', warning + '    return MOCK_SESSION_EVALUATION')

with open(path, "w") as f:
    f.write(content)
