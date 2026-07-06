from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .search import search_similar_chunks, search_synthesis_chunks
from apps.ai_engine.gemini import call_gemini

class RagSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        query = request.data.get("query")
        limit = request.data.get("limit", 5)

        if not query:
            return Response({"error": "query is required"}, status=status.HTTP_400_BAD_REQUEST)

        results = search_similar_chunks(request.user, query, limit=limit)
        return Response({"results": results})

from config.mongodb import db, clean_docs, clean_doc
import datetime

class RagChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        message = request.data.get("message")
        note_id = request.data.get("note_id")
        personality = request.data.get("personality", "default")

        if not message:
            return Response({"error": "message is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Save user message to history
        db["ai_chat_history"].insert_one({
            "user_id": request.user.id,
            "sender": "user",
            "text": message,
            "note_id": str(note_id) if note_id else None,
            "personality": personality,
            "created_at": datetime.datetime.utcnow()
        })

        # Retrieve relevant text chunks using semantic search
        context_chunks = search_similar_chunks(request.user, message, limit=3)
        
        if note_id:
            context_chunks = [c for c in context_chunks if c["note_id"] == str(note_id)]

        context_str = "\n\n".join([f"Source: {c['note_title']}\n{c['chunk_text']}" for c in context_chunks])

        # Define AI Tutor System Instruction based on unlocked personalities
        system_instruction = "You are an AI Tutor helper. Help the student understand their notes."
        if personality and personality != "default":
            owned = db["user_purchases"].find_one({"user_id": request.user.id, "item_id": personality})
            if owned:
                if personality == "personality_einstein":
                    system_instruction = "You are Albert Einstein, the famous physicist. Respond to study questions with scientific insights, physics analogies, and gentle historical wisdom."
                elif personality == "personality_socrates":
                    system_instruction = "You are Socrates. Do not explain the answer directly! Instead, ask the student guided questions that challenge them to discover the answer on their own."
                elif personality == "personality_pirate":
                    system_instruction = "You are a pirate academic tutor. Speak like a pirate ('Ahoy!', 'Ye', 'Shiver me timbers!', etc.) but ensure your teaching explanation is correct."

        # Construct prompt
        prompt = f"""
{system_instruction}
Below is the context retrieved from the student's study notes:
---
{context_str}
---

Question: {message}

Provide a clear explanation based on the context above.
"""
        response_text = call_gemini(prompt)

        # Save AI response to history
        db["ai_chat_history"].insert_one({
            "user_id": request.user.id,
            "sender": "ai",
            "text": response_text,
            "note_id": str(note_id) if note_id else None,
            "personality": personality,
            "created_at": datetime.datetime.utcnow()
        })

        return Response({
            "response": response_text,
            "context_used": context_chunks
        })

class RagChatHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        note_id = request.query_params.get("note_id")
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 50))
        
        query = {"user_id": request.user.id}
        if note_id:
            query["note_id"] = str(note_id)
        
        skip = (page - 1) * page_size
        history = list(db["ai_chat_history"].find(query).sort("created_at", 1).skip(skip).limit(page_size))
        
        total_count = db["ai_chat_history"].count_documents(query)
        
        return Response({
            "results": clean_docs(history),
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "has_next": skip + page_size < total_count,
                "has_previous": page > 1,
            }
        })

class RagSynthesisChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        message = request.data.get("message")
        note_ids = request.data.get("note_ids", [])
        personality = request.data.get("personality", "default")

        if not message:
            return Response({"error": "message is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not note_ids:
            return Response({"error": "note_ids are required for synthesis"}, status=status.HTTP_400_BAD_REQUEST)

        # Save user message to history
        db["ai_chat_history"].insert_one({
            "user_id": request.user.id,
            "sender": "user",
            "text": message,
            "note_ids": [str(nid) for nid in note_ids],
            "personality": personality,
            "created_at": datetime.datetime.utcnow(),
            "is_synthesis": True
        })

        # Retrieve context from multiple notes
        context_chunks = search_synthesis_chunks(request.user, message, note_ids=note_ids, limit=6)
        context_str = "\n\n".join([f"Source note: {c['note_title']}\n{c['chunk_text']}" for c in context_chunks])

        # System Instruction for synthesis comparing/contrasting
        system_instruction = "You are an AI Tutor helper. Help the student synthesize, compare, and contrast concepts across multiple notes."
        if personality and personality != "default":
            owned = db["user_purchases"].find_one({"user_id": request.user.id, "item_id": personality})
            if owned:
                if personality == "personality_einstein":
                    system_instruction = "You are Albert Einstein. Respond with physics logic, analogies, and compare/contrast insights from these source materials."
                elif personality == "personality_socrates":
                    system_instruction = "You are Socrates. Prompt the student with questions to help them synthesize the differences/similarities across their notes themselves."
                elif personality == "personality_pirate":
                    system_instruction = "You are a pirate academic tutor. Compare the documents, speak like a pirate, and teach accurately."

        # Construct prompt
        prompt = f"""
{system_instruction}
Below are the context chunks retrieved from multiple study notes of the student:
---
{context_str}
---

Question: {message}

Compare, contrast, or synthesize the concepts across the sources. Provide a clear, well-structured explanation.
"""
        response_text = call_gemini(prompt)

        # Save AI response to history
        db["ai_chat_history"].insert_one({
            "user_id": request.user.id,
            "sender": "ai",
            "text": response_text,
            "note_ids": [str(nid) for nid in note_ids],
            "personality": personality,
            "created_at": datetime.datetime.utcnow(),
            "is_synthesis": True
        })

        return Response({
            "response": response_text,
            "context_used": context_chunks
        })
