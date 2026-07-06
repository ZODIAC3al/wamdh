import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold
const GREEN = "#10B981";
const RED = "#EF4444";

export default function AllStudentsScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "at_risk" | "moderate" | "performing">("all");

  const loadStudents = async () => {
    try {
      const res = await apiClient.get("/api/instructor/students/");
      setStudents(res.data);
    } catch (e) {
      console.log("Error loading students:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  const filteredStudents = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        (s.course_titles && s.course_titles.join(" ").toLowerCase().includes(search.toLowerCase()));
    const matchFilter = activeFilter === "all" || s.status === activeFilter;
    return matchSearch && matchFilter;
  });

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const performanceColor = (score: number) => {
    if (score >= 75) return { text: GREEN, bg: GREEN + "15", label: "Good" };
    if (score >= 50) return { text: "#BE1A1A", bg: "#BE1A1A" + "15", label: "Moderate" };
    return { text: RED, bg: RED + "15", label: "At Risk" };
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>My Students</Text>
        <View style={[styles.badgeCount, { backgroundColor: PRIMARY }]}>
          <Text style={styles.badgeText}>{students.length}</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Ionicons name="search" size={18} color={textSecondary} />
          <TextInput
            placeholder="Search students or courses..."
            placeholderTextColor={textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: textPrimary }]}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 6, marginVertical: 12 }}>
          {([
            { key: "all", label: "All" },
            { key: "performing", label: "Good 🟢" },
            { key: "moderate", label: "Moderate 🟡" },
            { key: "at_risk", label: "At Risk 🔴" }
          ] as const).map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[
                styles.filterChip,
                { backgroundColor: activeFilter === f.key ? PRIMARY : cardBg, borderColor: cardBorder },
                activeFilter === f.key && { borderColor: PRIMARY }
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: activeFilter === f.key ? "#FFFFFF" : textSecondary }
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
        >
          {filteredStudents.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Ionicons name="people-outline" size={48} color={textSecondary} />
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 12 }}>
                No students found
              </Text>
            </View>
          ) : (
            filteredStudents.map((s) => {
              const colorInfo = performanceColor(s.quiz_avg);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(`/(instructor)/students/${s.id}` as any)}
                  style={[styles.studentCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                >
                  <View style={[styles.avatar, { backgroundColor: PRIMARY + "20" }]}>
                    <Text style={{ color: PRIMARY, fontFamily: "Sora_700Bold", fontSize: 14 }}>
                      {s.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }}>{s.name}</Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 2 }}>
                      {s.course_titles ? s.course_titles.join(", ") : "Enrolled"}
                    </Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                      Progress: {s.completion_percent}% · Streak: {s.streak_days || 0}d
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <View style={[styles.statusBadge, { backgroundColor: colorInfo.bg }]}>
                      <Text style={{ color: colorInfo.text, fontFamily: "Inter_700Bold", fontSize: 9 }}>
                        {s.quiz_avg}% {colorInfo.label}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={textSecondary} style={{ marginTop: 8 }} />
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, gap: 10
  },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 18 },
  badgeCount: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 11 },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14 },
  filterChip: { flex: 1, paddingVertical: 6, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  filterText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  studentCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 }
});
