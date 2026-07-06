from rest_framework import serializers

class NoteSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    username = serializers.CharField(read_only=True)
    title = serializers.CharField(max_length=255, required=True)
    subject = serializers.CharField(max_length=100, required=True)
    topic = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    raw_text = serializers.CharField(required=False, allow_blank=True, default="")
    file_url = serializers.CharField(read_only=True, default="")
    file_type = serializers.CharField(read_only=True, default="")
    chunks = serializers.ListField(child=serializers.CharField(), read_only=True, default=list)
    word_count = serializers.IntegerField(read_only=True, default=0)
    is_processed = serializers.BooleanField(read_only=True, default=False)
    created_at = serializers.CharField(read_only=True)
