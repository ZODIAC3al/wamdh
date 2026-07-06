import React, { useState } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet, Image, Alert, ActivityIndicator, Modal, Share
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { apiClient } from "../../../lib/api";
import { useAuthStore } from "../../../store/authStore";
import { useWamdh } from "../../../context/WamdhContext";
import QRCode from "react-native-qrcode-svg";

const RED = "#EF4444";

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const { colors, isDark: dark, t, isRtl, refreshUser } = useWamdh();

  const PRIMARY = colors.accent;
  const [isUploading, setIsUploading] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          }
        }
      ]
    );
  };

  const pickAndUploadImage = async (type: "profile" | "banner") => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Denied", "Camera roll access required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "profile" ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (result.canceled) return;
    const img = result.assets[0];
    const form = new FormData();
    const fieldName = type === "profile" ? "profile_photo" : "banner_image";
    form.append(fieldName, { uri: img.uri, name: `${type}.jpg`, type: "image/jpeg" } as any);
    setIsUploading(true);
    try {
      const endpoint = type === "profile" ? "/api/users/profile/photo/" : "/api/users/profile/banner/";
      const r = await apiClient.post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const u = r.data.user || r.data;
      if (u) {
        setUser({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          xp_points: u.xp_points || 0,
          streak_days: u.streak_days || 0,
          profile_photo_url: u.profile_photo_url,
          banner_image_url: u.banner_image_url,
          bio: u.bio,
        });
      }
      refreshUser();
      Alert.alert("Success", `${type === "profile" ? "Profile photo" : "Cover banner"} updated successfully.`);
    } catch (err) {
      Alert.alert("Upload Failed", "Could not upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Banner */}
        <Pressable onPress={() => pickAndUploadImage("banner")} style={styles.bannerContainer}>
          {user?.banner_image_url ? (
            <Image source={{ uri: user.banner_image_url }} style={styles.bannerImage} />
          ) : (
            <View style={[styles.bannerPlaceholder, { backgroundColor: PRIMARY }]} />
          )}
          <View style={[styles.backBtnWrapper, { left: isRtl ? undefined : 16, right: isRtl ? 16 : undefined }]}>
            <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
              <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={[styles.editBannerBadge, { right: isRtl ? undefined : 12, left: isRtl ? 12 : undefined }]}>
            <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
          </View>
        </Pressable>

        {/* Profile Header Card */}
        <View style={{ paddingHorizontal: 20, marginTop: -40 }}>
          <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Pressable onPress={() => pickAndUploadImage("profile")} style={[styles.avatarCircle, { backgroundColor: PRIMARY + "20", borderColor: cardBg }]}>
              {user?.profile_photo_url ? (
                <Image source={{ uri: user.profile_photo_url }} style={styles.avatarImage} />
              ) : (
                <Text style={{ color: PRIMARY, fontFamily: "Sora_700Bold", fontSize: 28 }}>
                  {user?.username?.charAt(0).toUpperCase() || "A"}
                </Text>
              )}
              {isUploading && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }]}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={12} color="#FFFFFF" />
              </View>
            </Pressable>

            <Text style={[styles.userName, { color: textPrimary }]}>{user?.username || "Admin Officer"}</Text>
            
            <View style={[styles.badge, { flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", gap: 4 }]}>
              <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
              <Text style={styles.badgeText}>
                {isRtl ? "مسؤول النظام" : "Admin Officer"}
              </Text>
            </View>

            <Text style={[styles.bioText, { color: textSecondary }]}>
              {user?.bio || (isRtl ? "مسؤول النظام. مستوى الوصول: تحكم كامل في لوحة المنصة." : "System Administrator. Access level: Full Platform Console Control.")}
            </Text>
          </View>
        </View>

        {/* Admin Settings Options */}
        <View style={{ padding: 20, gap: 12 }}>
          <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
            {isRtl ? "عمليات النظام" : "System Operations"}
          </Text>

          <Pressable
            onPress={() => router.push("/(admin)/settings" as any)}
            style={[styles.menuItem, { backgroundColor: cardBg, borderColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}
          >
            <View style={[styles.menuIcon, { backgroundColor: PRIMARY + "15" }]}>
              <Ionicons name="settings-outline" size={18} color={PRIMARY} />
            </View>
            <View style={{ flex: 1, marginLeft: isRtl ? 0 : 12, marginRight: isRtl ? 12 : 0, alignItems: isRtl ? "flex-end" : "flex-start" }}>
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? "إعدادات النظام" : "System Settings"}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? "تكوين حدود ومعلمات الذكاء الاصطناعي" : "Configure AI limits & parameters"}
              </Text>
            </View>
            <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color={textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => setQrVisible(true)}
            style={[styles.menuItem, { backgroundColor: cardBg, borderColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}
          >
            <View style={[styles.menuIcon, { backgroundColor: PRIMARY + "15" }]}>
              <Ionicons name="qr-code-outline" size={18} color={PRIMARY} />
            </View>
            <View style={{ flex: 1, marginLeft: isRtl ? 0 : 12, marginRight: isRtl ? 12 : 0, alignItems: isRtl ? "flex-end" : "flex-start" }}>
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? "رمز الاستجابة السريعة" : "Share Profile QR"}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? "عرض رمز الاستجابة السريعة لمسحه ضوئياً" : "Show QR code for others to scan"}
              </Text>
            </View>
            <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color={textSecondary} />
          </Pressable>

          <Pressable
            onPress={handleLogout}
            style={[styles.menuItem, { backgroundColor: cardBg, borderColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}
          >
            <View style={[styles.menuIcon, { backgroundColor: RED + "15" }]}>
              <Ionicons name="log-out-outline" size={18} color={RED} />
            </View>
            <View style={{ flex: 1, marginLeft: isRtl ? 0 : 12, marginRight: isRtl ? 12 : 0, alignItems: isRtl ? "flex-end" : "flex-start" }}>
              <Text style={{ color: RED, fontFamily: "Inter_700Bold", fontSize: 13, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? "تسجيل الخروج" : "Sign Out"}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? "إغلاق جلسة مسؤول النظام بأمان" : "Close admin officer session securely"}
              </Text>
            </View>
            <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color={textSecondary} />
          </Pressable>
        </View>
      </ScrollView>

      {/* ── QR Code Modal ───────────────────────── */}
      <Modal
        visible={qrVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ backgroundColor: cardBg, borderRadius: 24, padding: 24, width: "100%", maxWidth: 340, alignItems: "center", borderWidth: 1, borderColor: cardBorder }}>
            {/* Header */}
            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", width: "100%", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>
                {isRtl ? "رمز الاستجابة السريعة" : "Profile QR Code"}
              </Text>
              <Pressable onPress={() => setQrVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </Pressable>
            </View>

            {/* Profile Detail Badge */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: PRIMARY + "20", alignItems: "center", justifyContent: "center", marginBottom: 8, overflow: "hidden" }}>
                {user?.profile_photo_url ? (
                  <Image source={{ uri: user.profile_photo_url }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                ) : (
                  <Text style={{ color: PRIMARY, fontFamily: "Sora_700Bold", fontSize: 24 }}>
                    {user?.username?.charAt(0).toUpperCase() || "A"}
                  </Text>
                )}
              </View>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>{user?.username}</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, textTransform: "capitalize", marginTop: 2 }}>
                {isRtl ? "مسؤول النظام" : "Admin"}
              </Text>
            </View>

            {/* QR Code Graphic Container */}
            <View style={{ backgroundColor: "#FFFFFF", padding: 16, borderRadius: 16, marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 }}>
              <QRCode
                value={`wamdh://profile/${user?.id}`}
                size={180}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>

            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", marginBottom: 24, paddingHorizontal: 12 }}>
              {isRtl ? "دع الآخرين يمسحون الرمز للتواصل مع حساب مسؤول النظام الخاص بك في ومضة" : "Let others scan this code to connect with your Wamdh admin account"}
            </Text>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              <Pressable
                onPress={async () => {
                  const deepLink = `wamdh://profile/${user?.id}`;
                  await Share.share({
                    message: isRtl 
                      ? `تواصل معي على منصة ومضة التعليمية!\n${deepLink}`
                      : `Connect with me on Wamdh Study Platform!\n${deepLink}`
                  });
                }}
                style={{ flex: 1, backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: dark ? "#000" : "#fff", fontFamily: "Inter_700Bold", fontSize: 13 }}>
                  {isRtl ? "مشاركة الرابط" : "Share Link"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bannerContainer: { width: "100%", height: 140, position: "relative" },
  bannerPlaceholder: { width: "100%", height: "100%" },
  bannerImage: { width: "100%", height: "100%" },
  backBtnWrapper: { position: "absolute", top: 48, left: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  editBannerBadge: { position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(0,0,0,0.5)", width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  profileCard: { padding: 20, borderRadius: 20, borderWidth: 1, alignItems: "center" },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, alignItems: "center", justifyContent: "center", marginTop: -60, overflow: "hidden", position: "relative" },
  avatarImage: { width: "100%", height: "100%" },
  editAvatarBadge: { position: "absolute", bottom: 0, right: 0, left: 0, height: 22, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  userName: { fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 10 },
  badge: { backgroundColor: "rgba(38, 38, 38, 0.08)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 6 },
  badgeText: { color: "#262626", fontFamily: "Inter_700Bold", fontSize: 11 },
  bioText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 12, lineHeight: 18 },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 14, marginBottom: 12 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }
});
