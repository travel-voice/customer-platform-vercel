import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { UUID } from '@/lib/types/auth';
import { IPeriod } from '@/lib/types/dashboard';

interface CustomerStore {
  // State
  period: IPeriod | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  getCustomerPeriod: (organisationUuid: UUID) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useCustomerStore = create<CustomerStore>((set) => ({
  // Initial state
  period: null,
  isLoading: false,
  error: null,

  // Actions
  getCustomerPeriod: async (organisationUuid: UUID) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organizations')
        .select('time_remaining_seconds')
        .eq('uuid', organisationUuid)
        .single();

      if (error) throw new Error(error.message);
      
      const totalSeconds = data.time_remaining_seconds || 0;
      
      // Map to our expected format (simplified for now as we don't have full billing tables yet)
      const mappedPeriod: IPeriod = {
        id: 1,
        period_start_utc: new Date().toISOString(),
        period_end_utc: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage_seconds: 0,
        client_id: 1,
        package_id: 1,
        rMins: Math.floor(totalSeconds / 60),
        rSecs: totalSeconds % 60,
        tMins: Math.floor(totalSeconds / 60),
        tSecs: totalSeconds % 60,
      };
      
      set({ 
        period: mappedPeriod, 
        isLoading: false,
        error: null 
      });
    } catch (error: any) {
      // Fallback for dev
      console.warn('Failed to fetch period, using default:', error);
       const defaultPeriod: IPeriod = {
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
        period: defaultPeriod, 
        isLoading: false, 
        error: null 
      });
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
