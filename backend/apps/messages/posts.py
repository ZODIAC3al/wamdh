import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from config.mongodb import db, clean_doc, clean_docs, get_object_id
from bson import ObjectId

posts_col = db["community_posts"]
resources_col = db["community_resources"]
communities_col = db["communities"]
notes_col = db["notes"]


class CommunityPostListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, community_id):
        # Verify community exists and user is a member
        community = communities_col.find_one({"_id": get_object_id(community_id)})
        if not community:
            return Response({"error": "Community not found"}, status=404)
        
        user_str_id = getattr(request.user, "mongo_id", str(request.user.id))
        user_ids = [user_str_id, str(request.user.id)]
        is_member = any(uid in community.get("members", []) for uid in user_ids)
        
        if not community.get("is_public") and not is_member:
            return Response({"error": "Access denied"}, status=403)

        posts = list(posts_col.find({"community_id": community_id}).sort("created_at", -1))
        return Response(clean_docs(posts))

    def post(self, request, community_id):
        community = communities_col.find_one({"_id": get_object_id(community_id)})
        if not community:
            return Response({"error": "Community not found"}, status=404)

        user_str_id = getattr(request.user, "mongo_id", str(request.user.id))
        user_ids = [user_str_id, str(request.user.id)]
        is_member = any(uid in community.get("members", []) for uid in user_ids)

        if not is_member:
            return Response({"error": "You must join the community to post"}, status=403)

        text = request.data.get("text", "").strip()
        if not text:
            return Response({"error": "Text content is required"}, status=400)

        post_doc = {
            "community_id": community_id,
            "author_id": user_str_id,
            "author_name": request.user.username,
            "text": text,
            "likes_count": 0,
            "liked_by": [],
            "created_at": datetime.datetime.utcnow()
        }
        result = posts_col.insert_one(post_doc)
        post_doc["_id"] = result.inserted_id

        # Trigger achievements stats
        try:
            from apps.analytics.achievements_engine import track_user_action
            track_user_action(request.user.id, "community_messages")
        except Exception as e:
            print(f"Error triggering achievements: {e}")

        return Response(clean_doc(post_doc), status=status.HTTP_201_CREATED)


class CommunityPostLikeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        post_item = posts_col.find_one({"_id": get_object_id(post_id)})
        if not post_item:
            return Response({"error": "Post not found"}, status=404)

        user_str_id = getattr(request.user, "mongo_id", str(request.user.id))
        liked_by = post_item.get("liked_by", [])

        if user_str_id in liked_by:
            # Unlike
            posts_col.update_one(
                {"_id": post_item["_id"]},
                {
                    "$pull": {"liked_by": user_str_id},
                    "$inc": {"likes_count": -1}
                }
            )
            message = "Unliked"
        else:
            # Like
            posts_col.update_one(
                {"_id": post_item["_id"]},
                {
                    "$addToSet": {"liked_by": user_str_id},
                    "$inc": {"likes_count": 1}
                }
            )
            message = "Liked"

        updated = posts_col.find_one({"_id": post_item["_id"]})
        return Response({"message": message, "post": clean_doc(updated)})


class CommunityResourceListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, community_id):
        community = communities_col.find_one({"_id": get_object_id(community_id)})
        if not community:
            return Response({"error": "Community not found"}, status=404)

        resources = list(resources_col.find({"community_id": community_id}).sort("created_at", -1))
        return Response(clean_docs(resources))

    def post(self, request, community_id):
        community = communities_col.find_one({"_id": get_object_id(community_id)})
        if not community:
            return Response({"error": "Community not found"}, status=404)

        user_str_id = getattr(request.user, "mongo_id", str(request.user.id))
        user_ids = [user_str_id, str(request.user.id)]
        is_member = any(uid in community.get("members", []) for uid in user_ids)

        if not is_member:
            return Response({"error": "You must join the community to share resources"}, status=403)

        note_id = request.data.get("note_id")
        if not note_id:
            return Response({"error": "note_id is required"}, status=400)

        # Retrieve user's note
        note = notes_col.find_one({"_id": get_object_id(note_id)})
        if not note:
            return Response({"error": "Note not found"}, status=404)

        # Check if already shared
        existing = resources_col.find_one({"community_id": community_id, "note_id": note_id})
        if existing:
            return Response(clean_doc(existing), status=200)

        resource_doc = {
            "community_id": community_id,
            "note_id": note_id,
            "title": note.get("title", "Untitled Note"),
            "raw_text": note.get("raw_text", "")[:1000], # excerpt
            "subject": note.get("subject", "General"),
            "file_type": note.get("file_type", "text"),
            "file_url": note.get("file_url", ""),
            "shared_by_name": request.user.username,
            "shared_by_id": user_str_id,
            "created_at": datetime.datetime.utcnow()
        }
        result = resources_col.insert_one(resource_doc)
        resource_doc["_id"] = result.inserted_id

        # Trigger achievements stats
        try:
            from apps.analytics.achievements_engine import track_user_action
            track_user_action(request.user.id, "community_resources_shared")
        except Exception as e:
            print(f"Error triggering achievements: {e}")

        return Response(clean_doc(resource_doc), status=status.HTTP_201_CREATED)
