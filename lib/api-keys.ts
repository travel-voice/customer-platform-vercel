import crypto from 'crypto';

/**
 * API Key Security Utilities
 * 
 * Security Design:
 * - Keys are generated with 32 bytes of cryptographic randomness (256 bits of entropy)
 * - Keys are prefixed for easy identification: tvsk_ (TravelVoice Secret Key)
 * - Only the SHA-256 hash is stored in the database
 * - The raw key is shown exactly ONCE at creation time
 * - Key prefix and hint are stored for UI identification
 */

// Key prefix for Travel Voice Secret Keys
const KEY_PREFIX = 'tvsk_';

// Possible permission scopes
export const API_KEY_SCOPES = {
  // Full access
  ALL: '*',
  
  // Agent scopes
  AGENTS_READ: 'agents:read',
  AGENTS_WRITE: 'agents:write',
  
  // Call scopes
  CALLS_READ: 'calls:read',
  CALLS_WRITE: 'calls:write',
  
  // Widget configuration
  WIDGET_CONFIG: 'widget:config',
  
  // Organization info (limited)
  ORG_READ: 'org:read',
} as const;

export type ApiKeyScope = typeof API_KEY_SCOPES[keyof typeof API_KEY_SCOPES];

// Predefined scope sets for common use cases
export const SCOPE_PRESETS = {
  FULL_ACCESS: ['*'],
  READ_ONLY: ['agents:read', 'calls:read', 'org:read'],
  AGENTS_ONLY: ['agents:read', 'agents:write'],
  CALLS_ONLY: ['calls:read'],
  WIDGET_INTEGRATION: ['agents:read', 'widget:config'],
} as const;

export interface GeneratedApiKey {
  // The raw key - ONLY returned at creation time, never stored
  rawKey: string;
  // The hash to store in the database
  keyHash: string;
  // First 12 characters for display (e.g., "tvsk_abc123ef...")
  keyPrefix: string;
  // Last 4 characters for identification (e.g., "...xyz9")
  keyHint: string;
}

/**
 * Generate a new API key with cryptographic security
 * 
 * The key format is: tvsk_<32 bytes of random data in base62>
 * Total length: ~48 characters
 * 
 * @returns Object containing the raw key (show once), hash (store), prefix and hint (for UI)
 */
export function generateApiKey(): GeneratedApiKey {
  // Generate 32 bytes of cryptographically secure random data
  const randomBytes = crypto.randomBytes(32);
  
  // Convert to base62 (alphanumeric) for URL-safety and readability
  // Base62 = 0-9, a-z, A-Z
  const base62Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomPart = '';
  
  for (const byte of randomBytes) {
    randomPart += base62Chars[byte % 62];
  }
  
  // Construct the full key
  const rawKey = `${KEY_PREFIX}${randomPart}`;
  
  // Create SHA-256 hash for storage
  const keyHash = hashApiKey(rawKey);
  
  // Extract prefix and hint for display
  const keyPrefix = rawKey.substring(0, 12); // "tvsk_abc123e"
  const keyHint = rawKey.substring(rawKey.length - 4); // "...xyz9"
  
  return {
    rawKey,
    keyHash,
    keyPrefix,
    keyHint,
  };
}

/**
 * Hash an API key using SHA-256
 * This is a one-way operation - we can verify a key but never recover it
 * 
 * @param rawKey The raw API key to hash
 * @returns SHA-256 hash as a hex string
 */
export function hashApiKey(rawKey: string): string {
  return crypto
    .createHash('sha256')
    .update(rawKey, 'utf8')
    .digest('hex');
}

/**
 * Validate that a string looks like a valid API key format
 * This does NOT verify the key exists or is valid in the database
 * 
 * @param key The key to validate format
 * @returns true if the key has valid format
 */
export function isValidKeyFormat(key: string): boolean {
  // Must start with our prefix
  if (!key.startsWith(KEY_PREFIX)) {
    return false;
  }
  
  // Must be reasonable length (prefix + 32 random chars minimum)
  if (key.length < KEY_PREFIX.length + 32) {
    return false;
  }
  
  // Must only contain alphanumeric characters after prefix
  const randomPart = key.substring(KEY_PREFIX.length);
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  
  return alphanumericRegex.test(randomPart);
}

/**
 * Check if a scope grants access to a specific permission
 * 
 * @param userScopes The scopes the API key has
 * @param requiredScope The scope required for the action
 * @returns true if access is granted
 */
export function hasScope(userScopes: string[], requiredScope: string): boolean {
  // Wildcard grants all access
  if (userScopes.includes('*')) {
    return true;
  }
  
  // Check for exact scope match
  if (userScopes.includes(requiredScope)) {
    return true;
  }
  
  // Check for write scope implying read access
  // e.g., 'agents:write' implies 'agents:read'
  if (requiredScope.endsWith(':read')) {
    const writeScope = requiredScope.replace(':read', ':write');
    if (userScopes.includes(writeScope)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract API key from request headers
 * Supports both Authorization Bearer and X-API-Key headers
 * 
 * @param headers Request headers
 * @returns The API key if found, null otherwise
 */
export function extractApiKeyFromHeaders(headers: Headers): string | null {
  // Try Authorization header first (preferred)
  const authHeader = headers.get('authorization');
  if (authHeader) {
    // Support "Bearer <key>" format
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      return authHeader.substring(7).trim();
    }
    // Also support just the key directly
    if (authHeader.startsWith(KEY_PREFIX)) {
      return authHeader.trim();
    }
  }
  
  // Fall back to X-API-Key header
  const apiKeyHeader = headers.get('x-api-key');
  if (apiKeyHeader && apiKeyHeader.startsWith(KEY_PREFIX)) {
    return apiKeyHeader.trim();
  }
  
  return null;
}

/**
 * Mask an API key for safe display
 * Shows prefix and hint with dots in between
 * 
 * @param keyPrefix First part of the key
 * @param keyHint Last 4 characters
 * @returns Masked display string like "tvsk_abc1...xyz9"
 */
export function maskApiKey(keyPrefix: string, keyHint: string): string {
  return `${keyPrefix}...${keyHint}`;
}

/**
 * Get human-readable description for a scope
 */
export function getScopeDescription(scope: string): string {
  const descriptions: Record<string, string> = {
    '*': 'Full access to all resources',
    'agents:read': 'View agents and their configurations',
    'agents:write': 'Create, update, and delete agents',
    'calls:read': 'View call logs and transcripts',
    'calls:write': 'Manage call data',
    'widget:config': 'Configure widget settings',
    'org:read': 'View organization information',
  };
  
  return descriptions[scope] || scope;
}

