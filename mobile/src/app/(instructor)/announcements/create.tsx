import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
  KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold
const RED = "#EF4444";

export default function CreateAnnouncementScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [announcementType, setAnnouncementType] = useState<"info" | "reminder" | "urgent">("info");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiClient.get("/api/instructor/courses/");
        setCourses(res.data);
      } catch (e) {
        console.log("Could not load courses for target select:", e);
      }
    };
    fetchCourses();
  }, []);

  const handlePublish = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Error", "Title and Message are required");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/api/instructor/announcements/", {
        title,
        message,
        course_id: selectedCourseId,
        announcement_type: announcementType
      });

      Alert.alert("Success", "Announcement posted successfully.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert("Error", "Could not publish announcement.");
    } finally {
      setLoading(false);
    }
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const typeColor = (t: string) => {
    if (t === "urgent") return RED;
    if (t === "reminder") return ACCENT;
    return PRIMARY;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: bg }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>New Announcement</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.label, { color: textSecondary }]}>ANNOUNCEMENT TITLE</Text>
          <TextInput
            placeholder="e.g. Midterm Exam Details"
            placeholderTextColor={textSecondary}
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>MESSAGE BODY</Text>
          <TextInput
            placeholder="Write detailed announcements instructions..."
            placeholderTextColor={textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            style={[styles.inputArea, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>TARGET AUDIENCE</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 6 }}>
            <Pressable
              onPress={() => setSelectedCourseId("")}
              style={[
                styles.chip,
                { backgroundColor: selectedCourseId === "" ? PRIMARY : inputBg, borderColor: cardBorder },
                selectedCourseId === "" && { borderColor: PRIMARY }
              ]}
            >
              <Text style={{ color: selectedCourseId === "" ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                All My Students
              </Text>
            </Pressable>
            {courses.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setSelectedCourseId(c.id)}
                style={[
                  styles.chip,
                  { backgroundColor: selectedCourseId === c.id ? PRIMARY : inputBg, borderColor: cardBorder },
                  selectedCourseId === c.id && { borderColor: PRIMARY }
                ]}
              >
                <Text style={{ color: selectedCourseId === c.id ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                  {c.title}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>URGENCY TYPE</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
            {(["info", "reminder", "urgent"] as const).map((t) => {
              const borderCol = typeColor(t);
              return (
                <Pressable
                  key={t}
                  onPress={() => setAnnouncementType(t)}
                  style={[
                    styles.segmentedBtn,
                    {
                      backgroundColor: announcementType === t ? borderCol : inputBg,
                      borderColor: cardBorder
                    },
                    announcementType === t && { borderColor: borderCol }
                  ]}
                >
                  <Text style={{ color: announcementType === t ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "capitalize" }}>
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
        ) : (
          <Pressable
            onPress={handlePublish}
            style={[styles.publishBtn, { backgroundColor: PRIMARY }]}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>Post Announcement</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  formCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  label: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
  input: { paddingHorizontal: 12, height: 44, borderRadius: 8, fontFamily: "Inter_500Medium", fontSize: 13 },
  inputArea: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontFamily: "Inter_500Medium", fontSize: 13, minHeight: 100, textAlignVertical: "top" },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  segmentedBtn: { flex: 1, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  publishBtn: { marginTop: 24, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" }
});
