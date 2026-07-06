import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";


export default function TextToSpeechScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const { data: notes, isLoading } = useQuery<any[]>({
    queryKey: ["notes"],
    queryFn: async () => (await apiClient.get("/api/notes/")).data,
  });

  const [selectedNote, setSelectedNote] = useState<any>(null);

  const handlePlayToggle = () => {
    if (!selectedNote) {
      Alert.alert("Select a Note", "Please select a study note to read aloud.");
      return;
    }
    setPlaying(!playing);
    Alert.alert(
      playing ? "Playback Paused" : "Playback Started",
      playing ? "Speech paused." : `Reading note "${selectedNote.title}" at ${playbackSpeed}x speed.`
    );
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Text-to-Speech Reader</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        {/* Selector */}
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Select Note to Listen</Text>
        {isLoading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 60, marginBottom: 20 }}>
            {(notes || []).map((note) => {
              const isSelected = selectedNote?.id === note.id;
              return (
                <Pressable
                  key={note.id}
                  onPress={() => {
                    setSelectedNote(note);
                    setPlaying(false);
                  }}
                  style={[
                    styles.noteChip,
                    { backgroundColor: isSelected ? ACCENT : cardBg, borderColor: isSelected ? ACCENT : cardBorder }
                  ]}
                >
                  <Text style={{ color: isSelected ? "#FFFFFF" : textPrimary, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                    {note.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Media Controls Box */}
        <View style={[styles.playerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Ionicons name="headset-outline" size={48} color={ACCENT} style={{ marginBottom: 12 }} />
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, textAlign: "center" }}>
            {selectedNote ? selectedNote.title : "No Note Selected"}
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4, textAlign: "center" }}>
            {selectedNote ? `${selectedNote.word_count || 0} words · ${selectedNote.subject}` : "Select a note to start listening"}
          </Text>

          {/* Controls */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20, marginTop: 24 }}>
            <Pressable onPress={() => setPlaybackSpeed(prev => prev === 2.0 ? 1.0 : prev + 0.5)} style={[styles.speedBtn, { backgroundColor: inputBg }]}>
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 12 }}>{playbackSpeed}x</Text>
            </Pressable>
            <Pressable onPress={handlePlayToggle} style={[styles.playBtn, { backgroundColor: "#BE1A1A" }]}>
              <Ionicons name={playing ? "pause" : "play"} size={28} color="#FFFFFF" />
            </Pressable>
            <Pressable onPress={() => Alert.alert("Stop", "Audio playback stopped.")} style={[styles.speedBtn, { backgroundColor: inputBg }]}>
              <Ionicons name="stop" size={16} color={textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Note Content preview */}
        {selectedNote ? (
          <ScrollView style={[styles.previewCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, marginBottom: 8 }}>READING TEXT</Text>
            <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 }}>
              {selectedNote.raw_text}
            </Text>
          </ScrollView>
        ) : null}
      </View>
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
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 14, marginBottom: 12 },
  noteChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 10, height: 42 },
  playerCard: { padding: 24, borderRadius: 20, borderWidth: 1, alignItems: "center" },
  playBtn: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  speedBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  previewCard: { flex: 1, marginTop: 20, borderRadius: 16, borderWidth: 1, padding: 16 }
});
