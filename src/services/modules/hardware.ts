import { request, API_BASE_URL, ApiError } from '../client';

export type ConnectionProtocol = 'RTSP' | 'ONVIF' | 'ISAPI' | 'WEBRTC' | string;

export interface HikvisionQRRequest {
  qr_payload: string;
}

export interface HikvisionQRValidationResponse {
  status: string;
  activation_token: string;
  serial_number: string;
  mac_address?: string | null;
  suggested_ip?: string | null;
  model?: string | null;
  can_auto_pair: boolean;
}

export interface QrDevicePairingRequest {
  ip_address: string;
  property_id?: number;
  username: string;
  password: string;
  maker?: string | null;
  model?: string | null;
  device_name?: string | null;
  port?: number;
  channel?: number | null;
  custom_stream_path?: string | null;
  zone_name?: string | null;
  protocol?: ConnectionProtocol | null;
  mac_address?: string | null;
  serial_number?: string | null;
  activation_token?: string | null;
}

export interface DevicePairingResponse {
  device_id: string;
  status: string;
  stream_url: string;
  assigned_zone: string;
  message: string;
}

export interface HikvisionDiscoveryResponse {
  ip_address: string;
  port: number;
  rtsp_port: number;
  serial_number?: string | null;
  mac_address?: string | null;
  model?: string | null;
  firmware_version?: string | null;
  status: string;
}

export interface ManualCameraSetupRequest {
  device_name: string;
  property_id?: number;
  camera_name?: string;
  ip_address?: string | null;
  port?: number;
  channel?: number | null;
  assigned_zone?: string | null;
  protocol?: ConnectionProtocol | null;
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

export interface CameraUpdateRequest {
  device_name?: string | null;
  ip_address?: string | null;
  port?: number | null;
  channel?: number | null;
  username?: string | null;
  password?: string | null;
  custom_stream_path?: string | null;
  assigned_zone?: string | null;
}

export interface QRValidationRequest {
  qr_code_payload: string;
}

export interface QRValidationResponse {
  status: string;
  activation_token: string;
  identifier: string;
  device_type?: string;
  can_auto_pair: boolean;
  ip_address?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  channel?: number | null;
  custom_stream_path?: string | null;
  protocol?: string | null;
}

export interface DiscoveredDevicePairingRequest {
  ip_address: string;
  property_id?: number;
  username: string;
  password: string;
  maker?: string | null;
  model?: string | null;
  device_name?: string | null;
  port?: number;
  channel?: number | null;
  custom_stream_path?: string | null;
  zone_name?: string | null;
  protocol?: string | null;
  mac_address?: string | null;
  serial_number?: string | null;
}

// Backwards-compatible legacy payloads
export interface PairCameraQrRequest {
  property_id?: number;
  qr_token?: string;
  camera_name?: string;
  assigned_zone?: string | null;
  ip_address?: string;
  username?: string;
  password?: string;
  activation_token?: string;
  device_name?: string;
}

export interface DiscoveredCameraPairRequest {
  property_id?: number;
  device_id?: string;
  camera_name?: string;
  assigned_zone?: string | null;
  ip_address?: string;
  username?: string;
  password?: string;
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
   * Generate Mock QR string for development & test automation:
   * POST /api/v1/hardware/test-utility/generate-mock-qr
   */
  async generateMockQr(macAddress = 'AA:BB:CC:11:22:33', ipAddress = '192.168.1.200'): Promise<{ mock_qr_payload?: string; qr_payload?: string; [key: string]: any }> {
    const query = new URLSearchParams({
      mac_address: macAddress,
      ip_address: ipAddress
    });
    return request<{ mock_qr_payload?: string; qr_payload?: string; [key: string]: any }>(
      `/api/v1/hardware/test-utility/generate-mock-qr?${query.toString()}`,
      { method: 'POST' }
    );
  },

  /**
   * Validate Hikvision QR: POST /api/v1/hardware/hikvision/validate-qr
   */
  async validateHikvisionQr(payload: HikvisionQRRequest, userId?: number): Promise<HikvisionQRValidationResponse> {
    return request<HikvisionQRValidationResponse>('/api/v1/hardware/hikvision/validate-qr', {
      method: 'POST',
      body: JSON.stringify(payload),
      userId
    });
  },

  /**
   * Pair Hikvision Camera via QR: POST /api/v1/hardware/hikvision/pair-qr
   */
  async pairHikvisionQr(payload: QrDevicePairingRequest, userId?: number): Promise<DevicePairingResponse> {
    return request<DevicePairingResponse>('/api/v1/hardware/hikvision/pair-qr', {
      method: 'POST',
      body: JSON.stringify(payload),
      userId
    });
  },

