import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from datetime import date, timedelta
from config.mongodb import plans_col, clean_doc

class GeneratePlanView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        subjects = request.data.get("subjects", ["Math", "Chemistry"])
        exam_date = request.data.get("exam_date", "2026-07-25")
        daily_hours = request.data.get("daily_hours", 3)

        # Generate a clean schedule dynamically
        plan = {
            "user_id": request.user.id,
            "days": [
                {
                    "date": str(date.today()),
                    "tasks": [
                        {
                            "id": 1,
                            "subject": subjects[0] if len(subjects) > 0 else "Math",
                            "topic": "Introduction and basics review",
                            "duration_mins": 45,
                            "completed": False
                        },
                        {
                            "id": 2,
                            "subject": subjects[1] if len(subjects) > 1 else "Chemistry",
                            "topic": "Core concepts and formula practice",
                            "duration_mins": 45,
                            "completed": False
                        }
                    ]
                },
                {
                    "date": str(date.today() + timedelta(days=1)),
                    "tasks": [
                        {
                            "id": 3,
                            "subject": subjects[0] if len(subjects) > 0 else "Math",
                            "topic": "Intermediate exercise problems",
                            "duration_mins": 60,
                            "completed": False
                        }
                    ]
                }
            ],
            "updated_at": datetime.datetime.utcnow()
        }
        
        # Upsert the user's plan in MongoDB
        plans_col.update_one(
            {"user_id": request.user.id},
            {"$set": plan},
            upsert=True
        )
        
        # Trigger achievements stats
        try:
            from apps.analytics.achievements_engine import track_user_action
            track_user_action(request.user.id, "plans_created")
        except Exception as e:
            print(f"Error triggering achievements: {e}")

        saved_plan = plans_col.find_one({"user_id": request.user.id})
        return Response(clean_doc(saved_plan))

class GetPlanView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        plan = plans_col.find_one({"user_id": request.user.id})
        if not plan:
            # Fallback mock plan if none has been generated
            plan = {
                "user_id": request.user.id,
                "days": [
                    {
                        "date": str(date.today()),
                        "tasks": [
                            {
                                "id": 1,
                                "subject": "Math",
                                "topic": "Organic Carbon Valency",
                                "duration_mins": 45,
                                "completed": False
                            }
                        ]
                    }
                ]
            }
        return Response(clean_doc(plan))

class GetTodayTasksView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        plan = plans_col.find_one({"user_id": request.user.id})
        today_str = str(date.today())
        
        if plan:
            for day in plan.get("days", []):
                if day["date"] == today_str:
                    return Response(day["tasks"])
                    
        # Fallback empty tasks list if not generated
        return Response([
            {
                "id": 1,
                "subject": "Chemistry",
                "topic": "Organic Carbon Valency",
                "duration_mins": 45,
                "completed": False
            }
        ])

class TaskCompleteToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, task_id, *args, **kwargs):
        plan = plans_col.find_one({"user_id": request.user.id})
        if not plan:
            plan = {
                "user_id": request.user.id,
                "days": [
                    {
                        "date": str(date.today()),
                        "tasks": [
                            {
                                "id": 1,
                                "subject": "Math",
                                "topic": "Organic Carbon Valency",
                                "duration_mins": 45,
                                "completed": False
                            }
                        ]
                    }
                ],
                "updated_at": datetime.datetime.utcnow()
            }
            plans_col.insert_one(plan)
            
        found = False
        days = plan.get("days", [])
        for day in days:
            for task in day.get("tasks", []):
                if task["id"] == int(task_id):
                    task["completed"] = not task["completed"]
                    found = True
                    # Reward XP if completed
                    if task["completed"]:
                        user = request.user
                        user.xp_points += 100
                        user.save()
                        
                        # Trigger achievements stats
                        try:
                            from apps.analytics.achievements_engine import track_user_action
                            track_user_action(request.user.id, "planner_tasks_completed")
                        except Exception as e:
                            print(f"Error triggering achievements: {e}")
                    break
            if found:
                break
                
        if found:
            plans_col.update_one(
                {"user_id": request.user.id},
                {"$set": {"days": days, "updated_at": datetime.datetime.utcnow()}}
            )
            updated_plan = plans_col.find_one({"user_id": request.user.id})
            return Response(clean_doc(updated_plan))
            
        return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)


