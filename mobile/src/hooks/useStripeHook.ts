import { useStripe } from "@stripe/stripe-react-native";

export const useStripeHook = () => {
  return useStripe();
};
