import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Image,
  Alert, Modal, TextInput, RefreshControl
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold
const RED = "#EF4444";
const GREEN = "#10B981";

export default function AdminUserDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);

  // Modals state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);
  const [banLoading, setBanLoading] = useState(false);

  const loadUserData = async () => {
    try {
      const uRes = await apiClient.get(`/api/admin/users/${id}/`);
      setUser(uRes.data);

      const aRes = await apiClient.get(`/api/admin/users/${id}/activity/`);
      setActivity(aRes.data);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not fetch user details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleChangeRole = async (newRole: string) => {
    setRoleLoading(true);
    try {
      await apiClient.patch(`/api/admin/users/${id}/role/`, { role: newRole });
      setUser({ ...user, role: newRole });
      setShowRoleModal(false);
      Alert.alert("Success", `User role successfully updated to ${newRole}`);
      loadUserData();
    } catch (e) {
      Alert.alert("Error", "Could not change role.");
    } finally {
      setRoleLoading(false);
    }
  };

  const handleToggleBan = async () => {
    if (user?.is_banned) {
      // Unban
      Alert.alert(
        "Confirm Unban",
        "Are you sure you want to lift this user's ban?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unban",
            onPress: async () => {
              try {
                await apiClient.delete(`/api/admin/users/${id}/ban/`);
                setUser({ ...user, is_banned: false });
                Alert.alert("Success", "User ban lifted.");
                loadUserData();
              } catch (e) {
                Alert.alert("Error", "Could not unban user.");
              }
            }
          }
        ]
      );
    } else {
      setShowBanModal(true);
    }
  };

  const confirmBan = async () => {
    setBanLoading(true);
    try {
      await apiClient.post(`/api/admin/users/${id}/ban/`, {
        reason: banReason,
        duration_days: 30,
        permanent: true
      });
      setUser({ ...user, is_banned: true });
      setShowBanModal(false);
      setBanReason("");
      Alert.alert("Success", "User has been banned.");
      loadUserData();
    } catch (e) {
      Alert.alert("Error", "Could not execute ban.");
    } finally {
      setBanLoading(false);
    }
  };

  const handleDeleteUser = () => {
    Alert.alert(
      "🗑️ Permanently Delete User",
      "WARNING: This action is irreversible. All user data, notes, and records will be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/api/admin/users/${id}/`);
              Alert.alert("Success", "Account deleted.");
              router.replace("/(admin)/users/index" as any);
            } catch (e) {
              Alert.alert("Error", "Could not delete user.");
            }
          }
        }
      ]
    );
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  if (loading && !user) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>User Moderation</Text>
        <Pressable onPress={handleDeleteUser} style={[styles.backBtn, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
          <Ionicons name="trash-outline" size={18} color={RED} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
      >
        {/* Profile overview card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={{ alignItems: "center" }}>
            <View style={[styles.avatarCircle, { backgroundColor: PRIMARY + "20" }]}>
              {user?.profile_photo_url ? (
                <Image source={{ uri: user.profile_photo_url }} style={styles.avatarImg} />
              ) : (
                <Text style={{ color: PRIMARY, fontFamily: "Sora_700Bold", fontSize: 28 }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={[styles.userName, { color: textPrimary }]}>{user?.username}</Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 12 }}>{user?.email}</Text>
            
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{user?.role.toUpperCase()}</Text>
              </View>
              {user?.is_banned && (
                <View style={[styles.badge, { backgroundColor: RED + "15" }]}>
                  <Text style={{ color: RED, fontFamily: "Inter_700Bold", fontSize: 9 }}>BANNED</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* System Settings & Actions */}
        <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 24 }]}>Administrative Actions</Text>
        <View style={{ gap: 10 }}>
          <Pressable
            onPress={() => setShowRoleModal(true)}
            style={[styles.menuItem, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#BE1A1A" + "15" }]}>
              <Ionicons name="shield-outline" size={18} color={ACCENT} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>Change System Role</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                Current role: {user?.role}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={textSecondary} />
          </Pressable>

          <Pressable
            onPress={handleToggleBan}
            style={[styles.menuItem, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <View style={[styles.menuIcon, { backgroundColor: RED + "15" }]}>
              <Ionicons name="ban-outline" size={18} color={RED} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: RED, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                {user?.is_banned ? "Lift Ban (Unban User)" : "Suspend User (Ban Account)"}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                {user?.is_banned ? "Access to AI Study OS is blocked" : "Block access to study modules"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={textSecondary} />
          </Pressable>
        </View>

        {/* User Activity Log */}
        <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 24 }]}>User Activity Log Audit Trail</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {activity.length === 0 ? (
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 12 }}>No logs stored.</Text>
          ) : (
            activity.map((act, idx) => (
              <View key={idx} style={[styles.logRow, { borderBottomWidth: idx < activity.length - 1 ? 1 : 0, borderBottomColor: cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 12, textTransform: "capitalize" }}>
                    {act.action.replace("_", " ")}
                  </Text>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 10, marginTop: 2 }}>
                    Type: {act.target_type} · Details: {JSON.stringify(act.details || {})}
                  </Text>
                </View>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 9 }}>
                  {act.created_at ? new Date(act.created_at).toLocaleDateString() : ""}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Role Change Modal */}
      <Modal visible={showRoleModal} transparent animationType="fade" onRequestClose={() => setShowRoleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>Update User Role</Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, marginVertical: 8 }}>
              Select system access clearance:
            </Text>
            
            {roleLoading ? (
              <ActivityIndicator color={PRIMARY} style={{ marginVertical: 20 }} />
            ) : (
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { key: "student", label: "Student", desc: "Access study notes & AI chatbot tutor" },
                  { key: "instructor", label: "Instructor", desc: "Create courses, upload chapter materials, assign quizzes" },
                  { key: "admin", label: "Admin Officer", desc: "Full platform permissions, system logs, settings toggle" }
                ].map((roleOpt) => (
                  <Pressable
                    key={roleOpt.key}
                    onPress={() => handleChangeRole(roleOpt.key)}
                    style={[styles.roleSelectBtn, { borderColor: cardBorder, backgroundColor: inputBg }]}
                  >
                    <Text style={{ color: PRIMARY, fontFamily: "Sora_700Bold", fontSize: 13 }}>{roleOpt.label}</Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 2 }}>{roleOpt.desc}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable onPress={() => setShowRoleModal(false)} style={[styles.cancelBtn, { backgroundColor: inputBg, marginTop: 16 }]}>
              <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Ban Modal */}
      <Modal visible={showBanModal} transparent animationType="fade" onRequestClose={() => setShowBanModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>Suspend User Account</Text>
            <Text style={[styles.inputLabel, { color: textSecondary, marginTop: 14 }]}>REASON FOR BAN</Text>
            <TextInput
              placeholder="e.g. Uploading inappropriate notes files..."
              placeholderTextColor={textSecondary}
              value={banReason}
              onChangeText={setBanReason}
              style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
            />

            {banLoading ? (
              <ActivityIndicator color={PRIMARY} style={{ marginVertical: 20 }} />
            ) : (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
                <Pressable onPress={() => setShowBanModal(false)} style={[styles.btn, { backgroundColor: inputBg, flex: 1 }]}>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold" }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmBan} style={[styles.btn, { backgroundColor: RED, flex: 1 }]}>
                  <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold" }}>Ban User</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  card: { padding: 20, borderRadius: 16, borderWidth: 1 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 12, overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%" },
  userName: { fontFamily: "Sora_700Bold", fontSize: 16, marginBottom: 2 },
  badge: { backgroundColor: PRIMARY + "20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 10 },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 14, marginBottom: 12 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logRow: { paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { borderRadius: 20, padding: 24 },
  modalTitle: { fontFamily: "Sora_700Bold", fontSize: 16 },
  roleSelectBtn: { padding: 12, borderRadius: 10, borderWidth: 1 },
  cancelBtn: { height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  inputLabel: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
  input: { paddingHorizontal: 12, height: 44, borderRadius: 8, fontFamily: "Inter_500Medium", fontSize: 14 },
  btn: { height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }
});
