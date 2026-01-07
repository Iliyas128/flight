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

export function isEmailRegistered(sessionId: string, email: string): boolean {
  const participants = getSessionParticipants(sessionId);
  return participants.some(p => p.email.toLowerCase() === email.toLowerCase());
}

export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function calculateSessionStatus(session: Session): SessionStatus {
  const now = new Date();
  const sessionDateTime = new Date(`${session.date}T${session.time}`);
  const closingTime = new Date(sessionDateTime.getTime() - session.closingMinutes * 60 * 1000);
  
  if (now >= sessionDateTime) {
    return 'completed';
  }
  
  if (now >= closingTime) {
    return 'closed';
  }
  
  const minutesUntilClosing = (closingTime.getTime() - now.getTime()) / (1000 * 60);
  
  if (minutesUntilClosing <= 30) {
    return 'closing';
  }
  
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

export function formatDateTime(date: string, time: string): string {
  const d = new Date(`${date}T${time}`);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTimeUntilSession(date: string, time: string): string {
  const now = new Date();
  const sessionDateTime = new Date(`${date}T${time}`);
  const diff = sessionDateTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'Началась';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}д ${hours}ч`;
  if (hours > 0) return `${hours}ч ${minutes}м`;
  return `${minutes}м`;
}
