import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, StyleSheet, Alert, GestureResponderEvent, Share, Clipboard, FlatList
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import * as SecureStore from "expo-secure-store";
import { useWamdh } from "../../../context/WamdhContext";

interface SavedSketch {
  id: string;
  name: string;
  paths: string[];
  color: string;
  date: string;
}

export default function WhiteboardScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [currentPath, setCurrentPath] = useState<string>("");
  const [paths, setPaths] = useState<string[]>([]);
  const [currentColor, setCurrentColor] = useState("#BE1A1A");
  const [savedSketches, setSavedSketches] = useState<SavedSketch[]>([]);

  useEffect(() => {
    loadSavedSketches();
  }, []);

  const loadSavedSketches = async () => {
    try {
      const stored = await SecureStore.getItemAsync("wamdh_whiteboard_saves");
      if (stored) {
        setSavedSketches(JSON.parse(stored));
      }
    } catch (e) {
      console.log("Could not load sketches", e);
    }
  };

  const saveCurrentSketch = async () => {
    if (paths.length === 0) {
      Alert.alert("Empty", "Draw something before saving!");
      return;
    }
    const newSketch: SavedSketch = {
      id: String(Date.now()),
      name: `Sketch ${savedSketches.length + 1}`,
      paths: [...paths],
      color: currentColor,
      date: new Date().toLocaleDateString()
    };
    const updated = [newSketch, ...savedSketches];
    try {
      await SecureStore.setItemAsync("wamdh_whiteboard_saves", JSON.stringify(updated));
      setSavedSketches(updated);
      Alert.alert("Saved", "Your sketch has been saved locally.");
    } catch (e) {
      Alert.alert("Error", "Could not save sketch.");
    }
  };

  const handleLoadSketch = (sketch: SavedSketch) => {
    setPaths(sketch.paths);
    setCurrentColor(sketch.color);
    Alert.alert("Loaded", `${sketch.name} loaded successfully!`);
  };

  const handleDeleteSketch = async (id: string) => {
    const updated = savedSketches.filter(s => s.id !== id);
    try {
      await SecureStore.setItemAsync("wamdh_whiteboard_saves", JSON.stringify(updated));
      setSavedSketches(updated);
    } catch (e) {}
  };

  const handleShareSketch = async () => {
    if (paths.length === 0) {
      Alert.alert("Empty", "Draw something to export/download!");
      return;
    }
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" style="background:#FFFFFF">
  ${paths.map(p => `<path d="${p}" fill="none" stroke="${currentColor}" stroke-width="4" />`).join('\n  ')}
</svg>`;
    
    try {
      await Share.share({
        message: svgContent,
        title: "Wamdh Whiteboard Sketch SVG Export"
      });
    } catch (e) {
      Alert.alert("Error", "Could not share SVG code.");
    }
  };

  const onTouchStart = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath(`M${locationX.toFixed(1)},${locationY.toFixed(1)}`);
  };

  const onTouchMove = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath(prev => `${prev} L${locationX.toFixed(1)},${locationY.toFixed(1)}`);
  };

  const onTouchEnd = () => {
    if (currentPath) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath("");
    }
  };

  const handleClear = () => {
    setPaths([]);
    setCurrentPath("");
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Sketch Whiteboard</Text>
        <Pressable onPress={handleClear} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="refresh-outline" size={20} color="#EF4444" />
        </Pressable>
      </View>

      {/* Brush & Save Row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10 }}>
        <View style={styles.brushRow}>
          {["#BE1A1A", "#10B981", "#3B82F6", "#EF4444", "#F7D87F"].map(color => (
            <Pressable
              key={color}
              onPress={() => setCurrentColor(color)}
              style={[
                styles.colorBubble,
                { backgroundColor: color, borderColor: currentColor === color ? textPrimary : "transparent", borderWidth: 2 }
              ]}
            />
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={saveCurrentSketch} style={[styles.actionBtn, { backgroundColor: ACCENT + "15", borderColor: ACCENT }]}>
            <Ionicons name="save-outline" size={14} color={ACCENT} />
            <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: 4 }}>Save</Text>
          </Pressable>
          <Pressable onPress={handleShareSketch} style={[styles.actionBtn, { backgroundColor: ACCENT + "15", borderColor: ACCENT }]}>
            <Ionicons name="cloud-download-outline" size={14} color={ACCENT} />
            <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: 4 }}>Export SVG</Text>
          </Pressable>
        </View>
      </View>

      {/* Touch Canvas Drawing Area */}
      <View
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={[styles.canvas, { backgroundColor: dark ? "#111827" : "#FFFFFF", borderColor: cardBorder }]}
      >
        <Svg style={StyleSheet.absoluteFill}>
          {paths.map((p, idx) => (
            <Path key={idx} d={p} fill="none" stroke={currentColor} strokeWidth={4} />
          ))}
          {currentPath ? (
            <Path d={currentPath} fill="none" stroke={currentColor} strokeWidth={4} />
          ) : null}
        </Svg>
      </View>

      {/* Saved Sketches Bottom List */}
      <View style={{ height: 110, paddingHorizontal: 20, marginTop: 12 }}>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 13, marginBottom: 8 }}>
          Saved Sketches ({savedSketches.length})
        </Text>
        {savedSketches.length === 0 ? (
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, fontStyle: "italic" }}>
            No saved drawings. Draw and tap Save to store here.
          </Text>
        ) : (
          <FlatList
            horizontal
            data={savedSketches}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <View style={[styles.sketchCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Pressable onPress={() => handleLoadSketch(item)} style={{ flex: 1 }}>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 11 }} numberOfLines={1}>{item.name}</Text>
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 9 }}>{item.date}</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteSketch(item.id)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={14} color="#EF4444" />
                </Pressable>
              </View>
            )}
          />
        )}
      </View>
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
  brushRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  colorBubble: { width: 26, height: 26, borderRadius: 13 },
  actionBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  canvas: { flex: 1, marginHorizontal: 20, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  sketchCard: { width: 120, height: 54, borderRadius: 10, borderWidth: 1, padding: 8, flexDirection: "row", alignItems: "center" }
});
