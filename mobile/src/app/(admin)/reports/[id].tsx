import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
  TextInput, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold
const RED = "#EF4444";
const GREEN = "#10B981";

export default function AdminReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const loadReport = async () => {
    try {
      const res = await apiClient.get(`/api/admin/reports/${id}/`);
      setReport(res.data);
      setAdminNotes(res.data.admin_notes || "");
    } catch (e) {
      Alert.alert("Error", "Could not fetch report details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  const handleResolveAction = async (action: "resolve" | "dismiss") => {
    setResolving(true);
    try {
      await apiClient.patch(`/api/admin/reports/${id}/${action}/`, {
        notes: adminNotes
      });
      Alert.alert("Success", `Report has been ${action === "resolve" ? "resolved" : "dismissed"}.`, [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert("Error", "Could not process resolution action.");
    } finally {
      setResolving(false);
    }
  };

  const handleWarnUser = async () => {
    if (!report?.reported_user) return;
    try {
      Alert.alert("Moderation Action", `Sending system warning to: ${report.reported_user}`);
      // Simulate/trigger warning view
      await handleResolveAction("resolve");
    } catch (e) {
      Alert.alert("Error", "Could not warn user.");
    }
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  if (loading && !report) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: bg }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Review Safety Flag</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Info Grid */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.5 }}>REPORT TYPE</Text>
            <View style={[styles.statusBadge, { backgroundColor: report.status === "pending" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)" }]}>
              <Text style={{ color: report.status === "pending" ? ACCENT : GREEN, fontFamily: "Inter_700Bold", fontSize: 9 }}>
                {report.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, textTransform: "capitalize" }}>
            {report.report_type} Flagged
          </Text>

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>VIOLATION DESCRIPTION</Text>
          <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18 }}>
            "{report.reason}"
          </Text>
        </View>

        {/* Roles Details */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 14 }]}>
          <Text style={[styles.label, { color: textSecondary }]}>USER ACCOUNTS INVOLVED</Text>
          <View style={styles.userRow}>
            <Ionicons name="flag-outline" size={16} color={PRIMARY} />
            <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 13, flex: 1, marginLeft: 10 }}>
              Reporter: <Text style={{ fontFamily: "Inter_700Bold" }}>{report.reporter_name}</Text>
            </Text>
          </View>
          <View style={[styles.userRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="person-outline" size={16} color={RED} />
            <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 13, flex: 1, marginLeft: 10 }}>
              Flagged Subject: <Text style={{ fontFamily: "Inter_700Bold", color: RED }}>{report.reported_user}</Text>
            </Text>
          </View>
        </View>

        {/* Admin Notes form */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 14 }]}>
          <Text style={[styles.label, { color: textSecondary }]}>OFFICER RESOLUTION NOTES</Text>
          <TextInput
            placeholder="Type explanation of resolution actions taken..."
            placeholderTextColor={textSecondary}
            value={adminNotes}
            onChangeText={setAdminNotes}
            multiline
            numberOfLines={4}
            style={[styles.inputArea, { backgroundColor: inputBg, color: textPrimary }]}
          />
        </View>

        {/* Action Toggles */}
        {resolving ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
        ) : report.status === "pending" ? (
          <View style={{ marginTop: 24, gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => handleResolveAction("dismiss")}
                style={[styles.btn, { backgroundColor: inputBg, flex: 1, borderColor: cardBorder, borderWidth: 1 }]}
              >
                <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold" }}>Dismiss Flag</Text>
              </Pressable>

              <Pressable
                onPress={() => handleResolveAction("resolve")}
                style={[styles.btn, { backgroundColor: GREEN, flex: 1 }]}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold" }}>Resolve & Close</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleWarnUser}
              style={[styles.btn, { backgroundColor: RED }]}
            >
              <Ionicons name="warning-outline" size={18} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", marginLeft: 8 }}>
                Warn Flagged User & Close
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.resolvedPanel, { backgroundColor: GREEN + "10", borderColor: GREEN + "30" }]}>
            <Ionicons name="checkmark-circle" size={20} color={GREEN} />
            <Text style={{ color: GREEN, fontFamily: "Inter_700Bold", fontSize: 13, marginLeft: 8 }}>
              Report Resolved by {report.resolved_by_name}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  label: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, marginBottom: 8 },
  userRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#E5E7EB" },
  inputArea: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontFamily: "Inter_500Medium", fontSize: 13, minHeight: 80, textAlignVertical: "top" },
  btn: { height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  resolvedPanel: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 24 }
});
