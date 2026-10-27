import { request, formatApiPhone } from '../client';

export interface CreateEmergencyContactSchema {
  full_name: string;
  relation: string;
  phone_number: string;
}

export interface UpdateEmergencyContactSchema {
  full_name?: string | null;
  relation?: string | null;
  phone_number?: string | null;
}

export interface EmergencyContactResponseSchema {
  id: number;
  user_id: number;
  full_name: string;
  relation: string;
  phone_number: string;
  created_at?: string;
}

export const contactsService = {
  /**
   * Get Emergency Contacts: GET /api/v1/mobile/auth/emergency-contacts
   */
  async getEmergencyContacts(userId?: number): Promise<EmergencyContactResponseSchema[]> {
    return request<EmergencyContactResponseSchema[]>('/api/v1/mobile/auth/emergency-contacts', {
      method: 'GET',
      userId
    });
  },

  /**
   * Add Emergency Contact: POST /api/v1/mobile/auth/emergency-contacts
   */
  async addEmergencyContact(payload: CreateEmergencyContactSchema, userId?: number): Promise<EmergencyContactResponseSchema> {
    return request<EmergencyContactResponseSchema>('/api/v1/mobile/auth/emergency-contacts', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        phone_number: formatApiPhone(payload.phone_number)
      }),
      userId
    });
  },

  /**
   * Update Emergency Contact: PUT /api/v1/mobile/auth/emergency-contacts/{contact_id}
   */
  async updateEmergencyContact(contactId: number, payload: UpdateEmergencyContactSchema, userId?: number): Promise<EmergencyContactResponseSchema> {
    return request<EmergencyContactResponseSchema>(`/api/v1/mobile/auth/emergency-contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        phone_number: payload.phone_number ? formatApiPhone(payload.phone_number) : undefined
      }),
      userId
    });
  },

  /**
   * Delete Emergency Contact: DELETE /api/v1/mobile/auth/emergency-contacts/{contact_id}
   */
  async deleteEmergencyContact(contactId: number, userId?: number): Promise<void> {
    return request<void>(`/api/v1/mobile/auth/emergency-contacts/${contactId}`, {
      method: 'DELETE',
      userId
    });
  }
};
