import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
  TextInput, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../../../lib/api";
import { useWamdh } from "../../../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold
const GREEN = "#10B981";
const RED = "#EF4444";

export default function CreateQuizScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // courseId
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  // Form State
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [questionCount, setQuestionCount] = useState("5");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionType, setQuestionType] = useState<"MCQ" | "True/False" | "Short Answer" | "Mixed">("MCQ");
  const [dueDays, setDueDays] = useState("7");
  const [quizTitle, setQuizTitle] = useState("");

  // Loading & Generation States
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        // Fetch all chapters of the course
        const chRes = await apiClient.get(`/api/instructor/courses/${id}/chapters/`);
        const allMaterials: any[] = [];
        for (const ch of chRes.data) {
          const mRes = await apiClient.get(`/api/instructor/chapters/${ch.id}/materials/`);
          allMaterials.push(...mRes.data);
        }
        setMaterials(allMaterials);
        if (allMaterials.length > 0) {
          setSelectedMaterialId(allMaterials[0].id);
        }
      } catch (e) {
        console.log("Could not load materials for quiz source:", e);
      } finally {
        setMaterialsLoading(false);
      }
    };
    fetchMaterials();
  }, [id]);

  const handleGenerateAI = async () => {
    if (!selectedMaterialId) {
      Alert.alert("Error", "Please select a study material source.");
      return;
    }

    setGenerating(true);
    setGeneratedQuestions([]);
    try {
      const res = await apiClient.post("/api/instructor/quizzes/generate/", {
        material_id: selectedMaterialId,
        count: parseInt(questionCount) || 5,
        difficulty,
        type: questionType
      });
      setGeneratedQuestions(res.data.questions || []);
      setQuizTitle(res.data.title || "AI Generated Quiz");
    } catch (e) {
      Alert.alert("Generation Failed", "Could not connect to Gemini API. Falling back to default questions.");
      // Seed some fallback ones
      setGeneratedQuestions([
        { question: "What is backpropagation?", options: ["An optimization algorithm", "A activation function", "A layer type", "A hardware component"], answer: "An optimization algorithm", explanation: "Backpropagation computes gradients of loss function." },
        { question: "What is an epoch?", options: ["One full pass of dataset", "One batch run", "One layer update", "One validation step"], answer: "One full pass of dataset", explanation: "An epoch refers to one complete iteration over the whole training dataset." }
      ]);
      setQuizTitle("Fallback Course Quiz");
    } finally {
      setGenerating(false);
    }
  };

  const handleQuestionChange = (index: number, key: string, val: string) => {
    setGeneratedQuestions(prev => prev.map((q, idx) => {
      if (idx === index) {
        return { ...q, [key]: val };
      }
      return q;
    }));
  };

  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    setGeneratedQuestions(prev => prev.map((q, idx) => {
      if (idx === qIndex) {
        const newOpts = [...q.options];
        newOpts[optIndex] = val;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleDeleteQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle.trim()) {
      Alert.alert("Error", "Quiz Title is required");
      return;
    }
    if (generatedQuestions.length === 0) {
      Alert.alert("Error", "Quiz must contain at least one question.");
      return;
    }

    setSaving(true);
    try {
      const due_date = new Date();
      due_date.setDate(due_date.getDate() + (parseInt(dueDays) || 7));

      await apiClient.post("/api/instructor/quizzes/", {
        course_id: id,
        title: quizTitle,
        questions: generatedQuestions,
        time_limit: 30,
        due_date: due_date.toISOString()
      });

      Alert.alert("Success", "Quiz saved and assigned to course students successfully.", [
        { text: "Awesome", onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert("Error", "Could not save quiz.");
    } finally {
      setSaving(false);
    }
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: bg }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Generate AI Quiz</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {generatedQuestions.length === 0 ? (
          <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.label, { color: textSecondary }]}>SELECT SOURCE STUDY MATERIAL</Text>
            {materialsLoading ? (
              <ActivityIndicator color={PRIMARY} size="small" style={{ marginVertical: 8 }} />
            ) : materials.length === 0 ? (
              <Text style={{ color: RED, fontFamily: "Inter_500Medium", fontSize: 13, marginVertical: 8 }}>
                No materials available. Please upload a PDF/Note first.
              </Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 8 }}>
                {materials.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setSelectedMaterialId(m.id)}
                    style={[
                      styles.sourceChip,
                      { backgroundColor: selectedMaterialId === m.id ? PRIMARY : inputBg, borderColor: cardBorder },
                      selectedMaterialId === m.id && { borderColor: PRIMARY }
                    ]}
                  >
                    <Text style={{ color: selectedMaterialId === m.id ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                      📄 {m.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>QUESTION COUNT</Text>
            <TextInput
              keyboardType="number-pad"
              value={questionCount}
              onChangeText={setQuestionCount}
              style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
            />

            <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>DIFFICULTY LEVEL</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
              {(["easy", "medium", "hard"] as const).map((diff) => (
                <Pressable
                  key={diff}
                  onPress={() => setDifficulty(diff)}
                  style={[
                    styles.segmentedBtn,
                    { backgroundColor: difficulty === diff ? PRIMARY : inputBg, borderColor: cardBorder },
                    difficulty === diff && { borderColor: PRIMARY }
                  ]}
                >
                  <Text style={{ color: difficulty === diff ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "capitalize" }}>
                    {diff}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>QUESTION TYPE</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
              {(["MCQ", "True/False", "Short Answer", "Mixed"] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setQuestionType(type)}
                  style={[
                    styles.segmentedBtn,
                    { backgroundColor: questionType === type ? PRIMARY : inputBg, borderColor: cardBorder },
                    questionType === type && { borderColor: PRIMARY }
                  ]}
                >
                  <Text style={{ color: questionType === type ? "#FFFFFF" : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>ASSIGNMENT DUE IN (DAYS)</Text>
            <TextInput
              keyboardType="number-pad"
              value={dueDays}
              onChangeText={setDueDays}
              style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
            />

            {generating ? (
              <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
            ) : (
              <Pressable
                onPress={handleGenerateAI}
                style={[styles.generateBtn, { backgroundColor: PRIMARY }]}
              >
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14, marginLeft: 8 }}>
                  Generate with AI ✨
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View>
            {/* Preview and Edit Section */}
            <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 20 }]}>
              <Text style={[styles.label, { color: textSecondary }]}>QUIZ TITLE</Text>
              <TextInput
                value={quizTitle}
                onChangeText={setQuizTitle}
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary, fontSize: 16, fontFamily: "Sora_700Bold" }]}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Questions Preview ({generatedQuestions.length})</Text>

            {generatedQuestions.map((q, qIdx) => (
              <View key={qIdx} style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 14 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Text style={{ color: PRIMARY, fontFamily: "Sora_700Bold", fontSize: 13 }}>Question #{qIdx + 1}</Text>
                  <Pressable onPress={() => handleDeleteQuestion(qIdx)}>
                    <Ionicons name="trash-outline" size={18} color={RED} />
                  </Pressable>
                </View>

                <TextInput
                  value={q.question}
                  onChangeText={(val) => handleQuestionChange(qIdx, "question", val)}
                  style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
                />

                {q.options && q.options.map((opt: string, optIdx: number) => (
                  <View key={optIdx} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 12 }}>{String.fromCharCode(65 + optIdx)}.</Text>
                    <TextInput
                      value={opt}
                      onChangeText={(val) => handleOptionChange(qIdx, optIdx, val)}
                      style={[styles.input, { backgroundColor: inputBg, color: textPrimary, flex: 1 }]}
                    />
                  </View>
                ))}

                <Text style={[styles.label, { color: textSecondary, marginTop: 12 }]}>CORRECT ANSWER</Text>
                <TextInput
                  value={q.answer}
                  onChangeText={(val) => handleQuestionChange(qIdx, "answer", val)}
                  style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
                />

                <Text style={[styles.label, { color: textSecondary, marginTop: 12 }]}>EXPLANATION</Text>
                <TextInput
                  value={q.explanation}
                  onChangeText={(val) => handleQuestionChange(qIdx, "explanation", val)}
                  style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
                />
              </View>
            ))}

            {saving ? (
              <ActivityIndicator color={PRIMARY} style={{ marginTop: 20 }} />
            ) : (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable onPress={() => setGeneratedQuestions([])} style={[styles.btn, { backgroundColor: inputBg, flex: 1 }]}>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold" }}>Regenerate</Text>
                </Pressable>
                <Pressable onPress={handleSaveQuiz} style={[styles.btn, { backgroundColor: PRIMARY, flex: 1 }]}>
                  <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold" }}>Publish Quiz</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  formCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  label: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
  sourceChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  input: { paddingHorizontal: 12, height: 44, borderRadius: 8, fontFamily: "Inter_500Medium", fontSize: 13 },
  inputArea: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontFamily: "Inter_500Medium", fontSize: 13, minHeight: 80, textAlignVertical: "top" },
  segmentedBtn: { flex: 1, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24, height: 48, borderRadius: 24 },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 14, marginTop: 10 },
  btn: { height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" }
});
