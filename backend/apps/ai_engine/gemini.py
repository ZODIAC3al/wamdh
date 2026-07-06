from django.conf import settings

_client = None
_model_name = "gemini-2.5-flash"

try:
    from google import genai
    _api_key = getattr(settings, "GEMINI_API_KEY", "")
    if _api_key:
        _client = genai.Client(api_key=_api_key)
except ImportError:
    genai = None
    _client = None

def call_gemini(prompt: str, max_tokens: int = 2048) -> str:
    if _client:
        try:
            response = _client.models.generate_content(
                model=_model_name,
                contents=prompt,
            )
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
