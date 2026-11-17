/**
 * ENDRA Central WebSocket Service
 * Connects to live backend feed (/ws) for real-time incident telemetry,
 * threat alerts, and dispatch updates.
 */

import { API_BASE_URL } from './client';

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface WebSocketMessage {
  event_type?: string;
  type?: string;
  payload?: any;
  incident_id?: string;
  threat_level?: string;
  zone?: string;
  timestamp?: string;
  [key: string]: any;
}

export type MessageHandler = (data: WebSocketMessage) => void;
export type StatusHandler = (status: WebSocketStatus) => void;

class CentralWebSocketClient {
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = 'disconnected';
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private intentionalClose = false;
  private currentUserId: number | null = null;

  public getStatus(): WebSocketStatus {
    return this.status;
  }

  private setStatus(newStatus: WebSocketStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusHandlers.forEach(handler => {
      try { handler(newStatus); } catch (e) { console.error('Status handler error:', e); }
    });
  }

  public connect(userId?: number | null) {
    if (typeof window === 'undefined') return;
    if (userId !== undefined) this.currentUserId = userId;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.intentionalClose = false;
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    // Convert HTTP(S) base URL to WS(S)
    const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
    const wsUrl = normalizedBase.startsWith('https://')
      ? normalizedBase.replace('https://', 'wss://') + '/ws'
      : normalizedBase.replace('http://', 'ws://') + '/ws';

    const urlWithParams = this.currentUserId
      ? `${wsUrl}?user_id=${this.currentUserId}`
      : wsUrl;

    try {
      this.ws = new WebSocket(urlWithParams);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => {
            try { handler(parsed); } catch (err) { console.error('WS message handler error:', err); }
          });
        } catch {
          // Plain text frame
          this.messageHandlers.forEach(handler => {
            try { handler({ type: 'text', payload: event.data }); } catch {}
          });
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.ws = null;
        if (!this.intentionalClose) {
          this.scheduleReconnect();
        } else {
          this.setStatus('disconnected');
        }
      };
    } catch (err) {
      console.warn('Failed to initialize WebSocket client:', err);
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.intentionalClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  public send(data: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(payload);
      return true;
    }
    return false;
  }

  public subscribe(onMessage: MessageHandler): () => void {
    this.messageHandlers.add(onMessage);
    return () => {
      this.messageHandlers.delete(onMessage);
    };
  }

  public onStatusChange(onStatus: StatusHandler): () => void {
    this.statusHandlers.add(onStatus);
    return () => {
      this.statusHandlers.delete(onStatus);
    };
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    // Ping every 25s to keep proxy socket open
    this.pingTimer = window.setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() });
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus('disconnected');
      return;
    }
    this.setStatus('reconnecting');
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts += 1;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }
}

export const centralWebSocket = new CentralWebSocketClient();
