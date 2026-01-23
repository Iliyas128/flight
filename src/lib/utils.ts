import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Session, SessionStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date and time
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

export function calculateSessionStatus(session: Session): SessionStatus {
  const now = new Date();
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

// Compute tailwind classes for a session row based on current UTC time
export function getSessionRowClasses(session: Session): string {
  const now = new Date();
  const startTime = session.startTime || session.registrationStartTime || '00:00';
  // Parse as UTC by appending Z
  const start = new Date(`${session.date}T${startTime}Z`);
  const end = session.endTime ? new Date(`${session.date}T${session.endTime}Z`) : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  // finished
  if (now >= end) return 'bg-red-50 text-red-800';

  // started but not finished
  if (now >= start && now < end) return 'bg-emerald-50 text-emerald-800';

  // starts within 2 hours
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const msUntilStart = start.getTime() - now.getTime();
  if (msUntilStart <= twoHoursMs) return 'bg-yellow-50 text-amber-800';

  // starts later than 2 hours
  return 'bg-sky-50 text-sky-800';
}
