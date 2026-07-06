import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  Platform, KeyboardAvoidingView, StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore, UserRole } from "../../store/authStore";
import { apiClient } from "../../lib/api";
import { useToastStore } from "../../store/toastStore";
import { useWamdh } from "../../context/WamdhContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import LanguageBottomSheet from "../../components/LanguageBottomSheet";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

let GoogleSignin: any = null;
try {
  const GSignin = require("@react-native-google-signin/google-signin");
  if (GSignin && GSignin.GoogleSignin) {
    GoogleSignin = GSignin.GoogleSignin;
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com",
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }
} catch (e) {
  console.log("Native Google Sign-in not loaded. Using WebBrowser OAuth fallback.");
}

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

export default function LoginScreen() {
  const router = useRouter();
  const loginUser = useAuthStore((state) => state.login);
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [langSheetVisible, setLangSheetVisible] = useState(false);

  const { access, refresh } = useLocalSearchParams();

  useEffect(() => {
    if (access && refresh) {
      handleDeepLinkLogin(
        Array.isArray(access) ? access[0] : access,
        Array.isArray(refresh) ? refresh[0] : refresh
      );
    }
  }, [access, refresh]);

  const handleDeepLinkLogin = async (accessToken: string, refreshToken: string) => {
    setLoading(true);
    try {
      const profileResponse = await apiClient.get("/api/users/profile/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = profileResponse.data;
      await loginUser(accessToken, refreshToken, {
        id: profile.id, username: profile.username, email: profile.email,
        role: (profile.role || "student") as UserRole,
        xp_points: profile.xp_points || 0, streak_days: profile.streak_days || 0,
        profile_photo_url: profile.profile_photo_url,
        banner_image_url: profile.banner_image_url, bio: profile.bio,
      });
      useToastStore.getState().show({ type: "success", text1: t("welcome_back"), text2: `${t("logged_in_as")} ${profile.username}.` });
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || "Deep link login failed.";
      useToastStore.getState().show({ type: "error", text1: t("login_failed"), text2: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      useToastStore.getState().show({ type: "error", text1: t("required"), text2: t("fill_all_fields") });
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post("/api/users/login/", { username: email, password });
      const { access, refresh } = response.data;
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
      useToastStore.getState().show({ type: "success", text1: t("welcome_back"), text2: `${t("logged_in_as")} ${profile.username}.` });
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.response?.data?.error || "Login failed.";
      useToastStore.getState().show({ type: "error", text1: t("login_failed"), text2: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    setLoading(true);
    try {
      if (GoogleSignin) {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const idToken = userInfo.data?.idToken || userInfo.idToken;
        if (!idToken) {
          throw new Error("No ID Token received from Google Native Sign-In.");
        }
        await submitGoogleToken(idToken, "id_token");
      } else {
        const redirectUrl = Linking.createURL("/(auth)/login");
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
            await handleDeepLinkLogin(
              Array.isArray(accessToken) ? accessToken[0] : accessToken,
              Array.isArray(refreshToken) ? refreshToken[0] : refreshToken
            );
          } else {
            throw new Error("Tokens not found in redirect URL.");
          }
        } else {
          useToastStore.getState().show({ type: "info", text1: t("info") || "Info", text2: t("google_cancelled") });
        }
      }
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || "Google Login failed.";
      useToastStore.getState().show({ type: "error", text1: t("login_failed"), text2: msg });
    } finally {
      setLoading(false);
    }
  };

  const submitGoogleToken = async (token: string, tokenType: "id_token" | "access_token") => {
    const response = await apiClient.post("/api/users/google-login/", {
      token,
      token_type: tokenType,
    });
    const { tokens, user: profile } = response.data;
    await loginUser(tokens.access, tokens.refresh, {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      role: (profile.role || "student") as any,
      xp_points: profile.xp_points || 0,
      streak_days: profile.streak_days || 0,
      profile_photo_url: profile.profile_photo_url,
      banner_image_url: profile.banner_image_url,
      bio: profile.bio,
    });
    useToastStore.getState().show({ type: "success", text1: t("welcome") || "Welcome!", text2: t("google_success") });
  };

  const bg = colors.background;
  const card = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

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
            {t("login_welcome")}
          </Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: textSecondary, lineHeight: 22, textAlign: isRtl ? "right" : "left" }}>
            {t("login_subtitle")}
          </Text>
        </View>

        {/* Form Container */}
        <View style={{ paddingHorizontal: 24 }}>
          {/* Email */}
          <Input
            label={t("email_address")}
            placeholder="nazmulshanto90@gmail.com"
            value={email}
            onChangeText={setEmail}
            leftIcon="mail-outline"
            colors={colors}
          />

          {/* Password */}
          <Input
            label={t("password")}
            placeholder={isRtl ? "أدخل كلمة المرور" : "Enter your password"}
            value={password}
            onChangeText={setPassword}
            leftIcon="lock-closed-outline"
            secureTextEntry
            colors={colors}
            rightAction={
              <Pressable>
                <Text style={{ color: interactiveAccent, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                  {t("forgot_password")}
                </Text>
              </Pressable>
            }
          />

          {/* Action Row: Login Button + Language Sheet Selector */}
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 12, marginTop: 10, marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Button
                label={loading ? t("logging_in") : t("login")}
                variant="primary"
                limeStyle
                loading={loading}
                colors={colors}
                onPress={handleLogin}
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
              label={isRtl ? "تسجيل الدخول باستخدام Apple" : "Login with Apple"}
              variant="outline"
              leftIcon={<Ionicons name="logo-apple" size={20} color={textPrimary} />}
              colors={colors}
            />
            <Button
              label={isRtl ? "تسجيل الدخول باستخدام Google" : "Login with Google"}
              variant="outline"
              leftIcon={<Ionicons name="logo-google" size={20} color="#DB4437" />}
              colors={colors}
              onPress={handleGooglePress}
            />
          </View>

          {/* Sign Up Link */}
          <Pressable 
            onPress={() => router.push("/(auth)/register")} 
            style={{ alignItems: "center" }}
          >
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 14 }}>
              {isRtl ? "ليس لديك حساب؟ " : "Don't have an account? "}{" "}
              <Text style={{ color: interactiveAccent, fontFamily: "Inter_700Bold" }}>
                {isRtl ? "سجل الآن" : "Sign up"}
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