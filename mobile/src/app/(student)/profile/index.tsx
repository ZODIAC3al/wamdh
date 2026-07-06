import React, { useState } from "react";
import {
  View, Text, Pressable, ScrollView, Image,
  TextInput, Alert, ActivityIndicator, StyleSheet,
  Share, Modal
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../../store/authStore";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { queryClient } from "../../../lib/queryClient";
import * as ImagePicker from "expo-image-picker";
import { useWamdh } from "../../../context/WamdhContext";
import QRCode from "react-native-qrcode-svg";

const YELLOW = "#FACC15";

// ── Circular Progress Ring ────────────────────────────────
function ProgressRing({
  percent,
  size = 90,
  stroke = 8,
  color,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const { colors } = useWamdh();
  const ringColor = color || colors.accent;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);
  const inner = size - stroke * 2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Background ring */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: ringColor + "22",
        }}
      />
      {/* Filled arc (approximation using overlapping views) */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: "transparent",
          borderTopColor: percent > 0 ? ringColor : "transparent",
          borderRightColor: percent > 25 ? ringColor : "transparent",
          borderBottomColor: percent > 50 ? ringColor : "transparent",
          borderLeftColor: percent > 75 ? ringColor : "transparent",
          transform: [{ rotate: "-90deg" }],
        }}
      />
      <View style={{ alignItems: "center" }}>
        <Text style={{ color: colors.accent, fontFamily: "Sora_700Bold", fontSize: 16 }}>
          {percent}%
        </Text>
        <Text style={{ color: "#9CA3AF", fontFamily: "Inter_400Regular", fontSize: 9, textAlign: "center", marginTop: 1 }}>
          of your{"\n"}goal
        </Text>
      </View>
    </View>
  );
}

