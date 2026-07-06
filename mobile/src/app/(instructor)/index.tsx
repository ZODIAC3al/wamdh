import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView, Image, ActivityIndicator,
  StyleSheet, Dimensions, RefreshControl, Modal, TextInput, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import HubHeaderButton from "../../components/HubHeaderButton";
import { PremiumChart } from "../../components/PremiumChart";
import { useWamdh } from "../../context/WamdhContext";

interface ScheduleSlot {
  id: string;
  title: string;
  type: "online" | "offline";
  time: string;
  location: string;
  link?: string;
}

interface CohortCourse {
  id: string;
  title: string;
  completion: number;
  enrolled: number;
}

interface Submission {
  id: string;
  assignment_title: string;
  student_name: string;
  code: string;
  status: string;
  submitted_at: string;
}

export default function InstructorDashboard() {
  const router = useRouter();
  const { colors, isDark: dark, locale, isRtl, t, user, logout, setThemeMode } = useWamdh();

  const PRIMARY = colors.accent;
  const RED = colors.danger;
  const GREEN = colors.success;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States for stats and widgets
  const [stats, setStats] = useState<any>({
    total_students: 125,
    active_today: 42,
    total_courses: 5,
    completion_rate: 78.5,
    avg_quiz_score: 84.0,
    pending_review: 2
  });

  const [cohorts, setCohorts] = useState<CohortCourse[]>([
    { id: "1", title: "Machine Learning Essentials", completion: 74, enrolled: 45 },
    { id: "2", title: "Full Stack Mobile Apps", completion: 48, enrolled: 30 },
    { id: "3", title: "Data Structures & Algos", completion: 90, enrolled: 50 }
  ]);

  const [schedules, setSchedules] = useState<ScheduleSlot[]>([
    { id: "1", title: "ML Lecture 4: Neural Networks", type: "offline", time: "09:00 AM - 11:30 AM", location: "Classroom Alpha - Wamdh Main Center" },
    { id: "2", title: "React Native Navigation Sync", type: "online", time: "02:00 PM - 03:30 PM", location: "Zoom Sync Call", link: "https://zoom.us/j/12345" },
    { id: "3", title: "Office Hours: Q&A session", type: "offline", time: "04:00 PM - 05:00 PM", location: "Lecturer Desk B - Wamdh Main Center" }
  ]);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [calendarSlots, setCalendarSlots] = useState<string[]>(["09:00 AM", "02:00 PM"]); // locked slots to prevent double-booking

  // Modal Grading states
  const [activeSub, setActiveSub] = useState<Submission | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Overview stats
      const statsRes = await apiClient.get("/api/instructor/analytics/overview/");
      setStats(statsRes.data);

      // 2. Pending Submissions
      const subsRes = await apiClient.get("/api/instructor/submissions/");
      setSubmissions(subsRes.data);
    } catch (error) {
      console.log("Error loading instructor dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Grade student submission trigger
  const handleGradeSubmission = async () => {
    if (!activeSub) return;
    const score = parseFloat(gradeScore);
    if (isNaN(score) || score < 0 || score > 100) {
      Alert.alert(isRtl ? "درجة غير صالحة" : "Invalid Score", isRtl ? "يرجى إدخال درجة صالحة بين 0 و 100." : "Please enter a valid numeric score between 0 and 100.");
      return;
    }

    setSubmittingGrade(true);
    try {
      await apiClient.post(`/api/instructor/submissions/${activeSub.id}/grade/`, {
        score: score,
        feedback: gradeFeedback
      });
      Alert.alert(isRtl ? "تم الرصد" : "Graded", isRtl ? "تم رصد الدرجة بنجاح!" : "Score and feedback logged successfully!");
      setActiveSub(null);
      setGradeScore("");
      setGradeFeedback("");
      loadDashboardData();
    } catch (e) {
      Alert.alert(isRtl ? "خطأ" : "Error", isRtl ? "تعذر حفظ درجة الواجب." : "Could not save assignment grade.");
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Toggle calendar slot blocking
  const toggleBlockSlot = (slot: string) => {
    if (calendarSlots.includes(slot)) {
      setCalendarSlots(prev => prev.filter(s => s !== slot));
    } else {
      setCalendarSlots(prev => [...prev, slot]);
    }
  };

  const statsRow = [
    { label: isRtl ? "إجمالي الطلاب" : "Total Students", value: stats.total_students, icon: "people", color: PRIMARY },
    { label: isRtl ? "نشط اليوم" : "Active Today", value: stats.active_today, icon: "pulse", color: GREEN },
    { label: isRtl ? "إجمالي المساقات" : "Total Courses", value: stats.total_courses, icon: "book", color: PRIMARY },
    { label: isRtl ? "معدل الإكمال" : "Completion Rate", value: `${stats.completion_rate}%`, icon: "checkmark-circle", color: GREEN },
    { label: isRtl ? "متوسط الاختبارات" : "Avg Quiz Score", value: `${stats.avg_quiz_score}%`, icon: "trophy", color: PRIMARY },
    { label: isRtl ? "قيد المراجعة" : "Pending Review", value: submissions.length, icon: "time", color: RED },
  ];

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: bg }}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center" }}>
            <View style={[styles.avatar, { backgroundColor: PRIMARY }]}>
              <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 13 }}>
                {user?.username?.charAt(0).toUpperCase() || "I"}
              </Text>
            </View>
            <View style={{ alignItems: isRtl ? "flex-end" : "flex-start", marginHorizontal: 12 }}>
              <Text style={{ color: textSecondary, fontSize: 11 }}>{isRtl ? "مرحباً بك،" : "Good morning,"}</Text>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>{user?.username || "Dr. Ahmed"}</Text>
            </View>
          </View>
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 8 }}>
            <HubHeaderButton role="instructor" />
            <Pressable onPress={() => setThemeMode(dark ? "light" : "dark")} style={[styles.headerActionBtn, { backgroundColor: inputBg }]}>
              <Ionicons name={dark ? "sunny-outline" : "moon-outline"} size={20} color={PRIMARY} />
            </Pressable>
          </View>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 60 }} />
        ) : (
          <View style={{ padding: 20 }}>
            {/* Stats list */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }} contentContainerStyle={{ flexDirection: isRtl ? "row-reverse" : "row" }}>
              {statsRow.map((s, idx) => (
                <View key={idx} style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Ionicons name={s.icon as any} size={16} color={s.color} />
                    <Text style={{ color: textSecondary, fontSize: 10, fontFamily: "Inter_700Bold" }}>{s.label}</Text>
                  </View>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20 }}>{s.value}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Today's Schedule timeline */}
            <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
              {isRtl ? "جدول محاضرات اليوم" : "Today's Schedules"}
            </Text>
            <View style={{ gap: 10, marginBottom: 24 }}>
              {schedules.map(slot => (
                <View key={slot.id} style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>{slot.title}</Text>
                    <View style={[styles.badge, { backgroundColor: slot.type === "online" ? "#3B82F620" : PRIMARY + "15" }]}>
                      <Text style={{ color: slot.type === "online" ? "#3B82F6" : PRIMARY, fontSize: 10, fontFamily: "Inter_700Bold" }}>
                        {slot.type === "online" ? "Online link" : "Classroom"}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 6, alignItems: "center" }}>
                    <Ionicons name="time-outline" size={13} color={textSecondary} />
                    <Text style={{ color: textSecondary, fontSize: 11 }}>{slot.time}</Text>
                  </View>
                  <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 6, alignItems: "center", marginTop: 4 }}>
                    <Ionicons name="location-outline" size={13} color={textSecondary} />
                    <Text style={{ color: textSecondary, fontSize: 11 }}>{slot.location}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Cohorts with completed module sliders */}
            <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
              {isRtl ? "المجموعات والتقدم الدراسي" : "Cohort Completion Timelines"}
            </Text>
            <View style={{ gap: 10, marginBottom: 24 }}>
              {cohorts.map(c => (
                <View key={c.id} style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, textAlign: isRtl ? "right" : "left" }}>{c.title}</Text>
                  <Text style={{ color: textSecondary, fontSize: 10, marginTop: 2, textAlign: isRtl ? "right" : "left" }}>
                    {c.enrolled} {isRtl ? "طالب مسجل" : "students enrolled"}
                  </Text>
                  
                  {/* Slider bar indicator */}
                  <View style={{ marginVertical: 10 }}>
                    <View style={[styles.progressBar, { backgroundColor: dark ? "#2A2A40" : "#E5E7EB" }]}>
                      <View style={[styles.progressFill, { width: `${c.completion}%`, backgroundColor: PRIMARY }]} />
                    </View>
                    <Text style={{ color: PRIMARY, fontSize: 11, fontFamily: "Inter_700Bold", alignSelf: "flex-end", marginTop: 4 }}>
                      {c.completion}% {isRtl ? "مكتمل" : "Modules Completed"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Submissions Pending Review Hub */}
            <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
              {isRtl ? "مركز تصحيح الواجبات والمشاريع" : "Pending Review Hub"}
            </Text>
            {submissions.length === 0 ? (
              <Text style={{ color: textSecondary, fontSize: 12, fontStyle: "italic", marginBottom: 24, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? "لا توجد واجبات قيد المراجعة حالياً" : "All clear! No student submissions waiting for grades."}
              </Text>
            ) : (
              <View style={{ gap: 10, marginBottom: 24 }}>
                {submissions.map(sub => (
                  <View key={sub.id} style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, textAlign: isRtl ? "right" : "left" }}>
                      {sub.assignment_title}
                    </Text>
                    <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2, textAlign: isRtl ? "right" : "left" }}>
                      {isRtl ? `بواسطة: ${sub.student_name}` : `By student: ${sub.student_name}`}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setActiveSub(sub);
                        setGradeScore("");
                        setGradeFeedback("");
                      }}
                      style={[styles.gradeBtn, { backgroundColor: PRIMARY }]}
                    >
                      <Ionicons name="create-outline" size={14} color="#FFFFFF" />
                      <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: 4 }}>
                        {isRtl ? "مراجعة ورصد الدرجة" : "Grade Submission"}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Sync lecturer hours calendar */}
            <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
              {isRtl ? "جدولة الساعات ومنع التضارب" : "Lecture Slot Sync Calendar"}
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 12, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? "انقر على الساعات المتاحة لحجزها أو إلغائها وتجنب الحجز المزدوج للقاعات:" : "Block/Unblock slots below to manage center availability and prevent double bookings:"}
              </Text>
              
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {["09:00 AM", "10:30 AM", "12:00 PM", "02:00 PM", "03:30 PM", "05:00 PM"].map(slot => {
                  const isBlocked = calendarSlots.includes(slot);
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => toggleBlockSlot(slot)}
                      style={[styles.slotChip, {
                        backgroundColor: isBlocked ? "#EF444420" : "#10B98115",
                        borderColor: isBlocked ? "#EF4444" : "#10B981",
                      }]}
                    >
                      <Ionicons name={isBlocked ? "ban" : "checkmark-circle"} size={12} color={isBlocked ? "#EF4444" : "#10B981"} />
                      <Text style={{ color: isBlocked ? "#EF4444" : "#10B981", fontSize: 11, fontFamily: "Inter_700Bold", marginLeft: 4 }}>
                        {slot} {isBlocked ? (isRtl ? "محجوز" : "Blocked") : (isRtl ? "متاح" : "Free")}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Physical slots utilization chart */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 14 }]}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 13, marginBottom: 10, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? "معدل إشغال ساعات المحاضرات" : "Lecture Hours Booked / Center Capacity"}
              </Text>
              <View style={{ height: 130 }}>
                <PremiumChart
                  data={[
                    { day: "Sun", hours: 40 },
                    { day: "Mon", hours: 60 },
                    { day: "Tue", hours: 80 },
                    { day: "Wed", hours: 30 },
                    { day: "Thu", hours: 50 }
                  ]}
                  xKey="day"
                  yKey="hours"
                  color={PRIMARY}
                  type="bar"
                  height={130}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Submission Review Grading modal */}
      {activeSub && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15 }}>
                  {isRtl ? "تصحيح واجب" : "Grade student submission"}
                </Text>
                <Pressable onPress={() => setActiveSub(null)}>
                  <Ionicons name="close" size={20} color={textPrimary} />
                </Pressable>
              </View>

              <Text style={{ color: textSecondary, fontSize: 12 }}>{activeSub.assignment_title}</Text>
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 4 }}>
                {isRtl ? `الطالب: ${activeSub.student_name}` : `Student: ${activeSub.student_name}`}
              </Text>

              {/* Code Preview */}
              <ScrollView style={[styles.codeBox, { backgroundColor: inputBg }]} nestedScrollEnabled>
                <Text style={{ color: textSecondary, fontFamily: "JetBrainsMono_400Regular", fontSize: 10 }}>
                  {activeSub.code}
                </Text>
              </ScrollView>

              {/* Grade inputs */}
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 12, marginTop: 14, marginBottom: 4 }}>
                {isRtl ? "الدرجة (0 - 100):" : "Score (0 - 100):"}
              </Text>
              <TextInput
                placeholder="95"
                placeholderTextColor={textSecondary}
                value={gradeScore}
                onChangeText={setGradeScore}
                keyboardType="numeric"
                style={[styles.modalInput, { backgroundColor: inputBg, color: textPrimary, borderColor: cardBorder }]}
              />

              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 12, marginTop: 12, marginBottom: 4 }}>
                {isRtl ? "ملاحظات المعلم والتعليق:" : "Instructor Feedback:"}
              </Text>
              <TextInput
                placeholder="Excellent implementation of the components."
                placeholderTextColor={textSecondary}
                value={gradeFeedback}
                onChangeText={setGradeFeedback}
                multiline
                style={[styles.modalInput, { backgroundColor: inputBg, color: textPrimary, borderColor: cardBorder, height: 72, textAlignVertical: "top" }]}
              />

              <Pressable
                onPress={handleGradeSubmission}
                disabled={submittingGrade}
                style={[styles.modalSubmitBtn, { backgroundColor: PRIMARY }]}
              >
                {submittingGrade ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>
                      {isRtl ? "رصد وإرسال" : "Submit Grade"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1 },
  avatar: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerActionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statCard: { borderRadius: 14, padding: 12, borderWidth: 1, marginRight: 8, width: 130 },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 14, marginTop: 18, marginBottom: 12 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  gradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 8, marginTop: 10 },
  slotChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50, borderWidth: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  modalCard: { borderRadius: 20, padding: 20, borderWidth: 1 },
  codeBox: { maxHeight: 120, borderRadius: 10, padding: 12, marginVertical: 8 },
  modalInput: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  modalSubmitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 50, marginTop: 18 }
});
