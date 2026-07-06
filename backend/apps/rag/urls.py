from django.urls import path
from .views import RagSearchView, RagChatView, RagChatHistoryView, RagSynthesisChatView

urlpatterns = [
    path("search/", RagSearchView.as_view(), name="rag_search"),
    path("chat/", RagChatView.as_view(), name="rag_chat"),
    path("chat/history/", RagChatHistoryView.as_view(), name="rag_chat_history"),
    path("chat/synthesis/", RagSynthesisChatView.as_view(), name="rag_chat_synthesis"),
]
