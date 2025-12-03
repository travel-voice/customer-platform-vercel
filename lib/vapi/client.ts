/**
 * Vapi API Client
 * Server-side client for interacting with Vapi API
 */

const VAPI_BASE_URL = 'https://api.vapi.ai';

interface VapiAssistant {
  id: string;
  name: string;
  model?: {
    provider: string;
    model: string;
    messages?: Array<{ role: string; content: string }>;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  };
  voice?: {
    provider: string;
    voiceId: string;
  };
  firstMessage?: string;
  firstMessageMode?: 'assistant-speaks-first' | 'assistant-waits-for-user';
  serverUrl?: string;
  maxDurationSeconds?: number;
  backgroundSound?: string;
  backgroundDenoisingEnabled?: boolean;
  voicemailDetection?: {
    provider: 'twilio' | 'vonage' | 'vapi';
    voicemailMessage?: string;
    enabled?: boolean;
    machineDetectionTimeout?: number;
  };
  transcriber?: {
    provider: string;
    language?: string;
  };
  artifactPlan?: {
    structuredOutputIds?: string[];
  };
  // Add other Vapi assistant properties as needed
}

interface CreateAssistantParams {
  name: string;
  firstMessage?: string;
  systemPrompt?: string;
  voiceId?: string;
  model?: string;
  serverUrl?: string;
  backgroundDenoisingEnabled?: boolean;
}

interface UpdateAssistantParams {
  name?: string;
  firstMessage?: string;
  systemPrompt?: string;
  voiceId?: string;
  model?: string;
  serverUrl?: string;
  artifactPlan?: {
    structuredOutputIds?: string[];
  };
  // Advanced settings
  firstMessageMode?: 'assistant-speaks-first' | 'assistant-waits-for-user';
  maxDurationSeconds?: number;
  backgroundSound?: string;
  backgroundDenoisingEnabled?: boolean;
  voicemailDetection?: {
    enabled: boolean;
    msg?: string; // machineDetectionMessage
    timeout?: number; // machineDetectionTimeout
  };
  transcriptionLanguage?: string;
  modelTemperature?: number;
  maxTokens?: number;
}

interface StructuredOutputSchema {
  type: "object";
  properties: Record<string, any>;
  required?: string[];
  description?: string;
}

interface CreateStructuredOutputParams {
  name: string;
  schema: StructuredOutputSchema;
}

interface UpdateStructuredOutputParams {
  name?: string;
  schema?: StructuredOutputSchema;
}

interface StructuredOutput {
  id: string;
  name: string;
  schema: StructuredOutputSchema;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

class VapiClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Vapi API key is required');
    }
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${VAPI_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vapi API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Create a new assistant in Vapi
   */
  async createAssistant(params: CreateAssistantParams): Promise<VapiAssistant> {
    const payload: any = {
      name: params.name,
      firstMessage: params.firstMessage || 'Hello! How can I help you today?',
      model: {
        provider: 'openai',
        model: params.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: params.systemPrompt || 'You are a helpful assistant.',
          },
        ],
      },
      voice: params.voiceId ? {
        provider: '11labs',
        voiceId: params.voiceId,
        model: 'eleven_turbo_v2_5',
      } : undefined,
      backgroundDenoisingEnabled: params.backgroundDenoisingEnabled ?? true,
    };

    if (params.serverUrl) {
      payload.serverUrl = params.serverUrl;
    }

    return this.request<VapiAssistant>('/assistant', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Update an existing assistant in Vapi
   */
  async updateAssistant(
    assistantId: string,
    params: UpdateAssistantParams
  ): Promise<VapiAssistant> {
    const payload: any = {};

    if (params.name) payload.name = params.name;
    if (params.firstMessage) payload.firstMessage = params.firstMessage;
    if (params.serverUrl) payload.serverUrl = params.serverUrl;
    if (params.artifactPlan) payload.artifactPlan = params.artifactPlan;
    
    // Advanced properties
    if (params.firstMessageMode) payload.firstMessageMode = params.firstMessageMode;
    if (params.maxDurationSeconds) payload.maxDurationSeconds = params.maxDurationSeconds;
    if (params.backgroundSound) payload.backgroundSound = params.backgroundSound === 'off' ? undefined : params.backgroundSound;
    if (params.backgroundDenoisingEnabled !== undefined) payload.backgroundDenoisingEnabled = params.backgroundDenoisingEnabled;

    if (params.voicemailDetection) {
      payload.voicemailDetection = {
        provider: 'twilio', // Default to Twilio for voicemail detection
        enabled: params.voicemailDetection.enabled,
      };
      // machineDetectionMessage is not supported by Vapi API currently
      // if (params.voicemailDetection.msg) {
      //   payload.voicemailDetection.machineDetectionMessage = params.voicemailDetection.msg;
      // }
      if (params.voicemailDetection.timeout) {
        payload.voicemailDetection.machineDetectionTimeout = params.voicemailDetection.timeout;
      }
    }

    if (params.transcriptionLanguage) {
        payload.transcriber = {
            provider: 'deepgram', // Default provider
            language: params.transcriptionLanguage
        };
    }

    // Model configuration
    if (params.systemPrompt || params.model || params.modelTemperature || params.maxTokens) {
      // We need to be careful not to overwrite existing model config if we don't have it.
      // But Vapi API requires full model object usually.
      // For this implementation, we reconstruct what we know.
      
      payload.model = {
        provider: 'openai',
        model: params.model || 'gpt-4o-mini',
        temperature: params.modelTemperature ?? 0.7,
        maxTokens: params.maxTokens ?? 250,
      };

      if (params.systemPrompt) {
        payload.model.messages = [
          {
            role: 'system',
            content: params.systemPrompt,
          },
        ];
      }
    }

    if (params.voiceId) {
      payload.voice = {
        provider: '11labs',
        voiceId: params.voiceId,
        model: 'eleven_turbo_v2_5',
      };
    }

    return this.request<VapiAssistant>(`/assistant/${assistantId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get an assistant by ID
   */
  async getAssistant(assistantId: string): Promise<VapiAssistant> {
    return this.request<VapiAssistant>(`/assistant/${assistantId}`, {
      method: 'GET',
    });
  }

  /**
   * Delete an assistant
   */
  async deleteAssistant(assistantId: string): Promise<void> {
    await this.request(`/assistant/${assistantId}`, {
      method: 'DELETE',
    });
  }

  /**
   * List all assistants
   */
  async listAssistants(): Promise<VapiAssistant[]> {
    return this.request<VapiAssistant[]>('/assistant', {
      method: 'GET',
    });
  }

  /**
   * Create a structured output configuration
   */
  async createStructuredOutput(params: CreateStructuredOutputParams): Promise<StructuredOutput> {
    return this.request<StructuredOutput>('/structured-output', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update a structured output configuration
   */
  async updateStructuredOutput(
    id: string,
    params: UpdateStructuredOutputParams
  ): Promise<StructuredOutput> {
    return this.request<StructuredOutput>(`/structured-output/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }
}

// Export a singleton instance
export const vapiClient = new VapiClient(process.env.VAPI_PRIVATE_KEY!);

// Export types
export type { 
  VapiAssistant, 
  CreateAssistantParams, 
  UpdateAssistantParams,
  StructuredOutput,
  CreateStructuredOutputParams,
  UpdateStructuredOutputParams,
  StructuredOutputSchema
};
