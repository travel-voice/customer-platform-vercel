export type UUID = string;

export interface IUser {
  uuid: UUID;
  created_at: string;
  updated_at: string;
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  role?: 'admin' | 'customer';
  avatar?: string;
  organisation_uuid: UUID;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  user: IUser;
  csrf_token: string;
}

export interface IRegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  organisation_name: string;
  password: string;
}

export interface IRegisterResponse {
  user: IUser;
  csrf_token?: string;
}

export interface IResetPasswordRequest {
  password: string;
  token: string;
}

export interface IAuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isEmailSent: boolean;
  isPasswordChanged: boolean;
  isVerificationInProgress: boolean;
} 