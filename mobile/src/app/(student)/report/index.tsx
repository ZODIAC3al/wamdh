import React from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, Share,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useAuthStore } from "../../../store/authStore";
import { useWamdh } from "../../../context/WamdhContext";

// 30-day heatmap component
function StudyHeatmap({ data, dark }: { data: any[]; dark: boolean }) {
  const { colors } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;
  const textSecondary = colors.textSecondary;
  const intensityColors = [
    colors.inputBg,
    ACCENT + "30",
    ACCENT + "60",
    ACCENT + "90",
    ACCENT,
  ];

  // Group into weeks (5 rows x 7 cols approx)
  const weeks: any[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ gap: 4 }}>
            {week.map((day: any, di: number) => (
              <View
                key={di}
                style={[styles.heatCell, { backgroundColor: intensityColors[day.intensity || 0] }]}
              />
            ))}
          </View>
        ))}
      </View>
      {/* Legend */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 4 }}>
        <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10 }}>Less</Text>
        {intensityColors.map((c, i) => (
          <View key={i} style={[styles.heatCell, { backgroundColor: c }]} />
        ))}
        <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10 }}>More</Text>
      </View>
    </View>
  );
}

export default function WeeklyReport() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const { data: summary, isLoading } = useQuery<any>({
    queryKey: ["analytics-summary"],
    queryFn: async () => (await apiClient.get("/api/analytics/summary/")).data,
  });

  const { data: weekly } = useQuery<any[]>({
    queryKey: ["analytics-weekly"],
    queryFn: async () => (await apiClient.get("/api/analytics/weekly/")).data,
  });

  const { data: heatmap } = useQuery<any[]>({
    queryKey: ["analytics-heatmap"],
    queryFn: async () => (await apiClient.get("/api/analytics/heatmap/")).data,
  });

  const { data: subjects } = useQuery<any[]>({
    queryKey: ["analytics-subjects"],
    queryFn: async () => (await apiClient.get("/api/analytics/subjects/")).data,
  });

  const { data: notes } = useQuery<any[]>({
    queryKey: ["notes"],
    queryFn: async () => (await apiClient.get("/api/notes/")).data,
  });

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={ACCENT} /></View>;
  }

  const totalMinutes = (weekly || []).reduce((a: number, c: any) => a + (c.minutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const bestDay = (weekly || []).reduce((best: any, d: any) => d.minutes > (best?.minutes || 0) ? d : best, null);
  const activeDays = (weekly || []).filter((d: any) => d.minutes > 0).length;
  const topSubject = (subjects || []).reduce((top: any, s: any) => s.total_minutes > (top?.total_minutes || 0) ? s : top, null);

  const handleShare = () => {
    Share.share({
      message: `📊 My Weekly Study Report — وَمْض\n\n⏱️ Study time: ${hours}h ${mins}m\n📅 Active days: ${activeDays}/7\n📚 Notes: ${notes?.length || 0}\n🏆 XP: ${summary?.xp_points || 0}\n🔥 Streak: ${summary?.streak_days || 0} days\n\nDownload وَمْض to track your learning!`,
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20 }}>Weekly Report</Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
            {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </Text>
        </View>
        <Pressable onPress={handleShare} style={[styles.iconBtn, { backgroundColor: ACCENT + "20" }]}>
          <Ionicons name="share-outline" size={20} color={ACCENT} />
        </Pressable>
      </View>

      <View style={{ padding: 16 }}>
        {/* Grade Card */}
        {(() => {
          const grade = totalMinutes >= 300 ? "A" : totalMinutes >= 180 ? "B" : totalMinutes >= 60 ? "C" : "D";
          const gradeColor = totalMinutes >= 300 ? "#10B981" : totalMinutes >= 180 ? ACCENT : totalMinutes >= 60 ? "#F7D87F" : "#EF4444";
          const gradeMsg = { A: "Outstanding week! 🎉", B: "Great effort! 💪", C: "Good start! 📈", D: "Let's improve next week!" }[grade];
          return (
            <View style={[styles.gradeCard, { backgroundColor: gradeColor }]}>
              <View style={[styles.gradeBadge, { backgroundColor: dark ? "#1E1B18" : "#FFFFFF" }]}>
                <Text style={{ color: dark ? "#FFFFFF" : gradeColor, fontFamily: "Sora_700Bold", fontSize: 38 }}>{grade}</Text>
              </View>
              <View style={{ marginLeft: 20, flex: 1 }}>
                <Text style={{ color: dark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 12 }}>Weekly Grade</Text>
                <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Sora_700Bold", fontSize: 22 }}>{gradeMsg}</Text>
                <Text style={{ color: dark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)", fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 4 }}>
                  {hours}h {mins}m studied this week
                </Text>
              </View>
            </View>
          );
        })()}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: "Active Days", value: `${activeDays}/7`, icon: "calendar", color: ACCENT },
            { label: "Best Day", value: bestDay?.day || "—", icon: "trophy", color: "#F7D87F" },
            { label: "Total Notes", value: notes?.length || 0, icon: "document-text", color: "#3B82F6" },
            { label: "XP Earned", value: summary?.xp_points || 0, icon: "star", color: "#10B981" },
            { label: "Streak", value: `${summary?.streak_days || 0}d`, icon: "flame", color: "#EF4444" },
            { label: "Quizzes", value: summary?.quizzes_taken || 0, icon: "checkbox", color: "#8B5CF6" },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Ionicons name={s.icon as any} size={18} color={s.color} />
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 6 }}>{s.value}</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 1 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Daily bar chart */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginBottom: 16 }}>
            Daily Study Time
          </Text>
          {weekly && (
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 100 }}>
              {weekly.map((d: any) => {
                const max = Math.max(...weekly.map((x: any) => x.minutes), 1);
                const h = Math.max(4, (d.minutes / max) * 90);
                return (
                  <View key={d.day} style={{ flex: 1, alignItems: "center" }}>
                    <View style={{ width: "100%", height: h, backgroundColor: d.minutes > 0 ? ACCENT : colors.inputBg, borderRadius: 6 }} />
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 9, marginTop: 4 }}>{d.day}</Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 8 }}>
                      {d.minutes > 0 ? `${d.minutes}m` : ""}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 30-Day Heatmap */}
        {heatmap && heatmap.length > 0 && (
          <View style={[styles.section, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginBottom: 16 }}>
              30-Day Activity Heatmap
            </Text>
            <StudyHeatmap data={heatmap} dark={dark} />
          </View>
        )}

        {/* Top Subject */}
        {topSubject && (
          <View style={[styles.section, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginBottom: 12 }}>
              Subject Focus
            </Text>
            {(subjects || []).slice(0, 5).map((s: any) => {
              const max = Math.max(...(subjects || []).map((x: any) => x.total_minutes), 1);
              const pct = Math.round((s.total_minutes / max) * 100);
              return (
                <View key={s.subject} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 13 }}>{s.subject}</Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                      {Math.round(s.total_minutes / 60)}h {s.total_minutes % 60}m
                    </Text>
                  </View>
                  <View style={[styles.barBg, { backgroundColor: colors.inputBg }]}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: ACCENT }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Share CTA */}
        <Pressable onPress={handleShare} style={[styles.shareCta, { backgroundColor: ACCENT, shadowColor: ACCENT }]}>
          <Ionicons name="share-social" size={20} color={dark ? "#000000" : "#FFFFFF"} style={{ marginRight: 10 }} />
          <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 }}>Share My Report</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  gradeCard: { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", marginBottom: 16 },
  gradeBadge: { width: 70, height: 70, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "30.5%", borderRadius: 14, padding: 12, borderWidth: 1, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  section: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  heatCell: { width: 14, height: 14, borderRadius: 3 },
  barBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  shareCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 50, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
});
