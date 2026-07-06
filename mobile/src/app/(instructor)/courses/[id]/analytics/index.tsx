import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PremiumChart } from "../../../../../components/PremiumChart";
import { useWamdh } from "../../../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold

export default function CourseAnalyticsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Course Analytics</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>📈 Completion Rate</Text>
          <View style={{ height: 160, marginTop: 14 }}>
            <PremiumChart
              data={[
                { label: "W1", value: 10 },
                { label: "W2", value: 25 },
                { label: "W3", value: 45 },
                { label: "W4", value: 72 }
              ]}
              xKey="label"
              yKey="value"
              color={PRIMARY}
              type="bar"
              height={160}
            />
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
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15 }
});
