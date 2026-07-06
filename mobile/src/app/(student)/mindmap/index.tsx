import React, { useState } from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView, Dimensions, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Line } from "react-native-svg";
import { useWamdh } from "../../../context/WamdhContext";

interface MindmapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  parentId?: string;
  expanded?: boolean;
  childrenIds?: string[];
  tempHidden?: boolean;
  desc: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CANVAS_WIDTH = Math.max(SCREEN_WIDTH, 480);

export default function KnowledgeGraphScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t } = useWamdh();
  const PRIMARY = colors.accent;

  // Initialize node layout states
  const [nodes, setNodes] = useState<Record<string, MindmapNode>>({
    "1": { id: "1", label: "Organic Chemistry", desc: "Study of carbon structures.", x: CANVAS_WIDTH / 2, y: 50, expanded: true, childrenIds: ["2", "3", "4"] },
    
    "2": { id: "2", parentId: "1", label: "Alkanes", desc: "Single-bond carbon chains.", x: CANVAS_WIDTH / 6, y: 180, expanded: true, childrenIds: ["5"], tempHidden: false },
    "3": { id: "3", parentId: "1", label: "Alkenes", desc: "Double-bond structures.", x: CANVAS_WIDTH / 2, y: 180, expanded: true, childrenIds: ["6"], tempHidden: false },
    "4": { id: "4", parentId: "1", label: "Alkynes", desc: "Triple-bond chains.", x: (5 * CANVAS_WIDTH) / 6, y: 180, expanded: false, childrenIds: ["7"], tempHidden: false },
    
    "5": { id: "5", parentId: "2", label: "Nomenclature", desc: "Naming via IUPAC rules.", x: CANVAS_WIDTH / 8, y: 310, tempHidden: false },
    "6": { id: "6", parentId: "3", label: "Addition Reactions", desc: "Hydration and halogenation.", x: CANVAS_WIDTH / 2, y: 310, tempHidden: false },
    "7": { id: "7", parentId: "4", label: "Ethyne Gas", desc: "Simplest alkyne compound.", x: (5 * CANVAS_WIDTH) / 6, y: 310, tempHidden: true }
  });

  const [selectedNode, setSelectedNode] = useState<string>("1");

  const toggleNode = (id: string) => {
    const node = nodes[id];
    if (!node.childrenIds || node.childrenIds.length === 0) {
      setSelectedNode(id);
      return;
    }

    const nextExpanded = !node.expanded;
    setSelectedNode(id);

    // Deep update child visibilities
    const updated = { ...nodes };
    updated[id] = { ...node, expanded: nextExpanded };

    const updateChildrenVisibility = (parentIds: string[], hide: boolean) => {
      parentIds.forEach((childId) => {
        const child = updated[childId];
        if (child) {
          updated[childId] = { ...child, tempHidden: hide };
          if (child.childrenIds && child.childrenIds.length > 0) {
            updateChildrenVisibility(child.childrenIds, hide || !child.expanded);
          }
        }
      });
    };

    updateChildrenVisibility(node.childrenIds, !nextExpanded);
    setNodes(updated);
  };

  const handleAiRegenerate = () => {
    Alert.alert("AI Re-Mapping", "Syncing note nodes and rebuilding concept tree mapping...");
  };

  const bg = colors.background;
  const card = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  // Render SVG connecting branches
  const renderLines = () => {
    const lines: React.ReactNode[] = [];
    Object.values(nodes).forEach((node) => {
      if (node.parentId && !node.tempHidden) {
        const parent = nodes[node.parentId];
        if (parent) {
          lines.push(
            <Line
              key={`${parent.id}-${node.id}`}
              x1={parent.x}
              y1={parent.y + 25}
              x2={node.x}
              y2={node.y - 25}
              stroke={dark ? "#404040" : "#C4C4C4"}
              strokeWidth={2}
            />
          );
        }
      }
    });
    return lines;
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: card, borderBottomColor: cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>{t("mindmap") || "Knowledge Graph"}</Text>
        <Pressable onPress={handleAiRegenerate} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="sparkles-outline" size={18} color={PRIMARY} />
        </Pressable>
      </View>

      <ScrollView horizontal contentContainerStyle={{ width: CANVAS_WIDTH }} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ height: 420 }} style={{ flex: 1 }}>
          
          {/* Branch lines svg */}
          <Svg style={StyleSheet.absoluteFill}>
            {renderLines()}
          </Svg>

          {/* Node bubbles */}
          {Object.values(nodes).map((node) => {
            if (node.tempHidden) return null;
            const isSelected = selectedNode === node.id;
            const hasChildren = node.childrenIds && node.childrenIds.length > 0;
            return (
              <Pressable
                key={node.id}
                onPress={() => toggleNode(node.id)}
                style={[
                  styles.nodeBubble,
                  {
                    left: node.x - 70,
                    top: node.y - 22,
                    backgroundColor: isSelected ? PRIMARY : card,
                    borderColor: isSelected ? PRIMARY : (dark ? "#404040" : "#E5E5E5")
                  }
                ]}
              >
                <Text style={{
                  color: isSelected ? "#FFFFFF" : textPrimary,
                  fontFamily: "Sora_700Bold",
                  fontSize: 11,
                  textAlign: "center"
                }}>
                  {node.label}
                </Text>
                {hasChildren && (
                  <Ionicons
                    name={node.expanded ? "chevron-up" : "chevron-down"}
                    size={11}
                    color={isSelected ? "#FFFFFF" : textSecondary}
                    style={{ marginTop: 2 }}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>

      {/* Selected Node Details Drawer */}
      {selectedNode && nodes[selectedNode] && (
        <View style={[styles.detailsCard, { backgroundColor: card, borderTopColor: cardBorder }]}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15 }}>
            {nodes[selectedNode].label}
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4, lineHeight: 18 }}>
            {nodes[selectedNode].desc}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  nodeBubble: {
    position: "absolute",
    width: 140,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  detailsCard: { padding: 18, borderTopWidth: 1, minHeight: 90 }
});
