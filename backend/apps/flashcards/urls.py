from django.urls import path
from .views import DeckListCreateView, DeckDetailView, DueCardsView, AddCardView, RateCardView

urlpatterns = [
    path("", DeckListCreateView.as_view(), name="deck_list_create"),
    path("cards/", AddCardView.as_view(), name="add_card_manually"),
    path("rate/", RateCardView.as_view(), name="rate_card"),
    path("<str:pk>/", DeckDetailView.as_view(), name="deck_detail"),
    path("<str:deck_id>/review/", DueCardsView.as_view(), name="deck_due_cards"),
]
