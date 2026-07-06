import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const EMERALD = "#10B981";

interface VocabWord {
  word: string;
  definition: string;
  example: string;
}

const DEFAULT_WORDS: VocabWord[] = [
  { word: "Photosynthesis", definition: "Process by which green plants use sunlight to synthesize nutrients.", example: "Photosynthesis is crucial for oxygen production." },
  { word: "Mitosis", definition: "A type of cell division that results in two daughter cells.", example: "Skin cells multiply rapidly via mitosis." },
  { word: "Quantum", definition: "A discrete quantity of energy proportional in magnitude to the frequency.", example: "Quantum physics explains atomic behavior." }
];

export default function VocabPronounceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ word?: string }>();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [selectedWord, setSelectedWord] = useState<VocabWord>(DEFAULT_WORDS[0]);
  const [recording, setRecording] = useState(false);
  const [scoring, setScoring] = useState(false);
  
  // Results State
  const [score, setScore] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  // Check if passed a specific word to practice
  useEffect(() => {
    if (params.word) {
      setSelectedWord({
        word: params.word,
        definition: isRtl ? "كلمة مضافة من القاموس" : "Word saved from dictionary.",
        example: isRtl ? "تدرب على نطق هذه الكلمة" : "Practice saying this word aloud."
      });
    }
  }, [params.word]);

  const handleSpeak = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new window.SpeechSynthesisUtterance(selectedWord.word);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } else {
      Alert.alert(isRtl ? "نطق صوتي" : "Speech Synthesis", `${isRtl ? "الاستماع إلى:" : "Listening to:"} "${selectedWord.word}"`);
    }
  };

  const handleRecordToggle = async () => {
    if (recording) {
      setRecording(false);
      setScoring(true);
      setScore(null);
      setFeedbackText("");
      
      try {
        // Hit backend pronunciation scoring endpoint
        const res = await apiClient.post("/api/ai/pronounce-score/", {
          word: selectedWord.word
        });
        setScore(res.data.score);
        setFeedbackText(res.data.feedback);
      } catch (e) {
        Alert.alert("Scoring Error", "Could not analyze your speech pronunciation.");
      } finally {
        setScoring(false);
      }
    } else {
      setRecording(true);
      setScore(null);
      setFeedbackText("");
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
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name={isRtl ? "arrow-forward" : "chevron-back"} size={20} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>
          {isRtl ? "مصحح النطق بالذكاء الاصطناعي" : "AI Pronunciation Tutor"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Word Chips */}
        {!params.word && (
          <>
            <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
              {isRtl ? "اختر كلمة للتدريب" : "Select Word"}
            </Text>
            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {DEFAULT_WORDS.map((w, idx) => {
                const isSelected = selectedWord.word === w.word;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      setSelectedWord(w);
                      setScore(null);
                      setFeedbackText("");
                    }}
                    style={[
                      styles.chip,
                      { backgroundColor: isSelected ? ACCENT : cardBg, borderColor: isSelected ? ACCENT : cardBorder }
                    ]}
                  >
                    <Text style={{ color: isSelected ? "#FFFFFF" : textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>{w.word}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* Word card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 28, textAlign: "center" }}>{selectedWord.word}</Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            {selectedWord.definition}
          </Text>
          <Text style={{ color: ACCENT, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 12, textAlign: "center", fontStyle: "italic" }}>
            "{selectedWord.example}"
          </Text>

          {/* Scorer Indicator */}
          {scoring && (
            <ActivityIndicator size="small" color={ACCENT} style={{ marginTop: 24 }} />
          )}

          {score !== null && (
            <View style={[styles.feedbackBox, { backgroundColor: score >= 85 ? "#10B98115" : "#F59E0B15", borderColor: score >= 85 ? "#10B98140" : "#F59E0B40" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Ionicons name="sparkles" size={16} color={score >= 85 ? "#10B981" : "#F59E0B"} />
                <Text style={{ color: score >= 85 ? "#10B981" : "#F59E0B", fontFamily: "Sora_700Bold", fontSize: 14 }}>
                  {isRtl ? `درجة النطق: ${score}%` : `Accuracy Score: ${score}%`}
                </Text>
              </View>
              <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 }}>
                {feedbackText}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 28 }}>
            <Pressable onPress={handleSpeak} style={[styles.actionBtn, { backgroundColor: ACCENT + "15" }]}>
              <Ionicons name="volume-high" size={22} color={ACCENT} />
              <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 13, marginLeft: 6 }}>
                {isRtl ? "استمع" : "Listen"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleRecordToggle}
              style={[styles.actionBtn, { backgroundColor: recording ? "#EF444420" : EMERALD + "20" }]}
            >
              <Ionicons name={recording ? "stop" : "mic"} size={22} color={recording ? "#EF4444" : EMERALD} />
              <Text style={{ color: recording ? "#EF4444" : EMERALD, fontFamily: "Inter_700Bold", fontSize: 13, marginLeft: 6 }}>
                {recording ? (isRtl ? "تسجيل..." : "Recording...") : (isRtl ? "تدرب وتحدث" : "Practice Speak")}
              </Text>
            </Pressable>
          </View>
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
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 14, marginBottom: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  card: { padding: 24, borderRadius: 20, borderWidth: 1, alignItems: "center" },
  actionBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 50 },
  feedbackBox: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 20, alignSelf: "stretch" }
});
