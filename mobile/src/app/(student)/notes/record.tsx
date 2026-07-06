import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWamdh } from "../../../context/WamdhContext";

const RED = "#EF4444";

export default function AudioRecorderScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [recording, setRecording] = useState(false);
  const [recordingsList, setRecordingsList] = useState<string[]>([]);
  const [transcribing, setTranscribing] = useState(false);

  const handleRecordToggle = () => {
    if (recording) {
      setRecording(false);
      const newRec = `Lecture Voice Memo #${recordingsList.length + 1}`;
      setRecordingsList(prev => [newRec, ...prev]);
      Alert.alert("Recording Saved", `Saved voice note: ${newRec}`);
    } else {
      setRecording(true);
    }
  };

  const handleTranscribe = (recName: string) => {
    setTranscribing(true);
    setTimeout(() => {
      setTranscribing(false);
      Alert.alert(
        "📝 Transcript Ready",
        `Transcript for "${recName}":\n"Good morning everyone, today we are starting chapter 4 on thermodynamics..."\n\nAI summary has been added to your Notes tab.`
      );
    }, 2500);
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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Audio Voice Recorder</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Record Control */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, alignItems: "center" }]}>
          <Pressable
            onPress={handleRecordToggle}
            style={[styles.recordBtn, { backgroundColor: recording ? RED : "#BE1A1A" }]}
          >
            <Ionicons name={recording ? "stop" : "mic"} size={36} color="#FFFFFF" />
          </Pressable>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 16 }}>
            {recording ? "Recording audio..." : "Tap to record lecture memo"}
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>
            Ideal for lectures, study groups or voice thoughts.
          </Text>
        </View>

        {/* Saved Recordings */}
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Voice Recordings</Text>
        {transcribing ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 20 }}>
            <ActivityIndicator color={ACCENT} />
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, marginLeft: 10 }}>Running AI Transcription...</Text>
          </View>
        ) : null}

        {recordingsList.length === 0 ? (
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 20 }}>
            No recordings yet.
          </Text>
        ) : (
          recordingsList.map((rec, idx) => (
            <View key={idx} style={[styles.row, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>{rec}</Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>Duration: 1m 24s</Text>
              </View>
              <Pressable onPress={() => handleTranscribe(rec)} style={[styles.transcribeBtn, { backgroundColor: "#BE1A1A" + "20" }]}>
                <Text style={{ color: "#BE1A1A", fontFamily: "Inter_700Bold", fontSize: 11 }}>AI Transcribe</Text>
              </Pressable>
            </View>
          ))
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
  card: { padding: 24, borderRadius: 20, borderWidth: 1 },
  recordBtn: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 24, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  transcribeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 }
});
