import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, Platform, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

export default function NoteUpload() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = dark ? (colors.limeAccent || "#D4FC34") : colors.brandPrimary;
  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const inputBg = colors.inputBg;
  const inputBorder = dark ? "#374151" : "#E5E7EB";
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [tags, setTags] = useState("");
  const [rawText, setRawText] = useState("");
  
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
        setTitle(result.assets[0].name.replace(/\.[^/.]+$/, ""));
      }
    } catch (err) {
      Alert.alert("Error picking document");
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission to access camera roll is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
        setTitle("Image Note " + new Date().toLocaleDateString());
      }
    } catch (err) {
      Alert.alert("Error picking image");
    }
  };

  const handleUpload = async () => {
    if (!title || !subject) {
      Alert.alert("Validation Error", "Title and Subject are required");
      return;
    }
    if (!file && !rawText) {
      Alert.alert("Validation Error", "Please provide a file or type some text notes");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("subject", subject);
      
      const tagsArray = tags.split(",").map(t => t.trim()).filter(t => t.length > 0);
      tagsArray.forEach(tag => {
        formData.append("tags", tag);
      });

      if (file) {
        const fileUri = Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri;
        formData.append("file", {
          uri: fileUri,
          name: file.name || "note_upload.pdf",
          type: file.mimeType || "application/pdf"
        } as any);
      } else {
        formData.append("raw_text", rawText);
      }

      await apiClient.post("/api/notes/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setLoading(false);
      Alert.alert("Success", "Note uploaded successfully and is being processed!", [
        {
          text: "OK",
          onPress: () => router.replace("/(student)/notes"),
        },
      ]);
    } catch (e: any) {
      setLoading(false);
      const errMsg = e.response?.data?.detail || e.message || "Failed to upload note.";
      Alert.alert("Upload Failed", errMsg);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[uStyles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[uStyles.backBtn, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginLeft: 12 }}>Upload Note</Text>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <View style={[uStyles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>

          {/* Title */}
          <Text style={[uStyles.label, { color: textSecondary }]}>Note Title</Text>
          <View style={[uStyles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder, marginBottom: 14 }]}>
            <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Organic Chemistry Intro"
              placeholderTextColor="#6B7280"
              style={{ flex: 1, color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 }} />
          </View>

          {/* Subject */}
          <Text style={[uStyles.label, { color: textSecondary }]}>Subject</Text>
          <View style={[uStyles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder, marginBottom: 14 }]}>
            <TextInput value={subject} onChangeText={setSubject} placeholder="e.g. Chemistry"
              placeholderTextColor="#6B7280"
              style={{ flex: 1, color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 }} />
          </View>

          {/* Tags */}
          <Text style={[uStyles.label, { color: textSecondary }]}>Tags (comma separated)</Text>
          <View style={[uStyles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder, marginBottom: 20 }]}>
            <TextInput value={tags} onChangeText={setTags} placeholder="e.g. Alkanes, Bonds, Basics"
              placeholderTextColor="#6B7280"
              style={{ flex: 1, color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 }} />
          </View>

          {/* File pickers */}
          <Text style={[uStyles.label, { color: textSecondary, marginBottom: 10 }]}>Source File</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <Pressable onPress={handlePickDocument}
              style={[uStyles.pickerBtn, { backgroundColor: ACCENT + "12", borderColor: ACCENT }]}>
              <Ionicons name="document-attach" size={26} color={ACCENT} />
              <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 12, marginTop: 6 }}>PDF File</Text>
            </Pressable>
            <Pressable onPress={handlePickImage}
              style={[uStyles.pickerBtn, { backgroundColor: ACCENT + "12", borderColor: ACCENT }]}>
              <Ionicons name="image-outline" size={26} color={ACCENT} />
              <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 12, marginTop: 6 }}>Gallery</Text>
            </Pressable>
          </View>

          {file && (
            <View style={[uStyles.fileRow, { backgroundColor: "#10B98118", borderColor: "#10B98140" }]}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 13, flex: 1, marginLeft: 8 }} numberOfLines={1}>
                {file.name || "Selected Image"}
              </Text>
              <Pressable onPress={() => setFile(null)}>
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              </Pressable>
            </View>
          )}

          {/* Raw text */}
          <Text style={[uStyles.label, { color: textSecondary, marginTop: 8 }]}>Or Paste Notes Text</Text>
          <View style={[uStyles.textArea, { backgroundColor: inputBg, borderColor: inputBorder }]}>
            <TextInput value={rawText} onChangeText={setRawText}
              placeholder="Paste or type notes here..." placeholderTextColor="#6B7280"
              multiline numberOfLines={6} textAlignVertical="top"
              style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, minHeight: 120, padding: 0 }} />
          </View>

          {/* Submit */}
          <Pressable onPress={handleUpload} disabled={loading}
            style={[uStyles.submitBtn, { backgroundColor: ACCENT, shadowColor: ACCENT }]}>
            {loading && <ActivityIndicator size="small" color={dark ? "#000000" : "#FFFFFF"} style={{ marginRight: 8 }} />}
            <Text style={{ color: dark ? "#000000" : "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 16 }}>
              {loading ? "Processing..." : "Save Note"}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const uStyles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 20, padding: 20, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: 6 },
  inputRow: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  pickerBtn: {
    flex: 1, borderWidth: 1, borderStyle: "dashed", borderRadius: 14, paddingVertical: 20,
    alignItems: "center", justifyContent: "center",
  },
  fileRow: {
    flexDirection: "row", alignItems: "center", borderRadius: 10,
    padding: 12, marginBottom: 16, borderWidth: 1,
  },
  textArea: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20 },
  submitBtn: {
    paddingVertical: 16, borderRadius: 50, alignItems: "center", justifyContent: "center",
    flexDirection: "row", shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
});
