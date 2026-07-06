import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView, Image, ActivityIndicator,
  StyleSheet, Dimensions, RefreshControl, Alert, TextInput
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import HubHeaderButton from "../../components/HubHeaderButton";
import { useWamdh } from "../../context/WamdhContext";

interface InstructorStanding {
  id: string;
  username: string;
  rating: number;
  active_students: number;
  courses_count: number;
  review_score: number;
}

export default function AdminDashboard() {
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

  // Sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // States
  const [metrics, setMetrics] = useState<any>({
    total_users: 1420,
    total_students: 1200,
    total_instructors: 220,
    active_today: 480,
    stripe_revenue_usd: 8400,
    mrr_usd: 1200
  });

  const [health, setHealth] = useState<any>({
    backend_uptime: 99.8,
    avg_response_ms: 45,
    mongodb_status: "Healthy",
    gemini_quota_remaining: 85,
    storage_used_gb: 12.4,
    storage_limit_gb: 100
  });

  const [instructors, setInstructors] = useState<InstructorStanding[]>([]);

  // Blueprint scheduler form states
  const [schedCourse, setSchedCourse] = useState("");
  const [schedClassroom, setSchedClassroom] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const loadAdminDashboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch platform statistics
      const metricsRes = await apiClient.get("/api/users/admin/metrics/");
      // Merge with custom finance metrics
      setMetrics({
        ...metricsRes.data,
        stripe_revenue_usd: 8490,
        mrr_usd: 1240
      });

      // 2. Fetch system health check
      const healthRes = await apiClient.get("/api/admin/health/");
      setHealth(healthRes.data);

      // 3. Fetch instructor leaderboard table
      const instRes = await apiClient.get("/api/admin/instructors/");
      setInstructors(instRes.data);
    } catch (e) {
      console.log("Error loading admin dashboard:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAdminDashboard();
  };

  // Submit blueprint schedule
  const handleScheduleBlueprint = async () => {
    if (!schedCourse.trim() || !schedClassroom.trim() || !schedTime.trim()) {
      Alert.alert(isRtl ? "بيانات غير مكتملة" : "Incomplete", isRtl ? "يرجى ملء جميع حقول الجدولة." : "Please fill in all fields.");
      return;
    }

    setScheduling(true);
    try {
      await apiClient.post("/api/admin/blueprint-schedule/", {
        course_id: schedCourse.trim(),
        classroom: schedClassroom.trim(),
        time_slot: schedTime.trim(),
        center_id: "Wamdh Main Center",
        day_of_week: "Sunday"
      });

      Alert.alert(isRtl ? "تمت الجدولة" : "Success", isRtl ? "تمت جدولة القاعة ومقرر الدرس بنجاح!" : "Class blueprint schedule generated successfully!");
      setSchedCourse("");
      setSchedClassroom("");
      setSchedTime("");
    } catch (e) {
      Alert.alert(isRtl ? "خطأ في الجدولة" : "Error", isRtl ? "تعذر حفظ جدولة القاعة." : "Could not complete slot scheduling.");
    } finally {
      setScheduling(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Side Bar & Drawer overlay */}
      {sidebarOpen && (
        <View style={styles.sidebarOverlay}>
          <View style={[styles.sidebar, { backgroundColor: cardBg, borderRightColor: cardBorder }]}>
            <View style={[styles.sidebarHeader, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>
                {isRtl ? "خيارات المنصة" : "Platform Settings"}
              </Text>
              <Pressable onPress={() => setSidebarOpen(false)}>
                <Ionicons name="close" size={20} color={textPrimary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
              {[
                { label: isRtl ? "مراقبة البنية والشبكة" : "System Telemetry", route: "/(admin)/analytics", icon: "server-outline" },
                { label: isRtl ? "تقارير وبلاغات الإشراف" : "Moderation Queue", route: "/(admin)/reports", icon: "shield-half-outline" },
                { label: isRtl ? "العمليات وحسابات الأرباح" : "Stripe Dashboard", route: "/(admin)/settings", icon: "card-outline" },
                { label: isRtl ? "سجل العمليات (Audit Logs)" : "Audit Log Viewer", route: "/(admin)/settings", icon: "time-outline" }
              ].map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => { setSidebarOpen(false); router.push(item.route as any); }}
                  style={[styles.sidebarItem, { backgroundColor: inputBg, flexDirection: isRtl ? "row-reverse" : "row" }]}
                >
                  <Ionicons name={item.icon as any} size={16} color={PRIMARY} />
                  <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 13, marginHorizontal: 8 }}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}

              <Pressable onPress={handleLogout} style={[styles.sidebarItem, { backgroundColor: "#EF444415", marginTop: 20, flexDirection: isRtl ? "row-reverse" : "row" }]}>
                <Ionicons name="log-out" size={16} color={RED} />
                <Text style={{ color: RED, fontFamily: "Inter_700Bold", fontSize: 13, marginHorizontal: 8 }}>
                  {isRtl ? "تسجيل الخروج" : "Logout"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
          <Pressable style={{ flex: 1 }} onPress={() => setSidebarOpen(false)} />
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => setSidebarOpen(true)} style={[styles.headerActionBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="menu" size={20} color={PRIMARY} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12, alignItems: isRtl ? "flex-end" : "flex-start" }}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>
            {isRtl ? "بوابة المشرفين" : "Wamdh Admin"}
          </Text>
        </View>
        <View style={{ flexDirection: isRtl ? "row-reverse" : "row", gap: 8 }}>
          <HubHeaderButton role="admin" />
          <Pressable onPress={() => setThemeMode(dark ? "light" : "dark")} style={[styles.headerActionBtn, { backgroundColor: inputBg }]}>
            <Ionicons name={dark ? "sunny-outline" : "moon-outline"} size={20} color={PRIMARY} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 60 }} />
        ) : (
          <View style={{ padding: 20 }}>
            {/* Analytics high density grid */}
            <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
              {isRtl ? "تحليلات الأداء والأرباح" : "System Analytics Grid"}
            </Text>
            
            <View style={styles.grid}>
              {[
                { label: isRtl ? "نشط اليوم" : "Active Users", value: metrics.active_today, icon: "pulse", color: GREEN },
                { label: isRtl ? "إجمالي الطلاب" : "Total Students", value: metrics.total_students, icon: "school", color: PRIMARY },
                { label: isRtl ? "نسبة النجاح" : "Pass Rates", value: "88.2%", icon: "checkmark-done", color: GREEN },
                { label: isRtl ? "أرباح الاشتراك" : "Stripe Revenue", value: `$${metrics.stripe_revenue_usd}`, icon: "wallet", color: PRIMARY },
              ].map((item, idx) => (
                <View key={idx} style={[styles.gridCell, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Ionicons name={item.icon as any} size={15} color={item.color} />
                    <Text style={{ color: textSecondary, fontSize: 10, fontFamily: "Inter_500Medium" }}>{item.label}</Text>
                  </View>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18 }}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Platform infrastructure status */}
            <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
              {isRtl ? "سلامة النظام والـ API" : "System Infrastructure Health"}
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {[
                { label: "API Gateway", value: `Uptime: ${health.backend_uptime}%`, icon: "server", color: GREEN },
                { label: "Database", value: `${health.mongodb_status} · ${health.avg_response_ms}ms`, icon: "leaf", color: GREEN },
                { label: "AI Quota limit", value: `${health.gemini_quota_remaining}% free`, icon: "cloud", color: PRIMARY },
              ].map((h, idx) => (
                <View key={idx} style={[styles.healthRow, { borderBottomWidth: idx < 2 ? 1 : 0, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
                  <Ionicons name={h.icon as any} size={16} color={h.color} />
                  <View style={{ flex: 1, marginHorizontal: 10, alignItems: isRtl ? "flex-end" : "flex-start" }}>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 12 }}>{h.label}</Text>
                    <Text style={{ color: textSecondary, fontSize: 10 }}>{h.value}</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: h.color }]} />
                </View>
              ))}
            </View>

            {/* Instructor Leaderboard table */}
            <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
              {isRtl ? "لوحة تصنيف المعلمين" : "Instructor Rankings"}
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, padding: 0 }]}>
              {instructors.map((inst, idx) => (
                <View key={inst.id} style={[styles.tableRow, { borderBottomWidth: idx < instructors.length - 1 ? 1 : 0, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                    {idx + 1}. {inst.username}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ color: textSecondary, fontSize: 11 }}>
                      {inst.active_students} {isRtl ? "طالب" : "students"}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 2 }} />
                      <Text style={{ color: "#F59E0B", fontFamily: "Inter_700Bold", fontSize: 11 }}>{inst.rating}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* System Control Center: Blueprint scheduling forms */}
            <Text style={[styles.sectionTitle, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
              {isRtl ? "مركز التحكم: جدولة القاعات" : "System Control: Slot Scheduling"}
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={{ color: textSecondary, fontSize: 11, marginBottom: 12, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? "قم بتعيين وجدولة المقررات إلى الفصول الدراسية وحجز الساعات الشاغرة:" : "Assign course blueprint structures to centers, classroom capacities, and slot configurations:"}
              </Text>

              <Text style={[styles.formLabel, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
                {isRtl ? "رمز المقرر / الدرس:" : "Course Blueprint ID / Title:"}
              </Text>
              <TextInput
                placeholder="e.g. chemistry_101"
                placeholderTextColor={textSecondary}
                value={schedCourse}
                onChangeText={setSchedCourse}
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary, borderColor: cardBorder }]}
              />

              <Text style={[styles.formLabel, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
                {isRtl ? "اسم القاعة الدراسية:" : "Classroom capacity / Room Name:"}
              </Text>
              <TextInput
                placeholder="e.g. Classroom Alpha"
                placeholderTextColor={textSecondary}
                value={schedClassroom}
                onChangeText={setSchedClassroom}
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary, borderColor: cardBorder }]}
              />

              <Text style={[styles.formLabel, { color: textPrimary, textAlign: isRtl ? "right" : "left" }]}>
                {isRtl ? "الفترة الزمنية للدرس:" : "Scheduled time slot:"}
              </Text>
              <TextInput
                placeholder="e.g. 09:00 AM - 10:30 AM"
                placeholderTextColor={textSecondary}
                value={schedTime}
                onChangeText={setSchedTime}
                style={[styles.input, { backgroundColor: inputBg, color: textPrimary, borderColor: cardBorder }]}
              />

              <Pressable
                onPress={handleScheduleBlueprint}
                disabled={scheduling}
                style={[styles.submitBtn, { backgroundColor: PRIMARY }]}
              >
                {scheduling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 13 }}>
                      {isRtl ? "توليد وجدولة الحجز" : "Schedule Blueprint Slot"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1 },
  avatar: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerActionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 14, marginTop: 18, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCell: { flex: 1, minWidth: 140, borderRadius: 14, padding: 12, borderWidth: 1 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  healthRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  tableRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  formLabel: { fontSize: 11, fontFamily: "Inter_700Bold", marginTop: 10, marginBottom: 4 },
  input: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 50, marginTop: 16 },
  sidebarOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10, flexDirection: "row" },
  sidebar: { width: 240, height: "100%", borderRightWidth: 1, paddingTop: 56 },
  sidebarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  sidebarItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 6 }
});
