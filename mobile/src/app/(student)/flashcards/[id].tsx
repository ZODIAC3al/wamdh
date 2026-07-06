import React, { useState, useRef } from "react";
import {
  View, Text, Pressable, ActivityIndicator, StyleSheet, Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const RATING_CONFIG = [
  { key: "again", label: "Again", emoji: "😕", color: "#EF4444" },
  { key: "hard", label: "Hard", emoji: "😐", color: "#F7D87F" },
  { key: "good", label: "Good", emoji: "🙂", color: "#3B82F6" },
  { key: "easy", label: "Easy", emoji: "😄", color: "#10B981" },
];

export default function FlashcardSession() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const { data: cards, isLoading } = useQuery<any[]>({
    queryKey: ["due-cards-session", id],
    queryFn: async () => (await apiClient.get(`/api/flashcards/${id}/review/`)).data,
    enabled: !!id,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  // Flip animation
  const flipAnim = useRef(new Animated.Value(0)).current;
  const isFlipped = useRef(false);

  const flipCard = () => {
    const toValue = isFlipped.current ? 0 : 180;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    isFlipped.current = !isFlipped.current;
    setShowBack(!showBack);
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ["0deg", "180deg"] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ["180deg", "360deg"] });

  const handleRate = async (rating: string) => {
    if (!cards || cards.length === 0) return;
    const currentCard = cards[currentIndex];

    // Reset flip
    Animated.timing(flipAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
    isFlipped.current = false;
    setShowBack(false);

    setStats(prev => ({ ...prev, [rating]: prev[rating as keyof typeof prev] + 1 }));

    try {
      await apiClient.post("/api/flashcards/rate/", { card_id: currentCard.id, rating });
    } catch (e) { console.error("Failed to rate card", e); }

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionDone(true);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg }}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  // All caught up
  if (!cards || cards.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg, padding: 32 }}>
        <View style={[styles.doneIcon, { backgroundColor: "#10B98120" }]}>
          <Ionicons name="checkmark-circle" size={52} color="#10B981" />
        </View>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 24, textAlign: "center", marginTop: 16 }}>
          All caught up!
        </Text>
        <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
          No cards are due for review today.{"\n"}Come back tomorrow!
        </Text>
        <Pressable onPress={() => router.replace("/(student)/flashcards")}
          style={[styles.backBtn, { backgroundColor: ACCENT, marginTop: 28 }]}>
          <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 }}>Back to Decks</Text>
        </Pressable>
      </View>
    );
  }

  // Session complete
  if (sessionDone) {
    const total = cards.length;
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg, padding: 24 }}>
        <View style={[styles.doneIcon, { backgroundColor: ACCENT + "20" }]}>
          <Ionicons name="trophy" size={52} color={ACCENT} />
        </View>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 26, marginTop: 16 }}>
          Session Complete!
        </Text>
        <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 6, marginBottom: 28 }}>
          Reviewed {total} cards
        </Text>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {RATING_CONFIG.map(r => (
            <View key={r.key} style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
              <Text style={{ color: r.color, fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 4 }}>
                {stats[r.key as keyof typeof stats]}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>{r.label}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={() => router.replace("/(student)/flashcards")}
          style={[styles.backBtn, { backgroundColor: ACCENT }]}>
          <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 }}>Back to Decks</Text>
        </Pressable>
      </View>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 14 }}>
          <View style={[styles.progressBar, { backgroundColor: colors.inputBg }]}>
            <Animated.View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: ACCENT }]} />
          </View>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4, textAlign: "center" }}>
            {currentIndex + 1} / {cards.length}
          </Text>
        </View>
        <View style={[styles.iconBtn, { backgroundColor: ACCENT + "20" }]}>
          <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 13 }}>{cards.length - currentIndex - 1}</Text>
        </View>
      </View>

      {/* Card Area */}
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}>

        {/* FRONT */}
        <Animated.View
          style={[
            styles.flipCard, { backgroundColor: cardBg, borderColor: cardBorder },
            {
              transform: [{ perspective: 1200 }, { rotateY: frontRotate }],
              backfaceVisibility: "hidden",
              position: showBack ? "absolute" : "relative",
              opacity: showBack ? 0 : 1,
            },
          ]}
        >
          <View style={[styles.sideBadge, { backgroundColor: ACCENT + "20" }]}>
            <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1 }}>QUESTION</Text>
          </View>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20, textAlign: "center", lineHeight: 30, marginVertical: 20 }}>
            {currentCard.front}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: "auto" }}>
            <Ionicons name="sync-outline" size={14} color={textSecondary} />
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginLeft: 6 }}>Tap to reveal</Text>
          </View>
        </Animated.View>

        {/* BACK */}
        <Animated.View
          style={[
            styles.flipCard, { backgroundColor: cardBg, borderColor: ACCENT },
            {
              transform: [{ perspective: 1200 }, { rotateY: backRotate }],
              backfaceVisibility: "hidden",
              position: showBack ? "relative" : "absolute",
              opacity: showBack ? 1 : 0,
              borderWidth: 2,
            },
          ]}
        >
          <View style={[styles.sideBadge, { backgroundColor: "#10B98120" }]}>
            <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1 }}>ANSWER</Text>
          </View>
          <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 16, textAlign: "center", lineHeight: 26, marginVertical: 20 }}>
            {currentCard.back}
          </Text>
        </Animated.View>

        {/* Flip Pressable overlay */}
        {!showBack && (
          <Pressable
            onPress={flipCard}
            style={[styles.flipOverlay]}
          />
        )}
      </View>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { backgroundColor: cardBg, borderTopColor: cardBorder }]}>
        {showBack ? (
          <>
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, textAlign: "center", marginBottom: 14 }}>
              How well did you know this?
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {RATING_CONFIG.map(r => (
                <Pressable
                  key={r.key}
                  onPress={() => handleRate(r.key)}
                  style={[styles.rateBtn, { backgroundColor: r.color }]}
                >
                  <Text style={{ fontSize: 16 }}>{r.emoji}</Text>
                  <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 11, marginTop: 4 }}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <Pressable
            onPress={flipCard}
            style={[styles.showAnswerBtn, { backgroundColor: ACCENT, shadowColor: ACCENT }]}
          >
            <Ionicons name="eye" size={18} color={dark ? "#000000" : "#FFFFFF"} style={{ marginRight: 8 }} />
            <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 16 }}>Show Answer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  flipCard: {
    borderRadius: 24, padding: 28, borderWidth: 1, minHeight: 280,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  flipOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24,
  },
  sideBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, marginBottom: 8 },
  bottomBar: { padding: 20, paddingBottom: 36, borderTopWidth: 1 },
  rateBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 14,
  },
  showAnswerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 50,
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  doneIcon: { width: 100, height: 100, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  backBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 50 },
  statsRow: {
    flexDirection: "row", width: "100%", borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 24,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
});
