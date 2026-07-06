import datetime
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from config.mongodb import decks_col, cards_col, get_object_id, clean_doc, clean_docs
from .serializers import FlashcardDeckSerializer, FlashcardSerializer
from .sm2 import update_card

class DeckListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        decks = list(decks_col.find({"user_id": request.user.id}))
        cleaned_decks = clean_docs(decks)
        
        # Populate cards count for each deck
        for deck in cleaned_decks:
            count = cards_col.count_documents({"deck": deck["id"]})
            deck["cards_count"] = count
            
        return Response(cleaned_decks)

    def post(self, request, *args, **kwargs):
        serializer = FlashcardDeckSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        deck_data = serializer.validated_data
        deck_data["user_id"] = request.user.id
        deck_data["created_at"] = datetime.datetime.utcnow()

        result = decks_col.insert_one(deck_data)
        deck_data["id"] = str(result.inserted_id)
        deck_data["cards_count"] = 0

        # Trigger achievements stats
        try:
            from apps.analytics.achievements_engine import track_user_action
            track_user_action(request.user.id, "decks_created")
        except Exception as e:
            print(f"Error triggering achievements: {e}")

        return Response(clean_doc(deck_data), status=status.HTTP_201_CREATED)

class DeckDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        deck = decks_col.find_one({"_id": get_object_id(pk), "user_id": request.user.id})
        if not deck:
            return Response({"error": "Deck not found"}, status=status.HTTP_404_NOT_FOUND)
        
        cleaned_deck = clean_doc(deck)
        cleaned_deck["cards_count"] = cards_col.count_documents({"deck": pk})
        return Response(cleaned_deck)

class DueCardsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, deck_id, *args, **kwargs):
        # Verify deck belongs to the user
        deck = decks_col.find_one({"_id": get_object_id(deck_id), "user_id": request.user.id})
        if not deck:
            return Response({"error": "Deck not found or access denied"}, status=status.HTTP_404_NOT_FOUND)

        # Get cards that are due (next_review <= end of today)
        today_max = datetime.datetime.combine(datetime.date.today(), datetime.time.max)
        cards = list(cards_col.find({
            "deck": deck_id,
            "next_review": {"$lte": today_max}
        }))
        return Response(clean_docs(cards))

class AddCardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = FlashcardSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        card_data = serializer.validated_data
        deck_id = card_data.get("deck")
        
        # Verify deck ownership
        deck = decks_col.find_one({"_id": get_object_id(deck_id), "user_id": request.user.id})
        if not deck:
            return Response({"error": "Deck not found or access denied"}, status=status.HTTP_404_NOT_FOUND)

        # Set default SM-2 values
        today_midnight = datetime.datetime.combine(datetime.date.today(), datetime.time.min)
        card_data["ease_factor"] = 2.5
        card_data["interval_days"] = 1
        card_data["repetitions"] = 0
        card_data["next_review"] = today_midnight
        card_data["last_rating"] = ""

        result = cards_col.insert_one(card_data)
        card_data["id"] = str(result.inserted_id)

        return Response(clean_doc(card_data), status=status.HTTP_201_CREATED)

class RateCardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        card_id = request.data.get("card_id")
        rating = request.data.get("rating")

        if not card_id or not rating:
            return Response({"error": "card_id and rating are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Find card
        card = cards_col.find_one({"_id": get_object_id(card_id)})
        if not card:
            return Response({"error": "Card not found"}, status=status.HTTP_404_NOT_FOUND)

        # Verify deck ownership
        deck_id = card.get("deck")
        deck = decks_col.find_one({"_id": get_object_id(deck_id), "user_id": request.user.id})
        if not deck:
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

        updated_card = update_card(card, rating)
        
        # Award 50 XP to the user
        user = request.user
        user.xp_points += 50
        user.save()

        # Trigger achievements stats
        try:
            from apps.analytics.achievements_engine import track_user_action
            rating_int = int(rating)
            track_user_action(request.user.id, "flashcard_reviews", 1)
            if rating_int >= 4:
                track_user_action(request.user.id, "mastered_flashcards", 1)
            if rating_int == 5:
                track_user_action(request.user.id, "perfect_flashcards", 1)
        except Exception as e:
            print(f"Error triggering achievements: {e}")
        
        return Response(clean_doc(updated_card))
