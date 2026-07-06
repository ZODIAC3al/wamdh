import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, Alert, Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useAuthStore } from "../../../store/authStore";
import { useWamdh } from "../../../context/WamdhContext";
import { useToastStore } from "../../../store/toastStore";
import { queryClient } from "../../../lib/queryClient";

const GOLD = "#F7D87F";

const PLANS = [
  {
    key: "monthly",
    label: "Monthly",
    price: "$9.99",
    sub: "per month",
    popular: false,
    savings: "",
  },
  {
    key: "yearly",
    label: "Yearly",
    price: "$59.99",
    sub: "per year",
    popular: true,
    savings: "Save 50%",
  },
  {
    key: "lifetime",
    label: "Lifetime",
    price: "$149.99",
    sub: "one-time",
    popular: false,
    savings: "Best value",
  },
];

const FREE_FEATURES = [
  { icon: "document-text", label: "10 AI summaries / month", ok: true },
  { icon: "cloud-upload", label: "5 note uploads", ok: true },
  { icon: "checkbox", label: "Basic quiz generation", ok: true },
  { icon: "chatbubbles", label: "Community chat", ok: true },
  { icon: "albums", label: "Unlimited flashcards", ok: false },
  { icon: "trending-up", label: "Advanced analytics", ok: false },
  { icon: "download", label: "Offline access", ok: false },
];

const PREMIUM_FEATURES = [
  "Unlimited AI summaries & key points",
  "Unlimited note uploads + OCR",
  "Advanced quiz & flashcard generation",
  "Priority AI responses (faster)",
  "Study groups with classmates",
  "Vocabulary builder",
  "Weekly performance PDF reports",
  "Full offline access",
  "Remove all limits forever",
];

import { useStripeHook as useStripe } from "../../../hooks/useStripeHook";

