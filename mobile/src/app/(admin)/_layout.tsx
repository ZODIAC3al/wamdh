import React from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HubFab from "../../components/HubFab";
import WamdhHub from "../../components/WamdhHub";
import { useWamdh } from "../../context/WamdhContext";

export default function AdminLayout() {
  const { colors, isDark: dark } = useWamdh();

  const PRIMARY = colors.accent;
  const tabBg = colors.cardBg;
  const inactiveTint = colors.textSecondary;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: PRIMARY,
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
            title: "Dashboard",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && { backgroundColor: PRIMARY + "20" }]}>
                <Ionicons name={focused ? "shield-checkmark" : "shield-checkmark-outline"} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="users/index"
          options={{
            title: "Users",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && { backgroundColor: PRIMARY + "20" }]}>
                <Ionicons name={focused ? "people" : "people-outline"} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="analytics/index"
          options={{
            title: "Analytics",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && { backgroundColor: PRIMARY + "20" }]}>
                <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="reports/index"
          options={{
            title: "Reports",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && { backgroundColor: PRIMARY + "20" }]}>
                <Ionicons name={focused ? "flag" : "flag-outline"} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && { backgroundColor: PRIMARY + "20" }]}>
                <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
              </View>
            ),
          }}
        />

        {/* Hidden Admin Subroutes */}
        <Tabs.Screen name="users/[id]" options={{ href: null }} />
        <Tabs.Screen name="users/create" options={{ href: null }} />
        <Tabs.Screen name="courses/index" options={{ href: null }} />
        <Tabs.Screen name="courses/[id]" options={{ href: null }} />
        <Tabs.Screen name="reports/[id]" options={{ href: null }} />
        <Tabs.Screen name="settings/index" options={{ href: null }} />
        <Tabs.Screen name="system/monitor" options={{ href: null }} />
        <Tabs.Screen name="moderation/index" options={{ href: null }} />
      </Tabs>
      <HubFab role="admin" />
      <WamdhHub role="admin" />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  }
});
