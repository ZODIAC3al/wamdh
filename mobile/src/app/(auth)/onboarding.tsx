import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useWamdh } from "../../context/WamdhContext";
import LanguageBottomSheet from "../../components/LanguageBottomSheet";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SlideData {
  id: string;
  titleKey: string;
  highlightKey: string;
  subtitleKey: string;
  shapes: { color: string; top: number; left: number; size: number; radius: number }[];
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const slides: SlideData[] = [
  {
    id: "1",
    titleKey: "onboarding_slide1_title",
    highlightKey: "onboarding_slide1_highlight",
    subtitleKey: "onboarding_slide1_subtitle",
    shapes: [
      { color: "#EF4444", top: 0, left: 0, size: 160, radius: 24 },
      { color: "#14B8A6", top: 0, left: SCREEN_WIDTH - 160, size: 160, radius: 24 },
      { color: "#3B82F6", top: SCREEN_HEIGHT * 0.25, left: 0, size: 130, radius: 24 },
      { color: "#EAB308", top: SCREEN_HEIGHT * 0.2, left: SCREEN_WIDTH - 160, size: 140, radius: 24 },
      { color: "#EC4899", top: SCREEN_HEIGHT * 0.4, left: 60, size: 120, radius: 24 },
    ],
    icon: "school-outline",
    iconColor: "#FFFFFF",
  },
  {
    id: "2",
    titleKey: "onboarding_slide2_title",
    highlightKey: "onboarding_slide2_highlight",
    subtitleKey: "onboarding_slide2_subtitle",
    shapes: [
      { color: "#BE1A1A", top: 0, left: 0, size: 170, radius: 24 },
      { color: "#06B6D4", top: 0, left: SCREEN_WIDTH - 150, size: 150, radius: 24 },
      { color: "#F7D87F", top: SCREEN_HEIGHT * 0.3, left: 20, size: 110, radius: 24 },
      { color: "#10B981", top: SCREEN_HEIGHT * 0.2, left: SCREEN_WIDTH - 140, size: 130, radius: 24 },
      { color: "#3B82F6", top: SCREEN_HEIGHT * 0.42, left: SCREEN_WIDTH * 0.35, size: 100, radius: 24 },
    ],
    icon: "checkbox-outline",
    iconColor: "#FFFFFF",
  },
  {
    id: "3",
    titleKey: "onboarding_slide3_title",
    highlightKey: "onboarding_slide3_highlight",
    subtitleKey: "onboarding_slide3_subtitle",
    shapes: [
      { color: "#EC4899", top: 0, left: 0, size: 150, radius: 24 },
      { color: "#8B5CF6", top: 0, left: SCREEN_WIDTH - 160, size: 160, radius: 24 },
      { color: "#10B981", top: SCREEN_HEIGHT * 0.28, left: 0, size: 120, radius: 24 },
      { color: "#F97316", top: SCREEN_HEIGHT * 0.22, left: SCREEN_WIDTH - 140, size: 130, radius: 24 },
      { color: "#06B6D4", top: SCREEN_HEIGHT * 0.38, left: SCREEN_WIDTH * 0.3, size: 110, radius: 24 },
    ],
    icon: "chatbubbles-outline",
    iconColor: "#FFFFFF",
  },
];

function SlideItem({ item, index }: { item: SlideData; index: number }) {
  const iconScale = useSharedValue(0.5);
  const iconOpacity = useSharedValue(0);

  useEffect(() => {
    iconScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 100 }));
    iconOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
  }, []);

  const animIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));

  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
      {/* Color blocks top area */}
      <View style={{ height: SCREEN_HEIGHT * 0.52, position: "relative", overflow: "hidden" }}>
        {item.shapes.map((s, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: s.radius,
              backgroundColor: s.color,
            }}
          />
        ))}
        {/* Icon overlay */}
        <Animated.View
          style={[
            animIconStyle,
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <View
            style={{
              width: 130,
              height: 130,
              borderRadius: 65,
              backgroundColor: "rgba(0,0,0,0.35)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.3)",
            }}
          >
            <Ionicons name={item.icon} size={60} color={item.iconColor} />
          </View>
          {/* Decorative oval ring */}
          <View
            style={{
              position: "absolute",
              width: 260,
              height: 80,
              borderRadius: 100,
              borderWidth: 2.5,
              borderColor: "rgba(255,255,255,0.5)",
              transform: [{ rotateX: "65deg" }],
            }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [langSheetVisible, setLangSheetVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { t, isRtl } = useWamdh();

  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(40);

  const animContent = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  useEffect(() => {
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 700 }));
    contentY.value = withDelay(400, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [activeIndex]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    // Handle RTL inverted indexing
    const newIndex = isRtl 
      ? Math.round((slides.length - 1) - (x / SCREEN_WIDTH))
      : Math.round(x / SCREEN_WIDTH);
      
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < slides.length) {
      setActiveIndex(newIndex);
      contentOpacity.value = 0;
      contentY.value = 40;
    }
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      const targetIndex = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ 
        index: isRtl ? (slides.length - 1) - targetIndex : targetIndex, 
        animated: true 
      });
      setActiveIndex(targetIndex);
    } else {
      router.push("/(auth)/login");
    }
  };

  const currentSlide = slides[activeIndex];

  return (
    <View style={{ flex: 1, backgroundColor: "#111827" }}>
      <StatusBar style="light" />

      {/* Language Trigger (Globe) */}
      <Pressable
        onPress={() => setLangSheetVisible(true)}
        style={{
          position: "absolute",
          top: 52,
          left: isRtl ? undefined : 24,
          right: isRtl ? 24 : undefined,
          zIndex: 20,
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: "rgba(255, 255, 255, 0.12)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
      </Pressable>

      {/* Skip Button */}
      <Pressable
        onPress={() => router.push("/(auth)/login")}
        style={{
          position: "absolute",
          top: 52,
          left: isRtl ? 24 : undefined,
          right: isRtl ? undefined : 24,
          zIndex: 20,
          paddingVertical: 8,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ color: "#9CA3AF", fontFamily: "Inter_500Medium", fontSize: 14 }}>
          {t("skip")}
        </Text>
      </Pressable>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <SlideItem item={item} index={index} />}
        style={{ flex: 1 }}
        inverted={isRtl}
      />

      {/* Bottom Content Panel */}
      <View
        style={{
          backgroundColor: "#111827",
          paddingHorizontal: 28,
          paddingBottom: 48,
          paddingTop: 28,
        }}
      >
        <Animated.View style={animContent}>
          {/* Dot pagination */}
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", marginBottom: 24 }}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === activeIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === activeIndex ? "#BE1A1A" : "#374151",
                  marginRight: isRtl ? 0 : 6,
                  marginLeft: isRtl ? 6 : 0,
                }}
              />
            ))}
          </View>

          {/* Title */}
          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: "Sora_700Bold",
              fontSize: 28,
              lineHeight: 36,
              marginBottom: 4,
              textAlign: isRtl ? "right" : "left",
            }}
          >
            {t(currentSlide.titleKey)}
            <Text style={{ color: "#D0311E" }}>{t(currentSlide.highlightKey)}</Text>
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              color: "#9CA3AF",
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              lineHeight: 22,
              marginBottom: 32,
              textAlign: isRtl ? "right" : "left",
            }}
          >
            {t(currentSlide.subtitleKey)}
          </Text>

          {/* CTA Row */}
          <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
            {activeIndex < slides.length - 1 ? (
              <>
                <Pressable
                  onPress={() => router.push("/(auth)/login")}
                  style={{ paddingVertical: 12 }}
                >
                  <Text style={{ color: "#6B7280", fontFamily: "Inter_500Medium", fontSize: 14 }}>
                    {t("login")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleNext}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: "#BE1A1A",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#BE1A1A",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 10,
                  }}
                >
                  <Ionicons name={isRtl ? "arrow-back" : "arrow-forward"} size={24} color="#FFFFFF" />
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => router.push("/(auth)/login")}
                style={{
                  flex: 1,
                  backgroundColor: "#BE1A1A",
                  paddingVertical: 18,
                  borderRadius: 50,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#BE1A1A",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 10,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 16 }}>
                  {t("get_started")}
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>

      <LanguageBottomSheet
        visible={langSheetVisible}
        onClose={() => setLangSheetVisible(false)}
      />
    </View>
  );
}
