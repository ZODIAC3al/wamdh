import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

interface Classroom {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  classroom_id: string;
  title: string;
  due_date: string;
}

export default function InstructorAssignmentsScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("2026-07-10");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");

  const { data: classrooms } = useQuery<Classroom[]>({
    queryKey: ["instructor-classrooms"],
    queryFn: async () => (await apiClient.get("/api/users/classrooms/")).data
  });

  const { data: assignments, isLoading } = useQuery<Assignment[]>({
    queryKey: ["assignments"],
    queryFn: async () => (await apiClient.get("/api/users/assignments/")).data
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/api/users/assignments/", {
        classroom_id: selectedClassroomId,
        title: title,
        due_date: dueDate
      });
      return res.data;
    },
    onSuccess: () => {
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      Alert.alert(
        isRtl ? "نجاح" : "Success",
        isRtl ? "تم نشر الواجب بنجاح!" : "New assignment published successfully!"
      );
    }
  });

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name={isRtl ? "arrow-forward" : "chevron-back"} size={20} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>
          {isRtl ? "بوابة الواجبات الدراسية" : "Assignment Portal"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Publish Assignment Form */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, alignItems: isRtl ? "flex-end" : "flex-start" }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>
            {isRtl ? "📝 تعيين واجب منزلي جديد" : "📝 Assign Homework"}
          </Text>
          
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={isRtl ? "عنوان الواجب (مثال: قراءة ملاحظات الفصل 5)" : "Assignment Title (e.g. Read Chapter 5 Notes)"}
            placeholderTextColor="#6B7280"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary, width: "100%", textAlign: isRtl ? "right" : "left" }]}
          />
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder={isRtl ? "تاريخ التسليم (YYYY-MM-DD)" : "Due Date (YYYY-MM-DD)"}
            placeholderTextColor="#6B7280"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary, marginTop: 10, width: "100%", textAlign: isRtl ? "right" : "left" }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 12 }]}>
            {isRtl ? "الصف الدراسي المستهدف" : "TARGET CLASSROOM"}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 4, flexDirection: isRtl ? "row-reverse" : "row" }}>
            {(classrooms || []).map((room) => {
              const isSelected = selectedClassroomId === room.id;
              return (
                <Pressable
                  key={room.id}
                  onPress={() => setSelectedClassroomId(room.id)}
                  style={[
                    styles.roomChip,
                    { backgroundColor: isSelected ? ACCENT : inputBg, borderColor: isSelected ? ACCENT : cardBorder }
                  ]}
                >
                  <Text style={{ color: isSelected ? "#FFFFFF" : textPrimary, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                    {room.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable 
            onPress={() => createAssignmentMutation.mutate()} 
            disabled={createAssignmentMutation.isPending || !selectedClassroomId} 
            style={[styles.actionBtn, { backgroundColor: "#BE1A1A", marginTop: 20, width: "100%" }]}
          >
            <Text style={styles.actionBtnText}>
              {isRtl ? "نشر وإرسال الواجب" : "Publish Assignment"}
            </Text>
          </Pressable>
        </View>

        {/* Assignments List */}
        <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
          {isRtl ? "الواجبات النشطة حالياً" : "Active Assignments"}
        </Text>
        {isLoading ? (
          <ActivityIndicator color={ACCENT} />
        ) : (assignments || []).length === 0 ? (
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 20 }}>
            {isRtl ? "لا توجد واجبات دراسية نشطة حالياً." : "No active assignments found."}
          </Text>
        ) : (
          assignments?.map((ass) => (
            <Pressable 
              key={ass.id} 
              onPress={() => router.push({ pathname: "/(instructor)/assignments/ai-grading", params: { assignmentId: ass.id, assignmentTitle: ass.title } } as any)}
              style={[styles.row, { backgroundColor: cardBg, borderColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}
            >
              <View style={{ flex: 1, alignItems: isRtl ? "flex-end" : "flex-start" }}>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>{ass.title}</Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                  {isRtl ? `تاريخ التسليم: ${ass.due_date}` : `Due: ${ass.due_date}`}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: "#3B82F620" }]}>
                <Text style={{ color: "#3B82F6", fontFamily: "Inter_700Bold", fontSize: 10 }}>
                  {isRtl ? "منشور" : "Published"}
                </Text>
              </View>
            </Pressable>
          ))
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
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 14 },
  label: { fontFamily: "Inter_700Bold", fontSize: 10, marginBottom: 6, letterSpacing: 0.8 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14 },
  roomChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  actionBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 24, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }
});
