import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
} from "react-native";
import { useWamdh } from "../context/WamdhContext";

export default function ThemeToggle() {
  const { themeMode, setThemeMode, isDark, colors } = useWamdh();
  
  const PRIMARY = colors.accent;
  
  // Position of knob: 0 is light/left, 1 is dark/right
  const animValue = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isDark]);

  const toggleTheme = () => {
    setThemeMode(isDark ? "light" : "dark");
  };

  // Interpolate knob position
  const knobTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 52],
  });

  // Interpolate track background color based on theme
  const trackBg = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.overlay, colors.surfaceElevated],
  });

  // Interpolate knob background color
  const knobBg = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.cardBg, colors.surfaceElevated],
  });

  // Interpolate text opacity for clean fades
  const lightTextOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.5],
  });

  const darkTextOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <View style={styles.outerContainer}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {isDark ? "Dark Theme Active" : "Light Theme Active"}
      </Text>

      <View style={styles.toggleRow}>
        <Animated.View style={{ opacity: darkTextOpacity }}>
          <Text style={[styles.sideLabel, { color: colors.textPrimary, marginRight: 16 }]}>Dark</Text>
        </Animated.View>

        <Pressable onPress={toggleTheme}>
          <Animated.View style={[styles.track, { backgroundColor: trackBg, borderColor: colors.border }]}>
            <Animated.View
              style={[
                styles.knob,
                {
                  transform: [{ translateX: knobTranslateX }],
                  backgroundColor: knobBg,
                  shadowColor: PRIMARY,
                },
              ]}
            />
          </Animated.View>
        </Pressable>

        <Animated.View style={{ opacity: lightTextOpacity }}>
          <Text style={[styles.sideLabel, { color: colors.textPrimary, marginLeft: 16 }]}>Light</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  title: {
    fontFamily: "Sora_700Bold",
    fontSize: 16,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sideLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  track: {
    width: 102,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(127, 127, 127, 0.2)",
  },
  knob: {
    width: 44,
    height: 44,
    borderRadius: 22,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    borderWidth: 0.5,
    borderColor: "rgba(127, 127, 127, 0.1)",
  },
});
