import React, { useState } from "react";
import {
  View, Text, Pressable, TextInput,
  ActivityIndicator, StyleSheet, Alert,
  ScrollView, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const GOLD = "#F7D87F";
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_51Sn7aePd4Rr03y3OCmsGRAoZK5LYh4A6NLeQ2C7XrRWnYxusHrbtqxBu0OHdpQwttkPsiiy1xRe9LiuVjL3ip1Ll00SNMQlXHX";

export default function PremiumPaymentScreen() {
  const router = useRouter();
  const { plan } = useLocalSearchParams();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;

  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const getPlanDetails = () => {
    switch (plan) {
      case "monthly":
        return { label: "Premium Monthly", price: "$9.99" };
      case "lifetime":
        return { label: "Premium Lifetime", price: "$149.99" };
      case "yearly":
      default:
        return { label: "Premium Yearly", price: "$59.99" };
    }
  };

  const planDetails = getPlanDetails();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      if (paymentMethod === "stripe") {
        if (cardNumber.length < 16 || expiry.length < 4 || cvc.length < 3) {
          Alert.alert("Invalid Card Details", "Please fill in all credit card fields.");
          setLoading(false);
          return;
        }
      } else {
        if (!paypalEmail.includes("@")) {
          Alert.alert("Invalid Email", "Please enter a valid PayPal account email.");
          setLoading(false);
          return;
        }
      }

      // Call backend to create Stripe/PayPal Payment Intent
      const intentRes = await apiClient.post("/api/payments/create-intent/", {
        plan: plan || "yearly",
        method: paymentMethod
      });

      const { payment_intent_id } = intentRes.data;

      // Simulate confirming payment (in production, Stripe/PayPal SDK would complete this)
      const confirmRes = await apiClient.post("/api/payments/confirm/", {
        plan: plan || "yearly",
        payment_intent_id,
        method: paymentMethod
      });

      Alert.alert(
        "🎉 Upgrade Successful!",
        confirmRes.data.message || "Thank you for upgrading! Your premium access is now active.",
        [{ text: "Awesome!", onPress: () => router.replace("/(student)") }]
      );
    } catch (e: any) {
      Alert.alert("Payment Failed", e?.response?.data?.error || "Error processing transaction. Verify API keys in settings.");
    } finally {
      setLoading(false);
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
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: inputBg }]}>
            <Ionicons name="chevron-back" size={20} color={ACCENT} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Checkout</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={{ padding: 20 }}>
          {/* Order Summary */}
          <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ color: textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, textTransform: "uppercase" }}>Selected Plan</Text>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 4 }}>{planDetails.label}</Text>
              </View>
              <Text style={{ color: GOLD, fontFamily: "Sora_700Bold", fontSize: 22 }}>{planDetails.price}</Text>
            </View>
          </View>

          {/* Payment Method Selectors */}
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Select Payment Method</Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <Pressable
              onPress={() => setPaymentMethod("stripe")}
              style={[
                styles.methodCard,
                { backgroundColor: cardBg, borderColor: paymentMethod === "stripe" ? ACCENT : cardBorder },
                paymentMethod === "stripe" && { borderWidth: 2 }
              ]}
            >
              <Ionicons name="card" size={26} color={paymentMethod === "stripe" ? ACCENT : textSecondary} />
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14, marginTop: 8 }}>Credit Card</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>Stripe Gateway</Text>
            </Pressable>

            <Pressable
              onPress={() => setPaymentMethod("paypal")}
              style={[
                styles.methodCard,
                { backgroundColor: cardBg, borderColor: paymentMethod === "paypal" ? ACCENT : cardBorder },
                paymentMethod === "paypal" && { borderWidth: 2 }
              ]}
            >
              <Ionicons name="logo-paypal" size={26} color={paymentMethod === "paypal" ? "#003087" : textSecondary} />
              <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 14, marginTop: 8 }}>PayPal</Text>
              <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 }}>PayPal Wallet</Text>
            </Pressable>
          </View>

          {/* Form Fields */}
          <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {paymentMethod === "stripe" ? (
              <View>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 12 }}>Card Information</Text>
                
                <Text style={[styles.inputLabel, { color: textSecondary }]}>CARD NUMBER</Text>
                <TextInput
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="number-pad"
                  maxLength={16}
                  placeholder="4242 4242 4242 4242"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
                />

                <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: textSecondary }]}>EXPIRY DATE</Text>
                    <TextInput
                      value={expiry}
                      onChangeText={setExpiry}
                      keyboardType="number-pad"
                      maxLength={4}
                      placeholder="MM/YY"
                      placeholderTextColor="#9CA3AF"
                      style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: textSecondary }]}>CVC / CVV</Text>
                    <TextInput
                      value={cvc}
                      onChangeText={setCvc}
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                      placeholder="123"
                      placeholderTextColor="#9CA3AF"
                      style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 12 }}>PayPal Account</Text>
                <Text style={[styles.inputLabel, { color: textSecondary }]}>EMAIL ADDRESS</Text>
                <TextInput
                  value={paypalEmail}
                  onChangeText={setPaypalEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="student@example.com"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
                />
              </View>
            )}
          </View>

          {/* Secure details */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20 }}>
            <Ionicons name="lock-closed" size={14} color="#10B981" />
            <Text style={{ color: "#10B981", fontFamily: "Inter_500Medium", fontSize: 12, marginLeft: 4 }}>
              Secure checkout via SSL and 256-bit encryption
            </Text>
          </View>

          {/* CTA */}
          <Pressable
            onPress={handleCheckout}
            disabled={loading}
            style={[styles.ctaBtn, { backgroundColor: "#BE1A1A" }]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 16 }}>
                Pay {planDetails.price}
              </Text>
            )}
          </Pressable>
        </View>
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
  summaryCard: { padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  sectionTitle: { fontFamily: "Sora_700Bold", fontSize: 15, marginBottom: 12 },
  methodCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  formCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  inputLabel: { fontFamily: "Inter_700Bold", fontSize: 10, marginBottom: 6, letterSpacing: 0.8 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontFamily: "Inter_500Medium", fontSize: 14 },
  ctaBtn: {
    marginTop: 28, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center",
    shadowColor: "#BE1A1A", shadowOpacity: 0.3, shadowRadius: 10, elevation: 4
  }
});
