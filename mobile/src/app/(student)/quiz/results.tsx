import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWamdh } from "../../../context/WamdhContext";


export default function QuizResults() {
  const router = useRouter();
  const { score, total, correct } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const scoreNum = Number(score) || 0;
  const correctNum = Number(correct) || 0;
  const totalNum = Number(total) || 3;

  const scoreColor = scoreNum >= 80 ? "#10B981" : scoreNum >= 50 ? "#F7D87F" : "#EF4444";

  return (
    <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center", padding: 24 }}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>

        <View style={[styles.trophyIcon, { backgroundColor: scoreColor + "20" }]}>
          <Ionicons name={scoreNum >= 50 ? "trophy" : "close-circle"} size={44} color={scoreColor} />
        </View>

        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 24, textAlign: "center", marginBottom: 8 }}>
          {scoreNum >= 80 ? "Excellent! 🎉" : scoreNum >= 50 ? "Good Job! 👍" : "Keep Practicing!"}
        </Text>
        <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginBottom: 28 }}>
          {correctNum} of {totalNum} questions answered correctly.
        </Text>

        {/* Score Ring */}
        <View style={[styles.ring, { borderColor: dark ? "#252540" : "#E5E7EB" }]}>
          <View style={[styles.ringFill, { borderTopColor: scoreColor, borderRightColor: scoreColor }]} />
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 30 }}>{scoreNum}%</Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>Accuracy</Text>
        </View>

        <Pressable
          onPress={() => router.replace("/(student)/quiz")}
          style={[styles.primaryBtn, { backgroundColor: "#BE1A1A" }]}
        >
          <Ionicons name="albums-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 }}>Back to Quizzes</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(student)")}
          style={[styles.secondaryBtn, { backgroundColor: dark ? "#252540" : "#F3F4F6" }]}
        >
          <Ionicons name="home-outline" size={18} color={textSecondary} style={{ marginRight: 8 }} />
          <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 15 }}>Dashboard</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%", borderRadius: 24, padding: 28, borderWidth: 1, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, elevation: 8,
  },
  trophyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  ring: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 10,
    alignItems: "center", justifyContent: "center", marginBottom: 28, position: "relative",
  },
  ringFill: {
    position: "absolute", width: 140, height: 140, borderRadius: 70, borderWidth: 10,
    borderColor: "transparent",
    transform: [{ rotate: "-45deg" }],
  },
  primaryBtn: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 50, marginBottom: 12,
    shadowColor: "#BE1A1A", shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  secondaryBtn: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 50,
  },
});
