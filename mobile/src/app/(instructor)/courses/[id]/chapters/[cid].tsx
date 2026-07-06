import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
  Modal, TextInput, RefreshControl
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../../../lib/api";
import { useWamdh } from "../../../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold
const RED = "#EF4444";
const GREEN = "#10B981";

export default function ChapterDetailScreen() {
  const router = useRouter();
  const { id, cid } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chapter, setChapter] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"pdf" | "image" | "note" | "assignment" | null>(null);
  
  // Note/Assignment Form State
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formPoints, setFormPoints] = useState("10");
  const [formLoading, setFormLoading] = useState(false);

  const loadChapterData = async () => {
    try {
      // 1. Fetch chapters to find this specific chapter details
      const chaptersRes = await apiClient.get(`/api/instructor/courses/${id}/chapters/`);
      const thisChapter = chaptersRes.data.find((ch: any) => ch.id === cid);
      setChapter(thisChapter);

      // 2. Fetch Materials
      const materialsRes = await apiClient.get(`/api/instructor/chapters/${cid}/materials/`);
      setMaterials(materialsRes.data);
    } catch (e) {
      console.log("Error loading chapter data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChapterData();
  }, [cid]);

  const onRefresh = () => {
    setRefreshing(true);
    loadChapterData();
  };

  const handleToggleLock = async () => {
    if (!chapter) return;
    const currentLock = chapter.is_locked;
    const action = currentLock ? "unlock" : "lock";
    try {
      await apiClient.patch(`/api/instructor/courses/${id}/chapters/${cid}/${action}/`);
      setChapter({ ...chapter, is_locked: !currentLock });
    } catch (e) {
      Alert.alert("Error", "Could not toggle lock.");
    }
  };

  const handleDeleteMaterial = async (mid: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this study material?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/api/instructor/materials/${mid}/`);
              setMaterials(prev => prev.filter(m => m.id !== mid));
            } catch (e) {
              Alert.alert("Error", "Could not delete material.");
            }
          }
        }
      ]
    );
  };

  const handleGenerateSummary = async (mid: string) => {
    try {
      Alert.alert("AI Engine", "Generating summary with Gemini API...");
      const res = await apiClient.post(`/api/instructor/materials/${mid}/ai-summary/`);
      setMaterials(prev => prev.map(m => m.id === mid ? { ...m, ai_summary: res.data.ai_summary } : m));
      Alert.alert("Success", "Gemini Summary generated successfully.");
    } catch (e) {
      Alert.alert("Error", "Could not compile AI summary.");
    }
  };

  const handleAddMaterial = async () => {
    if (!formTitle.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }

    setFormLoading(true);
    try {
      // Create text note or assignment via API
      await apiClient.post(`/api/instructor/chapters/${cid}/materials/`, {
        title: formTitle,
        material_type: addType,
        content: formContent,
        due_date: formDueDate,
        points: formPoints
      });

      // Reload
      await loadChapterData();
      setShowAddModal(false);
      resetForm();
    } catch (e) {
      Alert.alert("Error", "Could not add material.");
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormDueDate("");
    setFormPoints("10");
    setAddType(null);
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  if (loading && !chapter) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={1}>
          {chapter?.title}
        </Text>
        <Pressable onPress={handleToggleLock} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name={chapter?.is_locked ? "lock-closed" : "lock-open"} size={20} color={chapter?.is_locked ? RED : GREEN} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
      >
        {/* Chapter Overview */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 20 }]}>
          <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, textTransform: "uppercase" }}>Chapter Description</Text>
          <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 6, lineHeight: 20 }}>
            {chapter?.description || "No description provided for this chapter."}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 6 }}>
            <View style={[styles.indicator, { backgroundColor: chapter?.is_locked ? RED : GREEN }]} />
            <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
              {chapter?.is_locked ? "Chapter is Locked for students" : "Chapter is Unlocked & visible"}
            </Text>
          </View>
        </View>

        {/* Materials List */}
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Chapter Materials ({materials.length})</Text>
        
        {materials.length === 0 ? (
          <View style={{ alignItems: "center", marginVertical: 40 }}>
            <Ionicons name="documents-outline" size={48} color={textSecondary} />
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 12 }}>
              No study materials uploaded yet.
            </Text>
          </View>
        ) : (
          materials.map((m) => (
            <View key={m.id} style={[styles.materialCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={[styles.iconWrap, { backgroundColor: PRIMARY + "15" }]}>
                  <Ionicons
                    name={
                      m.material_type === "pdf" ? "document-text" :
                      m.material_type === "image" ? "image" :
                      m.material_type === "assignment" ? "alert-circle" : "document-text-outline"
                    }
                    size={20}
                    color={PRIMARY}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>{m.title}</Text>
                  
                  {m.material_type === "assignment" && (
                    <Text style={{ color: "#BE1A1A", fontFamily: "Inter_700Bold", fontSize: 11, marginTop: 4 }}>
                      Due: {m.due_date || "No due date"} · {m.points} points
                    </Text>
                  )}

                  {m.file_url ? (
                    <Text style={{ color: PRIMARY, fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 4 }} numberOfLines={1}>
                      📁 {m.file_url.split("/").pop()}
                    </Text>
                  ) : m.content ? (
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                      {m.content}
                    </Text>
                  ) : null}

                  {/* AI Summary View */}
                  {m.ai_summary ? (
                    <View style={styles.summaryBox}>
                      <Text style={styles.summaryTitle}>✨ AI SUMMARY</Text>
                      <Text style={styles.summaryText}>{m.ai_summary}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={[styles.actionRow, { borderTopColor: cardBorder }]}>
                {m.material_type in { pdf: 1, note: 1 } && !m.ai_summary ? (
                  <Pressable onPress={() => handleGenerateSummary(m.id)} style={styles.actionBtn}>
                    <Ionicons name="sparkles-outline" size={14} color={PRIMARY} />
                    <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 11 }}>AI Summary</Text>
                  </Pressable>
                ) : <View />}

                <Pressable onPress={() => handleDeleteMaterial(m.id)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={14} color={RED} />
                  <Text style={{ color: RED, fontFamily: "Inter_700Bold", fontSize: 11 }}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB to Add Material */}
      <Pressable onPress={() => setShowAddModal(true)} style={styles.fab}>
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </Pressable>

      {/* Upload/Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Add Study Material</Text>
              <Pressable onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </Pressable>
            </View>

            {addType === null ? (
              <View style={styles.optionsList}>
                <Pressable onPress={() => setAddType("note")} style={styles.optionItem}>
                  <Ionicons name="pencil-outline" size={20} color={PRIMARY} />
                  <Text style={[styles.optionText, { color: textPrimary }]}>Create Text Note</Text>
                </Pressable>
                <Pressable onPress={() => setAddType("assignment")} style={styles.optionItem}>
                  <Ionicons name="document-text-outline" size={20} color={PRIMARY} />
                  <Text style={[styles.optionText, { color: textPrimary }]}>Create Assignment</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Alert.alert("Simulate File Upload", "PDF/Image uploading is connected. Django backend will store files locally or on Cloudinary.");
                  }}
                  style={styles.optionItem}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color={PRIMARY} />
                  <Text style={[styles.optionText, { color: textPrimary }]}>Simulate PDF / Slide Upload</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView style={{ marginTop: 12 }}>
                <Text style={[styles.inputLabel, { color: textSecondary }]}>TITLE</Text>
                <TextInput
                  placeholder="Material title..."
                  placeholderTextColor={textSecondary}
                  value={formTitle}
                  onChangeText={setFormTitle}
                  style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
                />

                {addType === "note" ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputLabel, { color: textSecondary }]}>NOTE CONTENT</Text>
                    <TextInput
                      placeholder="Type note details here..."
                      placeholderTextColor={textSecondary}
                      value={formContent}
                      onChangeText={setFormContent}
                      multiline
                      numberOfLines={5}
                      style={[styles.inputArea, { backgroundColor: inputBg, color: textPrimary }]}
                    />
                  </View>
                ) : (
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputLabel, { color: textSecondary }]}>ASSIGNMENT DESCRIPTION</Text>
                    <TextInput
                      placeholder="Type details about this task..."
                      placeholderTextColor={textSecondary}
                      value={formContent}
                      onChangeText={setFormContent}
                      multiline
                      numberOfLines={4}
                      style={[styles.inputArea, { backgroundColor: inputBg, color: textPrimary }]}
                    />

                    <Text style={[styles.inputLabel, { color: textSecondary, marginTop: 12 }]}>DUE DATE</Text>
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={textSecondary}
                      value={formDueDate}
                      onChangeText={setFormDueDate}
                      style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
                    />

                    <Text style={[styles.inputLabel, { color: textSecondary, marginTop: 12 }]}>POINTS / SCORE WEIGHT</Text>
                    <TextInput
                      placeholder="10"
                      placeholderTextColor={textSecondary}
                      value={formPoints}
                      onChangeText={setFormPoints}
                      keyboardType="numeric"
                      style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
                    />
                  </View>
                )}

                {formLoading ? (
                  <ActivityIndicator color={PRIMARY} style={{ marginTop: 20 }} />
                ) : (
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
                    <Pressable onPress={() => setAddType(null)} style={[styles.btn, { backgroundColor: inputBg, flex: 1 }]}>
                      <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold" }}>Back</Text>
                    </Pressable>
                    <Pressable onPress={handleAddMaterial} style={[styles.btn, { backgroundColor: PRIMARY, flex: 1 }]}>
                      <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold" }}>Save Material</Text>
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 16, flex: 1, textAlign: "center", marginHorizontal: 10 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  indicator: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 12 },
  materialCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  summaryBox: { backgroundColor: "#F3F4F6", borderRadius: 8, padding: 10, marginTop: 10 },
  summaryTitle: { fontFamily: "Inter_700Bold", fontSize: 10, color: PRIMARY, letterSpacing: 0.5 },
  summaryText: { fontFamily: "Inter_500Medium", fontSize: 12, color: "#374151", marginTop: 4, lineHeight: 16 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, marginTop: 14, paddingTop: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  fab: {
    position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 6
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontFamily: "Sora_700Bold", fontSize: 16 },
  optionsList: { gap: 12, paddingVertical: 10 },
  optionItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", gap: 12 },
  optionText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  inputLabel: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
  input: { paddingHorizontal: 12, height: 44, borderRadius: 8, fontFamily: "Inter_500Medium", fontSize: 14 },
  inputArea: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontFamily: "Inter_500Medium", fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  btn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" }
});
