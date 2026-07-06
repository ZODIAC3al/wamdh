import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, ActivityIndicator, Linking
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

interface Classroom {
  id: string;
  name: string;
  subject: string;
  description: string;
  meeting_link?: string;
  student_ids: number[];
}

export default function InstructorClassroomScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;
  const queryClient = useQueryClient();

  const [newRoomName, setNewRoomName] = useState("");
  const [newSubject, setNewSubject] = useState("Math");
  const [newDesc, setNewDesc] = useState("");
  const [newMeetingLink, setNewMeetingLink] = useState("");

  const { data: classrooms, isLoading } = useQuery<Classroom[]>({
    queryKey: ["instructor-classrooms"],
    queryFn: async () => (await apiClient.get("/api/users/classrooms/")).data
  });

  const createClassroomMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/api/users/classrooms/", {
        name: newRoomName,
        subject: newSubject,
        description: newDesc,
        meeting_link: newMeetingLink
      });
      return res.data;
    },
    onSuccess: () => {
      setNewRoomName("");
      setNewDesc("");
      setNewMeetingLink("");
      queryClient.invalidateQueries({ queryKey: ["instructor-classrooms"] });
      Alert.alert("Success", "Classroom created successfully!");
    }
  });

  const handleJoinMeeting = (url?: string) => {
    if (!url) {
      Alert.alert("No Link", "No video lecture link provided for this classroom.");
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open meeting URL.");
    });
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Classroom Manager</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 20 }}>
        {/* Create Classroom */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Ionicons name="school-outline" size={16} color={ACCENT} />
            <Text style={[styles.cardTitle, { color: textPrimary, marginBottom: 0 }]}>Create Classroom</Text>
          </View>
          
          <TextInput
            value={newRoomName}
            onChangeText={setNewRoomName}
            placeholder="Classroom Name (e.g. Calculus Section A)"
            placeholderTextColor="#6B7280"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
          />
          <TextInput
            value={newSubject}
            onChangeText={setNewSubject}
            placeholder="Subject (e.g. Math)"
            placeholderTextColor="#6B7280"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary, marginTop: 10 }]}
          />
          <TextInput
            value={newDesc}
            onChangeText={setNewDesc}
            placeholder="Short Description"
            placeholderTextColor="#6B7280"
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary, marginTop: 10 }]}
          />
          <TextInput
            value={newMeetingLink}
            onChangeText={setNewMeetingLink}
            placeholder="Meeting URL (Zoom / Meet / Teams)"
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary, marginTop: 10 }]}
          />

          <Pressable
            onPress={() => createClassroomMutation.mutate()}
            disabled={createClassroomMutation.isPending}
            style={[styles.actionBtn, { backgroundColor: ACCENT, marginTop: 14 }]}
          >
            <Text style={styles.actionBtnText}>Create Classroom</Text>
          </Pressable>
        </View>

        {/* Classroom List */}
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Your Classrooms</Text>
        {isLoading ? (
          <ActivityIndicator color={ACCENT} />
        ) : (classrooms || []).length === 0 ? (
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 20 }}>
            No active classrooms. Create one above!
          </Text>
        ) : (
          classrooms?.map((room) => (
            <View key={room.id} style={[styles.roomCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15 }}>{room.name}</Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
                  {room.subject} · {room.student_ids?.length || 0} students enrolled
                </Text>
                {room.description ? (
                  <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4, fontStyle: "italic" }}>
                    "{room.description}"
                  </Text>
                ) : null}

                {room.meeting_link ? (
                  <Pressable
                    onPress={() => handleJoinMeeting(room.meeting_link)}
                    style={[styles.joinBtn, { backgroundColor: colors.success + "15", borderColor: colors.success }]}
                  >
                    <Ionicons name="videocam-outline" size={13} color={colors.success} />
                    <Text style={{ color: colors.success, fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: 4 }}>
                      Join Live Lecture
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                onPress={() => Alert.alert("Classroom Details", `Enrollment Code: ${room.id}`)}
                style={[styles.iconBtn, { backgroundColor: ACCENT + "15" }]}
              >
                <Ionicons name="key-outline" size={16} color={ACCENT} />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 14 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14 },
  actionBtn: { height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 24, marginBottom: 12 },
  roomCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10
  },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  joinBtn: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, marginTop: 8
  }
});
