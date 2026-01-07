import { useState, useEffect } from 'react';
import { Session, Participant } from '@/types';
import { getUpcomingSessions, getParticipants } from '@/lib/storage';
import { DispatcherSidebar } from '@/components/DispatcherSidebar';
import { CreateSessionForm } from '@/components/CreateSessionForm';
import { SessionsTable } from '@/components/SessionsTable';

const Dispatcher = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const loadData = () => {
    const upcoming = getUpcomingSessions();
    upcoming.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
    setSessions(upcoming);
    setParticipants(getParticipants());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <DispatcherSidebar />
      
      <main className="flex-1 lg:ml-0 w-full overflow-x-hidden">
        <div className="page-container pt-14 sm:pt-16 lg:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="page-title">Управление сессиями</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Создавайте и управляйте авиационными сессиями
              </p>
            </div>
            <CreateSessionForm onSuccess={loadData} />
          </div>

          <div className="mb-4">
            <h2 className="section-title">Предстоящие сессии</h2>
          </div>

          <SessionsTable 
            sessions={sessions}
            participants={participants}
            onDelete={loadData}
          />
        </div>
      </main>
    </div>
  );
};

export default Dispatcher;
