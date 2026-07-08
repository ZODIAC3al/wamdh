import "react-native-gesture-handler";
import "../global.css";
import React, { useEffect } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from "expo-router";
import { useColorScheme, LogBox } from "react-native";

LogBox.ignoreLogs([
  "SkPath.addRRect() is deprecated",
  "react-native-skia] SkPath.addRRect()",
]);
import * as SplashScreen from "expo-splash-screen";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts, Sora_700Bold } from "@expo-google-fonts/sora";
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from "@expo-google-fonts/inter";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import { queryClient } from "../lib/queryClient";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import Toast from "../components/Toast";
import { WamdhProvider, useWamdh } from "../context/WamdhContext";

// Keep splash screen visible until fonts are loaded
SplashScreen.preventAutoHideAsync();

function AppThemeWrapper({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useWamdh();

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const customTheme = {
    ...baseTheme,
    dark: isDark,
    colors: {
      ...baseTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.cardBg,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.accent,
    },
  };

  return (
    
    <GluestackUIProvider mode="dark">
      <ThemeProvider value={customTheme}>
      {children}
    </ThemeProvider>
    </GluestackUIProvider>
  
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { user, isLoading, initializeAuth } = useAuthStore();
  const { initializeTheme } = useThemeStore();
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    Sora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    JetBrainsMono_400Regular,
  });

  // Load auth state and safety splash screen auto-hide fallback
  useEffect(() => {
    initializeAuth();
    initializeTheme();
    
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (isLoading) return;
    if (!fontsLoaded) return;
    
    // Hide splash screen when ready
    SplashScreen.hideAsync().catch(() => {});

    const inAuthGroup = segments[0] === "(auth)";
    
    if (!user) {
      if (!inAuthGroup) {
        router.replace("/(auth)/onboarding");
      }
    } else {
      const inCorrectGroup = 
        (user.role === "student" && segments[0] === "(student)") ||
        (user.role === "instructor" && segments[0] === "(instructor)") ||
        (user.role === "admin" && segments[0] === "(admin)");

      if (!inCorrectGroup) {
        if (user.role === "student") {
          router.replace("/(student)");
        } else if (user.role === "instructor") {
          router.replace("/(instructor)");
        } else if (user.role === "admin") {
          router.replace("/(admin)");
        }
      }
    }
  }, [user, isLoading, fontsLoaded, segments]);

  if (isLoading) {
    return null;
  }

  return (
    <WamdhProvider>
      <AppThemeWrapper>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(student)" options={{ headerShown: false }} />
          <Stack.Screen name="(instructor)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        </Stack>
        <Toast />
      </AppThemeWrapper>
    </WamdhProvider>
  );
}

import { StripeWrapper } from "../components/StripeWrapper";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StripeWrapper publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}>
          <RootLayoutContent />
        </StripeWrapper>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
