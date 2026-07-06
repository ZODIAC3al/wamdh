import React from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PremiumChart } from "../../../components/PremiumChart";
import { useWamdh } from "../../../context/WamdhContext";

interface GradeAverage {
  subject: string;
  averageScore: string;
  participants: number;
}

const MOCK_GRADES: GradeAverage[] = [
  { subject: "Organic Chemistry", averageScore: "84%", participants: 28 },
  { subject: "Calculus Limits", averageScore: "78%", participants: 32 },
  { subject: "Newtonian Physics", averageScore: "89%", participants: 19 }
];

const MOCK_ATTENDANCE = [
  { label: "Mon", rate: 92 },
  { label: "Tue", rate: 88 },
  { label: "Wed", rate: 95 },
  { label: "Thu", rate: 91 },
  { label: "Fri", rate: 85 }
];

const MOCK_COMPLETION = [
  { label: "Ch 1", rate: 98 },
  { label: "Ch 2", rate: 87 },
  { label: "Ch 3", rate: 84 },
  { label: "Ch 4", rate: 76 },
  { label: "Ch 5", rate: 65 }
];

export default function InstructorAnalyticsScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const chartData = MOCK_GRADES.map(item => ({
    subject: item.subject.split(" ")[0],
    score: parseInt(item.averageScore)
  }));

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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Instructor Analytics Console</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20, gap: 20 }}>
        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statItem, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="people-outline" size={20} color={ACCENT} />
            <Text style={[styles.statValue, { color: textPrimary }]}>79</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Active Students</Text>
          </View>

          <View style={[styles.statItem, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="book-outline" size={20} color={ACCENT} />
            <Text style={[styles.statValue, { color: textPrimary }]}>3</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>My Courses</Text>
          </View>

          <View style={[styles.statItem, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={ACCENT} />
            <Text style={[styles.statValue, { color: textPrimary }]}>83.6%</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Class Average</Text>
          </View>
        </View>

        {/* Quiz Grade Averages Chart */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Quiz Grade Averages</Text>
          <View style={{ height: 160, marginTop: 14 }}>
            <PremiumChart
              data={chartData}
              xKey="subject"
              yKey="score"
              color={ACCENT}
              type="bar"
              height={160}
            />
          </View>
          <View style={{ marginTop: 20, gap: 12 }}>
            {MOCK_GRADES.map((item, idx) => (
              <View key={idx} style={[styles.row, { borderBottomColor: cardBorder }]}>
                <Ionicons name="school-outline" size={16} color={textSecondary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>{item.subject}</Text>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                    {item.participants} active students
                  </Text>
                </View>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>{item.averageScore}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Classroom Attendance Chart */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Classroom Attendance Rate (%)</Text>
          <View style={{ height: 160, marginTop: 14 }}>
            <PremiumChart
              data={MOCK_ATTENDANCE}
              xKey="label"
              yKey="rate"
              color={ACCENT}
              type="line"
              height={160}
            />
          </View>
        </View>

        {/* Homework Completion Chart */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Homework Completion by Chapter (%)</Text>
          <View style={{ height: 160, marginTop: 14 }}>
            <PremiumChart
              data={MOCK_COMPLETION}
              xKey="label"
              yKey="rate"
              color={ACCENT}
              type="bar"
              height={160}
            />
          </View>
        </View>

        {/* Struggle Areas */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Struggle Areas</Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4, lineHeight: 18, marginBottom: 12 }}>
            Concept topics where average classroom accuracy falls below 70%:
          </Text>
          <View style={[styles.problemRow, { backgroundColor: colors.dangerMuted, borderColor: colors.danger + "30" }]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 13, flex: 1, marginLeft: 10 }}>
              Alkanes Nomenclature (Chemistry Sections)
            </Text>
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
  statsGrid: { flexDirection: "row", gap: 10 },
  statItem: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  statValue: { fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 6 },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 10, marginTop: 2, textAlign: "center" },
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  problemRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 10, borderWidth: 1 }
});
