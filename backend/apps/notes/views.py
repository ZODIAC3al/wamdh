import datetime
import tempfile
import requests as req
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from config.mongodb import notes_col, embeddings_col, get_object_id, clean_doc, clean_docs
from .serializers import NoteSerializer
from .processor import extract_text_from_pdf, extract_text_from_image, clean_text, chunk_text
from apps.rag.embedder import embed_chunk
from apps.rag.search import cosine_similarity

IMAGEKIT_PRIVATE_KEY = None

try:
    import imagekitio
    from django.conf import settings
    IMAGEKIT_PRIVATE_KEY = getattr(settings, "IMAGEKIT_STORAGE", {}).get("PRIVATE_KEY")
except ImportError:
    pass


def upload_to_imagekit(file_obj, folder="notes/"):
    if not IMAGEKIT_PRIVATE_KEY:
        return None, None
    
    try:
        from imagekitio import ImageKit
        imagekit = ImageKit(private_key=IMAGEKIT_PRIVATE_KEY)
        
        upload_result = imagekit.files.upload(
            file=file_obj.read(),
            file_name=f"{folder}{file_obj.name}",
            folder=folder,
            use_unique_file_name=True
        )
        
        return upload_result.url, upload_result.file_id
    except Exception as e:
        print(f"ImageKit upload error: {e}")
        return None, None


def download_for_processing(file_url):
    try:
        resp = req.get(file_url, timeout=30)
        if resp.status_code == 200:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(resp.content)
                return tmp.name
    except Exception as e:
        print(f"Download error: {e}")
    return None


class NoteListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        notes = list(notes_col.find({"user_id": request.user.id}))
        return Response(clean_docs(notes))

    def post(self, request, *args, **kwargs):
        serializer = NoteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        note_data = serializer.validated_data
        note_data["user_id"] = request.user.id
        note_data["username"] = request.user.username
        note_data["created_at"] = datetime.datetime.utcnow()
        note_data["file_url"] = ""
        note_data["file_type"] = "text"
        note_data["chunks"] = []
        note_data["word_count"] = 0
        note_data["is_processed"] = False

        text = note_data.get("raw_text", "")
        file_path = None
        
        # If there's an uploaded file, extract text from it
        if "file" in request.FILES:
            file_obj = request.FILES["file"]
            
            file_ext = file_obj.name.lower().split(".")[-1] if "." in file_obj.name else ""
            
            if file_ext == "pdf":
                ik_url, ik_file_id = upload_to_imagekit(file_obj, folder="notes/")
                if ik_url:
                    note_data["file_url"] = ik_url
                    note_data["imagekit_file_id"] = ik_file_id
                    file_path = download_for_processing(ik_url)
                    if file_path:
                        text = extract_text_from_pdf(file_path)
                else:
                    return Response({"error": "ImageKit not configured for PDF upload"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                note_data["file_type"] = "pdf"
            elif file_ext in ["mp3", "mp4", "wav", "m4a", "ogg"]:
                ik_url, ik_file_id = upload_to_imagekit(file_obj, folder="voice/")
                if ik_url:
                    note_data["file_url"] = ik_url
                    note_data["imagekit_file_id"] = ik_file_id
                else:
                    return Response({"error": "ImageKit not configured for voice upload"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                note_data["file_type"] = "voice"
                text = f"[Voice message: {file_obj.name}]"
            else:
                from django.conf import settings
                cloudinary_configured = (
                    hasattr(settings, "CLOUDINARY_STORAGE") and
                    settings.CLOUDINARY_STORAGE.get("CLOUD_NAME") and
                    settings.CLOUDINARY_STORAGE.get("API_KEY")
                )
                if cloudinary_configured:
                    try:
                        import cloudinary.uploader
                        cloudinary.config(
                            cloud_name=settings.CLOUDINARY_STORAGE["CLOUD_NAME"],
                            api_key=settings.CLOUDINARY_STORAGE["API_KEY"],
                            api_secret=settings.CLOUDINARY_STORAGE["API_SECRET"]
                        )
                        upload_result = cloudinary.uploader.upload(file_obj, folder="wamdh/notes/")
                        note_data["file_url"] = upload_result.get("secure_url", "")
                    except Exception as e:
                        return Response({"error": f"Cloudinary upload failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                else:
                    return Response({"error": "Cloudinary not configured for image upload"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                note_data["file_type"] = "image"
                text = extract_text_from_image(file_path) if file_path else ""
        
        cleaned = clean_text(text)
        chunks = chunk_text(cleaned)
        
        note_data["raw_text"] = cleaned
        note_data["chunks"] = chunks
        note_data["word_count"] = len(cleaned.split())
        note_data["is_processed"] = True

        # Insert note into MongoDB
        result = notes_col.insert_one(note_data)
        note_id = str(result.inserted_id)
        note_data["id"] = note_id

        # Generate and save chunk embeddings
        for idx, chunk in enumerate(chunks):
            vector = embed_chunk(chunk)
            embeddings_col.insert_one({
                "note_id": note_id,
                "user_id": request.user.id,
                "chunk_index": idx,
                "chunk_text": chunk,
                "embedding_vector": vector,
                "created_at": datetime.datetime.utcnow()
            })

        # Trigger stats tracking for achievements
        try:
            from apps.analytics.achievements_engine import track_user_action
            track_user_action(request.user.id, "notes_created")
        except Exception as e:
            print(f"Error triggering achievements: {e}")

        return Response(clean_doc(note_data), status=status.HTTP_201_CREATED)

class NoteDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        note = notes_col.find_one({"_id": get_object_id(pk), "user_id": request.user.id})
        if not note:
            return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(clean_doc(note))

    def put(self, request, pk, *args, **kwargs):
        note = notes_col.find_one({"_id": get_object_id(pk), "user_id": request.user.id})
        if not note:
            return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = NoteSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        updated_fields = dict(serializer.validated_data)
        
        # If raw_text is updated, re-process chunks and embeddings
        if "raw_text" in updated_fields and updated_fields["raw_text"] != note.get("raw_text"):
            cleaned = clean_text(updated_fields["raw_text"])
            chunks = chunk_text(cleaned)
            updated_fields["raw_text"] = cleaned
            updated_fields["chunks"] = chunks
            updated_fields["word_count"] = len(cleaned.split())
            
            # Delete old embeddings
            embeddings_col.delete_many({"note_id": pk})
            
            # Insert new embeddings
            for idx, chunk in enumerate(chunks):
                vector = embed_chunk(chunk)
                embeddings_col.insert_one({
                    "note_id": pk,
                    "user_id": request.user.id,
                    "chunk_index": idx,
                    "chunk_text": chunk,
                    "embedding_vector": vector,
                    "created_at": datetime.datetime.utcnow()
                })

        notes_col.update_one({"_id": get_object_id(pk)}, {"$set": updated_fields})
        updated_note = notes_col.find_one({"_id": get_object_id(pk)})
        return Response(clean_doc(updated_note))

    def delete(self, request, pk, *args, **kwargs):
        result = notes_col.delete_one({"_id": get_object_id(pk), "user_id": request.user.id})
        if result.deleted_count == 0:
            return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)
        # Delete corresponding embeddings
        embeddings_col.delete_many({"note_id": pk})
        return Response({"message": "Note deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

class SubjectListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        subjects = notes_col.distinct("subject", {"user_id": request.user.id})
        return Response(list(subjects))


class NoteMindMapView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        embeddings = list(embeddings_col.find({"note_id": pk}))
        if not embeddings:
            return Response({"nodes": [], "edges": []})

        # Generate nodes
        nodes = []
        for emb in embeddings:
            nodes.append({
                "id": f"chunk_{emb['chunk_index']}",
                "label": emb["chunk_text"][:35] + "..." if len(emb["chunk_text"]) > 35 else emb["chunk_text"],
                "text": emb["chunk_text"],
                "chunk_index": emb["chunk_index"]
            })

        # Generate edges based on cosine similarity
        edges = []
        n = len(embeddings)
        for i in range(n):
            node_sims = []
            for j in range(n):
                if i == j:
                    continue
                sim = cosine_similarity(embeddings[i]["embedding_vector"], embeddings[j]["embedding_vector"])
                if sim >= 0.65:
                    node_sims.append((sim, j))
            
            # Connect to top 2 closest chunks to keep the mind-map clean
            node_sims.sort(key=lambda x: x[0], reverse=True)
            for sim, target_idx in node_sims[:2]:
                source = f"chunk_{embeddings[i]['chunk_index']}"
                target = f"chunk_{embeddings[target_idx]['chunk_index']}"
                edges.append({
                    "id": f"edge_{source}_{target}",
                    "source": source,
                    "target": target,
                    "weight": round(sim, 3)
                })

        return Response({
            "nodes": nodes,
            "edges": edges
        })
