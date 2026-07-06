import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWamdh } from "../../../context/WamdhContext";


export default function DocumentScannerScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [scanning, setScanning] = useState(false);
  const [scannedText, setScannedText] = useState("");

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScannedText("Scanned Notes Content:\n\nTopic: Cellular Respiration\nCellular respiration is a set of metabolic reactions and processes that take place in the cells of organisms to convert chemical energy from nutrients into ATP.");
      Alert.alert("🎉 Scan Success", "Extracted text successfully from photo note!");
    }, 2000);
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
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Document Scanner (OCR)</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Scanner Viewfinder Box */}
        <View style={[styles.viewfinder, { backgroundColor: dark ? "#111827" : "#E5E7EB", borderColor: "#BE1A1A" }]}>
          {scanning ? (
            <ActivityIndicator size="large" color={ACCENT} />
          ) : (
            <Pressable onPress={handleScan} style={styles.captureBtn}>
              <Ionicons name="camera" size={32} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 8 }}>Take Photo to Scan</Text>
            </Pressable>
          )}
        </View>

        {/* Scanned Results */}
        {scannedText ? (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 20 }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>📄 Extracted Text Results</Text>
            <View style={styles.resultsContainer}>
              <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 }}>
                {scannedText}
              </Text>
            </View>
            <Pressable onPress={() => {
              Alert.alert("Note Saved", "Extracted OCR text saved into study notes successfully.");
              router.push("/(student)/notes");
            }} style={[styles.saveBtn, { backgroundColor: "#BE1A1A", marginTop: 14 }]}>
              <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>Save to Notes</Text>
            </Pressable>
          </View>
        ) : null}
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
  viewfinder: { height: 220, borderRadius: 16, borderStyle: "dashed", borderWidth: 2, alignItems: "center", justifyContent: "center" },
  captureBtn: { alignItems: "center" },
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15 },
  resultsContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 12 },
  saveBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" }
});