  /**
   * Discover Hikvision cameras on local LAN: POST /api/v1/hardware/hikvision/discover
   */
  async discoverHikvision(userId?: number): Promise<HikvisionDiscoveryResponse[]> {
    return request<HikvisionDiscoveryResponse[]>('/api/v1/hardware/hikvision/discover', {
      method: 'POST',
      userId
    });
  },

  /**
   * Register Hikvision Camera Manually via ISAPI: POST /api/v1/hardware/hikvision/manual
   */
  async manualHikvisionSetup(payload: ManualCameraSetupRequest, userId?: number): Promise<ConnectionValidationResponse> {
    return request<ConnectionValidationResponse>('/api/v1/hardware/hikvision/manual', {
      method: 'POST',
      body: JSON.stringify(payload),
      userId
    });
  },

  /**
   * Generic Manual Camera Setup: POST /api/v1/hardware/manual-setup
   */
  async manualCameraSetup(payload: ManualCameraSetupRequest, userId?: number): Promise<ConnectionValidationResponse> {
    const formatted: ManualCameraSetupRequest = {
      ...payload,
      device_name: payload.device_name || payload.camera_name || 'Front Gate Camera',
      ip_address: payload.ip_address || '192.168.1.50',
      port: payload.port || 554,
    };
    return request<ConnectionValidationResponse>('/api/v1/hardware/manual-setup', {
      method: 'POST',
      body: JSON.stringify(formatted),
      userId
    });
  },

  /**
   * Validate QR Token with automatic dual-endpoint compatibility:
   * First tries /api/v1/hardware/hikvision/validate-qr, falls back to /api/v1/hardware/validate-qr
   */
  async validateQrToken(token: string, userId?: number): Promise<HikvisionQRValidationResponse | ConnectionValidationResponse> {
    try {
      return await hardwareService.validateHikvisionQr({ qr_payload: token }, userId);
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 404) {
        return await request<ConnectionValidationResponse>('/api/v1/hardware/validate-qr', {
          method: 'POST',
          body: JSON.stringify({ qr_code_payload: token }),
          userId
        });
      }
      throw err;
    }
  },

