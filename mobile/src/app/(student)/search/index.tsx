import React, { useState } from "react";
import {
  View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";


type ResultType = "note" | "flashcard" | "quiz";

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  route: any;
}

function ResultCard({ item, dark }: { item: SearchResult; dark: boolean }) {
  const { colors } = useWamdh();
  const ACCENT = colors.accent;
  const router = useRouter();
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  return (
    <Pressable
      onPress={() => router.push(item.route)}
      style={[styles.resultCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
    >
      <View style={[styles.resultIcon, { backgroundColor: item.color + "20" }]}>
        <Ionicons name={item.icon as any} size={20} color={item.color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14 }} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>
      <View style={[styles.typeBadge, { backgroundColor: item.color + "15" }]}>
        <Text style={{ color: item.color, fontFamily: "Inter_700Bold", fontSize: 10 }}>
          {item.type.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const [query, setQuery] = useState("");

  const { data: notes } = useQuery<any[]>({
    queryKey: ["notes-search"],
    queryFn: async () => (await apiClient.get("/api/notes/")).data,
  });

  const { data: decks } = useQuery<any[]>({
    queryKey: ["flashcard-decks-search"],
    queryFn: async () => (await apiClient.get("/api/flashcards/")).data,
  });

  const { data: quizzes } = useQuery<any[]>({
    queryKey: ["quizzes-search"],
    queryFn: async () => (await apiClient.get("/api/quiz/")).data,
  });

  const allResults: SearchResult[] = [
    ...(notes || []).map((n: any) => ({
      id: `note-${n.id}`,
      type: "note" as ResultType,
      title: n.title,
      subtitle: `${n.subject} • ${n.word_count || 0} words`,
      color: "#BE1A1A",
      icon: "document-text",
      route: { pathname: "/(student)/notes/[id]", params: { id: n.id } },
    })),
    ...(decks || []).map((d: any) => ({
      id: `deck-${d.id}`,
      type: "flashcard" as ResultType,
      title: d.title,
      subtitle: `${d.subject || "Flashcard Deck"} • ${d.card_count || 0} cards`,
      color: "#3B82F6",
      icon: "albums",
      route: { pathname: "/(student)/flashcards/[id]", params: { id: d.id } },
    })),
    ...(quizzes || []).map((q: any) => ({
      id: `quiz-${q.id}`,
      type: "quiz" as ResultType,
      title: q.title,
      subtitle: `${q.difficulty || "medium"} difficulty • ${(q.questions || []).length} questions`,
      color: "#10B981",
      icon: "checkbox",
      route: { pathname: "/(student)/quiz/[id]", params: { id: q.id } },
    })),
  ];

  const filtered = query.trim().length < 1
    ? allResults
    : allResults.filter(r =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.subtitle.toLowerCase().includes(query.toLowerCase())
      );

  const grouped = {
    notes: filtered.filter(r => r.type === "note"),
    flashcards: filtered.filter(r => r.type === "flashcard"),
    quizzes: filtered.filter(r => r.type === "quiz"),
  };

  const recentSearches = ["Organic Chemistry", "Calculus", "Photosynthesis"];

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header + Search Bar */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="arrow-back" size={20} color={ACCENT} />
        </Pressable>
        <View style={[styles.searchBar, { backgroundColor: inputBg, flex: 1, marginLeft: 12 }]}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes, flashcards, quizzes..."
            placeholderTextColor="#9CA3AF"
            autoFocus
            style={{ flex: 1, color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            {/* Recent Searches */}
            {query.length === 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginBottom: 12 }}>
                  Recent Searches
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {recentSearches.map(s => (
                    <Pressable key={s} onPress={() => setQuery(s)}
                      style={[styles.recentPill, { backgroundColor: inputBg }]}>
                      <Ionicons name="time-outline" size={13} color={textSecondary} style={{ marginRight: 5 }} />
                      <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Results by category */}
            {(["notes", "flashcards", "quizzes"] as const).map(category => {
              const items = grouped[category];
              if (items.length === 0) return null;
              const icons = { notes: "document-text", flashcards: "albums", quizzes: "checkbox" };
              const colors = { notes: "#BE1A1A", flashcards: "#3B82F6", quizzes: "#10B981" };
              return (
                <View key={category} style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                    <Ionicons name={icons[category] as any} size={16} color={colors[category]} />
                    <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15, marginLeft: 8, textTransform: "capitalize" }}>
                      {category}
                    </Text>
                    <View style={[styles.countBadge, { backgroundColor: colors[category] + "20" }]}>
                      <Text style={{ color: colors[category], fontFamily: "Inter_700Bold", fontSize: 11 }}>{items.length}</Text>
                    </View>
                  </View>
                  {items.map(item => <ResultCard key={item.id} item={item} dark={dark} />)}
                </View>
              );
            })}

            {query.length > 0 && filtered.length === 0 && (
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <Ionicons name="search-outline" size={48} color="#374151" />
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 16 }}>
                  No results found
                </Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 6 }}>
                  Try a different search term
                </Text>
              </View>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  resultCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  resultIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  recentPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, marginLeft: 8 },
});
