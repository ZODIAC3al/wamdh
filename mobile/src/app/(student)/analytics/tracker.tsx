import React from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { PremiumChart } from "../../../components/PremiumChart";
import { useWamdh } from "../../../context/WamdhContext";

const GREEN = "#10B981";

export default function StudySessionTrackerScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const { data: weeklyData, isLoading } = useQuery<any[]>({
    queryKey: ["weekly-study-dashboard"],
    queryFn: async () => (await apiClient.get("/api/analytics/weekly/")).data,
  });

  const { data: subjectsData } = useQuery<any[]>({
    queryKey: ["subject-time-distribution"],
    queryFn: async () => (await apiClient.get("/api/analytics/subjects/")).data,
  });

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Study Session Analytics</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Weekly focus minutes chart list */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>📊 Weekly Focus Minutes</Text>
          {isLoading ? (
            <ActivityIndicator color={ACCENT} style={{ marginVertical: 20 }} />
          ) : (
            <View style={{ height: 180, marginTop: 14 }}>
              <PremiumChart
                data={weeklyData || []}
                xKey="day"
                yKey="minutes"
                color={ACCENT}
                type="bar"
              />
            </View>
          )}
        </View>

        {/* Subjects distribution lists */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 20 }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>📚 Subject Distribution</Text>
          <View style={{ marginTop: 14, gap: 12 }}>
            {(subjectsData || [
              { subject: "Chemistry", total_minutes: 90 },
              { subject: "Math", total_minutes: 120 },
              { subject: "Physics", total_minutes: 45 }
            ]).map((sub, idx) => (
              <View key={idx} style={[styles.subjectRow, { borderBottomColor: cardBorder }]}>
                <Ionicons name="book-outline" size={16} color={GREEN} />
                <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, flex: 1, marginLeft: 10 }}>
                  {sub.subject}
                </Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                  {sub.total_minutes} mins
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15 },
  subjectRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 }
});
