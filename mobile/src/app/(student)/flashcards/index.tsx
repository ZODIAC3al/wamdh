import React, { useState } from "react";
import {
  View, Text, FlatList, Pressable, ActivityIndicator,
  Modal, TextInput, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

function DeckCard({ item, dark }: { item: any; dark: boolean }) {
  const { colors } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;
  const router = useRouter();
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const { data: dueCards } = useQuery<any[]>({
    queryKey: ["deck-due-cards", item.id],
    queryFn: async () => (await apiClient.get(`/api/flashcards/${item.id}/review/`)).data,
    enabled: !!item.id,
  });
  const dueCount = dueCards?.length || 0;

  const getSubjectColor = (sub: string) => {
    const hash = (sub || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return ["#F7D87F", "#10B981", ACCENT, "#EF4444", "#3B82F6", "#06B6D4"][hash % 6];
  };
  const color = getSubjectColor(item.subject || "");

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/(student)/flashcards/[id]", params: { id: item.id } })}
      style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <View style={[styles.subjectDot, { backgroundColor: color }]} />
        <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>
          {item.subject || "General"}
        </Text>
        <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginLeft: "auto" }}>
          {item.cards_count || 0} cards
        </Text>
      </View>
      <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 14 }}>{item.title}</Text>
      <View style={[styles.cardFooter, { borderTopColor: dark ? "#2A2520" : "#F3F4F6" }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name={dueCount > 0 ? "alarm-outline" : "checkmark-circle-outline"} size={15}
            color={dueCount > 0 ? "#F7D87F" : "#10B981"} />
          <Text style={{ color: dueCount > 0 ? "#F7D87F" : "#10B981", fontFamily: "Inter_500Medium", fontSize: 12, marginLeft: 6 }}>
            {dueCount > 0 ? `${dueCount} due today` : "All caught up"}
          </Text>
        </View>
        <View style={[styles.studyBtn, { backgroundColor: ACCENT + "20" }]}>
          <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 12 }}>Study</Text>
          <Ionicons name="chevron-forward" size={12} color={ACCENT} style={{ marginLeft: 2 }} />
        </View>
      </View>
    </Pressable>
  );
}

export default function FlashcardsList() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;
  const [modal, setModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const inputBg = colors.inputBg;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const { data: decks, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["decks"],
    queryFn: async () => (await apiClient.get("/api/flashcards/")).data,
  });

  const handleCreate = async () => {
    if (!newTitle.trim() || !newSubject.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post("/api/flashcards/", { title: newTitle, subject: newSubject });
      setNewTitle(""); setNewSubject(""); setModal(false); refetch();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.replace("/(student)")} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginLeft: 12 }}>Flashcards</Text>
        </View>
        <Pressable onPress={() => setModal(true)} style={[styles.ctaSmall, { backgroundColor: ACCENT }]}>
          <Ionicons name="add" size={16} color={dark ? "#000000" : "#FFFFFF"} />
          <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 12, marginLeft: 4 }}>New Deck</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="albums-outline" size={56} color="#374151" />
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 12 }}>No flashcard decks yet</Text>
            </View>
          }
          renderItem={({ item }) => <DeckCard item={item} dark={dark} />}
        />
      )}

      {/* Create Modal */}
      <Modal animationType="slide" transparent visible={modal} onRequestClose={() => setModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={[styles.modalSheet, { backgroundColor: cardBg }]}>
            <View style={styles.handle} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20 }}>New Deck</Text>
              <Pressable onPress={() => setModal(false)} style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}>
                <Ionicons name="close" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>
            <Text style={[styles.label, { color: textSecondary }]}>Deck Title</Text>
            <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: cardBorder }]}>
              <TextInput value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Organic Chemistry" placeholderTextColor="#6B7280"
                style={{ flex: 1, color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 }} />
            </View>
            <Text style={[styles.label, { color: textSecondary, marginTop: 14 }]}>Subject</Text>
            <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: cardBorder, marginBottom: 24 }]}>
              <TextInput value={newSubject} onChangeText={setNewSubject} placeholder="e.g. Chemistry" placeholderTextColor="#6B7280"
                style={{ flex: 1, color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 }} />
            </View>
            <Pressable onPress={handleCreate} disabled={submitting}
              style={[styles.ctaFull, { backgroundColor: ACCENT }]}>
              {submitting && <ActivityIndicator size="small" color={dark ? "#000000" : "#FFFFFF"} style={{ marginRight: 8 }} />}
              <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 16 }}>
                {submitting ? "Creating..." : "Create Deck"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  ctaSmall: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 50, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  card: {
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  subjectDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 12 },
  studyBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#374151", alignSelf: "center", marginBottom: 20 },
  closeBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: 6 },
  inputRow: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  ctaFull: {
    paddingVertical: 16, borderRadius: 50, alignItems: "center", justifyContent: "center",
    flexDirection: "row", shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
});
