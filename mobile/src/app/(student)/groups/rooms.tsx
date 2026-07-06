import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView, TextInput, StyleSheet, FlatList, Modal, Image, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useWamdh } from "../../../context/WamdhContext";

interface Message {
  id: string;
  sender: string;
  text: string;
  stickerUrl?: string;
  isSticker?: boolean;
}

const PRESET_STICKERS = [
  { id: "s1", label: "Study Time! 📚", text: "📚 Study Time!" },
  { id: "s2", label: "Derivatives Expert! 📈", text: "📈 Derivatives Expert!" },
  { id: "s3", label: "Formula Master! 🧪", text: "🧪 Formula Master!" },
  { id: "s4", label: "Well Done! 🏆", text: "🏆 Well Done!" },
];

export default function CollaborativeStudyRoomsScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const PRIMARY = colors.accent;

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "Ali", text: "Hey! Let's solve the math practice quiz together." },
    { id: "2", sender: "Zainab", text: "Sure, let me open the whiteboard." }
  ]);
  const [inputText, setInputText] = useState("");

  // Permissions Settings State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "member">("admin"); // Mock creator as admin

  // Sticker Tray State
  const [showStickerTray, setShowStickerTray] = useState(false);
  const [customStickers, setCustomStickers] = useState<string[]>([]);

  const sendMessage = (text: string, isSticker = false, stickerUrl?: string) => {
    if (!text.trim() && !stickerUrl) return;
    
    // Check messaging permission
    if (isAdminOnly && currentUserRole !== "admin") {
      Alert.alert("Permission Denied", "Only admins can send messages in this group.");
      return;
    }

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "demo_student", // Current user
      text: text,
      isSticker,
      stickerUrl
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText("");
    setShowStickerTray(false);
  };

  const handlePickCustomSticker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Denied", "Access to library is needed to create stickers.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      const uri = result.assets[0].uri;
      setCustomStickers(prev => [uri, ...prev]);
      Alert.alert("Success", "Custom sticker created!");
    }
  };

  const bg = colors.background;
  const card = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  // Determine if inputs are disabled due to group rules
  const isInputDisabled = isAdminOnly && currentUserRole !== "admin";

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: card, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Community study group</Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>
            {isAdminOnly ? "Only Admins can post" : "Open discussion"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Pressable onPress={() => router.push("/(student)/whiteboard")} style={[styles.backBtn, { backgroundColor: inputBg }]}>
            <Ionicons name="brush-outline" size={18} color={PRIMARY} />
          </Pressable>
          <Pressable onPress={() => setShowSettingsModal(true)} style={[styles.backBtn, { backgroundColor: inputBg }]}>
            <Ionicons name="settings-outline" size={18} color={PRIMARY} />
          </Pressable>
        </View>
      </View>

      {/* Sync Whiteboard Preview card */}
      <View style={[styles.whiteboardCard, { backgroundColor: card, borderColor: cardBorder }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="easel-outline" size={18} color={PRIMARY} style={{ marginRight: 6 }} />
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 13 }}>
              Shared whiteboard is active
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(student)/whiteboard")}
            style={[styles.openBtn, { backgroundColor: PRIMARY }]}
          >
            <Text style={styles.openBtnText}>Open</Text>
          </Pressable>
        </View>
      </View>

      {/* Live Chat messages list */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => {
          const isSelf = item.sender === "demo_student";
          return (
            <View
              style={[
                styles.msgBubble,
                isSelf
                  ? [styles.msgSelf, { backgroundColor: PRIMARY }]
                  : [styles.msgOther, { backgroundColor: card, borderColor: cardBorder }]
              ]}
            >
              <Text
                style={[
                  styles.msgSender,
                  { color: isSelf ? "#F7D87F" : PRIMARY }
                ]}
              >
                {item.sender}
              </Text>
              
              {item.isSticker ? (
                item.stickerUrl ? (
                  <Image source={{ uri: item.stickerUrl }} style={{ width: 100, height: 100, borderRadius: 8, marginTop: 4 }} />
                ) : (
                  <View style={styles.stickerTextBubble}>
                    <Text style={{ fontSize: 18 }}>{item.text}</Text>
                  </View>
                )
              ) : (
                <Text
                  style={[
                    styles.msgText,
                    { color: isSelf ? "#FFFFFF" : textPrimary }
                  ]}
                >
                  {item.text}
                </Text>
              )}
            </View>
          );
        }}
      />

      {/* Sticker Tray Panel */}
      {showStickerTray && (
        <View style={[styles.stickerTray, { backgroundColor: card, borderTopColor: cardBorder }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 13 }}>Sticker Box</Text>
            <Pressable onPress={handlePickCustomSticker} style={styles.createStickerBtn}>
              <Ionicons name="add-circle-outline" size={14} color={PRIMARY} />
              <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: 4 }}>Create Sticker</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {PRESET_STICKERS.map(s => (
              <Pressable key={s.id} onPress={() => sendMessage(s.text, true)} style={[styles.presetStickerItem, { backgroundColor: inputBg, borderColor: cardBorder }]}>
                <Text style={{ fontSize: 14 }}>{s.label}</Text>
              </Pressable>
            ))}
            {customStickers.map((uri, idx) => (
              <Pressable key={idx} onPress={() => sendMessage("", true, uri)}>
                <Image source={{ uri }} style={{ width: 50, height: 50, borderRadius: 8 }} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input panel */}
      <View style={[styles.inputPanel, { backgroundColor: card, borderTopColor: cardBorder }]}>
        <Pressable onPress={() => setShowStickerTray(!showStickerTray)} style={styles.stickerToggleBtn}>
          <Ionicons name="happy-outline" size={22} color={PRIMARY} />
        </Pressable>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          editable={!isInputDisabled}
          placeholder={isInputDisabled ? "Only Admins can send messages." : "Type message here..."}
          placeholderTextColor={textSecondary}
          style={[styles.input, { color: textPrimary, backgroundColor: inputBg }]}
        />
        <Pressable onPress={() => sendMessage(inputText)} disabled={isInputDisabled} style={[styles.sendBtn, { backgroundColor: PRIMARY }]}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Settings Modal (WhatsApp style creator settings) */}
      <Modal visible={showSettingsModal} transparent animationType="slide" onRequestClose={() => setShowSettingsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Group Administration</Text>
              <Pressable onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </Pressable>
            </View>

            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 16 }}>
              Configure messaging authorization limits similar to WhatsApp groups.
            </Text>

            {/* Send Messages permissions toggle */}
            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }}>Only Admins Can Post</Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                  Restrict group messages to chat admins only.
                </Text>
              </View>
              <Pressable onPress={() => setIsAdminOnly(!isAdminOnly)} style={[styles.toggleBtn, { backgroundColor: isAdminOnly ? PRIMARY : inputBg }]}>
                <Ionicons name={isAdminOnly ? "lock-closed" : "people-outline"} size={16} color={isAdminOnly ? "#FFFFFF" : textSecondary} />
              </Pressable>
            </View>

            {/* Toggle role for simulation */}
            <View style={[styles.optionRow, { marginTop: 14 }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }}>My Role Simulation</Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                  Switch roles to test messaging locks.
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {["admin", "member"].map((role) => (
                  <Pressable
                    key={role}
                    onPress={() => setCurrentUserRole(role as any)}
                    style={[styles.roleSelectBtn, { backgroundColor: currentUserRole === role ? PRIMARY : inputBg }]}
                  >
                    <Text style={{ color: currentUserRole === role ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 10 }}>
                      {role.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 16 },
  whiteboardCard: { margin: 20, marginBottom: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  openBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  openBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 11 },
  msgBubble: { padding: 12, borderRadius: 14, marginBottom: 12, maxWidth: "80%" },
  msgSelf: { alignSelf: "flex-end", borderBottomRightRadius: 2 },
  msgOther: { alignSelf: "flex-start", borderWidth: 1, borderBottomLeftRadius: 2 },
  msgSender: { fontFamily: "Inter_700Bold", fontSize: 11, marginBottom: 2 },
  msgText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  stickerTextBubble: { padding: 8, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.2)" },
  inputPanel: { flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: 1, paddingBottom: 34 },
  stickerToggleBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, height: 40, borderRadius: 10, paddingHorizontal: 14, fontFamily: "Inter_400Regular", fontSize: 13, marginRight: 10 },
  sendBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  
  // Sticker Tray
  stickerTray: { padding: 12, borderTopWidth: 1, height: 110 },
  createStickerBtn: { flexDirection: "row", alignItems: "center" },
  presetStickerItem: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, justifyContent: "center" },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  optionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  toggleBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  roleSelectBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }
});
