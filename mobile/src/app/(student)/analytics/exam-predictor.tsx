import React from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

interface Prediction {
  subject: string;
  predicted_weight: number;
  priority: string;
  reason: string;
}

interface ExamData {
  predictions: Prediction[];
  recommendations: string[];
}

export default function ExamPredictorScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const inputBg = colors.inputBg;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const { data, isLoading, refetch } = useQuery<ExamData>({
    queryKey: ["exam-predictions"],
    queryFn: async () => (await apiClient.get("/api/analytics/exam/")).data,
  });

  const getPriorityColor = (priority: string) => {
    const p = priority.toLowerCase();
    if (p.includes("high") || p.includes("عالي")) return "#EF4444";
    if (p.includes("medium") || p.includes("متوسط")) return "#F59E0B";
    return "#10B981";
  };

  const getSubjectColor = (sub: string) => {
    const hash = (sub || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return ["#F7D87F", "#10B981", ACCENT, "#EF4444", "#3B82F6", "#06B6D4"][hash % 6];
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
            <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={20} color={textPrimary} />
          </Pressable>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20, marginLeft: isRtl ? 0 : 12, marginRight: isRtl ? 12 : 0 }}>
            {isRtl ? "متنبئ الامتحان الذكي" : "AI Exam Predictor"}
          </Text>
        </View>
        <Pressable onPress={() => refetch()} style={{ padding: 4 }}>
          <Ionicons name="refresh" size={20} color={ACCENT} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 12 }}>
            {isRtl ? "تقييم سياق الدراسة والتنبؤ..." : "Calculating exam distribution predictions..."}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          
          {/* Main Card */}
          <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.sparkleIcon, { backgroundColor: ACCENT + "15" }]}>
              <Ionicons name="sparkles" size={24} color={ACCENT} />
            </View>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 12, textAlign: "center" }}>
              {isRtl ? "تحليل الوزن المتوقع للامتحان" : "AI Predicted Exam Focus"}
            </Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", marginTop: 4, paddingHorizontal: 8 }}>
              {isRtl 
                ? "يتم احتساب هذه التوقعات بناء على كثافة الملاحظات المرفوعة ونتائج الاختبارات القصيرة التي أجريتها."
                : "Weights are estimated based on note concept density combined with quiz performance gaps."}
            </Text>
          </View>

          {/* Predictions Bar List */}
          <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
            {isRtl ? "توزيع المواضيع المتوقع" : "Expected Topic Weighting"}
          </Text>

          {(data?.predictions || []).map((pred, i) => {
            const color = getSubjectColor(pred.subject);
            const pColor = getPriorityColor(pred.priority);
            return (
              <View key={i} style={[styles.predCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
                    <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>
                      {pred.subject}
                    </Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: pColor + "15", borderColor: pColor + "30" }]}>
                    <Text style={{ color: pColor, fontFamily: "Inter_700Bold", fontSize: 10 }}>
                      {pred.priority}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={{ height: 8, borderRadius: 4, backgroundColor: dark ? "#2A2520" : "#F3EFE9", overflow: "hidden", marginBottom: 10 }}>
                  <View style={{ width: `${pred.predicted_weight}%`, height: 8, borderRadius: 4, backgroundColor: color }} />
                </View>

                <View style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between" }}>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                    {pred.reason}
                  </Text>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 13, marginLeft: isRtl ? 0 : 8, marginRight: isRtl ? 8 : 0 }}>
                    {pred.predicted_weight}%
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Recommendations Checklist */}
          <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 16, textAlign: isRtl ? "right" : "left" }]}>
            {isRtl ? "توصيات خطة الدراسة" : "Study Action Plan"}
          </Text>

          <View style={[styles.recommendationsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {(() => {
              const recs = data?.recommendations || [];
              return recs.map((rec, idx) => (
                <View key={idx} style={[styles.recRow, { flexDirection: isRtl ? "row-reverse" : "row", borderBottomWidth: idx < recs.length - 1 ? 1 : 0, borderBottomColor: cardBorder }]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" style={{ marginRight: isRtl ? 0 : 12, marginLeft: isRtl ? 12 : 0 }} />
                  <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 13, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                    {rec}
                  </Text>
                </View>
              ));
            })()}
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  heroCard: {
    borderRadius: 20, padding: 20, borderWidth: 1, alignItems: "center", marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2
  },
  sparkleIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 16, marginBottom: 12, marginTop: 8 },
  predCard: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 8, elevation: 1
  },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, borderWidth: 1 },
  recommendationsCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  recRow: { padding: 16, flexDirection: "row", alignItems: "center" }
});
