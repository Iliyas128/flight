import { useState, useEffect } from 'react';
import { Session, Participant } from '@/types';
import { sessionsApi, participantsApi } from '@/lib/api';
import { DispatcherHeader } from '@/components/DispatcherHeader';
import { CreateSessionForm } from '@/components/CreateSessionForm';
import { SessionsTable } from '@/components/SessionsTable';

const Dispatcher = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const [upcomingSessions, allParticipants] = await Promise.all([
        sessionsApi.getUpcoming(),
        participantsApi.getAll(),
      ]);
      
      upcomingSessions.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
      return dateA.getTime() - dateB.getTime();
    });
      
      setSessions(upcomingSessions);
      setParticipants(allParticipants);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке данных');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DispatcherHeader />
        <main className="w-full overflow-x-hidden">
          <div className="page-container py-6">
            <div className="card-base p-8 text-center">
              <p className="text-muted-foreground">Загрузка...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DispatcherHeader />
        <main className="w-full overflow-x-hidden">
          <div className="page-container py-6">
            <div className="card-base p-8 text-center">
              <p className="text-destructive">{error}</p>
              <button onClick={loadData} className="mt-4 text-primary hover:underline">
                Попробовать снова
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DispatcherHeader />
      
      <main className="w-full overflow-x-hidden">
        <div className="page-container py-6">
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
            onUpdate={loadData}
          />
        </div>
      </main>
    </div>
  );
};

export default Dispatcher;
