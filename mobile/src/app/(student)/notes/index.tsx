import React, { useState } from "react";
import {
  View, Text, ScrollView, TextInput, Pressable,
  FlatList, ActivityIndicator, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

export default function NotesLibrary() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const inputBg = colors.inputBg;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const { data: subjectsData } = useQuery<string[]>({
    queryKey: ["subjects"],
    queryFn: async () => (await apiClient.get("/api/notes/subjects/")).data,
  });
  const subjects = ["All", ...(subjectsData || [])];

  const { data: notes, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["notes"],
    queryFn: async () => (await apiClient.get("/api/notes/")).data,
  });

  const getSubjectColor = (sub: string) => {
    const hash = (sub || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return ["#F7D87F", "#10B981", colors.brandPrimary, "#EF4444", "#3B82F6", "#06B6D4"][hash % 6];
  };

  const filtered = (notes || []).filter((n) => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()));
    const matchSubject = selectedSubject === "All" || n.subject === selectedSubject;
    return matchSearch && matchSubject;
  });

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.replace("/(student)")} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginLeft: 12 }}>Notes Library</Text>
        </View>
        <Pressable
          onPress={() => router.push("/(student)/notes/upload")}
          style={[styles.ctaSmall, { backgroundColor: ACCENT, shadowColor: ACCENT }]}
        >
          <Ionicons name="add" size={16} color={dark ? "#000000" : "#FFFFFF"} />
          <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 12, marginLeft: 4 }}>Upload</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <View style={[styles.searchRow, { backgroundColor: inputBg, borderColor: cardBorder }]}>
          <Ionicons name="search-outline" size={18} color="#6B7280" style={{ marginRight: 10 }} />
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search notes or tags..."
            placeholderTextColor="#6B7280"
            style={{ flex: 1, color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 }}
          />
        </View>
      </View>

      {/* Subject Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 8 }} contentContainerStyle={{ paddingRight: 16 }}>
        {subjects.map((subj) => {
          const active = selectedSubject === subj;
          return (
            <Pressable
              key={subj}
              onPress={() => setSelectedSubject(subj)}
              style={[
                styles.pill,
                { backgroundColor: active ? ACCENT : (dark ? "#252540" : "#F3F4F6"), marginRight: 8 },
              ]}
            >
              <Text style={{ color: active ? (dark ? "#000000" : "#FFFFFF") : textSecondary, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                {subj}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Notes List */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="document-outline" size={56} color="#374151" />
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 12 }}>
                No notes found
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: "/(student)/notes/[id]", params: { id: item.id } })}
              style={[styles.noteCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View style={[styles.noteIcon, { backgroundColor: getSubjectColor(item.subject) + "25" }]}>
                  <Ionicons name="reader-outline" size={18} color={getSubjectColor(item.subject)} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: getSubjectColor(item.subject), marginRight: 6 }} />
                    <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      {item.subject}
                    </Text>
                  </View>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                    {new Date(item.created_at).toLocaleDateString()} · {item.word_count || 0} words
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </View>
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 10, marginLeft: 42 }}>
                {item.title}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginLeft: 42 }}>
                {(item.tags || []).map((tag: string) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: ACCENT + "18" }]}>
                    <Text style={{ color: ACCENT, fontFamily: "Inter_500Medium", fontSize: 11 }}>#{tag}</Text>
                  </View>
                ))}
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
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  ctaSmall: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 50, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  searchRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50 },
  noteCard: {
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  noteIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
});
