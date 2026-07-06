import React, { useState } from "react";
import {
  View, Text, FlatList, Pressable, ActivityIndicator,
  TextInput, Modal, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A";
const ACCENT = "#F7D87F";

function RoomItem({ room, dark }: { room: any; dark: boolean }) {
  const router = useRouter();
  const { colors } = useWamdh();
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const name = room.type === "dm"
    ? `Student • ${room.other_username || "User"}`
    : room.name || "Study Group";
  const lastMsg = room.last_message?.text || "No messages yet";
  const lastTime = room.last_message?.created_at
    ? new Date(room.last_message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/(instructor)/messages/[id]", params: { id: room.id, name } })}
      style={[styles.roomItem, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}
    >
      <View style={[styles.roomAvatar, { backgroundColor: room.type === "dm" ? "#3B82F620" : PRIMARY + "20" }]}>
        <Ionicons name={room.type === "dm" ? "person" : "people"} size={22} color={room.type === "dm" ? "#3B82F6" : PRIMARY} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }}>{name}</Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>{lastTime}</Text>
        </View>
        <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {lastMsg}
        </Text>
      </View>
      {room.unread > 0 && (
        <View style={[styles.badge, { backgroundColor: "#BE1A1A" }]}>
          <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 10 }}>{room.unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function MessagesIndex() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const qc = useQueryClient();

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const [showNewDM, setShowNewDM] = useState(false);
  const [search, setSearch] = useState("");
  const [starting, setStarting] = useState(false);

  const { data: rooms, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["message-rooms-instructor"],
    queryFn: async () => (await apiClient.get("/api/messages/rooms/")).data,
    refetchInterval: 3000,
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["message-users-instructor"],
    queryFn: async () => (await apiClient.get("/api/messages/users/")).data,
    enabled: showNewDM,
  });

  const filteredUsers = (users || []).filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const startDM = async (userId: number) => {
    setStarting(true);
    try {
      const res = await apiClient.post("/api/messages/dm/start/", { user_id: userId });
      setShowNewDM(false);
      qc.invalidateQueries({ queryKey: ["message-rooms-instructor"] });
      router.push({ pathname: "/(instructor)/messages/[id]", params: { id: res.data.id, name: "DM" } });
    } catch (e) { console.error(e); }
    finally { setStarting(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="arrow-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginLeft: 12 }}>Inbox Messages</Text>
        <Pressable
          onPress={() => setShowNewDM(true)}
          style={[styles.newDMBtn, { backgroundColor: PRIMARY }]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={r => r.id}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 80 }}>
              <View style={[styles.emptyIcon, { backgroundColor: PRIMARY + "20" }]}>
                <Ionicons name="chatbubbles-outline" size={40} color={PRIMARY} />
              </View>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 16 }}>
                No active conversations
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 6 }}>
                Initiate a conversation with your students
              </Text>
              <Pressable onPress={() => setShowNewDM(true)}
                style={[styles.startBtn, { backgroundColor: PRIMARY, marginTop: 20 }]}>
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 13 }}>Search Students</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => <RoomItem room={item} dark={dark} />}
        />
      )}

      {/* New DM Modal */}
      <Modal animationType="slide" transparent visible={showNewDM} onRequestClose={() => setShowNewDM(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: cardBg }]}>
            <View style={[styles.handle, { backgroundColor: dark ? "#374151" : "#D1D5DB" }]} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>Search Users</Text>
              <Pressable onPress={() => setShowNewDM(false)} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
                <Ionicons name="close" size={18} color={textSecondary} />
              </Pressable>
            </View>
            <View style={[styles.searchRow, { backgroundColor: inputBg }]}>
              <Ionicons name="search-outline" size={18} color={textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                value={search} onChangeText={setSearch}
                placeholder="Search by username or email..." placeholderTextColor="#6B7280"
                style={{ flex: 1, color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14 }}
              />
            </View>
            <FlatList
              data={filteredUsers}
              keyExtractor={u => String(u.id)}
              style={{ marginTop: 12 }}
              renderItem={({ item }) => (
                <Pressable onPress={() => startDM(item.id)} style={[styles.userRow, { borderBottomColor: dark ? "#252540" : "#F3F4F6" }]}>
                  <View style={[styles.userAvatarCircle, { backgroundColor: "#3B82F620" }]}>
                    <Text style={{ color: "#3B82F6", fontFamily: "Sora_700Bold", fontSize: 15 }}>
                      {item.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>{item.username}</Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11 }}>{item.role.toUpperCase()}</Text>
                  </View>
                  <Ionicons name="chatbubble-outline" size={18} color={PRIMARY} />
                </Pressable>
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
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  newDMBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginLeft: "auto",
  },
  roomItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  roomAvatar: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badge: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  startBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "75%", minHeight: "50%" },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  searchRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 12 },
  userRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  userAvatarCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" }
});
