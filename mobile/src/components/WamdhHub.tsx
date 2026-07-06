import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { useUiStore } from "../store/uiStore";
import { getHubCatalog } from "../lib/hubCatalog";
import type { UserRole } from "../store/authStore";
import { useWamdh } from "../context/WamdhContext";

// Map catalog item labels to the corresponding translation keys in i18n.ts
const translationKeyMap: Record<string, any> = {
  "Quiz Center": "quizzes",
  "Flashcards": "flashcards",
  "Study Planner": "planner",
  "Focus Timer": "focus_timer",
  "Downloads": "notes",
  "AI Voice Tutor": "voice_mode",
  "AI Lecture Gen": "lecture_gen",
  "Mock Exam Sim": "exam_sim",
  "Analytics": "recommendations",
  "AI Search": "search",
  "XP & Shop": "achievements",
  "Mindmap": "mindmap",
  "Whiteboard": "whiteboard",
  "Bilingual Glossary": "bilingual_glossary",
  "Study Rooms": "welcome",
  "Leaderboard": "leaderboard",
  "GPA Calculator": "career_mode",
  "Theme": "change_lang",
  "Code Playground": "code_playground",
  "My Groups": "study_groups",
  
  // Instructor
  "Quiz Builder": "question_bank",
  "Assignments": "ai_grader",
  "Exam Creator": "live_quizzes",
  "Announcements": "ai_ta_bot",
  "Office Hours": "office_scheduler",
  "Course Analytics": "warning_analytics",
  "AI Lesson Gen": "syllabus_scheduler",
  "Classroom": "classroom",
  "Syllabus Gaps": "gap_analyzer",
  "Plagiarism Check": "plagiarism_check",
  
  // Admin
  "API Quota Control": "budget_limits",
  "Prompt Playground": "prompt_manager",
  "Security & GDPR": "gdpr_exporter",
  "System Telemetry": "queue_monitor",
  "Stripe Dashboard": "stripe_churn",
  "Moderation Queue": "toxic_shield",
  "Vector Health": "vector_health",
  "Referral Manager": "referral_controller",
  "Audit Logs": "moderation_audit",
};

interface WamdhHubProps {
  role: UserRole;
}

