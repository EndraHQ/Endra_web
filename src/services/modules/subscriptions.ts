import { request } from '../client';

export interface UserSubscriptionStatusResponseSchema {
  user_id: number;
  current_tier: 'free' | 'basic' | 'premium' | null;
  is_trial_active: boolean;
  trial_ends_at: string | null;
  subscription_expires_at: string | null;
  plans: any[] | null;
}

export interface SelectPlanRequestSchema {
  target_tier: 'free' | 'basic' | 'premium';
  start_trial?: boolean;
}

export interface PlanUpgradeResponseSchema {
  message: string;
  success: boolean;
  requires_payment?: boolean;
  checkout_url?: string | null;
  transaction_ref?: string | null;
}

export interface InitiatePaymentRequestSchema {
  target_tier: 'free' | 'basic' | 'premium';
  amount: number;
}

export interface InitiatePaymentResponseSchema {
  message: string;
  success: boolean;
  checkout_url?: string | null;
  transaction_ref: string;
}

export interface VerifyPaymentResponseSchema {
  message: string;
  success: boolean;
  current_tier: 'free' | 'basic' | 'premium';
  subscription_expires_at: string;
}

export const subscriptionService = {
  /**
   * Subscription Status: GET /subscriptions/status/{user_id}
   */
  async getSubscriptionStatus(userId: number): Promise<UserSubscriptionStatusResponseSchema> {
    return request<UserSubscriptionStatusResponseSchema>(`/subscriptions/status/${userId}`, {
      method: 'GET'
    });
  },

  /**
   * Upgrade Plan: POST /subscriptions/upgrade-plan
   */
  async upgradePlan(payload: SelectPlanRequestSchema, userId?: number): Promise<PlanUpgradeResponseSchema> {
    return request<PlanUpgradeResponseSchema>('/subscriptions/upgrade-plan', {
      method: 'POST',
      body: JSON.stringify(payload),
      userId
    });
  },

  /**
   * Initiate Payment: POST /subscriptions/initiate-payment?user_id={userId}
   */
  async initiatePayment(userId: number, payload: InitiatePaymentRequestSchema): Promise<InitiatePaymentResponseSchema> {
    return request<InitiatePaymentResponseSchema>(`/subscriptions/initiate-payment?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Verify Payment: GET /subscriptions/verify-payment/{transaction_ref}
   */
  async verifyPayment(transactionRef: string): Promise<VerifyPaymentResponseSchema> {
    return request<VerifyPaymentResponseSchema>(`/subscriptions/verify-payment/${transactionRef}`, {
      method: 'GET'
    });
  }
};
