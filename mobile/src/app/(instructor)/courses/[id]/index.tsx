import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Image,
  TextInput, Alert, RefreshControl
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../../lib/api";
import { PremiumChart } from "../../../../components/PremiumChart";
import { useWamdh } from "../../../../context/WamdhContext";

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const PRIMARY = colors.accent;
  const GREEN = colors.success;
  const RED = colors.danger;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"chapters" | "students" | "quizzes" | "analytics">("chapters");

  // Tab Data States
  const [chapters, setChapters] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Student Search
  const [studentSearch, setStudentSearch] = useState("");

  const loadAllCourseData = async () => {
    try {
      // 1. Fetch Course details
      const courseRes = await apiClient.get(`/api/instructor/courses/${id}/`);
      setCourse(courseRes.data);

      // 2. Fetch Chapters
      const chaptersRes = await apiClient.get(`/api/instructor/courses/${id}/chapters/`);
      setChapters(chaptersRes.data);

      // 3. Fetch Enrolled Students
      const studentsRes = await apiClient.get(`/api/instructor/courses/${id}/students/`);
      setStudents(studentsRes.data);

      // 4. Fetch Quizzes
      const quizzesRes = await apiClient.get(`/api/instructor/courses/${id}/quizzes/`);
      setQuizzes(quizzesRes.data);

      // 5. Fetch Analytics
      const analyticsRes = await apiClient.get("/api/instructor/analytics/courses/");
      const thisCourseAnalytics = analyticsRes.data.find((c: any) => c.course_id === id);
      setAnalytics(thisCourseAnalytics || {
        completion_rate: 72,
        avg_score: 81,
        weekly_active: [12, 19, 32, 28, 45, 38, 52, 60],
        drop_off_chapter: "Chapter 2: Neural Setup"
      });

    } catch (e) {
      console.log("Error loading course details:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllCourseData();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllCourseData();
  };

  const handleToggleLock = async (cid: string, currentLock: boolean) => {
    try {
      const action = currentLock ? "unlock" : "lock";
      await apiClient.patch(`/api/instructor/courses/${id}/chapters/${cid}/${action}/`);
      setChapters(prev => prev.map(ch => ch.id === cid ? { ...ch, is_locked: !currentLock } : ch));
    } catch (e) {
      Alert.alert("Error", "Could not toggle chapter status.");
    }
  };

  const handlePublishToggle = async () => {
    if (!course) return;
    const isPublished = course.status === "published";
    const nextStatus = isPublished ? "unpublish" : "publish";
    try {
      const res = await apiClient.patch(`/api/instructor/courses/${id}/${nextStatus}/`);
      setCourse({ ...course, status: res.data.status });
      Alert.alert("Success", `Course is now ${res.data.status}`);
    } catch (e) {
      Alert.alert("Error", "Could not change publishing status.");
    }
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  if (!course) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        {loading ? (
          <ActivityIndicator size="large" color={PRIMARY} />
        ) : (
          <View style={{ alignItems: "center", padding: 20 }}>
            <Ionicons name="alert-circle-outline" size={48} color={PRIMARY} style={{ marginBottom: 12 }} />
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, textAlign: "center" }}>
              Course Not Found
            </Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4, textAlign: "center", marginBottom: 20 }}>
              The course you are looking for does not exist or has been deleted.
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={{
                backgroundColor: PRIMARY,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 12,
                shadowColor: PRIMARY,
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 13 }}>
                Go Back
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  const performanceColor = (score: number) => {
    if (score >= 75) return { text: GREEN, bg: GREEN + "15", label: "Good" };
    if (score >= 50) return { text: "#BE1A1A", bg: "#BE1A1A" + "15", label: "Moderate" };
    return { text: RED, bg: RED + "15", label: "At Risk" };
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={1}>Course Manager</Text>
        <Pressable onPress={() => router.push(`/(instructor)/courses/${id}/edit` as any)} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="pencil-outline" size={20} color={PRIMARY} />
        </Pressable>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Banner/Thumbnail image */}
        {course.thumbnail_url ? (
          <Image source={{ uri: course.thumbnail_url }} style={styles.bannerImage} />
        ) : (
          <View style={[styles.bannerPlaceholder, { backgroundColor: PRIMARY + "20" }]}>
            <Ionicons name="image-outline" size={48} color={PRIMARY} />
            <Text style={{ color: PRIMARY, fontFamily: "Sora_700Bold", fontSize: 13, marginTop: 10 }}>Thumbnail Mock Image</Text>
          </View>
        )}

        {/* Course Info Summary */}
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.courseTitle, { color: textPrimary }]}>{course.title}</Text>
              <Text style={[styles.courseDesc, { color: textSecondary }]}>{course.description}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Pressable
                onPress={handlePublishToggle}
                style={[
                  styles.publishToggleBtn,
                  { backgroundColor: course.status === "published" ? GREEN + "15" : inputBg }
                ]}
              >
                <Text style={{ color: course.status === "published" ? GREEN : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                  {course.status === "published" ? "🟢 Published" : "Draft"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={[styles.statsGrid, { borderColor: cardBorder }]}>
            <View style={[styles.gridCell, { borderRightWidth: 1, borderRightColor: cardBorder }]}>
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 10 }}>STUDENTS</Text>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 4 }}>
                {course.enrolled_count || 0}
              </Text>
            </View>
            <View style={[styles.gridCell, { borderRightWidth: 1, borderRightColor: cardBorder }]}>
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 10 }}>COMPLETION</Text>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 4 }}>
                {analytics?.completion_rate || 72}%
              </Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 10 }}>QUIZ AVG</Text>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 4 }}>
                {analytics?.avg_score || 81}%
              </Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={[styles.tabBar, { borderBottomColor: cardBorder }]}>
            {([
              { key: "chapters", label: "Chapters" },
              { key: "students", label: "Students" },
              { key: "quizzes", label: "Quizzes" },
              { key: "analytics", label: "Analytics" }
            ] as const).map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabBtn,
                  activeTab === tab.key && { borderBottomColor: PRIMARY, borderBottomWidth: 3 }
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: activeTab === tab.key ? PRIMARY : textSecondary,
                      fontFamily: activeTab === tab.key ? "Sora_700Bold" : "Inter_500Medium"
                    }
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab Content Renderer */}
          <View style={{ marginTop: 20 }}>
            {activeTab === "chapters" && (
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>Course Structure</Text>
                  <Pressable
                    onPress={() => router.push(`/(instructor)/courses/${id}/chapters/create` as any)}
                    style={[styles.addBtn, { backgroundColor: PRIMARY }]}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 12 }}>Add Chapter</Text>
                  </Pressable>
                </View>

                {chapters.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 20 }}>
                    <Ionicons name="list" size={36} color={textSecondary} />
                    <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 8 }}>No chapters yet.</Text>
                  </View>
                ) : (
                  chapters.map((ch, index) => (
                    <Pressable
                       key={ch.id}
                       onPress={() => router.push(`/(instructor)/courses/${id}/chapters/${ch.id}` as any)}
                       style={[styles.chapterCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>
                            {index + 1}. {ch.title}
                          </Text>
                          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>
                            {ch.description || "No description provided."}
                          </Text>
                        </View>

                        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                          <Pressable
                            onPress={() => handleToggleLock(ch.id, ch.is_locked)}
                            style={[styles.lockBtn, { backgroundColor: ch.is_locked ? RED + "15" : GREEN + "15" }]}
                          >
                            <Ionicons name={ch.is_locked ? "lock-closed" : "lock-open"} size={16} color={ch.is_locked ? RED : GREEN} />
                          </Pressable>
                          <Ionicons name="chevron-forward" size={18} color={textSecondary} />
                        </View>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            )}

            {activeTab === "students" && (
              <View>
                <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor: cardBorder, marginBottom: 14 }]}>
                  <Ionicons name="search" size={16} color={textSecondary} />
                  <TextInput
                    placeholder="Search enrolled students..."
                    placeholderTextColor={textSecondary}
                    value={studentSearch}
                    onChangeText={setStudentSearch}
                    style={{ flex: 1, fontFamily: "Inter_500Medium", fontSize: 13, color: textPrimary }}
                  />
                </View>

                {students.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 20 }}>
                    <Ionicons name="people" size={36} color={textSecondary} />
                    <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 8 }}>No enrolled students.</Text>
                  </View>
                ) : (
                  students
                    .filter((s) => s.student_name?.toLowerCase().includes(studentSearch.toLowerCase()))
                    .map((s, idx) => {
                      const colorInfo = performanceColor(s.quiz_avg || 0);
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => router.push(`/(instructor)/students/${s.student_id}` as any)}
                          style={[styles.studentCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                        >
                          <View style={[styles.avatarCircle, { backgroundColor: PRIMARY + "20" }]}>
                            <Text style={{ color: PRIMARY, fontFamily: "Sora_700Bold", fontSize: 12 }}>
                              {s.student_name?.charAt(0).toUpperCase()}
                            </Text>
                          </View>

                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>{s.student_name}</Text>
                            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 2 }}>
                              Progress: {s.progress_percent || 0}% · Hours: {s.study_hours || 0}h
                            </Text>
                          </View>

                          <View style={[styles.badge, { backgroundColor: colorInfo.bg }]}>
                            <Text style={{ color: colorInfo.text, fontFamily: "Inter_700Bold", fontSize: 10 }}>
                              {s.quiz_avg || 0}% {colorInfo.label}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })
                )}
              </View>
            )}

            {activeTab === "quizzes" && (
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>Course Quizzes</Text>
                  <Pressable
                    onPress={() => router.push({ pathname: `/(instructor)/courses/${id}/quiz/create`, params: { courseId: id } } as any)}
                    style={[styles.addBtn, { backgroundColor: PRIMARY }]}
                  >
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                    <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 12, marginLeft: 4 }}>Gen AI Quiz</Text>
                  </Pressable>
                </View>

                {quizzes.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 20 }}>
                    <Ionicons name="list" size={36} color={textSecondary} />
                    <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 8 }}>No quizzes created.</Text>
                  </View>
                ) : (
                  quizzes.map((q) => (
                    <Pressable
                      key={q.id}
                      onPress={() => router.push(`/(instructor)/courses/${id}/quiz/${q.id}` as any)}
                      style={[styles.quizCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>{q.title}</Text>
                          <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 4 }}>
                            Time limit: {q.time_limit} mins · Questions: {q.questions?.length || 0}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={textSecondary} />
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            )}

            {activeTab === "analytics" && (
              <View>
                <View style={[styles.cardAnal, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14, marginBottom: 12 }}>Weekly Active Engagement</Text>
                  <View style={{ height: 160 }}>
                    <PremiumChart
                      data={(analytics?.weekly_active || [12, 19, 32, 28, 45, 38, 52, 60]).map((v: number, i: number) => ({
                        week: `W${i + 1}`,
                        value: v
                      }))}
                      xKey="week"
                      yKey="value"
                      color={PRIMARY}
                      type="bar"
                      height={160}
                    />
                  </View>
                </View>

                {analytics?.drop_off_chapter && (
                  <View style={[styles.infoRow, { backgroundColor: RED + "10", borderColor: RED + "30", borderLeftWidth: 4, padding: 14, marginTop: 14, borderRadius: 8 }]}>
                    <Ionicons name="alert-circle" size={18} color={RED} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={{ color: RED, fontFamily: "Sora_700Bold", fontSize: 13 }}>Major Drop-Off Alert</Text>
                      <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 }}>
                        Most students drop off at: <Text style={{ fontFamily: "Inter_700Bold" }}>{analytics.drop_off_chapter}</Text>
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17, flex: 1, textAlign: "center", marginHorizontal: 10 },
  bannerImage: { width: "100%", height: 180 },
  bannerPlaceholder: { width: "100%", height: 180, alignItems: "center", justifyContent: "center" },
  courseTitle: { fontFamily: "Sora_700Bold", fontSize: 18 },
  courseDesc: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 6, lineHeight: 18 },
  publishToggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statsGrid: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, marginVertical: 18, paddingVertical: 12 },
  gridCell: { flex: 1, alignItems: "center" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabLabel: { fontSize: 13 },
  addBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  chapterCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  lockBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 40, borderRadius: 10, borderWidth: 1, gap: 8 },
  studentCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  quizCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  cardAnal: { padding: 16, borderRadius: 16, borderWidth: 1 },
  infoRow: { flexDirection: "row", alignItems: "center" }
});
