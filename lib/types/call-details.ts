
// Call details from transcripts API - updated to match actual response
export interface ICallDetails {
  id: string;
  assistantId: string;
  datetime: string;
  duration: number;
  summary: string;
  sentiment: string; // "Neutral", "Positive", "Negative" as strings
  transcript: Array<{
    role: string; // "system", "bot", "user"
    time: string;
    endTime: string | null;
    message: string;
    secondsFromStart?: number;
  }>;
  recording_url: string;
  customer_data: {
    first_name: string | null;
    sur_name: string | null;
    email_address: string | null;
    business_name: string | null;
    telephone: string | null;
    domain_url: string | null;
    postcode: string | null;
  };
  analysis?: {
    summary: string;
    structuredData?: Record<string, any>;
    successEvaluation?: string;
  };
}

// Transformed call details for display
export interface ICallRecord {
  id: string;
  uuid: string;
  date: Date;
  duration: number;
  characterName: string;
  characterId: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  audioUrl: string;
  messages: Array<{
    role: 'user' | 'assistant';
    message: string;
    timestamp?: Date;
  }>;
  summary: string;
  structuredData?: Record<string, any>;
  caller?: {
    id?: string;
    name?: string;
    phone?: string;
    firstName?: string | null;
    surname?: string | null;
    email?: string | null;
    businessName?: string | null;
    domainUrl?: string | null;
    postcode?: string | null;
  };
} 