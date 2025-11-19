import { UUID } from './auth';

export interface IPeriod {
  id: number;
  period_start_utc: string;        // Will be mapped from start_date
  period_end_utc: string;          // Will be mapped from end_date
  usage_seconds: number;           // Total usage in seconds for current period
  total_seconds?: number;          // Total seconds in package (net_package_seconds)
  client_id: number;
  package_id: number;
  rMins: number;                   // Remaining minutes for current period
  rSecs: number;                   // Remaining seconds for current period (0-59)
  tMins: number;                   // Whole minutes in package
  tSecs: number;                   // Remaining seconds in package (0-59)
}

export interface ICharactersStats {
  total_successful_calls: number;
  call_dur_avg: number;
  pieChart: {
    pos: number;
    neu: number;
    neg: number;
  };
}

export interface ICharacterPerformance {
  assistant_uuid: string;
  assistant_avatar_url: string;
  assistant_name: string;
  assistant_purpose: string;
  percentPositive: number;
  emptyCount: number;
  successCount: number;
  totalCount: number;
}

export interface ICharacter {
  uuid: UUID;
  name: string;
  created_at: string;
  updated_at: string;
  description?: string;
  voice_id?: string;
  organisation_uuid: UUID;
}

export interface ITranscript {
  _id: string;
  id: string;
  createdAt: string;
  durationSeconds: number;
  assistantId: string;
  character_name: string;
  analysis: {
    sentimentScore: number;
  };
  stereoRecordingUrl: string;
  messages: Array<{
    role: string;
    message: string;
  }>;
  summary: string;
}

export interface ICallRecord {
  id: string;
  uuid: string;
  key: string;
  date: Date;
  duration: number;
  handler: {
    id: string;
    name: string;
  };
  sentiment: 'positive' | 'neutral' | 'negative';
  audio: string;
  messages: Array<{
    role: string;
    message: string;
  }>;
  summary: string;
} 