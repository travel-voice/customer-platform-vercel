/**
 * API Key Types
 * 
 * Security model:
 * - Raw keys are NEVER stored in the database
 * - Only SHA-256 hashes are stored for validation
 * - Key prefix and hint are stored for UI identification
 */

export interface IApiKey {
  uuid: string;
  organizationUuid: string;
  createdByUuid: string;
  
  // Identification (safe to display)
  name: string;
  keyPrefix: string; // First 12 chars: "tvsk_abc123..."
  keyHint: string;   // Last 4 chars: "...xyz9"
  
  // Permissions
  scopes: ApiKeyScope[];
  
  // Lifecycle
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  usageCount: number;
  
  // Metadata
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Key Scopes - define what actions a key can perform
 */
export type ApiKeyScope =
  | '*'              // Full access
  | 'agents:read'    // View agents
  | 'agents:write'   // Create/update/delete agents
  | 'calls:read'     // View call logs
  | 'calls:write'    // Manage call data
  | 'widget:config'  // Configure widget settings
  | 'org:read';      // View organization info

/**
 * Request to create a new API key
 */
export interface ICreateApiKeyRequest {
  name: string;
  description?: string;
  scopes?: ApiKeyScope[];
  expiresAt?: string; // ISO date string
}

/**
 * Response when creating a new API key
 * NOTE: rawKey is ONLY returned once, at creation time
 */
export interface ICreateApiKeyResponse {
  apiKey: Omit<IApiKey, 'lastUsedAt' | 'lastUsedIp' | 'usageCount' | 'updatedAt'>;
  rawKey: string; // The actual key - ONLY SHOWN ONCE
  warning: string;
}

/**
 * Request to update an API key
 */
export interface IUpdateApiKeyRequest {
  name?: string;
  description?: string;
  scopes?: ApiKeyScope[];
  isActive?: boolean;
}

/**
 * Result of API key validation
 */
export interface IApiKeyValidationResult {
  isValid: boolean;
  organizationUuid?: string;
  scopes?: ApiKeyScope[];
  keyUuid?: string;
  error?: string;
}

/**
 * API key usage log entry
 */
export interface IApiKeyUsageLog {
  uuid: string;
  apiKeyUuid: string;
  organizationUuid: string;
  endpoint: string;
  method: string;
  statusCode: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestAt: string;
  responseTimeMs: number | null;
}

/**
 * Scope presets for common use cases
 */
export const SCOPE_PRESETS = {
  FULL_ACCESS: ['*'] as ApiKeyScope[],
  READ_ONLY: ['agents:read', 'calls:read', 'org:read'] as ApiKeyScope[],
  AGENTS_ONLY: ['agents:read', 'agents:write'] as ApiKeyScope[],
  CALLS_ONLY: ['calls:read'] as ApiKeyScope[],
  WIDGET_INTEGRATION: ['agents:read', 'widget:config'] as ApiKeyScope[],
} as const;

