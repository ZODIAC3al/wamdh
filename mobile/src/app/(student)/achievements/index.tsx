import React from "react";
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

export default function AchievementsScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const { data, isLoading } = useQuery<any>({
    queryKey: ["achievements"],
    queryFn: async () => (await apiClient.get("/api/analytics/achievements/")).data,
  });

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={ACCENT} /></View>;
  }

  const unlocked: any[] = data?.unlocked || [];
  const locked: any[] = data?.locked || [];
  const level = data?.level || 1;
  const levelTitle = data?.level_title || "Rookie";
  const totalXp = data?.total_xp || 0;
  const nextLevelXp = data?.next_level_xp || 500;
  const progressPercent = data?.progress_percent || 0;

  const levelColors = ["#F7D87F", "#10B981", "#3B82F6", ACCENT, "#EF4444"];
  const levelColor = levelColors[level % levelColors.length];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="arrow-back" size={20} color={ACCENT} />
        </Pressable>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginLeft: 12 }}>
          Achievements
        </Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* Level Card */}
        <View style={[styles.levelCard, { backgroundColor: levelColor }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.levelBadge}>
              <Text style={{ color: "#FFFFFF", fontFamily: "Sora_700Bold", fontSize: 28 }}>{level}</Text>
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 12 }}>Current Level</Text>
              <Text style={{ color: "#FFFFFF", fontFamily: "Sora_700Bold", fontSize: 22 }}>{levelTitle}</Text>
              <Text style={{ color: "rgba(255,255,255,0.9)", fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 }}>
                {totalXp.toLocaleString()} XP total
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 11 }}>
                Level progress
              </Text>
              <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 11 }}>
                {totalXp % 500} / 500 XP
              </Text>
            </View>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${progressPercent}%`, backgroundColor: "rgba(255,255,255,0.9)" }]} />
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Unlocked", value: unlocked.length, icon: "trophy-outline" },
            { label: "Remaining", value: locked.length, icon: "lock-closed-outline" },
            { label: "Total XP", value: totalXp, icon: "star-outline" },
          ].map(s => (
            <View key={s.label} style={[styles.statMini, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Ionicons name={s.icon as any} size={20} color={ACCENT} />
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 4 }}>{s.value}</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Unlocked Achievements */}
        {unlocked.length > 0 && (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Ionicons name="trophy-outline" size={18} color={ACCENT} />
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>
                Unlocked ({unlocked.length})
              </Text>
            </View>
            <View style={styles.grid}>
              {unlocked.map((a: any) => (
                <View key={a.id} style={[styles.badgeCard, { backgroundColor: cardBg, borderColor: a.color + "40" }]}>
                  <View style={[styles.badgeIcon, { backgroundColor: a.color + "20" }]}>
                    <Ionicons name={a.icon} size={26} color={a.color} />
                  </View>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 12, textAlign: "center", marginTop: 8 }}>
                    {a.title}
                  </Text>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center", marginTop: 2 }} numberOfLines={2}>
                    {a.desc}
                  </Text>
                  <View style={[styles.xpPill, { backgroundColor: a.color + "20" }]}>
                    <Text style={{ color: a.color, fontFamily: "Inter_700Bold", fontSize: 10 }}>+{a.xp} XP</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Locked Achievements */}
        {locked.length > 0 && (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, marginTop: 8 }}>
              <Ionicons name="lock-closed-outline" size={18} color={textSecondary} />
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>
                Locked ({locked.length})
              </Text>
            </View>
            <View style={styles.grid}>
              {locked.map((a: any) => (
                <View key={a.id} style={[styles.badgeCard, { backgroundColor: cardBg, borderColor: cardBorder, opacity: 0.85 }]}>
                  <View style={[styles.badgeIcon, { backgroundColor: "#37415120" }]}>
                    <Ionicons name={a.icon || "lock-closed"} size={24} color="#6B7280" />
                  </View>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 12, textAlign: "center", marginTop: 8 }}>
                    {a.title}
                  </Text>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center", marginTop: 2, height: 28 }} numberOfLines={2}>
                    {a.desc}
                  </Text>
                  
                  {a.target_progress > 1 && (
                    <View style={styles.badgeProgressContainer}>
                      <View style={styles.badgeProgressBg}>
                        <View style={[styles.badgeProgressFill, { width: `${Math.min(100, (a.current_progress / a.target_progress) * 100)}%`, backgroundColor: a.color || ACCENT }]} />
                      </View>
                      <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 9, marginTop: 2 }}>
                        {a.current_progress}/{a.target_progress}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.xpPill, { backgroundColor: "#6B728020" }]}>
                    <Text style={{ color: "#6B7280", fontFamily: "Inter_700Bold", fontSize: 10 }}>+{a.xp} XP</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  levelCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  levelBadge: { width: 60, height: 60, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  xpBarBg: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.3)", overflow: "hidden" },
  xpBarFill: { height: 8, borderRadius: 4 },
  statMini: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  badgeCard: { width: "47.5%", borderRadius: 16, padding: 14, borderWidth: 1, alignItems: "center", minHeight: 180 },
  badgeIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  xpPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, marginTop: "auto" },
  badgeProgressContainer: { width: "100%", alignItems: "center", marginTop: 8 },
  badgeProgressBg: { width: "80%", height: 6, borderRadius: 3, backgroundColor: "#E5E7EB", overflow: "hidden" },
  badgeProgressFill: { height: 6, borderRadius: 3 },
});
