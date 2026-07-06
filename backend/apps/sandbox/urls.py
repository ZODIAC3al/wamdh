from django.urls import path
from .views import CodeExecuteView, CodeTemplatesView, LanguageListView

urlpatterns = [
    path('execute/', CodeExecuteView.as_view(), name='code_execute'),
    path('templates/', CodeTemplatesView.as_view(), name='code_templates'),
    path('languages/', LanguageListView.as_view(), name='language_list'),
]