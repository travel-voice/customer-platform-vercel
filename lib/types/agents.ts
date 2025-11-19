
// Data extraction schema and datapoints
export type DataPointType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean';

export interface IDataPoint {
  id: string; // e.g., "customer.first_name"
  label: string; // e.g., "First Name"
  description: string;
  category: string; // e.g., "Customer"
  tags?: string[]; // e.g., ["traveller", "contact"] - now optional
  type: DataPointType;
}

export interface IExtractionSchema {
  selectedIds: string[]; // array of IDataPoint.id
}

// Character detail from billing API
export interface ICharacterDetail {
  activation_id: string;
  avatar_url: string;
  booking_url: string;
  description: string;
  first_message: string;
  is_active: boolean;
  locale: string;
  model_id: number;
  name: string;
  organisation_id: number;
  retrieval_augmented_generation_uuid: string;
  system_prompt: string;
  uuid: string;
  voice_id: string;
  // Optional extraction schema describing which datapoints to extract post-call
  extraction_schema?: IExtractionSchema;
  
  // Advanced Configuration
  firstMessageMode?: "assistant-speaks-first" | "assistant-waits-for-user";
  waitTimeBeforeSpeaking?: number;
  interruptionThreshold?: number;
  maxDuration?: number;
  transcriptionLanguage?: string;
  confidenceThreshold?: number;
  modelTemperature?: number;
  maxTokens?: number;
  voicemailDetectionEnabled?: boolean;
  voicemailMessage?: string;
  beepMaxAwaitSeconds?: number;
  backgroundSound?: string;
}

// Character stats from transcripts API
export interface ICharacterStats {
  assistant_uuid: string;
  assistant_avatar_url: string;
  assistant_name: string;
  assistant_purpose: string;
  percentPositive: number;
  emptyCount: number;
  successCount: number;
  totalCount: number;
  pieChart: {
    pos: number;
    neu: number;
    neg: number;
  };
}

// Voice option
export interface IVoice {
  id: string;
  name: string;
  gender: string;
  age: string;
  accent: string;
}

// Update request body
export interface ICharacterUpdateRequest {
  name?: string;
  image_data?: string;
  first_message?: string;
  system_prompt?: string;
  voice_id?: string;
  firstMessageMode?: "assistant-speaks-first" | "assistant-waits-for-user";
  waitTimeBeforeSpeaking?: number;
  interruptionThreshold?: number;
  maxDuration?: number;
  transcriptionLanguage?: string;
  confidenceThreshold?: number;
  modelTemperature?: number;
  maxTokens?: number;
  voicemailDetectionEnabled?: boolean;
  voicemailMessage?: string;
  beepMaxAwaitSeconds?: number;
  backgroundSound?: string;
  // Persist selected datapoints to extract
  extraction_schema?: IExtractionSchema;
}

