import React, { useState } from "react";
import { View, Text, TextInput, TextInputProps, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWamdh } from "../../context/WamdhContext";

interface InputProps extends TextInputProps {
  label: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightAction?: React.ReactNode;
  colors: any;
}

export function Input({
  label,
  leftIcon,
  rightAction,
  colors,
  style,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Retrieve isRtl safely from Wamdh context
  let isRtl = false;
  try {
    const context = useWamdh();
    isRtl = context.isRtl;
  } catch (e) {}

  const isPassword = secureTextEntry;
  const isSecure = isPassword && !showPassword;

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.textSecondary, textAlign: isRtl ? "right" : "left" }}>
          {label}
        </Text>
        {rightAction}
      </View>
      <View
        style={{
          flexDirection: isRtl ? "row-reverse" : "row",
          alignItems: "center",
          backgroundColor: colors.inputBg,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: isFocused ? (colors.limeAccent || "#D4FC34") : colors.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={colors.textSecondary}
            style={{ marginRight: isRtl ? 0 : 10, marginLeft: isRtl ? 10 : 0 }}
          />
        )}
        <TextInput
          style={{
            flex: 1,
            color: colors.textPrimary,
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            padding: 0,
            textAlign: isRtl ? "right" : "left",
          }}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
