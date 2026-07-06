import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
const AsyncStorage = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  }
};
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const GOALS_KEY = "wamdh_goals";

interface Goal {
  id: string;
  title: string;
  type: "daily_minutes" | "weekly_notes" | "exam_date" | "custom";
  target: number;
  current: number;
  unit: string;
  deadline?: string;
  color: string;
  completed: boolean;
}

const GOAL_TEMPLATES = [
  { title: "Study 30 min/day", type: "daily_minutes" as const, target: 30, unit: "minutes", color: "#BE1A1A" },
  { title: "Upload 2 notes/week", type: "weekly_notes" as const, target: 2, unit: "notes", color: "#10B981" },
  { title: "Complete 5 quizzes", type: "custom" as const, target: 5, unit: "quizzes", color: "#F7D87F" },
  { title: "Study 2h this week", type: "custom" as const, target: 120, unit: "minutes", color: "#3B82F6" },
];

function ProgressRing({ pct, size = 60, color = "#BE1A1A" }: { pct: number; size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: size, height: size, borderRadius: size / 2, borderWidth: 5, borderColor: color + "25" }} />
      <View style={{ position: "absolute", width: size, height: size, borderRadius: size / 2, borderWidth: 5, borderColor: "transparent", borderTopColor: pct > 0 ? color : "transparent", borderRightColor: pct > 25 ? color : "transparent", borderBottomColor: pct > 50 ? color : "transparent", borderLeftColor: pct > 75 ? color : "transparent", transform: [{ rotate: "-90deg" }] }} />
      <Text style={{ color, fontFamily: "Inter_700Bold", fontSize: 13 }}>{Math.min(100, pct)}%</Text>
    </View>
  );
}

