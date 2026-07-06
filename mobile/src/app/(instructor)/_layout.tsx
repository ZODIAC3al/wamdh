import React from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HubFab from "../../components/HubFab";
import WamdhHub from "../../components/WamdhHub";
import { useWamdh } from "../../context/WamdhContext";

export default function InstructorLayout() {
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
                <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="courses/index"
          options={{
            title: "Courses",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && { backgroundColor: PRIMARY + "20" }]}>
                <Ionicons name={focused ? "book" : "book-outline"} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="students/index"
          options={{
            title: "Students",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && { backgroundColor: PRIMARY + "20" }]}>
                <Ionicons name={focused ? "people" : "people-outline"} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="messages/index"
          options={{
            title: "Messages",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && { backgroundColor: PRIMARY + "20" }]}>
                <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={22} color={color} />
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

        {/* Hidden Subroutes */}
        <Tabs.Screen name="courses/create" options={{ href: null }} />
        <Tabs.Screen name="courses/[id]/index" options={{ href: null }} />
        <Tabs.Screen name="courses/[id]/edit" options={{ href: null }} />
        <Tabs.Screen name="courses/[id]/chapters/index" options={{ href: null }} />
        <Tabs.Screen name="courses/[id]/chapters/create" options={{ href: null }} />
        <Tabs.Screen name="courses/[id]/chapters/[cid]" options={{ href: null }} />
        <Tabs.Screen name="courses/[id]/students/index" options={{ href: null }} />
        <Tabs.Screen name="courses/[id]/quiz/index" options={{ href: null }} />
        <Tabs.Screen name="courses/[id]/quiz/create" options={{ href: null }} />
        <Tabs.Screen name="courses/[id]/quiz/[qid]" options={{ href: null }} />
        <Tabs.Screen name="courses/[id]/analytics/index" options={{ href: null }} />
        <Tabs.Screen name="students/[id]" options={{ href: null }} />
        <Tabs.Screen name="announcements/index" options={{ href: null }} />
        <Tabs.Screen name="announcements/create" options={{ href: null }} />
        <Tabs.Screen name="messages/[id]" options={{ href: null }} />
        <Tabs.Screen name="analytics/index" options={{ href: null }} />
        <Tabs.Screen name="profile/edit" options={{ href: null }} />
        
        {/* Deprecated fallback routes (classroom, assignments, quiz/build) */}
        <Tabs.Screen name="classroom/index" options={{ href: null }} />
        <Tabs.Screen name="assignments/index" options={{ href: null }} />
        <Tabs.Screen name="quiz/build" options={{ href: null }} />
      </Tabs>
      <HubFab role="instructor" />
      <WamdhHub role="instructor" />
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