class CreateCustomTaskView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        subject = request.data.get("subject", "General")
        topic = request.data.get("topic")
        duration_mins = int(request.data.get("duration_mins", 30))
        target_date = request.data.get("date", str(date.today()))

        if not topic:
            return Response({"error": "topic is required"}, status=status.HTTP_400_BAD_REQUEST)

        plan = plans_col.find_one({"user_id": request.user.id})
        if not plan:
            plan = {
                "user_id": request.user.id,
                "days": [],
                "updated_at": datetime.datetime.utcnow()
            }

        # Calculate unique task ID
        max_id = 0
        for day in plan.get("days", []):
            for task in day.get("tasks", []):
                if task.get("id", 0) > max_id:
                    max_id = task["id"]
        new_task_id = max_id + 1

        new_task = {
            "id": new_task_id,
            "subject": subject,
            "topic": topic,
            "duration_mins": duration_mins,
            "completed": False
        }

        # Find or create day entry
        days = plan.get("days", [])
        day_found = False
        for day in days:
            if day.get("date") == target_date:
                day.setdefault("tasks", []).append(new_task)
                day_found = True
                break

        if not day_found:
            days.append({
                "date": target_date,
                "tasks": [new_task]
            })

        plans_col.update_one(
            {"user_id": request.user.id},
            {"$set": {"days": days, "updated_at": datetime.datetime.utcnow()}},
            upsert=True
        )

        updated_plan = plans_col.find_one({"user_id": request.user.id})
        return Response(clean_doc(updated_plan), status=status.HTTP_201_CREATED)


class DeleteTaskView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, task_id, *args, **kwargs):
        plan = plans_col.find_one({"user_id": request.user.id})
        if not plan:
            return Response({"error": "Plan not found"}, status=status.HTTP_404_NOT_FOUND)

        days = plan.get("days", [])
        found = False
        for day in days:
            original_tasks = day.get("tasks", [])
            filtered_tasks = [t for t in original_tasks if t.get("id") != int(task_id)]
            if len(original_tasks) != len(filtered_tasks):
                day["tasks"] = filtered_tasks
                found = True
                break

        if found:
            plans_col.update_one(
                {"user_id": request.user.id},
                {"$set": {"days": days, "updated_at": datetime.datetime.utcnow()}}
            )
            updated_plan = plans_col.find_one({"user_id": request.user.id})
            return Response(clean_doc(updated_plan))

        return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)


from config.mongodb import db, get_object_id, clean_docs

kanban_col = db["kanban_tasks"]

class KanbanListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tasks = list(kanban_col.find({"user_id": request.user.id}))
        return Response(clean_docs(tasks))

    def post(self, request, *args, **kwargs):
        topic = request.data.get("topic")
        subject = request.data.get("subject", "General")
        status_val = request.data.get("status", "todo")
        duration_mins = request.data.get("duration_mins", 30)

        if not topic:
            return Response({"error": "topic is required"}, status=status.HTTP_400_BAD_REQUEST)

        task = {
            "user_id": request.user.id,
            "topic": topic,
            "subject": subject,
            "status": status_val,
            "duration_mins": int(duration_mins),
            "created_at": datetime.datetime.utcnow()
        }
        result = kanban_col.insert_one(task)
        task["id"] = str(result.inserted_id)
        return Response(clean_doc(task), status=status.HTTP_201_CREATED)

class KanbanDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk, *args, **kwargs):
        task = kanban_col.find_one({"_id": get_object_id(pk), "user_id": request.user.id})
        if not task:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        updates = {}
        if "topic" in request.data:
            updates["topic"] = request.data["topic"]
        if "subject" in request.data:
            updates["subject"] = request.data["subject"]
        if "status" in request.data:
            updates["status"] = request.data["status"]
        if "duration_mins" in request.data:
            updates["duration_mins"] = int(request.data["duration_mins"])

        if updates:
            kanban_col.update_one({"_id": get_object_id(pk)}, {"$set": updates})

        updated_task = kanban_col.find_one({"_id": get_object_id(pk)})
        return Response(clean_doc(updated_task))

    def delete(self, request, pk, *args, **kwargs):
        result = kanban_col.delete_one({"_id": get_object_id(pk), "user_id": request.user.id})
        if result.deleted_count == 0:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"message": "Task deleted successfully"}, status=status.HTTP_200_OK)
