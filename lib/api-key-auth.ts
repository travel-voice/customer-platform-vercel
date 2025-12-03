import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { extractApiKeyFromHeaders, hashApiKey, hasScope, isValidKeyFormat } from '@/lib/api-keys';

/**
 * API Key Authentication Result
 */
export interface ApiKeyAuthResult {
  isValid: boolean;
  organizationUuid?: string;
  scopes?: string[];
  keyUuid?: string;
  error?: string;
}

/**
 * Validate an API key from request headers
 * 
 * This function:
 * 1. Extracts the API key from headers (Authorization or X-API-Key)
 * 2. Validates the key format
 * 3. Hashes the key and looks it up in the database
 * 4. Checks if the key is active and not expired
 * 5. Updates usage statistics
 * 6. Returns the organization UUID and scopes for authorization
 * 
 * @param request The incoming request
 * @param requiredScope Optional scope to check for authorization
 * @returns Authentication result with organization info or error
 */
export async function validateApiKey(
  request: NextRequest,
  requiredScope?: string
): Promise<ApiKeyAuthResult> {
  // Extract the API key from headers
  const apiKey = extractApiKeyFromHeaders(request.headers);
  
  if (!apiKey) {
    return {
      isValid: false,
      error: 'API key is required. Provide via Authorization header (Bearer <key>) or X-API-Key header.',
    };
  }
  
  // Validate key format before hitting the database
  if (!isValidKeyFormat(apiKey)) {
    return {
      isValid: false,
      error: 'Invalid API key format.',
    };
  }
  
  // Hash the key for database lookup
  const keyHash = hashApiKey(apiKey);
  
  // Use admin client to bypass RLS (API key requests don't have user sessions)
  const supabase = createAdminClient();
  
  // Get client info for logging
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  
  // Validate the key using our database function
  const { data, error } = await supabase.rpc('validate_api_key', {
    p_key_hash: keyHash,
    p_endpoint: endpoint,
    p_method: method,
    p_ip_address: ipAddress,
    p_user_agent: userAgent,
  });
  
  if (error) {
    console.error('API key validation error:', error);
    return {
      isValid: false,
      error: 'Failed to validate API key.',
    };
  }
  
  // The function returns a single row
  const result = data?.[0];
  
  if (!result || !result.is_valid) {
    return {
      isValid: false,
      error: result?.error_message || 'Invalid API key.',
    };
  }
  
  // Check scope if required
  if (requiredScope && !hasScope(result.scopes || [], requiredScope)) {
    return {
      isValid: false,
      organizationUuid: result.organization_uuid,
      scopes: result.scopes,
      keyUuid: result.key_uuid,
      error: `Insufficient permissions. Required scope: ${requiredScope}`,
    };
  }
  
  return {
    isValid: true,
    organizationUuid: result.organization_uuid,
    scopes: result.scopes,
    keyUuid: result.key_uuid,
  };
}

/**
 * Middleware helper for API key protected routes
 * 
 * Usage in an API route:
 * ```
 * const auth = await requireApiKey(request, 'agents:read');
 * if (auth.error) return auth.error;
 * // auth.organizationUuid is now available
 * ```
 */
export async function requireApiKey(
  request: NextRequest,
  requiredScope?: string
): Promise<{ organizationUuid: string; scopes: string[]; keyUuid: string } | { error: NextResponse }> {
  const result = await validateApiKey(request, requiredScope);
  
  if (!result.isValid) {
    return {
      error: NextResponse.json(
        { 
          error: result.error,
          code: 'UNAUTHORIZED',
        },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="API", error="invalid_token"',
          },
        }
      ),
    };
  }
  
  return {
    organizationUuid: result.organizationUuid!,
    scopes: result.scopes!,
    keyUuid: result.keyUuid!,
  };
}

/**
 * Check if a request has a valid API key (without requiring it)
 * Useful for routes that support both session and API key auth
 */
export async function checkApiKey(request: NextRequest): Promise<ApiKeyAuthResult | null> {
  const apiKey = extractApiKeyFromHeaders(request.headers);
  
  if (!apiKey) {
    return null; // No API key provided
  }
  
  return validateApiKey(request);
}

