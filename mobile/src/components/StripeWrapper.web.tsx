import React from "react";

export const StripeWrapper: React.FC<{ children: React.ReactNode; publishableKey: string }> = ({
  children,
}) => {
  return <>{children}</>;
};
