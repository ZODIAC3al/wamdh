import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView,
  Platform, ActivityIndicator, StyleSheet, Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useAuthStore } from "../../../store/authStore";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold

export default function InstructorChatRoom() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { user } = useAuthStore();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const qc = useQueryClient();
  const listRef = useRef<FlatList>(null);

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const inputBg = colors.inputBg;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  // Poll every 2 seconds
  const { data, isLoading } = useQuery<any>({
    queryKey: ["room-messages-instructor", id],
    queryFn: async () => (await apiClient.get(`/api/messages/rooms/${id}/`)).data,
    refetchInterval: 2000,
    enabled: !!id,
  });

  const messages: any[] = data?.messages || [];

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setInputText("");
    setSending(true);
    try {
      await apiClient.post(`/api/messages/rooms/${id}/`, { text });
      qc.invalidateQueries({ queryKey: ["room-messages-instructor", id] });
      qc.invalidateQueries({ queryKey: ["message-rooms-instructor"] });
    } catch (e) {
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleAISuggest = async () => {
    setSuggesting(true);
    try {
      const res = await apiClient.post("/api/messages/ai-suggest/", { room_id: id });
      setInputText(res.data.suggested_reply);
    } catch (e) {
      Alert.alert("AI Error", "Could not fetch AI suggestion. Make sure your Gemini API key is configured.");
    } finally {
      setSuggesting(false);
    }
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isMe = item.sender_id === user?.id;
    const prevMsg = messages[index - 1];
    const showSender = !isMe && (!prevMsg || prevMsg.sender_id !== item.sender_id);
    const showTime = index === messages.length - 1 ||
      new Date(messages[index + 1]?.created_at).getTime() - new Date(item.created_at).getTime() > 5 * 60 * 1000;

    return (
      <View style={{ marginBottom: 2, paddingHorizontal: 16 }}>
        {showSender && (
          <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 11, marginBottom: 2, marginLeft: 44 }}>
            {item.sender_name}
          </Text>
        )}
        <View style={[styles.msgRow, { justifyContent: isMe ? "flex-end" : "flex-start" }]}>
          {!isMe && (
            <View style={[styles.avatar, { backgroundColor: PRIMARY + "20" }]}>
              <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 12 }}>
                {(item.sender_name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[
            styles.bubble,
            isMe
              ? { backgroundColor: PRIMARY, borderBottomRightRadius: 4 }
              : { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1, borderBottomLeftRadius: 4 },
          ]}>
            <Text style={{
              color: isMe ? "#FFFFFF" : textPrimary,
              fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20,
            }}>
              {item.text}
            </Text>
          </View>
        </View>
        {showTime && (
          <Text style={[styles.timeLabel, { textAlign: isMe ? "right" : "left", paddingLeft: isMe ? 0 : 50 }]}>
            {formatTime(item.created_at)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: bg }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="arrow-back" size={20} color={PRIMARY} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15 }}>
            {name || "DM Chat"}
          </Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={{ color: "#10B981", fontFamily: "Inter_400Regular", fontSize: 11, marginLeft: 4 }}>
              Active
            </Text>
          </View>
        </View>

        {suggesting ? (
          <ActivityIndicator size="small" color={PRIMARY} style={{ marginRight: 8 }} />
        ) : (
          <Pressable onPress={handleAISuggest} style={[styles.aiBtn, { borderColor: PRIMARY, borderWidth: 1 }]}>
            <Ionicons name="sparkles" size={14} color={PRIMARY} />
            <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: 4 }}>AI Reply</Text>
          </Pressable>
        )}
      </View>

      {/* Messages list */}
      {isLoading && messages.length === 0 ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 60 }} />
      ) : messages.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
          <View style={[styles.emptyIcon, { backgroundColor: PRIMARY + "20" }]}>
            <Ionicons name="chatbubbles" size={40} color={PRIMARY} />
          </View>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 16 }}>
            No messages yet
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 6 }}>
            Say hello to your student!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={renderMessage}
        />
      )}

      {/* Input Bar */}
      <View style={[styles.inputBar, { backgroundColor: cardBg, borderTopColor: cardBorder }]}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message..."
          placeholderTextColor="#6B7280"
          multiline
          style={[styles.textInput, { backgroundColor: inputBg, color: textPrimary }]}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <Pressable
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
          style={[
            styles.sendBtn,
            { backgroundColor: inputText.trim() ? PRIMARY : (dark ? "#252540" : "#E5E7EB") },
          ]}
        >
          {sending
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Ionicons name="send" size={18} color={inputText.trim() ? "#FFFFFF" : "#9CA3AF"} />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  aiBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  onlineRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 2 },
  avatar: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 8 },
  bubble: { maxWidth: "72%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  timeLabel: { color: "#9CA3AF", fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 3, marginBottom: 6, paddingHorizontal: 16 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 12, paddingVertical: 10, borderTopColor: "#E5E7EB", borderTopWidth: 1, gap: 8,
  },
  textInput: {
    flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontFamily: "Inter_400Regular", fontSize: 14, maxHeight: 100,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
