import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const GOLD = "#F7D87F";

interface Semester {
  name: string;
  gpa: number;
  credits: number;
}

export default function GpaCalculatorScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;
  const queryClient = useQueryClient();

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semName, setSemName] = useState("");
  const [semGpa, setSemGpa] = useState("");
  const [semCredits, setSemCredits] = useState("");

  const { data: dbGpa, isLoading } = useQuery<any>({
    queryKey: ["gpa-record"],
    queryFn: async () => (await apiClient.get("/api/analytics/gpa/")).data
  });

  useEffect(() => {
    if (dbGpa?.semesters) {
      setSemesters(dbGpa.semesters);
    }
  }, [dbGpa]);

  const saveMutation = useMutation({
    mutationFn: async (updatedSemesters: Semester[]) => {
      // Calculate cumulative GPA
      let totalPoints = 0;
      let totalCreditsCount = 0;
      updatedSemesters.forEach(s => {
        totalPoints += s.gpa * s.credits;
        totalCreditsCount += s.credits;
      });
      const cgpa = totalCreditsCount > 0 ? totalPoints / totalCreditsCount : 4.0;
      
      const res = await apiClient.post("/api/analytics/gpa/", {
        semesters: updatedSemesters,
        cumulative_gpa: cgpa.toFixed(2),
        total_credits: totalCreditsCount
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gpa-record"] });
    }
  });

  const handleAddSemester = () => {
    if (!semName || !semGpa || !semCredits) return;
    const newSem: Semester = {
      name: semName,
      gpa: parseFloat(semGpa),
      credits: parseInt(semCredits)
    };
    const updated = [...semesters, newSem];
    setSemesters(updated);
    saveMutation.mutate(updated);
    setSemName("");
    setSemGpa("");
    setSemCredits("");
  };

  const handleDelete = (index: number) => {
    const updated = semesters.filter((_, i) => i !== index);
    setSemesters(updated);
    saveMutation.mutate(updated);
  };

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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>GPA & Grades Calculator</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Cumulative GPA Box */}
        <View style={[styles.cgpaCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, textTransform: "uppercase" }}>Cumulative GPA</Text>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 32, marginTop: 4 }}>
              {dbGpa?.cumulative_gpa || "4.00"}
            </Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>
              Based on {dbGpa?.total_credits || 0} completed credits.
            </Text>
          </View>
          <View style={[styles.ringContainer, { borderColor: GOLD }]}>
            <Ionicons name="school" size={28} color={GOLD} />
          </View>
        </View>

        {/* Add Semester Form */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 20 }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>➕ Add Semester Grades</Text>
          
          <TextInput
            value={semName}
            onChangeText={setSemName}
            placeholder="Semester Name (e.g. Fall 2025)"
            placeholderTextColor="#6B7280"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <TextInput
              value={semGpa}
              onChangeText={setSemGpa}
              keyboardType="numeric"
              placeholder="GPA (e.g. 3.85)"
              placeholderTextColor="#6B7280"
              style={[styles.input, { backgroundColor: inputBg, color: textPrimary, flex: 1 }]}
            />
            <TextInput
              value={semCredits}
              onChangeText={setSemCredits}
              keyboardType="number-pad"
              placeholder="Credits (e.g. 15)"
              placeholderTextColor="#6B7280"
              style={[styles.input, { backgroundColor: inputBg, color: textPrimary, flex: 1 }]}
            />
          </View>

          <Pressable onPress={handleAddSemester} disabled={saveMutation.isPending} style={[styles.actionBtn, { backgroundColor: "#BE1A1A", marginTop: 14 }]}>
            <Text style={styles.actionBtnText}>Add Semester</Text>
          </Pressable>
        </View>

        {/* Semester List */}
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Semester History</Text>
        {semesters.map((sem, idx) => (
          <View key={idx} style={[styles.semRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 14 }}>{sem.name}</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
                {sem.credits} credits · GPA: {sem.gpa}
              </Text>
            </View>
            <Pressable onPress={() => handleDelete(idx)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </Pressable>
          </View>
        ))}
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
  cgpaCard: { padding: 20, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center" },
  ringContainer: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 14 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14 },
  actionBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 24, marginBottom: 12 },
  semRow: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 }
});
