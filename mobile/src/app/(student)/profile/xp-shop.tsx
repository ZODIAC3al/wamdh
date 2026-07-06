import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Alert, StyleSheet
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

interface ShopItem {
  id: string;
  name: string;
  arabic_name: string;
  price: number;
  category: string;
  desc: string;
  arabic_desc: string;
  unlocked: boolean;
}

interface ShopData {
  xp_balance: number;
  items: ShopItem[];
}

export default function XpShopScreen() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl, refreshUser } = useWamdh();
  const ACCENT = colors.accent;
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const inputBg = colors.inputBg;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const { data, isLoading, refetch } = useQuery<ShopData>({
    queryKey: ["xp-shop-data"],
    queryFn: async () => (await apiClient.get("/api/analytics/xp-shop/")).data,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await apiClient.post("/api/analytics/xp-shop/", { item_id: itemId });
      return res.data;
    },
    onSuccess: (res) => {
      Alert.alert(
        isRtl ? "نجاح الشراء!" : "Purchase Successful!",
        isRtl ? "لقد قمت بفتح هذا العنصر بنجاح." : "You have successfully unlocked this item."
      );
      // Invalidate shop data & refresh parent user cache to update stats globally
      queryClient.invalidateQueries({ queryKey: ["xp-shop-data"] });
      refreshUser();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || (isRtl ? "حدث خطأ ما." : "Failed to complete purchase.");
      Alert.alert(isRtl ? "عذراً" : "Error", msg);
    }
  });

  const handlePurchase = (item: ShopItem) => {
    if (item.unlocked && item.id !== "streak_freeze") return;
    
    Alert.alert(
      isRtl ? "تأكيد الشراء" : "Confirm Purchase",
      isRtl 
        ? `هل تريد استبدال ${item.price} نقطة بـ ${item.arabic_name}؟`
        : `Do you want to redeem ${item.price} XP for ${item.name}?`,
      [
        { text: isRtl ? "إلغاء" : "Cancel", style: "cancel" },
        { text: isRtl ? "شراء" : "Redeem", onPress: () => purchaseMutation.mutate(item.id) }
      ]
    );
  };

  const filteredItems = (data?.items || []).filter(item => {
    if (activeCategory === "all") return true;
    return item.category === activeCategory;
  });

  const categories = [
    { id: "all", label: isRtl ? "الكل" : "All" },
    { id: "personality", label: isRtl ? "شخصيات الذكاء الاصطناعي" : "AI Personalities" },
    { id: "theme", label: isRtl ? "المظاهر" : "Themes" },
    { id: "token", label: isRtl ? "رموز" : "Tokens" }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
            <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={20} color={textPrimary} />
          </Pressable>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20, marginLeft: isRtl ? 0 : 12, marginRight: isRtl ? 12 : 0 }}>
            {isRtl ? "متجر النقاط (XP)" : "XP Reward Shop"}
          </Text>
        </View>
        <View style={[styles.xpPill, { backgroundColor: ACCENT + "15", flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <Ionicons name="star" size={14} color={colors.accent} />
          <Text style={{ color: ACCENT, fontFamily: "Sora_700Bold", fontSize: 13, marginHorizontal: 4 }}>
            {data?.xp_balance ?? requestUserXpFallback(t) ?? 0} {isRtl ? "نقطة" : "XP"}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 12 }}>
            {isRtl ? "تحميل العناصر والأسعار..." : "Loading items..."}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Category Tabs */}
          <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: cardBorder }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setActiveCategory(cat.id)}
                    style={[styles.categoryTab, { backgroundColor: isActive ? ACCENT : cardBg, borderColor: isActive ? ACCENT : cardBorder }]}
                  >
                    <Text style={{ color: isActive ? (dark ? "#000" : "#fff") : textSecondary, fontFamily: "Inter_700Bold", fontSize: 12 }}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Shop Items List */}
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {filteredItems.map((item) => (
              <View key={item.id} style={[styles.shopCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <View style={{ flex: 1, alignItems: isRtl ? "flex-end" : "flex-start" }}>
                    <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>
                      {isRtl ? item.arabic_name : item.name}
                    </Text>
                    <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 6, textAlign: isRtl ? "right" : "left", lineHeight: 18 }}>
                      {isRtl ? item.arabic_desc : item.desc}
                    </Text>
                  </View>
                  <View style={[styles.priceTag, { backgroundColor: ACCENT + "15", flexDirection: isRtl ? "row-reverse" : "row" }]}>
                    <Ionicons name="star" size={12} color={ACCENT} style={{ marginRight: isRtl ? 0 : 3, marginLeft: isRtl ? 3 : 0 }} />
                    <Text style={{ color: ACCENT, fontFamily: "Sora_700Bold", fontSize: 12 }}>{item.price}</Text>
                  </View>
                </View>

                {/* Purchase Button */}
                <Pressable
                  onPress={() => handlePurchase(item)}
                  disabled={item.unlocked && item.id !== "streak_freeze"}
                  style={[
                    styles.buyBtn,
                    {
                      backgroundColor: item.unlocked && item.id !== "streak_freeze" 
                        ? (dark ? "#252540" : "#F3F4F6")
                        : (data && data.xp_balance < item.price ? (dark ? "#374151" : "#D1D5DB") : ACCENT)
                    }
                  ]}
                >
                  {purchaseMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{
                      color: item.unlocked && item.id !== "streak_freeze"
                        ? textSecondary
                        : (dark ? "#000" : "#fff"),
                      fontFamily: "Inter_700Bold",
                      fontSize: 13
                    }}>
                      {item.unlocked && item.id !== "streak_freeze"
                        ? (isRtl ? "مفتوح / مقتنى" : "Owned")
                        : (isRtl ? "شراء واستبدال" : "Purchase & Unlock")}
                    </Text>
                  )}
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// Simple fallback helper to resolve active user points
function requestUserXpFallback(t: any) {
  return 0;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  xpPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  categoryTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  shopCard: { borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  priceTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  buyBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center", marginTop: 8 }
});
