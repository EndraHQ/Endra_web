import { request } from '../client';

export interface ManualCameraSetupRequest {
  camera_name?: string;
  device_name?: string;
  ip_address?: string;
  port?: number;
  assigned_zone?: string | null;
  protocol?: string;
  channel?: number;
  custom_stream_path?: string | null;
  username?: string | null;
  password?: string | null;
  stream_url?: string | null;
}

export interface ConnectionValidationResponse {
  is_valid: boolean;
  message: string;
  stream_url?: string | null;
}

export interface PairCameraQrRequest {
  qr_token: string;
  camera_name: string;
  assigned_zone?: string | null;
}

export interface DiscoveredCameraPairRequest {
  device_id: string;
  camera_name: string;
  assigned_zone?: string | null;
}

export interface IncidentEvent {
  incident_id: string;
  timestamp: string;
  threat_level: string;
  type: string;
  zone: string;
  snapshot_url?: string | null;
  confidence_score?: number;
  status?: string;
}

export interface DailySummary {
  date: string;
  total_incidents: number;
  threats_prevented: number;
  system_status: string;
  recent_events: IncidentEvent[];
}

export interface CameraResponse {
  id: string;
  camera_name: string;
  mac_address?: string | null;
  serial_number?: string | null;
  assigned_zone: string;
  protocol: string;
  onboarding_method: string;
  ip_address?: string | null;
  port: number;
  channel?: number | null;
  custom_stream_path?: string | null;
  username?: string | null;
  stream_url: string;
  status: string;
  is_active: boolean;
  is_ptz: boolean;
  owner_id?: number | null;
  property_id?: number | null;
  created_at: string;
  updated_at: string;
}

export const hardwareService = {
  /**
   * Manual Camera Setup: POST /api/v1/hardware/manual-setup
   */
  async manualCameraSetup(payload: ManualCameraSetupRequest): Promise<ConnectionValidationResponse> {
    const formatted: ManualCameraSetupRequest = {
      ip_address: payload.ip_address || '192.168.1.50',
      port: payload.port || 554,
      ...payload
    };
    return request<ConnectionValidationResponse>('/api/v1/hardware/manual-setup', {
      method: 'POST',
      body: JSON.stringify(formatted)
    });
  },

  /**
   * Pair Camera via QR: POST /api/v1/hardware/pair-qr
   */
  async pairCameraQr(payload: PairCameraQrRequest): Promise<ConnectionValidationResponse> {
    return request<ConnectionValidationResponse>('/api/v1/hardware/pair-qr', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Validate QR Token: POST /api/v1/hardware/validate-qr
   */
  async validateQrToken(token: string): Promise<ConnectionValidationResponse> {
    return request<ConnectionValidationResponse>('/api/v1/hardware/validate-qr', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  },

  /**
   * Pair Discovered Camera: POST /api/v1/hardware/pair-discovered
   */
  async pairDiscoveredCamera(payload: DiscoveredCameraPairRequest): Promise<ConnectionValidationResponse> {
    return request<ConnectionValidationResponse>('/api/v1/hardware/pair-discovered', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * List Hardware Cameras: GET /api/v1/hardware/cameras
   */
  async getCameras(): Promise<CameraResponse[]> {
    return request<CameraResponse[]>('/api/v1/hardware/cameras', {
      method: 'GET'
    });
  },

  /**
   * Start Camera: POST /api/v1/hardware/cameras/{camera_id}/start
   */
  async startCamera(cameraId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/v1/hardware/cameras/${cameraId}/start`, {
      method: 'POST'
    });
  },

  /**
   * Stop Camera: POST /api/v1/hardware/cameras/{camera_id}/stop
   */
  async stopCamera(cameraId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/v1/hardware/cameras/${cameraId}/stop`, {
      method: 'POST'
    });
  },

  /**
   * Dashboard Daily Summary: GET /api/v1/dashboard/summary
   */
  async getDashboardSummary(): Promise<DailySummary> {
    return request<DailySummary>('/api/v1/dashboard/summary', {
      method: 'GET'
    });
  },

  /**
   * Add RTSP Camera via Dashboard: POST /api/v1/dashboard/add-rtsp-camera
   */
  async addRtspCamera(payload: any): Promise<any> {
    return request<any>('/api/v1/dashboard/add-rtsp-camera', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
