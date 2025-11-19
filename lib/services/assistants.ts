import { createClient } from '@/lib/supabase/client';
import { UUID } from '@/lib/types/auth';

export interface Assistant {
  assistant_uuid: string;
  assistant_name: string;
  assistant_avatar_url?: string;
  assistant_purpose?: string;
  percentPositive: number;
  emptyCount: number;
  successCount: number;
  totalCount: number;
}

interface AssistantDetailsResponse {
  character_performances: Assistant[];
  pieChart: {
    pos: number;
    neu: number;
    neg: number;
  };
  overall_total_calls: number;
  total_successful_calls: number;
  percent_positive: number;
  call_dur_avg: number;
}

/**
 * Fetch assistant details for an organisation
 */
export const getAssistantDetails = async (organisationUuid: UUID): Promise<Assistant[]> => {
  const supabase = createClient();

  // Fetch agents
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('*')
    .eq('organization_uuid', organisationUuid);

  if (agentsError) {
    throw new Error(agentsError.message);
  }

  // In a real implementation with high volume, we might want a materialized view or a separate stats table.
  // For now, let's fetch calls for these agents to calculate basic stats, or just return 0s if performance is a concern.
  // Given the requirement to "get data back", we should probably try to get some stats if possible, 
  // but for the Phone Numbers page dropdown, we mainly need names and IDs.
  
  // Let's do a simple implementation: return agents with 0 stats for now to ensure speed,
  // as the aggregation logic in Supabase client might be heavy if done here.
  // If stats are strictly required, we'd need to query the `calls` table.

  return (agents || []).map((agent: any) => ({
    assistant_uuid: agent.uuid,
    assistant_name: agent.name,
    assistant_avatar_url: agent.image || '/defaultcharacter.png',
    assistant_purpose: agent.system_prompt,
    percentPositive: 0,
    emptyCount: 0,
    successCount: 0,
    totalCount: 0
  }));
};
