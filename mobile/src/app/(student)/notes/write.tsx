import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, ScrollView, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

export default function QuickNoteWriter() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;
  const scrollRef = useRef<ScrollView>(null);

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);

  // Selection range for formatting
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const insertFormat = (type: "bold" | "italic" | "h1" | "h2" | "list" | "link") => {
    const { start, end } = selection;
    const selectedText = content.substring(start, end);
    let formattedText = "";

    switch (type) {
      case "bold":
        formattedText = `**${selectedText || "bold text"}**`;
        break;
      case "italic":
        formattedText = `*${selectedText || "italic text"}*`;
        break;
      case "h1":
        formattedText = `\n# ${selectedText || "Heading 1"}\n`;
        break;
      case "h2":
        formattedText = `\n## ${selectedText || "Heading 2"}\n`;
        break;
      case "list":
        formattedText = `\n- ${selectedText || "List item"}\n`;
        break;
      case "link":
        formattedText = `[${selectedText || "link text"}](https://example.com)`;
        break;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert(isRtl ? "بيانات ناقصة" : "Missing fields", isRtl ? "يرجى إضافة عنوان ومحتوى الملاحظة." : "Please add a title and content.");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/api/notes/", {
        title: title.trim(),
        subject: subject.trim() || "General",
        raw_text: content.trim(),
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        source_type: "text",
      });
      Alert.alert("✅ Saved!", isRtl ? "تم حفظ الملاحظة بنجاح!" : "Your note has been saved.", [
        { text: "View Notes", onPress: () => router.replace("/(student)/notes") },
        { text: "Write Another", onPress: () => { setTitle(""); setSubject(""); setContent(""); setTags(""); } },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.error || "Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleAIEnhance = async () => {
    if (!content.trim()) {
      Alert.alert("No content", "Write something first, then AI can enhance it.");
      return;
    }
    setAiEnhancing(true);
    try {
      const saveRes = await apiClient.post("/api/notes/", {
        title: title || "Temp Note",
        subject: subject || "General",
        raw_text: content,
        tags: [],
        source_type: "text",
      });
      const noteId = saveRes.data.id;
      const sumRes = await apiClient.post("/api/ai/summarize/", { note_id: noteId, mode: "detailed" });
      Alert.alert("✨ AI Enhanced!", "AI-generated study guide:", [
        { text: "Use as Note", onPress: () => setContent(sumRes.data.summary || content) },
        { text: "Keep Original", style: "cancel" },
      ]);
    } catch (e) {
      Alert.alert("AI Error", "Could not enhance. Please try again.");
    } finally {
      setAiEnhancing(false);
    }
  };

  const SUBJECTS = ["Math", "Science", "History", "Literature", "Chemistry", "Physics", "Biology", "Economics"];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="close" size={22} color={textSecondary} />
        </Pressable>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, flex: 1, textAlign: "center" }}>
          {isRtl ? "ملاحظة سريعة" : "Quick Note"}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: "#BE1A1A" }]}
        >
          {saving
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>{isRtl ? "حفظ" : "Save"}</Text>}
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Title */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={isRtl ? "عنوان الملاحظة..." : "Note title..."}
          placeholderTextColor="#9CA3AF"
          style={[styles.titleInput, { color: textPrimary, borderBottomColor: cardBorder, textAlign: isRtl ? "right" : "left" }]}
        />

        {/* Subject chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ flexDirection: isRtl ? "row-reverse" : "row" }}>
          {SUBJECTS.map(s => (
            <Pressable
              key={s}
              onPress={() => setSubject(subject === s ? "" : s)}
              style={[styles.subjectChip, {
                backgroundColor: subject === s ? ACCENT : inputBg,
                marginRight: isRtl ? 0 : 8,
                marginLeft: isRtl ? 8 : 0,
              }]}
            >
              <Text style={{ color: subject === s ? "#FFFFFF" : textSecondary, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                {s}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tags */}
        <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: cardBorder, marginBottom: 16, flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <Ionicons name="pricetag-outline" size={16} color="#9CA3AF" style={{ marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }} />
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder={isRtl ? "الوسوم (مفصولة بفاصلة)..." : "Tags (comma separated)..."}
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 13, padding: 0, textAlign: isRtl ? "right" : "left" }}
          />
        </View>

        {/* Formatting Toolbar */}
        <View style={[styles.toolbar, { borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <Pressable onPress={() => insertFormat("bold")} style={styles.toolbarBtn}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontWeight: "bold", fontSize: 13 }}>B</Text>
          </Pressable>
          <Pressable onPress={() => insertFormat("italic")} style={styles.toolbarBtn}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontStyle: "italic", fontSize: 13 }}>I</Text>
          </Pressable>
          <Pressable onPress={() => insertFormat("h1")} style={styles.toolbarBtn}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 13 }}>H1</Text>
          </Pressable>
          <Pressable onPress={() => insertFormat("h2")} style={styles.toolbarBtn}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 13 }}>H2</Text>
          </Pressable>
          <Pressable onPress={() => insertFormat("list")} style={styles.toolbarBtn}>
            <Ionicons name="list" size={16} color={textPrimary} />
          </Pressable>
          <Pressable onPress={() => insertFormat("link")} style={styles.toolbarBtn}>
            <Ionicons name="link" size={16} color={textPrimary} />
          </Pressable>
        </View>

        {/* Content Editor */}
        <View style={[styles.editorCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <TextInput
            value={content}
            onChangeText={setContent}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            placeholder={isRtl ? "ابدأ كتابة ملاحظاتك هنا..." : "Start writing your notes here..."}
            placeholderTextColor="#6B7280"
            multiline
            textAlignVertical="top"
            style={{
              color: textPrimary, fontFamily: "Inter_400Regular",
              fontSize: 15, lineHeight: 26, minHeight: 300,
              textAlign: isRtl ? "right" : "left"
            }}
          />
        </View>

        {/* Word count */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, marginBottom: 20 }}>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
            {wordCount} {isRtl ? "كلمات" : "words"} · {charCount} {isRtl ? "حرف" : "chars"}
          </Text>
          {content.length > 50 && (
            <Pressable onPress={handleAIEnhance} disabled={aiEnhancing} style={{ flexDirection: "row", alignItems: "center" }}>
              {aiEnhancing
                ? <ActivityIndicator size="small" color={ACCENT} />
                : <Ionicons name="sparkles" size={14} color={ACCENT} />}
              <Text style={{ color: "#BE1A1A", fontFamily: "Inter_700Bold", fontSize: 12, marginLeft: 4 }}>
                {aiEnhancing ? (isRtl ? "جاري التحسين..." : "Enhancing...") : (isRtl ? "تحسين بالذكاء" : "AI Enhance")}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 50 },
  titleInput: { fontFamily: "Sora_700Bold", fontSize: 24, paddingVertical: 12, borderBottomWidth: 1, marginBottom: 16 },
  subjectChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  toolbar: { flexDirection: "row", gap: 12, paddingVertical: 10, borderBottomWidth: 1, marginBottom: 10, flexWrap: "wrap" },
  toolbarBtn: { width: 32, height: 32, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.03)" },
  editorCard: { borderRadius: 16, padding: 16, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
});
