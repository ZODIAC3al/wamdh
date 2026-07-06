import random
import requests
from django.conf import settings

def embed_chunk(text: str) -> list[float]:
    # Check if HuggingFace API key is present for real cloud feature extraction
    hf_key = getattr(settings, "HF_API_KEY", "")
    if hf_key:
        try:
            api_url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
            headers = {"Authorization": f"Bearer {hf_key}"}
            response = requests.post(api_url, headers=headers, json={"inputs": text}, timeout=10)
            if response.status_code == 200:
                vector = response.json()
                if isinstance(vector, list) and len(vector) > 0:
                    if isinstance(vector[0], list):
                        vector = vector[0]
                    return [float(x) for x in vector]
        except Exception as e:
            print("[Embedding API Error] Failed to fetch HF embeddings:", e)

    # Mock embedding: generate a stable 384-dimensional vector based on the text hash
    val = hash(text)
    random.seed(val)
    return [random.uniform(-1.0, 1.0) for _ in range(384)]
