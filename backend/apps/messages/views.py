import datetime
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from config.mongodb import db, clean_doc, clean_docs, get_object_id
from bson import ObjectId

messages_col = db["messages"]
rooms_col = db["message_rooms"]
friends_col = db["friends"]
groups_col = db["groups"]
communities_col = db["communities"]
community_members_col = db["community_members"]
invites_col = db["community_invites"]


def get_user_msg_id(user):
    return getattr(user, "mongo_id", str(user.id))


def format_relative_time(dt):
    if not dt:
        return ""
    if isinstance(dt, str):
        return dt
    delta = datetime.datetime.utcnow() - dt
    minutes = int(delta.total_seconds() / 60)
    if minutes < 60:
        return f"{minutes} mins ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    days = hours // 24
    return f"{days} day{'s' if days > 1 else ''} ago"


class FriendListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_id = get_user_msg_id(request.user)
        friendships = list(friends_col.find({
            "$or": [
                {"user_id": {"$in": [user_id, str(request.user.id)]}, "status": "accepted"},
                {"friend_id": {"$in": [user_id, str(request.user.id)]}, "status": "accepted"},
            ]
        }))
        return Response(clean_docs(friendships))

    def post(self, request):
        """Send a friend request."""
        friend_id = str(request.data.get("friend_id", ""))
        if not friend_id:
            return Response({"error": "friend_id required"}, status=400)
        user_id = get_user_msg_id(request.user)
        if friend_id == user_id or friend_id == str(request.user.id):
            return Response({"error": "Cannot friend yourself"}, status=400)

        existing = friends_col.find_one({
            "$or": [
                {"user_id": {"$in": [user_id, str(request.user.id)]}, "friend_id": friend_id},
                {"user_id": friend_id, "friend_id": {"$in": [user_id, str(request.user.id)]}},
            ]
        })
        if existing:
            return Response(clean_doc(existing))

        now = datetime.datetime.utcnow()
        doc = {
            "user_id": user_id,
            "friend_id": friend_id,
            "status": "pending",
            "created_at": now,
            "updated_at": now,
        }
        result = friends_col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return Response(clean_doc(doc), status=status.HTTP_201_CREATED)


class FriendRequestActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id):
        action = request.data.get("action", "accept")
        friendship = friends_col.find_one({"_id": get_object_id(id)})
        if not friendship:
            return Response({"error": "Request not found"}, status=404)
        if str(friendship.get("friend_id")) not in (get_user_msg_id(request.user), str(request.user.id)):
            return Response({"error": "Not authorized"}, status=403)

        if action == "accept":
            friends_col.update_one(
                {"_id": friendship["_id"]},
                {"$set": {"status": "accepted", "updated_at": datetime.datetime.utcnow()}}
            )
            user_a = str(friendship["user_id"])
            user_b = str(friendship["friend_id"])
            get_or_create_dm(user_a, user_b)
        else:
            friends_col.delete_one({"_id": friendship["_id"]})

        updated = friends_col.find_one({"_id": friendship["_id"]})
        return Response(clean_doc(updated) if updated else {"status": "declined"})

    def delete(self, request, id):
        friendship = friends_col.find_one({"_id": get_object_id(id)})
        if not friendship:
            return Response({"error": "Not found"}, status=404)
        user_id = get_user_msg_id(request.user)
        user_ids = [user_id, str(request.user.id)]
        if str(friendship.get("user_id")) not in user_ids and str(friendship.get("friend_id")) not in user_ids:
            return Response({"error": "Not authorized"}, status=403)
        friends_col.delete_one({"_id": friendship["_id"]})
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_id = get_user_msg_id(request.user)
        groups = list(groups_col.find({"members": {"$in": [user_id, str(request.user.id)]}}))
        return Response(clean_docs(groups))

    def post(self, request):
        name = request.data.get("name", "Study Group")
        group_type = request.data.get("type", "study_group")
        members = [str(m) for m in request.data.get("members", [])]
        user_str_id = get_user_msg_id(request.user)
        if user_str_id not in members:
            members.append(user_str_id)
        now = datetime.datetime.utcnow()
        doc = {
            "name": name,
            "type": group_type,
            "owner_id": user_str_id,
            "admins": [user_str_id],
            "members": members,
            "created_at": now,
        }
        result = groups_col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return Response(clean_doc(doc), status=status.HTTP_201_CREATED)


