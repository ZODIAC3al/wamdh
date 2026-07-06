import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWamdh } from "../../../context/WamdhContext";


export default function InstructorQuizBuildScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("30");
  const [questionsCount, setQuestionsCount] = useState("5");

  const handlePublish = () => {
    if (!title) {
      Alert.alert("Input Error", "Please provide a test title.");
      return;
    }
    Alert.alert("🎉 Exam Published", `Successfully authored quiz "${title}" containing ${questionsCount} items.`);
    setTitle("");
    router.replace("/(instructor)");
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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Author Custom Quiz</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>📝 Test Parameters</Text>
          
          <Text style={[styles.label, { color: textSecondary }]}>QUIZ TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Chapter 4 Thermodynamics Quiz"
            placeholderTextColor="#6B7280"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>TIME LIMIT (MINUTES)</Text>
              <TextInput
                value={timeLimit}
                onChangeText={setTimeLimit}
                keyboardType="number-pad"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>TOTAL QUESTIONS</Text>
              <TextInput
                value={questionsCount}
                onChangeText={setQuestionsCount}
                keyboardType="number-pad"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
          </View>

          <Pressable onPress={handlePublish} style={[styles.actionBtn, { backgroundColor: "#BE1A1A", marginTop: 20 }]}>
            <Text style={styles.actionBtnText}>Publish to Classroom</Text>
          </Pressable>
        </View>
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
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 16 },
  label: { fontFamily: "Inter_700Bold", fontSize: 10, marginBottom: 6, letterSpacing: 0.8 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14 },
  actionBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }
});
