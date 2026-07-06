from rest_framework import serializers

class FlashcardSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    deck = serializers.CharField(required=False, default="")  # Holds the MongoDB deck ID
    front = serializers.CharField(required=True)
    back = serializers.CharField(required=True)
    ease_factor = serializers.FloatField(read_only=True, default=2.5)
    interval_days = serializers.IntegerField(read_only=True, default=1)
    repetitions = serializers.IntegerField(read_only=True, default=0)
    next_review = serializers.CharField(read_only=True)
    last_rating = serializers.CharField(read_only=True, required=False, default="")

class FlashcardDeckSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField(max_length=255, required=True)
    subject = serializers.CharField(max_length=100, required=True)
    cards_count = serializers.IntegerField(read_only=True, default=0)
    created_at = serializers.CharField(read_only=True)
