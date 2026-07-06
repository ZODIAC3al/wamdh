import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Pressable, Animated, Easing, StyleSheet, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const PRESETS = [
  { label: "Focus", work: 25, break: 5, icon: "🍅" },
  { label: "Long", work: 50, break: 10, icon: "🔥" },
  { label: "Short", work: 15, break: 3, icon: "⚡" },
];

export default function PomodoroTimer() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const [preset, setPreset] = useState(0);
  const [isWorking, setIsWorking] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(PRESETS[0].work * 60);
  const [sessions, setSessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  const intervalRef = useRef<any>(null);
  const ringAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentPreset = PRESETS[preset];
  const totalSeconds = isWorking ? currentPreset.work * 60 : currentPreset.break * 60;
  const progress = 1 - seconds / totalSeconds;

  // Pulse animation when running
  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isWorking, preset]);

  const handleTimerEnd = async () => {
    setIsRunning(false);
    if (isWorking) {
      const worked = currentPreset.work;
      setSessions(s => s + 1);
      setTotalMinutes(m => m + worked);
      try {
        await apiClient.post("/api/analytics/session/", {
          subject: "Pomodoro Focus Session",
          duration_minutes: worked,
          activity_type: "focus",
        });
      } catch (e) {}
      Alert.alert("🍅 Session Complete!", `Great work! Take a ${currentPreset.break}-min break.`, [
        { text: "Start Break", onPress: () => { setIsWorking(false); setSeconds(currentPreset.break * 60); setIsRunning(true); } },
        { text: "Skip", onPress: () => resetTimer() },
      ]);
    } else {
      Alert.alert("☕ Break Over!", "Ready for another focus session?", [
        { text: "Start Session", onPress: () => { setIsWorking(true); setSeconds(currentPreset.work * 60); setIsRunning(true); } },
        { text: "Later", onPress: () => resetTimer() },
      ]);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsWorking(true);
    setSeconds(currentPreset.work * 60);
  };

  const toggleTimer = () => setIsRunning(r => !r);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginLeft: 12 }}>
          Focus Timer
        </Text>
        <View style={[styles.sessionBadge, { backgroundColor: ACCENT + "20" }]}>
          <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 13 }}>{sessions} 🍅</Text>
        </View>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        {/* Mode Label */}
        <View style={[styles.modePill, { backgroundColor: isWorking ? ACCENT + "20" : "#10B98120" }]}>
          <Text style={{ color: isWorking ? ACCENT : "#10B981", fontFamily: "Inter_700Bold", fontSize: 13 }}>
            {isWorking ? "🍅 Focus Time" : "☕ Break Time"}
          </Text>
        </View>

        {/* Ring Timer */}
        <Animated.View style={[styles.ringWrap, { transform: [{ scale: pulseAnim }] }]}>
          {/* Background ring */}
          <View style={[styles.ringBg, { borderColor: colors.inputBg }]} />
          {/* Progress ring overlay */}
          <View
            style={[
              styles.ringProgress,
              {
                borderColor: "transparent",
                borderTopColor: progress > 0 ? (isWorking ? ACCENT : "#10B981") : "transparent",
                borderRightColor: progress > 0.25 ? (isWorking ? ACCENT : "#10B981") : "transparent",
                borderBottomColor: progress > 0.5 ? (isWorking ? ACCENT : "#10B981") : "transparent",
                borderLeftColor: progress > 0.75 ? (isWorking ? ACCENT : "#10B981") : "transparent",
              },
            ]}
          />
          <View style={styles.ringInner}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 52 }}>
              {formatTime(seconds)}
            </Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 4 }}>
              {isWorking ? "Stay focused!" : "Relax & breathe"}
            </Text>
          </View>
        </Animated.View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable onPress={resetTimer} style={[styles.controlBtn, { backgroundColor: inputBg }]}>
            <Ionicons name="refresh" size={22} color={textSecondary} />
          </Pressable>

          <Pressable onPress={toggleTimer} style={[styles.playBtn, { backgroundColor: isWorking ? ACCENT : "#10B981", shadowColor: isWorking ? ACCENT : "#10B981" }]}>
            <Ionicons name={isRunning ? "pause" : "play"} size={30} color={dark && isWorking ? "#000000" : "#FFFFFF"} />
          </Pressable>

          <Pressable
            onPress={() => { setIsWorking(w => !w); setSeconds(!isWorking ? currentPreset.work * 60 : currentPreset.break * 60); setIsRunning(false); }}
            style={[styles.controlBtn, { backgroundColor: inputBg }]}
          >
            <Ionicons name="swap-horizontal" size={22} color={textSecondary} />
          </Pressable>
        </View>

        {/* Preset Selector */}
        <View style={styles.presets}>
          {PRESETS.map((p, i) => (
            <Pressable
              key={i}
              onPress={() => { setPreset(i); setSeconds(p.work * 60); setIsWorking(true); setIsRunning(false); }}
              style={[styles.presetBtn, { backgroundColor: preset === i ? ACCENT : inputBg }]}
            >
              <Text style={{ fontSize: 14 }}>{p.icon}</Text>
              <Text style={{ color: preset === i ? (dark ? "#000000" : "#FFFFFF") : textSecondary, fontFamily: "Inter_700Bold", fontSize: 11, marginTop: 4 }}>
                {p.label}
              </Text>
              <Text style={{ color: preset === i ? (dark ? "#00000099" : "#FFFFFF99") : textSecondary, fontFamily: "Inter_400Regular", fontSize: 10 }}>
                {p.work}/{p.break}m
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
          {[
            { label: "Sessions", value: sessions, icon: "🍅" },
            { label: "Minutes", value: totalMinutes, icon: "⏱️" },
          ].map(stat => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={{ fontSize: 22 }}>{stat.icon}</Text>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginTop: 6 }}>{stat.value}</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sessionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, marginLeft: "auto" },
  modePill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 50, marginBottom: 32 },
  ringWrap: { width: 240, height: 240, alignItems: "center", justifyContent: "center", marginBottom: 36 },
  ringBg: { position: "absolute", width: 240, height: 240, borderRadius: 120, borderWidth: 12 },
  ringProgress: { position: "absolute", width: 240, height: 240, borderRadius: 120, borderWidth: 12, transform: [{ rotate: "-90deg" }] },
  ringInner: { alignItems: "center" },
  controls: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 28 },
  controlBtn: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  playBtn: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  presets: { flexDirection: "row", gap: 10 },
  presetBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 14 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, borderWidth: 1, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
});
