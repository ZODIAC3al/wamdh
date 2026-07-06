import React from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HubFab from "../../components/HubFab";
import WamdhHub from "../../components/WamdhHub";
import { useWamdh } from "../../context/WamdhContext";

export default function StudentLayout() {
  const { colors, isDark: dark, t, isRtl } = useWamdh();

  const ACCENT = colors.accent;
  const tabBg = colors.cardBg;
  const inactiveTint = colors.textSecondary;
  const ACTIVE_ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: ACTIVE_ACCENT,
          tabBarInactiveTintColor: inactiveTint,
          tabBarStyle: {
            backgroundColor: tabBg,
            borderTopWidth: dark ? 0 : 1,
            borderTopColor: colors.border,
            height: 64,
            paddingBottom: 10,
            paddingTop: 10,
            elevation: dark ? 0 : 4,
            shadowColor: "#000",
            shadowOpacity: dark ? 0 : 0.06,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -4 },
          },
          tabBarLabelStyle: {
            fontFamily: "Inter_500Medium",
            fontSize: 10,
            marginTop: 2,
          },
          tabBarIconStyle: { marginBottom: -2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("home"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && { backgroundColor: ACTIVE_ACCENT + "20" }]}>
                <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="notes"
          options={{
            title: t("notes"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && { backgroundColor: ACTIVE_ACCENT + "20" }]}>
                <Ionicons name={focused ? "document-text" : "document-text-outline"} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="ai/chat"
          options={{
            title: t("ai_tutor"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.iconWrapCenter,
                { backgroundColor: focused ? ACTIVE_ACCENT : colors.inputBg, shadowColor: ACTIVE_ACCENT },
              ]}>
                <Ionicons
                  name={focused ? "sparkles" : "sparkles-outline"}
                  size={24}
                  color={focused ? (dark ? "#000000" : "#FFFFFF") : color}
                />
              </View>
            ),
            tabBarLabel: () => null,
          }}
        />
        <Tabs.Screen
          name="messages/index"
          options={{
            title: t("messages"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && { backgroundColor: ACTIVE_ACCENT + "20" }]}>
                <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("profile"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && { backgroundColor: ACTIVE_ACCENT + "20" }]}>
                <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
              </View>
            ),
          }}
        />

        {/* Hidden from tab bar — accessible via router.push */}
        <Tabs.Screen name="quiz" options={{ href: null }} />
        <Tabs.Screen name="analytics" options={{ href: null }} />
        <Tabs.Screen name="planner" options={{ href: null }} />
        <Tabs.Screen name="flashcards" options={{ href: null }} />
        <Tabs.Screen name="messages/[id]" options={{ href: null }} />
        <Tabs.Screen name="premium" options={{ href: null }} />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="achievements" options={{ href: null }} />
        <Tabs.Screen name="vocab" options={{ href: null }} />
        <Tabs.Screen name="goals" options={{ href: null }} />
        <Tabs.Screen name="report" options={{ href: null }} />
        <Tabs.Screen name="community/index" options={{ href: null }} />
        <Tabs.Screen name="community/[id]" options={{ href: null }} />
        <Tabs.Screen name="planner/timer" options={{ href: null }} />

        {/* 25 New Student Screens */}
        <Tabs.Screen name="mindmap/index" options={{ href: null }} />
        <Tabs.Screen name="groups/rooms" options={{ href: null }} />
        <Tabs.Screen name="ai/voice" options={{ href: null }} />
        <Tabs.Screen name="profile/theme" options={{ href: null }} />
        <Tabs.Screen name="planner/kanban" options={{ href: null }} />
        <Tabs.Screen name="analytics/gpa" options={{ href: null }} />
        <Tabs.Screen name="sandbox/index" options={{ href: null }} />
        <Tabs.Screen name="analytics/tracker" options={{ href: null }} />
        <Tabs.Screen name="whiteboard/index" options={{ href: null }} />
        <Tabs.Screen name="profile/resume" options={{ href: null }} />
        <Tabs.Screen name="vocab/pronounce" options={{ href: null }} />
        <Tabs.Screen name="leaderboard/index" options={{ href: null }} />
        <Tabs.Screen name="formula/index" options={{ href: null }} />
        <Tabs.Screen name="break/game" options={{ href: null }} />
        <Tabs.Screen name="premium/payment" options={{ href: null }} />
        <Tabs.Screen name="premium/store" options={{ href: null }} />
        <Tabs.Screen name="profile/xp-shop" options={{ href: null }} />
        <Tabs.Screen name="analytics/exam-predictor" options={{ href: null }} />
      </Tabs>
      <HubFab role="student" />
      <WamdhHub role="student" />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  iconWrapCenter: {
    width: 50, height: 50, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
    shadowColor: "#BE1A1A", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
});
