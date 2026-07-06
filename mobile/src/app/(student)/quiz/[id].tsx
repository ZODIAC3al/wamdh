import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export default function QuizSession() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  // Fetch quiz details from backend
  const { data: quiz, isLoading } = useQuery<any>({
    queryKey: ["quiz", id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/quiz/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });

  const questions: Question[] = quiz?.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // default 5 mins

  // Setup timer once quiz is loaded
  useEffect(() => {
    if (quiz) {
      const limit = (quiz.time_limit_minutes || 5) * 60;
      setTimeLeft(limit);
    }
  }, [quiz]);

  // Countdown timer
  useEffect(() => {
    if (isLoading || !quiz) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading, quiz, score, currentIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleOptionSelect = (option: string) => {
    if (answered) return;
    setSelectedOption(option);
    setAnswered(true);

    const currentQuestion = questions[currentIndex];
    if (option === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    const finalScorePercent = Math.round((score / questions.length) * 100);
    const limit = (quiz?.time_limit_minutes || 5) * 60;
    const timeTaken = limit - timeLeft;

    try {
      await apiClient.post(`/api/quiz/${id}/attempt/`, {
        answers: [], 
        score: finalScorePercent,
        time_taken_seconds: timeTaken > 0 ? timeTaken : 15,
      });
    } catch (e) {
      console.error("Failed to submit quiz attempt", e);
    }

    router.replace({
      pathname: "/(student)/quiz/results",
      params: { score: finalScorePercent, total: questions.length, correct: score }
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular" }}>Quiz questions not found.</Text>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingHorizontal: 24, paddingTop: 48 }}>
      {/* Top Header Row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Pressable onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="close" size={18} color={textPrimary} />
        </Pressable>
        <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 14, color: textPrimary }}>
          ⏳ {formatTime(timeLeft)}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={{ width: "100%", height: 8, backgroundColor: colors.inputBg, borderRadius: 4, marginBottom: 24, overflow: "hidden" }}>
        <View style={{ height: "100%", backgroundColor: ACCENT, borderRadius: 4, width: `${progressPercent}%` }} />
      </View>

      <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
        Question {currentIndex + 1} of {questions.length}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 90 }}>
        {/* Question Card */}
        <View style={{ backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 17, fontFamily: "Sora_700Bold", color: textPrimary, lineHeight: 26 }}>
            {currentQ.question}
          </Text>
        </View>

        {/* Options */}
        <View style={{ gap: 10, marginBottom: 20 }}>
          {currentQ.options.map((option) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQ.answer;
            const isWrongSelected = isSelected && !isCorrect;

            let borderStyle = cardBorder;
            let bgStyle = cardBg;
            let textColor = textPrimary;

            if (answered) {
              if (isCorrect) {
                borderStyle = "#10B981";
                bgStyle = dark ? "#064E3B40" : "#D1FAE5";
                textColor = "#10B981";
              } else if (isWrongSelected) {
                borderStyle = "#EF4444";
                bgStyle = dark ? "#7F1D1D40" : "#FEE2E2";
                textColor = "#EF4444";
              }
            } else if (isSelected) {
              borderStyle = ACCENT;
              bgStyle = ACCENT + "12";
              textColor = ACCENT;
            }

            return (
              <Pressable
                key={option}
                onPress={() => handleOptionSelect(option)}
                disabled={answered}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: bgStyle,
                    borderColor: borderStyle,
                    borderWidth: isSelected || (answered && (isCorrect || isWrongSelected)) ? 2 : 1
                  }
                ]}
              >
                <View style={[styles.circleIndicator, { borderColor: textColor === textPrimary ? colors.border : textColor }]}>
                  {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: textColor }} />}
                </View>
                <Text style={{ flex: 1, color: textColor, fontFamily: "Inter_500Medium", fontSize: 14 }}>{option}</Text>
                
                {answered && isCorrect && (
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                )}
                {answered && isWrongSelected && (
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Explanation Panel */}
        {answered && currentQ.explanation && (
          <View style={[styles.explanationBox, { backgroundColor: dark ? "#1E3A8A25" : "#EFF6FF", borderColor: dark ? "#1E3A8A" : "#BFDBFE" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="information-circle" size={18} color="#3B82F6" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: "#3B82F6", textTransform: "uppercase", letterSpacing: 0.5 }}>Explanation</Text>
            </View>
            <Text style={{ fontSize: 13, color: dark ? "#93C5FD" : "#2563EB", fontFamily: "Inter_400Regular", lineHeight: 20 }}>
              {currentQ.explanation}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation (Fixed Bottom) */}
      <View style={[styles.bottomBar, { backgroundColor: bg, borderTopColor: cardBorder }]}>
        <Pressable
          onPress={handleNext}
          disabled={!answered}
          style={[
            styles.nextBtn,
            {
              backgroundColor: answered ? ACCENT : colors.inputBg,
              shadowColor: answered ? ACCENT : "transparent"
            }
          ]}
        >
          <Text style={{ color: answered ? (dark ? "#000000" : "#FFFFFF") : textSecondary, fontFamily: "Inter_700Bold", fontSize: 16 }}>
            {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={answered ? (dark ? "#000000" : "#FFFFFF") : textSecondary} style={{ marginLeft: 6 }} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  optionBtn: {
    width: "100%", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center",
  },
  circleIndicator: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  explanationBox: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 32 },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0, padding: 24, borderTopWidth: 1,
  },
  nextBtn: {
    width: "100%", borderRadius: 50, height: 50, alignItems: "center", justifyContent: "center", flexDirection: "row",
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
});
