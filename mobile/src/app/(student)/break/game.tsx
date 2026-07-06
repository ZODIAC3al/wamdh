import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWamdh } from "../../../context/WamdhContext";

const EMERALD = "#10B981";

interface GameItem {
  scrambled: string;
  original: string;
  hint: string;
}

const GAME_WORDS: GameItem[] = [
  { scrambled: "ONET", original: "NOTE", hint: "Something you take in class" },
  { scrambled: "ZQIU", original: "QUIZ", hint: "A short test of knowledge" },
  { scrambled: "MNOA", original: "MONA", hint: "Your AI Tutor helper robot" },
  { scrambled: "ADYTS", original: "STUDY", hint: "To devote time to learning" }
];

export default function WordScrambleScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [level, setLevel] = useState(0);
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);

  const activeItem = GAME_WORDS[level % GAME_WORDS.length];

  const handleCheck = () => {
    if (guess.toUpperCase().trim() === activeItem.original) {
      setScore(prev => prev + 100);
      Alert.alert("🎉 Correct!", "You unscrambled the word! +100 Points");
      setGuess("");
      setLevel(prev => prev + 1);
    } else {
      Alert.alert("❌ Incorrect", "Try again or check the hint.");
    }
  };

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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Word Scramble Break</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Score indicator */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 12 }}>STUDY BREAK PUZZLE</Text>
            <Text style={{ color: EMERALD, fontFamily: "Sora_700Bold", fontSize: 14 }}>Score: {score} XP</Text>
          </View>
          
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 34, textAlign: "center", marginVertical: 20, letterSpacing: 4 }}>
            {activeItem.scrambled}
          </Text>

          <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center", marginBottom: 16 }}>
            💡 Hint: {activeItem.hint}
          </Text>

          <TextInput
            value={guess}
            onChangeText={setGuess}
            autoCapitalize="characters"
            placeholder="Type your guess here..."
            placeholderTextColor="#6B7280"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Pressable onPress={handleCheck} style={[styles.actionBtn, { backgroundColor: "#BE1A1A", marginTop: 14 }]}>
            <Text style={styles.actionBtnText}>Check Answer</Text>
          </Pressable>
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
  card: { padding: 20, borderRadius: 16, borderWidth: 1 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14, textAlign: "center" },
  actionBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }
});
