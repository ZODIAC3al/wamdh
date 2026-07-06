import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Image,
  RefreshControl, FlatList
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold
const RED = "#EF4444";
const GREEN = "#10B981";

export default function AdminUserListView() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // all, student, instructor, admin
  const [statusFilter, setStatusFilter] = useState("all"); // all, banned, active
  const [sort, setSort] = useState("newest"); // newest, name_a_z

  const loadUsers = async () => {
    try {
      const res = await apiClient.get("/api/admin/users/", {
        params: {
          role: roleFilter,
          status: statusFilter,
          search,
          sort
        }
      });
      setUsers(res.data.users || []);
    } catch (e) {
      console.log("Error loading users for admin:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter, sort]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>User Management</Text>
        <Pressable
          onPress={() => router.push("/(admin)/users/create" as any)}
          style={[styles.createBtn, { backgroundColor: PRIMARY }]}
        >
          <Ionicons name="person-add" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Add User</Text>
        </Pressable>
      </View>

      {/* Search Box */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Ionicons name="search" size={18} color={textSecondary} />
          <TextInput
            placeholder="Search by name or email..."
            placeholderTextColor={textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={loadUsers}
            style={[styles.searchInput, { color: textPrimary }]}
          />
        </View>

        {/* Roles Filter Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
          {[
            { key: "all", label: "All Roles" },
            { key: "student", label: "Students" },
            { key: "instructor", label: "Instructors" },
            { key: "admin", label: "Admins" }
          ].map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setRoleFilter(f.key)}
              style={[
                styles.filterChip,
                { backgroundColor: roleFilter === f.key ? PRIMARY : cardBg, borderColor: cardBorder },
                roleFilter === f.key && { borderColor: PRIMARY }
              ]}
            >
              <Text style={{ color: roleFilter === f.key ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Status Filters & Sort row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { key: "all", label: "All Status" },
              { key: "banned", label: "🔴 Banned Only" }
            ].map((st) => (
              <Pressable
                key={st.key}
                onPress={() => setStatusFilter(st.key)}
                style={[
                  styles.statusChip,
                  { backgroundColor: statusFilter === st.key ? "rgba(239, 68, 68, 0.1)" : cardBg, borderColor: cardBorder },
                  statusFilter === st.key && { borderColor: RED }
                ]}
              >
                <Text style={{ color: statusFilter === st.key ? RED : textSecondary, fontFamily: "Inter_700Bold", fontSize: 10 }}>
                  {st.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => setSort(prev => prev === "newest" ? "name_a_z" : "newest")}
            style={[styles.statusChip, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <Ionicons name="swap-vertical" size={12} color={textSecondary} />
            <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 10, marginLeft: 4 }}>
              Sort: {sort === "newest" ? "Newest" : "A-Z"}
            </Text>
          </Pressable>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Ionicons name="people-outline" size={48} color={textSecondary} />
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 12 }}>
                No platform users found
              </Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <Pressable
              onPress={() => router.push(`/(admin)/users/${item.id}` as any)}
              style={[styles.userCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={[styles.avatar, { backgroundColor: PRIMARY + "20" }]}>
                {item.profile_photo_url ? (
                  <Image source={{ uri: item.profile_photo_url }} style={styles.avatarImg} />
                ) : (
                  <Text style={{ color: PRIMARY, fontFamily: "Sora_700Bold", fontSize: 14 }}>
                    {item.username.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }}>{item.username}</Text>
                  {item.is_banned && (
                    <View style={styles.banDot} />
                  )}
                </View>
                <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 2 }}>
                  {item.email}
                </Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                  XP: {item.xp_points || 0}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor:
                        item.role === "admin" ? "rgba(245, 158, 11, 0.15)" :
                        item.role === "instructor" ? "rgba(30, 64, 175, 0.15)" : "rgba(16, 185, 129, 0.15)"
                    }
                  ]}
                >
                  <Text
                    style={{
                      color:
                        item.role === "admin" ? ACCENT :
                        item.role === "instructor" ? PRIMARY : GREEN,
                      fontFamily: "Inter_700Bold",
                      fontSize: 9,
                      textTransform: "uppercase"
                    }}
                  >
                    {item.role}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={textSecondary} style={{ marginTop: 10 }} />
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1
  },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 18 },
  createBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, gap: 4 },
  createBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 11 },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1, marginRight: 8 },
  statusChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  userCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%" },
  banDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: RED },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }
});
