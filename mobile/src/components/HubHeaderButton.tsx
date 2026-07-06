import React from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUiStore } from "../store/uiStore";
import type { UserRole } from "../store/authStore";

import { useWamdh } from "../context/WamdhContext";

interface HubHeaderButtonProps {
  role: UserRole;
  color?: string;
}

export default function HubHeaderButton({ role, color }: HubHeaderButtonProps) {
  const { openHub } = useUiStore();
  const { colors } = useWamdh();
  const bg = colors.inputBg;
  const activeColor = color || colors.accent;

  return (
    <Pressable
      onPress={() => openHub(role)}
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
      accessibilityLabel="Open Wamdh Hub"
    >
      <Ionicons name="grid-outline" size={20} color={activeColor} />
    </Pressable>
  );
}
