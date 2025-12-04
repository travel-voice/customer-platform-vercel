import { PlanFeature, Plan } from '@/lib/types/billing';

export const STRIPE_PRICE_ID_PHONE_NUMBER = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PHONE_NUMBER || "";

export const STRIPE_PLANS: Plan[] = [
  {
    id: "lite",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LITE || "",
    name: "Lite",
    description: "Basic AI voice features ideal for startup web and phone use",
    price: 50,
    currency: "GBP",
    period: "month",
    minutesIncluded: 200,
    phoneNumbersIncluded: 1,
    features: [
      { label: "200 Travel Voice minutes", isEnabled: true },
      { label: "1 Phone number included", isEnabled: true },
      { label: "Basic voice selection", isEnabled: true },
      { label: "Email support", isEnabled: true },
      { label: "CRM integration", isEnabled: false },
      { label: "Advanced analytics", isEnabled: false },
      { label: "Priority support", isEnabled: false }
    ]
  },
  {
    id: "standard",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STANDARD || "",
    name: "Standard",
    description: "Perfect for growing businesses with increased usage needs",
    price: 400,
    currency: "GBP",
    period: "month",
    minutesIncluded: 1000,
    phoneNumbersIncluded: 3,
    isActive: true,
    features: [
      { label: "1,000 Travel Voice minutes", isEnabled: true },
      { label: "3 Phone numbers included", isEnabled: true },
      { label: "Premium voice selection", isEnabled: true },
      { label: "Email support", isEnabled: true },
      { label: "CRM integration", isEnabled: true },
      { label: "Basic analytics", isEnabled: true },
      { label: "Priority support", isEnabled: false }
    ]
  },
  {
    id: "professional",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL || "",
    name: "Professional",
    description: "For enterprises requiring high-volume usage and premium features",
    price: 1650,
    currency: "GBP",
    period: "month",
    minutesIncluded: 5000,
    phoneNumbersIncluded: 10,
    features: [
      { label: "5,000 Travel Voice minutes", isEnabled: true },
      { label: "10 Phone numbers included", isEnabled: true },
      { label: "All premium voices", isEnabled: true },
      { label: "24/7 priority support", isEnabled: true },
      { label: "Advanced CRM integration", isEnabled: true },
      { label: "Advanced analytics & reporting", isEnabled: true },
      { label: "Custom voice training", isEnabled: true }
    ]
  }
];
