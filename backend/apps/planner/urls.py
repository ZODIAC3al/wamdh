from django.urls import path
from .views import (
    GeneratePlanView, GetPlanView, GetTodayTasksView, TaskCompleteToggleView,
    CreateCustomTaskView, DeleteTaskView,
    KanbanListCreateView, KanbanDetailView
)

urlpatterns = [
    path("generate/", GeneratePlanView.as_view(), name="planner_generate"),
    path("", GetPlanView.as_view(), name="planner_get"),
    path("today/", GetTodayTasksView.as_view(), name="planner_today"),
    path("task/", CreateCustomTaskView.as_view(), name="planner_task_create"),
    path("task/<int:task_id>/", TaskCompleteToggleView.as_view(), name="planner_task_toggle"),
    path("task/<int:task_id>/delete/", DeleteTaskView.as_view(), name="planner_task_delete"),
    path("kanban/", KanbanListCreateView.as_view(), name="kanban_list_create"),
    path("kanban/<str:pk>/", KanbanDetailView.as_view(), name="kanban_detail"),
]
