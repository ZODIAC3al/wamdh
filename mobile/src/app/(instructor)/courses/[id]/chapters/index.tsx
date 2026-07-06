import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert, StyleSheet
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";
import { useWamdh } from "../../../../../context/WamdhContext";

const PRIMARY = "#BE1A1A";
const ACCENT = "#F7D87F";
const GREEN = "#10B981";

interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  is_locked: boolean;
}

export default function ChapterListScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");

  const loadChapters = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/instructor/courses/${id}/chapters/`);
      setChapters(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (e) {
      console.log("Error loading chapters:", e);
    }
    try {
      const courseRes = await apiClient.get(`/api/instructor/courses/${id}/`);
      setCourseTitle(courseRes.data?.title || "Course");
    } catch { }
    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useEffect(() => { loadChapters(); }, [loadChapters]);

  const onRefresh = () => { setRefreshing(true); loadChapters(); };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Chapters</Text>
          <Text style={[styles.headerSub, { color: textSecondary }]} numberOfLines={1}>
            {courseTitle}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(`/(instructor)/courses/${id}/chapters/create` as any)}
          style={[styles.addBtn, { backgroundColor: PRIMARY }]}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
        >
          {chapters.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Ionicons name="layers-outline" size={48} color={textSecondary} />
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 12 }}>
                No chapters yet
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>
                Tap the + button to add your first chapter.
              </Text>
            </View>
          ) : (
            chapters
              .sort((a, b) => a.order - b.order)
              .map((ch, idx) => (
                <Pressable
                  key={ch.id}
                  onPress={() => router.push(`/(instructor)/courses/${id}/chapters/${ch.id}` as any)}
                  style={[styles.chapterCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                >
                  <View style={[styles.orderBadge, { backgroundColor: PRIMARY + "15" }]}>
                    <Text style={{ fontFamily: "Sora_700Bold", fontSize: 14, color: PRIMARY }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.chapterTitle, { color: textPrimary }]} numberOfLines={1}>
                      {ch.title}
                    </Text>
                    {ch.description ? (
                      <Text style={[styles.chapterDesc, { color: textSecondary }]} numberOfLines={2}>
                        {ch.description}
                      </Text>
                    ) : null}
                  </View>
                  {ch.is_locked && (
                    <Ionicons name="lock-closed" size={16} color={ACCENT} style={{ marginLeft: 8 }} />
                  )}
                  <Ionicons name="chevron-forward" size={18} color={textSecondary} style={{ marginLeft: 6 }} />
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  chapterCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  orderBadge: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  chapterTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  chapterDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 3,
  },
});
