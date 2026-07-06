import random

try:
    from sentence_transformers import SentenceTransformer
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    embedder = None

def embed_chunk(text: str) -> list[float]:
    if embedder:
        try:
            return embedder.encode(text).tolist()
        except Exception:
            pass
            
    # Mock embedding: generate a stable 384-dimensional vector based on the text hash
    # Seed with string hash to be consistent
    val = hash(text)
    random.seed(val)
    return [random.uniform(-1.0, 1.0) for _ in range(384)]
