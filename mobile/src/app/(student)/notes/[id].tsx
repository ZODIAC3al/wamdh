import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Modal, ActivityIndicator, StyleSheet, Share } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

type AiAction = "Summarize" | "Key Points" | "Quiz" | "Flashcards" | "Mindmap" | "";

export default function NoteViewer() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const inputBg = colors.inputBg;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const [aiOverlayVisible, setAiOverlayVisible] = useState(false);
  const [aiAction, setAiAction] = useState<AiAction>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | string[]>("");
  const [generatedId, setGeneratedId] = useState("");

  const { data: note, isLoading } = useQuery<any>({
    queryKey: ["note", id],
    queryFn: async () => (await apiClient.get(`/api/notes/${id}/`)).data,
    enabled: !!id,
  });

  const handleShare = async () => {
    if (!note) return;
    try {
      await Share.share({
        title: note.title,
        message: `${note.title}\n\n${note.raw_text || "Shared from Wamdh"}`,
      });
    } catch (e) {
      console.error("Share failed", e);
    }
  };

  const handleAiAction = async (action: AiAction) => {
    if (!note) return;
    if (action === "Mindmap") {
      router.push({ pathname: "/(student)/notes/mindmap", params: { noteId: id } } as any);
      return;
    }
    setAiAction(action);
    setAiLoading(true);
    setAiOverlayVisible(true);
    setGeneratedId("");
    setAiResult("");

    try {
      if (action === "Summarize") {
        const res = await apiClient.post("/api/ai/summarize/", { note_id: id, mode: "medium" });
        setAiResult(res.data.summary);

      } else if (action === "Key Points") {
        const res = await apiClient.post("/api/ai/key-points/", { note_id: id });
        setAiResult(res.data.points || []);

      } else if (action === "Quiz") {
        const genRes = await apiClient.post("/api/ai/quiz/", { note_id: id, count: 5, difficulty: "medium", type: "mcq" });
        const questions = genRes.data.questions;
        const saveRes = await apiClient.post("/api/quiz/", {
          title: `Quiz: ${note.title}`,
          difficulty: "medium",
          question_type: "mcq",
          questions,
          time_limit_minutes: 10,
        });
        setGeneratedId(saveRes.data.id);
        setAiResult(`✅ Generated ${questions.length} questions for "${note.title}"`);

      } else if (action === "Flashcards") {
        const genRes = await apiClient.post("/api/ai/flashcards/", { note_id: id, count: 8 });
        const cards = genRes.data.cards;
        const deckRes = await apiClient.post("/api/flashcards/", { title: `Deck: ${note.title}`, subject: note.subject });
        const deckId = deckRes.data.id;
        setGeneratedId(deckId);
        for (const card of cards) {
          await apiClient.post("/api/flashcards/cards/", { deck: deckId, front: card.front, back: card.back });
        }
        setAiResult(`✅ Created ${cards.length} flashcards for "${note.title}"`);
      }
    } catch (e: any) {
      setAiResult("❌ AI request failed. Check backend connection.\n" + (e?.message || ""));
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg }}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg }}>
        <Ionicons name="document-outline" size={48} color="#374151" />
        <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 12 }}>
          Note not found.
        </Text>
      </View>
    );
  }

  const actionItems: { action: AiAction; icon: string; label: string; color: string }[] = [
    { action: "Summarize", icon: "reader-outline", label: isRtl ? "تلخيص" : "Summarize", color: "#BE1A1A" },
    { action: "Key Points", icon: "bulb-outline", label: isRtl ? "نقاط رئيسية" : "Key Points", color: "#F59E0B" },
    { action: "Quiz", icon: "checkbox-outline", label: isRtl ? "اختبار" : "Quiz", color: "#10B981" },
    { action: "Flashcards", icon: "albums-outline", label: isRtl ? "بطاقات" : "Flashcards", color: "#3B82F6" },
    { action: "Mindmap", icon: "git-network-outline", label: isRtl ? "الخريطة الذهنية" : "Mind Map", color: "#06B6D4" },
  ];

  const getSubjectColor = (sub: string) => {
    const hash = (sub || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return ["#F7D87F", "#10B981", ACCENT, "#EF4444", "#3B82F6", "#06B6D4"][hash % 6];
  };
  const subjectColor = getSubjectColor(note.subject);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={20} color={ACCENT} />
        </Pressable>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, flex: 1, textAlign: "center", marginHorizontal: 8 }} numberOfLines={1}>
          {note.title}
        </Text>
        <Pressable
          onPress={() => router.push({ pathname: "/(student)/ai/chat", params: { noteId: id } })}
          style={[styles.iconBtn, { backgroundColor: "#BE1A1A" }]}
        >
          <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={handleShare} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="share-outline" size={18} color={ACCENT} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>

        {/* Subject + meta row */}
        <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", marginBottom: 14 }}>
          <View style={[styles.subjectPill, { backgroundColor: subjectColor + "20", flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: subjectColor, marginRight: isRtl ? 0 : 6, marginLeft: isRtl ? 6 : 0 }} />
            <Text style={{ color: subjectColor, fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>
              {note.subject}
            </Text>
          </View>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginLeft: isRtl ? 0 : 10, marginRight: isRtl ? 10 : 0 }}>
            {note.word_count || 0} {isRtl ? "كلمة" : "words"}
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginLeft: isRtl ? 0 : 10, marginRight: isRtl ? 10 : 0 }}>
            {new Date(note.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* AI Action Pills */}
        <View style={[styles.actionPillsRow, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
          {actionItems.map((item) => (
            <Pressable
              key={item.action}
              onPress={() => handleAiAction(item.action)}
              style={[styles.actionPill, { backgroundColor: item.color + "18", borderColor: item.color + "40", flexDirection: isRtl ? "row-reverse" : "row" }]}
            >
              <Ionicons name={item.icon as any} size={14} color={item.color} />
              <Text style={{ color: item.color, fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: isRtl ? 0 : 5, marginRight: isRtl ? 5 : 0 }}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {note.tags.map((tag: string) => (
              <View key={tag} style={[styles.tag, { backgroundColor: "#BE1A1A" + "15" }]}>
                <Text style={{ color: "#BE1A1A", fontFamily: "Inter_500Medium", fontSize: 11 }}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Note body */}
        <View style={[styles.noteCard, { backgroundColor: cardBg, borderColor: cardBorder, alignItems: isRtl ? "flex-end" : "flex-start" }]}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20, marginBottom: 16 }}>
            {note.title}
          </Text>
          <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 24, textAlign: isRtl ? "right" : "left" }}>
            {note.raw_text}
          </Text>
        </View>

        {/* Note Summary details */}
        {note.summary && (
          <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: cardBorder, alignItems: isRtl ? "flex-end" : "flex-start", marginTop: 14 }]}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginBottom: 10 }}>
              {isRtl ? "ملخص ذكي للمحاضرة" : "Lecture Summary"}
            </Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 22, textAlign: isRtl ? "right" : "left" }}>
              {note.summary}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* AI Modal Sheet */}
      <Modal animationType="slide" transparent visible={aiOverlayVisible} onRequestClose={() => setAiOverlayVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => !aiLoading && setAiOverlayVisible(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: cardBg }]} onPress={(e) => e.stopPropagation()}>
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: dark ? "#374151" : "#D1D5DB" }]} />

            {/* Header */}
            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center" }}>
                <View style={[styles.aiIconBox, { backgroundColor: "#BE1A1A" }]}>
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                </View>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginLeft: isRtl ? 0 : 10, marginRight: isRtl ? 10 : 0 }}>
                  {aiAction}
                </Text>
              </View>
              {!aiLoading && (
                <Pressable onPress={() => setAiOverlayVisible(false)} style={[styles.closeBtn, { backgroundColor: inputBg }]}>
                  <Ionicons name="close" size={18} color={textSecondary} />
                </Pressable>
              )}
            </View>

            {aiLoading ? (
              <View style={{ paddingVertical: 60, alignItems: "center" }}>
                <ActivityIndicator size="large" color={ACCENT} />
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 16 }}>
                  {isRtl ? "المعلم يفكر..." : "AI is thinking..."}
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

                {/* Key Points: display as chips */}
                {aiAction === "Key Points" && Array.isArray(aiResult) ? (
                  <View style={{ gap: 10 }}>
                    {(aiResult as string[]).map((pt, i) => (
                      <View key={i} style={[styles.keyPointRow, { backgroundColor: inputBg, borderColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
                        <View style={[styles.keyPointNum, { backgroundColor: "#BE1A1A" }]}>
                          <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 11 }}>{i + 1}</Text>
                        </View>
                        <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, flex: 1, lineHeight: 22, marginLeft: isRtl ? 0 : 10, marginRight: isRtl ? 10 : 0, textAlign: isRtl ? "right" : "left" }}>
                          {pt}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  // Text result (Summarize, Quiz, Flashcards)
                  <View style={[styles.resultBox, { backgroundColor: inputBg, borderColor: cardBorder }]}>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 24, textAlign: isRtl ? "right" : "left" }}>
                      {typeof aiResult === "string" ? aiResult : ""}
                    </Text>
                  </View>
                )}

                {/* CTAs */}
                {aiAction === "Quiz" && generatedId ? (
                  <Pressable
                    onPress={() => { setAiOverlayVisible(false); router.push({ pathname: "/(student)/quiz/[id]", params: { id: generatedId } }); }}
                    style={[styles.ctaBtn, { backgroundColor: "#10B981", marginTop: 16, flexDirection: isRtl ? "row-reverse" : "row" }]}
                  >
                    <Ionicons name="play-circle" size={20} color="#FFFFFF" style={{ marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }} />
                    <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 }}>
                      {isRtl ? "ابدأ الاختبار الآن" : "Start Quiz Now"}
                    </Text>
                  </Pressable>
                ) : null}

                {aiAction === "Flashcards" && generatedId ? (
                  <Pressable
                    onPress={() => { setAiOverlayVisible(false); router.push({ pathname: "/(student)/flashcards/[id]", params: { id: generatedId } }); }}
                    style={[styles.ctaBtn, { backgroundColor: "#3B82F6", marginTop: 16, flexDirection: isRtl ? "row-reverse" : "row" }]}
                  >
                    <Ionicons name="albums" size={20} color="#FFFFFF" style={{ marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }} />
                    <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 }}>
                      {isRtl ? "مراجعة الكروت الذهنية" : "Study Flashcards"}
                    </Text>
                  </Pressable>
                ) : null}

                {/* Chat with context */}
                <Pressable
                  onPress={() => { setAiOverlayVisible(false); router.push({ pathname: "/(student)/ai/chat", params: { noteId: id } }); }}
                  style={[styles.ctaBtn, { backgroundColor: "#BE1A1A", marginTop: generatedId ? 8 : 16, flexDirection: isRtl ? "row-reverse" : "row" }]}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" style={{ marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }} />
                  <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 }}>
                    {isRtl ? "اسأل المعلم الذكي" : "Ask AI Tutor"}
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  subjectPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  actionPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  actionPill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, borderWidth: 1,
  },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  noteCard: {
    borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  summaryCard: {
    borderRadius: 14, padding: 16, borderWidth: 1,
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: "85%", minHeight: "50%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  aiIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  closeBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  keyPointRow: {
    flexDirection: "row", alignItems: "flex-start",
    borderRadius: 12, padding: 14, borderWidth: 1,
  },
  keyPointNum: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 2 },
  resultBox: { borderRadius: 12, padding: 16, borderWidth: 1 },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 50,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
});
