import React from "react";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F4F4F8] dark:bg-[#0F0F1A]">
      <ActivityIndicator size="large" color="#BE1A1A" />
    </View>
  );
}
