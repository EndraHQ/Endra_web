import { request } from '../client';

export interface ThreadSummary {
  thread_id: string;
  recipient_group: string;
  last_message: string;
  unread_count: number;
  last_activity: string;
}

export type ValidRecipientGroup =
  | '24/7 Command Center'
  | 'Rapid Response Unit 4'
  | 'Estate Control'
  | 'Gate Guards';

export interface SendMessageRequestSchema {
  sender_id: string;
  sender_name: string;
  recipient_group: ValidRecipientGroup | string;
  content: string;
}

export interface SendMessageResponseSchema {
  message_id: string;
  sender_id: string;
  sender_name: string;
  recipient_group: string;
  content: string;
  timestamp: string;
  attachment_url?: string | null;
}

export const messagingService = {
  /**
   * Get Active Threads: GET /api/v1/messaging/threads
   */
  async getChatThreads(): Promise<ThreadSummary[]> {
    return request<ThreadSummary[]>('/api/v1/messaging/threads', {
      method: 'GET'
    });
  },

  /**
   * Send Message: POST /api/v1/messaging/send
   * recipient_group must be one of:
   * '24/7 Command Center', 'Rapid Response Unit 4', 'Estate Control', 'Gate Guards'
   */
  async sendMessage(payload: SendMessageRequestSchema): Promise<SendMessageResponseSchema> {
    return request<SendMessageResponseSchema>('/api/v1/messaging/send', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
