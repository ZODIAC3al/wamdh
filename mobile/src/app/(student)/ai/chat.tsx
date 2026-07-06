import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, Pressable, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, ScrollView
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming
} from "react-native-reanimated";
import { useWamdh } from "../../../context/WamdhContext";

interface Message {
  id?: string;
  sender: "user" | "ai";
  text: string;
  created_at?: string;
}

const SUGGESTIONS = [
  { text: "📝 Summarize Note", prompt: "Summarize this note in 5 key bullet points." },
  { text: "🧪 Make Quiz", prompt: "Generate 5 multiple-choice questions from this note." },
  { text: "💡 Explain Concepts", prompt: "Explain the main concept in very simple ELI5 terms." },
  { text: "🔤 Key Vocab", prompt: "List the core vocabulary definitions from this text." }
];

import { Modal } from "react-native";

export default function AiChatTutor() {
  const router = useRouter();
  const { noteId } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const [input, setInput] = useState("");
  const [explainLike12, setExplainLike12] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>(noteId ? [noteId as string] : []);
  const [isSelectingNotes, setIsSelectingNotes] = useState(false);

  // Mona Floating Animations
  const floatOffset = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    floatOffset.value = withRepeat(withTiming(-6, { duration: 1600 }), -1, true);
    pulseScale.value = withRepeat(withTiming(1.04, { duration: 1600 }), -1, true);
  }, []);

  const animatedMascotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatOffset.value },
      { scale: pulseScale.value }
    ]
  }));

  // Fetch single note details if only one note is selected
  const { data: note } = useQuery<any>({
    queryKey: ["note", selectedNoteIds[0]],
    queryFn: async () => (await apiClient.get(`/api/notes/${selectedNoteIds[0]}/`)).data,
    enabled: selectedNoteIds.length === 1,
  });

  // Fetch all notes for context selection
  const { data: allNotes } = useQuery<any[]>({
    queryKey: ["notes"],
    queryFn: async () => (await apiClient.get("/api/notes/")).data,
  });

  // Fetch Chat logs from DB
  const { data: dbHistory } = useQuery<Message[]>({
    queryKey: ["chat-history", selectedNoteIds],
    queryFn: async () => {
      const params: any = {};
      if (selectedNoteIds.length === 1) {
        params.note_id = selectedNoteIds[0];
      }
      const res = await apiClient.get("/api/rag/chat/history/", { params });
      return res.data.results || [];
    }
  });

  // Sync DB history to local state when loaded
  useEffect(() => {
    if (dbHistory) {
      setLocalMessages(dbHistory);
    }
  }, [dbHistory]);

  const sendMutation = useMutation({
    mutationFn: async (msgText: string) => {
      const payload: any = {
        message: explainLike12 ? `${msgText} (Explain like I am 12 years old, simple ELI5 style)` : msgText,
      };

      let url = "/api/rag/chat/";
      if (selectedNoteIds.length > 1) {
        url = "/api/rag/chat/synthesis/";
        payload.note_ids = selectedNoteIds;
      } else if (selectedNoteIds.length === 1) {
        payload.note_id = selectedNoteIds[0];
      } else {
        payload.note_id = null;
      }

      const res = await apiClient.post(url, payload);
      return res.data.response;
    },
    onMutate: async (msgText) => {
      const userMsg: Message = { sender: "user", text: msgText };
      setLocalMessages(prev => [...prev, userMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onSuccess: (aiResponse) => {
      const aiMsg: Message = { sender: "ai", text: aiResponse };
      setLocalMessages(prev => [...prev, aiMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      queryClient.invalidateQueries({ queryKey: ["chat-history", selectedNoteIds] });
    },
    onError: () => {
      const errorMsg: Message = { sender: "ai", text: isRtl ? "حدث خطأ ما. يرجى التحقق من اتصالك بالخادم." : "Something went wrong. Please check your backend connection." };
      setLocalMessages(prev => [...prev, errorMsg]);
    }
  });

  const handleSend = (textToSend = input) => {
    const cleanText = textToSend.trim();
    if (!cleanText || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate(cleanText);
  };

  const handleSuggestion = (prompt: string) => {
    handleSend(prompt);
  };

  const bg = colors.background;
  const cardBg = dark ? "rgba(26,26,46,0.85)" : "rgba(255,255,255,0.85)";
  const cardBorder = dark ? "rgba(46,46,80,0.4)" : "rgba(229,231,235,0.8)";
  const inputBg = colors.inputBg;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: bg }}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: dark ? "#1A1A2E" : "#FFFFFF", borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", flex: 1 }}>
            <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
              <Ionicons name={isRtl ? "arrow-forward" : "chevron-back"} size={20} color={ACCENT} />
            </Pressable>
            <View style={{ marginHorizontal: 12, alignItems: isRtl ? "flex-end" : "flex-start", flex: 1 }}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>
                {isRtl ? "معلم الذكاء الاصطناعي" : "AI Tutor"}
              </Text>
              <Pressable 
                onPress={() => setIsSelectingNotes(true)}
                style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", marginTop: 2 }}
              >
                <Text style={{ color: "#BE1A1A", fontFamily: "Inter_700Bold", fontSize: 11 }} numberOfLines={1}>
                  {selectedNoteIds.length === 0
                    ? (isRtl ? "تحديد سياق الملاحظات..." : "Select note context...")
                    : selectedNoteIds.length === 1
                    ? (isRtl ? `الملاحظة: ${note?.title || "تحميل..."}` : `Context: ${note?.title || "Loading..."}`)
                    : (isRtl ? `تجميع (${selectedNoteIds.length}) ملاحظات` : `Synthesis (${selectedNoteIds.length}) Notes`)}
                </Text>
                <Ionicons name="chevron-down" size={10} color="#BE1A1A" style={{ marginLeft: isRtl ? 0 : 4, marginRight: isRtl ? 4 : 0 }} />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => setExplainLike12(!explainLike12)}
            style={[
              styles.eli5Btn,
              { backgroundColor: explainLike12 ? ACCENT + "20" : inputBg, borderColor: explainLike12 ? ACCENT : "transparent", borderWidth: 1, flexDirection: isRtl ? "row-reverse" : "row" },
            ]}
          >
            <Ionicons name="bulb-outline" size={14} color={explainLike12 ? ACCENT : "#6B7280"} />
            <Text style={{ color: explainLike12 ? ACCENT : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11, marginHorizontal: 4 }}>
              ELI5
            </Text>
          </Pressable>
        </View>

        {/* Main chat layout */}
        <FlatList
          ref={flatListRef}
          data={localMessages}
          keyExtractor={(_, index) => index.toString()}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 40, paddingHorizontal: 20 }}>
              {/* Mascot Mona Container */}
              <Animated.View style={[styles.mascotContainer, animatedMascotStyle, { backgroundColor: dark ? "#1A1A35" : "#EBE7FF", borderColor: "#BE1A1A" + "30" }]}>
                <View style={[styles.glowingDot, { backgroundColor: sendMutation.isPending ? "#10B981" : "#BE1A1A" }]} />
                <Ionicons name="sparkles" size={32} color={ACCENT} />
              </Animated.View>

              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20, textAlign: "center", marginTop: 16 }}>
                {isRtl ? "تحدث مع منى، معلمتك الذكية" : "Meet Mona, your AI Tutor"}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 18 }}>
                {isRtl ? "اسأل أي سؤال حول ملاحظاتك، ولخص المحاضرات الطويلة، أو صمم كروت استذكار واختبارات تفاعلية فوراً!" : "Ask anything about your notes, solve equations, summarize details or generate flashcards instantly."}
              </Text>

              {/* Suggestions Pills */}
              <View style={{ width: "100%", marginTop: 28 }}>
                <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, textAlign: isRtl ? "right" : "left" }}>
                  {isRtl ? "أسئلة سريعة ومقترحة" : "Quick Prompts"}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  {SUGGESTIONS.map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleSuggestion(item.prompt)}
                      style={[styles.suggestionPill, { backgroundColor: cardBg, borderColor: cardBorder }]}
                    >
                      <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 12 }}>{item.text}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isUser = item.sender === "user";
            return (
              <View style={[styles.msgRow, { justifyContent: isUser ? "flex-end" : "flex-start", flexDirection: isRtl ? (isUser ? "row" : "row-reverse") : (isUser ? "row" : "row") }]}>
                {!isUser && (
                  <View style={[styles.aiAvatar, { backgroundColor: "#BE1A1A", marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }]}>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                  </View>
                )}
                <View style={[
                  styles.msgBubble,
                  isUser
                    ? { backgroundColor: "#BE1A1A", borderBottomRightRadius: 4 }
                    : { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1, borderBottomLeftRadius: 4 },
                ]}>
                  <Text style={{
                    color: isUser ? "#FFFFFF" : textPrimary,
                    fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20,
                    textAlign: isRtl ? "right" : "left"
                  }}>
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Typing indicator */}
        {sendMutation.isPending && (
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 }}>
            <View style={[styles.aiAvatar, { backgroundColor: "#BE1A1A", marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }]}>
              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            </View>
            <View style={[styles.typingBubble, { backgroundColor: cardBg, borderColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
              <ActivityIndicator size="small" color={ACCENT} />
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginLeft: isRtl ? 0 : 8, marginRight: isRtl ? 8 : 0 }}>
                {isRtl ? "منى تفكر وتكتب الآن..." : "Mona is thinking..."}
              </Text>
            </View>
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: dark ? "#1A1A2E" : "#FFFFFF", borderTopColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={isRtl ? "اسأل منى أي سؤال..." : "Ask Mona a question..."}
            placeholderTextColor="#6B7280"
            style={[styles.textInput, { backgroundColor: inputBg, color: textPrimary, textAlign: isRtl ? "right" : "left" }]}
            multiline
          />
          <Pressable onPress={() => handleSend()} style={[styles.sendBtn, { backgroundColor: "#BE1A1A" }]}>
            <Ionicons name="send" size={16} color="#FFFFFF" style={isRtl && { transform: [{ rotate: "180deg" }] }} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* ── Note Selection Modal ───────────────── */}
      <Modal
        visible={isSelectingNotes}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSelectingNotes(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%", borderWidth: 1, borderColor: cardBorder }}>
            {/* Header */}
            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18 }}>
                {isRtl ? "تحديد سياق الدراسة" : "Select Study Context"}
              </Text>
              <Pressable onPress={() => setIsSelectingNotes(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </Pressable>
            </View>

            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 16, textAlign: isRtl ? "right" : "left" }}>
              {isRtl 
                ? "اختر ملاحظة واحدة أو أكثر ليقوم المعلم بربطها والمقارنة بينها والإجابة بناء عليها." 
                : "Choose one or more notes for the AI tutor to compare, contrast, and synthesize."}
            </Text>

            {/* Note List */}
            <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
              {(allNotes || []).map((n) => {
                const isSelected = selectedNoteIds.includes(n.id || n._id);
                return (
                  <Pressable
                    key={n.id || n._id}
                    onPress={() => {
                      const id = n.id || n._id;
                      if (isSelected) {
                        setSelectedNoteIds(prev => prev.filter(x => x !== id));
                      } else {
                        setSelectedNoteIds(prev => [...prev, id]);
                      }
                    }}
                    style={{
                      flexDirection: isRtl ? "row-reverse" : "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: isSelected ? ACCENT + "15" : "transparent",
                      borderWidth: 1,
                      borderColor: isSelected ? ACCENT : "transparent",
                      marginBottom: 8
                    }}
                  >
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={20}
                      color={isSelected ? ACCENT : textSecondary}
                      style={{ marginRight: isRtl ? 0 : 12, marginLeft: isRtl ? 12 : 0 }}
                    />
                    <View style={{ flex: 1, alignItems: isRtl ? "flex-end" : "flex-start" }}>
                      <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                        {n.title}
                      </Text>
                      <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                        {n.subject}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Actions */}
            <Pressable
              onPress={() => setIsSelectingNotes(false)}
              style={{ backgroundColor: "#BE1A1A", borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 }}>
                {isRtl ? "تأكيد التحديد" : "Confirm Context"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  eli5Btn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  mascotContainer: {
    width: 80, height: 80, borderRadius: 28, borderWidth: 1,
    alignItems: "center", justifyContent: "center", position: "relative",
    shadowColor: "#BE1A1A", shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
  },
  glowingDot: {
    width: 10, height: 10, borderRadius: 5,
    position: "absolute", top: 8, right: 8,
    borderWidth: 1.5, borderColor: "#FFFFFF",
  },
  suggestionPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  msgRow: { flexDirection: "row", marginBottom: 14, alignItems: "flex-end" },
  aiAvatar: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  msgBubble: { maxWidth: "78%", borderRadius: 16, padding: 14 },
  typingBubble: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, padding: 12, borderWidth: 1,
  },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, gap: 10,
  },
  textInput: {
    flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontFamily: "Inter_400Regular", fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#BE1A1A", shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
});
