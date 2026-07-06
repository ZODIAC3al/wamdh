import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
  ActivityIndicator, Alert, Modal, FlatList, RefreshControl, Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";
import { useAuthStore } from "../../../store/authStore";

interface Community {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  owner_id: string;
  admins: string[];
  members: string[];
  created_at: string;
  member_count?: number;
  pending_requests?: string[];
  tags?: string[];
  type?: string;
}

interface Mission {
  id: string;
  title: string;
  desc: string;
  xp: number;
  completed: boolean;
  progress?: number;
  target?: number;
}

export default function CommunityScreen() {
  const router = useRouter();
  const { colors, isRtl, t } = useWamdh();
  const { user } = useAuthStore();
  const ACCENT = colors.accent;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"public" | "my" | "invites" | "missions">("public");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", is_public: true, tags: "" });

  const { data: publicCommunities, isLoading: loadingPublic, refetch: refetchPublic } = useQuery<Community[]>({
    queryKey: ["public-communities"],
    queryFn: async () => (await apiClient.get("/api/messages/communities/")).data || [],
  });

  const { data: myCommunities, isLoading: loadingMy, refetch: refetchMy } = useQuery<Community[]>({
    queryKey: ["my-communities"],
    queryFn: async () => {
      const res = await apiClient.get("/api/messages/communities/");
      const list = res.data || [];
      const user_str_id = user?.id ? str(user.id) : "";
      // Filter communities where user is a member
      return list.filter((c: Community) => 
        c.members?.includes(user_str_id) || 
        c.members?.includes(String(user?.id)) ||
        c.owner_id === user_str_id ||
        c.owner_id === String(user?.id)
      );
    },
  });

  const { data: pendingInvites, isLoading: loadingInvites, refetch: refetchInvites } = useQuery({
    queryKey: ["community-invites"],
    queryFn: async () => (await apiClient.get("/api/messages/communities/invites/pending/")).data || [],
  });

  const { data: missions, isLoading: loadingMissions } = useQuery<Mission[]>({
    queryKey: ["community-missions"],
    queryFn: async () => (await apiClient.get("/api/analytics/community-missions/")).data || [],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newGroup) => apiClient.post("/api/messages/communities/", {
      ...data,
      tags: data.tags.split(",").map(t => t.trim()).filter(t => t)
    }),
    onSuccess: () => {
      setShowCreate(false);
      setNewGroup({ name: "", description: "", is_public: true, tags: "" });
      queryClient.invalidateQueries({ queryKey: ["public-communities"] });
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
      queryClient.invalidateQueries({ queryKey: ["community-missions"] });
      Alert.alert("Success", isRtl ? "تم إنشاء المجتمع بنجاح!" : "Community created successfully!");
    },
  });

  const joinMutation = useMutation({
    mutationFn: (communityId: string) => apiClient.post(`/api/messages/communities/${communityId}/join/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
      queryClient.invalidateQueries({ queryKey: ["public-communities"] });
      queryClient.invalidateQueries({ queryKey: ["community-missions"] });
      Alert.alert("Joined", isRtl ? "تم الانضمام إلى المجتمع!" : "Joined community successfully!");
    },
  });

  const str = (val: any) => String(val);

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  // Collect all unique tags for filtering
  const allTags = Array.from(
    new Set(
      (publicCommunities || []).flatMap(c => c.tags || [])
    )
  );

  const renderCommunity = ({ item }: { item: Community }) => {
    const user_str_id = user?.id ? str(user.id) : "";
    const isMember = item.members?.includes(user_str_id) || 
                     item.members?.includes(String(user?.id)) ||
                     item.owner_id === user_str_id ||
                     item.owner_id === String(user?.id);

    return (
      <Pressable
        onPress={() => router.push({ pathname: "/(student)/community/[id]", params: { id: item.id } })}
        style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
      >
        <View style={[styles.avatar, { backgroundColor: item.is_public ? "#10B98115" : "#3B82F615" }]}>
          <Ionicons name={item.is_public ? "globe" : "lock-closed"} size={22} color={item.is_public ? "#10B981" : "#3B82F6"} />
        </View>
        <View style={{ flex: 1, marginLeft: 12, marginRight: 8, alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, width: "100%" }}>
            <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 15, flex: 1, textAlign: "left" }} numberOfLines={1}>
              {item.name}
            </Text>
            {isMember && (
              <View style={[styles.memberBadge, { backgroundColor: "#10B98115" }]}>
                <Text style={{ color: "#10B981", fontSize: 9, fontFamily: "Inter_700Bold" }}>Joined</Text>
              </View>
            )}
          </View>
          <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2, textAlign: "left" }} numberOfLines={2}>
            {item.description || (item.is_public
              ? (isRtl ? "مجتمع عام مفتوح للدراسة والمناقشة" : "Open public study community")
              : (isRtl ? "مجتمع دراسي خاص" : "Private study community"))}
          </Text>
          {item.tags && item.tags.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {item.tags.slice(0, 3).map(tag => (
                <View key={tag} style={[styles.tag, { backgroundColor: ACCENT + "12" }]}>
                  <Text style={{ color: ACCENT, fontSize: 10, fontFamily: "Inter_500Medium" }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 }}>
            <Text style={{ color: textSecondary, fontSize: 11, fontFamily: "Inter_500Medium" }}>
              👥 {item.member_count || item.members?.length || 0} {isRtl ? "عضو" : "members"}
            </Text>
            {!isMember && item.is_public && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  joinMutation.mutate(item.id);
                }}
                style={[styles.joinBtn, { backgroundColor: ACCENT }]}
              >
                <Text style={{ color: "#FFF", fontSize: 10, fontFamily: "Inter_700Bold" }}>
                  {isRtl ? "انضمام" : "Join"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
        <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color={textSecondary} />
      </Pressable>
    );
  };

  const renderMission = ({ item }: { item: Mission }) => (
    <View style={[styles.missionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <View style={[styles.missionIcon, { backgroundColor: item.completed ? "#10B98115" : ACCENT + "15" }]}>
          <Ionicons name={item.completed ? "checkmark-circle" : "star"} size={20} color={item.completed ? "#10B981" : ACCENT} />
        </View>
        <View style={{ flex: 1, marginLeft: 12, alignItems: "flex-start" }}>
          <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }}>
            {item.title}
          </Text>
          <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={2}>
            {item.desc}
          </Text>
        </View>
      </View>
      {!item.completed && item.progress !== undefined && item.target && (
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(item.progress / item.target) * 100}%`, backgroundColor: ACCENT }]} />
          </View>
          <Text style={{ color: textSecondary, fontSize: 10, marginLeft: 8, fontFamily: "Inter_700Bold" }}>
            {item.progress}/{item.target}
          </Text>
        </View>
      )}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 4 }}>
        <View style={[styles.xpRewardPill, { backgroundColor: "#F59E0B15" }]}>
          <Text style={{ color: "#F59E0B", fontFamily: "Inter_700Bold", fontSize: 10 }}>
            +{item.xp} XP
          </Text>
        </View>
      </View>
    </View>
  );

  const renderInvite = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push({ pathname: "/(student)/community/[id]", params: { id: item.community?.id || item.community_id } })}
      style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
    >
      <View style={[styles.avatar, { backgroundColor: "#F59E0B15" }]}>
        <Ionicons name="mail-open" size={22} color="#F59E0B" />
      </View>
      <View style={{ flex: 1, marginLeft: 12, alignItems: "flex-start" }}>
        <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 15 }}>
          {isRtl ? "دعوة من" : "Invite from"} {item.inviter?.username || "Peer"}
        </Text>
        <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
          Group: {item.community?.name || "Community"}
        </Text>
      </View>
      <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color={textSecondary} />
    </Pressable>
  );

  const tabs: Array<{ key: "public" | "my" | "invites" | "missions"; label: string; icon: string }> = [
    { key: "public", label: isRtl ? "الكل" : "Explore", icon: "globe-outline" },
    { key: "my", label: isRtl ? "مجتمعاتي" : "My Groups", icon: "people-outline" },
    { key: "missions", label: isRtl ? "المهام" : "Missions", icon: "trophy-outline" },
    { key: "invites", label: isRtl ? "الدعوات" : "Invites", icon: "mail-outline" },
  ];

  const filteredCommunities = (
    activeTab === "public" ? publicCommunities || [] : myCommunities || []
  ).filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag ? c.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={20} color={ACCENT} />
        </Pressable>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20, flex: 1, textAlign: "center" }}>
          {isRtl ? "المجتمع الدراسي" : "Study Community"}
        </Text>
        <Pressable onPress={() => setShowCreate(true)} style={[styles.iconBtn, { backgroundColor: ACCENT }]}>
          <Ionicons name="add" size={20} color="#FFF" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => { setActiveTab(tab.key); setSelectedTag(null); }}
              style={[styles.tabBtn, active && { borderBottomColor: ACCENT }]}
            >
              <Ionicons name={tab.icon as any} size={18} color={active ? ACCENT : textSecondary} />
              <Text style={{ color: active ? ACCENT : textSecondary, fontFamily: "Inter_700Bold", fontSize: 12, marginLeft: 6 }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Search and Tags */}
      {(activeTab === "public" || activeTab === "my") && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor: cardBorder }]}>
            <Ionicons name="search" size={18} color={textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={isRtl ? "ابحث عن مجتمع دراسي..." : "Search study groups..."}
              placeholderTextColor={textSecondary}
              style={{ flex: 1, marginLeft: 8, color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 13 }}
            />
          </View>

          {/* Tags list */}
          {allTags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: "row", gap: 6, paddingVertical: 4 }}>
                <Pressable
                  onPress={() => setSelectedTag(null)}
                  style={[styles.tagPill, { backgroundColor: selectedTag === null ? ACCENT : cardBg, borderColor: cardBorder }]}
                >
                  <Text style={{ fontSize: 10, color: selectedTag === null ? "#FFF" : textSecondary, fontFamily: "Inter_700Bold" }}>
                    All
                  </Text>
                </Pressable>
                {allTags.map(tag => (
                  <Pressable
                    key={tag}
                    onPress={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    style={[styles.tagPill, { backgroundColor: selectedTag === tag ? ACCENT : cardBg, borderColor: cardBorder }]}
                  >
                    <Text style={{ fontSize: 10, color: selectedTag === tag ? "#FFF" : textSecondary, fontFamily: "Inter_700Bold" }}>
                      #{tag}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* Content */}
      {activeTab === "missions" ? (
        <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={loadingMissions} onRefresh={refetchMy} />} contentContainerStyle={{ padding: 20 }}>
          {loadingMissions ? (
            <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
          ) : (missions && missions.length > 0) ? (
            <FlatList
              data={missions}
              keyExtractor={(item) => item.id}
              renderItem={renderMission}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 12 }}
            />
          ) : (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Ionicons name="trophy-outline" size={64} color={textSecondary} />
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 12 }}>
                {isRtl ? "لا توجد مهام حالياً" : "No active missions"}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={
            activeTab === "invites"
              ? pendingInvites || []
              : filteredCommunities
          }
          keyExtractor={(item: any) => item.id || item._id}
          refreshControl={<RefreshControl refreshing={loadingPublic || loadingMy || loadingInvites} onRefresh={() => {
            refetchPublic();
            refetchMy();
            refetchInvites();
          }} />}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <Ionicons name="people-outline" size={64} color={textSecondary} />
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 12 }}>
                {activeTab === "public"
                  ? isRtl ? "لا توجد مجتمعات عامة" : "No public communities found"
                  : activeTab === "my"
                    ? isRtl ? "لم تنضم لأي مجموعة بعد" : "No study groups joined yet"
                    : isRtl ? "لا توجد دعوات واردة" : "No pending invites"}
              </Text>
            </View>
          }
          renderItem={activeTab === "invites" ? renderInvite : renderCommunity}
        />
      )}

      {/* Create Community Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginBottom: 16, textAlign: "left" }}>
              {isRtl ? "إنشاء مجتمع جديد" : "Create New Community"}
            </Text>
            
            <TextInput
              placeholder={isRtl ? "اسم المجتمع" : "Community name"}
              placeholderTextColor={textSecondary}
              value={newGroup.name}
              onChangeText={v => setNewGroup({ ...newGroup, name: v })}
              style={[styles.input, { backgroundColor: inputBg, color: textPrimary, marginBottom: 12 }]}
            />
            <TextInput
              placeholder={isRtl ? "الوصف" : "Description"}
              placeholderTextColor={textSecondary}
              value={newGroup.description}
              onChangeText={v => setNewGroup({ ...newGroup, description: v })}
              multiline
              style={[styles.input, { backgroundColor: inputBg, color: textPrimary, marginBottom: 12, height: 80, textAlignVertical: "top" }]}
            />
            <TextInput
              placeholder={isRtl ? "الفئات (مثل: برمجة, رياضيات)" : "Tags (comma separated, e.g. python, calculus)"}
              placeholderTextColor={textSecondary}
              value={newGroup.tags}
              onChangeText={v => setNewGroup({ ...newGroup, tags: v })}
              style={[styles.input, { backgroundColor: inputBg, color: textPrimary, marginBottom: 16 }]}
            />
            
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              <Pressable 
                onPress={() => setNewGroup({ ...newGroup, is_public: !newGroup.is_public })} 
                style={[styles.toggle, { backgroundColor: newGroup.is_public ? ACCENT : "#6B7280" }]}
              >
                <View style={[styles.thumb, { marginLeft: newGroup.is_public ? 18 : 2 }]} />
              </Pressable>
              <Text style={{ color: textPrimary, marginLeft: 8, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                {isRtl ? "عام (يمكن للجميع البحث والانضمام)" : "Public (visible to everyone)"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable onPress={() => setShowCreate(false)} style={[styles.btn, { flex: 1, backgroundColor: inputBg }]}>
                <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold" }}>{isRtl ? "إلغاء" : "Cancel"}</Text>
              </Pressable>
              <Pressable 
                onPress={() => createMutation.mutate(newGroup)} 
                disabled={!newGroup.name.trim() || createMutation.isPending} 
                style={[styles.btn, { flex: 1, backgroundColor: ACCENT }]}
              >
                {createMutation.isPending ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: "#FFF", fontFamily: "Inter_700Bold" }}>{isRtl ? "إنشاء" : "Create"}</Text>}
              </Pressable>
            </View>
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
  tabsRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 20, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  tabBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: "transparent" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  tagPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 6 },
  card: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  memberBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  joinBtn: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 8 },
  missionCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  missionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  progressRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  progressBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "#E5E7EB", overflow: "hidden" },
  progressBarFill: { height: 6, borderRadius: 3 },
  xpRewardPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", borderRadius: 24, padding: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  input: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 13, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
  toggle: { width: 38, height: 20, borderRadius: 10, justifyContent: "center" },
  thumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#FFF" },
  btn: { paddingVertical: 12, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});