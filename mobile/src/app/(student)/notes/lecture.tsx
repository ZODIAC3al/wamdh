import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Alert
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { useWamdh } from "../../../context/WamdhContext";
import { useQuery } from "@tanstack/react-query";

interface Slide {
  title: string;
  bullets: string[];
}

export default function LectureGeneratorScreen() {
  const router = useRouter();
  const { note_id } = useLocalSearchParams<{ note_id: string }>();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;
  const bg = colors.background;
  const card = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<"male" | "female">("female");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "ar">("en");
  const [speed, setSpeed] = useState(1.0);

  useEffect(() => {
    const fetchLecture = async () => {
      setLoading(true);
      try {
        const res = await apiClient.post("/api/ai/lecture/", {
          note_id: note_id || "dummy_chemistry",
          voice: selectedVoice,
          language: selectedLanguage
        });
        setSlides(res.data.slides || []);
      } catch (e) {
        console.log("Error fetching lecture:", e);
        Alert.alert("Error", "Could not generate lecture. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchLecture();
  }, [note_id, selectedVoice, selectedLanguage]);

  const handleDownload = () => {
    Alert.alert("Download Started", "Lecture audio will be saved to your device.");
  };

  const handleShare = () => {
    Alert.alert("Share", "Lecture shared to your study group!");
  };

  const handleRegenerate = () => {
    setLoading(true);
    setSlides([]);
    setTimeout(() => {
      setSlides([
        { title: "AI Generated Lecture", bullets: ["Content optimized for learning", "Key concepts highlighted", "Ready for review"] }
      ]);
      setLoading(false);
    }, 800);
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: card, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>AI Lecture Generator</Text>
        <Pressable onPress={handleRegenerate} disabled={loading} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="refresh-outline" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 16 }}>
            Generating your personalized lecture...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          {/* Generation Options */}
          <View style={[styles.optionsCard, { backgroundColor: card, borderColor: cardBorder }]}>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 11, marginBottom: 6 }}>VOICE</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {["female", "male"].map((v) => (
                    <Pressable
                      key={v}
                      onPress={() => setSelectedVoice(v as any)}
                      style={[
                        styles.optionPill,
                        { backgroundColor: selectedVoice === v ? ACCENT + "20" : inputBg, borderColor: cardBorder }
                      ]}
                    >
                      <Text style={{ color: selectedVoice === v ? ACCENT : textSecondary, fontFamily: "Inter_500Medium", fontSize: 10 }}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 11, marginBottom: 6 }}>LANGUAGE</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {["en", "ar"].map((l) => (
                    <Pressable
                      key={l}
                      onPress={() => setSelectedLanguage(l as any)}
                      style={[
                        styles.optionPill,
                        { backgroundColor: selectedLanguage === l ? ACCENT + "20" : inputBg, borderColor: cardBorder }
                      ]}
                    >
                      <Text style={{ color: selectedLanguage === l ? ACCENT : textSecondary, fontFamily: "Inter_500Medium", fontSize: 10 }}>
                        {l === "en" ? "English" : "Arabic"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Lecture Audio Narration Controls */}
          <View style={[styles.audioCard, { backgroundColor: ACCENT + "10", borderColor: ACCENT + "30" }]}>
            <Pressable onPress={() => setPlaying(!playing)} style={[styles.playButton, { backgroundColor: ACCENT }]}>
              <Ionicons name={playing ? "pause" : "play"} size={24} color={dark ? "#000000" : "#FFFFFF"} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>
                {playing ? "Playing Narration..." : "Listen to Lecture"}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                AI-generated audio from your notes
              </Text>
            </View>
            <Pressable onPress={handleDownload} style={[styles.actionBtn, { backgroundColor: inputBg }]}>
              <Ionicons name="download-outline" size={16} color={colors.textPrimary} />
            </Pressable>
            <Pressable onPress={handleShare} style={[styles.actionBtn, { backgroundColor: inputBg, marginLeft: 8 }]}>
              <Ionicons name="share-outline" size={16} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Active slide display */}
          {slides.length > 0 ? (
            <View style={[styles.slideCard, { backgroundColor: card, borderColor: cardBorder }]}>
              <View style={styles.slideHeader}>
                <Text style={{ color: ACCENT, fontFamily: "Sora_700Bold", fontSize: 11 }}>
                  SLIDE {activeSlide + 1} OF {slides.length}
                </Text>
              </View>
              <Text style={[styles.slideTitle, { color: textPrimary }]}>
                {slides[activeSlide].title}
              </Text>
              <View style={styles.bulletList}>
                {slides[activeSlide].bullets.map((b, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Ionicons name="ellipse" size={6} color={ACCENT} style={{ marginRight: 10, marginTop: 8 }} />
                    <Text style={[styles.bulletText, { color: textPrimary }]}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: card, borderColor: cardBorder }]}>
              <Ionicons name="document-text-outline" size={48} color={ACCENT} />
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 12, textAlign: "center" }}>
                No lecture slides generated. Tap refresh to create content.
              </Text>
            </View>
          )}

          {/* Carousel controls */}
          {slides.length > 1 && (
            <View style={styles.navigationRow}>
              <Pressable
                disabled={activeSlide === 0}
                onPress={() => setActiveSlide(activeSlide - 1)}
                style={[
                  styles.navBtn,
                  { opacity: activeSlide === 0 ? 0.3 : 1, backgroundColor: card, borderColor: cardBorder }
                ]}
              >
                <Ionicons name="chevron-back" size={20} color={textPrimary} />
              </Pressable>
              <Pressable
                disabled={activeSlide === slides.length - 1}
                onPress={() => setActiveSlide(activeSlide + 1)}
                style={[
                  styles.navBtn,
                  { opacity: activeSlide === slides.length - 1 ? 0.3 : 1, backgroundColor: card, borderColor: cardBorder }
                ]}
              >
                <Ionicons name="chevron-forward" size={20} color={textPrimary} />
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  optionsCard: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 16 },
  optionPill: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", borderWidth: 1 },
  audioCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  actionBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  slideCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    minHeight: 280,
  },
  slideHeader: { marginBottom: 12 },
  slideTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 20,
  },
  bulletList: { gap: 12 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start" },
  bulletText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  navigationRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 24,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 40,
    alignItems: "center",
  }
});