import math
from config.mongodb import embeddings_col, notes_col
from .embedder import embed_chunk

def dot_product(v1, v2):
    return sum(x * y for x, y in zip(v1, v2))

def magnitude(v):
    return math.sqrt(sum(x * x for x in v))

def cosine_similarity(v1, v2):
    mag1 = magnitude(v1)
    mag2 = magnitude(v2)
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot_product(v1, v2) / (mag1 * mag2)

def search_similar_chunks(user, query_text: str, limit: int = 5) -> list[dict]:
    query_vector = embed_chunk(query_text)
    
    # Find all notes owned by the current user to map titles
    user_notes = list(notes_col.find({"user_id": user.id}))
    note_id_to_title = {str(n["_id"]): n["title"] for n in user_notes}
    
    # Retrieve all embeddings for the current user
    embeddings = list(embeddings_col.find({"user_id": user.id}))
    
    results = []
    for emb in embeddings:
        vector = emb.get("embedding_vector")
        if not vector or len(vector) != len(query_vector):
            continue
        sim = cosine_similarity(query_vector, vector)
        note_id = emb.get("note_id")
        results.append({
            "note_id": note_id,
            "note_title": note_id_to_title.get(note_id, "Untitled Note"),
            "chunk_index": emb.get("chunk_index", 0),
            "chunk_text": emb.get("chunk_text", ""),
            "similarity": sim
        })
        
    # Sort by similarity descending
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:limit]

def search_synthesis_chunks(user, query_text: str, note_ids: list, limit: int = 6) -> list[dict]:
    query_vector = embed_chunk(query_text)
    note_ids_str = [str(nid) for nid in note_ids]
    
    # Find all notes owned by the current user to map titles
    user_notes = list(notes_col.find({"user_id": user.id}))
    note_id_to_title = {str(n["_id"]): n["title"] for n in user_notes}
    
    # Retrieve only embeddings matching the user and specified note IDs
    embeddings = list(embeddings_col.find({
        "user_id": user.id,
        "note_id": {"$in": note_ids_str}
    }))
    
    results = []
    for emb in embeddings:
        vector = emb.get("embedding_vector")
        if not vector or len(vector) != len(query_vector):
            continue
        sim = cosine_similarity(query_vector, vector)
        note_id = emb.get("note_id")
        results.append({
            "note_id": note_id,
            "note_title": note_id_to_title.get(note_id, "Untitled Note"),
            "chunk_index": emb.get("chunk_index", 0),
            "chunk_text": emb.get("chunk_text", ""),
            "similarity": sim
        })
        
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:limit]
