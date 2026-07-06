import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
  KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { apiClient } from "../../../lib/api";
import { useAuthStore } from "../../../store/authStore";
import { useWamdh } from "../../../context/WamdhContext";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { colors, isDark: dark, t, isRtl, refreshUser } = useWamdh();

  const PRIMARY = colors.accent;

  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [username, setUsername] = useState(user?.username || "");

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.patch("/api/users/profile/", {
        username,
        bio
      });
      setUser(res.data);
      refreshUser();
      Alert.alert("Success", "Profile updated successfully.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert("Error", "Could not save profile details.");
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadImage = async (type: "profile" | "banner") => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Denied", "Camera roll access required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "profile" ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (result.canceled) return;
    const img = result.assets[0];
    const form = new FormData();
    const fieldName = type === "profile" ? "profile_photo" : "banner_image";
    form.append(fieldName, { uri: img.uri, name: `${type}.jpg`, type: "image/jpeg" } as any);
    setIsUploading(true);
    try {
      const endpoint = type === "profile" ? "/api/users/profile/photo/" : "/api/users/profile/banner/";
      const r = await apiClient.post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const u = r.data.user || r.data;
      if (u) {
        setUser({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          xp_points: u.xp_points || 0,
          streak_days: u.streak_days || 0,
          profile_photo_url: u.profile_photo_url,
          banner_image_url: u.banner_image_url,
          bio: u.bio,
        });
      }
      refreshUser();
      Alert.alert("Success", `${type === "profile" ? "Profile photo" : "Cover banner"} updated successfully.`);
    } catch (err) {
      Alert.alert("Upload Failed", "Could not upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: bg }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Edit Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.label, { color: textSecondary }]}>USERNAME</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />

          <Text style={[styles.label, { color: textSecondary, marginTop: 16 }]}>BIOGRAPHY / BIO</Text>
          <TextInput
            placeholder="Introduce yourself to your students..."
            placeholderTextColor={textSecondary}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            style={[styles.inputArea, { backgroundColor: inputBg, color: textPrimary }]}
          />
        </View>

        {isUploading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
        ) : (
          <View style={{ marginTop: 20, gap: 10 }}>
            <Pressable
              onPress={() => pickAndUploadImage("profile")}
              style={[styles.uploadBtn, { borderColor: PRIMARY, borderWidth: 1 }]}
            >
              <Ionicons name="image-outline" size={18} color={PRIMARY} />
              <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 13 }}>Change Profile Picture</Text>
            </Pressable>

            <Pressable
              onPress={() => pickAndUploadImage("banner")}
              style={[styles.uploadBtn, { borderColor: PRIMARY, borderWidth: 1 }]}
            >
              <Ionicons name="images-outline" size={18} color={PRIMARY} />
              <Text style={{ color: PRIMARY, fontFamily: "Inter_700Bold", fontSize: 13 }}>Change Cover Banner</Text>
            </Pressable>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
        ) : (
          <Pressable
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: PRIMARY }]}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>Save Changes</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  formCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  label: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14, height: 48 },
  inputArea: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14, minHeight: 90, textAlignVertical: "top" },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 44, borderRadius: 10, gap: 8 },
  saveBtn: { marginTop: 24, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" }
});
