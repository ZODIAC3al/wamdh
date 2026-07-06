import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Animated, Easing, Platform, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const WAVE_BARS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function VoiceTutorScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const PRIMARY = colors.accent;
  const GREEN = colors.success;

  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  // Sound wave bar heights animations
  const anims = useRef(WAVE_BARS.map(() => new Animated.Value(10))).current;
  const loopRef = useRef<any>(null);

  const startWaveAnimation = () => {
    const run = () => {
      const animations = anims.map((anim) =>
        Animated.sequence([
          Animated.timing(anim, {
            toValue: Math.floor(Math.random() * 45) + 15,
            duration: 150 + Math.random() * 150,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.ease)
          }),
          Animated.timing(anim, {
            toValue: 10,
            duration: 150 + Math.random() * 150,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.ease)
          })
        ])
      );
      loopRef.current = Animated.parallel(animations).start(() => {
        if (recording) run();
      });
    };
    run();
  };

  useEffect(() => {
    if (recording) {
      startWaveAnimation();
    } else {
      if (loopRef.current) {
        anims.forEach(anim => anim.setValue(10));
      }
    }
  }, [recording]);

  const toggleRecording = async () => {
    if (recording) {
      setRecording(false);
      setLoading(true);
      try {
        // Send simulated wav audio base64 header
        const res = await apiClient.post("/api/ai/voice/", {
          audio: "UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA"
        });
        setQuery(res.data.query);
        setResponse(res.data.response_text);
        setHistory(prev => [
          { query: res.data.query, response: res.data.response_text, time: new Date().toLocaleTimeString() },
          ...prev
        ]);

        if (Platform.OS === "web") {
          try {
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
              const utterance = new window.SpeechSynthesisUtterance(res.data.response_text);
              utterance.lang = "en-US";
              window.speechSynthesis.speak(utterance);
            } else if (res.data.audio_url) {
              const audio = new (window as any).Audio(res.data.audio_url);
              audio.play().catch((err: any) => console.log(err));
            }
          } catch (err) {
            console.log("Audio play error:", err);
          }
        } else {
          Alert.alert(
            isRtl ? "رد معلم الصوت" : "Voice Tutor Speak",
            isRtl ? `تحدثت منى بالرد: "${res.data.response_text}"` : `Mona says: "${res.data.response_text}"`
          );
        }
      } catch (e) {
        console.log("Error in voice tutor request:", e);
      } finally {
        setLoading(false);
      }
    } else {
      setRecording(true);
      setResponse("");
      setQuery("");
    }
  };

  const bg = colors.background;
  const card = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: card, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>{t("voice_mode") || "AI Voice Tutor"}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Interaction box */}
        <View style={[styles.interactionBox, { backgroundColor: card, borderColor: cardBorder }]}>
          {loading ? (
            <ActivityIndicator size="large" color={PRIMARY} />
          ) : response ? (
            <View>
              <View style={[styles.queryBubble, { backgroundColor: colors.accentMuted }]}>
                <Text style={[styles.queryLabel, { color: textPrimary }]}>You said:</Text>
                <Text style={[styles.queryText, { color: textPrimary }]}>"{query}"</Text>
              </View>

              <View style={styles.tutorResponse}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Ionicons name="sparkles-outline" size={18} color={PRIMARY} style={{ marginRight: 6 }} />
                  <Text style={[styles.tutorLabel, { color: textSecondary }]}>AI Tutor Response:</Text>
                </View>
                <Text style={[styles.tutorText, { color: textPrimary }]}>{response}</Text>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Ionicons name="mic-outline" size={48} color={textSecondary} />
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 12, textAlign: "center", lineHeight: 18 }}>
                Tap the microphone below to ask Mona a question. Your voice input will be stored on the server for learning reference.
              </Text>
            </View>
          )}
        </View>

        {/* Waves visualization & Mic trigger */}
        <View style={{ alignItems: "center", marginVertical: 32 }}>
          {recording && (
            <View style={styles.waveRow}>
              {anims.map((anim, idx) => (
                <Animated.View
                  key={idx}
                  style={[styles.waveBar, { height: anim, backgroundColor: PRIMARY }]}
                />
              ))}
            </View>
          )}
          <Pressable
            onPress={toggleRecording}
            style={[
              styles.micButton,
              { backgroundColor: recording ? colors.danger : PRIMARY, shadowColor: PRIMARY }
            ]}
          >
            <Ionicons
              name={recording ? "stop" : "mic"}
              size={32}
              color="#FFFFFF"
            />
          </Pressable>
          <Text style={[styles.statusText, { color: textSecondary }]}>
            {recording ? "Listening... Tap to stop" : "Tap to Speak"}
          </Text>
        </View>

        {/* History of recordings */}
        {history.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 12 }}>
              🎙️ Session History
            </Text>
            <View style={{ gap: 10 }}>
              {history.map((h, i) => (
                <View key={i} style={[styles.historyCard, { backgroundColor: card, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 12 }}>"{h.query}"</Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10 }}>{h.time}</Text>
                  </View>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>
                    {h.response}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 17,
  },
  interactionBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    minHeight: 200,
    justifyContent: "center"
  },
  queryBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  queryLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    marginBottom: 2,
  },
  queryText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  tutorResponse: {
    paddingHorizontal: 4,
  },
  tutorLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  tutorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
  },
  waveRow: { flexDirection: "row", gap: 4, height: 50, alignItems: "center", marginBottom: 16 },
  waveBar: { width: 4, borderRadius: 2 },
  micButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  statusText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    marginTop: 12,
  },
  historyCard: { padding: 14, borderRadius: 14, borderWidth: 1 }
});
