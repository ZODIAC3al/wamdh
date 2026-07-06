import React from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const BAR_COLORS: Record<string, string> = {
  chem: "#F7D87F",
  comp: "#10B981",
  sci: "#10B981",
  math: "#BE1A1A",
  default: "#3B82F6",
};

function getBarColor(sub: string) {
  const s = sub.toLowerCase();
  for (const [key, color] of Object.entries(BAR_COLORS)) {
    if (s.includes(key)) return color;
  }
  return BAR_COLORS.default;
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const barBg = dark ? "#2A2520" : "#F3EFE9"; // Warm background bars instead of blue
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const { data: summary, isLoading: isSummaryLoading } = useQuery<any>({
    queryKey: ["analytics-summary"],
    queryFn: async () => (await apiClient.get("/api/analytics/summary/")).data,
  });
  const { data: quizStats, isLoading: isQuizStatsLoading } = useQuery<any>({
    queryKey: ["quiz-stats-summary"],
    queryFn: async () => (await apiClient.get("/api/quiz/stats/")).data,
  });
  const { data: weeklyData, isLoading: isWeeklyLoading } = useQuery<any[]>({
    queryKey: ["analytics-weekly"],
    queryFn: async () => (await apiClient.get("/api/analytics/weekly/")).data,
  });
  const { data: weakTopicsData, isLoading: isWeakTopicsLoading } = useQuery<any[]>({
    queryKey: ["analytics-weak-topics"],
    queryFn: async () => (await apiClient.get("/api/analytics/weak-topics/")).data,
  });
  const { data: subjectData, isLoading: isSubjectLoading } = useQuery<any[]>({
    queryKey: ["analytics-subjects"],
    queryFn: async () => (await apiClient.get("/api/analytics/subjects/")).data,
  });

  const isLoading = isSummaryLoading || isQuizStatsLoading || isWeeklyLoading || isWeakTopicsLoading || isSubjectLoading;
  const totalSubjectMins = subjectData?.reduce((a, c) => a + (c.total_minutes || 0), 0) || 1;
  const maxWeeklyMins = weeklyData && weeklyData.length > 0
    ? Math.max(...weeklyData.map(d => d.minutes || 0), 60) : 120;

  const statCards = [
    { label: "Study Time", value: `${summary?.study_hours || 0}h`, icon: "time", color: ACCENT },
    { label: "Quizzes", value: `${summary?.quizzes_taken || 0}`, icon: "checkbox", color: "#10B981" },
    { label: "Accuracy", value: `${quizStats?.avg_score || 0}%`, icon: "ribbon", color: "#F7D87F" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.replace("/(student)")}
            style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginLeft: 12 }}>
            Analytics
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 }}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 12 }}>
            Loading reports...
          </Text>
        </View>
      ) : (
        <View style={{ padding: 16 }}>

          {/* AI Exam Predictor CTA */}
          <Pressable
            onPress={() => router.push("/(student)/analytics/exam-predictor" as any)}
            style={[styles.predictorCta, { backgroundColor: ACCENT + "15", borderColor: ACCENT }]}
          >
            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.ctaIcon, { backgroundColor: ACCENT }]}>
                <Ionicons name="trending-up" size={18} color={dark ? "#000" : "#fff"} />
              </View>
              <View style={{ flex: 1, alignItems: isRtl ? "flex-end" : "flex-start" }}>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>
                  {isRtl ? "متنبئ الامتحان الذكي" : "AI Exam Predictor"}
                </Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2, textAlign: isRtl ? "right" : "left" }}>
                  {isRtl ? "احصل على توقعات نسب التركيز والمواضيع الهامة للامتحان بناء على دراستك." : "Predict likely focus areas and weighting based on your current notes & quiz stats."}
                </Text>
              </View>
              <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color={ACCENT} />
            </View>
          </Pressable>

          {/* Stat cards */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            {statCards.map((s) => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.statIcon, { backgroundColor: s.color + "20" }]}>
                  <Ionicons name={s.icon as any} size={20} color={s.color} />
                </View>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 8 }}>
                  {s.value}
                </Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Weekly bar chart */}
          <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 16 }}>
              Study Time (minutes)
            </Text>
            <View style={{ height: 130, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 4 }}>
              {(weeklyData || []).map((bar, idx) => {
                const heightPercent = Math.max(6, ((bar.minutes || 0) / maxWeeklyMins) * 100);
                return (
                  <View key={idx} style={{ alignItems: "center", flex: 1 }}>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10, marginBottom: 6 }}>
                      {bar.minutes || 0}
                    </Text>
                    <View style={{ width: 16, height: `${heightPercent}%`, backgroundColor: ACCENT, borderRadius: 6 }} />
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 8 }}>
                      {bar.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Weak topics */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 4 }}>
              Weak Topics
            </Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 14 }}>
              Topics below 60% — revisit with flashcards.
            </Text>
            {(!weakTopicsData || weakTopicsData.length === 0) ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="sparkles-outline" size={18} color="#10B981" />
                <Text style={{ color: "#10B981", fontFamily: "Inter_500Medium", fontSize: 13, marginLeft: 8 }}>
                  Excellent accuracy across all topics!
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {weakTopicsData.map((topic, i) => (
                  <View key={i} style={[styles.weakTag, { backgroundColor: "#EF444418", borderColor: "#EF444430" }]}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444", marginRight: 6 }} />
                    <Text style={{ color: "#EF4444", fontFamily: "Inter_700Bold", fontSize: 12 }}>
                      {topic.topic} ({topic.accuracy})
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Subject focus */}
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginBottom: 12 }}>
            Subject Focus
          </Text>
          {(!subjectData || subjectData.length === 0) ? (
            <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Ionicons name="analytics-outline" size={40} color="#374151" />
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 10 }}>
                No study sessions logged yet.
              </Text>
            </View>
          ) : (
            subjectData.map((item, idx) => {
              const pct = Math.round((item.total_minutes / totalSubjectMins) * 100);
              const color = getBarColor(item.subject);
              return (
                <View key={idx} style={[styles.subjectCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 8 }} />
                      <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }}>{item.subject}</Text>
                    </View>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                      {pct}% · {item.total_minutes}m
                    </Text>
                  </View>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: barBg, overflow: "hidden" }}>
                    <View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: color }} />
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statCard: {
    flex: 1, borderRadius: 16, padding: 16, borderWidth: 1, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  chartCard: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 14 },
  sectionCard: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 20 },
  weakTag: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
  },
  emptyCard: { borderRadius: 16, padding: 32, borderWidth: 1, alignItems: "center" },
  subjectCard: {
    borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  predictorCta: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
