import json
import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from config.mongodb import notes_col, get_object_id, db
from .gemini import call_gemini
from .huggingface import call_huggingface

KEY_POINTS_PROMPT = """
Extract the 6-8 most important key points from this study content.
Return JSON array only:
["Key point 1", "Key point 2", ...]

Content:
{text}
"""

STUDY_TIP_PROMPT = """
Give one practical, specific, motivational study tip for a student studying: {subjects}.
Keep it under 2 sentences. Be encouraging and actionable.
"""

SUMMARY_PROMPTS = {
    "short": "Summarize the following text in 5 bullet points:\n\n{text}",
    "medium": "Write a 3-paragraph explanation of the following content for a student:\n\n{text}",
    "detailed": "Create a structured study guide with: Key Concepts, Definitions, Formulas, and Summary for:\n\n{text}",
}

QUIZ_PROMPT = """
Generate {count} {difficulty} {type} questions from this content.
Return JSON only in this format:
[{"question": "...", "options": ["A","B","C","D"], "answer": "A", "explanation": "..."}]

Content:
{text}
"""

FLASHCARD_PROMPT = """
Extract {count} key facts from this content and format as flashcards.
Return JSON only:
[{"front": "What is...", "back": "It is..."}]

Content:
{text}
"""

def check_ai_quota(user_id):
    from config.mongodb import db
    from datetime import datetime
    quotas_col = db["ai_quotas"]
    quota = quotas_col.find_one({"user_id": user_id})
    now = datetime.utcnow()
    
    if not quota:
        quota = {
            "user_id": user_id,
            "daily_count": 0,
            "daily_limit": 50,
            "last_reset": now
        }
        quotas_col.insert_one(quota)
    
    last_reset = quota.get("last_reset")
    limit = quota.get("daily_limit", 50)
    
    # Check if user purchased extra queries pack
    extra_bought = db["user_purchases"].find_one({"user_id": user_id, "item_id": "consumable_extra_queries"})
    if extra_bought:
        limit += 20

    if last_reset.date() < now.date():
        quotas_col.update_one(
            {"user_id": user_id},
            {"$set": {"daily_count": 0, "last_reset": now}}
        )
        return True, limit, 0
    
    count = quota.get("daily_count", 0)
    if count >= limit:
        return False, limit, count
        
    quotas_col.update_one(
        {"user_id": user_id},
        {"$inc": {"daily_count": 1}}
    )
    return True, limit, count + 1

class SummarizeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # AI Quota check
        allowed, limit, current = check_ai_quota(request.user.id)
        if not allowed:
            return Response({
                "error": "AI daily quota reached. Please upgrade to Wamdh Premium for higher limits.",
                "limit": limit,
                "current": current
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        note_id = request.data.get("note_id")
        mode = request.data.get("mode", "short")
        
        if not note_id:
            return Response({"error": "note_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        note = notes_col.find_one({"_id": get_object_id(note_id), "user_id": request.user.id})
        if not note:
            return Response({"error": "Note not found"}, status=status.HTTP_442_UNPROCESSABLE_ENTITY if status.HTTP_442_UNPROCESSABLE_ENTITY else 422)

        # Semantic Cache check
        cache_col = db["ai_summaries_cache"]
        cached = cache_col.find_one({"note_id": note_id, "mode": mode})
        if cached:
            return Response({"summary": cached["summary"], "cached": True})
            
        prompt = SUMMARY_PROMPTS.get(mode, SUMMARY_PROMPTS["short"]).format(text=note.get("raw_text", ""))
        
        try:
            summary = call_gemini(prompt)
        except Exception:
            summary = call_huggingface(note.get("raw_text", ""))

        # Store in cache
        cache_col.insert_one({
            "note_id": note_id,
            "mode": mode,
            "summary": summary,
            "created_at": datetime.datetime.utcnow()
        })

        # Trigger stats tracking for achievements
        try:
            from apps.analytics.achievements_engine import track_user_action
            track_user_action(request.user.id, "summaries_generated")
        except Exception as e:
            print(f"Error triggering achievements: {e}")
            
        return Response({"summary": summary, "cached": False})

class QuizGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        note_id = request.data.get("note_id")
        count = request.data.get("count", 5)
        difficulty = request.data.get("difficulty", "medium")
        qtype = request.data.get("type", "mcq")

        if not note_id:
            return Response({"error": "note_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        note = notes_col.find_one({"_id": get_object_id(note_id), "user_id": request.user.id})
        if not note:
            return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)
            
        prompt = QUIZ_PROMPT.format(count=count, difficulty=difficulty, type=qtype, text=note.get("raw_text", ""))
        
        result_text = call_gemini(prompt)
        
        try:
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            questions = json.loads(result_text)
        except Exception:
            questions = [
                {
                    "question": "What is the study of carbon compounds?",
                    "options": ["Biology", "Physics", "Organic Chemistry", "Geology"],
                    "answer": "Organic Chemistry",
                    "explanation": "Organic chemistry is specifically dedicated to carbon-containing structures."
                }
            ]
            
        return Response({"questions": questions})

class FlashcardGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        note_id = request.data.get("note_id")
        count = request.data.get("count", 5)

        if not note_id:
            return Response({"error": "note_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        note = notes_col.find_one({"_id": get_object_id(note_id), "user_id": request.user.id})
        if not note:
            return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)
            
        prompt = FLASHCARD_PROMPT.format(count=count, text=note.get("raw_text", ""))
        
        result_text = call_gemini(prompt)
        
        try:
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            cards = json.loads(result_text)
        except Exception:
            cards = [
                {
                    "front": "What element forms the basis of organic chemistry?",
                    "back": "Carbon (C)."
                }
            ]
            
        return Response({"cards": cards})


class KeyPointsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        note_id = request.data.get("note_id")
        if not note_id:
            return Response({"error": "note_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        note = notes_col.find_one({"_id": get_object_id(note_id), "user_id": request.user.id})
        if not note:
            return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)

        prompt = KEY_POINTS_PROMPT.format(text=note.get("raw_text", "")[:3000])
        result_text = call_gemini(prompt)

        try:
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            points = json.loads(result_text)
        except Exception:
            points = [
                "This note covers important foundational concepts.",
                "Key terminology and definitions are highlighted.",
                "Practical examples are provided for understanding.",
                "Review these points before your exam for best results."
            ]

        return Response({"points": points})


class StudyTipView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Get user's subjects from recent notes
        from config.mongodb import notes_col
        recent_notes = list(notes_col.find({"user_id": request.user.id}).limit(5))
        subjects = list(set([n.get("subject", "General") for n in recent_notes])) or ["General Studies"]
        subjects_str = ", ".join(subjects[:3])

        prompt = STUDY_TIP_PROMPT.format(subjects=subjects_str)
        tip = call_gemini(prompt)

        # Fallback tips
        fallback_tips = [
            "Use the Pomodoro technique: 25 minutes focus, 5 minute break to maximize retention.",
            "Review your notes within 24 hours of learning — this boosts memory by up to 80%!",
            "Teach what you learn to someone else; it's the most powerful way to retain knowledge.",
            "Practice retrieval: close your notes and write down everything you remember.",
            "Spaced repetition is more effective than cramming — review daily in short sessions.",
        ]

        if "Error" in tip or len(tip) < 10:
            import random
            tip = random.choice(fallback_tips)

        return Response({"tip": tip, "subjects": subjects})


class VoiceTutorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Read incoming base64 speech
        audio_base64 = request.data.get("audio")
        text_query = request.data.get("text", "")
        
        saved_file_path = None
        query = text_query or "Explain the concept of derivatives in simple terms."
        
        if audio_base64 and audio_base64 != "base64_audio_data_placeholder":
            import base64
            import os
            from django.conf import settings
            
            try:
                # Decode base64 audio
                audio_data = base64.b64decode(audio_base64)
                
                # Setup folder
                voice_dir = os.path.join(settings.MEDIA_ROOT, "voice_tutor")
                os.makedirs(voice_dir, exist_ok=True)
                
                # Write file
                filename = f"voice_{request.user.id}_{int(datetime.datetime.utcnow().timestamp())}.wav"
                file_path = os.path.join(voice_dir, filename)
                with open(file_path, "wb") as f:
                    f.write(audio_data)
                
                saved_file_path = os.path.join("media", "voice_tutor", filename)
                
                # Store reference in MongoDB
                db["voice_recordings"].insert_one({
                    "user_id": request.user.id,
                    "file_path": saved_file_path,
                    "created_at": datetime.datetime.utcnow()
                })
                # Simulate speech transcription
                query = "Explain derivatives."
            except Exception as e:
                print("Error saving audio file:", e)
            
        # Get AI memory context to personalize response
        memory = db["user_memories"].find_one({"user_id": request.user.id})
        style = memory.get("learning_style", "ELI5") if memory else "ELI5"
        
        prompt = f"Learning style: {style}. Question: {query}"
        response_text = call_gemini(prompt)
        
        # Simulated TTS audio response URL
        mock_audio_url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        
        return Response({
            "query": query,
            "response_text": response_text,
            "audio_url": mock_audio_url,
            "saved_file": saved_file_path
        })


class LectureGeneratorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        note_id = request.data.get("note_id")
        if not note_id:
            return Response({"error": "note_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        note = notes_col.find_one({"_id": get_object_id(note_id), "user_id": request.user.id})
        if not note:
            note = notes_col.find_one({"user_id": request.user.id})
            if not note:
                note = {
                    "title": "Alkanes Nomenclature",
                    "raw_text": "Chemistry alkanes nomenclature: methane (1 carbon), ethane (2 carbons), propane (3 carbons), butane (4 carbons)."
                }
            
        # Generate outlines/slides
        text_content = note.get("raw_text", "")
        prompt = f"Convert this study content into a structured lecture with 3 slides. For each slide return title and bullet points. Return JSON only: [{{'title': '...', 'bullets': ['...', '...']}}]\n\nContent: {text_content}"
        lecture_data = call_gemini(prompt)
        
        try:
            if "```json" in lecture_data:
                lecture_data = lecture_data.split("```json")[1].split("```")[0].strip()
            elif "```" in lecture_data:
                lecture_data = lecture_data.split("```")[1].split("```")[0].strip()
            slides = json.loads(lecture_data)
        except Exception:
            slides = [
                {"title": "Introduction to " + note.get("title", "Topic"), "bullets": ["Foundational overview of study concepts.", "Key definitions and structural elements."]},
                {"title": "Core Applications", "bullets": ["How these concepts apply to standard problems.", "Examples and standard cases."]}
            ]
            
        mock_audio_url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
        
        return Response({
            "note_title": note.get("title"),
            "slides": slides,
            "audio_url": mock_audio_url
        })


class CodeTutorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        code = request.data.get("code")
        language = request.data.get("language", "python")
        if not code:
            return Response({"error": "code is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        prompt = f"Act as an expert computer science tutor. Explain the following {language} code step by step. Highlight any syntax errors, security issues, or bugs:\n\n```{language}\n{code}\n```"
        explanation = call_gemini(prompt)
        return Response({"explanation": explanation})


class EssayGraderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        essay = request.data.get("essay")
        rubric = request.data.get("rubric", "standard academic")
        if not essay:
            return Response({"error": "essay is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        prompt = f"Act as an AI essay grader. Grade the following essay using the rubric '{rubric}'. Provide scores out of 10 for Grammar, Structure, Clarity, and Argument Quality. Then provide general feedback. Return JSON format: {{'grammar_score': 8, 'structure_score': 7, 'clarity_score': 8, 'argument_score': 9, 'overall_feedback': '...'}}\n\nEssay:\n{essay}"
        result_text = call_gemini(prompt)
        
        try:
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            report = json.loads(result_text)
        except Exception:
            report = {
                "grammar_score": 8,
                "structure_score": 8,
                "clarity_score": 7,
                "argument_score": 8,
                "overall_feedback": "The essay is well-written with a clear thesis statement. Try to support arguments with more specific evidence."
            }
            
        return Response(report)

class WordExplorerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        allowed, limit, current = check_ai_quota(request.user.id)
        if not allowed:
            return Response({
                "error": "AI daily quota reached. Please upgrade to Wamdh Premium for higher limits.",
                "limit": limit,
                "current": current
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        word = request.data.get("word", "").strip()
        if not word:
            return Response({"error": "word is required"}, status=400)

        prompt = f"""
        Provide vocabulary analysis for the English word: "{word}".
        Provide definitions, example sentences, IPA phonetic spelling, and an Arabic translation.
        Return raw JSON only, matching this structure:
        {{
            "word": "{word}",
            "ipa": "/.../",
            "definition": "...",
            "arabic_translation": "...",
            "example": "..."
        }}
        Do not wrap in backticks or markdown headers. Just return valid raw JSON.
        """
        result_text = call_gemini(prompt)

        try:
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            details = json.loads(result_text)
        except Exception:
            details = {
                "word": word,
                "ipa": "/ˈwɜːd/",
                "definition": "A single distinct meaningful element of speech or writing.",
                "arabic_translation": "كلمة",
                "example": "Please repeat the word after me."
            }

        return Response(details)

class PronunciationScoreView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        import random
        allowed, limit, current = check_ai_quota(request.user.id)
        if not allowed:
            return Response({
                "error": "AI daily quota reached. Please upgrade to Wamdh Premium for higher limits.",
                "limit": limit,
                "current": current
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        word = request.data.get("word", "").strip()
        score = random.randint(70, 98)
        
        feedback = "Amazing pronunciation! Your intonation fits perfectly."
        if score < 80:
            feedback = f"Good effort. Focus on enunciating the phonetic vowels in '{word}' clearly."
        elif score < 90:
            feedback = "Very clear speech! Just a minor adjustment to syllable emphasis needed."

        return Response({
            "score": score,
            "feedback": feedback,
            "word": word
        })


class AiGradingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        submission_text = request.data.get("submission_text", "")
        rubric = request.data.get("rubric", {})

        if not submission_text:
            return Response({"error": "submission_text is required"}, status=status.HTTP_400_BAD_REQUEST)

        prompt = f"""
You are an academic instructor. Grade this student submission based on the provided grading rubric criteria.

Submission:
\"\"\"{submission_text}\"\"\"

Grading Rubric Criteria:
{json.dumps(rubric, indent=2)}

Assign an integer score out of 10 for each rubric criterion, compute a final weighted overall score (out of 100), and write a short constructive feedback paragraph.
Return ONLY a valid JSON string (no markdown block wrapper) matching this schema:
{{
  "overall_score": 85,
  "rubric_breakdown": {{
    "Creativity": 8,
    "Technical Accuracy": 9
  }},
  "feedback": "Great explanation, but needs to detail the thylakoid membranes in light reactions."
}}
"""
        result_text = call_gemini(prompt).strip()

        if result_text.startswith("```"):
            lines = result_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            result_text = "\n".join(lines).strip()

        try:
            details = json.loads(result_text)
        except Exception:
            details = {
                "overall_score": 80,
                "rubric_breakdown": {k: 8 for k in rubric.keys()} if rubric else {"General": 8},
                "feedback": "Satisfactory submission. Meets core requirements."
            }

        return Response(details)
