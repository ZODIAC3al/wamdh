import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  ActivityIndicator, StyleSheet,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold
const RED = "#EF4444";
const GREEN = "#10B981";

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const loadAnnouncements = async () => {
    try {
      const res = await apiClient.get("/api/instructor/announcements/");
      setAnnouncements(res.data);
    } catch (e) {
      console.log("Error loading announcements:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnnouncements();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/instructor/announcements/${id}/`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.log("Error deleting announcement:", e);
    }
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const typeColor = (type: string) => {
    if (type === "urgent") return RED;
    if (type === "reminder") return ACCENT;
    return PRIMARY;
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Class Announcements</Text>
        <Pressable
          onPress={() => router.push("/(instructor)/announcements/create")}
          style={[styles.createBtn, { backgroundColor: PRIMARY }]}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
        >
          {announcements.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Ionicons name="megaphone-outline" size={48} color={textSecondary} />
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 12 }}>
                No announcements posted yet.
              </Text>
            </View>
          ) : (
            announcements.map((a) => {
              const borderCol = typeColor(a.announcement_type);
              return (
                <View
                  key={a.id}
                  style={[
                    styles.annCard,
                    { backgroundColor: cardBg, borderColor: cardBorder, borderLeftColor: borderCol, borderLeftWidth: 4 }
                  ]}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={[styles.badge, { backgroundColor: borderCol + "15" }]}>
                      <Text style={{ color: borderCol, fontFamily: "Inter_700Bold", fontSize: 9, textTransform: "uppercase" }}>
                        {a.announcement_type}
                      </Text>
                    </View>
                    <Pressable onPress={() => handleDelete(a.id)}>
                      <Ionicons name="trash-outline" size={16} color={RED} />
                    </Pressable>
                  </View>

                  <Text style={[styles.annTitle, { color: textPrimary }]}>{a.title}</Text>
                  <Text style={[styles.annMsg, { color: textSecondary }]}>{a.message}</Text>
                  
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 10 }}>
                      📢 Sent to: {a.course_title || "All Students"}
                    </Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10 }}>
                      {a.sent_at ? new Date(a.sent_at).toLocaleDateString() : "Draft"}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
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
  createBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  annCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start" },
  annTitle: { fontFamily: "Sora_700Bold", fontSize: 14, marginTop: 10 },
  annMsg: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4, lineHeight: 18 }
});
