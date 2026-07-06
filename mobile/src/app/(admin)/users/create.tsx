import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
  KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold

export default function AdminCreateUserScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // student, instructor, admin

  const handleCreate = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/api/admin/users/create/", {
        username,
        email,
        password,
        role
      });
      Alert.alert("Success", "User account created successfully.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.error || "Could not create user account.");
    } finally {
      setLoading(false);
    }
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Create User Account</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.label, { color: textSecondary }]}>USERNAME</Text>
          <TextInput
            placeholder="e.g. johndoe"
            placeholderTextColor={textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>EMAIL ADDRESS</Text>
          <TextInput
            placeholder="e.g. john@example.com"
            placeholderTextColor={textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>PASSWORD</Text>
          <TextInput
            placeholder="Enter secure password..."
            placeholderTextColor={textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>SYSTEM ROLE</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
            {["student", "instructor", "admin"].map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={[
                  styles.roleBtn,
                  { backgroundColor: role === r ? PRIMARY : inputBg, borderColor: cardBorder },
                  role === r && { borderColor: PRIMARY }
                ]}
              >
                <Text style={{ color: role === r ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "capitalize" }}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
        ) : (
          <Pressable
            onPress={handleCreate}
            style={[styles.saveBtn, { backgroundColor: PRIMARY }]}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>Create Account</Text>
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
  formCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  label: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
  input: { paddingHorizontal: 12, height: 44, borderRadius: 8, fontFamily: "Inter_500Medium", fontSize: 14 },
  roleBtn: { flex: 1, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  saveBtn: { marginTop: 24, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" }
});
