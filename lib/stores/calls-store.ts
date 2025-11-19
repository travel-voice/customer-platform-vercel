import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

import { UUID } from '@/lib/types/auth';
import { ICallRecord } from '@/lib/types/dashboard';

interface FilterParams {
  filter?: string;
  filter_value?: string;
}

interface RecordsStore {
  // State
  records: ICallRecord[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  
  // Filter state
  filterField: string;
  filterValue: string;
  
  // Actions
  getRecords: (organisationUuid: UUID, page?: number, size?: number, filters?: FilterParams) => Promise<void>;
  getAgentRecords: (organisationUuid: UUID, agentUuid: UUID, page?: number, size?: number, filters?: FilterParams) => Promise<void>;
  setPage: (page: number) => void;
  setFilter: (field: string, value: string) => void;
  clearFilter: () => void;
  
  // Backwards compatibility
  getLatestRecords: (organisationUuid: UUID, page?: number, size?: number) => Promise<void>;
  
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useRecordsStore = create<RecordsStore>((set, get) => ({
  // Initial state
  records: [],
  totalRecords: 0,
  currentPage: 1,
  pageSize: 10,
  isLoading: false,
  error: null,
  filterField: '',
  filterValue: '',

  // Actions
  getRecords: async (organisationUuid: UUID, page?: number, size?: number, filters?: FilterParams) => {
    const currentPage = page || get().currentPage;
    const pageSize = size || get().pageSize;

    set({ isLoading: true, error: null, currentPage, pageSize });

    try {
      const supabase = createClient();
      const offset = (currentPage - 1) * pageSize;

      let query = supabase
        .from('calls')
        .select(`
          *,
          agents (
            name,
            uuid
          )
        `, { count: 'exact' })
        .eq('organization_uuid', organisationUuid)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (filters?.filter && filters?.filter_value) {
        // Implement simple filtering if needed
        // query = query.eq(filters.filter, filters.filter_value);
      }

      const { data, count, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Map Supabase results to ICallRecord
      const records: ICallRecord[] = (data || []).map((call: any) => ({
        id: call.uuid,
        uuid: call.uuid,
        key: call.uuid,
        date: new Date(call.created_at),
        duration: call.duration_seconds || 0,
        handler: {
          id: call.agents?.uuid || '',
          name: call.agents?.name || 'Unknown Agent',
        },
        sentiment: (call.sentiment || 'neutral') as 'positive' | 'neutral' | 'negative',
        audio: extractRecordingUrl(call),
        messages: Array.isArray(call.transcript) ? call.transcript : [],
        summary: extractSummary(call),
      }));

      set({
        records,
        totalRecords: count || 0,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch records'
      });
      throw error;
    }
  },

  getAgentRecords: async (organisationUuid: UUID, agentUuid: UUID, page?: number, size?: number, filters?: FilterParams) => {
    const currentPage = page || get().currentPage;
    const pageSize = size || get().pageSize;

    set({ isLoading: true, error: null, currentPage, pageSize });

    try {
      const supabase = createClient();
      const offset = (currentPage - 1) * pageSize;

      const { data, count, error } = await supabase
        .from('calls')
        .select(`
          *,
          agents (
            name,
            uuid
          )
        `, { count: 'exact' })
        .eq('organization_uuid', organisationUuid)
        .eq('agent_uuid', agentUuid)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        throw new Error(error.message);
      }

      const records: ICallRecord[] = (data || []).map((call: any) => ({
        id: call.uuid,
        uuid: call.uuid,
        key: call.uuid,
        date: new Date(call.created_at),
        duration: call.duration_seconds || 0,
        handler: {
          id: call.agents?.uuid || '',
          name: call.agents?.name || 'Unknown Agent',
        },
        sentiment: (call.sentiment || 'neutral') as 'positive' | 'neutral' | 'negative',
        audio: extractRecordingUrl(call),
        messages: Array.isArray(call.transcript) ? call.transcript : [],
        summary: extractSummary(call),
      }));

      set({
        records,
        totalRecords: count || 0,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch character records'
      });
      throw error;
    }
  },

  setPage: (page: number) => set({ currentPage: page }),
  
  setFilter: (field: string, value: string) => set({ 
    filterField: field, 
    filterValue: value 
  }),
  
  clearFilter: () => set({ 
    filterField: '', 
    filterValue: '',
    currentPage: 1 // Reset to first page when clearing filters
  }),
  
  // Backwards compatibility
  getLatestRecords: async (organisationUuid: UUID, page?: number, size?: number) => {
    return get().getRecords(organisationUuid, page, size);
  },
  
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));

function parseStructuredData(call: any) {
  return typeof call?.extracted_data === 'object' && call?.extracted_data !== null
    ? call.extracted_data
    : null;
}

function extractRecordingUrl(call: any): string {
  const structured = parseStructuredData(call);
  return (
    call.recording_url ||
    structured?.recordingUrl ||
    structured?.recording?.mono?.combinedUrl ||
    structured?.recording?.stereoUrl ||
    structured?.stereoRecordingUrl ||
    ''
  );
}

function extractSummary(call: any): string {
  const structured = parseStructuredData(call);
  return (
    structured?.summary ||
    structured?.analysis?.summary ||
    structured?.transcriptText ||
    ''
  );
}
