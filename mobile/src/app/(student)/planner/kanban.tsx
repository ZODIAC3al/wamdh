import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";


interface KanbanTask {
  id: string;
  topic: string;
  subject: string;
  status: "todo" | "in_progress" | "done";
  duration_mins: number;
}

export default function KanbanBoardScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;
  const queryClient = useQueryClient();

  const [newTopic, setNewTopic] = useState("");
  const [newSubject, setNewSubject] = useState("Math");

  const { data: tasks, isLoading } = useQuery<KanbanTask[]>({
    queryKey: ["kanban-tasks"],
    queryFn: async () => (await apiClient.get("/api/planner/kanban/")).data
  });

  const addTaskMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/api/planner/kanban/", {
        topic: newTopic,
        subject: newSubject,
        status: "todo",
        duration_mins: 45
      });
      return res.data;
    },
    onSuccess: () => {
      setNewTopic("");
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.put(`/api/planner/kanban/${id}/`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/planner/kanban/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
    }
  });

  const handleAddTask = () => {
    if (!newTopic.trim()) return;
    addTaskMutation.mutate();
  };

  const handleMove = (id: string, currentStatus: string) => {
    let nextStatus: "todo" | "in_progress" | "done" = "in_progress";
    if (currentStatus === "in_progress") nextStatus = "done";
    else if (currentStatus === "done") nextStatus = "todo";
    updateTaskMutation.mutate({ id, status: nextStatus });
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const renderColumn = (title: string, listStatus: "todo" | "in_progress" | "done", icon: string, color: string) => {
    const colTasks = (tasks || []).filter(t => t.status === listStatus);
    return (
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Ionicons name={icon as any} size={18} color={color} style={{ marginRight: 6 }} />
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15 }}>
            {title} ({colTasks.length})
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {colTasks.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>No tasks</Text>
            </View>
          ) : (
            colTasks.map(task => (
              <View key={task.id} style={[styles.taskCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }} numberOfLines={1}>{task.topic}</Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 4 }}>{task.subject}</Text>
                
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <Pressable onPress={() => handleMove(task.id, task.status)} style={[styles.moveBtn, { backgroundColor: color + "15" }]}>
                    <Text style={{ color: color, fontFamily: "Inter_700Bold", fontSize: 10 }}>Cycle Status</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteTaskMutation.mutate(task.id)}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Kanban Task Board</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Quick Add Form */}
        <View style={[styles.addCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <TextInput
            value={newTopic}
            onChangeText={setNewTopic}
            placeholder="New task name (e.g. Finish Calculus Homework)"
            placeholderTextColor="#6B7280"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />
          <Pressable onPress={handleAddTask} style={[styles.addBtn, { backgroundColor: "#BE1A1A", marginTop: 10 }]}>
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>Add Task</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 40 }} />
        ) : (
          <View style={{ marginTop: 20 }}>
            {renderColumn("To Do", "todo", "time-outline", "#3B82F6")}
            {renderColumn("In Progress", "in_progress", "refresh-outline", "#F7D87F")}
            {renderColumn("Completed", "done", "checkmark-circle-outline", "#10B981")}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  addCard: { padding: 14, borderRadius: 16, borderWidth: 1 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14 },
  addBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  emptyCard: { width: 140, height: 110, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  taskCard: { width: 150, padding: 12, borderRadius: 14, borderWidth: 1 },
  moveBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }
});
