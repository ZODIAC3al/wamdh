import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator, Alert
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

interface RubricCriterion {
  name: string;
  weight: number;
}

interface StudentSubmission {
  studentName: string;
  submissionText: string;
}

const MOCK_SUBMISSIONS: StudentSubmission[] = [
  {
    studentName: "Ali Mansour",
    submissionText: "Photosynthesis is the process by which light energy is captured by chlorophyll molecules in chloroplasts to produce glucose and oxygen from carbon dioxide and water. The light reactions happen in the thylakoid membranes where ATP and NADPH are synthesized. The Calvin cycle occurs in the stroma to fix carbon."
  },
  {
    studentName: "Sara Al-Otaibi",
    submissionText: "Photosynthesis takes place in chloroplasts. Chlorophyll captures sunlight. In light-dependent reactions, energy is converted into chemical energy (ATP/NADPH). Carbon dioxide is converted to organic compounds in light-independent Calvin cycle reactions."
  }
];

export default function RubricAiGradingScreen() {
  const router = useRouter();
  const { assignmentId, assignmentTitle } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  // Rubric state
  const [rubric, setRubric] = useState<RubricCriterion[]>([
    { name: isRtl ? "الدقة العلمية" : "Technical Accuracy", weight: 50 },
    { name: isRtl ? "الهيكلة والتنظيم" : "Structure & Formatting", weight: 30 },
    { name: isRtl ? "الابتكار" : "Creativity", weight: 20 }
  ]);

  const [newCriterionName, setNewCriterionName] = useState("");
  const [newCriterionWeight, setNewCriterionWeight] = useState("");

  const [selectedStudent, setSelectedStudent] = useState<StudentSubmission>(MOCK_SUBMISSIONS[0]);

  // AI draft results state
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [feedbackText, setFeedbackText] = useState("");

  const gradeMutation = useMutation({
    mutationFn: async () => {
      // Format rubric object for backend prompt
      const rubricObj: Record<string, string> = {};
      rubric.forEach(r => {
        rubricObj[r.name] = `${r.weight}% weight`;
      });

      const res = await apiClient.post("/api/ai/grade/", {
        submission_text: selectedStudent.submissionText,
        rubric: rubricObj
      });
      return res.data;
    },
    onSuccess: (data) => {
      setOverallScore(data.overall_score);
      setBreakdown(data.rubric_breakdown || {});
      setFeedbackText(data.feedback || "");
    },
    onError: (err: any) => {
      Alert.alert(
        isRtl ? "خطأ" : "Error",
        err.response?.data?.error || (isRtl ? "فشل طلب التقييم الذكي." : "Failed to run AI grading draft request.")
      );
    }
  });

  const handleAddCriterion = () => {
    if (!newCriterionName.trim()) return;
    const weightVal = parseInt(newCriterionWeight) || 0;
    
    // Check weight sum limit
    const currentSum = rubric.reduce((sum, curr) => sum + curr.weight, 0);
    if (currentSum + weightVal > 100) {
      Alert.alert(
        isRtl ? "تنبيه" : "Warning", 
        isRtl ? "مجموع أوزان المعايير لا يمكن أن يتخطى 100%" : "Total weights of criteria cannot exceed 100%"
      );
      return;
    }

    setRubric(prev => [...prev, { name: newCriterionName, weight: weightVal }]);
    setNewCriterionName("");
    setNewCriterionWeight("");
  };

  const handlePublishGrade = () => {
    Alert.alert(
      isRtl ? "نجاح" : "Success",
      isRtl ? "تم اعتماد ورصد الدرجة وإرسالها للطالب بنجاح!" : "Grade finalized and published to student gradebook!"
    );
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name={isRtl ? "arrow-forward" : "chevron-back"} size={20} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>
          {isRtl ? "تقييم بالذكاء الاصطناعي" : "Rubric AI Grading"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 16 }}>
        
        {/* Assignment Info */}
        <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: cardBorder, alignItems: isRtl ? "flex-end" : "flex-start" }]}>
          <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase" }}>
            {isRtl ? "الواجب الدراسي المحدد" : "Active Assignment"}
          </Text>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 4 }}>
            {assignmentTitle || (isRtl ? "تحميل الواجب..." : "Loading Assignment...")}
          </Text>
        </View>

        {/* 1. Rubric setup */}
        <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
          {isRtl ? "1. معايير التقييم (الروبيرك)" : "1. Setup Grading Rubric"}
        </Text>
        
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {rubric.map((criterion, idx) => (
            <View key={idx} style={[styles.rubricRow, { borderBottomColor: cardBorder, borderBottomWidth: idx < rubric.length - 1 ? 1 : 0, flexDirection: isRtl ? "row-reverse" : "row" }]}>
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                {criterion.name}
              </Text>
              <Text style={{ color: ACCENT, fontFamily: "Sora_700Bold", fontSize: 13 }}>
                {criterion.weight}%
              </Text>
              <Pressable onPress={() => setRubric(prev => prev.filter((_, i) => i !== idx))} style={{ marginLeft: isRtl ? 0 : 12, marginRight: isRtl ? 12 : 0 }}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </Pressable>
            </View>
          ))}

          {/* Add Criterion Form */}
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 8, marginTop: 14 }}>
            <TextInput
              value={newCriterionName}
              onChangeText={setNewCriterionName}
              placeholder={isRtl ? "اسم المعيار الجديد" : "Criterion name"}
              placeholderTextColor="#6B7280"
              style={[styles.input, { backgroundColor: inputBg, color: textPrimary, flex: 2, textAlign: isRtl ? "right" : "left" }]}
            />
            <TextInput
              value={newCriterionWeight}
              onChangeText={setNewCriterionWeight}
              placeholder={isRtl ? "الوزن %" : "Weight %"}
              placeholderTextColor="#6B7280"
              keyboardType="number-pad"
              style={[styles.input, { backgroundColor: inputBg, color: textPrimary, flex: 1, textAlign: isRtl ? "right" : "left" }]}
            />
            <Pressable onPress={handleAddCriterion} style={[styles.addBtn, { backgroundColor: ACCENT }]}>
              <Ionicons name="add" size={20} color={dark ? "#000" : "#fff"} />
            </Pressable>
          </View>
        </View>

        {/* 2. Select Student */}
        <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 20, textAlign: isRtl ? "right" : "left" }]}>
          {isRtl ? "2. اختر تسليم الطالب للتقييم" : "2. Select Student Submission"}
        </Text>

        <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 8, marginBottom: 12 }}>
          {MOCK_SUBMISSIONS.map((student) => {
            const isSelected = selectedStudent.studentName === student.studentName;
            return (
              <Pressable
                key={student.studentName}
                onPress={() => {
                  setSelectedStudent(student);
                  setOverallScore(null);
                }}
                style={[
                  styles.studentChip,
                  { backgroundColor: isSelected ? "#BE1A1A" : cardBg, borderColor: isSelected ? "#BE1A1A" : cardBorder }
                ]}
              >
                <Text style={{ color: isSelected ? "#FFFFFF" : textPrimary, fontFamily: "Inter_700Bold", fontSize: 12 }}>
                  {student.studentName}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Submission text box */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, alignItems: isRtl ? "flex-end" : "flex-start" }]}>
          <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 11, marginBottom: 8 }}>
            {isRtl ? `محتوى إجابة ${selectedStudent.studentName}:` : `${selectedStudent.studentName}'s Answer Content:`}
          </Text>
          <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, textAlign: isRtl ? "right" : "left" }}>
            {selectedStudent.submissionText}
          </Text>
        </View>

        {/* Grade triggering CTA */}
        <Pressable
          onPress={() => gradeMutation.mutate()}
          disabled={gradeMutation.isPending}
          style={[styles.actionBtn, { backgroundColor: "#BE1A1A", marginTop: 16 }]}
        >
          {gradeMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>
                {isRtl ? "اطلب مسودة التقييم الذكي" : "Request AI Draft Grade"}
              </Text>
            </View>
          )}
        </Pressable>

        {/* 3. AI Grading results */}
        {overallScore !== null && (
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
              {isRtl ? "3. النتيجة المستنتجة والملحوظات" : "3. Computed AI Grades & Feedback"}
            </Text>

            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                  {isRtl ? "الدرجة الكلية المقترحة" : "SUGGESTED OVERALL SCORE"}
                </Text>
                <Text style={{ color: ACCENT, fontFamily: "Sora_700Bold", fontSize: 44, marginTop: 4 }}>
                  {overallScore}/100
                </Text>
              </View>

              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 13, marginBottom: 8, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? "تفصيل درجات المعايير (من 10):" : "Rubric Breakdown (out of 10):"}
              </Text>
              
              {Object.entries(breakdown).map(([key, val]) => (
                <View key={key} style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: cardBorder }}>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 12 }}>{key}</Text>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 12 }}>{val}/10</Text>
                </View>
              ))}

              {/* Feedback editor */}
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 13, marginTop: 16, marginBottom: 8, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? "ملحوظات المعلم والتوجيهات:" : "Constructive Feedback & Comments:"}
              </Text>
              <TextInput
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
                style={[styles.feedbackInput, { backgroundColor: inputBg, color: textPrimary, textAlign: isRtl ? "right" : "left" }]}
              />

              {/* Confirm & Publish button */}
              <Pressable
                onPress={handlePublishGrade}
                style={[styles.actionBtn, { backgroundColor: "#10B981", marginTop: 20 }]}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  {isRtl ? "اعتماد ونشر الدرجة" : "Confirm & Publish Grade"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

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
  infoCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 10 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  rubricRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  input: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, fontFamily: "Inter_500Medium", fontSize: 12 },
  addBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  studentChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  actionBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  feedbackInput: { padding: 12, borderRadius: 10, minHeight: 80, fontSize: 13, fontFamily: "Inter_400Regular" }
});