export default function WamdhHub({ role }: WamdhHubProps) {
  const router = useRouter();
  const { colors, isDark: dark, locale, isRtl, t } = useWamdh();
  const { hubVisible, hubRole, closeHub } = useUiStore();
  const queryClient = useQueryClient();

  // Focus Timer (Pomodoro Widget) State
  const [timerTime, setTimerTime] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const focusTimerRef = useRef<any>(null);

  useEffect(() => {
    if (timerActive) {
      focusTimerRef.current = setInterval(() => {
        setTimerTime(prev => {
          if (prev <= 1) {
            clearInterval(focusTimerRef.current);
            setTimerActive(false);
            Alert.alert(isRtl ? "انتهت جلسة التركيز!" : "Focus Session Finished!", isRtl ? "لقد أكملت ٢٥ دقيقة من التركيز، خذ قسطاً من الراحة!" : "You have completed 25 minutes of focus, take a short break!");
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    }
    return () => {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    };
  }, [timerActive]);

  // Today's Planner Checklist Query
  const { data: todayTasks, refetch: refetchTasks } = useQuery<any[]>({
    queryKey: ["planner-today-hub"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/api/planner/today/");
        return res.data;
      } catch (e) {
        return [];
      }
    },
    enabled: role === "student" && hubVisible,
  });

  const toggleTask = async (taskId: number) => {
    try {
      await apiClient.patch(`/api/planner/task/${taskId}/`);
      refetchTasks();
      queryClient.invalidateQueries({ queryKey: ["planner-today"] });
    } catch (e) {
      console.log("Error toggling task:", e);
    }
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const categories = getHubCatalog(role);
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;

  const getTranslatedLabel = (label: string) => {
    if (isRtl && label === "Wamdh Store") return "متجر ومضة 🏪";
    if (isRtl && label === "Exam Predictor") return "توقع الامتحانات 🎯";
    const key = translationKeyMap[label];
    return key ? t(key) : label;
  };

  const getTranslatedDesc = (label: string, sub: string) => {
    if (isRtl) {
      switch (label) {
        case "Quiz Center": return "خذ اختبارات سريعة بالذكاء الاصطناعي";
        case "Flashcards": return "مراجعة الحزم بطريقة SM-2";
        case "Study Planner": return "جدول المهام اليومية للمذاكرة";
        case "Focus Timer": return "مؤقت وضع التركيز بومودورو";
        case "Downloads": return "المحتوى المتاح بلا إنترنت";
        case "AI Voice Tutor": return "تحدث مع منى معلمتك الشخصية";
        case "AI Lecture Gen": return "توليد تلقائي لملخصات المحاضرات";
        case "Mock Exam Sim": return "محاكاة شاملة للامتحانات النهائية";
        case "Analytics": return "إحصائيات تفصيلية لمستواك الدراسي";
        case "Exam Predictor": return "توقع مواضيع الاختبارات المهمة بالذكاء الاصطناعي";
        case "AI Search": return "بحث سيمانتك ذكي في ملاحظاتك";
        case "XP & Shop": return "متجر استبدال النقاط وحماية السلسلة";
        case "Wamdh Store": return "شراء السمات وحزم الذكاء الاصطناعي والميزات الذهبية";
        case "Mindmap": return "رسم خريطة مفاهيم للمناهج";
        case "Whiteboard": return "لوحة بيضاء حرة لتدوين الملاحظات";
        case "Bilingual Glossary": return "مصطلحات مترجمة إنجليزي-عربي";
        case "Study Rooms": return "غرف دراسية تفاعلية مع الزملاء";
        case "My Groups": return "أنشئ وأدر مجتمعاتك الدراسية";
        case "Leaderboard": return "ترتيب الطلاب الأسبوعي";
        case "GPA Calculator": return "حساب المعدل التراكمي وتتبع الأهداف";
        case "Theme": return "تخصيص وتغيير شكل التطبيق";
        case "Code Playground": return "محرر شيفرات البرمجة";
        
        // Instructor
        case "Quiz Builder": return "صمم بنوك أسئلة متكاملة للمقرر";
        case "Assignments": return "توزيع واجبات وتصحيح تلقائي";
        case "Exam Creator": return "إعداد امتحانات وتوزيعها للمنهج";
        case "Announcements": return "بث تحديثات وإعلانات الفصل";
        case "Office Hours": return "حجز وجدولة الساعات المكتبية";
        case "Course Analytics": return "متابعة أداء الطلاب والتعثر الدراسي";
        case "AI Lesson Gen": return "التخطيط التلقائي للوحدات الدراسية";
        case "Classroom": return "فصول تفاعلية ذكية ومساعد تدريس";
        case "Syllabus Gaps": return "مقارنة المذاكرة مع أهداف المنهج";
        case "Plagiarism Check": return "مطابقة نصوص الواجبات وبيان النقل";
        
        // Admin
        case "API Quota Control": return "تحديد سقف تكاليف API والمستخدمين";
        case "Prompt Playground": return "تعديل واختبار توجيهات النماذج";
        case "Security & GDPR": return "تصدير البيانات وامتثال الخصوصية";
        case "System Telemetry": return "مراقبة المهام الخلفية وسيرفرات الاستضافة";
        case "Stripe Dashboard": return "تحليلات الأرباح ونسب إلغاء الاشتراك";
        case "Moderation Queue": return "تصفية وتدقيق البلاغات والمحادثات";
        case "Vector Health": return "قياس زمن الاستجابة لمحرك البحث";
        case "Referral Manager": return "إعداد وإدارة حملات الإحالة";
        case "Audit Logs": return "تتبع سجل عمليات الإشراف والنظام";
        default: return sub;
      }
    }
    return sub;
  };

  if (hubRole !== role) return null;

  return (
    <Modal
      visible={hubVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeHub}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              borderBottomColor: cardBorder,
              backgroundColor: colors.cardBg,
              flexDirection: isRtl ? "row-reverse" : "row"
            },
          ]}
        >
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center" }}>
            <Ionicons name="grid-outline" size={22} color={ACCENT} style={{ marginLeft: isRtl ? 8 : 0, marginRight: isRtl ? 0 : 8 }} />
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18 }}>
              {isRtl ? "مركز أدوات ومضة" : "Wamdh Hub"}
            </Text>
          </View>
          <Pressable onPress={closeHub} hitSlop={8}>
            <Ionicons name="close-circle-outline" size={28} color={textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <Text style={{
            color: textSecondary,
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            marginBottom: 20,
            textAlign: isRtl ? "right" : "left"
          }}>
            {isRtl ? "كل ما تحتاجه لتنظيم رحلتك التعليمية في مكان واحد." : "Everything you need, organized in a single place."}
          </Text>

          {role === "student" && (
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 12, marginBottom: 16 }}>
                
                {/* 1. Pomodoro Focus Timer Widget */}
                <View style={[styles.widgetCard, { backgroundColor: colors.cardBg, borderColor: colors.border, flex: 1 }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ color: textSecondary, fontFamily: "Sora_700Bold", fontSize: 11 }}>
                      {isRtl ? "عداد التركيز" : "FOCUS TIMER"}
                    </Text>
                    <Ionicons name="timer" size={14} color={ACCENT} />
                  </View>
                  <Text style={{ color: textPrimary, fontFamily: "JetBrainsMono_400Regular", fontSize: 24, marginVertical: 4 }}>
                    {formatTimer(timerTime)}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                    <Pressable
                      onPress={() => setTimerActive(!timerActive)}
                      style={[styles.widgetBtn, { backgroundColor: timerActive ? "#EF444420" : ACCENT + "20" }]}
                    >
                      <Ionicons name={timerActive ? "pause" : "play"} size={12} color={timerActive ? "#EF4444" : ACCENT} />
                      <Text style={{ color: timerActive ? "#EF4444" : ACCENT, fontSize: 10, fontFamily: "Inter_700Bold", marginLeft: 4 }}>
                        {timerActive ? (isRtl ? "مؤقت" : "Pause") : (isRtl ? "ابدأ" : "Start")}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { setTimerActive(false); setTimerTime(25 * 60); }}
                      style={[styles.widgetBtn, { backgroundColor: colors.inputBg }]}
                    >
                      <Ionicons name="refresh" size={12} color={textSecondary} />
                    </Pressable>
                  </View>
                </View>

                {/* 2. Today's Agenda Checklist Widget */}
                <View style={[styles.widgetCard, { backgroundColor: colors.cardBg, borderColor: colors.border, flex: 1.2 }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ color: textSecondary, fontFamily: "Sora_700Bold", fontSize: 11 }}>
                      {isRtl ? "أجندة اليوم" : "TODAY'S AGENDA"}
                    </Text>
                    <Ionicons name="checkbox-outline" size={14} color="#10B981" />
                  </View>
                  
                  <ScrollView style={{ maxHeight: 72 }} nestedScrollEnabled>
                    {(!todayTasks || todayTasks.length === 0) ? (
                      <Text style={{ color: textSecondary, fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic", marginTop: 4 }}>
                        {isRtl ? "لا المهام مجدولة اليوم" : "No tasks today"}
                      </Text>
                    ) : (
                      todayTasks.map((task: any) => (
                        <Pressable
                          key={task.id}
                          onPress={() => toggleTask(task.id)}
                          style={[styles.taskItem, { flexDirection: isRtl ? "row-reverse" : "row" }]}
                        >
                          <Ionicons
                            name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                            size={14}
                            color={task.completed ? "#10B981" : textSecondary}
                          />
                          <Text style={{
                            color: task.completed ? textSecondary : textPrimary,
                            fontSize: 11,
                            fontFamily: "Inter_500Medium",
                            marginHorizontal: 6,
                            textDecorationLine: task.completed ? "line-through" : "none",
                            flex: 1,
                            textAlign: isRtl ? "right" : "left"
                          }} numberOfLines={1}>
                            {task.topic}
                          </Text>
                        </Pressable>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            </View>
          )}

          {categories.map((cat) => (
            <View key={cat.title} style={{ marginBottom: 24 }}>
              <Text style={[
                styles.categoryTitle,
                {
                  color: ACCENT,
                  textAlign: isRtl ? "right" : "left"
                }
              ]}>
                {isRtl ? (
                  cat.title === "Study Tools" ? "أدوات الدراسة" :
                  cat.title === "Analytics & AI" ? "التحليلات والذكاء الاصطناعي" :
                  cat.title === "Social & Extras" ? "التفاعل والمجتمع" :
                  cat.title === "Teaching Tools" ? "أدوات التدريس والمعلم" :
                  cat.title === "AI & Analytics" ? "الذكاء الاصطناعي والإحصاء" :
                  cat.title === "Platform Management" ? "إدارة المنصة" : "العمليات التشغيلية"
                ) : cat.title}
              </Text>
              <View style={[styles.grid, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
                {cat.features.map((feat) => {
                  const featColor = (feat.color === "#BE1A1A" || feat.color === "#D0311E") ? ACCENT : feat.color;
                  return (
                    <Pressable
                      key={feat.label}
                      onPress={() => {
                        closeHub();
                        router.push(feat.route as any);
                      }}
                      style={[
                        styles.tile,
                        {
                          backgroundColor: colors.cardBg,
                          borderColor: cardBorder,
                          alignItems: isRtl ? "flex-end" : "flex-start",
                        },
                      ]}
                    >
                      <View style={[styles.tileIcon, { backgroundColor: featColor + "22", alignSelf: isRtl ? "flex-end" : "flex-start" }]}>
                        <Ionicons name={feat.icon as any} size={22} color={featColor} />
                      </View>
                      <Text
                        style={{
                          color: textPrimary,
                          fontFamily: "Inter_700Bold",
                          fontSize: 12,
                          marginTop: 8,
                          textAlign: isRtl ? "right" : "left"
                        }}
                        numberOfLines={1}
                      >
                        {getTranslatedLabel(feat.label)}
                      </Text>
                      <Text
                        style={{
                          color: textSecondary,
                          fontFamily: "Inter_400Regular",
                          fontSize: 10,
                          marginTop: 2,
                          textAlign: isRtl ? "right" : "left"
                        }}
                        numberOfLines={2}
                      >
                        {getTranslatedDesc(feat.label, feat.sub)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  categoryTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 14,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    width: (Dimensions.get("window").width - 50) / 2,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  widgetCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  widgetBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingVertical: 2,
  },
});
