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

export default function AdminReportsQueueScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState("all"); // all, pending, resolved

  const loadReports = async () => {
    try {
      const res = await apiClient.get("/api/admin/reports/");
      setReports(res.data);
    } catch (e) {
      console.log("Error loading reports:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const filteredReports = reports.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const typeColor = (type: string) => {
    if (type === "abuse") return RED;
    if (type === "spam") return ACCENT;
    return PRIMARY;
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Safety Reports Queue</Text>
        <View style={[styles.badgeCount, { backgroundColor: RED }]}>
          <Text style={styles.badgeText}>
            {reports.filter(r => r.status === "pending").length}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          {[
            { key: "all", label: "All Reports" },
            { key: "pending", label: "Pending" },
            { key: "resolved", label: "Resolved" }
          ].map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setFilter(tab.key)}
              style={[
                styles.tabBtn,
                { backgroundColor: filter === tab.key ? PRIMARY : cardBg, borderColor: cardBorder },
                filter === tab.key && { borderColor: PRIMARY }
              ]}
            >
              <Text style={{ color: filter === tab.key ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
        >
          {filteredReports.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Ionicons name="shield-outline" size={48} color={textSecondary} />
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 12 }}>
                Clean queue! No reports pending.
              </Text>
            </View>
          ) : (
            filteredReports.map((r) => {
              const borderCol = typeColor(r.report_type);
              return (
                <Pressable
                  key={r.id}
                  onPress={() => router.push(`/(admin)/reports/${r.id}` as any)}
                  style={[
                    styles.reportCard,
                    { backgroundColor: cardBg, borderColor: cardBorder, borderLeftColor: borderCol, borderLeftWidth: 4 }
                  ]}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={[styles.badge, { backgroundColor: borderCol + "15", flexDirection: "row", alignItems: "center", gap: 4 }]}>
                      <Ionicons name="flag-outline" size={10} color={borderCol} />
                      <Text style={{ color: borderCol, fontFamily: "Inter_700Bold", fontSize: 9, textTransform: "uppercase" }}>
                        {r.report_type}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: r.status === "pending" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)" }
                      ]}
                    >
                      <Text style={{ color: r.status === "pending" ? ACCENT : GREEN, fontFamily: "Inter_700Bold", fontSize: 9 }}>
                        {r.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.reasonText, { color: textPrimary }]}>{r.reason}</Text>
                  
                  <View style={{ marginTop: 10, gap: 4 }}>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11 }}>
                      Reporter: <Text style={{ color: textPrimary }}>{r.reporter_name}</Text>
                    </Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11 }}>
                      Flagged User: <Text style={{ color: RED }}>{r.reported_user}</Text>
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 10 }}>
                      Type: {r.content_type?.toUpperCase()}
                    </Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10 }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                    </Text>
                  </View>
                </Pressable>
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
  badgeCount: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 11 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  reportCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  reasonText: { fontFamily: "Sora_700Bold", fontSize: 13, marginTop: 10, lineHeight: 18 }
});
