import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useToastStore } from "../store/toastStore";

export default function Toast() {
  const { toasts, hide } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => {
        let bgColor = "bg-white dark:bg-[#1A1A2E]";
        let iconName: any = "information-circle";
        let iconColor = "#1D4ED8";
        let borderColor = "border-[#E5E7EB] dark:border-[#2E2E50]";

        if (toast.type === "success") {
          iconName = "checkmark-circle";
          iconColor = "#10B981";
        } else if (toast.type === "error") {
          iconName = "close-circle";
          iconColor = "#EF4444";
        }

        return (
          <Pressable
            key={toast.id}
            onPress={() => hide(toast.id)}
            className={`w-full max-w-sm rounded-card border p-4 mb-2 shadow-lg flex-row items-start ${bgColor} ${borderColor} active:opacity-90`}
          >
            <Ionicons name={iconName} size={22} color={iconColor} className="mr-3 mt-0.5" />
            <View className="flex-1 pr-2">
              <Text className="text-sm font-body-bold text-[#1A1A2E] dark:text-[#F3F4F6]">
                {toast.text1}
              </Text>
              {toast.text2 ? (
                <Text className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-body mt-1">
                  {toast.text2}
                </Text>
              ) : null}
            </View>
            <Ionicons name="close" size={16} color="#9CA3AF" />
          </Pressable>
        );
      })}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: "center",
  },
});
