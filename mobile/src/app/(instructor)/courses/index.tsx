import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Image,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold
const GREEN = "#10B981";

export default function MyCoursesScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "published" | "draft" | "archived">("all");

  const loadCourses = async () => {
    try {
      const res = await apiClient.get("/api/instructor/courses/");
      setCourses(res.data);
    } catch (e) {
      console.log("Error loading courses:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  const filteredCourses = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                        c.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === "all" || c.status === activeFilter;
    return matchSearch && matchFilter;
  });

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const filters: { key: "all" | "published" | "draft" | "archived"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Draft" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>My Courses</Text>
        <Pressable
          onPress={() => router.push("/(instructor)/courses/create")}
          style={[styles.createBtn, { backgroundColor: PRIMARY }]}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createBtnText}>New Course</Text>
        </Pressable>
      </View>

      {/* Search and Filters */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 }}>
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Ionicons name="search" size={18} color={textSecondary} />
          <TextInput
            placeholder="Search courses..."
            placeholderTextColor={textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: textPrimary }]}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
          {filters.map((f) => (
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
                  styles.filterChipText,
                  { color: activeFilter === f.key ? "#FFFFFF" : textSecondary, fontFamily: activeFilter === f.key ? "Inter_700Bold" : "Inter_500Medium" }
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
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
          {filteredCourses.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Ionicons name="folder-open-outline" size={48} color={textSecondary} />
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 12 }}>
                No courses found
              </Text>
            </View>
          ) : (
            filteredCourses.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push(`/(instructor)/courses/${c.id}` as any)}
                style={[styles.courseCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              >
                {c.thumbnail_url ? (
                  <Image source={{ uri: c.thumbnail_url }} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.thumbnailPlaceholder, { backgroundColor: PRIMARY + "20" }]}>
                    <Ionicons name="book" size={24} color={PRIMARY} />
                  </View>
                )}

                <View style={styles.cardContent}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[styles.categoryBadge, { color: "#BE1A1A" }]}>{c.category}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: c.status === "published" ? GREEN + "15" : dark ? "#2A2A40" : "#F3F4F6" }
                      ]}
                    >
                      <Text style={{ color: c.status === "published" ? GREEN : textSecondary, fontFamily: "Inter_700Bold", fontSize: 9 }}>
                        {c.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.courseTitle, { color: textPrimary }]} numberOfLines={2}>
                    {c.title}
                  </Text>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="people-outline" size={14} color={textSecondary} />
                      <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11 }}>
                        {c.enrolled_count || 0} students
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => router.push(`/(instructor)/courses/${c.id}` as any)}
                      style={[styles.manageBtn, { backgroundColor: PRIMARY + "15" }]}
                    >
                      <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 11 }}>Manage</Text>
                      <Ionicons name="chevron-forward" size={12} color={PRIMARY} />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1
  },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 18 },
  createBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, gap: 4 },
  createBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 14, borderWidth: 1, marginRight: 8 },
  filterChipText: { fontSize: 12 },
  courseCard: { flexDirection: "row", borderRadius: 16, borderWidth: 1, marginBottom: 14, overflow: "hidden", padding: 10, gap: 12 },
  thumbnail: { width: 90, height: 90, borderRadius: 10 },
  thumbnailPlaceholder: { width: 90, height: 90, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardContent: { flex: 1, justifyContent: "space-between" },
  categoryBadge: { fontFamily: "Inter_700Bold", fontSize: 10, textTransform: "uppercase" },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  courseTitle: { fontFamily: "Sora_700Bold", fontSize: 14, marginTop: 4 },
  manageBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 2 }
});
