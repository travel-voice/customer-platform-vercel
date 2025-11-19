import { UUID } from './auth';

// Plan feature interface
export interface IPlanFeature {
  label: string;        // "200 Travel Voice minutes"
  isEnabled: boolean;   // true/false for this plan
}

// Subscription plan interface
export interface IPlan {
  id: UUID;                    // "8d2dccd5-58b0-4a39-b50f-412a21de6d89"
  name: string;               // "Lite", "Standard", "Professional"
  description: string;        // Plan description
  currency: string;           // "gbp"
  price: number;             // 50, 400, 1650 (in pounds)
  period: string;            // "month"
  features: IPlanFeature[];  // List of features with enabled/disabled status
  isActive?: boolean;        // Marks the "Most Popular" plan
}

// Stripe invoice data structure
export interface IStripeInvoice {
  id: string;                    // "in_1234567890"
  total: number;                 // Amount in pence (£50.00 = 5000)
  currency: string;              // "gbp"
  status: 'paid' | 'draft' | 'open';
  number: string;                // "INV-001"
  customer_email: string;        // "user@example.com"
  expires_at: number;            // Unix timestamp
  created: number;               // Unix timestamp
  hosted_invoice_url: string;    // External Stripe invoice URL
  invoice_pdf: string;           // Direct PDF download URL
}

// Transformed invoice for display
export interface IInvoice {
  id: string;
  amount: string;                // "£50.00"
  currency: string;              // "GBP"
  status: 'paid' | 'draft' | 'open';
  number: string;                // "INV-001"
  customerEmail: string;
  dueDate: string;               // "15 Dec"
  createdDate: string;           // "14 Dec, 09:30"
  hostedUrl: string;             // External Stripe invoice
  pdfUrl: string;                // Direct PDF download
}

// Stripe invoice API response
export interface IStripeInvoiceResponse {
  data: IStripeInvoice[];
  total_count: number;
}

// Invoice API parameters
export interface IGetInvoicesParams {
  limit?: number;              // Page size
  starting_after?: string;     // For pagination (invoice ID)
  ending_before?: string;      // For pagination (invoice ID)
}

// Payment link generation request
export interface IPaymentLinkRequest {
  organisationUuid: UUID;
  packageUuid: UUID;
}

// Billing period interface - matches the API response model
export interface IBillingPeriod {
  id: number;
  period_start_utc: string;        // Will be mapped from start_date
  period_end_utc: string;          // Will be mapped from end_date
  usage_seconds: number;           // Total usage in seconds for current period
  total_seconds: number;           // Total seconds in package (net_package_seconds)
  client_id: number;
  package_id: number;
  rMins: number;                   // Remaining minutes for current period
  rSecs: number;                   // Remaining seconds for current period (0-59)
  tMins: number;                   // Whole minutes in package
  tSecs: number;                   // Remaining seconds in package (0-59)
}

// Payment confirmation data
export interface IPaymentConfirmation {
  success: boolean;
  planName?: string;
  amount?: string;
  currency?: string;
} 