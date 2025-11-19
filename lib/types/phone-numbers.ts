export interface PhoneNumberRecord {
  uuid: string;
  phone_number: string;
  assistant_name: string | null;
  assistant_uuid: string | null;
}

export interface PhoneNumberResponse {
  phone_numbers: PhoneNumberRecord[];
}

// Legacy interface for backward compatibility
export interface PhoneNumber {
  id: number;
  uuid: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  is_active: boolean;
  comments: string | null;
  organisation_id: number;
  phone_number: string;
  phone_number_type: string;
  phone_number_sid: string;
  assistant?: {
    id: string;
    name: string;
    uuid: string;
  } | null;
}