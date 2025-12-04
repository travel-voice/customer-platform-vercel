export interface PlanFeature {
  label: string;
  isEnabled: boolean;
}

export interface Plan {
  id: string;
  stripePriceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  period: string;
  minutesIncluded: number;
  features: PlanFeature[];
  isActive?: boolean;
}

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
    features: [
      { label: "200 Travel Voice minutes", isEnabled: true },
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
    isActive: true,
    features: [
      { label: "1,000 Travel Voice minutes", isEnabled: true },
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
    features: [
      { label: "5,000 Travel Voice minutes", isEnabled: true },
      { label: "All premium voices", isEnabled: true },
      { label: "24/7 priority support", isEnabled: true },
      { label: "Advanced CRM integration", isEnabled: true },
      { label: "Advanced analytics & reporting", isEnabled: true },
      { label: "Custom voice training", isEnabled: true }
    ]
  }
];
