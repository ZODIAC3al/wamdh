from django.urls import path
from .views import (
    RoomListView, RoomMessagesView, StartDMView, UserListView, AISuggestReplyView,
    FriendListView, FriendRequestActionView, GroupListView, MessageAttachmentUploadView,
    GroupMemberManageView, GroupInviteView, CommunityListView, CommunityDetailView,
    CommunityInviteView, CommunityInviteActionView, CommunityJoinView,
    CommunityJoinRequestView, CommunityApproveRequestView, CommunityModerationView
)
from .posts import (
    CommunityPostListView, CommunityPostLikeView, CommunityResourceListView
)

urlpatterns = [
    path("rooms/", RoomListView.as_view(), name="message_rooms"),
    path("rooms/<str:room_id>/", RoomMessagesView.as_view(), name="room_messages"),
    path("dm/start/", StartDMView.as_view(), name="start_dm"),
    path("users/", UserListView.as_view(), name="message_users"),
    path("ai-suggest/", AISuggestReplyView.as_view(), name="ai_suggest_reply"),
    path("friends/", FriendListView.as_view(), name="message_friends"),
    path("friends/<str:id>/", FriendRequestActionView.as_view(), name="message_friend_action"),
    path("groups/", GroupListView.as_view(), name="message_groups"),
    path("groups/manage/", GroupMemberManageView.as_view(), name="group_member_manage"),
    path("groups/<str:room_id>/invite/", GroupInviteView.as_view(), name="group_invite"),
    path("upload/", MessageAttachmentUploadView.as_view(), name="message_attachment_upload"),
    path("communities/", CommunityListView.as_view(), name="community_list"),
    path("communities/<str:community_id>/", CommunityDetailView.as_view(), name="community_detail"),
    path("communities/<str:community_id>/invite/", CommunityInviteView.as_view(), name="community_invite"),
    path("communities/invites/pending/", CommunityInviteActionView.as_view(), name="pending_invites"),
    path("invites/<str:invite_id>/action/", CommunityInviteActionView.as_view(), name="community_invite_action"),
    path("communities/<str:community_id>/join/", CommunityJoinView.as_view(), name="community_join"),
    path("communities/<str:community_id>/request/", CommunityJoinRequestView.as_view(), name="community_request"),
    path("communities/<str:community_id>/approve/", CommunityApproveRequestView.as_view(), name="community_approve"),
    path("communities/<str:community_id>/moderate/", CommunityModerationView.as_view(), name="community_moderate"),
    path("communities/<str:community_id>/posts/", CommunityPostListView.as_view(), name="community_posts"),
    path("posts/<str:post_id>/like/", CommunityPostLikeView.as_view(), name="community_post_like"),
    path("communities/<str:community_id>/resources/", CommunityResourceListView.as_view(), name="community_resources"),
]
