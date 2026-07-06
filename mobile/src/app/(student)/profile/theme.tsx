import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWamdh } from "../../../context/WamdhContext";
import ThemeToggle from "../../../components/ThemeToggle";

const ACCENTS = [
  { name: "Grayscale Dark", hex: "#2e2e2e", light: "#f7f7f7" },
  { name: "Emerald Mint", hex: "#10B981", light: "#E6F7F0" },
  { name: "Ocean Blue", hex: "#3B82F6", light: "#EBF3FF" },
  { name: "Amber Sunshine", hex: "#F7D87F", light: "#FFF8E6" },
  { name: "Rose Crimson", hex: "#F43F5E", light: "#FFEBEF" },
];

export default function ThemeCustomizerScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl, setAccentColor } = useWamdh();
  const PRIMARY = colors.accent;

  const handleSelectAccent = (hex: string, name: string) => {
    setAccentColor(hex);
    Alert.alert("Accent Color Updated", `${name} is now your custom accent theme color!`);
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
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Theme Customizer</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Interactive Neumorphic Toggle Switch */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginBottom: 20 }]}>
          <ThemeToggle />
        </View>

        {/* Active Theme Info */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>🎨 Select Custom Accent</Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4, lineHeight: 18 }}>
            Change the default highlight accent across buttons, badges, navigation borders and streaks.
          </Text>
        </View>

        {/* Accent Grid */}
        <View style={{ marginTop: 20, gap: 12 }}>
          {ACCENTS.map((item) => {
            const isSelected = colors.accent === item.hex;
            return (
              <Pressable
                key={item.hex}
                onPress={() => handleSelectAccent(item.hex, item.name)}
                style={[
                  styles.accentCard,
                  { backgroundColor: cardBg, borderColor: isSelected ? item.hex : cardBorder },
                  isSelected && { borderWidth: 2 }
                ]}
              >
                <View style={[styles.colorBubble, { backgroundColor: item.hex }]} />
                <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14, flex: 1, marginLeft: 16 }}>
                  {item.name}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={22} color={item.hex} />}
              </Pressable>
            );
          })}
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
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15 },
  accentCard: {
    flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1
  },
  colorBubble: { width: 32, height: 32, borderRadius: 16 }
});