def get_or_create_dm(user_a_id, user_b_id):
    """Get or create a DM room between two users."""
    members = sorted([str(user_a_id), str(user_b_id)])
    room = rooms_col.find_one({"type": "dm", "members": members})
    if not room:
        result = rooms_col.insert_one({
            "type": "dm",
            "members": members,
            "created_at": datetime.datetime.utcnow(),
        })
        room = rooms_col.find_one({"_id": result.inserted_id})
    return room


class RoomListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_id = get_user_msg_id(request.user)
        user_ids = [user_id, str(request.user.id)]
        rooms = list(rooms_col.find({"members": {"$in": user_ids}}))
        result = []
        for r in rooms:
            r_clean = clean_doc(r)
            # Get last message
            last_msg = messages_col.find_one(
                {"room_id": str(r["_id"])},
                sort=[("created_at", -1)]
            )
            r_clean["last_message"] = clean_doc(last_msg) if last_msg else None
            # Unread count
            r_clean["unread"] = messages_col.count_documents({
                "room_id": str(r["_id"]),
                "read_by": {"$nin": user_ids},
                "sender_id": {"$nin": user_ids},
            })
            result.append(r_clean)
        result.sort(key=lambda x: x.get("last_message", {}).get("created_at", "") if x.get("last_message") else "", reverse=True)
        return Response(result)

    def post(self, request):
        """Create a group room."""
        name = request.data.get("name", "Study Group")
        members = [str(m) for m in request.data.get("members", [])]
        user_str_id = get_user_msg_id(request.user)
        if user_str_id not in members:
            members.append(user_str_id)
        now = datetime.datetime.utcnow()
        doc = {
            "name": name,
            "type": "group",
            "owner_id": user_str_id,
            "members": members,
            "created_at": now,
        }
        result = rooms_col.insert_one(doc)
        room = rooms_col.find_one({"_id": result.inserted_id})
        return Response(clean_doc(room), status=status.HTTP_201_CREATED)


class StartDMView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        other_user_id = request.data.get("user_id")
        if not other_user_id:
            return Response({"error": "user_id required"}, status=400)
        room = get_or_create_dm(get_user_msg_id(request.user), other_user_id)
        return Response(clean_doc(room))


class RoomMessagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        room = rooms_col.find_one({"_id": get_object_id(room_id)})
        user_str_id = get_user_msg_id(request.user)
        room_members = [str(m) for m in room.get("members", [])] if room else []
        user_ids = [user_str_id, str(request.user.id)]
        
        is_member = any(uid in room_members for uid in user_ids)
        
        if not room:
            return Response({"error": "Room not found"}, status=404)
        
        if not is_member and room.get("type") == "community":
            community_id = room.get("community_id")
            if community_id:
                community = communities_col.find_one({"_id": get_object_id(community_id)})
                if community and any(uid in community.get("members", []) for uid in user_ids):
                    is_member = True
        
        if not is_member:
            return Response({"error": "Room not found or access denied"}, status=404)

        before = request.query_params.get("before")
        query = {"room_id": room_id}
        if before:
            query["_id"] = {"$lt": get_object_id(before)}

        msgs = list(messages_col.find(query).sort("created_at", -1).limit(50))
        msgs.reverse()

        # Mark as read
        messages_col.update_many(
            {"room_id": room_id, "read_by": {"$nin": [user_str_id, request.user.id, str(request.user.id)]}},
            {"$addToSet": {"read_by": user_str_id}}
        )

        return Response({
            "room": clean_doc(room),
            "messages": clean_docs(msgs),
        })

    def post(self, request, room_id):
        room = rooms_col.find_one({"_id": get_object_id(room_id)})
        user_str_id = get_user_msg_id(request.user)
        room_members = [str(m) for m in room.get("members", [])] if room else []
        user_ids = [user_str_id, str(request.user.id)]
        
        # Check direct membership or community membership
        is_member = any(uid in room_members for uid in user_ids)
        
        if not room:
            return Response({"error": "Room not found"}, status=404)
        
        if not is_member and room.get("type") == "community":
            # Check if user is a member of the community
            community_id = room.get("community_id")
            if community_id:
                community = communities_col.find_one({"_id": get_object_id(community_id)})
                if community and any(uid in community.get("members", []) for uid in user_ids):
                    is_member = True
        
        if not is_member:
            return Response({"error": "Access denied"}, status=403)

        text = request.data.get("text", "").strip()
        msg_type = request.data.get("type", "text")  # text | image | file | voice | document | sticker
        attachment_url = request.data.get("attachment_url")
        file_name = request.data.get("file_name")
        duration = request.data.get("duration")
        sticker_id = request.data.get("sticker_id")

        if not text and not attachment_url and not sticker_id:
            return Response({"error": "Message content is required"}, status=400)

        now = datetime.datetime.utcnow()
        doc = {
            "room_id": room_id,
            "sender_id": user_str_id,
            "sender_name": request.user.username,
            "text": text,
            "type": msg_type,
            "attachment_url": attachment_url,
            "file_name": file_name,
            "duration": duration,
            "sticker_id": sticker_id,
            "read_by": [user_str_id],
            "created_at": now,
        }
        result = messages_col.insert_one(doc)
        doc["_id"] = result.inserted_id

        # Update room's updated_at
        rooms_col.update_one({"_id": get_object_id(room_id)}, {"$set": {"updated_at": now}})

        # Trigger achievements stats for community messages
        if room and room.get("type") == "community":
            try:
                from apps.analytics.achievements_engine import track_user_action
                track_user_action(request.user.id, "community_messages")
            except Exception as e:
                print(f"Error triggering achievements: {e}")

        return Response(clean_doc(doc), status=status.HTTP_201_CREATED)


