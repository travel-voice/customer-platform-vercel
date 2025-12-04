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
    toolIds?: string[];
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
  modelProvider?: string;
  modelTemperature?: number;
  maxTokens?: number;
  toolIds?: string[];
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

interface VapiFile {
  id: string;
  orgId: string;
  name: string;
  url: string;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

interface VapiTool {
  id: string;
  type: string;
  function?: {
    name: string;
    description?: string;
    parameters?: any;
  };
  knowledgeBases?: Array<{
    provider: string;
    name: string;
    model?: string;
    description?: string;
    fileIds: string[];
  }>;
}

interface CreateToolParams {
  type: 'query' | 'function' | 'dtmf' | 'endCall' | 'transferCall';
  function?: {
    name: string;
    description?: string;
    parameters?: any;
  };
  knowledgeBases?: Array<{
    provider: string;
    name: string;
    model?: string;
    description?: string;
    fileIds: string[];
  }>;
  async?: boolean;
  messages?: Array<{
    type: string;
    content: string;
  }>;
}

interface VapiPhoneNumber {
  id: string;
  orgId: string;
  number: string;
  provider: string;
  assistantId?: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

interface ImportTwilioNumberParams {
  provider: 'twilio';
  number: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  name?: string;
  assistantId?: string;
}

interface UpdatePhoneNumberParams {
  name?: string;
  assistantId?: string | null;
}

interface OutboundCallParams {
  assistantId: string;
  phoneNumberId: string;
  customer: {
    number: string;
    name?: string;
    extension?: string;
  };
  assistantOverrides?: {
    variableValues?: Record<string, string | number | boolean>;
    firstMessage?: string;
    recordingEnabled?: boolean;
  };
}

interface VapiCall {
  id: string;
  orgId: string;
  type: 'inbound' | 'outbound' | 'web';
  assistantId?: string;
  phoneNumberId?: string;
  customer?: {
    number?: string;
    name?: string;
  };
  status: string;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  costBreakdown?: Record<string, any>;
  messages?: Array<any>;
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  analysis?: Record<string, any>;
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

    // Prepare headers
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      ...((options.headers as Record<string, string>) || {}),
    };

    // Only set Content-Type if body is not FormData (fetch handles multipart automatically)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
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
    if (params.systemPrompt || params.model || params.modelTemperature || params.maxTokens || params.toolIds || params.modelProvider) {
      
      payload.model = {
        provider: params.modelProvider || 'openai',
        model: params.model || 'gpt-4o-mini',
        temperature: params.modelTemperature ?? 0.7,
        maxTokens: params.maxTokens ?? 250,
      };

      if (params.toolIds) {
        payload.model.toolIds = params.toolIds;
      }

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

  /**
   * Upload a file to Vapi
   */
  async uploadFile(file: File): Promise<VapiFile> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<VapiFile>('/file', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Delete a file from Vapi
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.request(`/file/${fileId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Create a tool
   */
  async createTool(params: CreateToolParams): Promise<VapiTool> {
    return this.request<VapiTool>('/tool', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update a tool
   */
  async updateTool(toolId: string, params: Partial<CreateToolParams>): Promise<VapiTool> {
    return this.request<VapiTool>(`/tool/${toolId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  /**
   * List tools
   */
  async listTools(): Promise<VapiTool[]> {
    return this.request<VapiTool[]>('/tool', {
      method: 'GET',
    });
  }
  
  /**
   * Get tool
   */
  async getTool(toolId: string): Promise<VapiTool> {
      return this.request<VapiTool>(`/tool/${toolId}`, {
          method: 'GET'
      });
  }

  // Phone Number Methods

  /**
   * Import a Twilio phone number into Vapi
   */
  async importTwilioPhoneNumber(params: ImportTwilioNumberParams): Promise<VapiPhoneNumber> {
    return this.request<VapiPhoneNumber>('/phone-number', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update a phone number (e.g. assign assistant)
   */
  async updatePhoneNumber(
    phoneNumberId: string,
    params: UpdatePhoneNumberParams
  ): Promise<VapiPhoneNumber> {
    return this.request<VapiPhoneNumber>(`/phone-number/${phoneNumberId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  /**
   * List phone numbers
   */
  async listPhoneNumbers(): Promise<VapiPhoneNumber[]> {
    return this.request<VapiPhoneNumber[]>('/phone-number', {
      method: 'GET',
    });
  }

  /**
   * Delete phone number
   */
  async deletePhoneNumber(phoneNumberId: string): Promise<void> {
    await this.request(`/phone-number/${phoneNumberId}`, {
      method: 'DELETE',
    });
  }

  // Outbound Call Methods

  /**
   * Create an outbound phone call
   * 
   * @param params Call parameters including assistant, phone number, customer, and variables
   * @returns Call object with ID and status
   */
  async createOutboundCall(params: OutboundCallParams): Promise<VapiCall> {
    return this.request<VapiCall>('/call', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get call details by ID
   */
  async getCall(callId: string): Promise<VapiCall> {
    return this.request<VapiCall>(`/call/${callId}`, {
      method: 'GET',
    });
  }

  /**
   * List calls with optional filters
   */
  async listCalls(params?: {
    assistantId?: string;
    phoneNumberId?: string;
    limit?: number;
  }): Promise<VapiCall[]> {
    const queryParams = new URLSearchParams();
    if (params?.assistantId) queryParams.append('assistantId', params.assistantId);
    if (params?.phoneNumberId) queryParams.append('phoneNumberId', params.phoneNumberId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/call?${query}` : '/call';

    return this.request<VapiCall[]>(endpoint, {
      method: 'GET',
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
  StructuredOutputSchema,
  VapiFile,
  VapiTool,
  CreateToolParams,
  VapiPhoneNumber,
  ImportTwilioNumberParams,
  UpdatePhoneNumberParams,
  OutboundCallParams,
  VapiCall
};
