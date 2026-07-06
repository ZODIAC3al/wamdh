import React from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useWamdh } from "../../../context/WamdhContext";

const GOLD = "#F59E0B";
const SILVER = "#9CA3AF";
const BRONZE = "#CD7F32";

interface Standing {
  rank: number;
  username: string;
  xp_points: number;
  streak_days: number;
  profile_photo_url: string;
}

interface LeaderboardItemProps {
  item: Standing;
  index: number;
  ACCENT: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  getRankBadge: (rank: number) => React.ReactNode;
}

// Sub-component to prevent Reanimated Hook rules violation inside renderItem callback
const LeaderboardItem: React.FC<LeaderboardItemProps> = ({
  item, index, ACCENT, cardBg, cardBorder, textPrimary, textSecondary, getRankBadge
}) => {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 + index * 50 });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50)}
      style={[animatedStyle, styles.row, { backgroundColor: cardBg, borderColor: cardBorder }]}
    >
      <View style={styles.rankContainer}>
        {getRankBadge(item.rank)}
      </View>

      <View style={[styles.avatar, { backgroundColor: item.rank <= 3 ? [GOLD, SILVER, BRONZE][item.rank - 1] : ACCENT }]}>
        <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 13 }}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>{item.username}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
          <Ionicons name="flame-outline" size={12} color="#EF4444" style={{ marginRight: 4 }} />
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>
            {item.streak_days} day streak
          </Text>
        </View>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 14 }}>{item.xp_points} XP</Text>
        {item.rank <= 3 && (
          <Ionicons name="trending-up-outline" size={14} color={item.rank === 1 ? GOLD : item.rank === 2 ? SILVER : BRONZE} style={{ marginTop: 2 }} />
        )}
      </View>
    </Animated.View>
  );
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const { data: standings, isLoading } = useQuery<Standing[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/api/analytics/leaderboard/");
        return res.data;
      } catch (e) {
        return [];
      }
    }
  });

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Ionicons name="medal" size={24} color={GOLD} />;
    if (rank === 2) return <Ionicons name="medal" size={24} color={SILVER} />;
    if (rank === 3) return <Ionicons name="medal" size={24} color={BRONZE} />;
    return (
      <View style={[styles.rankCircle, { backgroundColor: ACCENT + "20", borderColor: ACCENT }]}>
        <Text style={[styles.rankText, { color: ACCENT }]}>#{rank}</Text>
      </View>
    );
  };

  const defaultStandings = [
    { rank: 1, username: "Alice", xp_points: 3400, streak_days: 12, profile_photo_url: "" },
    { rank: 2, username: "Bob", xp_points: 2900, streak_days: 9, profile_photo_url: "" },
    { rank: 3, username: "Charlie", xp_points: 2500, streak_days: 5, profile_photo_url: "" },
    { rank: 4, username: "Diana", xp_points: 2100, streak_days: 7, profile_photo_url: "" },
    { rank: 5, username: "Eve", xp_points: 1800, streak_days: 3, profile_photo_url: "" }
  ];

  const listData = standings && standings.length > 0 ? standings : defaultStandings;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name={isRtl ? "arrow-forward" : "chevron-back"} size={20} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>
          {isRtl ? "متصدرين الدوري" : "League Leaderboard"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* League Selection */}
      <View style={[styles.leagueSelector, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable style={[styles.leagueTab, { borderBottomColor: GOLD, borderBottomWidth: 3 }]}>
          <Ionicons name="trophy-outline" size={16} color={GOLD} />
          <Text style={{ color: GOLD, fontFamily: "Inter_700Bold", fontSize: 13, marginLeft: 4 }}>
            {isRtl ? "الدوري الذهبي" : "Gold League"}
          </Text>
        </Pressable>
        <Pressable style={styles.leagueTab}>
          <Ionicons name="trophy-outline" size={16} color={textSecondary} />
          <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, marginLeft: 4 }}>
            {isRtl ? "الدوري الفضي" : "Silver League"}
          </Text>
        </Pressable>
        <Pressable style={styles.leagueTab}>
          <Ionicons name="trophy-outline" size={16} color={textSecondary} />
          <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, marginLeft: 4 }}>
            {isRtl ? "الدوري البرونزي" : "Bronze League"}
          </Text>
        </Pressable>
      </View>

      {/* Standings List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 40 }} />
      ) : (
        <Animated.FlatList
          data={listData}
          keyExtractor={(item) => String(item.rank)}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item, index }) => (
            <LeaderboardItem
              item={item}
              index={index}
              ACCENT={ACCENT}
              cardBg={cardBg}
              cardBorder={cardBorder}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              getRankBadge={getRankBadge}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  leagueSelector: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 12, gap: 8 },
  leagueTab: { paddingVertical: 6, alignItems: "center", flexDirection: "row" },
  row: {
    flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10
  },
  rankContainer: { width: 36, alignItems: "center", justifyContent: "center" },
  rankCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  rankText: { fontFamily: "JetBrainsMono_700Bold", fontSize: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});