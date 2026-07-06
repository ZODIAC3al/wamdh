import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWamdh } from "../../../context/WamdhContext";


interface Highlight {
  id: string;
  noteTitle: string;
  text: string;
  addedAt: string;
}

const MOCK_HIGHLIGHTS: Highlight[] = [
  { id: "h1", noteTitle: "Organic Chemistry Intro", text: "Carbon atoms can form stable covalent bonds with other carbon atoms, resulting in chains and rings of carbon atoms.", addedAt: "2026-06-20" },
  { id: "h2", noteTitle: "Cell Biology Notes", text: "Mitochondria generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.", addedAt: "2026-06-18" },
];

export default function BookmarksScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [highlights, setHighlights] = useState<Highlight[]>(MOCK_HIGHLIGHTS);

  const handleDelete = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    Alert.alert("Removed", "Bookmark removed successfully.");
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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Highlights & Bookmarks</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {highlights.length === 0 ? (
          <View style={{ alignSelf: "center", marginTop: 60, alignItems: "center" }}>
            <Ionicons name="bookmark-outline" size={48} color={textSecondary} />
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 12 }}>No bookmarked highlights yet.</Text>
          </View>
        ) : (
          highlights.map((h) => (
            <View key={h.id} style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#BE1A1A", fontFamily: "Sora_700Bold", fontSize: 12 }}>{h.noteTitle}</Text>
                <Pressable onPress={() => handleDelete(h.id)}>
                  <Ionicons name="bookmark" size={18} color={ACCENT} />
                </Pressable>
              </View>
              <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8, lineHeight: 18 }}>
                "{h.text}"
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 10, alignSelf: "flex-end" }}>
                Saved on {h.addedAt}
              </Text>
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
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 }
});
