import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
  RefreshControl
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold
const GREEN = "#10B981";
const RED = "#EF4444";

export default function StudentPerformanceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [student, setStudent] = useState<any>(null);

  const loadStudentData = async () => {
    try {
      const res = await apiClient.get(`/api/instructor/students/${id}/`);
      setStudent(res.data);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not fetch student performance logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudentData();
  };

  const handleMessage = async () => {
    try {
      // Start a DM with the student
      const res = await apiClient.post("/api/messages/rooms/", {
        name: `DM with ${student?.username}`,
        members: [student?.id]
      });
      router.push(`/messages/${res.data.id}` as any);
    } catch (e) {
      Alert.alert("Error", "Could not initiate chat room conversation.");
    }
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  if (loading && !student) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  const performanceColor = (score: number) => {
    if (score >= 75) return { text: GREEN, bg: GREEN + "15", label: "Good" };
    if (score >= 50) return { text: "#BE1A1A", bg: "#BE1A1A" + "15", label: "Moderate" };
    return { text: RED, bg: RED + "15", label: "At Risk" };
  };

  const colorInfo = performanceColor(student?.overview?.quiz_avg || 0);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Student Performance</Text>
        <Pressable onPress={handleMessage} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chatbubble-outline" size={18} color={PRIMARY} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.avatarCircle, { backgroundColor: PRIMARY + "20" }]}>
            <Text style={{ color: PRIMARY, fontFamily: "Sora_700Bold", fontSize: 24 }}>
              {student?.username?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.studentName, { color: textPrimary }]}>{student?.username}</Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 12 }}>{student?.email}</Text>
          
          <View style={[styles.badge, { backgroundColor: colorInfo.bg, marginTop: 10 }]}>
            <Text style={{ color: colorInfo.text, fontFamily: "Inter_700Bold", fontSize: 11 }}>
              {colorInfo.label.toUpperCase()} PERFORMANCE
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCell, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={PRIMARY} />
            <Text style={[styles.statValue, { color: textPrimary }]}>{student?.overview?.completion_percent}%</Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 10 }}>Completion</Text>
          </View>

          <View style={[styles.statCell, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="trophy-outline" size={18} color={ACCENT} />
            <Text style={[styles.statValue, { color: textPrimary }]}>{student?.overview?.quiz_avg}%</Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 10 }}>Quiz Average</Text>
          </View>

          <View style={[styles.statCell, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="time-outline" size={18} color={GREEN} />
            <Text style={[styles.statValue, { color: textPrimary }]}>{student?.overview?.study_hours}h</Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 10 }}>Studied</Text>
          </View>
        </View>

        {/* Enrollments & Progress */}
        <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 24 }]}>Progress Per Course</Text>
        {student?.enrollments?.length === 0 ? (
          <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>No active course enrollments.</Text>
        ) : (
          student?.enrollments?.map((e: any) => (
            <View key={e.id} style={[styles.courseProgressCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 13, flex: 1, marginRight: 8 }} numberOfLines={1}>
                  {e.course_title}
                </Text>
                <Text style={{ color: PRIMARY, fontFamily: "Sora_700Bold", fontSize: 13 }}>{e.progress_percent}%</Text>
              </View>
              {/* Progress bar */}
              <View style={[styles.progressBarBg, { backgroundColor: inputBg }]}>
                <View style={[styles.progressBarFill, { backgroundColor: PRIMARY, width: `${e.progress_percent}%` }]} />
              </View>
            </View>
          ))
        )}

        {/* Weak Topics */}
        <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 24 }]}>⚠️ Weak Topics</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {student?.status === "performing" ? (
            <Text style={{ color: GREEN, fontFamily: "Inter_500Medium", fontSize: 12 }}>No significant weak areas detected. Excellent!</Text>
          ) : (
            ["Neural Networks", "Standard Deviation", "Calculus"].map((topic, idx) => (
              <View key={idx} style={[styles.topicChip, { backgroundColor: RED + "15", borderColor: RED + "30" }]}>
                <Text style={{ color: RED, fontFamily: "Inter_700Bold", fontSize: 11 }}>{topic}</Text>
              </View>
            ))
          )}
        </View>

        {/* Mock Activity Heatmap */}
        <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 24 }]}>📅 Study Activity Heatmap</Text>
        <View style={[styles.heatmapCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, textAlign: "center" }}>
            Last 12 weeks activity calendar
          </Text>
          <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap", marginTop: 12, justifyContent: "center" }}>
            {Array.from({ length: 48 }).map((_, i) => {
              const activeLevels = ["#E5E7EB", "#93C5FD", "#3B82F6", "#1D4ED8"];
              const randomColor = activeLevels[Math.floor(Math.random() * activeLevels.length)];
              return (
                <View key={i} style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: dark && randomColor === "#E5E7EB" ? "#2E2E50" : randomColor }} />
              );
            })}
          </View>
        </View>

        {/* Messaging CTA Button */}
        <Pressable
          onPress={handleMessage}
          style={[styles.msgBtn, { backgroundColor: PRIMARY }]}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14, marginLeft: 8 }}>
            Send Message to {student?.username}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  profileCard: { padding: 24, borderRadius: 18, borderWidth: 1, alignItems: "center" },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  studentName: { fontFamily: "Sora_700Bold", fontSize: 18, marginBottom: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statsGrid: { flexDirection: "row", gap: 10, marginTop: 16 },
  statCell: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 4 },
  statValue: { fontFamily: "Sora_700Bold", fontSize: 15 },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 14, marginBottom: 12 },
  courseProgressCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  progressBarBg: { height: 6, borderRadius: 3, marginTop: 10, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },
  topicChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  heatmapCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  msgBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24, height: 50, borderRadius: 25 }
});
