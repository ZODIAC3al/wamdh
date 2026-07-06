import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, StyleSheet, ScrollView, Dimensions, Image, Share
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { ExpoAudio, hasNativeAudio } from "../../../lib/audioHelper";
import { apiClient, API_BASE_URL } from "../../../lib/api";
import { useAuthStore } from "../../../store/authStore";
import { useWamdh } from "../../../context/WamdhContext";

// Emojis mapping for 200 stickers
const stickerEmojis: Record<number, string> = {};
const emojiList = [
  "🎓", "📚", "👨‍🔬", "💡", "👪", "🤖", "👩‍🏫", "🎨", "🎻", "🚀",
  "📝", "✅", "📖", "📷", "😎", "🐶", "🐱", "🦁", "🐯", "🐼", "🐻", "🐨",
  "🦊", "🐺", "☀️", "⚡", "🎸", "🎪", "📰", "💰", "⏺", "🏃", "🕺", "💃",
];

for (let i = 1; i <= 200; i++) {
  stickerEmojis[i] = emojiList[(i - 1) % emojiList.length];
}

const VoiceMessagePlayer: React.FC<{ item: any; isMe: boolean; colors: any; textSecondary: string; ACCENT: string }> = ({
  item, isMe, colors, textSecondary, ACCENT
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const playTimerRef = useRef<any>(null);
  const audioRef = useRef<any>(null);
  const soundRef = useRef<any>(null);

  useEffect(() => {
    const startPlayback = async () => {
      if (Platform.OS === "web") {
        try {
          if (!audioRef.current) {
            const url = item.attachment_url.startsWith("http")
              ? item.attachment_url
              : `${API_BASE_URL}${item.attachment_url}`;
            audioRef.current = new (window as any).Audio(url);
          }
          await audioRef.current.play();
        } catch (err) {
          console.log("Web audio play failed", err);
        }
      } else if (hasNativeAudio && ExpoAudio) {
        try {
          if (!soundRef.current) {
            const url = item.attachment_url.startsWith("http")
              ? item.attachment_url
              : `${API_BASE_URL}${item.attachment_url}`;
            const { sound } = await ExpoAudio.Sound.createAsync(
              { uri: url },
              { shouldPlay: true }
            );
            soundRef.current = sound;
            sound.setOnPlaybackStatusUpdate((status: any) => {
              if (status.isLoaded && status.didJustFinish) {
                setIsPlaying(false);
              }
            });
          } else {
            await soundRef.current.playAsync();
          }
        } catch (err) {
          console.log("Native sound play failed", err);
        }
      } else {
        Alert.alert(
          "Audio Playback",
          "Audio playback is simulated in emulator mode. Real native playback utilizes native sound buffers."
        );
      }
    };

    const pausePlayback = async () => {
      if (Platform.OS === "web") {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } else if (hasNativeAudio && soundRef.current) {
        try {
          await soundRef.current.pauseAsync();
        } catch (err) {
          console.log(err);
        }
      }
    };

    if (isPlaying) {
      startPlayback();
      setCurrentSec(0);
      playTimerRef.current = setInterval(() => {
        setCurrentSec(prev => {
          if (prev + 1 >= (item.duration || 5)) {
            setIsPlaying(false);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            if (hasNativeAudio && soundRef.current) {
              try {
                soundRef.current.stopAsync();
              } catch (err) {
                console.log(err);
              }
            }
            clearInterval(playTimerRef.current);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      pausePlayback();
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (hasNativeAudio && soundRef.current) {
        try {
          soundRef.current.unloadAsync();
        } catch (err) {
          console.log(err);
        }
      }
    };
  }, [isPlaying]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", minWidth: 140 }}>
      <Pressable onPress={() => setIsPlaying(!isPlaying)} style={{ marginRight: 8 }}>
        <Ionicons name={isPlaying ? "pause" : "play"} size={20} color={isMe ? "#FFFFFF" : ACCENT} />
      </Pressable>
      
      <View style={{ flex: 1, height: 12, justifyContent: "center" }}>
        <View style={{ flexDirection: "row", gap: 3, alignItems: "center" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((val, idx) => {
            const height = isPlaying ? Math.sin((currentSec * 5) + idx) * 4 + 8 : 4;
            return (
              <View
                key={idx}
                style={{
                  width: 2,
                  height: Math.max(3, height),
                  backgroundColor: isMe ? (idx / 15 <= currentSec / (item.duration || 5) ? "#FFFFFF" : "#FFFFFF50") : (idx / 15 <= currentSec / (item.duration || 5) ? ACCENT : "#E5E7EB"),
                  borderRadius: 1
                }}
              />
            );
          })}
        </View>
      </View>

      <Text style={{ color: isMe ? "#FFFFFF" : textSecondary, fontSize: 11, marginLeft: 8, fontFamily: "JetBrainsMono_400Regular" }}>
        0:{String(isPlaying ? currentSec : (item.duration || 5)).padStart(2, "0")}
      </Text>
    </View>
  );
};

export default function ChatRoom() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { user } = useAuthStore();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;
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
  const [showStickers, setShowStickers] = useState(false);
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recTimerRef = useRef<any>(null);
  const recordingRef = useRef<any>(null);

  // Group Details sheet state
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [inviting, setInviting] = useState(false);

  // Fetch messages
  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["room-messages", id],
    queryFn: async () => (await apiClient.get(`/api/messages/rooms/${id}/`)).data,
    enabled: !!id,
  });

  const messages: any[] = data?.messages || [];
  const room = data?.room;
  const isGroup = room?.type === "group";

  // Fetch users list for group invite
  useEffect(() => {
    if (isGroup && showGroupInfo) {
      apiClient.get("/api/messages/users/").then(res => {
        setAllUsers(res.data);
      }).catch(err => console.log(err));
    }
  }, [isGroup, showGroupInfo]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages.length]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => {
        setRecSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    }
    return () => {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    };
  }, [isRecording]);

  const sendMessage = async (customPayload: any = {}) => {
    if (sending) return;
    setSending(true);
    try {
      const payload = {
        text: inputText.trim(),
        type: "text",
        ...customPayload
      };
      await apiClient.post(`/api/messages/rooms/${id}/`, payload);
      setInputText("");
      qc.invalidateQueries({ queryKey: ["room-messages", id] });
      qc.invalidateQueries({ queryKey: ["message-rooms"] });
    } catch (e) {
      Alert.alert(isRtl ? "خطأ" : "Error", isRtl ? "ٝشل إرسال الرسالة." : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // Document Upload handler
  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true
      });
      if (res.canceled) return;
      
      const file = res.assets[0];
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream"
      } as any);

      setSending(true);
      const uploadRes = await apiClient.post("/api/messages/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      await sendMessage({
        text: file.name,
        type: "document",
        attachment_url: uploadRes.data.url,
        file_name: file.name
      });
    } catch (e) {
      Alert.alert("Upload Failed", "Could not upload document.");
    } finally {
      setSending(false);
    }
  };

  // Image Upload handler
  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8
      });
      if (res.canceled) return;
      
      const asset = res.assets[0];
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: asset.fileName || "photo.jpg",
        type: asset.mimeType || "image/jpeg"
      } as any);

      setSending(true);
      const uploadRes = await apiClient.post("/api/messages/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      await sendMessage({
        text: isRtl ? "صورة" : "Image Attachment",
        type: "image",
        attachment_url: uploadRes.data.url,
        file_name: asset.fileName || "photo.jpg"
      });
    } catch (e) {
      Alert.alert("Upload Failed", "Could not upload image.");
    } finally {
      setSending(false);
    }
  };

  // Voice recording triggers (WhatsApp-style hold to record)
  const startRecording = async () => {
    if (!hasNativeAudio) {
      setIsRecording(true);
      return;
    }
    try {
      const permission = await ExpoAudio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission Denied", "Microphone access is required to record voice notes.");
        return;
      }

      await ExpoAudio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await ExpoAudio.Recording.createAsync(
        ExpoAudio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (e) {
      console.log("Failed to start recording:", e);
      Alert.alert("Error", "Could not start microphone recording.");
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (!hasNativeAudio) return;
    if (!recordingRef.current) return;
    await recordingRef.current.stopAndUnloadAsync();
    recordingRef.current = null;
  };

  const handleVoicePressIn = () => {
    startRecording();
  };

  const handleVoicePressOut = () => {
    stopAndSendVoice();
  };

  const stopAndSendVoice = async () => {
    setIsRecording(false);

    if (!hasNativeAudio) {
      if (recSeconds < 1) {
        return;
      }
      setSending(true);
      try {
        await sendMessage({
          text: isRtl ? "رسالة صوتية" : "Voice Message",
          type: "voice",
          attachment_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          duration: recSeconds
        });
      } catch (e) {
        console.log("Failed to send simulated voice note:", e);
      } finally {
        setSending(false);
      }
      return;
    }

    if (!recordingRef.current) return;

    setSending(true);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error("No recording URI resolved");
      }

      if (recSeconds < 1) {
        Alert.alert("Too short", "Voice recording must be at least 1 second.");
        return;
      }

      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        name: `voice_${Date.now()}.m4a`,
        type: "audio/m4a"
      } as any);

      const uploadRes = await apiClient.post("/api/messages/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      await sendMessage({
        text: isRtl ? "رسالة صوتية" : "Voice Message",
        type: "voice",
        attachment_url: uploadRes.data.url,
        duration: recSeconds
      });
    } catch (e) {
      console.log("Failed to save voice memo:", e);
      Alert.alert("Voice Send Failed", "Could not upload or send voice note.");
    } finally {
      setSending(false);
    }
  };

  // Sticker triggers
  const sendSticker = (stickerId: number) => {
    const isPremium = stickerId > 100;
    if (isPremium && !user?.is_premium) {
      Alert.alert(
        isRtl ? "ملصق مميز" : "Premium Sticker",
        isRtl ? "يرجى الترقية إلى باقة ومضة الذهبية لاستخدام الملصقات المميزة!" : "Please upgrade to Wamdh Premium to use premium stickers!",
        [
          { text: "Cancel", style: "cancel" },
          { text: "View Plans", onPress: () => router.push("/(student)/premium") }
        ]
      );
      return;
    }

    sendMessage({
      text: stickerEmojis[stickerId],
      type: "sticker",
      sticker_id: String(stickerId)
    });
    setShowStickers(false);
  };

  // Group Management triggers
  const handleAddMember = async (targetId: string) => {
    setInviting(true);
    try {
      await apiClient.post(`/api/messages/groups/manage/`, {
        room_id: id,
        action: "add",
        user_id: targetId
      });
      Alert.alert("Success", "User added to group!");
      qc.invalidateQueries({ queryKey: ["room-messages", id] });
    } catch (e) {
      Alert.alert("Error", "Could not add user.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (targetId: string) => {
    Alert.alert(isRtl ? "إزالة عضو" : "Remove Member", isRtl ? "هل تريد إزالة هذا العضو من المجموعة؟" : "Do you want to remove this member?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.post(`/api/messages/groups/manage/`, {
              room_id: id,
              action: "remove",
              user_id: targetId
            });
            qc.invalidateQueries({ queryKey: ["room-messages", id] });
          } catch (e) {
            Alert.alert("Error", "Could not remove member.");
          }
        }
      }
    ]);
  };

  const handleToggleAdmin = async (targetId: string, isAdmin: boolean) => {
    try {
      await apiClient.post(`/api/messages/groups/manage/`, {
        room_id: id,
        action: isAdmin ? "demote" : "promote",
        user_id: targetId
      });
      qc.invalidateQueries({ queryKey: ["room-messages", id] });
    } catch (e) {
      Alert.alert("Error", "Could not update role.");
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
          <Text style={{ color: "#BE1A1A", fontFamily: "Inter_700Bold", fontSize: 11, marginBottom: 2, marginLeft: 44 }}>
            {item.sender_name}
          </Text>
        )}
        <View style={[styles.msgRow, { justifyContent: isMe ? "flex-end" : "flex-start", flexDirection: isRtl ? "row-reverse" : "row" }]}>
          {!isMe && (
            <View style={[styles.avatar, { backgroundColor: "#3B82F620" }]}>
              <Text style={{ color: "#3B82F6", fontFamily: "Inter_700Bold", fontSize: 12 }}>
                {(item.sender_name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          {item.type === "sticker" ? (
            <View style={[styles.stickerBubble, { alignSelf: isMe ? "flex-end" : "flex-start" }]}>
              <Text style={{ fontSize: 52 }}>{stickerEmojis[Number(item.sticker_id)]}</Text>
            </View>
          ) : (
            <View style={[
              styles.bubble,
              isMe
                ? { backgroundColor: "#BE1A1A", borderBottomRightRadius: 4 }
                : { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1, borderBottomLeftRadius: 4 },
            ]}>
              {item.type === "voice" && (
                <VoiceMessagePlayer
                  item={item}
                  isMe={isMe}
                  colors={colors}
                  textSecondary={textSecondary}
                  ACCENT={ACCENT}
                />
              )}

              {item.type === "document" && (
                <Pressable
                  onPress={() => item.attachment_url ? Linking.openURL(item.attachment_url) : Alert.alert("Error", "No link available")}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Ionicons name="document" size={24} color={isMe ? "#FFFFFF" : ACCENT} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isMe ? "#FFFFFF" : textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }} numberOfLines={1}>
                      {item.file_name || "Attachment"}
                    </Text>
                    <Text style={{ color: isMe ? "#FFFFFF90" : textSecondary, fontSize: 10 }}>Document file</Text>
                  </View>
                </Pressable>
              )}

              {item.type === "image" && (
                <View style={{ gap: 6 }}>
                  {item.attachment_url ? (
                    <Image
                      source={{ uri: item.attachment_url }}
                      style={{ width: 180, height: 180, borderRadius: 8, backgroundColor: "#F3F4F6" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: 180, height: 180, backgroundColor: "#00000010", borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="image" size={32} color={isMe ? "#FFFFFF60" : textSecondary} />
                    </View>
                  )}
                  <Text style={{ color: isMe ? "#FFFFFF" : textPrimary, fontFamily: "Inter_400Regular", fontSize: 13 }}>{item.text}</Text>
                </View>
              )}

              {item.type === "text" && (
                <Text style={{
                  color: isMe ? "#FFFFFF" : textPrimary,
                  fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20,
                }}>
                  {item.text}
                </Text>
              )}
            </View>
          )}
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
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={20} color={ACCENT} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12, alignItems: isRtl ? "flex-end" : "flex-start" }}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>
            {name || "Chat"}
          </Text>
          <View style={[styles.onlineRow, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <View style={styles.onlineDot} />
            <Text style={{ color: "#10B981", fontFamily: "Inter_400Regular", fontSize: 11, marginHorizontal: 4 }}>
              {isRtl ? "نشط الآن" : "Active now"}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => setShowGroupInfo(true)} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="information-circle-outline" size={20} color={textSecondary} />
        </Pressable>
      </View>

      {/* Messages list */}
      {isLoading && messages.length === 0 ? (
        <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 60 }} />
      ) : messages.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
          <View style={[styles.emptyIcon, { backgroundColor: "#BE1A1A" + "20" }]}>
            <Ionicons name="chatbubbles" size={40} color={ACCENT} />
          </View>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 16 }}>
            No messages yet
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 6, textAlign: "center" }}>
            Say hi! Start the conversation below.
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
          refreshing={isLoading}
          onRefresh={() => qc.invalidateQueries({ queryKey: ["room-messages", id] })}
        />
      )}

      {/* Sticky Stickers Sheet */}
      {showStickers && (
        <View style={[styles.stickersSheet, { backgroundColor: cardBg, borderTopColor: cardBorder }]}>
          <View style={styles.sheetHeader}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>
              {isRtl ? "ملصقات ومضة" : "Wamdh Stickers"}
            </Text>
            <Pressable onPress={() => setShowStickers(false)}>
              <Ionicons name="close" size={20} color={textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.stickersGrid}>
            {Array.from({ length: 200 }, (_, index) => {
              const id = index + 1;
              const isPremium = id > 100;
              return (
                <Pressable
                  key={id}
                  onPress={() => sendSticker(id)}
                  style={[
                    styles.stickerCell,
                    { backgroundColor: inputBg },
                    isPremium && !user?.is_premium && { opacity: 0.6 }
                  ]}
                >
                  <Text style={{ fontSize: 32 }}>{stickerEmojis[id]}</Text>
                  {isPremium && !user?.is_premium && (
                    <View style={styles.lockOverlay}>
                      <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Input Bar */}
      <View style={[styles.inputBar, { backgroundColor: cardBg, borderTopColor: cardBorder }]}>
        {isRecording ? (
          <View style={styles.recordingRow}>
            <View style={styles.recordDot} />
            <Text style={{ color: "#EF4444", fontFamily: "JetBrainsMono_400Regular", flex: 1, marginLeft: 8 }}>
              Recording voice memo... {recSeconds}s
            </Text>
            <Pressable onPress={() => setIsRecording(false)} style={[styles.recActionBtn, { backgroundColor: "#E5E7EB" }]}>
              <Ionicons name="close" size={18} color="#4B5563" />
            </Pressable>
            <Pressable onPress={stopAndSendVoice} style={[styles.recActionBtn, { backgroundColor: "#10B981" }]}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable onPress={handlePickDocument} style={[styles.attachBtn, { backgroundColor: inputBg }]}>
              <Ionicons name="document-attach-outline" size={20} color={ACCENT} />
            </Pressable>
            <Pressable onPress={handlePickImage} style={[styles.attachBtn, { backgroundColor: inputBg }]}>
              <Ionicons name="image-outline" size={20} color={ACCENT} />
            </Pressable>
            <Pressable onPress={() => setShowStickers(!showStickers)} style={[styles.attachBtn, { backgroundColor: showStickers ? ACCENT + "20" : inputBg }]}>
              <Ionicons name="happy-outline" size={20} color={showStickers ? ACCENT : ACCENT} />
            </Pressable>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message..."
              placeholderTextColor="#6B7280"
              multiline
              style={[styles.textInput, { backgroundColor: inputBg, color: textPrimary }]}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            {inputText.trim() ? (
              <Pressable
                onPress={() => sendMessage()}
                style={[styles.sendBtn, { backgroundColor: ACCENT }]}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </Pressable>
            ) : (
              <Pressable
                onPressIn={handleVoicePressIn}
                onPressOut={handleVoicePressOut}
                style={[styles.sendBtn, { backgroundColor: isRecording ? "#EF4444" : "#10B981" }]}
              >
                <Ionicons name="mic" size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* Group Info / Member Management Modal */}
      {showGroupInfo && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>
                {isGroup ? (isRtl ? "إدارة المجموعة الدراسة" : "Group Study Room Info") : (isRtl ? "تٝاصيل المحادثة" : "Chat Information")}
              </Text>
              <Pressable onPress={() => setShowGroupInfo(false)}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 12 }}>
                {isRtl ? "معرٝ الغرٝة:" : "Room ID:"} {id}
              </Text>

              {isGroup && room && (
                <View>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14, marginBottom: 10 }}>
                    {isRtl ? "الأعضاء الحاليون" : "Active Group Members"}
                  </Text>
                  
                  {/* Current Members List */}
                  <View style={{ gap: 8, marginBottom: 20 }}>
                    {(room.members || []).map((memberId: string) => {
                      const isOwner = room.owner_id === memberId;
                      const isAdmin = (room.admins || []).includes(memberId);
                      const isCurrentOwner = user?.id === room.owner_id;
                      
                      return (
                        <View key={memberId} style={[styles.memberRow, { backgroundColor: inputBg }]}>
                          <View style={styles.memberAvatar}>
                            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 11 }}>
                              {memberId.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                              User #{memberId}
                            </Text>
                            <Text style={{ color: textSecondary, fontSize: 10 }}>
                              {isOwner ? "Owner" : (isAdmin ? "Admin" : "Member")}
                            </Text>
                          </View>
                          
                          {/* Owner Management Buttons */}
                          {isCurrentOwner && user?.id !== memberId && (
                            <View style={{ flexDirection: "row", gap: 6 }}>
                              <Pressable onPress={() => handleToggleAdmin(memberId, isAdmin)} style={[styles.roleActionBtn, { backgroundColor: isAdmin ? "#F59E0B20" : "#BE1A1A20" }]}>
                                <Text style={{ color: isAdmin ? "#F59E0B" : "#BE1A1A", fontSize: 10, fontFamily: "Inter_700Bold" }}>
                                  {isAdmin ? "Demote" : "Promote"}
                                </Text>
                              </Pressable>
                              <Pressable onPress={() => handleRemoveMember(memberId)} style={[styles.roleActionBtn, { backgroundColor: "#EF444420" }]}>
                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              </Pressable>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Add Member block */}
                  {((room.admins || []).includes(user?.id) || room.owner_id === user?.id) && (
                    <View style={{ borderTopWidth: 1, borderTopColor: cardBorder, paddingTop: 14 }}>
                      <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14, marginBottom: 10 }}>
                        {isRtl ? "إضاٝة أعضاء جدد" : "Add Students & Instructors"}
                      </Text>
                      <TextInput
                        placeholder={isRtl ? "ابحث عن طالب أو م instructor..." : "Search student or instructor..."}
                        placeholderTextColor={textSecondary}
                        value={groupSearch}
                        onChangeText={setGroupSearch}
                        style={[styles.searchField, { backgroundColor: inputBg, color: textPrimary, borderColor: cardBorder }]}
                      />
                      
{/* QR Code Share */}
                      <Pressable 
                        onPress={async () => {
                          const deepLink = `wamdh://join/group/${id}`;
                          await Share.share({ message: isRtl ? `انضم إلى مجموعتي على ومضة:\n${deepLink}` : `Join my Wamdh group:\n${deepLink}`, title: "Share Group Invite" });
                        }}
                        style={[styles.qrShareBtn, { backgroundColor: ACCENT + "20", marginTop: 12 }]}>
                        <Ionicons name="share-outline" size={20} color={ACCENT} />
                        <Text style={{ color: ACCENT, marginLeft: 8, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                          {isRtl ? "مشاركة الدعوة" : "Share Invite"}
                        </Text>
                      </Pressable>
                      
                      <View style={{ gap: 8, marginTop: 10 }}>
                        {allUsers
                          .filter(u => u.username.toLowerCase().includes(groupSearch.toLowerCase()) && !(room.members || []).includes(u.id))
                          .slice(0, 5)
                          .map((u) => (
                            <View key={u.id} style={styles.inviteRow}>
                              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>{u.username} ({u.role})</Text>
                              <Pressable onPress={() => handleAddMember(u.id)} style={[styles.inviteBtn, { backgroundColor: ACCENT }]}>
                                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 11 }}>{isRtl ? "إضافة" : "Add"}</Text>
                              </Pressable>
                            </View>
                          ))
                        }
                      </View>
                    </View>
                  )}
                  
                  {/* Bulk Invite Block */}
                  {room && (room.admins || []).includes(user?.id) && (
                    <View style={{ borderTopWidth: 1, borderTopColor: cardBorder, paddingTop: 14, marginTop: 12 }}>
                      <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14, marginBottom: 10 }}>
                        {isRtl ? "دعوة جماعية" : "Bulk Invite"}
                      </Text>
                      <TextInput
                        placeholder={isRtl ? "أدخل معرفات المستخدمين (مثال: 1,2,3)" : "Enter user IDs (comma separated)"}
                        placeholderTextColor={textSecondary}
                        style={[styles.searchField, { backgroundColor: inputBg, color: textPrimary, borderColor: cardBorder }]}
                        onBlur={(e: any) => {
                          const ids = e.nativeEvent.text.split(",").map((s: string) => s.trim()).filter(Boolean);
                          if (ids.length > 0) {
                            apiClient.post(`/api/messages/groups/${id}/invite/`, { user_ids: ids });
                          }
                        }}
                      />
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  onlineRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#10B981" },
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 2 },
  avatar: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 8 },
  bubble: { maxWidth: "72%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  stickerBubble: { maxWidth: "72%", paddingHorizontal: 10, paddingVertical: 4 },
  timeLabel: { color: "#9CA3AF", fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 3, marginBottom: 6, paddingHorizontal: 16 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, gap: 8 },
  attachBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  textInput: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontFamily: "Inter_400Regular", fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stickersSheet: { height: 260, borderTopWidth: 1, padding: 14 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  stickersGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 20 },
  stickerCell: { width: 54, height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", position: "relative" },
  lockOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  recordingRow: { flexDirection: "row", alignItems: "center", flex: 1, paddingHorizontal: 8 },
  recordDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  recActionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  modalOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  memberRow: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 12, marginBottom: 4 },
  memberAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" },
  roleActionBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  qrShareBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  searchField: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  inviteRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  inviteBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }
});
