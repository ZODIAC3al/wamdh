import React, { useState } from "react";
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Modal, Dimensions
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

interface MindMapNode {
  id: string;
  label: string;
  text: string;
  chunk_index: number;
}

interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CANVAS_SIZE = SCREEN_WIDTH * 0.9;
const CENTER_X = CANVAS_SIZE / 2;
const CENTER_Y = CANVAS_SIZE / 2;

export default function NotesMindMapScreen() {
  const router = useRouter();
  const { noteId } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const inputBg = colors.inputBg;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);

  const { data: note } = useQuery<any>({
    queryKey: ["note", noteId],
    queryFn: async () => (await apiClient.get(`/api/notes/${noteId}/`)).data,
    enabled: !!noteId,
  });

  const { data: graph, isLoading } = useQuery<MindMapData>({
    queryKey: ["note-mindmap", noteId],
    queryFn: async () => (await apiClient.get(`/api/notes/${noteId}/mindmap/`)).data,
    enabled: !!noteId,
  });

  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];

  // Calculate coordinates for nodes dynamically in a circular pattern
  const radius = CANVAS_SIZE * 0.35;
  const nodePositions = nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / (nodes.length || 1);
    const x = CENTER_X + radius * Math.cos(angle) - 30; // 30 is half of node width
    const y = CENTER_Y + radius * Math.sin(angle) - 30; // 30 is half of node height
    return { ...node, x, y };
  });

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
            <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={20} color={textPrimary} />
          </Pressable>
          <View style={{ marginHorizontal: 12, alignItems: isRtl ? "flex-end" : "flex-start" }}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 17 }}>
              {isRtl ? "خريطة المفاهيم الذكية" : "AI Concept Map"}
            </Text>
            {note && (
              <Text style={{ color: ACCENT, fontFamily: "Inter_500Medium", fontSize: 11 }} numberOfLines={1}>
                {note.title}
              </Text>
            )}
          </View>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: "/(student)/ai/chat", params: { noteId } })}
          style={[styles.backBtn, { backgroundColor: "#BE1A1A" }]}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 12 }}>
            {isRtl ? "تحليل الروابط وإنشاء الخريطة..." : "Generating dynamic concept mind map..."}
          </Text>
        </View>
      ) : nodes.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Ionicons name="git-network-outline" size={48} color={textSecondary} />
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginTop: 16, textAlign: "center" }}>
            {isRtl ? "لا توجد خريطة مفاهيم متوفرة" : "No Mind Map Available"}
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 6, textAlign: "center" }}>
            {isRtl 
              ? "تأكد من معالجة الملاحظة وتقسيمها إلى أجزاء لتتمكن من رؤية خريطة المفاهيم." 
              : "This note has no processed text chunks yet to visualize."}
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* Legend / Info */}
          <View style={{ padding: 16, alignItems: "center" }}>
            <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" }}>
              {isRtl 
                ? "توضح هذه الخريطة المفاهيم المستنتجة من الملاحظة والعلاقات المتبادلة بينها. اضغط على أي عقدة لقراءة تفاصيل المفهوم."
                : "This graph represents semantic concept chunks. Tap any node to read the underlying text chunk details."}
            </Text>
          </View>

          {/* Interactive Graph Canvas */}
          <View style={[styles.canvas, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            
            {/* Center Main Note Node */}
            <View style={[styles.centerNode, { left: CENTER_X - 40, top: CENTER_Y - 40, backgroundColor: ACCENT }]}>
              <Ionicons name="document-text" size={24} color={dark ? "#000" : "#fff"} />
              <Text style={[styles.centerNodeLabel, { color: dark ? "#000" : "#fff" }]} numberOfLines={1}>
                {isRtl ? "المحاضرة" : "Note"}
              </Text>
            </View>

            {/* Render Nodes */}
            {nodePositions.map((pos) => (
              <Pressable
                key={pos.id}
                onPress={() => setSelectedNode(pos)}
                style={[styles.node, { left: pos.x, top: pos.y, backgroundColor: dark ? "#252549" : "#EBF4FF", borderColor: ACCENT }]}
              >
                <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 12 }}>
                  #{pos.chunk_index + 1}
                </Text>
                <Text style={{ color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 9, marginTop: 2, textAlign: "center" }} numberOfLines={2}>
                  {pos.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Relationship Cards */}
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginBottom: 12, textAlign: isRtl ? "right" : "left" }}>
              {isRtl ? "العلاقات المترابطة" : "Discovered Relations"}
            </Text>

            {edges.length === 0 ? (
              <View style={[styles.relationCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" }}>
                  {isRtl ? "لم يتم العثور على علاقات مباشرة عالية الدلالة." : "No strongly correlated semantic bridges found."}
                </Text>
              </View>
            ) : (
              edges.map((edge, i) => (
                <View key={i} style={[styles.relationCard, { backgroundColor: cardBg, borderColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
                  <Ionicons name="link-outline" size={20} color={ACCENT} style={{ marginRight: isRtl ? 0 : 12, marginLeft: isRtl ? 12 : 0 }} />
                  <View style={{ flex: 1, alignItems: isRtl ? "flex-end" : "flex-start" }}>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                      {isRtl 
                        ? `المفهوم #${edge.source.replace("chunk_", "")} يرتبط بـ المفهوم #${edge.target.replace("chunk_", "")}`
                        : `Concept #${parseInt(edge.source.replace("chunk_", ""))+1} bridges with Concept #${parseInt(edge.target.replace("chunk_", ""))+1}`}
                    </Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                      {isRtl ? `درجة الارتباط الدلالي: ${edge.weight}` : `Semantic cosine score: ${edge.weight}`}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

        </ScrollView>
      )}

      {/* Node Concept Detail Modal */}
      <Modal
        visible={!!selectedNode}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedNode(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: bg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18 }}>
                {isRtl ? `محتوى المفهوم #${(selectedNode?.chunk_index || 0) + 1}` : `Concept Content #${(selectedNode?.chunk_index || 0) + 1}`}
              </Text>
              <Pressable onPress={() => setSelectedNode(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 250, marginBottom: 20 }}>
              <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, textAlign: isRtl ? "right" : "left" }}>
                {selectedNode?.text}
              </Text>
            </ScrollView>

            <Pressable
              onPress={() => setSelectedNode(null)}
              style={{ backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: dark ? "#000" : "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>
                {isRtl ? "إغلاق" : "Close"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  canvas: {
    width: CANVAS_SIZE, height: CANVAS_SIZE, borderRadius: 24, alignSelf: "center",
    position: "relative", borderWidth: 1, overflow: "hidden", marginTop: 10,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 12, elevation: 2
  },
  centerNode: {
    width: 80, height: 80, borderRadius: 40, position: "absolute",
    alignItems: "center", justifyContent: "center", shadowOpacity: 0.2, elevation: 4
  },
  centerNodeLabel: { fontFamily: "Sora_700Bold", fontSize: 11, marginTop: 4 },
  node: {
    width: 60, height: 60, borderRadius: 30, position: "absolute",
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 3
  },
  relationCard: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 10,
    flexDirection: "row", alignItems: "center"
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1 }
});
