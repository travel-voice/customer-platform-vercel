import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import {
  ILoginRequest,
  IRegisterRequest,
  IResetPasswordRequest,
  IUser,
  UUID
} from '@/lib/types/auth';

interface AuthStore {
  // State
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isEmailSent: boolean;
  isPasswordChanged: boolean;
  isVerificationInProgress: boolean;

  // Actions
  login: (credentials: ILoginRequest) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: IRegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: IResetPasswordRequest) => Promise<void>;
  checkUserPaid: (organisationUuid: UUID) => Promise<boolean>;
  setError: (error: string | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
  performLogout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isEmailSent: false,
  isPasswordChanged: false,
  isVerificationInProgress: false,

  // Actions
  login: async (credentials: ILoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Login failed - no user returned');
      }

      // Fetch user profile from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('uuid', authData.user.id)
        .single();

      if (userError) {
        console.error('User profile fetch error:', userError);
        throw new Error(`Failed to fetch user profile: ${userError.message}`);
      }

      if (!userData) {
        console.error('No user profile found for user ID:', authData.user.id);
        throw new Error('User profile not found. Please contact support.');
      }

      const user: IUser = {
        uuid: userData.uuid,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        organisation_uuid: userData.organization_uuid,
        role: userData.role,
        avatar: userData.avatar,
        is_verified: authData.user.email_confirmed_at !== null,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };

      set({
        user,
        isAuthenticated: user.is_verified,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Login failed',
      });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // OAuth will redirect, so we don't set loading to false here
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Google sign-in failed',
      });
      throw error;
    }
  },

  register: async (data: IRegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();

      // 1. Sign up with Supabase (this WILL send confirmation email automatically)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            organisation_name: data.organisation_name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Registration failed - no user returned');
      }

      // 2. Create organization and user profile via API route
      const response = await fetch('/api/auth/complete-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: authData.user.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          organisation_name: data.organisation_name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete registration');
      }

      const { user } = await response.json();

      set({
        user,
        isLoading: false,
        error: null,
        isVerificationInProgress: true,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Registration failed',
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      window.location.href = '/auth/sign-in';
    } catch (error: any) {
      set({ isLoading: false });
      window.location.href = '/auth/sign-in';
    }
  },

  getCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const supabase = createClient();

      // Get authenticated user from Supabase
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('uuid', authData.user.id)
        .single();

      if (userError || !userData) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      const user: IUser = {
        uuid: userData.uuid,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        organisation_uuid: userData.organization_uuid,
        role: userData.role,
        avatar: userData.avatar,
        is_verified: authData.user.email_confirmed_at !== null,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };

      set({
        user,
        isAuthenticated: user.is_verified,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  sendVerificationEmail: async () => {
    try {
      const supabase = createClient();
      let currentUser = get().user;

      if (!currentUser) {
        await get().getCurrentUser();
        currentUser = get().user;
      }

      if (!currentUser?.email) {
        throw new Error('No user email found');
      }

      // Send OTP code via our API route
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: currentUser.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send verification code');
      }

      set({ isVerificationInProgress: true });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to send verification email',
      });
    }
  },

  verifyEmail: async (code: string) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const currentUser = get().user;

      if (!currentUser?.email) {
        throw new Error('No user email found');
      }

      // Verify email with OTP
      const { error } = await supabase.auth.verifyOtp({
        email: currentUser.email,
        token: code,
        type: 'signup',
      });

      if (error) {
        throw error;
      }

      // Update user verification status
      if (currentUser) {
        set({
          user: { ...currentUser, is_verified: true },
          isAuthenticated: true,
          isVerificationInProgress: false,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Verification failed',
      });
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      set({
        isEmailSent: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to send reset email',
      });
      throw error;
    }
  },

  resetPassword: async (data: IResetPasswordRequest) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();

      // Update password with new password
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        throw error;
      }

      set({
        isPasswordChanged: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to reset password',
      });
      throw error;
    }
  },

  checkUserPaid: async (organisationUuid: UUID) => {
    try {
      const supabase = createClient();

      // Check if organization has remaining time
      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('time_remaining_seconds')
        .eq('uuid', organisationUuid)
        .single();

      if (error || !orgData) {
        return false;
      }

      return orgData.time_remaining_seconds > 0;
    } catch (error) {
      console.error('Failed to check user payment status:', error);
      return false;
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),

  /**
   * Check if user is authenticated
   */
  checkAuth: async () => {
    // Don't check auth if we're already on an auth page
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/')) {
      set({ isLoading: false });
      return false;
    }

    set({ isLoading: true });

    try {
      await get().getCurrentUser();
      const user = get().user;
      return user !== null && user.is_verified;
    } catch (error: any) {
      console.log('Auth check error:', error.message);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  },

  /**
   * Internal logout function
   */
  performLogout: async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      // Ignore logout errors
    }

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Only redirect if not already on auth page
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
      window.location.href = '/auth/sign-in';
    }
  },
})); 