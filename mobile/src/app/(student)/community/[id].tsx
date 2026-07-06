import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator,
  FlatList, RefreshControl, Modal, Alert
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";
import { useAuthStore } from "../../../store/authStore";

interface CommunityPost {
  id: string;
  author_name: string;
  text: string;
  likes_count: number;
  liked_by: string[];
  created_at: string;
}

interface SharedResource {
  id: string;
  title: string;
  subject: string;
  shared_by_name: string;
  created_at: string;
  note_id: string;
}

export default function CommunityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isRtl } = useWamdh();
  const { user } = useAuthStore();
  const ACCENT = colors.accent;
  const queryClient = useQueryClient();

  const [detailTab, setDetailTab] = useState<"feed" | "resources" | "chat" | "rankings">("feed");
  const [newPostText, setNewPostText] = useState("");
  const [newMsgText, setNewMsgText] = useState("");
  const [showShareNoteModal, setShowShareNoteModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const { data: community, isLoading } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => (await apiClient.get(`/api/messages/communities/${id}/`)).data,
    enabled: !!id,
  });

  const { data: posts, refetch: refetchPosts } = useQuery<CommunityPost[]>({
    queryKey: ["community-posts", id],
    queryFn: async () => (await apiClient.get(`/api/messages/communities/${id}/posts/`)).data || [],
    enabled: !!id && detailTab === "feed",
  });

  const { data: resources, refetch: refetchResources } = useQuery<SharedResource[]>({
    queryKey: ["community-resources", id],
    queryFn: async () => (await apiClient.get(`/api/messages/communities/${id}/resources/`)).data || [],
    enabled: !!id && detailTab === "resources",
  });

  const { data: notes } = useQuery({
    queryKey: ["user-notes-share"],
    queryFn: async () => (await apiClient.get("/api/notes/")).data || [],
    enabled: showShareNoteModal,
  });

  const { data: room } = useQuery({
    queryKey: ["community-room", id],
    queryFn: async () => {
      const res = await apiClient.get("/api/messages/rooms/");
      const rooms = res.data || [];
      return rooms.find((r: any) => r.community_id === id);
    },
    enabled: !!id,
  });

  const { data: messages, refetch: refetchMessages, isLoading: loadingMessages } = useQuery({
    queryKey: ["room-messages", room?.id],
    queryFn: async () => (await apiClient.get(`/api/messages/rooms/${room.id}/`)).data || [],
    enabled: !!room?.id && detailTab === "chat",
    refetchInterval: 3000,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["community-leaderboard", id],
    queryFn: async () => (await apiClient.get(`/api/analytics/communities/${id}/leaderboard/`)).data,
    enabled: !!id && detailTab === "rankings",
  });

  const { data: challenges } = useQuery({
    queryKey: ["community-challenges", id],
    queryFn: async () => (await apiClient.get(`/api/analytics/communities/${id}/challenges/`)).data,
    enabled: !!id,
  });

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiClient.post(`/api/messages/communities/${id}/posts/`, { text });
    },
    onSuccess: () => {
      setNewPostText("");
      refetchPosts();
      queryClient.invalidateQueries({ queryKey: ["community-missions"] });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiClient.post(`/api/messages/posts/${postId}/like/`);
    },
    onSuccess: () => {
      refetchPosts();
    },
  });

  const shareNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return apiClient.post(`/api/messages/communities/${id}/resources/`, { note_id: noteId });
    },
    onSuccess: () => {
      setShowShareNoteModal(false);
      refetchResources();
      queryClient.invalidateQueries({ queryKey: ["community-missions"] });
      Alert.alert("Success", isRtl ? "تم مشاركة النوتة بنجاح!" : "Note shared successfully!");
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiClient.post(`/api/messages/rooms/${room.id}/`, { text });
    },
    onSuccess: () => {
      setNewMsgText("");
      refetchMessages();
    },
  });

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  const user_str_id = user?.id ? String(user.id) : "";

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={20} color={ACCENT} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "flex-start", marginLeft: 8 }}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }} numberOfLines={1}>
            {community?.name || "Community"}
          </Text>
          <Text style={{ color: textSecondary, fontSize: 11 }}>
            {community?.is_public ? (isRtl ? "مجتمع عام" : "Public Group") : (isRtl ? "مجتمع خاص" : "Private Group")}
          </Text>
        </View>
        <Pressable onPress={() => setShowMembers(true)} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="people-outline" size={18} color={textPrimary} />
        </Pressable>
      </View>

      {/* Sub-tabs bar */}
      <View style={[styles.tabsRow, { borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => setDetailTab("feed")} style={[styles.tabBtn, detailTab === "feed" && { borderBottomColor: ACCENT }]}>
          <Text style={{ color: detailTab === "feed" ? ACCENT : textSecondary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
            {isRtl ? "المناقشات" : "Feed"}
          </Text>
        </Pressable>
        <Pressable onPress={() => setDetailTab("resources")} style={[styles.tabBtn, detailTab === "resources" && { borderBottomColor: ACCENT }]}>
          <Text style={{ color: detailTab === "resources" ? ACCENT : textSecondary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
            {isRtl ? "الملفات" : "Files"}
          </Text>
        </Pressable>
        <Pressable onPress={() => setDetailTab("chat")} style={[styles.tabBtn, detailTab === "chat" && { borderBottomColor: ACCENT }]}>
          <Text style={{ color: detailTab === "chat" ? ACCENT : textSecondary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
            {isRtl ? "الدردشة" : "Chat"}
          </Text>
        </Pressable>
        <Pressable onPress={() => setDetailTab("rankings")} style={[styles.tabBtn, detailTab === "rankings" && { borderBottomColor: ACCENT }]}>
          <Text style={{ color: detailTab === "rankings" ? ACCENT : textSecondary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
            {isRtl ? "الترتيب" : "Rankings"}
          </Text>
        </Pressable>
      </View>

      {/* Main Tab Views */}
      <View style={{ flex: 1 }}>
        {detailTab === "feed" && (
          <FlatList
            data={posts}
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={false} onRefresh={refetchPosts} />}
            contentContainerStyle={{ padding: 20 }}
            ListHeaderComponent={
              <View style={[styles.createPostCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <TextInput
                  placeholder={isRtl ? "اكتب منشوراً في مجتمعك..." : "Share something with the community..."}
                  placeholderTextColor={textSecondary}
                  value={newPostText}
                  onChangeText={setNewPostText}
                  multiline
                  style={[styles.postInput, { color: textPrimary, backgroundColor: inputBg }]}
                />
                <Pressable
                  onPress={() => {
                    if (newPostText.trim()) createPostMutation.mutate(newPostText);
                  }}
                  disabled={createPostMutation.isPending}
                  style={[styles.submitPostBtn, { backgroundColor: ACCENT }]}
                >
                  {createPostMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={{ color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 12 }}>
                      {isRtl ? "نشر" : "Post"}
                    </Text>
                  )}
                </Pressable>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", marginTop: 40 }}>
                <Ionicons name="chatbubbles-outline" size={48} color={textSecondary} />
                <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 12 }}>
                  {isRtl ? "كن أول من ينشر في هذا المجتمع!" : "Be the first to post in this community!"}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isLiked = item.liked_by?.includes(user_str_id) || item.liked_by?.includes(String(user?.id));
              return (
                <View style={[styles.postCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <View style={[styles.avatarMini, { backgroundColor: ACCENT + "20" }]}>
                      <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 12 }}>
                        {item.author_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, marginLeft: 8 }}>
                      {item.author_name}
                    </Text>
                  </View>
                  <Text style={{ color: textPrimary, fontSize: 13, lineHeight: 20, textAlign: "left" }}>
                    {item.text}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 16 }}>
                    <Pressable
                      onPress={() => likePostMutation.mutate(item.id)}
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons name={isLiked ? "heart" : "heart-outline"} size={18} color={isLiked ? "#EF4444" : textSecondary} />
                      <Text style={{ color: textSecondary, fontSize: 12, marginLeft: 4 }}>
                        {item.likes_count || 0}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
        )}

        {detailTab === "resources" && (
          <FlatList
            data={resources}
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={false} onRefresh={refetchResources} />}
            contentContainerStyle={{ padding: 20 }}
            ListHeaderComponent={
              <Pressable
                onPress={() => setShowShareNoteModal(true)}
                style={[styles.shareCardBtn, { borderColor: ACCENT, backgroundColor: ACCENT + "08" }]}
              >
                <Ionicons name="document-text-outline" size={20} color={ACCENT} />
                <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 13, marginLeft: 8 }}>
                  {isRtl ? "مشاركة نوتة مع المجموعة" : "Share a Note with Group"}
                </Text>
              </Pressable>
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", marginTop: 40 }}>
                <Ionicons name="folder-open-outline" size={48} color={textSecondary} />
                <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 12 }}>
                  {isRtl ? "لم يتم مشاركة أي ملفات بعد" : "No shared notes or resources yet"}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.resourceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.resourceIcon, { backgroundColor: "#8B5CF615" }]}>
                  <Ionicons name="document-text" size={24} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1, marginLeft: 12, alignItems: "flex-start" }}>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                    {item.title}
                  </Text>
                  <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>
                    {isRtl ? "بواسطة" : "Shared by"}: {item.shared_by_name}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push({ pathname: "/(student)/notes/[id]", params: { id: item.note_id } })}
                  style={[styles.viewResourceBtn, { backgroundColor: inputBg }]}
                >
                  <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                    {isRtl ? "عرض" : "View"}
                  </Text>
                </Pressable>
              </View>
            )}
          />
        )}

        {detailTab === "chat" && (
          <View style={{ flex: 1 }}>
            {loadingMessages ? (
              <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={messages}
                keyExtractor={(item: any) => item.id || item._id}
                contentContainerStyle={{ padding: 20, gap: 12 }}
                inverted={false}
                renderItem={({ item }: any) => {
                  const selfMsg = item.sender_id === user_str_id || item.sender_id === String(user?.id);
                  return (
                    <View style={[
                      styles.chatMsgBubble,
                      selfMsg ? { alignSelf: "flex-end", backgroundColor: ACCENT } : { alignSelf: "flex-start", backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }
                    ]}>
                      {!selfMsg && (
                        <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 10, marginBottom: 2 }}>
                          {item.sender_name}
                        </Text>
                      )}
                      <Text style={{ color: selfMsg ? "#FFF" : textPrimary, fontSize: 13 }}>
                        {item.text}
                      </Text>
                    </View>
                  );
                }}
              />
            )}
            <View style={[styles.chatInputRow, { backgroundColor: cardBg, borderTopColor: cardBorder }]}>
              <TextInput
                value={newMsgText}
                onChangeText={setNewMsgText}
                placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."}
                placeholderTextColor={textSecondary}
                style={[styles.chatInput, { color: textPrimary, backgroundColor: inputBg }]}
              />
              <Pressable
                onPress={() => {
                  if (newMsgText.trim()) sendMessageMutation.mutate(newMsgText);
                }}
                style={[styles.chatSendBtn, { backgroundColor: ACCENT }]}
              >
                <Ionicons name="send" size={16} color="#FFF" />
              </Pressable>
            </View>
          </View>
        )}

        {detailTab === "rankings" && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Weekly Challenges */}
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 12, textAlign: "left" }}>
              🎯 {isRtl ? "تحديات المجموعة" : "Group Challenges"}
            </Text>
            {challenges && challenges.length > 0 ? (
              challenges.map((c: any) => (
                <View key={c.id} style={[styles.challengeCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name={c.completed ? "checkmark-circle" : "ellipse-outline"} size={18} color={c.completed ? "#10B981" : ACCENT} />
                    <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, flex: 1 }}>
                      {c.title}
                    </Text>
                    <Text style={{ color: "#F59E0B", fontFamily: "Inter_700Bold", fontSize: 13 }}>
                      +{c.xp} XP
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.challengeCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                  {isRtl ? "لا تحديات دراسية معلنة" : "No active group study challenges"}
                </Text>
              </View>
            )}

            {/* Leaderboard list */}
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15, marginTop: 24, marginBottom: 12, textAlign: "left" }}>
              🏆 {isRtl ? "ترتيب الأعضاء" : "Member Standings"}
            </Text>
            {leaderboard && leaderboard.length > 0 ? (
              leaderboard.map((entry: any, index: number) => (
                <View key={entry.user_id} style={[styles.leaderRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={{ color: textSecondary, fontSize: 13, width: 24 }}>{index + 1}.</Text>
                  <View style={[styles.avatarMini, { backgroundColor: ACCENT + "20" }]}>
                    <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold" }}>{entry.username?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={{ color: textPrimary, flex: 1, fontFamily: "Inter_700Bold", marginLeft: 8 }}>
                    {entry.username || "Member"}
                  </Text>
                  <Text style={{ color: "#F59E0B", fontFamily: "Inter_700Bold", fontSize: 13 }}>{entry.xp} XP</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: textSecondary, fontSize: 12 }}>
                {isRtl ? "لا يوجد ترتيب بعد" : "No standings recorded yet"}
              </Text>
            )}
          </ScrollView>
        )}
      </View>

      {/* Share Note Selection Modal */}
      <Modal visible={showShareNoteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: bg }]}>
            <View style={styles.modalHeader}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>
                {isRtl ? "اختر نوتة للمشاركة" : "Select Note to Share"}
              </Text>
              <Pressable onPress={() => setShowShareNoteModal(false)}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </Pressable>
            </View>
            <FlatList
              data={notes}
              keyExtractor={item => item.id}
              style={{ maxHeight: 350 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => shareNoteMutation.mutate(item.id)}
                  style={[styles.noteSelectRow, { borderBottomColor: cardBorder }]}
                >
                  <Ionicons name="document-text" size={20} color={ACCENT} />
                  <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", marginLeft: 12 }}>
                    {item.title}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Members Modal */}
      <Modal visible={showMembers} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: bg }]}>
            <View style={styles.modalHeader}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>
                {isRtl ? "أعضاء المجموعة" : "Group Members"} ({(community?.members || []).length})
              </Text>
              <Pressable onPress={() => setShowMembers(false)}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </Pressable>
            </View>
            <FlatList
              data={community?.members || []}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <View style={[styles.memberRow, { backgroundColor: cardBg }]}>
                  <View style={[styles.avatarMini, { backgroundColor: ACCENT + "15" }]}>
                    <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold" }}>M</Text>
                  </View>
                  <Text style={{ color: textPrimary, flex: 1, fontFamily: "Inter_700Bold", marginLeft: 12, textAlign: "left" }}>
                    {community?.admins?.includes(item) ? "👑 " : ""}Member #{item.slice(-6)}
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tabsRow: { flexDirection: "row", justifyContent: "space-around", borderBottomWidth: 1 },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: "transparent" },
  createPostCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  postInput: { height: 70, borderRadius: 10, padding: 10, textAlignVertical: "top", fontSize: 13, fontFamily: "Inter_500Medium" },
  submitPostBtn: { alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, marginTop: 10 },
  postCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  avatarMini: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  shareCardBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", marginBottom: 16
  },
  resourceCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  resourceIcon: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  viewResourceBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  chatMsgBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, maxWidth: "75%", marginBottom: 8 },
  chatInputRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, alignItems: "center", gap: 10 },
  chatInput: { flex: 1, height: 40, borderRadius: 20, paddingHorizontal: 14, fontFamily: "Inter_500Medium", fontSize: 13 },
  chatSendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  challengeCard: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 8 },
  leaderRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  memberRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 8 },
  noteSelectRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }
});