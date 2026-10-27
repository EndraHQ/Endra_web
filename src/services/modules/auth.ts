import { request, formatApiPhone, ApiError } from '../client';

export interface MobileUserRegisterSchema {
  phone_number?: string;
  email?: string;
  password: string;
  full_name?: string;
}

export interface MobileUserLoginSchema {
  phone_number?: string;
  email?: string;
  identifier?: string;
  password: string;
}

export interface MobileUserResponseSchema {
  id: number;
  full_name?: string | null;
  phone_number?: string | null;
  email?: string | null;
  is_phone_verified: boolean;
  is_email_verified: boolean;
  has_setup_pins: boolean;
  primary_use_case?: string | null;
  account_setup_step: number;
  is_onboarding_completed: boolean;
  location_permission_granted: boolean;
  push_notifications_granted: boolean;
  background_activity_granted: boolean;
  fcm_device_token?: string | null;
  is_active: boolean;
}

export interface SendPhoneOTPRequestSchema {
  phone_number: string;
}

export interface VerifyPhoneOTPRequestSchema {
  phone_number: string;
  otp_code: string;
}

export interface SendEmailOTPRequestSchema {
  email: string;
}

export interface VerifyEmailOTPRequestSchema {
  email: string;
  otp_code: string;
}

export interface OTPStatusResponseSchema {
  message: string;
  success: boolean;
}

export interface SelectUseCaseRequestSchema {
  user_id: number;
  use_case?: 'estate_resident' | 'independent_homeowner' | 'commercial_client' | string;
  primary_use_case?: string;
}

export interface UpdateAppPermissionsSchema {
  user_id: number;
  location_permission_granted?: boolean;
  push_notifications_granted?: boolean;
  background_activity_granted?: boolean;
  fcm_device_token?: string | null;
}

export interface UpdateAccountSetupStepSchema {
  user_id: number;
  step: number;
}

export interface CompleteOnboardingSchema {
  user_id: number;
}

export interface LogoutResponseSchema {
  message: string;
  success: boolean;
}

export const authService = {
  /**
   * Register Mobile User: POST /api/v1/mobile/auth/register
   */
  async register(payload: MobileUserRegisterSchema): Promise<MobileUserResponseSchema> {
    return request<MobileUserResponseSchema>('/api/v1/mobile/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        phone_number: payload.phone_number ? formatApiPhone(payload.phone_number) : undefined,
        email: payload.email?.trim().toLowerCase()
      })
    });
  },

  /**
   * Send Phone OTP: POST /api/v1/mobile/auth/send-phone-otp
   */
  async sendPhoneOtp(payload: SendPhoneOTPRequestSchema): Promise<OTPStatusResponseSchema> {
    return request<OTPStatusResponseSchema>('/api/v1/mobile/auth/send-phone-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: formatApiPhone(payload.phone_number)
      })
    });
  },

  /**
   * Verify Phone OTP: POST /api/v1/mobile/auth/verify-phone-otp
   */
  async verifyPhoneOtp(payload: VerifyPhoneOTPRequestSchema): Promise<OTPStatusResponseSchema> {
    return request<OTPStatusResponseSchema>('/api/v1/mobile/auth/verify-phone-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: formatApiPhone(payload.phone_number),
        otp_code: payload.otp_code.trim()
      })
    });
  },

  /**
   * Send Email OTP: POST /api/v1/mobile/auth/send-email-otp
   */
  async sendEmailOtp(payload: SendEmailOTPRequestSchema): Promise<OTPStatusResponseSchema> {
    return request<OTPStatusResponseSchema>('/api/v1/mobile/auth/send-email-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase()
      })
    });
  },

  /**
   * Verify Email OTP: POST /api/v1/mobile/auth/verify-email-otp
   */
  async verifyEmailOtp(payload: VerifyEmailOTPRequestSchema): Promise<OTPStatusResponseSchema> {
    return request<OTPStatusResponseSchema>('/api/v1/mobile/auth/verify-email-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        otp_code: payload.otp_code.trim()
      })
    });
  },

  /**
   * Login user: POST /api/v1/mobile/auth/login
   */
  async login(payload: MobileUserLoginSchema): Promise<MobileUserResponseSchema> {
    const body: Record<string, any> = { password: payload.password };
    if (payload.email) {
      body.email = payload.email.trim().toLowerCase();
    }
    if (payload.phone_number) {
      body.phone_number = formatApiPhone(payload.phone_number);
    }
    if (!body.email && !body.phone_number && payload.identifier) {
      const ident = payload.identifier.trim();
      if (ident.includes('@')) {
        body.email = ident.toLowerCase();
      } else {
        body.phone_number = formatApiPhone(ident);
      }
    }
    return request<MobileUserResponseSchema>('/api/v1/mobile/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  /**
   * Primary Use Case: POST /api/v1/mobile/auth/select-use-case
   */
  async selectUseCase(payload: SelectUseCaseRequestSchema): Promise<MobileUserResponseSchema> {
    return request<MobileUserResponseSchema>('/api/v1/mobile/auth/select-use-case', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Update Account Setup Step: POST /api/v1/mobile/auth/update-setup-step
   */
  async updateSetupStep(payload: UpdateAccountSetupStepSchema): Promise<MobileUserResponseSchema> {
    return request<MobileUserResponseSchema>('/api/v1/mobile/auth/update-setup-step', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Update Permissions: POST /api/v1/mobile/auth/update-permissions
   */
  async updatePermissions(payload: UpdateAppPermissionsSchema): Promise<MobileUserResponseSchema> {
    return request<MobileUserResponseSchema>('/api/v1/mobile/auth/update-permissions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Complete Onboarding: POST /api/v1/mobile/auth/complete-onboarding
   */
  async completeOnboarding(payload: CompleteOnboardingSchema): Promise<MobileUserResponseSchema> {
    return request<MobileUserResponseSchema>('/api/v1/mobile/auth/complete-onboarding', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Logout Mobile User: POST /api/v1/mobile/auth/logout?user_id={userId}
   */
  async logout(userId: number): Promise<LogoutResponseSchema> {
    return request<LogoutResponseSchema>(`/api/v1/mobile/auth/logout?user_id=${userId}`, {
      method: 'POST'
    });
  },

  /**
   * Session Validation against backend:
   * Validates if the user profile actually exists in the database.
   * Returns valid: true if authenticated profile is confirmed.
   * Returns valid: false if backend responds 401/404 (user profile does not exist).
   * Throws on transient network drops/timeouts so caller can distinguish offline state from invalid session.
   */
  async validateSession(userId: number, timeoutMs = 8000): Promise<boolean> {
    try {
      await request<any>('/api/v1/mobile/properties', {
        method: 'GET',
        userId,
        timeoutMs
      });
      return true;
    } catch (err: any) {
      if ((err instanceof ApiError && (err.statusCode === 401 || err.statusCode === 404)) || err?.statusCode === 401 || err?.statusCode === 404) {
        return false;
      }
      throw err;
    }
  }
};
