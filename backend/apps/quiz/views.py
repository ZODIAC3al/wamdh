import datetime
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from config.mongodb import quizzes_col, quiz_attempts_col, get_object_id, clean_doc, clean_docs
from .serializers import QuizSerializer, QuizAttemptSerializer

class QuizListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        quizzes = list(quizzes_col.find({"user_id": request.user.id}))
        return Response(clean_docs(quizzes))

    def post(self, request, *args, **kwargs):
        serializer = QuizSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        quiz_data = serializer.validated_data
        quiz_data["user_id"] = request.user.id
        quiz_data["created_at"] = datetime.datetime.utcnow()

        result = quizzes_col.insert_one(quiz_data)
        quiz_data["id"] = str(result.inserted_id)

        return Response(clean_doc(quiz_data), status=status.HTTP_201_CREATED)

class QuizDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        quiz = quizzes_col.find_one({"_id": get_object_id(pk), "user_id": request.user.id})
        if not quiz:
            return Response({"error": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(clean_doc(quiz))

class QuizAttemptSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, quiz_id, *args, **kwargs):
        serializer = QuizAttemptSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        attempt_data = serializer.validated_data
        
        # Check if quiz exists
        quiz = quizzes_col.find_one({"_id": get_object_id(quiz_id), "user_id": request.user.id})
        if not quiz:
            return Response({"error": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)

        attempt_data["user_id"] = request.user.id
        attempt_data["username"] = request.user.username
        attempt_data["quiz"] = quiz_id
        attempt_data["quiz_title"] = quiz.get("title", "Untitled Quiz")
        attempt_data["completed_at"] = datetime.datetime.utcnow()

        result = quiz_attempts_col.insert_one(attempt_data)
        attempt_data["id"] = str(result.inserted_id)

        # Award 10 XP per percent of score (e.g. 80% score = 800 XP)
        user = request.user
        earned_xp = int(attempt_data["score"] * 10)
        user.xp_points += earned_xp
        user.save()

        # Trigger achievements stats
        try:
            from apps.analytics.achievements_engine import track_user_action
            score_val = attempt_data.get("score", 0)
            is_perfect = 1 if score_val >= 100 else 0
            track_user_action(request.user.id, "quizzes_completed", 1)
            if is_perfect:
                track_user_action(request.user.id, "perfect_quizzes", 1)
        except Exception as e:
            print(f"Error triggering achievements: {e}")

        return Response(clean_doc(attempt_data), status=status.HTTP_201_CREATED)

class QuizAttemptListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, quiz_id, *args, **kwargs):
        attempts = list(quiz_attempts_col.find({"user_id": request.user.id, "quiz": quiz_id}))
        return Response(clean_docs(attempts))

class QuizStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        attempts = list(quiz_attempts_col.find({"user_id": request.user.id}))
        if not attempts:
            return Response({
                "avg_score": 0.0,
                "total_attempts": 0,
                "highest_score": 0.0
            })
            
        scores = [a["score"] for a in attempts]
        total_attempts = len(attempts)
        avg_score = sum(scores) / total_attempts
        highest_score = max(scores)

        return Response({
            "avg_score": round(avg_score, 1),
            "highest_score": round(highest_score, 1),
            "total_attempts": total_attempts
        })

class QuizPracticeSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        score = request.data.get("score", 0.0)
        total_questions = request.data.get("total_questions", 0)
        correct_answers = request.data.get("correct_answers", 0)
        time_spent_seconds = request.data.get("time_spent_seconds", 0)
        difficulty = request.data.get("difficulty", "medium")
        qtype = request.data.get("type", "mcq")
        subject = request.data.get("subject", "General")
        note_id = request.data.get("note_id")
        incorrect_questions = request.data.get("incorrect_questions", [])

        attempt = {
            "user_id": request.user.id,
            "username": request.user.username,
            "score": score,
            "total_questions": total_questions,
            "correct_answers": correct_answers,
            "time_spent_seconds": time_spent_seconds,
            "difficulty": difficulty,
            "type": qtype,
            "subject": subject,
            "note_id": note_id,
            "is_practice": True,
            "completed_at": datetime.datetime.utcnow()
        }
        
        result = quiz_attempts_col.insert_one(attempt)
        attempt["id"] = str(result.inserted_id)

        has_timer = request.data.get("has_timer", False)
        earned_xp = int(score * 10)
        if has_timer:
            earned_xp += 50

        user = request.user
        user.xp_points += earned_xp
        user.save()

        # Update users collection in MongoDB
        from config.mongodb import users_col
        users_col.update_one(
            {"username": user.username},
            {"$set": {"xp_points": user.xp_points}}
        )

        # Trigger achievements stats
        try:
            from apps.analytics.achievements_engine import track_user_action
            is_perfect = 1 if score >= 100 else 0
            is_under_2min = 1 if (time_spent_seconds > 0 and time_spent_seconds < 120) else 0
            
            track_user_action(request.user.id, "quizzes_completed", 1)
            if is_perfect:
                track_user_action(request.user.id, "perfect_quizzes", 1)
            if is_under_2min:
                track_user_action(request.user.id, "quizzes_under_2min", 1)
        except Exception as e:
            print(f"Error triggering achievements: {e}")

        recommendations = []
        if incorrect_questions:
            try:
                from apps.ai_engine.gemini import call_gemini
                q_text = "\n".join([f"- Question: {iq['question']}\n  Student Answered: {iq.get('selected_answer')}\n  Correct Answer: {iq.get('correct_answer')}" for iq in incorrect_questions[:3]])
                prompt = f"""
                You are a study tutor helper. A student just took a practice exam in {subject} ({difficulty} difficulty) and got these questions wrong:
                {q_text}

                Provide exactly 3 bullet points of study recommendations, reference terms to revise, and specific pages or concepts to focus on. Keep recommendations short (max 15 words each).
                Do not write introductory or summary text. Just write the bullet points.
                """
                resp = call_gemini(prompt)
                recommendations = [line.strip("- •*").strip() for line in resp.split("\n") if line.strip()]
            except Exception as e:
                print("Gemini recommendation error:", e)
        
        if not recommendations:
            recommendations = [
                f"Review core concepts of {subject} in your notes.",
                "Practice active recall on definitions of incorrect answers.",
                "Generate a focused 5-question micro-quiz on weak topics."
            ]

        return Response({
            "attempt": clean_doc(attempt),
            "xp_earned": earned_xp,
            "xp_total": user.xp_points,
            "recommendations": recommendations[:3]
        }, status=status.HTTP_201_CREATED)

class QuizHintView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        question_text = request.data.get("question")
        subject = request.data.get("subject", "General")
        
        if not question_text:
            return Response({"error": "question text is required"}, status=400)

        user_id = request.user.id
        from config.mongodb import db
        purchase = db["user_purchases"].find_one({"user_id": user_id, "item_id": "consumable_hint_token"})
        
        if not purchase or purchase.get("quantity", 0) <= 0:
            return Response({"error": "No hint tokens available. Purchase them in the Store first!"}, status=403)

        # Deduct a hint token
        db["user_purchases"].update_one(
            {"user_id": user_id, "item_id": "consumable_hint_token"},
            {"$inc": {"quantity": -1}}
        )

        try:
            from apps.ai_engine.gemini import call_gemini
            prompt = f"""
            You are a helpful study tutor. A student needs a hint for the following quiz question:
            Question: {question_text}
            
            Subject: {subject}
            
            Provide a short, helpful hint that guides the student to the correct answer without giving away the direct answer. Keep it under 2 sentences.
            """
            hint = call_gemini(prompt)
        except Exception:
            hint = f"Recall the core principles of {subject} that apply to this problem."

        return Response({
            "success": True,
            "hint": hint.strip(),
            "remaining_tokens": purchase.get("quantity", 1) - 1
        })
