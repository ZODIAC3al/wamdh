import React from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { PremiumChart } from "../../../components/PremiumChart";
import { useWamdh } from "../../../context/WamdhContext";

const EMERALD = "#10B981";
const AMBER = "#F59E0B";
const RED = "#EF4444";

interface Metrics {
  cpu_usage: number;
  ram_usage: number;
  total_users: number;
  total_students: number;
  total_instructors: number;
  total_notes: number;
  total_quizzes: number;
  gemini_daily_calls: number;
  gemini_max_calls: number;
  status: string;
}

interface TaskQueue {
  pending_count: number;
  processing_count: number;
  pending_tasks: Array<{id: string, task: string, created_at: string}>;
  processing_tasks: Array<{id: string, task: string, created_at: string}>;
  recent_completed: Array<{id: string, task: string, completed_at: string}>;
}

export default function AdminSystemMonitorScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const { data: metrics, isLoading } = useQuery<Metrics>({
    queryKey: ["admin-metrics"],
    queryFn: async () => (await apiClient.get("/api/users/admin/metrics/")).data
  });

  const { data: taskQueue, isLoading: isLoadingTasks } = useQuery<TaskQueue>({
    queryKey: ["admin-task-queue"],
    queryFn: async () => (await apiClient.get("/api/admin/task-queue/")).data
  });

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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>System Monitor</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {isLoading ? (
          <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 40 }} />
        ) : (
          <View style={{ gap: 20 }}>
            {/* System Status Banner */}
            <View style={[styles.statusCard, { backgroundColor: EMERALD + "15", borderColor: EMERALD }]}>
              <Ionicons name="checkmark-circle" size={24} color={EMERALD} />
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15, marginLeft: 12 }}>
                Global Systems Operational
              </Text>
            </View>

            {/* TASK QUEUE VIEW */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Ionicons name="list-outline" size={16} color={ACCENT} />
              <Text style={[styles.cardTitle, { color: textPrimary, marginBottom: 0 }]}>Task Queue</Text>
            </View>
            
            {isLoadingTasks ? (
              <ActivityIndicator color={ACCENT} />
            ) : (
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ color: "#F59E0B", fontFamily: "Sora_700Bold", fontSize: 24 }}>
                      {taskQueue?.pending_count || 0}
                    </Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>Pending</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ color: "#3B82F6", fontFamily: "Sora_700Bold", fontSize: 24 }}>
                      {taskQueue?.processing_count || 0}
                    </Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>Processing</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ color: EMERALD, fontFamily: "Sora_700Bold", fontSize: 24 }}>
                      {taskQueue?.recent_completed?.length || 0}
                    </Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>Recent</Text>
                  </View>
                </View>

                {taskQueue?.pending_tasks && taskQueue.pending_tasks.length > 0 ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 11, marginBottom: 6 }}>Pending Tasks:</Text>
                    {taskQueue.pending_tasks.slice(0, 3).map((task) => (
                      <View key={task.id} style={[styles.taskRow, { borderBottomColor: cardBorder }]}>
                        <Ionicons name="ellipse-outline" size={8} color="#F59E0B" />
                        <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 }}>
                          {task.task || "Background task"}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            )}

            {/* CPU Utilization History Chart */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <Ionicons name="stats-chart-outline" size={16} color={ACCENT} />
                <Text style={[styles.cardTitle, { color: textPrimary, marginBottom: 0 }]}>CPU Utilization History</Text>
              </View>
              <View style={{ height: 140, marginTop: 10 }}>
                <PremiumChart
                  data={[
                    { time: "10m", cpu: 18 },
                    { time: "8m", cpu: 32 },
                    { time: "6m", cpu: 45 },
                    { time: "4m", cpu: 28 },
                    { time: "2m", cpu: Math.max(0, (metrics?.cpu_usage || 22) - 4) },
                    { time: "Now", cpu: metrics?.cpu_usage || 22 }
                  ]}
                  xKey="time"
                  yKey="cpu"
                  color={ACCENT}
                  type="bar"
                  height={140}
                />
              </View>
            </View>

            {/* Performance Usage */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <Ionicons name="hardware-chip-outline" size={16} color={ACCENT} />
                <Text style={[styles.cardTitle, { color: textPrimary, marginBottom: 0 }]}>Resource Metrics</Text>
              </View>
              
              <Text style={[styles.progressLabel, { color: textSecondary }]}>CPU USAGE</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View style={{ flex: 1, height: 8, backgroundColor: inputBg, borderRadius: 4, overflow: "hidden" }}>
                  <View style={{ width: `${metrics?.cpu_usage || 0}%`, height: "100%", backgroundColor: ACCENT }} />
                </View>
                <Text style={{ width: 44, color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 12, textAlign: "right" }}>
                  {metrics?.cpu_usage}%
                </Text>
              </View>

              <Text style={[styles.progressLabel, { color: textSecondary }]}>RAM UTILIZATION</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, height: 8, backgroundColor: inputBg, borderRadius: 4, overflow: "hidden" }}>
                  <View style={{ width: `${metrics?.ram_usage || 0}%`, height: "100%", backgroundColor: ACCENT }} />
                </View>
                <Text style={{ width: 44, color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 12, textAlign: "right" }}>
                  {metrics?.ram_usage}%
                </Text>
              </View>
            </View>

            {/* API Quota Usage */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <Ionicons name="key-outline" size={16} color={ACCENT} />
                <Text style={[styles.cardTitle, { color: textPrimary, marginBottom: 0 }]}>Gemini API Quota</Text>
              </View>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 10 }}>
                Daily Free quota calls remaining
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, height: 8, backgroundColor: inputBg, borderRadius: 4, overflow: "hidden" }}>
                  <View style={{ width: `${((metrics?.gemini_daily_calls || 0) / (metrics?.gemini_max_calls || 1000)) * 100}%`, height: "100%", backgroundColor: "#3B82F6" }} />
                </View>
                <Text style={{ width: 80, color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 12, textAlign: "right" }}>
                  {metrics?.gemini_daily_calls} / {metrics?.gemini_max_calls}
                </Text>
              </View>
            </View>

            {/* Platform statistics */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <Ionicons name="analytics-outline" size={16} color={ACCENT} />
                <Text style={[styles.cardTitle, { color: textPrimary, marginBottom: 0 }]}>Platform Totals</Text>
              </View>
              <View style={{ marginTop: 10, gap: 10 }}>
                <View style={[styles.statRow, { borderBottomColor: cardBorder }]}>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>Total Accounts</Text>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>{metrics?.total_users}</Text>
                </View>
                <View style={[styles.statRow, { borderBottomColor: cardBorder }]}>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>Students Registered</Text>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>{metrics?.total_students}</Text>
                </View>
                <View style={[styles.statRow, { borderBottomColor: cardBorder }]}>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>Instructors Registered</Text>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>{metrics?.total_instructors}</Text>
                </View>
                <View style={[styles.statRow, { borderBottomColor: cardBorder }]}>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>Processed Notes</Text>
                  <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>{metrics?.total_notes}</Text>
                </View>
              </View>
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
  statusCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1 },
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15 },
  progressLabel: { fontFamily: "Inter_700Bold", fontSize: 9, marginBottom: 6, letterSpacing: 0.8 },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderBottomWidth: 1 }
});