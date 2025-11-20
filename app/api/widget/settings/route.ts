import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // 1. Get Origin/Referer to identify the domain
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const requestUrl = origin || referer;

    if (!requestUrl) {
      return NextResponse.json(
        { error: 'Missing Origin or Referer header' },
        { status: 400 }
      );
    }

    // Normalize domain (remove protocol and path)
    // e.g., "https://www.example.com/path" -> "www.example.com"
    let domain = '';
    try {
      const url = new URL(requestUrl);
      domain = url.hostname;
    } catch (e) {
      // Fallback if not a valid URL
      domain = requestUrl.replace(/^https?:\/\//, '').split('/')[0];
    }

    console.log(`[Widget Settings] Checking domain: ${domain}`);

    // 2. Find the organization for this domain
    // We check for exact match first, but you might want to handle www/non-www
    const { data: domainRecord, error: domainError } = await supabase
      .from('domains')
      .select('organization_uuid, verification_status')
      .ilike('domain', domain) // Case-insensitive match
      .single();

    if (domainError || !domainRecord) {
      console.warn(`[Widget Settings] Domain not found: ${domain}`);
      return NextResponse.json(
        { error: 'Domain not registered' },
        { status: 403 }
      );
    }

    // Optional: Check verification status if you implement DNS verification later
    // if (domainRecord.verification_status !== 'verified') { ... }

    // 3. Fetch agents for the organization
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('organization_uuid', domainRecord.organization_uuid);

    if (agentsError) {
      console.error('[Widget Settings] Error fetching agents:', agentsError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // 4. Format response for nv-app
    // Structure: { agents: { [uuid]: settings }, publicKey: string }
    const agentsMap: Record<string, any> = {};

    agents.forEach((agent) => {
      if (agent.vapi_assistant_id) {
        agentsMap[agent.uuid] = {
          character: agent.name,
          character_image: agent.image || '',
          // The widget uses this 'voice_id' field to start the Vapi call
          voice_id: agent.vapi_assistant_id, 
          booking_url: '', // Add column to agents table if needed
          user_collection_fields: agent.data_extraction_config 
            ? Object.keys(agent.data_extraction_config) 
            : []
        };
      }
    });

    return NextResponse.json({
      agents: agentsMap,
      publicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || ''
    }, {
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error: any) {
    console.error('[Widget Settings] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