export default function StudentProfile() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { colors, isDark: dark, user, refreshUser, logout, isRtl, t } = useWamdh();

  const ACCENT = colors.accent;
  const bg = colors.background;
  const card = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || "");
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const { data: notes } = useQuery<any[]>({
    queryKey: ["notes"],
    queryFn: async () => (await apiClient.get("/api/notes/")).data,
  });

  const { data: summary } = useQuery<any>({
    queryKey: ["analytics-summary"],
    queryFn: async () => (await apiClient.get("/api/analytics/summary/")).data,
  });

  const { data: weeklyData } = useQuery<any[]>({
    queryKey: ["analytics-weekly"],
    queryFn: async () => (await apiClient.get("/api/analytics/weekly/")).data,
  });

  const totalMinutes = weeklyData?.reduce((a, c) => a + (c.minutes || 0), 0) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const goalMinutes = 240; // 4-hour weekly goal
  const goalPercent = Math.min(100, Math.round((totalMinutes / goalMinutes) * 100));
  const recentNotes = (notes || []).slice(0, 4);

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      const res = await apiClient.patch("/api/users/profile/", { bio: bioText });
      const u = res.data;
      if (u) setUser({ id: u.id, username: u.username, email: u.email, role: u.role, xp_points: u.xp_points || 0, streak_days: u.streak_days || 0, profile_photo_url: u.profile_photo_url, banner_image_url: u.banner_image_url, bio: u.bio });
      refreshUser();
      setIsEditingBio(false);
    } catch { Alert.alert("Error", "Failed to update bio."); }
    finally { setIsSavingBio(false); }
  };

  const pickAndUploadImage = async (type: "profile" | "banner") => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission Denied", "Camera roll access required."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled) return;
    const img = result.assets[0];
    const form = new FormData();
    form.append("profile_photo", { uri: img.uri, name: "profile.jpg", type: "image/jpeg" } as any);
    setIsUploading(true);
    try {
      const r = await apiClient.post("/api/users/profile/photo/", form, { headers: { "Content-Type": "multipart/form-data" } });
      const u = r.data.user;
      if (u) setUser({ id: u.id, username: u.username, email: u.email, role: u.role, xp_points: u.xp_points || 0, streak_days: u.streak_days || 0, profile_photo_url: u.profile_photo_url, banner_image_url: u.banner_image_url, bio: u.bio });
      refreshUser();
    } catch { Alert.alert("Upload Failed", "Could not upload image."); }
    finally { setIsUploading(false); }
  };

  const getSubjectColor = (sub: string) => {
    const hash = (sub || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return ["#F7D87F", "#10B981", ACCENT, "#EF4444", "#3B82F6", "#06B6D4"][hash % 6];
  };

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── Top Icons ───────────────────────────── */}
        <View style={[styles.topBar, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <Pressable style={[styles.iconBtn, { backgroundColor: card }]}>
            <Ionicons name="settings-outline" size={20} color={textSecondary} />
          </Pressable>
          <Pressable 
            onPress={() => setQrVisible(true)}
            style={[styles.iconBtn, { backgroundColor: card }]}
          >
            <Ionicons name="qr-code-outline" size={20} color={textSecondary} />
          </Pressable>
        </View>

        {/* ── Avatar + Name Row ───────────────────── */}
        <View style={[styles.profileRow, { backgroundColor: bg, flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <Pressable onPress={() => pickAndUploadImage("profile")} style={[styles.avatar, { borderColor: dark ? "#252540" : "#FFFFFF" }]}>
            {user?.profile_photo_url
              ? <Image source={{ uri: user.profile_photo_url }} style={{ width: "100%", height: "100%", borderRadius: 40 }} />
              : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: "#BE1A1A", borderRadius: 40, alignItems: "center", justifyContent: "center" }]}>
                  <Text style={{ color: "#FFFFFF", fontFamily: "Sora_700Bold", fontSize: 28 }}>
                    {user?.username?.charAt(0).toUpperCase() || "S"}
                  </Text>
                </View>
              )}
            {isUploading && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 40, alignItems: "center", justifyContent: "center" }]}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </Pressable>

          <View style={{ marginLeft: isRtl ? 0 : 16, marginRight: isRtl ? 16 : 0, flex: 1, alignItems: isRtl ? "flex-end" : "flex-start" }}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20 }}>
              {user?.username || "Student Name"}
            </Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 }}>
              {user?.email || "student@studyos.com"}
            </Text>

            {/* Bio */}
            {isEditingBio ? (
              <View style={{ marginTop: 8, width: "100%" }}>
                <TextInput
                  value={bioText}
                  onChangeText={setBioText}
                  placeholder={isRtl ? "أضف سيرة ذاتية..." : "Add a bio..."}
                  placeholderTextColor="#9CA3AF"
                  style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 12, backgroundColor: inputBg, borderRadius: 8, padding: 8, textAlign: isRtl ? "right" : "left" }}
                />
                <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 8, marginTop: 6 }}>
                  <Pressable onPress={() => setIsEditingBio(false)} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, backgroundColor: dark ? "#252540" : "#F3F4F6" }}>
                    <Text style={{ color: textSecondary, fontSize: 11, fontFamily: "Inter_700Bold" }}>
                      {isRtl ? "إلغاء" : "Cancel"}
                    </Text>
                  </Pressable>
                  <Pressable onPress={handleSaveBio} disabled={isSavingBio} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, backgroundColor: "#BE1A1A" }}>
                    {isSavingBio ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                      <Text style={{ color: "#FFFFFF", fontSize: 11, fontFamily: "Inter_700Bold" }}>
                        {isRtl ? "حفظ" : "Save"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => { setBioText(user?.bio || ""); setIsEditingBio(true); }} style={{ marginTop: 4, flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center" }}>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, fontStyle: "italic", textAlign: isRtl ? "right" : "left" }}>
                  {user?.bio || (isRtl ? "اضغط لإضافة سيرة ذاتية..." : "Tap to add a bio...")}
                </Text>
                <Ionicons name="pencil-sharp" size={10} color={ACCENT} style={{ marginLeft: isRtl ? 0 : 4, marginRight: isRtl ? 4 : 0 }} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>

          {/* ── Learning Time Card ──────────────────── */}
          <View style={[styles.learningCard, { backgroundColor: card, borderColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <View style={{ flex: 1, alignItems: isRtl ? "flex-end" : "flex-start" }}>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 6 }}>
                {isRtl ? "وقت الدراسة هذا الأسبوع" : "This week's learning time"}
              </Text>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 36, lineHeight: 40 }}>
                {hours}{isRtl ? "س" : "h"}{" "}
                <Text style={{ fontSize: 28 }}>{String(mins).padStart(2, "0")}{isRtl ? "د" : "m"}</Text>
              </Text>
              <Text style={{ color: "#10B981", fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4 }}>
                {goalPercent >= 100 ? (isRtl ? "تم تحقيق الهدف! 🎉" : "Goal reached! 🎉") : (isRtl ? "واصل التقدم!" : "Keep going!")}
              </Text>

              <Pressable
                onPress={() => router.push("/(student)/planner")}
                style={[styles.scheduleBtn, { backgroundColor: dark ? "#252540" : "#111827" }]}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 13 }}>
                  {isRtl ? "عرض الجدول" : "View schedule"}
                </Text>
              </Pressable>
            </View>

            {/* Progress ring */}
            <ProgressRing percent={goalPercent} size={90} stroke={9} color={ACCENT} />
          </View>

          {/* ── Quick Stats Row ──────────────────────── */}
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 10, marginBottom: 24 }}>
            {[
              { label: isRtl ? "ملاحظات" : "Notes", value: notes?.length || 0, icon: "document-text", color: "#BE1A1A" },
              { label: isRtl ? "اختبارات" : "Quizzes", value: summary?.quizzes_taken || 0, icon: "checkbox", color: "#10B981" },
              { label: isRtl ? "مستمر" : "Streak", value: `${user?.streak_days || 0}${isRtl ? "ي" : "d"}`, icon: "flash", color: YELLOW },
              { label: isRtl ? "نقاط" : "XP", value: user?.xp_points || 0, icon: "star", color: "#F7D87F" },
            ].map((stat) => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: card, borderColor: cardBorder }]}>
                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 6 }}>
                  {stat.value}
                </Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 1 }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* ── My Notes ──────────────────────────────── */}
          <View style={[styles.sectionHeader, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18 }}>
              {isRtl ? "ملاحظاتي" : "My Notes"}
            </Text>
            <Pressable onPress={() => router.push("/(student)/notes")}>
              <Text style={{ color: "#BE1A1A", fontFamily: "Inter_500Medium", fontSize: 13 }}>
                {isRtl ? "عرض الكل" : "View all"}
              </Text>
            </Pressable>
          </View>

          {recentNotes.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: card, borderColor: cardBorder }]}>
              <Ionicons name="document-text-outline" size={36} color="#374151" />
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8, textAlign: "center" }}>
                {isRtl ? "لم يتم رفع أي ملاحظات بعد" : "No notes uploaded yet"}
              </Text>
            </View>
          ) : (
            <View style={[styles.notesGrid, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
              {recentNotes.map((note) => {
                const color = getSubjectColor(note.subject);
                return (
                  <Pressable
                    key={note.id}
                    onPress={() => router.push({ pathname: "/(student)/notes/[id]", params: { id: note.id } })}
                    style={[styles.noteCard, { backgroundColor: card, borderColor: cardBorder, alignItems: isRtl ? "flex-end" : "flex-start" }]}
                  >
                    {/* Thumbnail placeholder */}
                    <View style={[styles.noteThumbnail, { backgroundColor: color + "22", width: "100%" }]}>
                      <Ionicons name="reader-outline" size={28} color={color} />
                    </View>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 10, textAlign: isRtl ? "right" : "left" }} numberOfLines={2}>
                      {note.title}
                    </Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2, textAlign: isRtl ? "right" : "left" }}>
                      {note.subject} · {note.word_count || 0} {isRtl ? "كلمة" : "words"}
                    </Text>
                    {/* Accent underline */}
                    <View style={[styles.noteAccentLine, { backgroundColor: color }]} />
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* ── Menu Items ────────────────────────────── */}
          <View style={[styles.menuCard, { backgroundColor: card, borderColor: cardBorder }]}>
            {[
              { label: isRtl ? "التحليلات" : "Analytics", sub: isRtl ? "نظرة عامة على الأداء" : "Performance overview", icon: "bar-chart-outline", route: "/(student)/analytics" },
              { label: isRtl ? "جدول الدراسة" : "Study Schedule", sub: isRtl ? "خطط لجلساتك" : "Plan your sessions", icon: "calendar-outline", route: "/(student)/planner" },
              { label: isRtl ? "الحزم التعليمية" : "Flashcards", sub: isRtl ? "المراجعة باستخدام التكرار المتباعد" : "Review with spaced repetition", icon: "albums-outline", route: "/(student)/flashcards" },
              { label: isRtl ? "متجر النقاط" : "XP Shop", sub: isRtl ? "استبدل نقاطك بمميزات وشخصيات جديدة" : "Redeem XP points for themes and personalities", icon: "gift-outline", route: "/(student)/profile/xp-shop" },
            ].map((item, idx, arr) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={[styles.menuItem, { borderBottomColor: cardBorder, borderBottomWidth: idx < arr.length - 1 ? 1 : 0, flexDirection: isRtl ? "row-reverse" : "row" }]}
              >
                <View style={[styles.menuIcon, { backgroundColor: "#BE1A1A" + "15" }]}>
                  <Ionicons name={item.icon as any} size={18} color={ACCENT} />
                </View>
                <View style={{ flex: 1, marginLeft: isRtl ? 0 : 12, marginRight: isRtl ? 12 : 0, alignItems: isRtl ? "flex-end" : "flex-start" }}>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14, textAlign: isRtl ? "right" : "left" }}>{item.label}</Text>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1, textAlign: isRtl ? "right" : "left" }}>{item.sub}</Text>
                </View>
                <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color="#9CA3AF" />
              </Pressable>
            ))}
          </View>

          {/* ── Logout ────────────────────────────────── */}
          <Pressable
            onPress={logout}
            style={[styles.logoutBtn, { flexDirection: isRtl ? "row-reverse" : "row" }]}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }} />
            <Text style={{ color: "#EF4444", fontFamily: "Inter_700Bold", fontSize: 15 }}>
              {isRtl ? "تسجيل الخروج" : "Log Out"}
            </Text>
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
          <View style={{ backgroundColor: card, borderRadius: 24, padding: 24, width: "100%", maxWidth: 340, alignItems: "center", borderWidth: 1, borderColor: cardBorder }}>
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
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: ACCENT + "20", alignItems: "center", justifyContent: "center", marginBottom: 8, overflow: "hidden" }}>
                {user?.profile_photo_url ? (
                  <Image source={{ uri: user.profile_photo_url }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                ) : (
                  <Text style={{ color: ACCENT, fontFamily: "Sora_700Bold", fontSize: 24 }}>
                    {user?.username?.charAt(0).toUpperCase() || "S"}
                  </Text>
                )}
              </View>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>{user?.username}</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, textTransform: "capitalize", marginTop: 2 }}>
                {isRtl ? (user?.role === "student" ? "طالب" : "معلم") : user?.role}
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
              {isRtl ? "دع زملائك يمسحون هذا الرمز للاتصال بحسابك في ومضة" : "Let others scan this code to connect with your Wamdh account"}
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
                style={{ flex: 1, backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center" }}
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  profileRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, elevation: 5,
  },
  learningCard: {
    borderRadius: 20, padding: 22, borderWidth: 1, marginBottom: 16,
    flexDirection: "row", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  scheduleBtn: {
    alignSelf: "flex-start", marginTop: 14,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 50,
  },
  statCard: {
    flex: 1, borderRadius: 14, padding: 12, borderWidth: 1, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  notesGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24,
  },
  noteCard: {
    width: "47.5%", borderRadius: 16, padding: 14, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  noteThumbnail: {
    height: 80, borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  noteAccentLine: {
    height: 3, borderRadius: 2, width: 32, marginTop: 10,
  },
  emptyCard: {
    borderRadius: 16, padding: 32, borderWidth: 1, alignItems: "center", marginBottom: 24,
  },
  menuCard: {
    borderRadius: 18, borderWidth: 1, overflow: "hidden", marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 16,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 50,
    backgroundColor: "#EF444415", borderWidth: 1, borderColor: "#EF444430",
  },
});
