import React from "react";
import {
  View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

function getDifficultyStyle(diff: string) {
  switch (diff.toLowerCase()) {
    case "easy": return { bg: "#10B98120", text: "#10B981" };
    case "hard": return { bg: "#EF444420", text: "#EF4444" };
    default: return { bg: "#F7D87F20", text: "#F7D87F" };
  }
}

function QuizListItem({ item, dark }: { item: any; dark: boolean }) {
  const { colors } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;
  const router = useRouter();
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const { data: attempts } = useQuery<any[]>({
    queryKey: ["quiz-attempts", item.id],
    queryFn: async () => (await apiClient.get(`/api/quiz/${item.id}/attempts/`)).data,
    enabled: !!item.id,
  });
  const bestScore = attempts && attempts.length > 0
    ? Math.max(...attempts.map(a => a.score)) : null;
  const diff = getDifficultyStyle(item.difficulty || "medium");

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/(student)/quiz/[id]", params: { id: item.id } })}
      style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <View style={[styles.diffBadge, { backgroundColor: diff.bg }]}>
          <Text style={{ color: diff.text, fontFamily: "Inter_700Bold", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>
            {item.difficulty || "Medium"}
          </Text>
        </View>
        <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginLeft: 10 }}>
          {item.questions?.length || 0} questions · {item.time_limit_minutes || 10} min
        </Text>
      </View>

      <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 14 }}>
        {item.title}
      </Text>

      <View style={[styles.cardFooter, { borderTopColor: dark ? "#2E2E50" : "#F3F4F6" }]}>
        <View>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>
            Best Score
          </Text>
          <Text style={{
            color: bestScore !== null ? "#10B981" : textSecondary,
            fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 2,
          }}>
            {bestScore !== null ? `${Math.round(bestScore)}%` : "—"}
          </Text>
        </View>
        <View style={[styles.startBtn, { backgroundColor: ACCENT, shadowColor: ACCENT }]}>
          <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 12 }}>
            {bestScore !== null ? "Retake" : "Start"}
          </Text>
          <Ionicons name="play" size={12} color={dark ? "#000000" : "#FFFFFF"} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </Pressable>
  );
}

export default function QuizList() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const { data: quizzes, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["quizzes"],
    queryFn: async () => (await apiClient.get("/api/quiz/")).data,
  });

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.replace("/(student)")}
            style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginLeft: 12 }}>Quizzes</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="checkbox-outline" size={56} color="#374151" />
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 12 }}>
                No quizzes generated yet.
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>
                Upload a note and generate a quiz.
              </Text>
            </View>
          }
          renderItem={({ item }) => <QuizListItem item={item} dark={dark} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  card: {
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  cardFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 1, paddingTop: 12,
  },
  startBtn: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50,
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
});
