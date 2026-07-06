import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";


export default function QuizGeneratorScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [questionCount, setQuestionCount] = useState("10");
  const [subject, setSubject] = useState("Chemistry");
  const [loading, setLoading] = useState(false);
  const [bankContent, setBankContent] = useState("");

  const { data: notes } = useQuery<any[]>({
    queryKey: ["notes"],
    queryFn: async () => (await apiClient.get("/api/notes/")).data,
  });

  const [selectedNoteId, setSelectedNoteId] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Simulate generating 20+ questions using Gemini
      const prompt = `Generate a bank of ${questionCount} multiple choice questions with answers about ${subject}. Context note ID: ${selectedNoteId || "none"}`;
      const res = await apiClient.post("/api/rag/chat/", { message: prompt });
      setBankContent(res.data.response);
      Alert.alert("🎉 Generation Complete", `Successfully generated ${questionCount} study items!`);
    } catch {
      Alert.alert("Failed", "Could not generate questions bank. Check network connection.");
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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>AI Question Bank Maker</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Generator Form */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>🧪 Define Parameters</Text>
          
          <Text style={[styles.label, { color: textSecondary }]}>SUBJECT</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g. Organic Chemistry"
            placeholderTextColor="#6B7280"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 12 }]}>NUMBER OF QUESTIONS</Text>
          <TextInput
            value={questionCount}
            onChangeText={setQuestionCount}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 12 }]}>SOURCE NOTE (OPTIONAL)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 4 }}>
            {(notes || []).map((note) => {
              const isSelected = selectedNoteId === note.id;
              return (
                <Pressable
                  key={note.id}
                  onPress={() => setSelectedNoteId(isSelected ? "" : note.id)}
                  style={[
                    styles.noteChip,
                    { backgroundColor: isSelected ? ACCENT : inputBg, borderColor: isSelected ? ACCENT : cardBorder }
                  ]}
                >
                  <Text style={{ color: isSelected ? "#FFFFFF" : textPrimary, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                    {note.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable onPress={handleGenerate} disabled={loading} style={[styles.actionBtn, { backgroundColor: "#BE1A1A", marginTop: 20 }]}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionBtnText}>Generate Question Bank</Text>}
          </Pressable>
        </View>

        {/* Results Card */}
        {bankContent ? (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 20 }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>📄 Question Bank Results</Text>
            <ScrollView style={styles.bankContainer} contentContainerStyle={{ paddingVertical: 10 }}>
              <Text style={{ color: textPrimary, fontFamily: "JetBrainsMono_400Regular", fontSize: 13, lineHeight: 20 }}>
                {bankContent}
              </Text>
            </ScrollView>
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
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 16 },
  label: { fontFamily: "Inter_700Bold", fontSize: 10, marginBottom: 6, letterSpacing: 0.8 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14 },
  noteChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  actionBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  bankContainer: { maxHeight: 300, marginTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB" }
});
