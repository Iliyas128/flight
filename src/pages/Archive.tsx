import { useState, useEffect } from 'react';
import { Session, Participant } from '@/types';
import { sessionsApi, participantsApi } from '@/lib/api';
import { DispatcherHeader } from '@/components/DispatcherHeader';
import { SessionsTable } from '@/components/SessionsTable';
import { Archive as ArchiveIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Archive = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  const loadData = async () => {
    try {
      setError(null);
      const [completed, allParticipants] = await Promise.all([
        sessionsApi.getCompleted(),
        participantsApi.getAll(),
      ]);
      
    completed.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
      
      // Для диспетчера показываем только его сессии, админ видит все
      const filtered = isAdmin
        ? completed
        : completed.filter((s) => s.createdById === user?.id);

      setSessions(filtered);
      setParticipants(allParticipants);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке данных');
      console.error('Error loading archive:', err);
    } finally {
      setLoading(false);
    }
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

          {loading ? (
            <div className="card-base p-8 text-center">
              <p className="text-muted-foreground">Загрузка...</p>
            </div>
          ) : error ? (
            <div className="card-base p-8 text-center">
              <p className="text-destructive">{error}</p>
              <button onClick={loadData} className="mt-4 text-primary hover:underline">
                Попробовать снова
              </button>
            </div>
          ) : sessions.length > 0 ? (
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
