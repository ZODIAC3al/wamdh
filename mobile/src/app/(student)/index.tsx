import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, Pressable, Image,
  ActivityIndicator, useColorScheme, StyleSheet,
  Dimensions, TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api";
import { useWamdh } from "../../context/WamdhContext";
import LanguageBottomSheet from "../../components/LanguageBottomSheet";

// Week calendar helpers
function getWeekDates() {
  const today = new Date();
  const dow = today.getDay(); // 0 = Sun
  const mondayDiff = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayDiff);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, dayNum: d.getDate(), dateStr: d.toISOString().split("T")[0] };
  });
}

export default function StudentDashboard() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { openHub } = useUiStore();
  const {
    colors,
    isDark: dark,
    locale,
    t,
    user,
    setThemeMode,
  } = useWamdh();
  const [langSheetVisible, setLangSheetVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;
  const ACCENT_LIGHT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const inputBg = colors.inputBg;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const todayStr = new Date().toISOString().split("T")[0];
  const weekDays = getWeekDates();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await apiClient.get("/api/users/profile/")).data,
    staleTime: 0,
    refetchOnMount: "always",
  });
  useEffect(() => { if (profile) setUser(profile); }, [profile]);

  const { data: todayTasks, isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["today-tasks"],
    queryFn: async () => (await apiClient.get("/api/planner/today/")).data,
  });

  const { data: notesData, isLoading: notesLoading } = useQuery<any[]>({
    queryKey: ["notes"],
    queryFn: async () => (await apiClient.get("/api/notes/")).data,
  });

  const { data: weeklyData } = useQuery<any[]>({
    queryKey: ["weekly-study-dashboard"],
    queryFn: async () => (await apiClient.get("/api/analytics/weekly/")).data,
  });

  const { data: decks } = useQuery<any[]>({
    queryKey: ["decks"],
    queryFn: async () => (await apiClient.get("/api/flashcards/")).data,
  });

  const { data: recommendations } = useQuery<any[]>({
    queryKey: ["recommendations"],
    queryFn: async () => (await apiClient.get("/api/analytics/recommendations/")).data,
  });

  const { data: predictions } = useQuery<any>({
    queryKey: ["predictions"],
    queryFn: async () => (await apiClient.get("/api/analytics/predict/")).data,
  });

  const { data: studyTip } = useQuery<any>({
    queryKey: ["study-tip"],
    queryFn: async () => (await apiClient.get("/api/ai/study-tip/")).data,
  });

  const totalMinutes = weeklyData?.reduce((a, c) => a + (c.minutes || 0), 0) || 0;
  const totalHours = totalMinutes / 60;
  const progressPercent = Math.min(100, Math.round((totalHours / 4) * 100));
  const recentNotes = (notesData || []).slice(0, 3);
  const tasks = todayTasks || [];

  const getSubjectColor = (sub: string) => {
    const hash = (sub || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return ["#F7D87F", "#10B981", ACCENT, "#EF4444", "#3B82F6", "#06B6D4"][hash % 6];
  };

  const isRtl = locale === "ar";

  return (
    <>
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* ── Marketplace Header (Photoroom / Bing Style) ── */}
      <View style={[
        styles.header,
        {
          backgroundColor: colors.cardBg,
          borderBottomColor: cardBorder,
          flexDirection: isRtl ? "row-reverse" : "row"
        }
      ]}>
        <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={() => router.push("/(student)/profile")}
            style={[styles.avatar, { backgroundColor: ACCENT, overflow: "hidden" }]}
          >
            {user?.profile_photo_url ? (
              <Image source={{ uri: user.profile_photo_url }} style={{ width: "100%", height: "100%" }} />
            ) : (
              <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Sora_700Bold", fontSize: 16 }}>
                {user?.username?.charAt(0).toUpperCase() || "S"}
              </Text>
            )}
          </Pressable>
          <View style={{ alignItems: isRtl ? "flex-end" : "flex-start" }}>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
              {t("welcome")},
            </Text>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 1 }}>
              {user?.username || "Student"}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
          {/* Pro Premium Badge */}
          <Pressable
            onPress={() => router.push("/(student)/premium")}
            style={[styles.proBadge, { backgroundColor: dark ? "#1F1F3E" : "#EEF2F6" }]}
          >
            <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 11 }}>
              Pro ✓
            </Text>
          </Pressable>

          {/* Theme Mode Selector Button */}
          <Pressable
            onPress={() => setThemeMode(dark ? "light" : "dark")}
            style={[styles.circleButton, { borderColor: cardBorder }]}
          >
            <Ionicons name={dark ? "sunny-outline" : "moon-outline"} size={20} color={ACCENT} />
          </Pressable>

          {/* Language Selector Bottom Sheet Trigger */}
          <Pressable
            onPress={() => setLangSheetVisible(true)}
            style={[styles.circleButton, { borderColor: cardBorder }]}
          >
            <Ionicons name="globe-outline" size={20} color={ACCENT} />
          </Pressable>

          {/* Notifications Icon */}
          <Pressable
            onPress={() => router.push("/(student)/messages")}
            style={[styles.circleButton, { borderColor: cardBorder }]}
          >
            <Ionicons name="notifications-outline" size={20} color={textPrimary} />
            <View style={[styles.notificationDot, { backgroundColor: ACCENT }]} />
          </Pressable>
        </View>
      </View>

      {/* ── Search Bar Input Area ──────────────────────── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <View style={[styles.searchBarContainer, { backgroundColor: inputBg, flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <Ionicons name="search-outline" size={18} color={textSecondary} style={{ marginHorizontal: 10 }} />
          <TextInput
            placeholder={isRtl ? "ابحث عن الملاحظات، الاختبارات والمهام..." : "Search notes, quizzes, tasks..."}
            placeholderTextColor={textSecondary}
            style={[styles.searchInput, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}
          />
        </View>
      </View>

      {/* ── Horizontal Filter Badges ────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: isRtl ? "row-reverse" : "row" }}
      >
        {["All", "Notes", "Quizzes", "Flashcards", "Planner"].map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterPill,
                isActive ? { backgroundColor: ACCENT } : { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1 },
                { marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }
              ]}
            >
              <Text style={{
                color: isActive ? (dark ? "#000000" : "#FFFFFF") : textPrimary,
                fontFamily: "Inter_500Medium",
                fontSize: 13
              }}>
                {isRtl ? (
                  filter === "All" ? "الكل" :
                  filter === "Notes" ? "الملاحظات" :
                  filter === "Quizzes" ? "الاختبارات" :
                  filter === "Flashcards" ? "الفلاش كارد" : "الجدول"
                ) : filter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 20 }}>
        {/* ── Bing-Style Metrics Card ───────────────────── */}
        <View style={[styles.bingCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.bingRow, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <View style={styles.bingCol}>
              <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 4 }}>
                {user?.xp_points || 0}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                {isRtl ? "نقاط الخبرة" : "Total XP"}
              </Text>
            </View>

            <View style={[styles.bingDivider, { backgroundColor: cardBorder }]} />

            <View style={styles.bingCol}>
              <Ionicons name="flash-outline" size={24} color="#EF4444" />
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 4 }}>
                {user?.streak_days || 0} {isRtl ? "أيام" : "Days"}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                {isRtl ? "سلسلة النشاط" : "Daily Streak"}
              </Text>
            </View>

            <View style={[styles.bingDivider, { backgroundColor: cardBorder }]} />

            <View style={styles.bingCol}>
              <Ionicons name="checkbox-outline" size={24} color="#10B981" />
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 4 }}>
                {notesData?.length || 0} / {decks?.length || 0}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                {isRtl ? "الملخصات / الحزم" : "Notes / Decks"}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Your Progress ──────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
          {isRtl ? "تقدمك الدراسي" : "Your Progress"}
        </Text>
        {notesLoading ? (
          <ActivityIndicator size="small" color={ACCENT} style={{ marginBottom: 16 }} />
        ) : recentNotes.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="document-text-outline" size={28} color="#6B7280" />
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8, textAlign: "center" }}>
              {isRtl ? "لم يتم رفع أي ملاحظات بعد" : "No notes uploaded yet"}
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
            {recentNotes.map((note) => (
              <Pressable
                key={note.id}
                onPress={() => router.push({ pathname: "/(student)/notes/[id]", params: { id: note.id } })}
                style={[styles.progressCard, { backgroundColor: cardBg, borderColor: cardBorder, alignItems: isRtl ? "flex-end" : "flex-start" }]}
              >
                <View style={[styles.progressIcon, { backgroundColor: getSubjectColor(note.subject) + "30", alignSelf: isRtl ? "flex-end" : "flex-start" }]}>
                  <Ionicons name="document-text-outline" size={22} color={getSubjectColor(note.subject)} />
                </View>
                <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 10, textAlign: isRtl ? "right" : "left" }} numberOfLines={2}>
                  {note.title}
                </Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4, textAlign: isRtl ? "right" : "left" }}>
                  {note.word_count || 0} {isRtl ? "كلمة ·" : "words ·"} {note.subject}
                </Text>
                <View style={{ height: 4, width: "100%", borderRadius: 2, backgroundColor: inputBg, marginTop: 12 }}>
                  <View style={{ width: "70%", height: 4, borderRadius: 2, backgroundColor: ACCENT, alignSelf: isRtl ? "flex-end" : "flex-start" }} />
                </View>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 4, textAlign: isRtl ? "right" : "left" }}>
                  {isRtl ? "جاهز للدراسة" : "Ready to study"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── Quick Actions ──────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
          {isRtl ? "إجراءات سريعة" : "Quick Actions"}
        </Text>
        <View style={[styles.actionsGrid, { flexDirection: isRtl ? "row-reverse" : "row", flexWrap: "wrap" }]}>
          {[
            { label: isRtl ? "كتابة ملاحظة" : "Write Note", sub: isRtl ? "محرر سريع" : "Quick editor", icon: "pencil-outline", color: ACCENT, route: "/(student)/notes/write" },
            { label: isRtl ? "تدرب على اختبار" : "Practice Quiz", sub: isRtl ? "توليد ذكي" : "Random AI", icon: "game-controller-outline", color: "#10B981", route: "/(student)/quiz/practice" },
            { label: isRtl ? "المعلم الذكي" : "AI Chat", sub: isRtl ? "اسأل منى" : "Ask Mona", icon: "sparkles-outline", color: "#F7D87F", route: "/(student)/ai/chat" },
            { label: isRtl ? "الحزم التعليمية" : "Flashcards", sub: isRtl ? "مراجعة الحزم" : "Review decks", icon: "albums-outline", color: "#3B82F6", route: "/(student)/flashcards" },
          ].map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route as any)}
              style={[styles.actionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: item.color + "22", alignSelf: "center" }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 10, textAlign: "center" }}>
                {item.label}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center", marginTop: 2 }}>
                {item.sub}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Wamdh App Hub Button ─────────────────── */}
        <Pressable
          onPress={() => openHub("student")}
          style={[styles.hubLauncherCard, { backgroundColor: dark ? "#1F1F3E" : "#EEEBFF", borderColor: ACCENT + "40", flexDirection: isRtl ? "row-reverse" : "row" }]}
        >
          <View style={[styles.hubLauncherIcon, { backgroundColor: ACCENT }]}>
            <Ionicons name="grid-outline" size={24} color={dark ? "#000000" : "#FFFFFF"} />
          </View>
          <View style={{ flex: 1, marginLeft: isRtl ? 0 : 16, marginRight: isRtl ? 16 : 0, alignItems: isRtl ? "flex-end" : "flex-start" }}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15, textAlign: isRtl ? "right" : "left" }}>
              {isRtl ? "مركز أدوات ومضة" : "Wamdh App Hub"}
            </Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2, textAlign: isRtl ? "right" : "left" }}>
              {isRtl ? "اكتشف أكثر من ٢٥ أداة وميزة متقدمة" : "Explore 25+ advanced tools & features"}
            </Text>
          </View>
          <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={20} color={textSecondary} />
        </Pressable>

        {/* ── Today's Study Plan ─────────────────────── */}
        <View style={[styles.rowBetween, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 0, marginTop: 0 }]}>
            {isRtl ? "جدول اليوم" : "Today's Plan"}
          </Text>
          <Pressable onPress={() => router.push("/(student)/planner")}>
            <Text style={{ color: ACCENT, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              {isRtl ? "عرض الكل" : "View All"}
            </Text>
          </Pressable>
        </View>
        <View style={{ marginTop: 12 }}>
          {tasksLoading ? (
            <ActivityIndicator size="small" color={ACCENT} />
          ) : tasks.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Ionicons name="calendar-outline" size={28} color="#6B7280" />
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8, textAlign: "center" }}>
                {isRtl ? "لا توجد مهام مجدولة اليوم" : "No tasks planned for today"}
              </Text>
            </View>
          ) : (
            tasks.slice(0, 3).map((task: any) => (
              <View key={task.id} style={[styles.taskCard, { backgroundColor: cardBg, borderColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
                <View style={[styles.taskDot, { backgroundColor: getSubjectColor(task.subject), marginLeft: isRtl ? 12 : 0, marginRight: isRtl ? 0 : 12 }]} />
                <View style={{ flex: 1, alignItems: isRtl ? "flex-end" : "flex-start" }}>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14, textAlign: isRtl ? "right" : "left" }}>{task.topic}</Text>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2, textAlign: isRtl ? "right" : "left" }}>
                    {task.subject} · {task.duration_mins} {isRtl ? "دقيقة" : "min"}
                  </Text>
                </View>
                <View style={[styles.taskTimeBadge, { backgroundColor: ACCENT + "20", flexDirection: isRtl ? "row-reverse" : "row" }]}>
                  <Ionicons name="time-outline" size={12} color={ACCENT} />
                  <Text style={{ color: ACCENT, fontFamily: "Inter_500Medium", fontSize: 11, marginLeft: isRtl ? 0 : 4, marginRight: isRtl ? 4 : 0 }}>
                    {task.duration_mins}{isRtl ? "د" : "m"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Weekly Goal Ring ──────────────────────── */}
        <View style={[styles.goalCard, { backgroundColor: cardBg, borderColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <View style={{ flex: 1, paddingRight: isRtl ? 0 : 16, paddingLeft: isRtl ? 16 : 0, alignItems: isRtl ? "flex-end" : "flex-start" }}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, textAlign: isRtl ? "right" : "left" }}>
              {isRtl ? "الهدف الأسبوعي" : "Weekly Goal"}
            </Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4, lineHeight: 18, textAlign: isRtl ? "right" : "left" }}>
              {isRtl ? "أكمل ٤ ساعات من الدراسة للحفاظ على سلسلة نشاطك." : "Complete 4 hours of studying to maintain your streak."}
            </Text>
            <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 14, marginTop: 10, textAlign: isRtl ? "right" : "left" }}>
              {totalHours.toFixed(1)} / ٤ {isRtl ? "ساعات" : "hrs"} · {progressPercent}%
            </Text>
          </View>
          <View style={styles.ringOuter}>
            <View style={[styles.ringInner, { borderTopColor: ACCENT, borderRightColor: ACCENT }]} />
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>{progressPercent}%</Text>
          </View>
        </View>

        {/* ── AI Study Tip ──────────────────────────── */}
        {studyTip?.tip ? (
          <View style={[styles.tipCard, { backgroundColor: dark ? "#1F1A12" : "#F8EBAB25", borderColor: dark ? "#4A3F2A" : "#F7D87F", alignItems: isRtl ? "flex-end" : "flex-start" }]}>
            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", marginBottom: 6 }}>
              <Ionicons name="bulb" size={18} color={dark ? "#F7D87F" : "#D0311E"} style={{ marginRight: isRtl ? 0 : 6, marginLeft: isRtl ? 6 : 0 }} />
              <Text style={{ color: dark ? "#F7D87F" : "#D0311E", fontFamily: "Sora_700Bold", fontSize: 13 }}>
                {t("study_tip")}
              </Text>
            </View>
            <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, textAlign: isRtl ? "right" : "left" }}>
              {studyTip.tip}
            </Text>
          </View>
        ) : null}

        {/* ── Predictive Analytics Indicators ───────── */}
        {predictions ? (
          <View style={[styles.analyticsCard, { backgroundColor: cardBg, borderColor: cardBorder, alignItems: isRtl ? "flex-end" : "flex-start" }]}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginBottom: 12, textAlign: isRtl ? "right" : "left" }}>
              {isRtl ? "رؤى التنبؤ بالذكاء الاصطناعي" : "AI Predictive Insights"}
            </Text>
            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 10, flexWrap: "wrap" }}>
              <View style={[styles.badge, { backgroundColor: "#10B98120" }]}>
                <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold", fontSize: 11 }}>
                  {isRtl ? "الدرجة المتوقعة:" : "Predicted score:"} {predictions.predicted_exam_score}%
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: ACCENT + "20" }]}>
                <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                  {isRtl ? "مخاطر الإرهاق:" : "Burnout risk:"} {predictions.burnout_risk}
                </Text>
              </View>
            </View>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 10, textAlign: isRtl ? "right" : "left" }}>
              {predictions.insights?.[0]}
            </Text>
          </View>
        ) : null}

        {/* ── Netflix-Style Study Recommendations ───── */}
        {recommendations && recommendations.length > 0 ? (
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 12, textAlign: isRtl ? "right" : "left" }]}>
              {t("recommendations")}
            </Text>
            {recommendations.map((rec) => (
              <Pressable
                key={rec.id}
                onPress={() => router.push(rec.type === "quiz" ? "/(student)/quiz" : "/(student)/flashcards")}
                style={[styles.recCard, { backgroundColor: cardBg, borderColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}
              >
                <View style={[styles.recIcon, { backgroundColor: rec.type === "quiz" ? "#10B98115" : "#3B82F615" }]}>
                  <Ionicons
                    name={rec.type === "quiz" ? "help-circle-outline" : "albums-outline"}
                    size={20}
                    color={rec.type === "quiz" ? "#10B981" : "#3B82F6"}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: isRtl ? 0 : 12, marginRight: isRtl ? 12 : 0, alignItems: isRtl ? "flex-end" : "flex-start" }}>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, textAlign: isRtl ? "right" : "left" }}>
                    {rec.title}
                  </Text>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2, textAlign: isRtl ? "right" : "left" }}>
                    {rec.reason}
                  </Text>
                </View>
                <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color={textSecondary} />
              </Pressable>
            ))}
          </View>
        ) : null}

      </View>
    </ScrollView>
    <LanguageBottomSheet visible={langSheetVisible} onClose={() => setLangSheetVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
  },
  proBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#BE1A1A",
  },
  searchBarContainer: {
    borderRadius: 24,
    height: 46,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    height: "100%",
  },
  filterPill: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  bingCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  bingRow: {
    justifyContent: "space-around",
    alignItems: "center",
  },
  bingCol: {
    alignItems: "center",
    flex: 1,
  },
  bingDivider: {
    width: 1,
    height: 40,
  },
  calendarCard: {
    marginHorizontal: 20, marginTop: 16, borderRadius: 16,
    borderWidth: 1, paddingVertical: 16,
  },
  calendarRow: { paddingHorizontal: 12, gap: 4 },
  dayCol: { alignItems: "center", paddingHorizontal: 10 },
  dayCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  todayDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: "#BE1A1A", marginTop: 4,
  },
  streakCard: {
    borderRadius: 20, padding: 20, marginTop: 20, marginBottom: 8,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    overflow: "hidden", position: "relative",
  },
  streakBubble: {
    position: "absolute", right: -30, bottom: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  streakIconBox: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 24, marginBottom: 14,
  },
  progressCard: {
    width: 180, borderRadius: 16, padding: 16, marginRight: 12,
    borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  progressIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  actionsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8,
  },
  actionCard: {
    width: "47%", borderRadius: 16, padding: 18, borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  actionIcon: {
    width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center",
  },
  rowBetween: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24,
  },
  taskCard: {
    flexDirection: "row", alignItems: "center", borderRadius: 14,
    padding: 14, marginBottom: 10, borderWidth: 1,
  },
  taskDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  taskTimeBadge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  goalCard: {
    flexDirection: "row", alignItems: "center", borderRadius: 16,
    padding: 20, marginTop: 24, borderWidth: 1,
  },
  ringOuter: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 6, borderColor: "#E5E7EB",
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  ringInner: {
    position: "absolute", width: 72, height: 72, borderRadius: 36,
    borderWidth: 6, borderColor: "transparent",
    borderTopColor: "#BE1A1A", borderRightColor: "#BE1A1A",
    transform: [{ rotate: "-45deg" }],
  },
  emptyCard: {
    borderRadius: 16, padding: 24, borderWidth: 1, alignItems: "center", marginBottom: 16,
  },
  featureRow: { flexDirection: "row", gap: 10 },
  featureBtn: {
    flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  hubLauncherCard: {
    flexDirection: "row", alignItems: "center", borderRadius: 16,
    padding: 16, marginTop: 16, marginBottom: 8, borderWidth: 1,
    shadowColor: "#BE1A1A", shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  hubLauncherIcon: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  categoryTitle: {
    fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 12, marginTop: 8,
  },
  hubGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
  },
  hubCard: {
    width: (Dimensions.get("window").width - 50) / 2, borderRadius: 14,
    padding: 12, borderWidth: 1,
  },
  hubIconBg: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  langToggle: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  analyticsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  recIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
