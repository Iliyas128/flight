export type SessionStatus = 'open' | 'closing' | 'closed' | 'completed';

export interface Session {
  id: string;
  sessionCode: string; // 3-letter unique code (auto-generated)
  date: string; // ISO date string
  registrationStartTime: string; // HH:mm format - when pilots can start registering
  startTime: string; // HH:mm format - flight start time
  endTime?: string; // HH:mm format - session end time (optional)
  status: SessionStatus;
  closingMinutes: number; // minutes before session when registration closes
  comments: string; // Dispatcher comments
  createdAt: string;
}

export interface Participant {
  id: string;
  sessionId: string;
  name: string;
  validationCode: string; // 3-letter validation code (case-insensitive)
  code: string; // Personal code for participant
  isValid: boolean | null; // null = not checked, true = valid, false = invalid
  registeredAt: string;
}

export type FilterType = 'all' | 'open' | 'closing';
