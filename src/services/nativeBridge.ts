/**
 * ENDRA Native Flutter JavaScript Bridge Service
 * Correlates requests and responses with the native mobile app container.
 */

declare global {
  interface Window {
    __ENDRA_NATIVE__?: {
      isNativeApp?: boolean;
      platform?: 'android' | 'ios';
      version?: string;
    };
    EndraBridge?: {
      postMessage: (message: string) => void;
    };
  }
}

export interface DiscoveredCamera {
  id: string;
  name: string;
  serial?: string;
  model?: string;
  signal?: number;
  ip?: string;
  port?: number | string;
  streamUrl?: string;
  selected?: boolean;
}

export interface NativeBridgeResponse {
  type: string;
  requestId?: string;
  success?: boolean;
  data?: {
    cameras?: DiscoveredCamera[];
    [key: string]: unknown;
  };
  error?: string;
}

export interface OnboardingCompletePayload {
  userId: number;
  propertyId?: number | null;
  status: 'activated';
  timestamp?: number;
}

export class NativeBridgeError extends Error {
  constructor(message: string, public code: 'UNAVAILABLE' | 'TIMEOUT' | 'FAILED') {
    super(message);
    this.name = 'NativeBridgeError';
  }
}

class NativeBridgeService {
  /**
   * Safely checks whether the web app is running inside the supported Flutter native container.
   */
  public isNativeApp(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.__ENDRA_NATIVE__?.isNativeApp &&
      typeof window.EndraBridge?.postMessage === 'function'
    );
  }

  /**
   * Requests local network camera scanning through the native Flutter bridge.
   * Correlates the response via a unique requestId and handles cleanup on timeout.
   */
  public async startCameraScan(timeoutMs = 15000): Promise<DiscoveredCamera[]> {
    if (!this.isNativeApp()) {
      throw new NativeBridgeError(
        'Native camera scan is not available in standard browser environment.',
        'UNAVAILABLE'
      );
    }

    const requestId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const requestMessage = JSON.stringify({
      type: 'start_camera_scan',
      requestId
    });

    return new Promise<DiscoveredCamera[]>((resolve, reject) => {
      let timer: number | null = null;

      const handleNativeEvent = (event: Event) => {
        try {
          const customEvent = event as CustomEvent;
          let data: NativeBridgeResponse | null = null;

          if (customEvent.detail) {
            data = typeof customEvent.detail === 'string'
              ? JSON.parse(customEvent.detail)
              : customEvent.detail;
          }

          if (data && data.requestId === requestId) {
            cleanup();

            if (data.success === false || data.error) {
              reject(new NativeBridgeError(data.error || 'Camera scan failed on native side.', 'FAILED'));
              return;
            }

            const cameras = Array.isArray(data.data?.cameras) ? data.data.cameras : [];
            resolve(cameras);
          }
        } catch (err: any) {
          cleanup();
          reject(new NativeBridgeError(`Failed to parse native scan response: ${err.message}`, 'FAILED'));
        }
      };

      const cleanup = () => {
        if (timer !== null) {
          window.clearTimeout(timer);
          timer = null;
        }
        window.removeEventListener('endra:native', handleNativeEvent);
      };

      timer = window.setTimeout(() => {
        cleanup();
        reject(
          new NativeBridgeError(
            `Native camera scan timed out after ${timeoutMs / 1000} seconds.`,
            'TIMEOUT'
          )
        );
      }, timeoutMs);

      window.addEventListener('endra:native', handleNativeEvent);

      try {
        window.EndraBridge!.postMessage(requestMessage);
      } catch (postErr: any) {
        cleanup();
        reject(new NativeBridgeError(`Failed to post message to EndraBridge: ${postErr.message}`, 'FAILED'));
      }
    });
  }

  /**
   * Notifies the native mobile app that onboarding and backend activation have succeeded.
   * Strictly dispatches only after verified backend activation.
   */
  public notifyOnboardingComplete(payload: OnboardingCompletePayload): boolean {
    if (!this.isNativeApp()) return false;

    try {
      const message = JSON.stringify({
        type: 'onboarding_complete',
        payload: {
          ...payload,
          timestamp: payload.timestamp || Date.now()
        }
      });
      window.EndraBridge!.postMessage(message);
      return true;
    } catch (err) {
      console.warn('Failed to dispatch onboarding_complete to native bridge:', err);
      return false;
    }
  }
}

export const nativeBridge = new NativeBridgeService();
