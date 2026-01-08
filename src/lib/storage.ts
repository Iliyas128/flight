import { Session, Participant, SessionStatus } from '@/types';

const SESSIONS_KEY = 'aviation_sessions';
const PARTICIPANTS_KEY = 'aviation_participants';

export function getSessions(): Session[] {
  const data = localStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getParticipants(): Participant[] {
  const data = localStorage.getItem(PARTICIPANTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveParticipants(participants: Participant[]): void {
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
}

export function addSession(session: Session): void {
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter(s => s.id !== id);
  const participants = getParticipants().filter(p => p.sessionId !== id);
  saveSessions(sessions);
  saveParticipants(participants);
}

export function addParticipant(participant: Participant): void {
  const participants = getParticipants();
  participants.push(participant);
  saveParticipants(participants);
}

export function getSessionParticipants(sessionId: string): Participant[] {
  return getParticipants().filter(p => p.sessionId === sessionId);
}

export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function isSessionCodeUnique(code: string, excludeId?: string): boolean {
  const sessions = getSessions();
  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  return !sessions.some(s => {
    if (!s.sessionCode || s.id === excludeId) return false;
    
    // Check if session is within 60 days (for future: allow reuse after 60 days)
    // For now, check all sessions for uniqueness
    const startTime = s.startTime || (s as any).time || '00:00';
    const sessionDate = new Date(`${s.date}T${startTime}`);
    // TODO: Implement 60-day check: sessionDate >= sixtyDaysAgo
    
    return s.sessionCode.toUpperCase() === code.toUpperCase();
  });
}

export function generateUniqueSessionCode(excludeId?: string): string {
  let code = generateSessionCode();
  let attempts = 0;
  const maxAttempts = 1000; // Increased for better uniqueness
  
  while (!isSessionCodeUnique(code, excludeId) && attempts < maxAttempts) {
    code = generateSessionCode();
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    // Fallback: add random suffix if all codes are taken
    code = generateSessionCode() + Math.floor(Math.random() * 10);
  }
  
  return code;
}

export function updateParticipantValidity(participantId: string, isValid: boolean | null): void {
  const participants = getParticipants();
  const updated = participants.map(p => 
    p.id === participantId ? { ...p, isValid } : p
  );
  saveParticipants(updated);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function calculateSessionStatus(session: Session): SessionStatus {
  const now = new Date();
  // Support old data format
  const registrationStartTime = session.registrationStartTime || (session as any).time || '00:00';
  const startTime = session.startTime || (session as any).time || '00:00';
  
  const registrationStartDateTime = new Date(`${session.date}T${registrationStartTime}`);
  const sessionStartDateTime = new Date(`${session.date}T${startTime}`);
  const closingTime = new Date(sessionStartDateTime.getTime() - session.closingMinutes * 60 * 1000);
  const sessionEndDateTime = session.endTime 
    ? new Date(`${session.date}T${session.endTime}`)
    : new Date(sessionStartDateTime.getTime() + 2 * 60 * 60 * 1000);
  
  // Session is completed if current time is after end time (or default duration)
  if (now >= sessionEndDateTime) {
    return 'completed';
  }
  
  // Session has started (flight has begun) but not completed yet
  if (now >= sessionStartDateTime) {
    return 'closed';
  }
  
  // Registration hasn't started yet
  if (now < registrationStartDateTime) {
    return 'upcoming'; // Registration not open yet
  }
  
  // Registration is open, check if closing time is approaching
  const minutesUntilClosing = (closingTime.getTime() - now.getTime()) / (1000 * 60);
  
  if (minutesUntilClosing <= 30 && minutesUntilClosing > 0) {
    return 'closing'; // Registration closing soon
  }

  if (minutesUntilClosing <= 0) {
    return 'closed'; // Registration already closed before session start
  }
  
  // Registration is still open (more than 30 minutes until closing)
  return 'open';
}

export function updateSessionStatuses(): void {
  const sessions = getSessions();
  const updatedSessions = sessions.map(session => ({
    ...session,
    status: calculateSessionStatus(session)
  }));
  saveSessions(updatedSessions);
}

export function getUpcomingSessions(): Session[] {
  updateSessionStatuses();
  return getSessions().filter(s => s.status !== 'completed');
}

export function getCompletedSessions(): Session[] {
  updateSessionStatuses();
  return getSessions().filter(s => s.status === 'completed');
}

export function formatDateTime(date: string, startTime: string, endTime?: string): string {
  if (!date || !startTime) return '';
  
  const startDate = new Date(`${date}T${startTime}`);
  const dateStr = startDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  if (endTime) {
    return `${dateStr}, ${startTime} - ${endTime}`;
  }
  return `${dateStr}, ${startTime}`;
}

export function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function getTimeUntilSession(date: string, startTime: string): string {
  const now = new Date();
  const sessionDateTime = new Date(`${date}T${startTime}`);
  const diff = sessionDateTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'Началась';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}д ${hours}ч`;
  if (hours > 0) return `${hours}ч ${minutes}м`;
  return `${minutes}м`;
}

export function updateSessionComments(sessionId: string, comments: string): void {
  const sessions = getSessions();
  const updated = sessions.map(s => 
    s.id === sessionId ? { ...s, comments } : s
  );
  saveSessions(updated);
}
