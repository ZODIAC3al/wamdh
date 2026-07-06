import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const RED = "#EF4444";
const ORANGE = "#F59E0B";

interface Flag {
  id: string;
  type: string;
  target: string;
  reason: string;
  status: string;
}

interface ToxicPattern {
  id: string;
  pattern: string;
  type: string;
  severity: string;
  active: boolean;
}

interface ShieldStats {
  blocked_today: number;
  blocked_total: number;
  shield_trigger_rate: string;
}

export default function AdminModerationScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;
  const queryClient = useQueryClient();

  const [usernameInput, setUsernameInput] = useState("");
  const [patternInput, setPatternInput] = useState("");
  const [selectedPatternType, setSelectedPatternType] = useState("phrase");
  const [selectedSeverity, setSelectedSeverity] = useState("high");

  const { data: flags, isLoading } = useQuery<Flag[]>({
    queryKey: ["admin-flags"],
    queryFn: async () => (await apiClient.get("/api/users/admin/flags/")).data
  });

  const { data: shieldData, isLoading: isLoadingShield } = useQuery<{ patterns: ToxicPattern[], stats: ShieldStats }>({
    queryKey: ["admin-toxic-shield"],
    queryFn: async () => (await apiClient.get("/api/admin/toxic-shield/")).data
  });

  const banMutation = useMutation({
    mutationFn: async (targetUsername: string) => {
      const res = await apiClient.post(`/api/users/admin/ban/${targetUsername}/`);
      return res.data;
    },
    onSuccess: (data) => {
      Alert.alert("Moderation Success", data.message || "User status changed successfully.");
      setUsernameInput("");
      queryClient.invalidateQueries({ queryKey: ["admin-flags"] });
    },
    onError: () => {
      Alert.alert("Error", "Could not modify user status. Verify username exists.");
    }
  });

  const addPatternMutation = useMutation({
    mutationFn: async (pattern: string) => {
      const res = await apiClient.post("/api/admin/toxic-shield/", {
        pattern,
        type: selectedPatternType,
        severity: selectedSeverity
      });
      return res.data;
    },
    onSuccess: () => {
      Alert.alert("Success", "Toxic pattern added to shield.");
      setPatternInput("");
      queryClient.invalidateQueries({ queryKey: ["admin-toxic-shield"] });
    },
    onError: () => {
      Alert.alert("Error", "Could not add pattern.");
    }
  });

  const handleBanToggle = () => {
    if (!usernameInput.trim()) return;
    banMutation.mutate(usernameInput.trim());
  };

  const handleAddPattern = () => {
    if (!patternInput.trim()) return;
    addPatternMutation.mutate(patternInput.trim());
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Moderation Portal</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* TOXIC MESSAGE SHIELD */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <Ionicons name="shield-outline" size={18} color={ACCENT} />
          <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 0 }]}>Toxic Message Shield</Text>
        </View>

        {isLoadingShield ? (
          <ActivityIndicator color={ACCENT} style={{ marginBottom: 12 }} />
        ) : (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 16 }]}>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 11, marginBottom: 6 }}>
                  Blocked Today: {shieldData?.stats?.blocked_today || 0}
                </Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                  Total Blocked: {shieldData?.stats?.blocked_total || 0}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <View style={[styles.shieldRateBadge, { backgroundColor: ORANGE + "20" }]}>
                  <Text style={{ color: ORANGE, fontFamily: "Inter_700Bold", fontSize: 12 }}>
                    {shieldData?.stats?.shield_trigger_rate || "0%"} Trigger Rate
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              <View style={{ flex: 2 }}>
                <TextInput
                  value={patternInput}
                  onChangeText={setPatternInput}
                  placeholder="Add toxic phrase/pattern"
                  placeholderTextColor={textSecondary}
                  style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
                />
              </View>
              <Pressable
                onPress={handleAddPattern}
                disabled={addPatternMutation.isPending}
                style={[styles.addPatternBtn, { backgroundColor: ACCENT }]}
              >
                {addPatternMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                )}
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              {["phrase", "keyword", "regex"].map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setSelectedPatternType(type)}
                  style={[
                    styles.patternTypeBtn,
                    { backgroundColor: selectedPatternType === type ? ACCENT + "20" : inputBg, borderColor: cardBorder }
                  ]}
                >
                  <Text style={{ color: selectedPatternType === type ? ACCENT : textSecondary, fontFamily: "Inter_500Medium", fontSize: 10 }}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>

            {shieldData?.patterns && shieldData.patterns.length > 0 ? (
              shieldData.patterns.map((p) => (
                <View key={p.id} style={[styles.patternRow, { borderBottomColor: cardBorder }]}>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 }} numberOfLines={1}>
                    {p.pattern}
                  </Text>
                  <View style={[styles.severityBadge, { backgroundColor: p.severity === "critical" ? RED + "20" : ORANGE + "20" }]}>
                    <Text style={{ color: p.severity === "critical" ? RED : ORANGE, fontFamily: "Inter_700Bold", fontSize: 10, textTransform: "capitalize" }}>
                      {p.severity}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", marginTop: 8 }}>
                No toxic patterns configured
              </Text>
            )}
          </View>
        )}

        {/* Toggle User Ban */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Account Action Panel</Text>
          
          <TextInput
            value={usernameInput}
            onChangeText={setUsernameInput}
            autoCapitalize="none"
            placeholder="Username to Ban / Unban"
            placeholderTextColor="#6B7280"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Pressable onPress={handleBanToggle} disabled={banMutation.isPending} style={[styles.actionBtn, { backgroundColor: RED, marginTop: 14 }]}>
            {banMutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionBtnText}>Toggle Ban Status</Text>}
          </Pressable>
        </View>

        {/* Flags list */}
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Flagged Content Alerts</Text>
        {isLoading ? (
          <ActivityIndicator color={ACCENT} />
        ) : (flags || []).length === 0 ? (
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 20 }}>
            No flagged content reports.
          </Text>
        ) : (
          flags?.map((flag) => (
            <View key={flag.id} style={[styles.flagCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#BE1A1A", fontFamily: "Sora_700Bold", fontSize: 12, textTransform: "uppercase" }}>
                  {flag.type} Report
                </Text>
                <View style={[styles.badge, { backgroundColor: "#F7D87F20" }]}>
                  <Text style={{ color: "#F7D87F", fontFamily: "Inter_700Bold", fontSize: 9 }}>PENDING</Text>
                </View>
              </View>

              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14, marginTop: 6 }}>
                Target: {flag.target}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>
                Reason: {flag.reason}
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <Pressable onPress={() => Alert.alert("Resolved", "Report marked as resolved.")} style={[styles.rowBtn, { backgroundColor: "#BE1A1A" + "15" }]}>
                  <Text style={{ color: "#BE1A1A", fontFamily: "Inter_700Bold", fontSize: 11 }}>Dismiss</Text>
                </Pressable>
                <Pressable onPress={() => banMutation.mutate(flag.target)} style={[styles.rowBtn, { backgroundColor: RED + "15" }]}>
                  <Text style={{ color: RED, fontFamily: "Inter_700Bold", fontSize: 11 }}>Ban Target</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 14 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14 },
  actionBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 24, marginBottom: 12 },
  flagCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  rowBtn: { flex: 1, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  shieldRateBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addPatternBtn: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  patternTypeBtn: { flex: 1, height: 32, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  patternRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }
});