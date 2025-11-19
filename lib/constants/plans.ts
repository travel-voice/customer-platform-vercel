import { IPlan } from '@/lib/types/billing';

// Static plans data as specified in the documentation
export const PLANS: IPlan[] = [
  {
    id: "8d2dccd5-58b0-4a39-b50f-412a21de6d89",
    name: "Lite",
    description: "Basic AI voice features ideal for startup web and phone use",
    price: 50,
    currency: "gbp",
    period: "month",
    features: [
      {
        label: "200 Travel Voice minutes",
        isEnabled: true
      },
      {
        label: "Basic voice selection", 
        isEnabled: true
      },
      {
        label: "Email support",
        isEnabled: true
      },
      {
        label: "CRM integration", 
        isEnabled: false
      },
      {
        label: "Advanced analytics",
        isEnabled: false
      },
      {
        label: "Priority support",
        isEnabled: false
      }
    ]
  },
  {
    id: "cda5e9a0-4858-4c74-b942-1affee0871a7",
    name: "Standard",
    description: "Perfect for growing businesses with increased usage needs",
    price: 400,
    currency: "gbp", 
    period: "month",
    isActive: true, // Mark as "Most Popular"
    features: [
      {
        label: "1,000 Travel Voice minutes",
        isEnabled: true
      },
      {
        label: "Premium voice selection",
        isEnabled: true
      },
      {
        label: "Email support",
        isEnabled: true
      },
      {
        label: "CRM integration", 
        isEnabled: true
      },
      {
        label: "Basic analytics",
        isEnabled: true
      },
      {
        label: "Priority support",
        isEnabled: false
      }
    ]
  },
  {
    id: "8255dd54-314b-400a-ba9f-6ce00e5ea2ed", 
    name: "Professional",
    description: "For enterprises requiring high-volume usage and premium features",
    price: 1650,
    currency: "gbp",
    period: "month",
    features: [
      {
        label: "5,000 Travel Voice minutes",
        isEnabled: true
      },
      {
        label: "All premium voices",
        isEnabled: true
      },
      {
        label: "24/7 priority support",
        isEnabled: true
      },
      {
        label: "Advanced CRM integration", 
        isEnabled: true
      },
      {
        label: "Advanced analytics & reporting",
        isEnabled: true
      },
      {
        label: "Custom voice training",
        isEnabled: true
      }
    ]
  }
]; 