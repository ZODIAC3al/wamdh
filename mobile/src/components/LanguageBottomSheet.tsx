import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWamdh } from "../context/WamdhContext";

const { height } = Dimensions.get("window");

interface LanguageBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguageBottomSheet({ visible, onClose }: LanguageBottomSheetProps) {
  const { colors, isDark: dark, locale, setLocale, t } = useWamdh();
  const [autoTranslate, setAutoTranslate] = React.useState(true);

  const ACCENT = colors.accent;
  const containerBg = colors.cardBg;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const borderCol = colors.border;
  const isRtl = locale === "ar";

  const changeLanguage = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: containerBg }]}>
          {/* Drag Handle */}
          <View style={[styles.dragHandle, { backgroundColor: borderCol }]} />

          {/* Top Translation Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: "#EBF5FF" }]}>
              <Ionicons name="language-outline" size={32} color="#2563EB" />
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: textPrimary, textAlign: "center" }]}>
            {t("languages")}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: textSecondary, textAlign: "center" }]}>
            {t("automatic_translation_desc")}
          </Text>

          {/* Preferences Section */}
          <View style={[styles.divider, { borderBottomColor: borderCol }]} />

          {/* English Option */}
          <Pressable
            onPress={() => setLocale("en")}
            style={({ pressed }) => [
              styles.listItem,
              pressed && { backgroundColor: dark ? "#252540" : "#F3F4F6" },
              { flexDirection: isRtl ? "row-reverse" : "row" }
            ]}
          >
            <View style={[styles.listItemLeft, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
              <Ionicons name="globe-outline" size={22} color={textPrimary} />
              <Text style={[styles.listItemText, { color: textPrimary, textAlign: isRtl ? "right" : "left", marginLeft: isRtl ? 0 : 12, marginRight: isRtl ? 12 : 0 }]}>
                English
              </Text>
            </View>
            {locale === "en" && (
              <Ionicons name="checkmark" size={20} color="#2563EB" />
            )}
          </Pressable>

          <View style={[styles.divider, { borderBottomColor: borderCol }]} />

          {/* Arabic Option */}
          <Pressable
            onPress={() => setLocale("ar")}
            style={({ pressed }) => [
              styles.listItem,
              pressed && { backgroundColor: dark ? "#252540" : "#F3F4F6" },
              { flexDirection: isRtl ? "row-reverse" : "row" }
            ]}
          >
            <View style={[styles.listItemLeft, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
              <Ionicons name="globe-outline" size={22} color={textPrimary} />
              <Text style={[styles.listItemText, { color: textPrimary, textAlign: isRtl ? "right" : "left", marginLeft: isRtl ? 0 : 12, marginRight: isRtl ? 12 : 0 }]}>
                العربية (Arabic)
              </Text>
            </View>
            {locale === "ar" && (
              <Ionicons name="checkmark" size={20} color="#2563EB" />
            )}
          </Pressable>

          <View style={[styles.divider, { borderBottomColor: borderCol }]} />

          {/* Automatic Translations Switch */}
          <View style={[styles.listItem, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <View style={[styles.listItemLeft, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
              <Ionicons name="sparkles-outline" size={22} color={textPrimary} />
              <Text style={[styles.listItemText, { color: textPrimary, textAlign: isRtl ? "right" : "left", marginLeft: isRtl ? 0 : 12, marginRight: isRtl ? 12 : 0 }]}>
                {t("automatic_translation")}
              </Text>
            </View>
            <Switch
              value={autoTranslate}
              onValueChange={setAutoTranslate}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={autoTranslate ? "#2563EB" : "#F3F4F6"}
            />
          </View>

          <View style={[styles.divider, { borderBottomColor: borderCol }]} />

          {/* Warning / Informational Alert Box */}
          <View style={[styles.alertBox, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <Ionicons name="alert-circle-outline" size={22} color="#2563EB" style={{ marginTop: 2 }} />
            <Text style={[styles.alertText, { textAlign: isRtl ? "right" : "left", marginLeft: isRtl ? 0 : 10, marginRight: isRtl ? 10 : 0 }]}>
              {t("automatic_translation_info")}
            </Text>
          </View>

          {/* Close Button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.8 },
              { backgroundColor: dark ? "#1E3A8A" : "#FFFFFF" }
            ]}
          >
            <Text style={styles.closeButtonText}>{t("close")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 12,
    maxHeight: height * 0.85,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 20,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    marginBottom: 10,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  divider: {
    borderBottomWidth: 1,
  },
  listItem: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  listItemLeft: {
    alignItems: "center",
    flex: 1,
  },
  listItemText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    flex: 1,
  },
  alertBox: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  alertText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#1E40AF",
    flex: 1,
    lineHeight: 18,
  },
  closeButton: {
    borderColor: "#2563EB",
    borderWidth: 1,
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  closeButtonText: {
    color: "#2563EB",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
});
