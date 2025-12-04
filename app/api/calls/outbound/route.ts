import { NextRequest, NextResponse } from 'next/server';
import { requireApiKey } from '@/lib/api-key-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { vapiClient } from '@/lib/vapi/client';

/**
 * POST /api/calls/outbound
 * 
 * Create an outbound phone call using Vapi
 * 
 * Authentication: API Key (Bearer token or X-API-Key header)
 * Required Scope: calls:write
 * 
 * Request Body:
 * {
 *   "assistantId": "uuid-of-your-assistant",  // Your database UUID
 *   "phoneNumberId": "uuid-of-your-phone-number",  // Your database UUID
 *   "customer": {
 *     "number": "+11231231234",  // E.164 format
 *     "name": "John Doe"  // Optional
 *   },
 *   "variables": {  // Optional - dynamic variables for the assistant
 *     "name": "John",
 *     "appointment_date": "January 15th",
 *     "custom_field": "any value"
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "callId": "vapi-call-id",
 *   "status": "queued"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate with API key and require calls:write scope
    const auth = await requireApiKey(req, 'calls:write');
    if ('error' in auth) {
      return auth.error;
    }

    const { organizationUuid } = auth;
    const supabase = createAdminClient();

    // Parse request body
    const body = await req.json();
    const { assistantId, phoneNumberId, customer, variables } = body;

    // Validate required fields
    if (!assistantId || !phoneNumberId || !customer?.number) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'assistantId, phoneNumberId, and customer.number are required',
        },
        { status: 400 }
      );
    }

    // Validate phone number format (basic E.164 check)
    if (!customer.number.match(/^\+[1-9]\d{1,14}$/)) {
      return NextResponse.json(
        {
          error: 'Invalid phone number format',
          details: 'Phone number must be in E.164 format (e.g., +11231231234)',
        },
        { status: 400 }
      );
    }

    // 1. Verify the assistant belongs to this organization and get Vapi ID
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('uuid, vapi_assistant_id, name')
      .eq('uuid', assistantId)
      .eq('organization_uuid', organizationUuid)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        {
          error: 'Assistant not found',
          details: 'The specified assistant does not exist or does not belong to your organization',
        },
        { status: 404 }
      );
    }

    if (!agent.vapi_assistant_id) {
      return NextResponse.json(
        {
          error: 'Assistant not configured',
          details: 'This assistant has not been synced with Vapi',
        },
        { status: 400 }
      );
    }

    // 2. Verify the phone number belongs to this organization and get Vapi ID
    const { data: phoneNumber, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('uuid, provider_id, phone_number, agent_uuid')
      .eq('uuid', phoneNumberId)
      .eq('organization_uuid', organizationUuid)
      .eq('status', 'active')
      .single();

    if (phoneError || !phoneNumber) {
      return NextResponse.json(
        {
          error: 'Phone number not found',
          details: 'The specified phone number does not exist, is inactive, or does not belong to your organization',
        },
        { status: 404 }
      );
    }

    if (!phoneNumber.provider_id) {
      return NextResponse.json(
        {
          error: 'Phone number not configured',
          details: 'This phone number has not been imported to Vapi',
        },
        { status: 400 }
      );
    }

    // 3. Make the outbound call via Vapi
    const callParams: any = {
      assistantId: agent.vapi_assistant_id,
      phoneNumberId: phoneNumber.provider_id,
      customer: {
        number: customer.number,
        ...(customer.name && { name: customer.name }),
      },
    };

    // Add variables if provided
    if (variables && Object.keys(variables).length > 0) {
      callParams.assistantOverrides = {
        variableValues: variables,
      };
    }

    const vapiCall = await vapiClient.createOutboundCall(callParams);

    // 4. Return success response
    return NextResponse.json({
      success: true,
      callId: vapiCall.id,
      status: vapiCall.status,
      assistant: {
        id: agent.uuid,
        name: agent.name,
      },
      phoneNumber: {
        id: phoneNumber.uuid,
        number: phoneNumber.phone_number,
      },
      customer: {
        number: customer.number,
        name: customer.name || null,
      },
    });

  } catch (error: any) {
    console.error('Outbound call error:', error);

    // Handle Vapi-specific errors
    if (error.message?.includes('Vapi API error')) {
      return NextResponse.json(
        {
          error: 'Failed to initiate call',
          details: error.message,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

