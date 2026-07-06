import requests
from django.conf import settings

HF_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"

def call_huggingface(text: str) -> str:
    hf_key = getattr(settings, "HF_API_KEY", "")
    if hf_key:
        try:
            headers = {"Authorization": f"Bearer {hf_key}"}
            payload = {"inputs": text, "parameters": {"max_length": 500}}
            response = requests.post(HF_API_URL, headers=headers, json=payload)
            if response.status_code == 200:
                res_json = response.json()
                if isinstance(res_json, list) and len(res_json) > 0:
                    return res_json[0].get("summary_text", "Failed to extract summary from response.")
        except Exception:
            pass
            
    # Fallback to local mock summary if API is down or key is missing
    return f"HuggingFace Fallback Summary: Saturated carbon chains (alkanes) are stable, while unsaturated chains contain double/triple bonds."
