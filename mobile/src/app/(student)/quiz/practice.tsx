import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface UserAnswer {
  questionIndex: number;
  question: string;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export default function PracticeQuiz() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  // Configurations State
  const [started, setStarted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [qType, setQType] = useState("mcq");
  const [timeLimit, setTimeLimit] = useState(10); // in minutes, 0 for no limit

  // Exam Running State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [showNavGrid, setShowNavGrid] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<any>(null);

  // Results State
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  // Fetch student's notes to extract subjects
  const { data: notes } = useQuery<any[]>({
    queryKey: ["notes"],
    queryFn: async () => (await apiClient.get("/api/notes/")).data,
  });

  const subjects = ["all", ...Array.from(new Set((notes || []).map((n: any) => n.subject).filter(Boolean)))];

  // Timer countdown hook
  useEffect(() => {
    if (started && !done) {
      setElapsedTime(0);
      if (timeLimit > 0) {
        setTimeLeft(timeLimit * 60);
      }
      
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        if (timeLimit > 0) {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleAutoSubmit();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, done]);

  const generatePractice = async () => {
    const pool = selectedSubject === "all"
      ? (notes || [])
      : (notes || []).filter((n: any) => n.subject === selectedSubject);

    if (pool.length === 0) {
      Alert.alert(isRtl ? "لا توجد ملاحظات" : "No notes", isRtl ? "يرجى رفع بعض الملاحظات أولاً لبدء التدريب!" : "Upload some notes first to practice!");
      return;
    }

    setGenerating(true);
    const noteToUse = pool[Math.floor(Math.random() * pool.length)];
    
    try {
      const res = await apiClient.post("/api/ai/quiz/", {
        note_id: noteToUse.id,
        count: questionCount,
        difficulty: difficulty,
        type: qType,
      });

      const generatedQuestions = (res.data.questions || []).map((q: any) => {
        if (qType === "tf" && (!q.options || q.options.length === 0)) {
          return {
            ...q,
            options: [isRtl ? "صحيح" : "True", isRtl ? "خاطئ" : "False"]
          };
        }
        return q;
      });

      if (generatedQuestions.length === 0) {
        throw new Error("No questions generated.");
      }

      setQuestions(generatedQuestions);
      setStarted(true);
      setCurrentIndex(0);
      setUserAnswers({});
      setFlaggedQuestions({});
      setDone(false);
      setResultData(null);
    } catch (e) {
      Alert.alert(isRtl ? "خطأ" : "Error", isRtl ? "تعذر توليد أسئلة التدريب." : "Could not generate practice questions.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = (option: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentIndex]: option
    }));
  };

  const toggleFlag = () => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }));
  };

  const handleAutoSubmit = () => {
    Alert.alert(
      isRtl ? "انتهى الوقت!" : "Time's Up!",
      isRtl ? "سيتم تسليم اختبارك تلقائياً." : "Your exam will be submitted automatically.",
      [{ text: "OK", onPress: () => submitExam() }]
    );
  };

  const submitExam = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    
    let correctCount = 0;
    const incorrectQA: UserAnswer[] = [];

    questions.forEach((q, idx) => {
      const selected = userAnswers[idx];
      const isCorrect = selected === q.answer;
      if (isCorrect) {
        correctCount += 1;
      } else {
        incorrectQA.push({
          questionIndex: idx,
          question: q.question,
          selected_answer: selected || (isRtl ? "بلا إجابة" : "No Answer"),
          correct_answer: q.answer,
          is_correct: false
        });
      }
    });

    const pct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    try {
      const response = await apiClient.post("/api/quiz/practice-submit/", {
        score: pct,
        total_questions: questions.length,
        correct_answers: correctCount,
        time_spent_seconds: elapsedTime,
        difficulty: difficulty,
        type: qType,
        subject: selectedSubject,
        incorrect_questions: incorrectQA,
        has_timer: timeLimit > 0
      });

      setResultData(response.data);
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) {
      Alert.alert(isRtl ? "خطأ في التسليم" : "Submission Failed", isRtl ? "عذراً تعذر تسجيل نتيجتك." : "Sorry, could not submit your results.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeLimit === 0) return textSecondary;
    const totalSecs = timeLimit * 60;
    const ratio = timeLeft / totalSecs;
    if (ratio < 0.2) return "#EF4444";
    if (ratio < 0.5) return "#F59E0B";
    return "#10B981";
  };

  if (!started) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
            <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={20} color={ACCENT} />
          </Pressable>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20, marginHorizontal: 12 }}>
            {isRtl ? "وضع التدريب والامتحانات" : "Mock Exam Simulator"}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
          <View style={[styles.heroIcon, { backgroundColor: ACCENT + "15" }]}>
            <Ionicons name="school" size={48} color={ACCENT} />
          </View>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginTop: 16, textAlign: "center" }}>
            {isRtl ? "اختبار تدريبي مخصص" : "Dynamic Mock Practice"}
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
            {isRtl
              ? "أنشئ بيئة امتحانات كاملة ومحاكاة ذكية للتحضير للاختبارات النهائية باستخدام الذكاء الاصطناعي."
              : "Generate an custom simulated exam context using AI to prepare for final and term exams."}
          </Text>

          <Text style={[styles.configLabel, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
            {isRtl ? "1. حدد مصدر المذاكرة" : "1. Source Material"}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ alignSelf: "stretch", marginBottom: 16 }} contentContainerStyle={{ flexDirection: isRtl ? "row-reverse" : "row" }}>
            {subjects.map(s => (
              <Pressable
                key={s}
                onPress={() => setSelectedSubject(s)}
                style={[styles.subjectChip, {
                  backgroundColor: selectedSubject === s ? ACCENT : inputBg,
                  marginHorizontal: 4,
                }]}
              >
                <Text style={{ color: selectedSubject === s ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 12 }}>
                  {s === "all" ? (isRtl ? "جميع المواد" : "All Subjects") : s}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[styles.configLabel, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
            {isRtl ? "2. عدد الأسئلة" : "2. Question Count"}
          </Text>
          <View style={[styles.configRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {[5, 10, 20, 30].map(c => (
              <Pressable key={c} onPress={() => setQuestionCount(c)} style={[styles.configCell, { backgroundColor: questionCount === c ? ACCENT + "15" : "transparent" }]}>
                <Text style={{ color: questionCount === c ? ACCENT : textSecondary, fontFamily: "Inter_700Bold" }}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.configLabel, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
            {isRtl ? "3. مستوى الصعوبة" : "3. Difficulty"}
          </Text>
          <View style={[styles.configRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {["easy", "medium", "hard"].map(d => (
              <Pressable key={d} onPress={() => setDifficulty(d)} style={[styles.configCell, { backgroundColor: difficulty === d ? ACCENT + "15" : "transparent" }]}>
                <Text style={{ color: difficulty === d ? ACCENT : textSecondary, fontFamily: "Inter_700Bold", textTransform: "capitalize" }}>
                  {d === "easy" ? (isRtl ? "سهل" : "Easy") : d === "medium" ? (isRtl ? "متوسط" : "Medium") : (isRtl ? "صعب" : "Hard")}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.configLabel, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
            {isRtl ? "4. نوع الأسئلة" : "4. Question Type"}
          </Text>
          <View style={[styles.configRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {["mcq", "tf"].map(t => (
              <Pressable key={t} onPress={() => setQType(t)} style={[styles.configCell, { backgroundColor: qType === t ? ACCENT + "15" : "transparent" }]}>
                <Text style={{ color: qType === t ? ACCENT : textSecondary, fontFamily: "Inter_700Bold", textTransform: "uppercase" }}>
                  {t === "mcq" ? (isRtl ? "خيار متعدد" : "MCQ") : (isRtl ? "صواب/خطأ" : "True/False")}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.configLabel, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
            {isRtl ? "5. الوقت المحدد" : "5. Time Limit"}
          </Text>
          <View style={[styles.configRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {[0, 5, 10, 20, 30].map(m => (
              <Pressable key={m} onPress={() => setTimeLimit(m)} style={[styles.configCell, { backgroundColor: timeLimit === m ? ACCENT + "15" : "transparent" }]}>
                <Text style={{ color: timeLimit === m ? ACCENT : textSecondary, fontFamily: "Inter_700Bold" }}>
                  {m === 0 ? (isRtl ? "مفتوح" : "None") : `${m}m`}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={generatePractice}
            disabled={generating}
            style={[styles.startBtn, { backgroundColor: "#10B981", marginTop: 32 }]}
          >
            {generating
              ? <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              : <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />}
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 16 }}>
              {generating ? (isRtl ? "جاري البناء..." : "Generating Exam...") : (isRtl ? "ابدأ المحاكاة!" : "Start Simulation")}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (done && resultData) {
    const scorePct = resultData.attempt.score;
    const emoji = scorePct >= 85 ? "👑" : scorePct >= 65 ? "⭐️" : "📚";
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20, textAlign: "center", flex: 1 }}>
            {isRtl ? "نتائج المحاكاة" : "Exam Results"}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <View style={[styles.resultHero, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={{ fontSize: 52 }}>{emoji}</Text>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 32, marginTop: 10 }}>{scorePct}%</Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 4 }}>
              {resultData.attempt.correct_answers} / {resultData.attempt.total_questions} {isRtl ? "إجابات صحيحة" : "correct answers"}
            </Text>
            <View style={{ flexDirection: "row", gap: 16, marginTop: 14 }}>
              <View style={styles.resultStatCell}>
                <Ionicons name="timer-outline" size={16} color={textSecondary} />
                <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 12, marginLeft: 4 }}>
                  {formatTime(resultData.attempt.time_spent_seconds)}
                </Text>
              </View>
              <View style={styles.resultStatCell}>
                <Ionicons name="sparkles-outline" size={16} color="#F59E0B" />
                <Text style={{ color: "#F59E0B", fontFamily: "Inter_700Bold", fontSize: 12, marginLeft: 4 }}>
                  +{resultData.xp_earned} XP
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.aiRecBox, { backgroundColor: "#8B5CF612", borderColor: "#8B5CF630" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Ionicons name="sparkles" size={18} color="#8B5CF6" />
              <Text style={{ color: "#8B5CF6", fontFamily: "Sora_700Bold", fontSize: 14, marginLeft: 6 }}>
                {isRtl ? "توصيات ومضة الذكية" : "Wamdh AI Study Recommendations"}
              </Text>
            </View>
            {resultData.recommendations.map((rec: string, idx: number) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
                <Text style={{ color: "#8B5CF6", marginRight: 6 }}>•</Text>
                <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 }}>{rec}</Text>
              </View>
            ))}
          </View>

          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 24, marginBottom: 12, textAlign: isRtl ? "right" : "left" }}>
            {isRtl ? "مراجعة الأسئلة" : "Questions Review"}
          </Text>
          <View style={{ gap: 12 }}>
            {questions.map((q, idx) => {
              const selected = userAnswers[idx];
              const isCorrect = selected === q.answer;
              return (
                <View key={idx} style={[styles.reviewCard, { backgroundColor: cardBg, borderColor: isCorrect ? "#10B98130" : "#EF444430" }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                      {isRtl ? `السؤال ${idx + 1}` : `Question ${idx + 1}`}
                    </Text>
                    <Ionicons name={isCorrect ? "checkmark-circle" : "close-circle"} size={18} color={isCorrect ? "#10B981" : "#EF4444"} />
                  </View>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 22 }}>{q.question}</Text>
                  
                  <View style={{ marginTop: 10, gap: 4 }}>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                      {isRtl ? "إجابتك:" : "Your Answer:"} <Text style={{ color: isCorrect ? "#10B981" : "#EF4444", fontFamily: "Inter_700Bold" }}>{selected || (isRtl ? "فارغة" : "None")}</Text>
                    </Text>
                    {!isCorrect && (
                      <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                        {isRtl ? "الإجابة الصحيحة:" : "Correct Answer:"} <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold" }}>{q.answer}</Text>
                      </Text>
                    )}
                  </View>
                  
                  {q.explanation && (
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, fontStyle: "italic", marginTop: 8 }}>
                      {q.explanation}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          <Pressable onPress={() => { setStarted(false); setDone(false); }} style={[styles.startBtn, { backgroundColor: "#BE1A1A", marginTop: 28 }]}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 }}>
              {isRtl ? "تدريب مجدداً" : "Practice Again"}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={{ alignSelf: "center", marginTop: 16 }}>
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              {isRtl ? "العودة للوحة التحكم" : "Back to Dashboard"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const isFlagged = flaggedQuestions[currentIndex];
  const q = questions[currentIndex];
  const totalQuestions = questions.length;

  if (!q) return null;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => {
          Alert.alert(
            isRtl ? "إنهاء المحاكاة" : "Exit Simulation",
            isRtl ? "هل أنت متأكد من رغبتك في المغادرة؟ لن يتم حفظ تقدمك الحاد." : "Are you sure you want to quit? Your progress will be lost.",
            [{ text: "Cancel", style: "cancel" }, { text: "Exit", style: "destructive", onPress: () => setStarted(false) }]
          );
        }} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="close" size={20} color={textSecondary} />
        </Pressable>

        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <View style={[styles.progressBar, { backgroundColor: dark ? "#252540" : "#E5E7EB" }]}>
            <View style={[styles.progressFill, { width: `${((currentIndex + 1) / totalQuestions) * 100}%`, backgroundColor: ACCENT }]} />
          </View>
        </View>

        {timeLimit > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8 }}>
            <Ionicons name="time-outline" size={16} color={getTimerColor()} style={{ marginRight: 4 }} />
            <Text style={{ color: getTimerColor(), fontFamily: "JetBrainsMono_400Regular", fontSize: 14 }}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        )}

        <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
          {currentIndex + 1}/{totalQuestions}
        </Text>
      </View>

      <View style={[styles.quizToolbar, { borderBottomColor: cardBorder }]}>
        <Pressable onPress={toggleFlag} style={styles.toolbarBtn}>
          <Ionicons name={isFlagged ? "flag" : "flag-outline"} size={16} color={isFlagged ? "#F59E0B" : textSecondary} />
          <Text style={{ color: isFlagged ? "#F59E0B" : textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, marginLeft: 4 }}>
            {isRtl ? "مراجعة لاحقاً" : "Flag"}
          </Text>
        </Pressable>

        <Pressable onPress={() => setShowNavGrid(!showNavGrid)} style={styles.toolbarBtn}>
          <Ionicons name="grid-outline" size={16} color={ACCENT} />
          <Text style={{ color: ACCENT, fontFamily: "Inter_500Medium", fontSize: 12, marginLeft: 4 }}>
            {isRtl ? "خريطة الأسئلة" : "Navigator"}
          </Text>
        </Pressable>
      </View>

      {showNavGrid && (
        <View style={[styles.navGridCard, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
            {questions.map((_, idx) => {
              const isAns = userAnswers[idx] !== undefined;
              const isFlag = flaggedQuestions[idx];
              const isActive = currentIndex === idx;
              
              let border = cardBorder;
              let bgCell = inputBg;
              let textCol = textSecondary;
              
              if (isActive) border = ACCENT;
              if (isAns) { bgCell = ACCENT + "15"; textCol = ACCENT; }
              if (isFlag) { bgCell = "#F59E0B20"; textCol = "#F59E0B"; }

              return (
                <Pressable
                  key={idx}
                  onPress={() => { setCurrentIndex(idx); setShowNavGrid(false); }}
                  style={[styles.gridCellBtn, { backgroundColor: bgCell, borderColor: border }]}
                >
                  <Text style={{ color: textCol, fontFamily: "Inter_700Bold", fontSize: 12 }}>{idx + 1}</Text>
                  {isFlag && <View style={styles.flagDot} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={[styles.questionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, lineHeight: 28, textAlign: isRtl ? "right" : "left" }}>
            {q.question}
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          {q.options.map((opt: string) => {
            const isSelected = userAnswers[currentIndex] === opt;
            let bgOpt = cardBg;
            let borderOpt = cardBorder;
            if (isSelected) {
              bgOpt = ACCENT + "12";
              borderOpt = ACCENT;
            }
            return (
              <Pressable
                key={opt}
                onPress={() => handleSelect(opt)}
                style={[styles.optionBtn, { backgroundColor: bgOpt, borderColor: borderOpt, flexDirection: isRtl ? "row-reverse" : "row" }]}
              >
                <View style={[styles.optionDot, { borderColor: isSelected ? ACCENT : "#9CA3AF" }]}>
                  {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT }} />}
                </View>
                <Text style={{ color: isSelected ? ACCENT : textPrimary, fontFamily: "Inter_500Medium", fontSize: 14, flex: 1, marginHorizontal: 8, textAlign: isRtl ? "right" : "left" }}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: cardBg, borderTopColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable
          onPress={() => currentIndex > 0 && setCurrentIndex(i => i - 1)}
          disabled={currentIndex === 0}
          style={[styles.navBtn, { backgroundColor: inputBg, opacity: currentIndex === 0 ? 0.4 : 1 }]}
        >
          <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={18} color={textPrimary} />
          <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14, marginHorizontal: 6 }}>
            {isRtl ? "السابق" : "Prev"}
          </Text>
        </Pressable>

        {currentIndex === totalQuestions - 1 ? (
          <Pressable onPress={submitExam} disabled={submitting} style={[styles.submitBtn, { backgroundColor: "#10B981" }]}>
            {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <>
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14, marginRight: 6 }}>
                  {isRtl ? "تسليم الاختبار" : "Submit Exam"}
                </Text>
                <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={() => currentIndex < totalQuestions - 1 && setCurrentIndex(i => i + 1)}
            style={[styles.navBtn, { backgroundColor: ACCENT }]}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14, marginHorizontal: 6 }}>
              {isRtl ? "التالي" : "Next"}
            </Text>
            <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={18} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  heroIcon: { width: 92, height: 92, borderRadius: 24, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  configLabel: { fontFamily: "Sora_700Bold", fontSize: 14, marginTop: 20, marginBottom: 8 },
  subjectChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50 },
  configRow: { flexDirection: "row", borderWidth: 1, borderRadius: 14, overflow: "hidden", marginVertical: 4 },
  configCell: { flex: 1, alignItems: "center", paddingVertical: 12 },
  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 50, alignSelf: "stretch", shadowColor: "#10B981", shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  quizToolbar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
  toolbarBtn: { flexDirection: "row", alignItems: "center" },
  navGridCard: { paddingVertical: 12, borderBottomWidth: 1 },
  gridCellBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  flagDot: { position: "absolute", top: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: "#F59E0B" },
  questionCard: { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  optionBtn: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 16, borderWidth: 1.5 },
  optionDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, justifyContent: "space-between" },
  navBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 50 },
  submitBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 50 },
  resultHero: { borderRadius: 20, padding: 24, borderWidth: 1, alignItems: "center", marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  resultStatCell: { flexDirection: "row", alignItems: "center", backgroundColor: "#00000008", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  aiRecBox: { borderLeftWidth: 4, borderRadius: 16, padding: 16, borderStyle: "solid" },
  reviewCard: { borderRadius: 14, padding: 16, borderWidth: 1 },
});
