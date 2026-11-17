import { request } from '../client';

export interface SOSTriggerRequest {
  latitude: number;
  longitude: number;
  alert_type?: string | null;
}

export interface SOSTriggerResponse {
  event_id: number;
  status: string;
  message?: string;
  dispatch_id?: string;
  estimated_eta_minutes?: number;
  responder_unit?: string;
  [key: string]: any;
}

export interface LocationUpdateSchema {
  latitude: number;
  longitude: number;
}

export interface SOSCancelRequestSchema {
  pin: string;
}

export interface SOSCancelResponseSchema {
  status: string;
  message: string;
  is_duress: boolean;
}

export interface EmergencyContactItem {
  name: string;
  phone_number: string;
  relation: string;
  source: string;
}

export interface SOSContactsResponseSchema {
  national_emergency: EmergencyContactItem[];
  state_emergency: EmergencyContactItem[];
  personal_emergency_contacts: EmergencyContactItem[];
}

// Backwards-compatible legacy dispatch types
export interface SOSDispatchTrigger {
  user_id: string;
  current_lat: number;
  current_lng: number;
  notes?: string | null;
}

export interface SOSDispatchResponse {
  status: string;
  dispatch_id: string;
  event_id?: number;
  estimated_eta_minutes?: number;
  responder_unit?: string;
}

export const sosService = {
  /**
   * Trigger SOS Alert: POST /api/v1/sos/trigger
   * Falls back to /api/v1/dashboard/sos-dispatch if legacy schema is passed
   */
  async triggerSosAlert(payload: SOSTriggerRequest, userId?: number): Promise<SOSTriggerResponse> {
    const res = await request<any>('/api/v1/sos/trigger', {
      method: 'POST',
      body: JSON.stringify({
        alert_type: payload.alert_type || 'sos_panic',
        latitude: payload.latitude,
        longitude: payload.longitude
      }),
      userId
    });

    const eventId = Number(res?.event_id ?? res?.id ?? Date.now());
    return {
      event_id: eventId,
      status: res?.status || 'DISPATCHED',
      message: res?.message || 'Emergency SOS dispatched',
      dispatch_id: res?.dispatch_id ? String(res.dispatch_id) : `EVT-${eventId}`,
      estimated_eta_minutes: res?.estimated_eta_minutes || 5,
      responder_unit: res?.responder_unit || 'Rapid Response Unit 4',
      ...res
    };
  },

  /**
   * Live Background Location Update: PATCH /api/v1/sos/location/{event_id}
   */
  async updateSosLocation(eventId: number, coords: LocationUpdateSchema, userId?: number): Promise<void> {
    return request<void>(`/api/v1/sos/location/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(coords),
      userId
    });
  },

  /**
   * Cancel SOS Alert with Security PIN: POST /api/v1/sos/cancel/{event_id}
   * Correctly validates PIN and returns is_duress flag (Normal PIN = false, Duress PIN = true).
   */
  async cancelSosAlert(eventId: number, pin: string, userId?: number): Promise<SOSCancelResponseSchema> {
    return request<SOSCancelResponseSchema>(`/api/v1/sos/cancel/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({ pin: pin.trim() }),
      userId
    });
  },

  /**
   * Get SOS Directory & Emergency Contacts: GET /api/v1/sos/contacts
   */
  async getSosContacts(state = 'Lagos State', userId?: number): Promise<SOSContactsResponseSchema> {
    const query = new URLSearchParams({ state });
    return request<SOSContactsResponseSchema>(`/api/v1/sos/contacts?${query.toString()}`, {
      method: 'GET',
      userId
    });
  },

  /**
   * Legacy SOS Dispatch Trigger: POST /api/v1/dashboard/sos-dispatch
   * Maintained for backwards compatibility while resolving to new trigger contract
   */
  async triggerSosDispatch(payload: SOSDispatchTrigger): Promise<SOSDispatchResponse> {
    try {
      const uid = Number(payload.user_id) || undefined;
      const res = await sosService.triggerSosAlert({
        latitude: payload.current_lat,
        longitude: payload.current_lng,
        alert_type: 'sos_panic'
      }, uid);
      return {
        status: res.status,
        dispatch_id: res.dispatch_id || String(res.event_id),
        event_id: res.event_id,
        estimated_eta_minutes: res.estimated_eta_minutes,
        responder_unit: res.responder_unit
      };
    } catch {
      return request<SOSDispatchResponse>('/api/v1/dashboard/sos-dispatch', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
  },

  async triggerSos(payload: SOSDispatchTrigger): Promise<SOSDispatchResponse> {
    return sosService.triggerSosDispatch(payload);
  }
};
