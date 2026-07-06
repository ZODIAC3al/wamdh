import React from "react";
import { Pressable, Text, PressableProps, ActivityIndicator, View, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useWamdh } from "../../context/WamdhContext";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: "primary" | "secondary" | "outline" | "link";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  limeStyle?: boolean;
  colors: any;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  variant = "primary",
  loading = false,
  leftIcon,
  rightIcon,
  limeStyle = false,
  colors,
  style,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);

  // Retrieve isRtl safely from Wamdh context
  let isRtl = false;
  try {
    const context = useWamdh();
    isRtl = context.isRtl;
  } catch (e) {}

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 12, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  // Build styles dynamically from Wamdh theme context to ensure smooth dark/light transitioning
  let containerStyle: any = {
    flexDirection: isRtl ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  };

  let textStyle: any = {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  };

  if (variant === "primary") {
    if (limeStyle) {
      containerStyle.backgroundColor = colors.limeAccent || "#D4FC34";
      containerStyle.borderColor = colors.limeAccent || "#D4FC34";
      textStyle.color = "#15120F";
    } else {
      containerStyle.backgroundColor = colors.brandPrimary;
      containerStyle.borderColor = colors.brandPrimary;
      textStyle.color = "#FFFFFF";
    }
  } else if (variant === "outline") {
    containerStyle.backgroundColor = "transparent";
    containerStyle.borderColor = colors.border;
    textStyle.color = colors.textPrimary;
  } else if (variant === "secondary") {
    containerStyle.backgroundColor = colors.inputBg;
    containerStyle.borderColor = "transparent";
    textStyle.color = colors.textPrimary;
  } else if (variant === "link") {
    containerStyle = {
      flexDirection: isRtl ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
    };
    textStyle.color = limeStyle ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, containerStyle, style]}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" && !limeStyle ? "#FFFFFF" : colors.textPrimary}
          style={{ marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }}
        />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }}>{leftIcon}</View>}
          <Text style={textStyle}>{label}</Text>
          {rightIcon && <View style={{ marginLeft: isRtl ? 0 : 8, marginRight: isRtl ? 8 : 0 }}>{rightIcon}</View>}
        </>
      )}
    </AnimatedPressable>
  );
}
