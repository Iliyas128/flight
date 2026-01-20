import { useState, useEffect } from 'react';
import { Session } from '@/types';
import { StatusBadge } from './StatusBadge';
import { RegistrationModal } from './RegistrationModal';
import { formatDateTime, getTimeUntilSession, calculateSessionStatus } from '@/lib/utils';
import { Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionCardProps {
  session: Session;
  participantCount: number;
  onRegistrationComplete: () => void;
}

export function SessionCard({ session, participantCount, onRegistrationComplete }: SessionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(session.status);
  const createdAt = session.createdAt ? new Date(session.createdAt) : null;
  const createdAtLabel = createdAt
    ? `${createdAt.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })} ${createdAt.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : null;
  
  // Auto-update status every 10 seconds to enable registration button when time comes
  useEffect(() => {
    const updateStatus = () => {
      const newStatus = calculateSessionStatus(session);
      setCurrentStatus(newStatus);
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [session]);
  
  const canRegister = currentStatus === 'open' || currentStatus === 'closing';
  const registrationStartDateTime = new Date(`${session.date}T${session.registrationStartTime}`);
  const sessionStartDateTime = new Date(`${session.date}T${session.startTime}`);
  const registrationCloseDateTime = new Date(sessionStartDateTime.getTime() - session.closingMinutes * 60 * 1000);
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const registrationOpensIn = currentStatus === 'upcoming'
    ? getTimeUntilSession(session.date, session.registrationStartTime)
    : '';

  return (
    <>
      <div className="card-base p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-bold text-primary">
                  {session.sessionCode || 'N/A'}
                </span>
                <StatusBadge status={currentStatus} />
              </div>
              {session.createdByName && (
                <div className="text-xs text-muted-foreground text-right">
                  <div>Диспетчер</div>
                  <div className="font-medium truncate max-w-[180px]">
                    {session.createdByName}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDateTime(session.date, session.startTime || (session as any).time || '00:00', session.endTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {participantCount} участник(ов)
              </span>
            </div>
            <div className="mt-2 text-xs sm:text-sm text-muted-foreground space-y-1">
              {currentStatus === 'upcoming' ? (
                <div>
                  Регистрация откроется в {registrationStartDateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  {registrationOpensIn && registrationOpensIn !== 'Началась' ? ` (через ${registrationOpensIn})` : ''}
                </div>
              ) : currentStatus === 'closed' || currentStatus === 'completed' ? (
                <div>Регистрация закрыта</div>
              ) : (
                <div>
                  Регистрация открыта с {registrationStartDateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}, закроется в {formatTime(registrationCloseDateTime)}
                </div>
              )}
            </div>
          </div>

          <div className="sm:ml-4 flex flex-col items-stretch sm:items-end gap-2 min-w-[200px]">
            {createdAtLabel && (
              <div className="text-xs text-muted-foreground text-right">
                <div>Дата и время создания</div>
                <div className="font-medium">{createdAtLabel}</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              >
                Генерировать ключ
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              >
                Проверить ключ
              </Button>
            </div>

            <div>
              {canRegister ? (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  Записаться
                </Button>
              ) : currentStatus === 'upcoming' ? (
                <Button variant="secondary" disabled className="w-full sm:w-auto">
                  Скоро откроется
                </Button>
              ) : (
                <Button variant="secondary" disabled className="w-full sm:w-auto">
                  Запись закрыта
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <RegistrationModal
        session={session}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          onRegistrationComplete();
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
