import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { API_KEY_SCOPES } from '@/lib/api-keys';

/**
 * GET /api/api-keys/[keyId]
 * Get details for a specific API key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_uuid')
      .eq('uuid', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get the API key (verify it belongs to this organization)
    const { data: apiKey, error } = await supabase
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
        last_used_ip,
        usage_count,
        description,
        created_at,
        updated_at,
        created_by_uuid,
        users!api_keys_created_by_uuid_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('uuid', keyId)
      .eq('organization_uuid', userData.organization_uuid)
      .single();

    if (error || !apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({
      apiKey: {
        uuid: apiKey.uuid,
        name: apiKey.name,
        keyPrefix: apiKey.key_prefix,
        keyHint: apiKey.key_hint,
        scopes: apiKey.scopes,
        isActive: apiKey.is_active,
        expiresAt: apiKey.expires_at,
        lastUsedAt: apiKey.last_used_at,
        lastUsedIp: apiKey.last_used_ip,
        usageCount: apiKey.usage_count,
        description: apiKey.description,
        createdAt: apiKey.created_at,
        updatedAt: apiKey.updated_at,
        createdBy: apiKey.users ? {
          name: `${(apiKey.users as any).first_name} ${(apiKey.users as any).last_name}`,
          email: (apiKey.users as any).email,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Get API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/api-keys/[keyId]
 * Update an API key (name, description, scopes, active status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params;
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

    if (userData.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can update API keys' }, { status: 403 });
    }

    // Verify the key exists and belongs to this organization
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('uuid')
      .eq('uuid', keyId)
      .eq('organization_uuid', userData.organization_uuid)
      .single();

    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, scopes, isActive } = body;

    // Build update object
    const updates: Record<string, any> = {};

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json({ error: 'Key name cannot be empty' }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (scopes !== undefined) {
      // Validate scopes
      const validScopes = Object.values(API_KEY_SCOPES);
      for (const scope of scopes) {
        if (!validScopes.includes(scope)) {
          return NextResponse.json({ error: `Invalid scope: ${scope}` }, { status: 400 });
        }
      }
      updates.scopes = scopes;
    }

    if (isActive !== undefined) {
      updates.is_active = isActive;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Update the key
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('uuid', keyId)
      .select(`
        uuid,
        name,
        key_prefix,
        key_hint,
        scopes,
        is_active,
        expires_at,
        description,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating API key:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
        updatedAt: apiKey.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Update API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/api-keys/[keyId]
 * Permanently delete an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params;
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

    if (userData.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can delete API keys' }, { status: 403 });
    }

    // Delete the key (RLS will verify organization ownership)
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('uuid', keyId)
      .eq('organization_uuid', userData.organization_uuid);

    if (error) {
      console.error('Error deleting API key:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

