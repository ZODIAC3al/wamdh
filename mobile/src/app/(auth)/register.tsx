import React, { useState } from "react";
import {
  View, Text, Pressable, ScrollView,
  Platform, KeyboardAvoidingView, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore, UserRole } from "../../store/authStore";
import { apiClient } from "../../lib/api";
import { useToastStore } from "../../store/toastStore";
import { useWamdh } from "../../context/WamdhContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import LanguageBottomSheet from "../../components/LanguageBottomSheet";

// Helper to determine if a hex color is light or dark (YIQ model)
const isLightColor = (color: string) => {
  if (!color) return false;
  const hex = color.replace("#", "");
  if (hex.length !== 6 && hex.length !== 3) return false;
  let r = 0, g = 0, b = 0;
  if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    r = parseInt(hex.substring(0, 1) + hex.substring(0, 1), 16);
    g = parseInt(hex.substring(1, 2) + hex.substring(1, 2), 16);
    b = parseInt(hex.substring(2, 3) + hex.substring(2, 3), 16);
  }
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128;
};

// Returns a safe contrasting color for components directly resting on the screen background
const getInteractiveColor = (baseColor: string, isDarkTheme: boolean, fallbackColor: string) => {
  const isLight = isLightColor(baseColor);
  if (isDarkTheme) {
    return isLight ? baseColor : fallbackColor;
  } else {
    return !isLight ? baseColor : fallbackColor;
  }
};

