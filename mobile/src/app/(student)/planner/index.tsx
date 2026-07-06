import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, TextInput, Modal, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { queryClient } from "../../../lib/queryClient";
import { useWamdh } from "../../../context/WamdhContext";

interface Task {
  id: number;
  subject: string;
  topic: string;
  duration_mins: number;
  completed: boolean;
}

function getWeekDates() {
  const today = new Date();
  const dow = today.getDay();
  const mondayDiff = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayDiff);
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, dayNum: d.getDate(), dateString: d.toISOString().split("T")[0] };
  });
}

export default function StudyPlanner() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const PRIMARY = colors.accent;
  const GREEN = colors.success;

  const [dailyHours, setDailyHours] = useState(3);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Custom task form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTopic, setNewTaskTopic] = useState("");
  const [newTaskSubject, setNewTaskSubject] = useState("Math");
  const [newTaskDuration, setNewTaskDuration] = useState("45");
  const [isSavingTask, setIsSavingTask] = useState(false);

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const inputBg = colors.inputBg;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const weekDays = getWeekDates();
  const todayStr = new Date().toISOString().split("T")[0];

  const { data: plan, isLoading, refetch } = useQuery<any>({
    queryKey: ["planner"],
    queryFn: async () => (await apiClient.get("/api/planner/")).data,
  });

  const toggleTask = async (taskId: number) => {
    try {
      await apiClient.patch(`/api/planner/task/${taskId}/`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["today-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) {
      console.error("Toggle task failed", e);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await apiClient.delete(`/api/planner/task/${taskId}/delete/`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["today-tasks"] });
    } catch (e) {
      console.error("Delete task failed", e);
      Alert.alert("Error", "Could not delete task.");
    }
  };

  const handleCreateCustomTask = async () => {
    if (!newTaskTopic.trim()) {
      Alert.alert("Required", "Please specify a task topic.");
      return;
    }
    setIsSavingTask(true);
    try {
      await apiClient.post("/api/planner/task/", {
        topic: newTaskTopic,
        subject: newTaskSubject,
        duration_mins: parseInt(newTaskDuration) || 30,
        date: selectedDate
      });
      setShowAddModal(false);
      setNewTaskTopic("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["today-tasks"] });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add custom task.");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const notesRes = await apiClient.get("/api/notes/");
      const subjects = Array.from(new Set(notesRes.data.map((n: any) => n.subject))).slice(0, 3);
      await apiClient.post("/api/planner/generate/", {
        subjects: subjects.length > 0 ? subjects : ["Math", "Chemistry"],
        daily_hours: dailyHours,
        exam_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["today-tasks"] });
    } catch (e) {
      console.error("Regenerate failed", e);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Selected Day Data
  const selectedDayData = plan?.days?.find((d: any) => d.date === selectedDate);
  const tasks: Task[] = selectedDayData?.tasks || [];
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Checklist features
  const allCompleted = completedCount === tasks.length && tasks.length > 0;
  const streakBonus = tasks.length >= 3 && allCompleted ? "+50 XP Bonus!" : "";

  const getSubjectColor = (sub: string) => {
    const hash = (sub || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return ["#F7D87F", "#10B981", PRIMARY, "#EF4444", "#3B82F6", "#06B6D4"][hash % 6];
  };

  const handleCompleteAll = async () => {
    for (const task of tasks.filter(t => !t.completed)) {
      try {
        await apiClient.patch(`/api/planner/task/${task.id}/`);
      } catch (e) {
        console.error("Complete all failed", e);
      }
    }
    refetch();
    queryClient.invalidateQueries({ queryKey: ["today-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  const handleSetReminder = (taskId: number) => {
    Alert.alert("Reminder Set", "You will be notified 30 minutes before this task.");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.replace("/(student)")} style={[styles.backBtn, { backgroundColor: inputBg }]}>
            <Ionicons name="arrow-back" size={20} color={PRIMARY} />
          </Pressable>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginLeft: 12 }}>Study Planner</Text>
        </View>
        <Pressable onPress={handleRegenerate} disabled={isRegenerating}
          style={[styles.replanBtn, { backgroundColor: PRIMARY + "20", borderColor: PRIMARY }]}>
          {isRegenerating ? (
            <ActivityIndicator size="small" color={PRIMARY} />
          ) : (
            <>
              <Ionicons name="sync-outline" size={14} color={PRIMARY} />
              <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: 4 }}>Re-Plan</Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        {/* Navigation Quick Launcher Row */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <Pressable
            onPress={() => router.push("/(student)/planner/timer")}
            style={[styles.launchBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <Ionicons name="timer-outline" size={22} color={PRIMARY} />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 13 }}>Focus Timer</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>Pomodoro sessions</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(student)/planner/kanban")}
            style={[styles.launchBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <Ionicons name="albums-outline" size={22} color={PRIMARY} />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 13 }}>Kanban Board</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>Task pipeline</Text>
            </View>
          </Pressable>
        </View>

        {/* Week Calendar */}
        <View style={[styles.calCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 14 }}>
            Weekly Schedule
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {weekDays.map((day, idx) => {
              const isSelected = day.dateString === selectedDate;
              const isToday = day.dateString === todayStr;
              return (
                <Pressable key={idx} onPress={() => setSelectedDate(day.dateString)} style={{ alignItems: "center" }}>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 8 }}>
                    {day.label}
                  </Text>
                  <View style={[
                    styles.dayCircle,
                    isSelected && { backgroundColor: "#BE1A1A" },
                    !isSelected && isToday && { borderWidth: 2, borderColor: "#BE1A1A" },
                    !isSelected && !isToday && { backgroundColor: inputBg },
                  ]}>
                    <Text style={{
                      color: isSelected ? "#FFFFFF" : isToday ? PRIMARY : textPrimary,
                      fontFamily: isSelected ? "Inter_700Bold" : "Inter_400Regular",
                      fontSize: 13,
                    }}>
                      {day.dayNum}
                    </Text>
                  </View>
                  {isToday && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#BE1A1A", marginTop: 5 }} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Study intensity */}
        <View style={[styles.intensityCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View>
            <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }}>Study Intensity</Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
              {dailyHours} hours / day
            </Text>
          </View>
          <View style={[styles.counter, { backgroundColor: inputBg }]}>
            <Pressable onPress={() => setDailyHours(h => Math.max(1, h - 1))}
              style={[styles.counterBtn, { backgroundColor: cardBg }]}>
              <Ionicons name="remove" size={16} color={PRIMARY} />
            </Pressable>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, paddingHorizontal: 16 }}>{dailyHours}</Text>
            <Pressable onPress={() => setDailyHours(h => Math.min(8, h + 1))}
              style={[styles.counterBtn, { backgroundColor: cardBg }]}>
              <Ionicons name="add" size={16} color={PRIMARY} />
            </Pressable>
          </View>
        </View>

        {/* Progress indicator */}
        {tasks.length > 0 && (
          <View style={[styles.progressCard, { backgroundColor: PRIMARY + "18", borderColor: PRIMARY + "40" }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                {selectedDate === todayStr ? "Today's Progress" : "Day Progress"} {streakBonus && <Text style={{ color: GREEN, fontSize: 12 }}>{streakBonus}</Text>}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
                {completedCount} of {tasks.length} tasks completed
              </Text>
            </View>
            <Text style={{ color: PRIMARY, fontFamily: "Sora_700Bold", fontSize: 24 }}>
              {progressPercent}%
            </Text>
          </View>
        )}

        {/* Header Task Row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 12 }}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18 }}>
            {selectedDate === todayStr ? "Today's Checklist" : "Day Checklist"}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {tasks.length > 0 && completedCount < tasks.length && (
              <Pressable onPress={handleCompleteAll} style={[styles.completeAllBtn, { backgroundColor: GREEN + "15", borderColor: GREEN }]}>
                <Ionicons name="checkmark-done" size={14} color={GREEN} />
                <Text style={{ color: GREEN, fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: 4 }}>All</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setShowAddModal(true)} style={[styles.addTaskBtn, { backgroundColor: PRIMARY + "15", borderColor: PRIMARY }]}>
              <Ionicons name="add-circle-outline" size={15} color={PRIMARY} />
              <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 12, marginLeft: 4 }}>Add Task</Text>
            </Pressable>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} />
        ) : tasks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="clipboard-outline" size={48} color={textSecondary} />
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 12 }}>
              No tasks for this day.{"\n"}Tap "+ Add Task" to create one manually.
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={[
              styles.taskContainer,
              { backgroundColor: task.completed ? (dark ? "#1A2E1A" : "#F0FDF4") : cardBg, borderColor: task.completed ? "#10B98140" : cardBorder }
            ]}>
              <Pressable onPress={() => toggleTask(task.id)} style={styles.taskPressable}>
                <View style={[
                  styles.taskCheck,
                  { borderColor: task.completed ? "#10B981" : "#6B7280", backgroundColor: task.completed ? "#10B981" : "transparent" },
                ]}>
                  {task.completed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <View style={[styles.taskSubjectBar, { backgroundColor: getSubjectColor(task.subject) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: task.completed ? textSecondary : textPrimary,
                    fontFamily: "Inter_700Bold", fontSize: 14,
                    textDecorationLine: task.completed ? "line-through" : "none",
                  }}>
                    {task.topic}
                  </Text>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
                    {task.subject} · {task.duration_mins} min
                  </Text>
                </View>
              </Pressable>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 10 }}>
                <View style={[styles.durationBadge, { backgroundColor: getSubjectColor(task.subject) + "20" }]}>
                  <Text style={{ color: getSubjectColor(task.subject), fontFamily: "Inter_700Bold", fontSize: 11 }}>
                    {task.duration_mins}m
                  </Text>
                </View>
                <Pressable onPress={() => handleDeleteTask(task.id)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Add Custom Task Modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Create Custom Task</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </Pressable>
            </View>

            <Text style={[styles.modalLabel, { color: textSecondary }]}>TOPIC DESCRIPTION</Text>
            <TextInput
              value={newTaskTopic}
              onChangeText={setNewTaskTopic}
              placeholder="e.g. Read Physics Chapter 3"
              placeholderTextColor="#6B7280"
              style={[styles.modalInput, { backgroundColor: inputBg, color: textPrimary }]}
            />

            <Text style={[styles.modalLabel, { color: textSecondary, marginTop: 14 }]}>SUBJECT</Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {["Math", "Physics", "Chemistry", "Biology", "Language"].map(sub => (
                <Pressable
                  key={sub}
                  onPress={() => setNewTaskSubject(sub)}
                  style={[
                    styles.subPill,
                    { backgroundColor: newTaskSubject === sub ? PRIMARY : inputBg }
                  ]}
                >
                  <Text style={{ color: newTaskSubject === sub ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                    {sub}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.modalLabel, { color: textSecondary, marginTop: 14 }]}>DURATION (MINUTES)</Text>
            <TextInput
              value={newTaskDuration}
              onChangeText={setNewTaskDuration}
              keyboardType="numeric"
              style={[styles.modalInput, { backgroundColor: inputBg, color: textPrimary }]}
            />

            {isSavingTask ? (
              <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
            ) : (
              <Pressable onPress={handleCreateCustomTask} style={[styles.createBtn, { backgroundColor: PRIMARY }]}>
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>Create Task</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  replanBtn: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 50, borderWidth: 1,
  },
  launchBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1
  },
  calCard: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 12 },
  dayCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  intensityCard: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  counter: { flexDirection: "row", alignItems: "center", borderRadius: 50, padding: 4 },
  counterBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  progressCard: {
    flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 4,
  },
  addTaskBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, borderWidth: 1 },
  completeAllBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 50, borderWidth: 1 },
  emptyCard: { borderRadius: 16, padding: 32, borderWidth: 1, alignItems: "center" },
  taskContainer: {
    flexDirection: "row", alignItems: "center", borderRadius: 14,
    marginBottom: 10, borderWidth: 1, justifyContent: "space-between"
  },
  taskPressable: { flex: 1, flexDirection: "row", alignItems: "center", padding: 14 },
  taskCheck: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  taskSubjectBar: { width: 3, height: "100%", borderRadius: 2, marginRight: 12 },
  durationBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontFamily: "Sora_700Bold", fontSize: 18 },
  modalLabel: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, marginTop: 10 },
  modalInput: { height: 44, borderRadius: 10, paddingHorizontal: 12, marginTop: 6, fontFamily: "Inter_500Medium", fontSize: 13 },
  subPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, marginTop: 4 },
  createBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", marginTop: 24 }
});
