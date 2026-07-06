import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";


export default function FlashcardImportExportScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [importJson, setImportJson] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/flashcards/");
      Alert.alert("Export Successful", JSON.stringify(res.data, null, 2));
    } catch {
      Alert.alert("Export Failed", "Error pulling flashcards from database.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) return;
    setLoading(true);
    try {
      const cards = JSON.parse(importJson);
      if (!Array.isArray(cards)) {
        Alert.alert("Format Error", "Input must be a JSON array of cards containing question/answer.");
        setLoading(false);
        return;
      }
      // Create new deck with these imported cards
      await apiClient.post("/api/flashcards/decks/create/", {
        title: "Imported Deck " + new Date().toLocaleDateString(),
        subject: "General",
        cards: cards
      });
      Alert.alert("🎉 Import Successful", `${cards.length} cards imported into a new deck.`);
      setImportJson("");
    } catch (e) {
      Alert.alert("Import Failed", "Please verify valid JSON format: [{\"question\":\"Q\", \"answer\":\"A\"}]");
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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Import / Export Decks</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Export Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>📤 Export Flashcards</Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4, lineHeight: 18 }}>
            Download all active decks and progress logs as a portable JSON file.
          </Text>
          <Pressable onPress={handleExport} disabled={loading} style={[styles.actionBtn, { backgroundColor: "#BE1A1A" }]}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionBtnText}>Export JSON</Text>}
          </Pressable>
        </View>

        {/* Import Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 20 }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>📥 Import Flashcards</Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4, lineHeight: 18, marginBottom: 12 }}>
            Paste a JSON array containing your question and answer flashcards:
          </Text>
          <TextInput
            multiline
            numberOfLines={8}
            value={importJson}
            onChangeText={setImportJson}
            placeholder='[{"question": "What is ATP?", "answer": "Adenosine Triphosphate, energy currency of the cell"}]'
            placeholderTextColor="#6B7280"
            style={[styles.jsonInput, { backgroundColor: inputBg, color: textPrimary, borderColor: cardBorder }]}
          />
          <Pressable onPress={handleImport} disabled={loading || !importJson.trim()} style={[styles.actionBtn, { backgroundColor: "#10B981" }]}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionBtnText}>Import JSON Array</Text>}
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
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15 },
  jsonInput: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontFamily: "JetBrainsMono_400Regular", fontSize: 11,
    height: 120, textAlignVertical: "top", marginBottom: 14
  },
  actionBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }
});
