import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  ActivityIndicator, StyleSheet,
  FlatList
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../../../lib/api";
import { useWamdh } from "../../../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue

export default function CourseQuizzesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await apiClient.get(`/api/instructor/courses/${id}/quizzes/`);
        setQuizzes(res.data);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [id]);

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
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Course Quizzes</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={PRIMARY} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center" }}>
              No quizzes for this course yet.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(instructor)/courses/${id}/quiz/${item.id}` as any)}
              style={[styles.quizCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>
                {item.title}
              </Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 4 }}>
                Questions: {item.questions?.length || 0}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  quizCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 }
});
