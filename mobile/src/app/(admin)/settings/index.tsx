import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
  Switch, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const PRIMARY = colors.accent;
  const RED = colors.danger;
  const GREEN = colors.success;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [provider, setProvider] = useState("gemini-1.5-flash");
  const [studentLimit, setStudentLimit] = useState("50");
  const [instructorLimit, setInstructorLimit] = useState("200");
  const [emergencySwitch, setEmergencySwitch] = useState(false);
  
  const [maxPdfSize, setMaxPdfSize] = useState("20");
  const [maxImageSize, setMaxImageSize] = useState("10");

  const [jwtExpiry, setJwtExpiry] = useState("1");
  const [refreshExpiry, setRefreshExpiry] = useState("30");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [registrationOpen, setRegistrationOpen] = useState(true);

  // API Cost Limits
  const [geminiCostLimit, setGeminiCostLimit] = useState("500");
  const [claudeCostLimit, setClaudeCostLimit] = useState("300");
  const [openaiCostLimit, setOpenaiCostLimit] = useState("200");
  const [totalBudget, setTotalBudget] = useState("1000");
  const [budgetResetDay, setBudgetResetDay] = useState("1");

  const loadSettings = async () => {
    try {
      const res = await apiClient.get("/api/admin/settings/");
      const s = res.data;
      setProvider(s.primary_provider || "gemini-1.5-flash");
      setStudentLimit(String(s.student_daily_limit || 50));
      setInstructorLimit(String(s.instructor_daily_limit || 200));
      setEmergencySwitch(!!s.emergency_kill_switch);
      setMaxPdfSize(String(s.max_pdf_size_mb || 20));
      setMaxImageSize(String(s.max_image_size_mb || 10));
      setJwtExpiry(String(s.jwt_expiry_hours || 1));
      setRefreshExpiry(String(s.refresh_token_days || 30));
      setMaxLoginAttempts(String(s.max_login_attempts || 5));
      setRegistrationOpen(s.registration_open !== false);
      setGeminiCostLimit(String(s.gemini_cost_limit_usd || 500));
      setClaudeCostLimit(String(s.claude_cost_limit_usd || 300));
      setOpenaiCostLimit(String(s.openai_cost_limit_usd || 200));
      setTotalBudget(String(s.total_monthly_budget_usd || 1000));
      setBudgetResetDay(String(s.budget_reset_day || 1));
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not fetch platform settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await apiClient.patch("/api/admin/settings/", {
        primary_provider: provider,
        student_daily_limit: studentLimit,
        instructor_daily_limit: instructorLimit,
        emergency_kill_switch: emergencySwitch,
        max_pdf_size_mb: maxPdfSize,
        max_image_size_mb: maxImageSize,
        jwt_expiry_hours: jwtExpiry,
        refresh_token_days: refreshExpiry,
        max_login_attempts: maxLoginAttempts,
        registration_open: registrationOpen,
        gemini_cost_limit_usd: geminiCostLimit,
        claude_cost_limit_usd: claudeCostLimit,
        openai_cost_limit_usd: openaiCostLimit,
        total_monthly_budget_usd: totalBudget,
        budget_reset_day: budgetResetDay
      });
      Alert.alert("Success", "Platform settings updated successfully.");
    } catch (e) {
      Alert.alert("Error", "Could not save configurations.");
    } finally {
      setSaving(false);
    }
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  if (loading) {
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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>System Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* AI CONFIGURATION */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <Ionicons name="sparkles-outline" size={18} color={PRIMARY} />
          <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 0 }]}>AI Engine Configuration</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.label, { color: textSecondary }]}>PRIMARY PROVIDER</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 6, marginBottom: 16 }}>
            {["gemini-1.5-flash", "gemini-1.5-pro"].map((prov) => (
              <Pressable
                key={prov}
                onPress={() => setProvider(prov)}
                style={[
                  styles.providerBtn,
                  { backgroundColor: provider === prov ? PRIMARY : inputBg, borderColor: cardBorder },
                  provider === prov && { borderColor: PRIMARY }
                ]}
              >
                <Text style={{ color: provider === prov ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                  {prov === "gemini-1.5-flash" ? "Gemini Flash" : "Gemini Pro"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>STUDENT DAILY LIMIT</Text>
              <TextInput
                value={studentLimit}
                onChangeText={setStudentLimit}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>INSTRUCTOR DAILY LIMIT</Text>
              <TextInput
                value={instructorLimit}
                onChangeText={setInstructorLimit}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>Emergency Kill Switch</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 2 }}>
                Instantly disable all AI operations platform-wide
              </Text>
            </View>
            <Switch value={emergencySwitch} onValueChange={setEmergencySwitch} trackColor={{ true: RED }} />
          </View>
        </View>

        {/* FILE UPLOAD LIMITS */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, marginTop: 24 }}>
          <Ionicons name="cloud-upload-outline" size={18} color={PRIMARY} />
          <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 0 }]}>File Upload Limits</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>MAX PDF SIZE (MB)</Text>
              <TextInput
                value={maxPdfSize}
                onChangeText={setMaxPdfSize}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>MAX IMAGE SIZE (MB)</Text>
              <TextInput
                value={maxImageSize}
                onChangeText={setMaxImageSize}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
          </View>
        </View>

        {/* SECURITY SETTINGS */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, marginTop: 24 }}>
          <Ionicons name="lock-closed-outline" size={18} color={PRIMARY} />
          <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 0 }]}>Security & Tokens</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>JWT EXPIRY (HOURS)</Text>
              <TextInput
                value={jwtExpiry}
                onChangeText={setJwtExpiry}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>REFRESH TOKEN (DAYS)</Text>
              <TextInput
                value={refreshExpiry}
                onChangeText={setRefreshExpiry}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>Open Registration</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 2 }}>
                Allow public sign-ups on authentication screens
              </Text>
            </View>
            <Switch value={registrationOpen} onValueChange={setRegistrationOpen} trackColor={{ true: GREEN }} />
          </View>
        </View>

        {/* API COST LIMITS */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, marginTop: 24 }}>
          <Ionicons name="cash-outline" size={18} color={PRIMARY} />
          <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 0 }]}>API Cost Limits</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>GEMINI LIMIT ($)</Text>
              <TextInput
                value={geminiCostLimit}
                onChangeText={setGeminiCostLimit}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>CLAUDE LIMIT ($)</Text>
              <TextInput
                value={claudeCostLimit}
                onChangeText={setClaudeCostLimit}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>OPENAI LIMIT ($)</Text>
              <TextInput
                value={openaiCostLimit}
                onChangeText={setOpenaiCostLimit}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>TOTAL BUDGET ($)</Text>
              <TextInput
                value={totalBudget}
                onChangeText={setTotalBudget}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textSecondary }]}>BUDGET RESET DAY</Text>
              <TextInput
                value={budgetResetDay}
                onChangeText={setBudgetResetDay}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              />
            </View>
          </View>
        </View>

        {/* Save CTA */}
        {saving ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
        ) : (
          <Pressable
            onPress={handleSaveSettings}
            style={[styles.saveBtn, { backgroundColor: PRIMARY }]}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>Save System Config</Text>
          </Pressable>
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
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 14 },
  card: { padding: 18, borderRadius: 16, borderWidth: 1, marginTop: 4 },
  label: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
  providerBtn: { flex: 1, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  input: { paddingHorizontal: 12, height: 44, borderRadius: 8, fontFamily: "Inter_500Medium", fontSize: 13 },
  saveBtn: { marginTop: 28, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" }
});
