import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { UUID } from '@/lib/types/auth';
import { ICallRecord } from '@/lib/types/dashboard';

interface CallDetailsStore {
  // State
  callDetails: ICallRecord | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  getCallDetails: (organisationUuid: UUID, characterUuid: UUID, callUuid: UUID, characterName?: string) => Promise<void>;
  deleteCall: (organisationUuid: UUID, characterUuid: UUID, callId: string) => Promise<void>;
  clearCallDetails: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useCallDetailsStore = create<CallDetailsStore>((set) => ({
  // Initial state
  callDetails: null,
  isLoading: false,
  error: null,

  // Actions
  getCallDetails: async (organisationUuid: UUID, characterUuid: UUID, callUuid: UUID, characterName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('calls')
        .select(`
            *,
            agents (
                name,
                uuid
            )
        `)
        .eq('uuid', callUuid)
        .eq('organization_uuid', organisationUuid)
        .single();

      if (error) throw new Error(error.message);
      
      // Transform API response to our internal format
      const callRecord: ICallRecord = {
        id: callUuid,
        uuid: data.uuid,
        key: data.uuid, // Added key property to match interface
        date: new Date(data.created_at),
        duration: data.duration_seconds || 0,
        // The interface expects 'handler' property but previous implementation mapped characterName/characterId
        // I'll stick to ICallRecord interface which has 'handler'
        handler: {
            id: data.agent_uuid,
            name: data.agents?.name || characterName || 'Assistant'
        },
        sentiment: data.sentiment || 'neutral',
        // sentimentScore: 0, // Not in ICallRecord interface from dashboard.ts, but was in previous file. Removing to match interface.
        audio: data.recording_url, // mapped to audio in dashboard.ts interface
        messages: Array.isArray(data.transcript) ? data.transcript : [],
        summary: data.extracted_data ? JSON.stringify(data.extracted_data) : '',
        // Additional fields not in ICallRecord but maybe useful?
        // Keeping it strictly to ICallRecord to avoid type errors
      };
      
      set({ 
        callDetails: callRecord,
        isLoading: false,
        error: null 
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch call details' 
      });
      throw error;
    }
  },

  deleteCall: async (organisationUuid: UUID, characterUuid: UUID, callId: string) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('calls')
        .delete()
        .eq('uuid', callId)
        .eq('organization_uuid', organisationUuid);

      if (error) throw new Error(error.message);
      
      // Clear the call details after successful deletion
      set({ 
        callDetails: null,
        isLoading: false,
        error: null 
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to delete call' 
      });
      throw error;
    }
  },

  clearCallDetails: () => set({ 
    callDetails: null, 
    error: null 
  }),
  
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
