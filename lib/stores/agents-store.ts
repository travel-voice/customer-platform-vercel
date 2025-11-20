import { create } from 'zustand';

import { UUID } from '@/lib/types/auth';
import { ICharacterPerformance, ICharactersStats } from '@/lib/types/dashboard';

interface CharacterCreateData {
  name: string;
  image?: string;
  voice_id?: string;
  first_message?: string;
  system_prompt?: string;
}

interface CharactersStore {
  // State
  agentPerformances: ICharacterPerformance[];
  stats: ICharactersStats | null;
  isLoading: boolean;
  hasLoaded: boolean;
  isCreating: boolean;
  canCreate: boolean;
  isCheckingPermission: boolean;
  error: string | null;
  
  // Actions
  getAgents: () => Promise<void>;
  checkCreationPermission: () => Promise<boolean>;
  createAgent: (data: CharacterCreateData) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAgentsStore = create<CharactersStore>((set, get) => ({
  // Initial state
  agentPerformances: [],
  stats: null,
  isLoading: false,
  hasLoaded: false,
  isCreating: false,
  canCreate: false,
  isCheckingPermission: false,
  error: null,

  // Actions
  getAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/agents', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch agents');
      }

      const { agents, stats } = await response.json();

      // Transform agents data to match ICharacterPerformance interface
      const transformedAgents = (agents || []).map((agent: any) => ({
        assistant_uuid: agent.uuid,
        assistant_avatar_url: agent.image || '/defaultcharacter.png',
        assistant_name: agent.name,
        assistant_purpose: agent.system_prompt || '',
        percentPositive: agent.stats?.percentPositive || 0,
        emptyCount: 0,
        successCount: agent.stats?.successCount || 0,
        totalCount: agent.stats?.totalCount || 0
      }));

      set({
        agentPerformances: transformedAgents,
        stats: stats || null,
        isLoading: false,
        hasLoaded: true,
        error: null
      });
    } catch (error: any) {
      set({
        isLoading: false,
        hasLoaded: true,
        error: error.message || 'Failed to fetch agents'
      });
      throw error;
    }
  },

  checkCreationPermission: async () => {
    // For now, always allow creation
    // TODO: Implement billing/plan limits
    set({
      canCreate: true,
      isCheckingPermission: false,
      error: null
    });
    return true;
  },

  createAgent: async (data: CharacterCreateData) => {
    set({ isCreating: true, error: null });
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create agent');
      }

      // Refresh the agents list after successful creation
      await get().getAgents();

      set({
        isCreating: false,
        error: null
      });
    } catch (error: any) {
      set({
        isCreating: false,
        error: error.message || 'Failed to create agent'
      });
      throw error;
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
})); 