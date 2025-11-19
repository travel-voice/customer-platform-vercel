import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { UUID } from '@/lib/types/auth';
import { ICallRecord } from '@/lib/types/call-details';

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
        date: new Date(data.created_at),
        duration: data.duration_seconds || 0,
        characterName: data.agents?.name || characterName || 'Assistant',
        characterId: data.agent_uuid,
        sentiment: (data.sentiment || 'neutral') as 'positive' | 'neutral' | 'negative',
        sentimentScore: 0.5, // Default neutral score, could be calculated from sentiment if needed
        audioUrl: data.recording_url || '',
        messages: Array.isArray(data.transcript) 
          ? data.transcript.map((msg: any) => ({
              role: msg.role === 'bot' ? 'assistant' as const : 'user' as const,
              message: msg.message || msg.content || '',
              timestamp: msg.time ? new Date(msg.time) : undefined,
            }))
          : [],
        summary: data.extracted_data ? JSON.stringify(data.extracted_data) : '',
        structuredData: typeof data.extracted_data === 'object' ? data.extracted_data : undefined,
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
