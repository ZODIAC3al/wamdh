import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUiStore } from "../store/uiStore";
import type { UserRole } from "../store/authStore";
import { useWamdh } from "../context/WamdhContext";

const GOLD = "#F7D87F";

interface HubFabProps {
  role: UserRole;
  bottom?: number;
}

export default function HubFab({ role, bottom = 90 }: HubFabProps) {
  const { openHub } = useUiStore();
  const { colors, isDark: dark } = useWamdh();
  
  const ACTIVE_ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;
  const FAB_COLOR = role === "student" ? ACTIVE_ACCENT : colors.brandPrimary;
  const ICON_COLOR = (role === "student" && dark) ? "#000000" : "#FFFFFF";

  return (
    <Pressable
      onPress={() => openHub(role)}
      style={[
        styles.fab,
        {
          bottom,
          backgroundColor: FAB_COLOR,
          shadowColor: FAB_COLOR,
        },
      ]}
      accessibilityLabel="Open Wamdh Hub"
    >
      <Ionicons name="grid-outline" size={24} color={ICON_COLOR} />
      {role !== "student" && (
        <Ionicons
          name="sparkles"
          size={12}
          color={GOLD}
          style={styles.sparkle}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 100,
  },
  sparkle: {
    position: "absolute",
    top: 8,
    right: 8,
  },
});
