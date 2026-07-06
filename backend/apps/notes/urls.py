from django.urls import path
from .views import NoteListCreateView, NoteDetailView, SubjectListView, NoteMindMapView

urlpatterns = [
    path("", NoteListCreateView.as_view(), name="note_list_create"),
    path("subjects/", SubjectListView.as_view(), name="note_subjects"),
    path("<str:pk>/", NoteDetailView.as_view(), name="note_detail"),
    path("<str:pk>/mindmap/", NoteMindMapView.as_view(), name="note_mindmap"),
]
