import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
  KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../../lib/api";
import { useWamdh } from "../../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold

const CATEGORIES = ["AI", "Math", "Physics", "Biology", "Chemistry", "History", "Language", "Other"];

export default function EditCourseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("AI");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await apiClient.get(`/api/instructor/courses/${id}/`);
        const c = res.data;
        setTitle(c.title);
        setDescription(c.description || "");
        setCategory(c.category || "AI");
        setTags(c.tags ? c.tags.join(", ") : "");
        setStatus(c.status || "draft");
      } catch (e) {
        Alert.alert("Error", "Could not fetch course details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleUpdate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Course Title is required");
      return;
    }

    setSaving(true);
    try {
      await apiClient.patch(`/api/instructor/courses/${id}/`, {
        title,
        description,
        category,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        status
      });

      Alert.alert("Success", "Course updated successfully.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert("Error", "Could not update course.");
    } finally {
      setSaving(false);
    }
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Edit Course</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.label, { color: textSecondary }]}>COURSE TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>DESCRIPTION</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.inputArea, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>STATUS</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
            {["draft", "published", "archived"].map((st) => (
              <Pressable
                key={st}
                onPress={() => setStatus(st)}
                style={[
                  styles.statusBtn,
                  {
                    backgroundColor: status === st ? PRIMARY : inputBg,
                    borderColor: cardBorder
                  },
                  status === st && { borderColor: PRIMARY }
                ]}
              >
                <Text style={{ color: status === st ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "capitalize" }}>
                  {st}
                </Text>
              </Pressable>
            ))}
          </View>

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

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>TAGS</Text>
          <TextInput
            placeholder="e.g. AI, neural networks"
            placeholderTextColor={textSecondary}
            value={tags}
            onChangeText={setTags}
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />
        </View>

        {saving ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
        ) : (
          <Pressable
            onPress={handleUpdate}
            style={[styles.saveBtn, { backgroundColor: PRIMARY }]}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>Save Changes</Text>
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
  statusBtn: { flex: 1, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  saveBtn: { marginTop: 24, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" }
});
