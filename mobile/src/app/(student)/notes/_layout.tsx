import React from "react";
import { Stack } from "expo-router";

export default function NotesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="write" />
      <Stack.Screen name="tts" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="bookmarks" />
      <Stack.Screen name="record" />
      <Stack.Screen name="lecture" />
    </Stack>
  );
}
