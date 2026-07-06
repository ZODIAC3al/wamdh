export const useStripeHook = () => {
  return {
    initPaymentSheet: async () => ({
      error: { message: "Stripe payments are not supported on web. Please use our mobile app." }
    }),
    presentPaymentSheet: async () => ({
      error: { message: "Stripe payments are not supported on web. Please use our mobile app." }
    }),
  };
};
