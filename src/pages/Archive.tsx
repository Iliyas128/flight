import { useState, useEffect } from 'react';
import { Session, Participant } from '@/types';
import { getCompletedSessions, getParticipants } from '@/lib/storage';
import { DispatcherHeader } from '@/components/DispatcherHeader';
import { SessionsTable } from '@/components/SessionsTable';
import { Archive as ArchiveIcon } from 'lucide-react';

const Archive = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const loadData = () => {
    const completed = getCompletedSessions();
    completed.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime || a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.startTime || b.time || '00:00'}`);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
    setSessions(completed);
    setParticipants(getParticipants());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DispatcherHeader />
      
      <main className="w-full overflow-x-hidden">
        <div className="page-container py-6">
          <div className="mb-6">
            <h1 className="page-title flex items-center gap-2">
              <ArchiveIcon className="h-5 w-5" />
              Архив сессий
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Просмотр завершённых сессий и их участников
            </p>
          </div>

          {sessions.length > 0 ? (
            <SessionsTable 
              sessions={sessions}
              participants={participants}
              onUpdate={loadData}
              readOnly
            />
          ) : (
            <div className="card-base p-8 text-center">
              <ArchiveIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Архив пуст. Завершённые сессии будут отображаться здесь.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Archive;