// Available voices list (static data from the original app)
export const VOICES_LIST: IVoice[] = [
  { id: 'lcMyyd2HUfFzxdCaC4Ta', name: 'Sarah', gender: 'Female', age: 'Middle Aged', accent: 'British' },
  { id: '19STyYD15bswVz51nqLf', name: 'Ana', gender: 'Female', age: 'Young Adult', accent: 'British' },
  { id: 'Se2Vw1WbHmGbBbyWTuu4', name: 'Amelia', gender: 'Female', age: 'Young Adult', accent: 'British' },
  { id: 'ZF6FPAbjXT4488VcRRnw', name: 'Daniel', gender: 'Male', age: 'Middle Aged', accent: 'British' },
  { id: 'kmSVBPu7loj4ayNinwWM', name: 'Archie', gender: 'Male', age: 'Young Adult', accent: 'British' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Joe', gender: 'Male', age: 'Middle Aged', accent: 'British' },
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Ella', gender: 'Female', age: 'Young', accent: 'American' },
  { id: 'Ky9j3wxFbp3dSAdrkOEv', name: 'Eleanor', gender: 'Female', age: 'Old', accent: 'British' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Betty', gender: 'Female', age: 'Middle', accent: 'British' },
  { id: 'PxiDzTegwYFeWabJ8mEd', name: 'Judith', gender: 'Female', age: 'Middle', accent: 'British' },
  { id: 'jsCqWAovK2LkecY7zXl4', name: 'Addie', gender: 'Female', age: 'Young', accent: 'British' },
  { id: 'L4so9SudEsIYzE9j4qlR', name: 'Angela', gender: 'Female', age: 'Old', accent: 'British' },
  { id: 'BNgbHR0DNeZixGQVzloa', name: 'Alexander', gender: 'Male', age: 'Old', accent: 'British' },
  { id: 'Tx7VLgfksXHVnoY6jDGU', name: 'Justin', gender: 'Male', age: 'Young', accent: 'British' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Robert', gender: 'Male', age: 'Old', accent: 'British' },
  { id: 'CZ1JCWXlwX5dmHx0XdiL', name: 'Neil', gender: 'Male', age: 'Young', accent: 'British' },
  { id: '70e4PKMb7PwQ98Hi1lBo', name: 'Jeremy', gender: 'Male', age: 'Middle', accent: 'British' },
  { id: 'dVoNx1XahVTpMFlwOciu', name: 'Gideon', gender: 'Male', age: 'Old', accent: 'British' },
  { id: 'aTbnroHRGIomiKpqAQR8', name: 'Emily', gender: 'Female', age: 'Middle Age', accent: 'British' },
  { id: 'aD6riP1btT197c6dACmy', name: 'Sophie', gender: 'Female', age: 'Young Adult', accent: 'British' },
  { id: 'wo6udizrrtpIxWGp2qJk', name: 'Terry', gender: 'Male', age: 'Middle Age', accent: 'British' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'James', gender: 'Male', age: 'Young Adult', accent: 'British' },
  { id: 'AXdMgz6evoL7OPd7eU12', name: 'Rebecca', gender: 'Female', age: 'Middle Age', accent: 'British' },
  { id: '1yiyKQi9kAGTjsuBuSvt', name: 'William', gender: 'Male', age: 'Middle Age', accent: 'British' },
  { id: 'KJF2ogTBPpTHWHAqRZrS', name: 'Callum', gender: 'Male', age: 'Young Adult', accent: 'British' },
  { id: 'kBag1HOZlaVBH7ICPE8x', name: 'Alex', gender: 'Female', age: 'Young Adult', accent: 'British' },
  { id: 'VG7zjqAT7O4FXCR57Wwv', name: 'Leo', gender: 'Male', age: 'Young Adult', accent: 'British' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Edward', gender: 'Male', age: 'Middle Age', accent: 'Welsh' },
  { id: 's7VgmkAoDwT6l2zXqEPV', name: 'Daniel', gender: 'Male', age: 'Middle Age', accent: 'British' },
  { id: '3XOBzXhnDY98yeWQ3GdM', name: 'Hunter', gender: 'Male', age: 'Young Adult', accent: 'American' },
  { id: 'XH7KR8MDn5xIMYpbfUTx', name: 'Holly', gender: 'Female', age: 'Young Adult', accent: 'British' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'George', gender: 'Male', age: 'Middle Age', accent: 'British' },
  { id: '2EiwWnXFnvU5JabPnv8n', name: 'Frederick', gender: 'Male', age: 'Old', accent: 'British' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Terry', gender: 'Male', age: 'Middle Age', accent: 'British' },
  { id: 'rCmVtv8cYU60uhlsOo1M', name: 'Grace', gender: 'Female', age: 'Middle Age', accent: 'British' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Charlotte', gender: 'Female', age: 'Young Adult', accent: 'British' },
  { id: 'aEO01A4wXwd1O8GPgGlF', name: 'Bethany', gender: 'Female', age: 'Middle Age', accent: 'British' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Laura', gender: 'Female', age: 'Middle Age', accent: 'British' },
  { id: '4CrZuIW9am7gYAxgo2Af', name: 'Pippa', gender: 'Female', age: 'Young Adult', accent: 'British' },
  { id: 'FA6HhUjVbervLw2rNl8M', name: 'Maria', gender: 'Female', age: 'Middle Age', accent: 'British' },
  { id: 'u8mYrrobJUV7LGGK3Ks5', name: 'Richard', gender: 'Male', age: 'Middle Age', accent: 'British' },
  { id: 'PdsF16KlCW9N0Ds8ASD0', name: 'Steven', gender: 'Male', age: 'Middle Age', accent: 'British' },
]; 