class UserListView(APIView):
    """List users to start a DM with."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from config.mongodb import users_col, clean_docs
        current_username = request.user.username
        # Query MongoDB collection excluding current user by username
        mongo_users = list(users_col.find({"username": {"$ne": current_username}}).limit(20))
        cleaned = clean_docs(mongo_users)
        
        response_users = []
        for u in cleaned:
            response_users.append({
                "id": u.get("id"),
                "username": u.get("username"),
                "email": u.get("email"),
                "role": u.get("role", "student")
            })
        return Response(response_users)


class AISuggestReplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        room_id = request.data.get("room_id")
        if not room_id:
            return Response({"error": "room_id is required"}, status=400)

        # Get last 5 messages for context
        msgs = list(messages_col.find({"room_id": room_id}).sort("created_at", -1).limit(5))
        msgs.reverse()
        
        if not msgs:
            return Response({"suggested_reply": "Hello! How can I help you today?"})

        context_str = "\n".join([f"{m.get('sender_name')}: {m.get('text')}" for m in msgs])

        from apps.ai_engine.gemini import call_gemini
        prompt = f"""
        You are helping an instructor/student reply to a classmate/student message thread.
        Based on this message history context:
        {context_str}
        
        Write a professional, brief, and helpful reply in 2-3 sentences max. Do not include quotes or surrounding text. Just return the response content.
        """
        suggested = call_gemini(prompt)
        return Response({"suggested_reply": suggested.strip('"\'')})

class MessageAttachmentUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        imagekit_config = getattr(settings, "IMAGEKIT_STORAGE", {})
        private_key = imagekit_config.get("PRIVATE_KEY")
        
        if private_key:
            try:
                from imagekitio import ImageKit
                imagekit = ImageKit(private_key=private_key)
                
                upload_result = imagekit.files.upload(
                    file=file_obj.read(),
                    file_name=f"messages/{file_obj.name}",
                    folder="messages/",
                    use_unique_file_name=True
                )
                
                return Response({
                    "url": upload_result.url,
                    "filename": file_obj.name,
                    "size": file_obj.size
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"error": f"ImageKit upload failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({"error": "ImageKit not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GroupMemberManageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        room_id = request.data.get("room_id")
        action = request.data.get("action")
        target_user_id = str(request.data.get("user_id"))

        if not room_id or not action or not target_user_id:
            return Response({"error": "room_id, action, and user_id are required"}, status=400)

        room = rooms_col.find_one({"_id": get_object_id(room_id)})
        if not room:
            return Response({"error": "Group not found"}, status=404)

        user_str_id = get_user_msg_id(request.user)
        is_owner = room.get("owner_id") == user_str_id
        is_admin = user_str_id in room.get("admins", [])

        if not is_owner and not is_admin:
            return Response({"error": "Permission denied"}, status=403)

        if action == "add":
            rooms_col.update_one(
                {"_id": get_object_id(room_id)},
                {"$addToSet": {"members": target_user_id}}
            )
        elif action == "remove":
            if target_user_id == room.get("owner_id"):
                return Response({"error": "Cannot remove group owner"}, status=400)
            rooms_col.update_one(
                {"_id": get_object_id(room_id)},
                {"$pull": {"members": target_user_id, "admins": target_user_id}}
            )
        elif action == "promote":
            rooms_col.update_one(
                {"_id": get_object_id(room_id)},
                {"$addToSet": {"admins": target_user_id}}
            )
        elif action == "demote":
            if target_user_id == room.get("owner_id"):
                return Response({"error": "Cannot demote owner"}, status=400)
            rooms_col.update_one(
                {"_id": get_object_id(room_id)},
                {"$pull": {"admins": target_user_id}}
            )
        else:
            return Response({"error": "Invalid action"}, status=400)

        updated_room = rooms_col.find_one({"_id": get_object_id(room_id)})
        return Response(clean_doc(updated_room))


class GroupInviteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_id):
        room = rooms_col.find_one({"_id": get_object_id(room_id)})
        if not room:
            return Response({"error": "Group not found"}, status=404)
        
        user_str_id = get_user_msg_id(request.user)
        is_admin = user_str_id in room.get("admins", [])
        is_owner = room.get("owner_id") == user_str_id
        
        if not is_admin and not is_owner:
            return Response({"error": "Permission denied"}, status=403)
        
        user_ids = request.data.get("user_ids", [])
        for uid in user_ids:
            invite_doc = {
                "room_id": room_id,
                "inviter_id": user_str_id,
                "invitee_id": str(uid),
                "status": "pending",
                "created_at": datetime.datetime.utcnow(),
            }
            invites_col.insert_one(invite_doc)
        
        return Response({"message": f"Invited {len(user_ids)} users"})


class CommunityListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_str_id = get_user_msg_id(request.user)
        communities = list(communities_col.find({
            "$or": [
                {"is_public": True},
                {"members": user_str_id}
            ]
        }).sort("created_at", -1))
        return Response(clean_docs(communities))

    def post(self, request):
        name = request.data.get("name", "New Community")
        description = request.data.get("description", "")
        is_public = request.data.get("is_public", True)
        user_str_id = get_user_msg_id(request.user)
        
        doc = {
            "name": name,
            "description": description,
            "owner_id": user_str_id,
            "is_public": is_public,
            "admins": [user_str_id],
            "members": [user_str_id],
            "created_at": datetime.datetime.utcnow(),
        }
        result = communities_col.insert_one(doc)
        doc["_id"] = result.inserted_id
        
        # Create room for community chat
        room_result = rooms_col.insert_one({
            "type": "community",
            "community_id": str(result.inserted_id),
            "name": name,
            "members": [user_str_id],
            "created_at": datetime.datetime.utcnow(),
        })
        
        # Trigger achievements stats for community creation
        try:
            from apps.analytics.achievements_engine import track_user_action
            track_user_action(request.user.id, "communities_created")
            track_user_action(request.user.id, "joined_communities")
        except Exception as e:
            print(f"Error triggering achievements: {e}")

        return Response(clean_doc(doc), status=status.HTTP_201_CREATED)


class CommunityDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, community_id):
        community = communities_col.find_one({"_id": get_object_id(community_id)})
        if not community:
            return Response({"error": "Community not found"}, status=404)
        return Response(clean_doc(community))


class CommunityJoinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, community_id):
        community = communities_col.find_one({"_id": get_object_id(community_id)})
        if not community:
            return Response({"error": "Community not found"}, status=404)
        
        if not community.get("is_public"):
            return Response({"error": "Cannot join private community directly"}, status=403)
        
        user_str_id = get_user_msg_id(request.user)
        if user_str_id in community.get("members", []):
            return Response({"message": "Already a member"})
        
        communities_col.update_one(
            {"_id": community["_id"]},
            {"$addToSet": {"members": user_str_id}}
        )
        
        # Trigger achievements stats for community join
        try:
            from apps.analytics.achievements_engine import track_user_action
            track_user_action(request.user.id, "joined_communities")
        except Exception as e:
            print(f"Error triggering achievements: {e}")
        
        return Response({"message": "Joined successfully"})


class CommunityInviteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, community_id):
        community = communities_col.find_one({"_id": get_object_id(community_id)})
        if not community:
            return Response({"error": "Community not found"}, status=404)
        
        user_str_id = get_user_msg_id(request.user)
        is_admin = user_str_id in community.get("admins", [])
        is_member = user_str_id in community.get("members", [])
        
        if not is_member and not is_admin:
            return Response({"error": "Not a community member"}, status=403)
        
        invitee_ids = request.data.get("user_ids", [])
        for invitee_id in invitee_ids:
            invite_doc = {
                "community_id": community_id,
                "inviter_id": user_str_id,
                "invitee_id": str(invitee_id),
                "status": "pending",
                "created_at": datetime.datetime.utcnow(),
            }
            invites_col.insert_one(invite_doc)
        
        return Response({"message": f"Invited {len(invitee_ids)} users"})

    def get(self, request, community_id):
        user_str_id = get_user_msg_id(request.user)
        invites = list(invites_col.find({"invitee_id": user_str_id, "status": "pending"}))
        return Response(clean_docs(invites))


class CommunityInviteActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_str_id = get_user_msg_id(request.user)
        invites = list(invites_col.find({"invitee_id": user_str_id, "status": "pending"}))
        return Response(clean_docs(invites))

    def post(self, request, invite_id=None):
        action = request.data.get("action")
        
        # Handle pending invites list
        if invite_id is None:
            return Response({"error": "invite_id required"}, status=400)
        
        invite = invites_col.find_one({"_id": get_object_id(invite_id)})
        if not invite:
            return Response({"error": "Invite not found"}, status=404)
        
        user_str_id = get_user_msg_id(request.user)
        if str(invite.get("invitee_id")) != user_str_id and str(invite.get("invitee_id")) != str(request.user.id):
            return Response({"error": "Not authorized"}, status=403)
        
        if action == "accept":
            community_id = invite.get("community_id")
            community_members_col.insert_one({
                "community_id": community_id,
                "user_id": user_str_id,
                "joined_at": datetime.datetime.utcnow(),
            })
            communities_col.update_one(
                {"_id": get_object_id(community_id)},
                {"$addToSet": {"members": user_str_id}}
            )
            invites_col.update_one({"_id": get_object_id(invite_id)}, {"$set": {"status": "accepted"}})
        elif action == "decline":
            invites_col.update_one({"_id": get_object_id(invite_id)}, {"$set": {"status": "declined"}})
        
        return Response({"status": "ok"})


class CommunityJoinRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, community_id):
        community = communities_col.find_one({"_id": get_object_id(community_id)})
        if not community:
            return Response({"error": "Community not found"}, status=404)
        
        if community.get("is_public"):
            return Response({"error": "Use /join endpoint for public communities"}, status=400)
        
        user_str_id = get_user_msg_id(request.user)
        if user_str_id in community.get("members", []):
            return Response({"message": "Already a member"})
        
        communities_col.update_one(
            {"_id": community["_id"]},
            {"$addToSet": {"pending_requests": user_str_id}}
        )
        
        return Response({"message": "Request sent"})

    def get(self, request, community_id):
        community = communities_col.find_one({"_id": get_object_id(community_id)})
        if not community:
            return Response({"error": "Community not found"}, status=404)
        
        user_str_id = get_user_msg_id(request.user)
        is_admin = user_str_id in community.get("admins", [])
        
        if not is_admin:
            return Response({"error": "Admin only"}, status=403)
        
        return Response({"pending_requests": community.get("pending_requests", [])})


class CommunityApproveRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, community_id):
        user_id = request.data.get("user_id")
        community = communities_col.find_one({"_id": get_object_id(community_id)})
        if not community:
            return Response({"error": "Community not found"}, status=404)
        
        user_str_id = get_user_msg_id(request.user)
        is_admin = user_str_id in community.get("admins", [])
        
        if not is_admin:
            return Response({"error": "Admin only"}, status=403)
        
        communities_col.update_one(
            {"_id": community["_id"]},
            {"$pull": {"pending_requests": user_id}, "$addToSet": {"members": user_id}}
        )
        
        return Response({"message": "User approved"})


class CommunityModerationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, community_id):
        action = request.data.get("action")
        target_user = request.data.get("user_id")
        message_id = request.data.get("message_id")
        
        community = communities_col.find_one({"_id": get_object_id(community_id)})
        if not community:
            return Response({"error": "Community not found"}, status=404)
        
        user_str_id = get_user_msg_id(request.user)
        is_admin = user_str_id in community.get("admins", [])
        is_owner = community.get("owner_id") == user_str_id
        
        if not is_admin and not is_owner:
            return Response({"error": "Permission denied"}, status=403)
        
        if action == "kick":
            communities_col.update_one(
                {"_id": community["_id"]},
                {"$pull": {"members": target_user}}
            )
        elif action == "ban":
            communities_col.update_one(
                {"_id": community["_id"]},
                {"$pull": {"members": target_user}, "$addToSet": {"banned": target_user}}
            )
        elif action == "pin":
            communities_col.update_one(
                {"_id": community["_id"]},
                {"$addToSet": {"pinned_messages": message_id}}
            )
        elif action == "delete":
            messages_col.delete_one({"_id": get_object_id(message_id)})
        elif action == "report":
            report_doc = {
                "reported_user": target_user,
                "community_id": community_id,
                "reason": request.data.get("reason", ""),
                "reporter": user_str_id,
                "created_at": datetime.datetime.utcnow(),
            }
            db["reports"].insert_one(report_doc)
        
        return Response({"status": "ok"})

