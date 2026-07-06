import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
  KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../../../lib/api";
import { useWamdh } from "../../../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue

export default function CreateChapterScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Chapter Title is required");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/api/instructor/courses/${id}/chapters/`, {
        title,
        description
      });
      Alert.alert("Success", "Chapter created successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert("Error", "Could not create chapter.");
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: bg }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Add Chapter</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.label, { color: textSecondary }]}>CHAPTER TITLE</Text>
          <TextInput
            placeholder="e.g. Chapter 1: Introduction to AI"
            placeholderTextColor={textSecondary}
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>DESCRIPTION / OBJECTIVES</Text>
          <TextInput
            placeholder="Describe what is covered in this chapter..."
            placeholderTextColor={textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.inputArea, { backgroundColor: inputBg, color: textPrimary }]}
          />
        </View>

        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
        ) : (
          <Pressable
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: PRIMARY }]}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>Create Chapter</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  formCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  label: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14, height: 48 },
  inputArea: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14, minHeight: 90, textAlignVertical: "top" },
  saveBtn: { marginTop: 24, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" }
});
