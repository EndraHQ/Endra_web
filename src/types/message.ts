export interface ChatMessage {
  f: 'them' | 'me';
  t: string;
  tm: string;
  timestamp?: string | number;
}

export interface ChatThread {
  nm: string;
  role: string;
  av: string;
  cmd?: boolean;
  unread: number;
  time: string;
  last: string;
  msgs: ChatMessage[];
  lastActivity?: string;
}
