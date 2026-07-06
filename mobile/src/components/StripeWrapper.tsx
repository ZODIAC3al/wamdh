import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";

export const StripeWrapper: React.FC<{ children: React.ReactNode; publishableKey: string }> = ({
  children,
  publishableKey,
}) => {
  return (
    <StripeProvider publishableKey={publishableKey}>
      {children as any}
    </StripeProvider>
  );
};
