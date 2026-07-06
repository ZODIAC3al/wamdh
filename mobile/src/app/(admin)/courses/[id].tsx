import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
  TextInput
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const RED = "#EF4444";

export default function AdminCourseDetailModeration() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [warnMessage, setWarnMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await apiClient.get(`/api/admin/courses/`);
        const target = res.data.find((c: any) => c.id === id);
        setCourse(target);
      } catch (e) {
        Alert.alert("Error", "Could not fetch course details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleWarnInstructor = async () => {
    if (!warnMessage.trim()) {
      Alert.alert("Error", "Warning message is required");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/api/admin/courses/${id}/warn/`, {
        message: warnMessage
      });
      Alert.alert("Success", "Warning alert sent successfully to the instructor.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert("Error", "Could not send warning.");
    } finally {
      setSubmitting(false);
    }
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  if (loading && !course) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 20 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Moderate Course</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 20 }]}>
        <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 10 }}>COURSE SYLLABUS TITLE</Text>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 4 }}>
          {course?.title}
        </Text>
        <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4 }}>
          Author: {course?.instructor_name}
        </Text>

        <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>WARNING NOTICE FOR AUTHOR</Text>
        <TextInput
          placeholder="e.g. This course violates content quality rules. Please correct chapter 3..."
          placeholderTextColor={textSecondary}
          value={warnMessage}
          onChangeText={setWarnMessage}
          multiline
          numberOfLines={4}
          style={[styles.inputArea, { backgroundColor: inputBg, color: textPrimary }]}
        />

        {submitting ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 20 }} />
        ) : (
          <Pressable
            onPress={handleWarnInstructor}
            style={[styles.warnBtn, { backgroundColor: PRIMARY }]}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 13 }}>Send Warning Notice</Text>
          </Pressable>
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
  label: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
  inputArea: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontFamily: "Inter_500Medium", fontSize: 13, minHeight: 80, textAlignVertical: "top" },
  warnBtn: { height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginTop: 16 }
});
