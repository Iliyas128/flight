import { useState } from 'react';
import { Session } from '@/types';
import { StatusBadge } from './StatusBadge';
import { RegistrationModal } from './RegistrationModal';
import { formatDateTime } from '@/lib/storage';
import { Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionCardProps {
  session: Session;
  participantCount: number;
  onRegistrationComplete: () => void;
}

export function SessionCard({ session, participantCount, onRegistrationComplete }: SessionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canRegister = session.status === 'open' || session.status === 'closing';

  return (
    <>
      <div className="card-base p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-2xl font-bold text-primary">
                {session.sessionCode || 'N/A'}
              </span>
              <StatusBadge status={session.status} />
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
          </div>
          
          <div className="sm:ml-4">
            {canRegister ? (
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto"
              >
                Записаться
              </Button>
            ) : (
              <Button variant="secondary" disabled className="w-full sm:w-auto">
                Запись закрыта
              </Button>
            )}
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
