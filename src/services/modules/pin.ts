import { request } from '../client';
import { OTPStatusResponseSchema } from './auth';

export interface SetUserPinsRequestSchema {
  user_id: number;
  normal_pin: string;
  duress_pin: string;
}

export interface UpdateNormalPinRequestSchema {
  user_id: number;
  current_pin: string;
  new_normal_pin: string;
}

export interface UpdateDuressPinRequestSchema {
  user_id: number;
  current_pin: string;
  new_duress_pin: string;
}

export interface ValidateSOSPinRequestSchema {
  user_id: number;
  pin_entered: string;
}

export interface ValidateSOSPinResponseSchema {
  status: string;
  is_duress: boolean;
}

export const pinService = {
  /**
   * Setup Security PINs: POST /api/v1/mobile/auth/setup-pins
   */
  async setupPins(payload: SetUserPinsRequestSchema): Promise<OTPStatusResponseSchema> {
    return request<OTPStatusResponseSchema>('/api/v1/mobile/auth/setup-pins', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Update Normal PIN: PUT /api/v1/mobile/auth/update-normal-pin
   * Requires user_id, current_pin (matching normal PIN), and new_normal_pin.
   */
  async updateNormalPin(payload: UpdateNormalPinRequestSchema): Promise<OTPStatusResponseSchema> {
    return request<OTPStatusResponseSchema>('/api/v1/mobile/auth/update-normal-pin', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Update Duress PIN: PUT /api/v1/mobile/auth/update-duress-pin
   * Requires user_id, current_pin (matching current duress PIN), and new_duress_pin.
   */
  async updateDuressPin(payload: UpdateDuressPinRequestSchema): Promise<OTPStatusResponseSchema> {
    return request<OTPStatusResponseSchema>('/api/v1/mobile/auth/update-duress-pin', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Verify SOS Cancellation PIN: POST /api/v1/mobile/auth/verify-sos-pin
   * Returns:
   * - 200 { status: 'verified_normal_pin', is_duress: false }
   * - 200 { status: 'verified_duress_pin', is_duress: true }
   * Preserves server errors because the published OpenAPI contract does not
   * define the meaning of 401 responses for this security-sensitive request.
   */
  async verifySosPin(payload: ValidateSOSPinRequestSchema): Promise<ValidateSOSPinResponseSchema> {
    return request<ValidateSOSPinResponseSchema>('/api/v1/mobile/auth/verify-sos-pin', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