export default function RegisterScreen() {
  const router = useRouter();
  const loginUser = useAuthStore((state) => state.login);
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("student");
  const [langSheetVisible, setLangSheetVisible] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      useToastStore.getState().show({ type: "error", text1: t("required"), text2: t("fill_all_fields") });
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post("/api/users/register/", {
        username, email, password, role,
      });
      const { user: registeredUser, tokens } = response.data;
      await loginUser(tokens.access, tokens.refresh, {
        id: registeredUser.id, username: registeredUser.username, email: registeredUser.email,
        role: (registeredUser.role || "student") as UserRole,
        xp_points: registeredUser.xp_points || 0, streak_days: registeredUser.streak_days || 0,
        profile_photo_url: registeredUser.profile_photo_url,
        banner_image_url: registeredUser.banner_image_url, bio: registeredUser.bio,
      });
      useToastStore.getState().show({ type: "success", text1: t("welcome") || "Welcome!", text2: `${t("registration_success") || "Registered successfully as"} ${registeredUser.username}.` });
    } catch (e: any) {
      const data = e.response?.data;
      let msg = e.message || "Registration failed.";
      if (data?.username) msg = `Username: ${data.username[0]}`;
      else if (data?.email) msg = `Email: ${data.email[0]}`;
      else if (data?.password) msg = `Password: ${data.password[0]}`;
      else if (data?.detail) msg = data.detail;
      useToastStore.getState().show({ type: "error", text1: t("registration_failed"), text2: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    setLoading(true);
    try {
      const redirectUrl = Linking.createURL("/(auth)/register");
      const initiateUrl = `${apiClient.defaults.baseURL}/api/users/google-login-initiate/?redirect_scheme=${encodeURIComponent(redirectUrl)}`;

      if (Platform.OS === "web") {
        window.location.href = initiateUrl;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(initiateUrl, redirectUrl);
      if (result.type === "success" && result.url) {
        const parsed = Linking.parse(result.url);
        const accessToken = parsed.queryParams?.access;
        const refreshToken = parsed.queryParams?.refresh;

        if (accessToken && refreshToken) {
          const access = Array.isArray(accessToken) ? accessToken[0] : accessToken;
          const refresh = Array.isArray(refreshToken) ? refreshToken[0] : refreshToken;
          const profileResponse = await apiClient.get("/api/users/profile/", {
            headers: { Authorization: `Bearer ${access}` },
          });
          const profile = profileResponse.data;
          await loginUser(access, refresh, {
            id: profile.id, username: profile.username, email: profile.email,
            role: (profile.role || "student") as UserRole,
            xp_points: profile.xp_points || 0, streak_days: profile.streak_days || 0,
            profile_photo_url: profile.profile_photo_url,
            banner_image_url: profile.banner_image_url, bio: profile.bio,
          });
          useToastStore.getState().show({ type: "success", text1: t("welcome") || "Welcome!", text2: t("google_success") });
        } else {
          throw new Error("Tokens not found in Google redirect URL.");
        }
      } else {
        useToastStore.getState().show({ type: "info", text1: t("info") || "Info", text2: t("google_cancelled") });
      }
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || "Google Login failed.";
      useToastStore.getState().show({ type: "error", text1: t("registration_failed"), text2: msg });
    } finally {
      setLoading(false);
    }
  };

  const bg = colors.background;
  const card = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const interactiveAccent = getInteractiveColor(colors.limeAccent || "#D4FC34", dark, colors.brandPrimary);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: bg }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar style={dark ? "light" : "dark"} />

        {/* Back Button */}
        <View style={{ paddingTop: 60, paddingHorizontal: 24, flexDirection: isRtl ? "row-reverse" : "row" }}>
          <Pressable 
            onPress={() => router.back()} 
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: cardBorder,
              backgroundColor: card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={20} color={textPrimary} />
          </Pressable>
        </View>

        {/* Welcome Section */}
        <View style={{ paddingHorizontal: 24, paddingTop: 30, paddingBottom: 24, alignItems: isRtl ? "flex-end" : "flex-start" }}>
          <Text style={{ fontFamily: "Sora_700Bold", fontSize: 32, color: textPrimary, marginBottom: 8, lineHeight: 40, textAlign: isRtl ? "right" : "left" }}>
            {t("create_account")}
          </Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: textSecondary, lineHeight: 22, textAlign: isRtl ? "right" : "left" }}>
            {t("register_subtitle")}
          </Text>
        </View>

        {/* Form Container */}
        <View style={{ paddingHorizontal: 24 }}>
          {/* Username */}
          <Input
            label={t("username")}
            placeholder="zodiac"
            value={username}
            onChangeText={setUsername}
            leftIcon="person-outline"
            colors={colors}
          />

          {/* Email */}
          <Input
            label={t("email_address")}
            placeholder="zodiac@studyos.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            leftIcon="mail-outline"
            colors={colors}
          />

          {/* Password */}
          <Input
            label={t("password")}
            placeholder={isRtl ? "٨ رموز على الأقل" : "Min. 8 characters"}
            value={password}
            onChangeText={setPassword}
            leftIcon="lock-closed-outline"
            secureTextEntry
            colors={colors}
          />

          {/* Role Picker */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: textSecondary, marginBottom: 8, textAlign: isRtl ? "right" : "left" }}>
              {t("select_role")}
            </Text>
            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 12 }}>
              {[
                { value: "student", label: t("role_student"), icon: "school" },
                { value: "instructor", label: t("role_instructor"), icon: "briefcase" }
              ].map((r) => {
                const active = role === r.value;
                const isLightAccent = isLightColor(interactiveAccent);
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => setRole(r.value as UserRole)}
                    style={{
                      flex: 1,
                      flexDirection: isRtl ? "row-reverse" : "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: active ? interactiveAccent : cardBorder,
                      backgroundColor: active ? (isLightAccent ? "rgba(0,0,0,0.06)" : interactiveAccent + "15") : inputBg
                    }}
                  >
                    <Ionicons 
                      name={r.icon as any} 
                      size={16} 
                      color={active ? interactiveAccent : textSecondary} 
                      style={{ marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }} 
                    />
                    <Text style={{
                      color: active ? interactiveAccent : textPrimary,
                      fontFamily: active ? "Inter_700Bold" : "Inter_500Medium",
                      fontSize: 13
                    }}>
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Action Row: Register Button + Language Sheet Selector */}
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 12, marginTop: 10, marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Button
                label={loading ? t("registering") : t("register")}
                variant="primary"
                limeStyle
                loading={loading}
                colors={colors}
                onPress={handleRegister}
              />
            </View>
            <Pressable
              onPress={() => setLangSheetVisible(true)}
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: cardBorder,
                backgroundColor: card,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="globe-outline" size={22} color={textPrimary} />
            </Pressable>
          </View>

          {/* Divider */}
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", marginBottom: 24 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: cardBorder }} />
            <Text style={{ paddingHorizontal: 16, color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              {isRtl ? "أو" : "or"}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: cardBorder }} />
          </View>

          {/* Social Logins */}
          <View style={{ gap: 12, marginBottom: 40 }}>
            <Button
              label={isRtl ? "التسجيل باستخدام Apple" : "Sign up with Apple"}
              variant="outline"
              leftIcon={<Ionicons name="logo-apple" size={20} color={textPrimary} />}
              colors={colors}
            />
            <Button
              label={isRtl ? "التسجيل باستخدام Google" : "Sign up with Google"}
              variant="outline"
              leftIcon={<Ionicons name="logo-google" size={20} color="#DB4437" />}
              colors={colors}
              onPress={handleGooglePress}
            />
          </View>

          {/* Login Link */}
          <Pressable 
            onPress={() => router.push("/(auth)/login")} 
            style={{ alignItems: "center" }}
          >
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 14 }}>
              {isRtl ? "لديك حساب بالفعل؟ " : "Already have an account? "}{" "}
              <Text style={{ color: interactiveAccent, fontFamily: "Inter_700Bold" }}>
                {isRtl ? "سجل دخولك" : "Log In"}
              </Text>
            </Text>
          </Pressable>
        </View>

        {/* Language Bottom Sheet */}
        <LanguageBottomSheet 
          visible={langSheetVisible} 
          onClose={() => setLangSheetVisible(false)} 
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({});