import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet,
  RefreshControl, FlatList, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold
const RED = "#EF4444";
const GREEN = "#10B981";

export default function AdminCourseModerationScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const loadCourses = async () => {
    try {
      const res = await apiClient.get("/api/admin/courses/");
      setCourses(res.data);
    } catch (e) {
      console.log("Error loading courses for moderation:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  const handleDeleteCourse = async (courseId: string) => {
    Alert.alert(
      "Remove Course",
      "Are you sure you want to permanently remove this course from the platform?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/api/admin/courses/${courseId}/`);
              setCourses(prev => prev.filter(c => c.id !== courseId));
            } catch (e) {
              Alert.alert("Error", "Could not remove course.");
            }
          }
        }
      ]
    );
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Course Moderation</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        <TextInput
          placeholder="Search courses or instructors..."
          placeholderTextColor={textSecondary}
          value={search}
          onChangeText={setSearch}
          style={[styles.input, { backgroundColor: cardBg, color: textPrimary, borderColor: cardBorder }]}
        />
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color={PRIMARY} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={courses.filter((c) => c.title?.toLowerCase().includes(search.toLowerCase()) || c.instructor_name?.toLowerCase().includes(search.toLowerCase()))}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          onRefresh={onRefresh}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <View style={[styles.courseCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.courseTitle, { color: textPrimary }]}>{item.title}</Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 4 }}>
                  By: {item.instructor_name} · Students: {item.enrolled_count || 0}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => handleDeleteCourse(item.id)}
                  style={[styles.actionBtn, { backgroundColor: RED + "15" }]}
                >
                  <Ionicons name="trash-outline" size={16} color={RED} />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
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
  input: { paddingHorizontal: 12, height: 44, borderRadius: 8, borderWidth: 1, fontFamily: "Inter_500Medium" },
  courseCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  courseTitle: { fontFamily: "Sora_700Bold", fontSize: 14 },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" }
});
