import axios from 'axios';
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

import { PLANS } from '@/lib/constants/plans';
import { UUID } from '@/lib/types/auth';
import { 
  IBillingPeriod, 
  IGetInvoicesParams,
  IInvoice, 
  IPaymentLinkRequest,
  IPlan, 
  IStripeInvoice, 
  IStripeInvoiceResponse} from '@/lib/types/billing';

interface BillingStore {
  // State
  plans: IPlan[];
  currentPeriod: IBillingPeriod | null;
  invoices: IInvoice[];
  totalInvoices: number;
  isLoadingPlans: boolean;
  isLoadingPeriod: boolean;
  isLoadingInvoices: boolean;
  isGeneratingPaymentLink: boolean;
  error: string | null;
  
  // Actions
  getPlans: () => IPlan[];
  getCurrentPeriod: (organisationUuid: UUID) => Promise<void>;
  generatePaymentLink: (request: IPaymentLinkRequest) => Promise<string>;
  getInvoices: (params?: IGetInvoicesParams) => Promise<void>;
  transformStripeInvoice: (invoice: IStripeInvoice) => IInvoice;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (timestamp: number, format: 'short' | 'full') => string;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useBillingStore = create<BillingStore>((set, get) => ({
  // Initial state
  plans: PLANS,
  currentPeriod: null,
  invoices: [],
  totalInvoices: 0,
  isLoadingPlans: false,
  isLoadingPeriod: false,
  isLoadingInvoices: false,
  isGeneratingPaymentLink: false,
  error: null,

  // Actions
  getPlans: () => {
    // Return static plans data
    return PLANS;
  },

  getCurrentPeriod: async (organisationUuid: UUID) => {
    set({ isLoadingPeriod: true, error: null });

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organizations')
        .select('subscription_plan, time_remaining_seconds')
        .eq('uuid', organisationUuid)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Map database fields to IBillingPeriod
      // Note: usage_seconds and total_seconds are approximations based on available data
      // In a real implementation, you'd want columns for period start/end
      const totalSeconds = data.time_remaining_seconds || 0;
      
      const period: IBillingPeriod = {
        id: 1,
        period_start_utc: new Date().toISOString(),
        period_end_utc: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default to 30 days out
        usage_seconds: 0, // We don't track used seconds separately in this simple model
        total_seconds: totalSeconds,
        client_id: 1,
        package_id: 1,
        rMins: Math.floor(totalSeconds / 60),
        rSecs: totalSeconds % 60,
        tMins: Math.floor(totalSeconds / 60),
        tSecs: totalSeconds % 60,
      };

      set({
        currentPeriod: period,
        isLoadingPeriod: false,
        error: null
      });
    } catch (error: any) {
      // Fallback to default if fetch fails (e.g. during dev)
      console.warn('Failed to fetch billing period, using default:', error);
       const defaultPeriod: IBillingPeriod = {
        id: 1,
        period_start_utc: new Date().toISOString(),
        period_end_utc: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage_seconds: 0,
        total_seconds: 999999,
        client_id: 1,
        package_id: 1,
        rMins: 16666,
        rSecs: 39,
        tMins: 16666,
        tSecs: 39,
      };
      
      set({
        currentPeriod: defaultPeriod,
        isLoadingPeriod: false,
        error: null
      });
    }
  },

  generatePaymentLink: async (request: IPaymentLinkRequest) => {
    set({ isGeneratingPaymentLink: true, error: null });
    try {
        // TODO: Implement Supabase function or API route for Stripe Checkout
        // For now, we throw an error as the old backend is removed
        throw new Error('Payment processing is currently being upgraded. Please contact support.');
        
        /* 
        // Example of how it might look with a new API route:
        const response = await axios.post('/api/billing/checkout', {
            packageId: request.packageUuid,
            organizationId: request.organisationUuid
        });
        return response.data.url;
        */
    } catch (error: any) {
      set({ 
        isGeneratingPaymentLink: false, 
        error: error.message || 'Failed to generate payment link' 
      });
      throw error;
    }
  },

  getInvoices: async (params?: IGetInvoicesParams) => {
    set({ isLoadingInvoices: true, error: null });
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('expand[0]', 'total_count');
      
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.starting_after) {
        queryParams.append('starting_after', params.starting_after);
      }
      if (params?.ending_before) {
        queryParams.append('ending_before', params.ending_before);
      }

      // Fetch via server route to keep Stripe secret on server
      const response = await axios.get<IStripeInvoiceResponse>(
        `/api/invoices?${queryParams.toString()}`
      );

      // Transform Stripe invoices to our format
      const transformedInvoices = response.data.data.map(invoice => 
        get().transformStripeInvoice(invoice)
      );

      set({ 
        invoices: transformedInvoices,
        totalInvoices: response.data.total_count,
        isLoadingInvoices: false,
        error: null 
      });
    } catch (error: any) {
      set({ 
        isLoadingInvoices: false, 
        error: error.response?.data?.message || 'Failed to fetch invoices' 
      });
      throw error;
    }
  },

  transformStripeInvoice: (invoice: IStripeInvoice): IInvoice => {
    const { formatCurrency, formatDate } = get();
    
    return {
      id: invoice.id,
      amount: formatCurrency(invoice.total, invoice.currency),
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      number: invoice.number,
      customerEmail: invoice.customer_email,
      dueDate: formatDate(invoice.expires_at, 'short'),
      createdDate: formatDate(invoice.created, 'full'),
      hostedUrl: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf,
    };
  },

  formatCurrency: (amount: number, currency: string): string => {
    // Convert from pence to pounds for GBP
    const value = currency.toLowerCase() === 'gbp' ? amount / 100 : amount;
    const symbol = currency.toLowerCase() === 'gbp' ? '£' : currency.toUpperCase();
    
    return `${symbol}${value.toFixed(2)}`;
  },

  formatDate: (timestamp: number, format: 'short' | 'full'): string => {
    const date = new Date(timestamp * 1000);
    
    if (format === 'short') {
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short' 
      });
    } else {
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
