export type SessionStatus = 'open' | 'closing' | 'closed' | 'completed';

export interface Session {
  id: string;
  name: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  status: SessionStatus;
  closingMinutes: number; // minutes before session when registration closes
  createdAt: string;
}

export interface Participant {
  id: string;
  sessionId: string;
  name: string;
  email: string;
  code: string;
  registeredAt: string;
}

export type FilterType = 'all' | 'open' | 'closing';
