import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
  KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold

const CATEGORIES = ["AI", "Math", "Physics", "Biology", "Chemistry", "History", "Language", "Other"];

export default function CreateCourseScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("AI");
  const [tags, setTags] = useState("");

  const handleSave = async (shouldPublish: boolean) => {
    if (!title.trim()) {
      Alert.alert("Error", "Course Title is required");
      return;
    }
    
    setLoading(true);
    try {
      // 1. Create course
      const res = await apiClient.post("/api/instructor/courses/", {
        title,
        description,
        category,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean)
      });
      
      const newCourseId = res.data.id;
      
      // 2. If shouldPublish, publish course
      if (shouldPublish) {
        await apiClient.patch(`/api/instructor/courses/${newCourseId}/publish/`);
      }

      Alert.alert("Success", `Course successfully created as ${shouldPublish ? "Published" : "Draft"}.`, [
        { text: "OK", onPress: () => router.replace("/(instructor)/courses/index" as any) }
      ]);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not create course. Please try again.");
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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Create Course</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.label, { color: textSecondary }]}>COURSE TITLE</Text>
          <TextInput
            placeholder="e.g. Introduction to Machine Learning"
            placeholderTextColor={textSecondary}
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>DESCRIPTION</Text>
          <TextInput
            placeholder="Describe what students will learn in this course..."
            placeholderTextColor={textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.inputArea, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>CATEGORY</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.categoryChip,
                  { backgroundColor: category === cat ? PRIMARY : inputBg, borderColor: cardBorder },
                  category === cat && { borderColor: PRIMARY }
                ]}
              >
                <Text style={{ color: category === cat ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>TAGS (SEPARATED BY COMMAS)</Text>
          <TextInput
            placeholder="e.g. AI, neural networks, ML"
            placeholderTextColor={textSecondary}
            value={tags}
            onChangeText={setTags}
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />
        </View>

        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
        ) : (
          <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
            <Pressable
              onPress={() => handleSave(false)}
              style={[styles.btn, { backgroundColor: inputBg, flex: 1, borderColor: cardBorder, borderWidth: 1 }]}
            >
              <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 14 }}>Save as Draft</Text>
            </Pressable>

            <Pressable
              onPress={() => handleSave(true)}
              style={[styles.btn, { backgroundColor: PRIMARY, flex: 1 }]}
            >
              <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>Publish Course</Text>
            </Pressable>
          </View>
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
  categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  btn: { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" }
});
