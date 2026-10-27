import { request } from '../client';

export interface SOSDispatchTrigger {
  user_id: string;
  current_lat: number;
  current_lng: number;
  notes?: string | null;
}

export interface SOSDispatchResponse {
  status: string;
  dispatch_id: string;
  estimated_eta_minutes?: number;
  responder_unit?: string;
}

export const sosService = {
  /**
   * SOS Dispatch Trigger: POST /api/v1/dashboard/sos-dispatch
   * Dispatches emergency alert to 24/7 Command Center.
   * Returns 202 with status: "DISPATCHED", dispatch_id, estimated_eta_minutes, responder_unit.
   */
  async triggerSosDispatch(payload: SOSDispatchTrigger): Promise<SOSDispatchResponse> {
    return request<SOSDispatchResponse>('/api/v1/dashboard/sos-dispatch', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async triggerSos(payload: SOSDispatchTrigger): Promise<SOSDispatchResponse> {
    return sosService.triggerSosDispatch(payload);
  }
};
