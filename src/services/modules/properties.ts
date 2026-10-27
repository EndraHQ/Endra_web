import { request } from '../client';

export interface CreatePropertySchema {
  property_name: string;
  full_address: string;
  property_type: 'residential' | 'commercial' | string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdatePropertySchema {
  property_name?: string | null;
  full_address?: string | null;
  property_type?: 'residential' | 'commercial' | string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PropertyResponseSchema {
  id: number;
  user_id: number;
  property_name: string;
  full_address: string;
  property_type: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export const propertyService = {
  /**
   * Property Creation: POST /api/v1/mobile/properties
   */
  async createProperty(payload: CreatePropertySchema, userId?: number): Promise<PropertyResponseSchema> {
    const formattedPayload = {
      property_name: payload.property_name,
      full_address: payload.full_address,
      property_type: payload.property_type,
      latitude: payload.latitude,
      longitude: payload.longitude
    };
    return request<PropertyResponseSchema>('/api/v1/mobile/properties', {
      method: 'POST',
      body: JSON.stringify(formattedPayload),
      userId
    });
  },

  /**
   * Update Property: PUT /api/v1/mobile/properties/{property_id}
   */
  async updateProperty(propertyId: number, payload: UpdatePropertySchema, userId?: number): Promise<PropertyResponseSchema> {
    return request<PropertyResponseSchema>(`/api/v1/mobile/properties/${propertyId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      userId
    });
  },

  /**
   * Delete Property: DELETE /api/v1/mobile/properties/{property_id}
   */
  async deleteProperty(propertyId: number, userId?: number): Promise<void> {
    return request<void>(`/api/v1/mobile/properties/${propertyId}`, {
      method: 'DELETE',
      userId
    });
  },

  /**
   * List Properties: GET /api/v1/mobile/properties
   */
  async getProperties(userId?: number): Promise<{ properties: PropertyResponseSchema[] }> {
    return request<{ properties: PropertyResponseSchema[] }>('/api/v1/mobile/properties', {
      method: 'GET',
      userId
    });
  }
};
