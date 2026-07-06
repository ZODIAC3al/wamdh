from django.conf import settings

try:
    import google.generativeai as genai
    if getattr(settings, "GEMINI_API_KEY", ""):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
    else:
        model = None
except ImportError:
    genai = None
    model = None

def call_gemini(prompt: str, max_tokens: int = 2048) -> str:
    if model:
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Gemini API Error: {str(e)}. (Fallback to mock analysis)"
    
    # Simple mock fallback logic for testing without keys
    if "Summarize" in prompt or "bullet points" in prompt:
        return "• Carbon chemistry focuses on structures containing carbon.\n• Hydrocarbons can be saturated or unsaturated.\n• Covalent bonds form between non-metal atoms."
    elif "JSON" in prompt and "question" in prompt:
        return '[{"question": "What valency does Carbon have?", "options": ["2","3","4","5"], "answer": "4", "explanation": "Carbon is tetravalent."}]'
    elif "JSON" in prompt and "front" in prompt:
        return '[{"front": "What is an Alkane?", "back": "A saturated hydrocarbon."}]'
    
    return f"Mock Gemini response for prompt: {prompt[:100]}..."
