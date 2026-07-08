import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";

export const StripeWrapper: React.FC<{ children: React.ReactNode; publishableKey: string }> = ({
  children,
  publishableKey,
}) => {
  // Defensive check: prevent startup crashes if key is empty or invalid
  if (!publishableKey || !publishableKey.startsWith("pk_")) {
    console.warn("[StripeWrapper] Stripe publishable key is missing or invalid. Skipping provider wrapping.");
    return <>{children}</>;
  }

  return (
    <StripeProvider publishableKey={publishableKey}>
      {children as any}
    </StripeProvider>
  );
};
