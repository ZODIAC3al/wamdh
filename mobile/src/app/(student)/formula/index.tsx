import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWamdh } from "../../../context/WamdhContext";


interface Formula {
  name: string;
  equation: string;
  desc: string;
  calcLabel: string;
  calcFn: (val: number) => string;
}

const FORMULAS: Formula[] = [
  {
    name: "Newton's Second Law",
    equation: "F = m * a",
    desc: "Force equals mass times acceleration.",
    calcLabel: "Enter Mass (kg) to find force with 9.8 m/s² accel:",
    calcFn: (m) => `${(m * 9.8).toFixed(2)} N`
  },
  {
    name: "Einstein's Energy",
    equation: "E = m * c²",
    desc: "Energy equals mass times the speed of light squared.",
    calcLabel: "Enter Mass (kg) to find energy:",
    calcFn: (m) => `${(m * 9e16).toExponential(2)} J`
  },
  {
    name: "Quadratic Formula",
    equation: "x = (-b ± √(b² - 4ac)) / 2a",
    desc: "Finds roots of a quadratic equation.",
    calcLabel: "Enter value 'a' (b=5, c=2 constant):",
    calcFn: (a) => `Roots: x = ${((-5 + Math.sqrt(25 - 8 * a)) / (2 * a)).toFixed(2)}`
  }
];

export default function FormulaHubScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [activeFormula, setActiveFormula] = useState<Formula>(FORMULAS[0]);
  const [inputValue, setInputValue] = useState("10");
  const [result, setResult] = useState("");

  const handleSolve = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) {
      Alert.alert("Input Error", "Please enter a valid number.");
      return;
    }
    setResult(activeFormula.calcFn(val));
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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Formula solver Hub</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Horizontal Formula list */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 60, marginBottom: 20 }}>
          {FORMULAS.map((f, idx) => {
            const isSelected = activeFormula.name === f.name;
            return (
              <Pressable
                key={idx}
                onPress={() => {
                  setActiveFormula(f);
                  setResult("");
                }}
                style={[
                  styles.chip,
                  { backgroundColor: isSelected ? ACCENT : cardBg, borderColor: isSelected ? ACCENT : cardBorder }
                ]}
              >
                <Text style={{ color: isSelected ? "#FFFFFF" : textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                  {f.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Solver Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={{ color: "#BE1A1A", fontFamily: "Sora_700Bold", fontSize: 15 }}>{activeFormula.name}</Text>
          <Text style={{ color: textPrimary, fontFamily: "JetBrainsMono_400Regular", fontSize: 20, marginVertical: 12, textAlign: "center" }}>
            {activeFormula.equation}
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginBottom: 16 }}>
            {activeFormula.desc}
          </Text>

          {/* Calculator Input */}
          <Text style={[styles.inputLabel, { color: textSecondary }]}>{activeFormula.calcLabel}</Text>
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Pressable onPress={handleSolve} style={[styles.actionBtn, { backgroundColor: "#BE1A1A", marginTop: 14 }]}>
            <Text style={styles.actionBtnText}>Solve Equation</Text>
          </Pressable>

          {result ? (
            <View style={[styles.resultContainer, { backgroundColor: inputBg }]}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>Result: {result}</Text>
            </View>
          ) : null}
        </View>
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
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 10, height: 42 },
  card: { padding: 20, borderRadius: 16, borderWidth: 1 },
  inputLabel: { fontFamily: "Inter_700Bold", fontSize: 10, marginBottom: 6, letterSpacing: 0.8 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14 },
  actionBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  resultContainer: { marginTop: 16, padding: 14, borderRadius: 10, alignItems: "center" }
});