export default function PremiumScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const toast = useToastStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const { data: status, refetch } = useQuery<any>({
    queryKey: ["premium-status"],
    queryFn: async () => (await apiClient.get("/api/payments/status/")).data,
  });

  const isPremium = status?.is_premium;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const intentRes = await apiClient.post("/api/payments/create-intent/", { plan: selectedPlan });
      const { demo, payment_intent_id, client_secret, amount, plan } = intentRes.data;

      if (demo) {
        Alert.alert(
          "Demo Payment",
          `This is a demo. In production, you would be charged ${amount} for ${plan.label}.\n\nSimulating successful payment...`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Simulate Success",
              onPress: async () => {
                const confirmRes = await apiClient.post("/api/payments/confirm/", {
                  plan: selectedPlan,
                  payment_intent_id,
                });
                
                // Show success toast
                toast.show({
                  type: "success",
                  text1: "🎉 Welcome to Premium!",
                  text2: confirmRes.data.message || "Your premium access is now fully active."
                });

                setSuccessMessage(confirmRes.data.message || "Your premium access is now active!");
                setShowSuccessModal(true);
                
                // Immediate query invalidation for instant access
                refetch();
                queryClient.invalidateQueries({ queryKey: ["profile"] });
              },
            },
          ]
        );
      } else {
        // Initialize payment sheet
        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: "Wamdh",
          paymentIntentClientSecret: client_secret,
        });

        if (initError) {
          Alert.alert("Stripe Error", initError.message);
          setLoading(false);
          return;
        }

        // Present payment sheet
        const { error: presentError } = await presentPaymentSheet();
        if (presentError) {
          Alert.alert("Payment Cancelled", presentError.message);
          setLoading(false);
          return;
        }

        const confirmRes = await apiClient.post("/api/payments/confirm/", {
          plan: selectedPlan,
          payment_intent_id,
        });

        // Show success toast
        toast.show({
          type: "success",
          text1: "🎉 Welcome to Premium!",
          text2: confirmRes.data.message || "Your premium access is now active."
        });

        setSuccessMessage(confirmRes.data.message || "Your premium access is now active!");
        setShowSuccessModal(true);

        // Immediate query invalidation for instant access
        refetch();
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (e: any) {
      Alert.alert("Payment Error", e?.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name="close" size={22} color={textSecondary} />
        </Pressable>
      </View>

      {/* Hero / Premium status card */}
      {isPremium ? (
        <View style={{ marginHorizontal: 20, marginTop: 24, padding: 24, borderRadius: 20, backgroundColor: cardBg, borderColor: GOLD, borderWidth: 1.5, alignItems: "center" }}>
          <View style={[styles.heroIcon, { backgroundColor: GOLD + "20" }]}>
            <Ionicons name="diamond" size={48} color={GOLD} />
          </View>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 24, textAlign: "center", marginTop: 16 }}>
            You're Premium! ✨
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
            {status?.premium_until ? `Active until ${new Date(status.premium_until).toLocaleDateString()}` : "Lifetime access"}
          </Text>
          
          <Pressable
            onPress={() => router.push("/(student)/premium/store")}
            style={[styles.cta, { backgroundColor: GOLD, marginTop: 18, width: "100%" }]}
          >
            <Ionicons name="cart" size={20} color="#1E1E1E" style={{ marginRight: 8 }} />
            <Text style={{ color: "#1E1E1E", fontFamily: "Inter_700Bold", fontSize: 15 }}>
              Enter Marketplace Store 🏪
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
          <View style={[styles.heroIcon, { backgroundColor: GOLD + "20" }]}>
            <Ionicons name="diamond" size={48} color={GOLD} />
          </View>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 28, textAlign: "center", marginTop: 16 }}>
            Unlock وَمْض Premium
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
            Supercharge your learning with AI-powered tools,{"\n"}unlimited access, and premium features.
          </Text>
          
          <Pressable
            onPress={() => router.push("/(student)/premium/store")}
            style={[styles.cta, { backgroundColor: GOLD, marginTop: 20, width: "90%" }]}
          >
            <Ionicons name="cart" size={20} color="#1E1E1E" style={{ marginRight: 8 }} />
            <Text style={{ color: "#1E1E1E", fontFamily: "Inter_700Bold", fontSize: 15 }}>
              Marketplace: Themes & Power-ups 🏪
            </Text>
          </Pressable>
        </View>
      )}

      {/* Plan Selector */}
      {!isPremium && (
        <View style={{ paddingHorizontal: 20, marginBottom: 20, marginTop: 20 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {PLANS.map(plan => (
              <Pressable
                key={plan.key}
                onPress={() => setSelectedPlan(plan.key)}
                style={[
                  styles.planCard,
                  { backgroundColor: cardBg, borderColor: selectedPlan === plan.key ? ACCENT : cardBorder },
                  selectedPlan === plan.key && { borderWidth: 2 },
                ]}
              >
                {plan.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: "#BE1A1A" }]}>
                    <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 9 }}>POPULAR</Text>
                  </View>
                )}
                {plan.savings ? (
                  <View style={[styles.savingsBadge, { backgroundColor: GOLD + "20" }]}>
                    <Text style={{ color: GOLD, fontFamily: "Inter_700Bold", fontSize: 9 }}>{plan.savings}</Text>
                  </View>
                ) : null}
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22, marginTop: plan.popular ? 10 : 4 }}>
                  {plan.price}
                </Text>
                <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>
                  {plan.sub}
                </Text>
                <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 8 }}>
                  {plan.label}
                </Text>
                {selectedPlan === plan.key && (
                  <View style={[styles.checkMark, { backgroundColor: "#BE1A1A" }]}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Premium Features */}
      {!isPremium && (
        <View style={[styles.featuresCard, { backgroundColor: cardBg, borderColor: cardBorder, marginHorizontal: 20 }]}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginBottom: 14 }}>
            Everything in Premium ✨
          </Text>
          {PREMIUM_FEATURES.map((feat, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureCheck, { backgroundColor: "#10B98120" }]}>
                <Ionicons name="checkmark" size={14} color="#10B981" />
              </View>
              <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 }}>
                {feat}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Free vs Premium Comparison */}
      {!isPremium && (
        <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 24 }}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16, marginBottom: 12 }}>
            Free vs Premium
          </Text>
          {FREE_FEATURES.map((feat, i) => (
            <View key={i} style={[styles.compareRow, { borderBottomColor: cardBorder }]}>
              <Ionicons name={feat.icon as any} size={16} color={textSecondary} />
              <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, marginLeft: 10 }}>
                {feat.label}
              </Text>
              <Ionicons
                name={feat.ok ? "checkmark-circle" : "close-circle"}
                size={18}
                color={feat.ok ? "#10B981" : "#9CA3AF"}
              />
              <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginLeft: 16 }} />
            </View>
          ))}
        </View>
      )}

      {/* CTA */}
      {!isPremium && (
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable
            onPress={handleSubscribe}
            style={[styles.cta, { backgroundColor: "#BE1A1A" }]}
          >
            <Ionicons name="diamond-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 16 }}>
              Get Premium — {PLANS.find(p => p.key === selectedPlan)?.price}
            </Text>
          </Pressable>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center", marginTop: 10 }}>
            Cancel anytime. Secure payment via Stripe.
          </Text>
        </View>
      )}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowSuccessModal(false); router.back(); }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ width: "100%", maxWidth: 340, backgroundColor: cardBg, borderRadius: 24, borderWidth: 1.5, borderColor: GOLD, padding: 24, alignItems: "center" }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: GOLD + "20", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Ionicons name="ribbon" size={40} color={GOLD} />
            </View>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 20, textAlign: "center", marginBottom: 8 }}>
              🎉 VIP Active!
            </Text>
            <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center", marginBottom: 20, lineHeight: 18 }}>
              {successMessage || "Thank you for upgrading! Your premium access is now fully active."}
            </Text>
            <Pressable
              onPress={() => { setShowSuccessModal(false); router.back(); }}
              style={{ width: "100%", paddingVertical: 14, borderRadius: 30, backgroundColor: GOLD, alignItems: "center" }}
            >
              <Text style={{ color: "#1E1E1E", fontFamily: "Inter_700Bold", fontSize: 15 }}>
                Enter Portal 🚀
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  heroIcon: { width: 90, height: 90, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  planCard: {
    flex: 1, borderRadius: 16, padding: 14, borderWidth: 1,
    alignItems: "center", position: "relative", overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  popularBadge: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingVertical: 4, alignItems: "center", borderTopLeftRadius: 14, borderTopRightRadius: 14,
  },
  savingsBadge: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingVertical: 4, alignItems: "center", borderTopLeftRadius: 14, borderTopRightRadius: 14,
  },
  checkMark: {
    width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 8,
  },
  featuresCard: {
    borderRadius: 16, padding: 18, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  featureCheck: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 12 },
  compareRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  cta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 18, borderRadius: 50,
    shadowColor: "#BE1A1A", shadowOpacity: 0.4, shadowRadius: 14, elevation: 6,
  },
});
