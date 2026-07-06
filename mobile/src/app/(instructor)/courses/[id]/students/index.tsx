import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  ActivityIndicator, StyleSheet,
  FlatList, TextInput
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../../../lib/api";
import { useWamdh } from "../../../../../context/WamdhContext";

const PRIMARY = "#BE1A1A"; // Royal Blue
const ACCENT = "#F7D87F";  // Gold
const GREEN = "#10B981";
const RED = "#EF4444";

export default function CourseStudentsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await apiClient.get(`/api/instructor/courses/${id}/students/`);
        setStudents(res.data);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Enrolled Students</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        <TextInput
          placeholder="Search course students..."
          placeholderTextColor={textSecondary}
          value={search}
          onChangeText={setSearch}
          style={[styles.input, { backgroundColor: cardBg, color: textPrimary, borderColor: cardBorder }]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={PRIMARY} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={students.filter((s) => s.student_name?.toLowerCase().includes(search.toLowerCase()))}
          keyExtractor={(item, idx) => String(idx)}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(instructor)/students/${item.student_id}` as any)}
              style={[styles.studentCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                {item.student_name}
              </Text>
              <View style={[styles.badge, { backgroundColor: PRIMARY + "15" }]}>
                <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 10 }}>
                  {item.progress_percent}%
                </Text>
              </View>
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
  input: { paddingHorizontal: 12, height: 44, borderRadius: 8, borderWidth: 1, fontFamily: "Inter_500Medium" },
  studentCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }
});
