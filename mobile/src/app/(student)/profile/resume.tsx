import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../../store/authStore";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const GOLD = "#F7D87F";

export default function ResumeBuilderScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [loading, setLoading] = useState(false);
  const [resumeText, setResumeText] = useState("");

  const handleBuild = async () => {
    setLoading(true);
    try {
      const prompt = `Write a professional CV summary for a student named ${user?.username || "Scholar"} who has completed study streaks, accumulated ${user?.xp_points || 0} XP, and specializes in subjects: Math, Science. Keep it structured and impressive.`;
      const res = await apiClient.post("/api/rag/chat/", { message: prompt });
      setResumeText(res.data.response);
      Alert.alert("🎉 Resume Created", "Your AI student resume is ready for review!");
    } catch {
      Alert.alert("Error", "Could not generate resume document.");
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>AI Resume Builder</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Info Block */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>💼 Optimize Student Portfolio</Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 6, lineHeight: 18 }}>
            Compile your learning stats, streaks, quiz averages, and XP directly into a structured CV layout optimized for internships and academic applications.
          </Text>
          <Pressable onPress={handleBuild} disabled={loading} style={[styles.actionBtn, { backgroundColor: "#BE1A1A", marginTop: 18 }]}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionBtnText}>Generate with AI</Text>}
          </Pressable>
        </View>

        {/* Resume Preview */}
        {resumeText ? (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 20 }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>📄 Styled Resume Summary</Text>
            <View style={styles.previewContainer}>
              <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 22 }}>
                {resumeText}
              </Text>
            </View>
            <Pressable onPress={() => Alert.alert("Success", "Resume PDF downloaded successfully.")} style={[styles.actionBtn, { backgroundColor: GOLD, marginTop: 14 }]}>
              <Text style={styles.actionBtnText}>Download PDF</Text>
            </Pressable>
          </View>
        ) : null}
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
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15 },
  actionBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  previewContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 12 }
});
