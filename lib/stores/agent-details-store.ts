import { create } from 'zustand';

import { UUID } from '@/lib/types/auth';
import { ICharacterDetail, ICharacterStats, ICharacterUpdateRequest, IDataPoint } from '@/lib/types/agents';

interface AgentDetailsStore {
  // State
  agentDetail: ICharacterDetail | null;
  agentStats: ICharacterStats | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Actions
  getAgentDetails: (organisationUuid: UUID, agentUuid: UUID) => Promise<void>;
  getAgentStats: (organisationUuid: UUID, agentUuid: UUID) => Promise<void>;
  updateAgent: (organisationUuid: UUID, agentUuid: UUID, updates: ICharacterUpdateRequest, refreshAgentsList?: boolean) => Promise<ICharacterDetail>;
  updateDataExtraction: (organisationUuid: UUID, agentUuid: UUID, datapoints: IDataPoint[]) => Promise<void>;
  getDataExtraction: (organisationUuid: UUID, agentUuid: UUID) => Promise<string[]>;
  clearAgent: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAgentDetailsStore = create<AgentDetailsStore>((set, get) => ({
  // Initial state
  agentDetail: null,
  agentStats: null,
  isLoading: false,
  isUpdating: false,
  error: null,

  // Actions
  getAgentDetails: async (organisationUuid: UUID, agentUuid: UUID) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/agents/${agentUuid}`);

      if (!response.ok) {
        throw new Error('Failed to fetch agent details');
      }

      const { agent } = await response.json();

      // Extract selected IDs from data_extraction_config
      const selectedIds = agent.data_extraction_config 
        ? Object.keys(agent.data_extraction_config) 
        : [];

      // Transform to match ICharacterDetail format
      const agentDetail: ICharacterDetail = {
        uuid: agent.uuid,
        name: agent.name,
        avatar_url: agent.image || '/defaultcharacter.png',
        purpose: agent.system_prompt || '',
        voice_id: agent.voice_id,
        first_message: agent.first_message,
        organisation_uuid: agent.organization_uuid,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        // Add extraction schema from DB config
        extraction_schema: {
          selectedIds
        },
        // Fill in other required fields with defaults or mapped data
        activation_id: agent.vapi_assistant_id || '',
        booking_url: '',
        description: '',
        is_active: true,
        locale: 'en-US',
        model_id: 1,
        organisation_id: 1,
        retrieval_augmented_generation_uuid: '',
        system_prompt: agent.system_prompt || ''
      };

      set({
        agentDetail,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch agent details'
      });
      throw error;
    }
  },

  getAgentStats: async (organisationUuid: UUID, agentUuid: UUID) => {
    // TODO: Implement stats fetching from Supabase calls table
    // For now, return empty stats since we don't have call data yet
    try {
      const currentAgent = get().agentDetail;

      const emptyStats: ICharacterStats = {
        assistant_uuid: agentUuid,
        assistant_avatar_url: currentAgent?.avatar_url || '/defaultcharacter.png',
        assistant_name: currentAgent?.name || '',
        assistant_purpose: currentAgent?.purpose || '',
        percentPositive: 0,
        emptyCount: 0,
        successCount: 0,
        totalCount: 0,
        pieChart: {
          pos: 0,
          neu: 0,
          neg: 0,
        },
      };

      set({
        agentStats: emptyStats,
        error: null
      });
    } catch (error: any) {
      // Don't set loading state for stats as it's optional
      console.error('Failed to fetch agent stats:', error);
    }
  },

  updateAgent: async (organisationUuid: UUID, agentUuid: UUID, updates: ICharacterUpdateRequest, refreshAgentsList = true) => {
    set({ isUpdating: true, error: null });
    try {
      // Clean the request body - remove undefined values
      const cleanedUpdates: any = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value !== undefined && key !== 'extraction_schema') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      // Handle extraction schema update if present in the general update
      if (updates.extraction_schema) {
         // We can't easily map IExtractionSchema to config here without the full datapoint definitions
         // so we usually ignore it here or handle it separately.
         // For now, let's skip it as updateDataExtraction handles it.
      }

      const response = await fetch(`/api/agents/${agentUuid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedUpdates),
      });

      if (!response.ok) {
        throw new Error('Failed to update agent');
      }

      const { agent } = await response.json();

      // Update local state
      const currentDetail = get().agentDetail;
      if (currentDetail) {
        const updatedDetail = {
            ...currentDetail,
            name: agent.name,
            avatar_url: agent.image || currentDetail.avatar_url,
            purpose: agent.system_prompt || currentDetail.purpose,
            voice_id: agent.voice_id,
            first_message: agent.first_message,
            system_prompt: agent.system_prompt || currentDetail.system_prompt,
            updated_at: agent.updated_at,
            extraction_schema: agent.data_extraction_config 
                ? { selectedIds: Object.keys(agent.data_extraction_config) }
                : currentDetail.extraction_schema
        };

        set({
            agentDetail: updatedDetail,
            isUpdating: false,
            error: null
        });
      } else {
          // Fallback if no local state
           set({ isUpdating: false, error: null });
           get().getAgentDetails(organisationUuid, agentUuid);
      }


      // Refresh the main agents list to reflect changes in UI
      if (refreshAgentsList) {
        try {
          // Use setTimeout to ensure the state is properly updated first
          setTimeout(async () => {
            try {
              const { useAgentsStore } = await import('./agents-store');
              console.log('Refreshing agents list after update...');
              await useAgentsStore.getState().getAgents();
              console.log('Agents list refreshed successfully');
            } catch (refreshError) {
              console.warn('Failed to refresh agents list after update:', refreshError);
            }
          }, 100);
        } catch (error) {
          console.warn('Failed to setup agents list refresh:', error);
        }
      }

      return get().agentDetail!;
    } catch (error: any) {
      set({
        isUpdating: false,
        error: error.message || 'Failed to update agent'
      });
      throw error;
    }
  },

  updateDataExtraction: async (organisationUuid: UUID, agentUuid: UUID, datapoints: IDataPoint[]) => {
    set({ isUpdating: true, error: null });
    try {
      // Transform datapoints to the required API format
      const data_extraction_config: Record<string, { description: string; type: string }> = {};
      
      datapoints.forEach(datapoint => {
        data_extraction_config[datapoint.id] = {
          description: datapoint.description,
          type: datapoint.type
        };
      });

      const response = await fetch(`/api/agents/${agentUuid}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data_extraction_config }),
      });

      if (!response.ok) {
          throw new Error('Failed to update data extraction config');
      }
      
      // Update local state
      const currentDetail = get().agentDetail;
      if (currentDetail) {
          set({
              agentDetail: {
                  ...currentDetail,
                  extraction_schema: {
                      selectedIds: datapoints.map(d => d.id)
                  }
              },
              isUpdating: false,
              error: null
          });
      } else {
        set({ 
            isUpdating: false,
            error: null 
        });
      }

    } catch (error: any) {
      set({ 
        isUpdating: false, 
        error: error.message || 'Failed to update data extraction schema' 
      });
      throw error;
    }
  },

  getDataExtraction: async (organisationUuid: UUID, agentUuid: UUID) => {
    try {
      const response = await fetch(`/api/agents/${agentUuid}`);
      
      if (!response.ok) {
          return [];
      }

      const { agent } = await response.json();
      
      // Return the list of property keys that are already configured
      return agent.data_extraction_config ? Object.keys(agent.data_extraction_config) : [];
    } catch (error: any) {
      console.error('Failed to fetch data extraction configuration:', error);
      // Return empty array if there's an error (e.g., no configuration exists yet)
      return [];
    }
  },

  clearAgent: () => set({ 
    agentDetail: null, 
    agentStats: null,
    error: null 
  }),
  
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
