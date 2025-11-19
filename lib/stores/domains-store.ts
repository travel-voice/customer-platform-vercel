import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

import { UUID } from '@/lib/types/auth';
import { 
  IAddDomainRequest, 
  IDeleteDomainRequest,
  IDomain, 
  IEmbedScript
} from '@/lib/types/domains';

interface DomainsStore {
  // State
  domains: IDomain[];
  embedScript: IEmbedScript | null;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Actions
  getDomains: (organisationUuid: UUID) => Promise<void>;
  addDomain: (request: IAddDomainRequest) => Promise<void>;
  deleteDomain: (request: IDeleteDomainRequest) => Promise<void>;
  generateEmbedScript: () => IEmbedScript;
  copyToClipboard: (text: string) => Promise<boolean>;
  validateDomainFormat: (domain: string) => { isValid: boolean; error?: string };
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useDomainsStore = create<DomainsStore>((set, get) => ({
  // Initial state
  domains: [],
  embedScript: null,
  isLoading: false,
  isAdding: false,
  isDeleting: false,
  error: null,

  // Actions
  getDomains: async (organisationUuid: UUID) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('organization_uuid', organisationUuid)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Map to IDomain
      const domains: IDomain[] = (data || []).map((d: any) => ({
        uuid: d.uuid,
        domain: d.domain,
        is_verified: d.verification_status === 'verified',
        created_at: d.created_at,
        updated_at: d.updated_at,
        organisation_id: 1 // Legacy field
      }));
      
      set({ 
        domains,
        isLoading: false,
        error: null 
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch domains' 
      });
      throw error;
    }
  },

  addDomain: async (request: IAddDomainRequest) => {
    // Validate domain format first
    const validation = get().validateDomainFormat(request.domain);
    if (!validation.isValid) {
      set({ error: validation.error });
      throw new Error(validation.error!);
    }

    set({ isAdding: true, error: null });
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('domains')
        .insert({
            organization_uuid: request.organisationUuid,
            domain: request.domain,
            verification_status: 'pending'
        });

      if (error) {
          throw new Error(error.message);
      }
      
      // Refresh domains list after successful addition
      await get().getDomains(request.organisationUuid);
      
      set({ 
        isAdding: false,
        error: null 
      });
    } catch (error: any) {
      set({ 
        isAdding: false, 
        error: error.message || 'Failed to add domain' 
      });
      throw error;
    }
  },

  deleteDomain: async (request: IDeleteDomainRequest) => {
    set({ isDeleting: true, error: null });
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('uuid', request.domainUuid)
        .eq('organization_uuid', request.organisationUuid);

      if (error) {
          throw new Error(error.message);
      }
      
      // Refresh domains list after successful deletion
      await get().getDomains(request.organisationUuid);
      
      set({ 
        isDeleting: false,
        error: null 
      });
    } catch (error: any) {
      set({ 
        isDeleting: false, 
        error: error.message || 'Failed to delete domain' 
      });
      throw error;
    }
  },

  generateEmbedScript: (): IEmbedScript => {
    const scriptUrl = process.env.NEXT_PUBLIC_NV_SCRIPT_URL || 'https://app.neural-voice.ai/script.js';
    const content = `<script src="${scriptUrl}"></script>`;
    
    const embedScript = {
      scriptUrl,
      content
    };
    
    set({ embedScript });
    return embedScript;
  },

  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  },

  validateDomainFormat: (domain: string): { isValid: boolean; error?: string } => {
    if (!domain || domain.trim().length === 0) {
      return { isValid: false, error: 'Domain name is required' };
    }

    const trimmedDomain = domain.trim().toLowerCase();

    // Check if domain includes protocol
    if (trimmedDomain.startsWith('http://') || trimmedDomain.startsWith('https://')) {
      return { 
        isValid: false, 
        error: 'Please exclude the protocol (http/https) from the domain name' 
      };
    }

    // Check if domain includes trailing slash
    if (trimmedDomain.endsWith('/')) {
      return { 
        isValid: false, 
        error: 'Please exclude trailing slashes from the domain name' 
      };
    }

    // Basic domain format validation (simplified)
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(trimmedDomain)) {
      return { 
        isValid: false, 
        error: 'Please enter a valid domain name (e.g., app.neural-voice.ai)' 
      };
    }

    return { isValid: true };
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