  /**
   * Pair Camera via QR with full schema compatibility
   */
  async pairCameraQr(payload: QrDevicePairingRequest | PairCameraQrRequest, userId?: number): Promise<DevicePairingResponse | ConnectionValidationResponse> {
    const formatted: QrDevicePairingRequest = {
      ip_address: (payload as any).ip_address || '192.168.1.120',
      username: (payload as any).username || 'admin',
      password: (payload as any).password || 'Password123',
      device_name: (payload as any).device_name || (payload as any).camera_name || 'Security Camera',
      zone_name: (payload as any).zone_name || (payload as any).assigned_zone || 'Default Zone',
      activation_token: (payload as any).activation_token || (payload as any).qr_token || undefined,
      ...payload
    };

    try {
      return await hardwareService.pairHikvisionQr(formatted, userId);
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 404) {
        return await request<ConnectionValidationResponse>('/api/v1/hardware/pair-qr', {
          method: 'POST',
          body: JSON.stringify(formatted),
          userId
        });
      }
      throw err;
    }
  },

  /**
   * Pair Discovered Camera
   */
  async pairDiscoveredCamera(payload: DiscoveredDevicePairingRequest | DiscoveredCameraPairRequest, userId?: number): Promise<ConnectionValidationResponse> {
    const formatted: DiscoveredDevicePairingRequest = {
      ip_address: (payload as any).ip_address || '192.168.1.120',
      username: (payload as any).username || 'admin',
      password: (payload as any).password || 'Password123',
      device_name: (payload as any).device_name || (payload as any).camera_name || 'Discovered Camera',
      zone_name: (payload as any).zone_name || (payload as any).assigned_zone || 'Default Zone',
      ...payload
    };
    return request<ConnectionValidationResponse>('/api/v1/hardware/pair-discovered', {
      method: 'POST',
      body: JSON.stringify(formatted),
      userId
    });
  },

  /**
   * List Hardware Cameras: GET /api/v1/hardware/cameras
   */
  async getCameras(userId?: number): Promise<CameraResponse[]> {
    try {
      const res = await request<any>('/api/v1/hardware/cameras', {
        method: 'GET',
        userId
      });
      if (Array.isArray(res)) {
        return res;
      }
      if (res && typeof res === 'object' && Array.isArray(res.cameras)) {
        return res.cameras;
      }
      return [];
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 404) {
        const detail = typeof err.details === 'object' && err.details !== null
          ? (err.details as any).detail || err.message
          : err.message;
        if (typeof detail === 'string' && (/no camera attached/i.test(detail) || /not found/i.test(detail))) {
          return [];
        }
      }
      throw err;
    }
  },

  /**
   * Get Camera Details: GET /api/v1/hardware/cameras/{camera_id}
   */
  async getCamera(cameraId: string): Promise<CameraResponse> {
    return request<CameraResponse>(`/api/v1/hardware/cameras/${cameraId}`, {
      method: 'GET'
    });
  },

  /**
   * Update Camera: PUT /api/v1/hardware/cameras/{camera_id}
   */
  async updateCamera(cameraId: string, payload: CameraUpdateRequest): Promise<CameraResponse> {
    return request<CameraResponse>(`/api/v1/hardware/cameras/${cameraId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Delete Camera: DELETE /api/v1/hardware/cameras/{camera_id}
   */
  async deleteCamera(cameraId: string): Promise<{ message?: string } | void> {
    return request<{ message?: string } | void>(`/api/v1/hardware/cameras/${cameraId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Start Camera Stream: POST /api/v1/hardware/cameras/{camera_id}/start?rtsp_url=...
   */
  async startCamera(cameraId: string, rtspUrl: string): Promise<{ message?: string; status?: string; camera_id?: string }> {
    const query = new URLSearchParams({ rtsp_url: rtspUrl });
    return request<{ message?: string; status?: string; camera_id?: string }>(`/api/v1/hardware/cameras/${encodeURIComponent(cameraId)}/start?${query.toString()}`, {
      method: 'POST'
    });
  },

  /**
   * Start Hikvision Camera Stream: POST /api/v1/hardware/hikvision/cameras/{camera_id}/start
   */
  async startHikvisionCamera(cameraId: string, userId?: number): Promise<{ status: string; camera_id: string; camera_name?: string; stream_source?: string }> {
    return request<{ status: string; camera_id: string; camera_name?: string; stream_source?: string }>(
      `/api/v1/hardware/hikvision/cameras/${encodeURIComponent(cameraId)}/start`,
      {
        method: 'POST',
        userId
      }
    );
  },

  /**
   * Unified Start Camera Stream:
   * Uses backend camera UUID as required by Anthony.
   * If rtsp_url is provided, triggers the live RTSP pipeline;
   * otherwise uses the database-mapped camera pipeline.
   */
  async startStream(cameraId: string, rtspUrl?: string | null): Promise<any> {
    if (rtspUrl && typeof rtspUrl === 'string' && rtspUrl.trim().length > 0) {
      try {
        return await hardwareService.startCamera(cameraId, rtspUrl.trim());
      } catch (err: any) {
        return await hardwareService.startHikvisionCamera(cameraId);
      }
    }
    return await hardwareService.startHikvisionCamera(cameraId);
  },

  /**
   * Stop Camera Stream: POST /api/v1/hardware/cameras/{camera_id}/stop
   */
  async stopCamera(cameraId: string): Promise<{ message?: string; status?: string; camera_id?: string }> {
    return request<{ message?: string; status?: string; camera_id?: string }>(`/api/v1/hardware/cameras/${encodeURIComponent(cameraId)}/stop`, {
      method: 'POST'
    });
  },

  /**
   * Stop Hikvision Camera Stream: POST /api/v1/hardware/hikvision/cameras/{camera_id}/stop
   */
  async stopHikvisionCamera(cameraId: string, userId?: number): Promise<{ status?: string; message?: string }> {
    return request<{ status?: string; message?: string }>(
      `/api/v1/hardware/hikvision/cameras/${encodeURIComponent(cameraId)}/stop`,
      {
        method: 'POST',
        userId
      }
    );
  },

  /**
   * Unified Stop Camera Stream:
   * Uses camera UUID to terminate active backend pipelines.
   */
  async stopStream(cameraId: string): Promise<any> {
    try {
      return await hardwareService.stopCamera(cameraId);
    } catch {
      return await hardwareService.stopHikvisionCamera(cameraId).catch(() => {});
    }
  },

  /**
   * Helper to construct the Hikvision MJPEG streaming feed URL:
   * GET /api/v1/hardware/hikvision/cameras/{camera_id}/feed
   */
  getHikvisionCameraFeedUrl(cameraId: string): string {
    const base = API_BASE_URL.replace(/\/+$/, '');
    return `${base}/api/v1/hardware/hikvision/cameras/${encodeURIComponent(cameraId)}/feed`;
  },

  /**
   * Helper to construct the direct streaming feed URL:
   * GET /api/v1/hardware/cameras/{camera_id}/feed
   */
  getCameraFeedUrl(cameraId: string): string {
    const base = API_BASE_URL.replace(/\/+$/, '');
    return `${base}/api/v1/hardware/cameras/${encodeURIComponent(cameraId)}/feed`;
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
