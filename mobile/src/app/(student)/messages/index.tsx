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

function RoomItem({ room, dark }: { room: any; dark: boolean }) {
  const { colors } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;
  const router = useRouter();
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const name = room.type === "dm"
    ? `DM • ${room.other_username || "User"}`
    : room.name || "Study Group";
  const lastMsg = room.last_message?.text || "No messages yet";
  const lastTime = room.last_message?.created_at
    ? new Date(room.last_message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/(student)/messages/[id]", params: { id: room.id, name } })}
      style={[styles.roomItem, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}
    >
      <View style={[styles.roomAvatar, { backgroundColor: room.type === "dm" ? "#3B82F620" : ACCENT + "20" }]}>
        <Ionicons name={room.type === "dm" ? "person" : "people"} size={22} color={room.type === "dm" ? "#3B82F6" : ACCENT} />
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
        <View style={[styles.badge, { backgroundColor: ACCENT }]}>
          <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 10 }}>{room.unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function MessagesIndex() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;
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
    queryKey: ["message-rooms"],
    queryFn: async () => (await apiClient.get("/api/messages/rooms/")).data,
    refetchInterval: 3000,
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["message-users"],
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
      qc.invalidateQueries({ queryKey: ["message-rooms"] });
      router.push({ pathname: "/(student)/messages/[id]", params: { id: res.data.id, name: "DM" } });
    } catch (e) { console.error(e); }
    finally { setStarting(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="arrow-back" size={20} color={ACCENT} />
        </Pressable>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginLeft: 12 }}>Messages</Text>
        <Pressable
          onPress={() => setShowNewDM(true)}
          style={[styles.newDMBtn, { backgroundColor: ACCENT }]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={dark ? "#000000" : "#FFFFFF"} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={r => r.id}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 80 }}>
              <View style={[styles.emptyIcon, { backgroundColor: ACCENT + "20" }]}>
                <Ionicons name="chatbubbles-outline" size={40} color={ACCENT} />
              </View>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 16 }}>
                No conversations yet
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 6 }}>
                Start a DM or create a study group
              </Text>
              <Pressable onPress={() => setShowNewDM(true)}
                style={[styles.startBtn, { backgroundColor: ACCENT, marginTop: 20 }]}>
                <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>Start a Conversation</Text>
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
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18 }}>New Message</Text>
              <Pressable onPress={() => setShowNewDM(false)} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
                <Ionicons name="close" size={18} color={textSecondary} />
              </Pressable>
            </View>
            <View style={[styles.searchRow, { backgroundColor: inputBg }]}>
              <Ionicons name="search-outline" size={18} color={textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                value={search} onChangeText={setSearch}
                placeholder="Search users..." placeholderTextColor="#6B7280"
                style={{ flex: 1, color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14 }}
              />
            </View>
            <FlatList
              data={filteredUsers}
              keyExtractor={u => String(u.id)}
              style={{ marginTop: 12 }}
              renderItem={({ item }) => (
                <Pressable onPress={() => startDM(item.id)} style={[styles.userRow, { borderBottomColor: dark ? "#252540" : "#F3F4F6" }]}>
                  <View style={[styles.userAvatar, { backgroundColor: "#3B82F620" }]}>
                    <Text style={{ color: "#3B82F6", fontFamily: "Sora_700Bold", fontSize: 16 }}>
                      {item.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }}>{item.username}</Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>{item.email}</Text>
                  </View>
                  <Ionicons name="chatbubble-outline" size={18} color={ACCENT} />
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
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  newDMBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginLeft: "auto",
  },
  roomItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  roomAvatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  badge: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  startBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "75%", minHeight: "50%" },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  searchRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 12 },
  userRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  userAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
