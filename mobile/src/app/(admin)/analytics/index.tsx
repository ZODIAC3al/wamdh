import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  ActivityIndicator, StyleSheet,
  RefreshControl
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { PremiumChart } from "../../../components/PremiumChart";
import { useWamdh } from "../../../context/WamdhContext";

export default function AdminAnalyticsDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const PRIMARY = colors.accent;
  const RED = colors.danger;
  const GREEN = colors.success;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "content" | "security">("users");

  useEffect(() => {
    if (params.tab === "users" || params.tab === "content" || params.tab === "security") {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  // Data States
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [contentAnalytics, setContentAnalytics] = useState<any>(null);
  const [securityAnalytics, setSecurityAnalytics] = useState<any>(null);

  const loadAnalytics = async () => {
    try {
      const uRes = await apiClient.get("/api/admin/analytics/users/");
      setUserAnalytics(uRes.data);

      const cRes = await apiClient.get("/api/admin/analytics/content/");
      setContentAnalytics(cRes.data);

      const sRes = await apiClient.get("/api/admin/analytics/security/");
      setSecurityAnalytics(sRes.data);
    } catch (e) {
      console.log("Error loading platform analytics:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  // New mock data for additional charts
  const mockPremiumSubscribers = [
    { label: "06/20", value: 120 },
    { label: "06/21", value: 145 },
    { label: "06/22", value: 190 },
    { label: "06/23", value: 245 },
    { label: "06/24", value: 310 }
  ];

  const mockAiTokensRate = [
    { label: "Notes", value: 45000 },
    { label: "Voice", value: 98000 },
    { label: "Quiz", value: 32000 },
    { label: "Chat", value: 125000 }
  ];

  const mockSafetyReportsTrend = [
    { label: "06/20", value: 4 },
    { label: "06/21", value: 2 },
    { label: "06/22", value: 9 },
    { label: "06/23", value: 3 },
    { label: "06/24", value: 1 }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Platform Administration Analytics</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        {([
          { key: "users", label: "Users" },
          { key: "content", label: "Content" },
          { key: "security", label: "Security" }
        ] as const).map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tabBtn,
              activeTab === tab.key && { borderBottomColor: PRIMARY, borderBottomWidth: 3 }
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? PRIMARY : textSecondary, fontFamily: activeTab === tab.key ? "Sora_700Bold" : "Inter_500Medium" }
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
        >
          {activeTab === "users" && userAnalytics && (
            <View style={{ gap: 20 }}>
              {/* Users Summary stats */}
              <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.statNum, { color: textPrimary }]}>1,482</Text>
                  <Text style={[styles.statTitle, { color: textSecondary }]}>Total Signups</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.statNum, { color: textPrimary }]}>310</Text>
                  <Text style={[styles.statTitle, { color: textSecondary }]}>Premium Paid</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.statNum, { color: textPrimary }]}>$4,350</Text>
                  <Text style={[styles.statTitle, { color: textSecondary }]}>Monthly Revenue</Text>
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>User Registrations (Signups)</Text>
                <View style={{ height: 160, marginTop: 14 }}>
                  <PremiumChart
                    data={userAnalytics.dates.map((d: string, i: number) => ({
                      label: d,
                      value: Number(userAnalytics.signups[i])
                    }))}
                    xKey="label"
                    yKey="value"
                    color={PRIMARY}
                    type="bar"
                    height={160}
                  />
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Daily Active Growth</Text>
                <View style={{ height: 160, marginTop: 14 }}>
                  <PremiumChart
                    data={userAnalytics.dates.map((d: string, i: number) => ({
                      label: d,
                      value: Number(userAnalytics.active_users[i])
                    }))}
                    xKey="label"
                    yKey="value"
                    color={PRIMARY}
                    type="line"
                    height={160}
                  />
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Active Premium Subscriptions</Text>
                <View style={{ height: 160, marginTop: 14 }}>
                  <PremiumChart
                    data={mockPremiumSubscribers}
                    xKey="label"
                    yKey="value"
                    color={PRIMARY}
                    type="line"
                    height={160}
                  />
                </View>
              </View>
            </View>
          )}

          {activeTab === "content" && contentAnalytics && (
            <View style={{ gap: 20 }}>
              {/* Content Summary stats */}
              <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.statNum, { color: textPrimary }]}>429</Text>
                  <Text style={[styles.statTitle, { color: textSecondary }]}>Notes Created</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.statNum, { color: textPrimary }]}>15.2 GB</Text>
                  <Text style={[styles.statTitle, { color: textSecondary }]}>Cloud Disk Space</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.statNum, { color: textPrimary }]}>99.98%</Text>
                  <Text style={[styles.statTitle, { color: textSecondary }]}>API Success Rate</Text>
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Content Upload Categories</Text>
                <View style={{ height: 160, marginTop: 14 }}>
                  <PremiumChart
                    data={contentAnalytics.categories.map((c: string, i: number) => ({
                      label: c.substring(0, 5),
                      value: Number(contentAnalytics.uploads_count[i])
                    }))}
                    xKey="label"
                    yKey="value"
                    color={PRIMARY}
                    type="bar"
                    height={160}
                  />
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>AI Token Consumption Rate</Text>
                <View style={{ height: 160, marginTop: 14 }}>
                  <PremiumChart
                    data={mockAiTokensRate}
                    xKey="label"
                    yKey="value"
                    color={PRIMARY}
                    type="bar"
                    height={160}
                  />
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Cloud Storage (GB)</Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4 }}>
                  Total Used: {contentAnalytics.storage_used_gb}GB / {contentAnalytics.storage_limit_gb}GB
                </Text>
                <View style={[styles.progressBarBg, { backgroundColor: dark ? "#262626" : "#F3F4F6" }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: PRIMARY,
                        width: `${(contentAnalytics.storage_used_gb / contentAnalytics.storage_limit_gb) * 100}%`
                      }
                    ]}
                  />
                </View>
              </View>
            </View>
          )}

          {activeTab === "security" && securityAnalytics && (
            <View style={{ gap: 20 }}>
              {/* Security Summary stats */}
              <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.statNum, { color: textPrimary }]}>0</Text>
                  <Text style={[styles.statTitle, { color: textSecondary }]}>Active Breaches</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.statNum, { color: textPrimary }]}>14</Text>
                  <Text style={[styles.statTitle, { color: textSecondary }]}>Banned Accounts</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.statNum, { color: textPrimary }]}>99.9%</Text>
                  <Text style={[styles.statTitle, { color: textSecondary }]}>Response SLA</Text>
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Failed Login Attempts</Text>
                <View style={{ height: 160, marginTop: 14 }}>
                  <PremiumChart
                    data={securityAnalytics.days.map((d: string, i: number) => ({
                      label: d,
                      value: Number(securityAnalytics.failed_attempts[i])
                    }))}
                    xKey="label"
                    yKey="value"
                    color={RED}
                    type="line"
                    height={160}
                  />
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Reported Violation Trends</Text>
                <View style={{ height: 160, marginTop: 14 }}>
                  <PremiumChart
                    data={mockSafetyReportsTrend}
                    xKey="label"
                    yKey="value"
                    color={RED}
                    type="line"
                    height={160}
                  />
                </View>
              </View>
            </View>
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
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  statNum: { fontFamily: "Sora_700Bold", fontSize: 16 },
  statTitle: { fontFamily: "Inter_500Medium", fontSize: 9, marginTop: 4, textAlign: "center" },
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 14 },
  progressBarBg: { height: 8, borderRadius: 4, marginTop: 12, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 }
});
