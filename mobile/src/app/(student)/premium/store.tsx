import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, Alert, Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";
import { useToastStore } from "../../../store/toastStore";

const GOLD = "#F7D87F";

import { useStripeHook as useStripe } from "../../../hooks/useStripeHook";

export default function MarketplaceStoreScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark: dark, t, isRtl, setAccentColor, accentColor } = useWamdh();
  
  const ACCENT = colors.accent;
  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const [activeTab, setActiveTab] = useState<"xp" | "custom" | "ai" | "addons">("xp");
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const toast = useToastStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Fetch Store Catalog & User Inventory
  const { data: storeData, isLoading } = useQuery<any>({
    queryKey: ["store-catalog"],
    queryFn: async () => (await apiClient.get("/api/payments/store/catalog/")).data,
  });

  // Mutator for XP Purchases
  const xpBuyMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await apiClient.post("/api/payments/store/buy-xp/", { item_id: itemId });
      return res.data;
    },
    onSuccess: (data) => {
      // Trigger Toast
      toast.show({
        type: "success",
        text1: "🎉 Purchase Complete!",
        text2: data.message || "Your item has been unlocked."
      });

      setSuccessMessage(data.message || "Your XP purchase was successful!");
      setShowSuccessModal(true);

      queryClient.invalidateQueries({ queryKey: ["store-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: any) => {
      Alert.alert("XP Purchase Failed", err?.response?.data?.error || "You do not have enough XP points.");
    },
    onSettled: () => setBuyingItemId(null),
  });

  // Mutator for Cash Purchases
  const cashBuyMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // 1. Create intent
      const intentRes = await apiClient.post("/api/payments/store/create-intent/", { item_id: itemId });
      const { demo, payment_intent_id, client_secret, amount, item } = intentRes.data;

      if (demo) {
        return new Promise((resolve, reject) => {
          Alert.alert(
            "Demo Shop Checkout",
            `Simulate buying ${item.name} for $${amount}?`,
            [
              { text: "Cancel", style: "cancel", onPress: () => reject(new Error("Cancelled")) },
              {
                text: "Complete Purchase",
                onPress: async () => {
                  try {
                    const confirmRes = await apiClient.post("/api/payments/store/confirm/", {
                      item_id: itemId,
                      payment_intent_id,
                    });
                    resolve(confirmRes.data);
                  } catch (e) {
                    reject(e);
                  }
                },
              },
            ]
          );
        });
      } else {
        // Initialize payment sheet
        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: "Wamdh",
          paymentIntentClientSecret: client_secret,
        });

        if (initError) {
          throw new Error(initError.message);
        }

        // Present payment sheet
        const { error: presentError } = await presentPaymentSheet();
        if (presentError) {
          throw new Error(presentError.message);
        }

        // Confirm on backend
        const confirmRes = await apiClient.post("/api/payments/store/confirm/", {
          item_id: itemId,
          payment_intent_id,
        });
        return confirmRes.data;
      }
    },
    onSuccess: (data: any) => {
      // Trigger Toast
      toast.show({
        type: "success",
        text1: "🎉 Item Unlocked!",
        text2: data.message || "Your purchase has been verified."
      });

      setSuccessMessage(data.message || "Your payment checkout was successful!");
      setShowSuccessModal(true);

      queryClient.invalidateQueries({ queryKey: ["store-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: any) => {
      if (err.message !== "Cancelled") {
        Alert.alert("Checkout Failed", err?.message || err?.response?.data?.error || "Payment was not completed.");
      }
    },
    onSettled: () => setBuyingItemId(null),
  });

  const handleBuyXp = (item: any) => {
    setBuyingItemId(item.id);
    Alert.alert(
      "Confirm XP Purchase",
      `Would you like to buy ${item.name} for ${item.price_xp} XP?\n\nYour XP Wallet: ${storeData?.user_xp || 0} XP`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setBuyingItemId(null) },
        { text: "Confirm Buy", onPress: () => xpBuyMutation.mutate(item.id) },
      ]
    );
  };

  const handleBuyCash = (item: any) => {
    setBuyingItemId(item.id);
    cashBuyMutation.mutate(item.id);
  };

  const handleApplyTheme = (themeId: string) => {
    let colorHex: string | null = null;
    if (themeId === "theme_cyber_neon") colorHex = "#FF007F";
    else if (themeId === "theme_sora_light") colorHex = "#FF6B35";
    else if (themeId === "theme_dark_material") colorHex = "#000000";

    setAccentColor(colorHex);
    Alert.alert("Theme Set", "Accent colors have been dynamically applied across the system!");
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  const catalog = storeData?.catalog || {};
  const ownedNonConsumables = storeData?.owned_non_consumables || [];
  const ownedConsumables = storeData?.owned_consumables || {};
  const activeSubs = storeData?.active_subscriptions || [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
          <Ionicons name={isRtl ? "arrow-forward" : "chevron-back"} size={22} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary, fontFamily: "Sora_700Bold" }]}>
          {isRtl ? "سوق ومضة الذهبي" : "Wamdh Marketplace"}
        </Text>
      </View>

      {/* XP Wallet & Coin Stats */}
      <View style={[styles.walletCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={[styles.coinCircle, { backgroundColor: GOLD + "20" }]}>
            <Ionicons name="sparkles" size={24} color={GOLD} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: textSecondary, fontSize: 12 }}>{isRtl ? "رصيد النقاط (XP)" : "XP Wallet Balance"}</Text>
            <Text style={{ color: GOLD, fontFamily: "Sora_700Bold", fontSize: 24 }}>
              {storeData?.user_xp || 0} XP
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => setActiveTab("xp")}
          style={[styles.tabButton, activeTab === "xp" && { borderBottomColor: ACCENT }]}
        >
          <Text style={[styles.tabText, { color: activeTab === "xp" ? ACCENT : textSecondary }]}>Power-ups</Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("custom")}
          style={[styles.tabButton, activeTab === "custom" && { borderBottomColor: ACCENT }]}
        >
          <Text style={[styles.tabText, { color: activeTab === "custom" ? ACCENT : textSecondary }]}>Themes/Notes</Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("ai")}
          style={[styles.tabButton, activeTab === "ai" && { borderBottomColor: ACCENT }]}
        >
          <Text style={[styles.tabText, { color: activeTab === "ai" ? ACCENT : textSecondary }]}>AI Styles</Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("addons")}
          style={[styles.tabButton, activeTab === "addons" && { borderBottomColor: ACCENT }]}
        >
          <Text style={[styles.tabText, { color: activeTab === "addons" ? ACCENT : textSecondary }]}>Add-ons</Text>
        </Pressable>
      </View>

      {/* Item List Display */}
      <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
        
        {/* TAB 1: XP Consumables */}
        {activeTab === "xp" && catalog.consumables?.map((item: any) => {
          const qty = ownedConsumables[item.id] || 0;
          const isBuying = buyingItemId === item.id;
          return (
            <View key={item.id} style={[styles.itemRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15 }}>{item.name}</Text>
                <Text style={{ color: textSecondary, fontSize: 12, marginTop: 4 }}>{item.desc}</Text>
                {qty > 0 && (
                  <View style={[styles.badge, { backgroundColor: ACCENT + "15" }]}>
                    <Text style={{ color: ACCENT, fontSize: 11, fontWeight: "bold" }}>In Inventory: {qty}</Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={() => handleBuyXp(item)}
                disabled={isBuying}
                style={[styles.buyBtn, { backgroundColor: GOLD }]}
              >
                {isBuying ? (
                  <ActivityIndicator size="small" color="#1E1E1E" />
                ) : (
                  <Text style={styles.buyBtnText}>{item.price_xp} XP</Text>
                )}
              </Pressable>
            </View>
          );
        })}

        {/* TAB 2: Themes & Customizations */}
        {activeTab === "custom" && (
          <View>
            <Text style={{ color: textSecondary, fontSize: 12, fontWeight: "bold", marginBottom: 8 }}>PREMIUM COLOR THEMES</Text>
            {catalog.themes?.map((item: any) => {
              const owned = ownedNonConsumables.includes(item.id);
              const isBuying = buyingItemId === item.id;
              
              // Define active highlight check
              let hexActive = null;
              if (item.id === "theme_cyber_neon") hexActive = "#FF007F";
              else if (item.id === "theme_sora_light") hexActive = "#FF6B35";
              else if (item.id === "theme_dark_material") hexActive = "#000000";
              const isApplied = accentColor === hexActive;

              return (
                <View key={item.id} style={[styles.itemRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15 }}>{item.name}</Text>
                    <Text style={{ color: textSecondary, fontSize: 12, marginTop: 4 }}>{item.desc}</Text>
                  </View>
                  {owned ? (
                    <Pressable
                      onPress={() => handleApplyTheme(item.id)}
                      style={[styles.actionBtn, { backgroundColor: isApplied ? "#10B981" : ACCENT }]}
                    >
                      <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 12 }}>
                        {isApplied ? "Applied" : "Apply"}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => handleBuyCash(item)}
                      disabled={isBuying}
                      style={[styles.buyBtn, { backgroundColor: "#BE1A1A" }]}
                    >
                      {isBuying ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={[styles.buyBtnText, { color: "#FFFFFF" }]}>${item.price}</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              );
            })}

            <Text style={{ color: textSecondary, fontSize: 12, fontWeight: "bold", marginTop: 16, marginBottom: 8 }}>SUBJECT NOTE TEMPLATES</Text>
            {catalog.templates?.map((item: any) => {
              const owned = ownedNonConsumables.includes(item.id);
              const isBuying = buyingItemId === item.id;
              return (
                <View key={item.id} style={[styles.itemRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15 }}>{item.name}</Text>
                    <Text style={{ color: textSecondary, fontSize: 12, marginTop: 4 }}>{item.desc}</Text>
                  </View>
                  {owned ? (
                    <View style={[styles.ownedBadge, { backgroundColor: "#10B98120" }]}>
                      <Text style={{ color: "#10B981", fontWeight: "bold", fontSize: 12 }}>Unlocked</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => handleBuyCash(item)}
                      disabled={isBuying}
                      style={[styles.buyBtn, { backgroundColor: "#BE1A1A" }]}
                    >
                      {isBuying ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={[styles.buyBtnText, { color: "#FFFFFF" }]}>${item.price}</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 3: AI Tutor Personalities */}
        {activeTab === "ai" && catalog.personalities?.map((item: any) => {
          const owned = ownedNonConsumables.includes(item.id);
          const isBuying = buyingItemId === item.id;
          return (
            <View key={item.id} style={[styles.itemRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15 }}>{item.name}</Text>
                <Text style={{ color: textSecondary, fontSize: 12, marginTop: 4 }}>{item.desc}</Text>
              </View>
              {owned ? (
                <View style={[styles.ownedBadge, { backgroundColor: "#10B98120" }]}>
                  <Text style={{ color: "#10B981", fontWeight: "bold", fontSize: 12 }}>Unlocked</Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => handleBuyCash(item)}
                  disabled={isBuying}
                  style={[styles.buyBtn, { backgroundColor: "#BE1A1A" }]}
                >
                  {isBuying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.buyBtnText, { color: "#FFFFFF" }]}>${item.price}</Text>
                  )}
                </Pressable>
              )}
            </View>
          );
        })}

        {/* TAB 4: Subscription Add-ons */}
        {activeTab === "addons" && catalog.addons?.map((item: any) => {
          const isActive = activeSubs.includes(item.id);
          const isBuying = buyingItemId === item.id;
          return (
            <View key={item.id} style={[styles.itemRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15 }}>{item.name}</Text>
                <Text style={{ color: textSecondary, fontSize: 12, marginTop: 4 }}>{item.desc}</Text>
              </View>
              {isActive ? (
                <View style={[styles.ownedBadge, { backgroundColor: "#10B98120" }]}>
                  <Text style={{ color: "#10B981", fontWeight: "bold", fontSize: 12 }}>Active Add-on</Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => handleBuyCash(item)}
                  disabled={isBuying}
                  style={[styles.buyBtn, { backgroundColor: "#BE1A1A" }]}
                >
                  {isBuying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.buyBtnText, { color: "#FFFFFF" }]}>${item.price}/mo</Text>
                  )}
                </Pressable>
              )}
            </View>
          );
        })}

      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ width: "100%", maxWidth: 340, backgroundColor: cardBg, borderRadius: 24, borderWidth: 1.5, borderColor: GOLD, padding: 24, alignItems: "center" }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: GOLD + "20", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Ionicons name="gift" size={40} color={GOLD} />
            </View>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20, textAlign: "center", marginBottom: 8 }}>
              🎉 Item Unlocked!
            </Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center", marginBottom: 20, lineHeight: 18 }}>
              {successMessage || "Your item has been successfully purchased and unlocked."}
            </Text>
            <Pressable
              onPress={() => setShowSuccessModal(false)}
              style={{ width: "100%", paddingVertical: 14, borderRadius: 30, backgroundColor: GOLD, alignItems: "center" }}
            >
              <Text style={{ color: "#1E1E1E", fontFamily: "Inter_700Bold", fontSize: 15 }}>
                Done 🚀
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, flexDirection: "row", alignItems: "center" },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, marginLeft: 14, flex: 1 },
  walletCard: { marginHorizontal: 20, marginTop: 16, padding: 18, borderRadius: 16, borderWidth: 1 },
  coinCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  tabContainer: { flexDirection: "row", marginTop: 20, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontSize: 13, fontWeight: "bold" },
  itemRow: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  buyBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  buyBtnText: { color: "#1E1E1E", fontWeight: "bold", fontSize: 13 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  ownedBadge: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  badge: { alignSelf: "flex-start", paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, marginTop: 6 },
});
