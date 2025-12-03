import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateApiKey, API_KEY_SCOPES } from '@/lib/api-keys';

/**
 * GET /api/api-keys
 * List all API keys for the authenticated user's organization
 * Note: Does NOT return the actual key or hash - only metadata
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_uuid, role')
      .eq('uuid', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get all API keys for this organization (excluding the hash for security)
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select(`
        uuid,
        name,
        key_prefix,
        key_hint,
        scopes,
        is_active,
        expires_at,
        last_used_at,
        usage_count,
        description,
        created_at,
        created_by_uuid,
        users!api_keys_created_by_uuid_fkey (
          first_name,
          last_name
        )
      `)
      .eq('organization_uuid', userData.organization_uuid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data for the frontend
    const transformedKeys = (apiKeys || []).map(key => ({
      uuid: key.uuid,
      name: key.name,
      keyPrefix: key.key_prefix,
      keyHint: key.key_hint,
      scopes: key.scopes,
      isActive: key.is_active,
      expiresAt: key.expires_at,
      lastUsedAt: key.last_used_at,
      usageCount: key.usage_count,
      description: key.description,
      createdAt: key.created_at,
      createdBy: key.users ? `${(key.users as any).first_name} ${(key.users as any).last_name}` : 'Unknown',
    }));

    return NextResponse.json({
      apiKeys: transformedKeys,
      availableScopes: Object.entries(API_KEY_SCOPES).map(([key, value]) => ({
        key,
        value,
      })),
    });
  } catch (error: any) {
    console.error('Get API keys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/api-keys
 * Create a new API key
 * 
 * IMPORTANT: The raw key is returned ONLY in this response.
 * It cannot be retrieved again - only the hash is stored.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization and verify admin role
    const { data: userData } = await supabase
      .from('users')
      .select('organization_uuid, role')
      .eq('uuid', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only admins can create API keys
    if (userData.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can create API keys' }, { status: 403 });
    }

    const body = await request.json();
    const { name, scopes = ['*'], expiresAt, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 });
    }

    // Validate scopes
    const validScopes = Object.values(API_KEY_SCOPES);
    for (const scope of scopes) {
      if (!validScopes.includes(scope)) {
        return NextResponse.json({ error: `Invalid scope: ${scope}` }, { status: 400 });
      }
    }

    // Generate the API key
    const { rawKey, keyHash, keyPrefix, keyHint } = generateApiKey();

    // Store in database (only the hash, never the raw key)
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert({
        organization_uuid: userData.organization_uuid,
        created_by_uuid: user.id,
        name: name.trim(),
        key_prefix: keyPrefix,
        key_hint: keyHint,
        key_hash: keyHash,
        scopes,
        expires_at: expiresAt || null,
        description: description?.trim() || null,
      })
      .select(`
        uuid,
        name,
        key_prefix,
        key_hint,
        scopes,
        is_active,
        expires_at,
        description,
        created_at
      `)
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the key data INCLUDING the raw key (only time it's ever returned!)
    return NextResponse.json({
      apiKey: {
        uuid: apiKey.uuid,
        name: apiKey.name,
        keyPrefix: apiKey.key_prefix,
        keyHint: apiKey.key_hint,
        scopes: apiKey.scopes,
        isActive: apiKey.is_active,
        expiresAt: apiKey.expires_at,
        description: apiKey.description,
        createdAt: apiKey.created_at,
      },
      // THE RAW KEY - ONLY RETURNED HERE, NEVER AGAIN!
      rawKey,
      warning: 'Store this key securely. It will not be shown again.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