export default function GoalTracker() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("30");
  const [newUnit, setNewUnit] = useState("minutes");

  const { data: weeklyData } = useQuery<any[]>({
    queryKey: ["analytics-weekly"],
    queryFn: async () => (await apiClient.get("/api/analytics/weekly/")).data,
  });

  const { data: notes } = useQuery<any[]>({
    queryKey: ["notes"],
    queryFn: async () => (await apiClient.get("/api/notes/")).data,
  });

  useEffect(() => {
    AsyncStorage.getItem(GOALS_KEY).then((raw: string | null) => {
      if (raw) setGoals(JSON.parse(raw));
    });
  }, []);

  const saveGoals = async (list: Goal[]) => {
    setGoals(list);
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(list));
  };

  const totalMinutesThisWeek = (weeklyData || []).reduce((a: number, c: any) => a + (c.minutes || 0), 0);
  const notesThisWeek = (notes || []).filter((n: any) => {
    const d = new Date(n.created_at);
    const week = new Date(); week.setDate(week.getDate() - 7);
    return d > week;
  }).length;

  const getProgress = (goal: Goal): number => {
    switch (goal.type) {
      case "daily_minutes": return Math.min(100, Math.round((totalMinutesThisWeek / 7 / goal.target) * 100));
      case "weekly_notes": return Math.min(100, Math.round((notesThisWeek / goal.target) * 100));
      default: return Math.min(100, Math.round((goal.current / goal.target) * 100));
    }
  };

  const addGoal = async (template?: typeof GOAL_TEMPLATES[0]) => {
    const g: Goal = template ? {
      id: Date.now().toString(),
      title: template.title,
      type: template.type,
      target: template.target,
      current: 0,
      unit: template.unit,
      color: template.color,
      completed: false,
    } : {
      id: Date.now().toString(),
      title: newTitle || "Custom Goal",
      type: "custom",
      target: parseInt(newTarget) || 30,
      current: 0,
      unit: newUnit || "minutes",
      color: "#BE1A1A",
      completed: false,
    };
    await saveGoals([g, ...goals]);
    setShowAdd(false);
    setNewTitle(""); setNewTarget("30"); setNewUnit("minutes");
  };

  const deleteGoal = async (id: string) => {
    Alert.alert("Remove Goal", "Delete this goal?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => saveGoals(goals.filter(g => g.id !== id)) },
    ]);
  };

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => getProgress(g) >= 100).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="arrow-back" size={20} color={ACCENT} />
        </Pressable>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginLeft: 12 }}>Study Goals</Text>
        <Pressable onPress={() => setShowAdd(s => !s)} style={[styles.iconBtn, { backgroundColor: "#BE1A1A", marginLeft: "auto" }]}>
          <Ionicons name={showAdd ? "close" : "add"} size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={{ padding: 16 }}>
        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {[
              { label: "Goals Set", value: totalGoals, icon: "🎯" },
              { label: "Completed", value: completedGoals, icon: "✅" },
              { label: "This Week", value: `${Math.round(totalMinutesThisWeek / 60)}h`, icon: "📚" },
            ].map(s => (
              <View key={s.label} style={{ alignItems: "center", flex: 1 }}>
                <Text style={{ fontSize: 22 }}>{s.icon}</Text>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20, marginTop: 4 }}>{s.value}</Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Add Goal panel */}
        {showAdd && (
          <View style={[styles.addPanel, { backgroundColor: cardBg, borderColor: "#BE1A1A" + "40" }]}>
            <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 12 }}>
              Quick Templates
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {GOAL_TEMPLATES.map(t => (
                <Pressable key={t.title} onPress={() => addGoal(t)}
                  style={[styles.templateBtn, { backgroundColor: t.color + "15", borderColor: t.color + "40" }]}>
                  <Text style={{ color: t.color, fontFamily: "Inter_700Bold", fontSize: 12 }}>{t.title}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 8 }}>Custom Goal</Text>
            <View style={[styles.inputField, { backgroundColor: inputBg, marginBottom: 8 }]}>
              <TextInput value={newTitle} onChangeText={setNewTitle} placeholder="Goal title..." placeholderTextColor="#6B7280"
                style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 }} />
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              <View style={[styles.inputField, { backgroundColor: inputBg, flex: 1 }]}>
                <TextInput value={newTarget} onChangeText={setNewTarget} placeholder="Target" placeholderTextColor="#6B7280" keyboardType="numeric"
                  style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 }} />
              </View>
              <View style={[styles.inputField, { backgroundColor: inputBg, flex: 1 }]}>
                <TextInput value={newUnit} onChangeText={setNewUnit} placeholder="Unit" placeholderTextColor="#6B7280"
                  style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 }} />
              </View>
            </View>
            <Pressable onPress={() => addGoal()} style={[styles.addGoalBtn, { backgroundColor: "#BE1A1A" }]}>
              <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>Add Goal</Text>
            </Pressable>
          </View>
        )}

        {/* Goals List */}
        {goals.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Text style={{ fontSize: 48 }}>🎯</Text>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 12 }}>No goals yet</Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 6, textAlign: "center" }}>
              Set your first study goal to stay motivated!
            </Text>
          </View>
        ) : (
          goals.map(goal => {
            const pct = getProgress(goal);
            const done = pct >= 100;
            return (
              <View key={goal.id} style={[styles.goalCard, { backgroundColor: cardBg, borderColor: done ? goal.color + "60" : cardBorder }]}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ProgressRing pct={pct} color={goal.color} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 15 }}>{goal.title}</Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
                      Target: {goal.target} {goal.unit}
                    </Text>
                    <View style={[styles.progressBarBg, { backgroundColor: dark ? "#252540" : "#E5E7EB", marginTop: 8 }]}>
                      <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: goal.color }]} />
                    </View>
                  </View>
                  <Pressable onPress={() => deleteGoal(goal.id)} style={{ padding: 8 }}>
                    <Ionicons name="trash-outline" size={16} color="#6B7280" />
                  </Pressable>
                </View>
                {done && (
                  <View style={[styles.doneBadge, { backgroundColor: goal.color + "20" }]}>
                    <Ionicons name="checkmark-circle" size={14} color={goal.color} />
                    <Text style={{ color: goal.color, fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: 5 }}>Goal reached! 🎉</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  summaryCard: { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  addPanel: { borderRadius: 16, padding: 16, borderWidth: 1.5, marginBottom: 16 },
  templateBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, borderWidth: 1 },
  inputField: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  addGoalBtn: { paddingVertical: 13, borderRadius: 50, alignItems: "center" },
  goalCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: 6, borderRadius: 3 },
  doneBadge: { flexDirection: "row", alignItems: "center", borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start", marginTop: 10 },
});
