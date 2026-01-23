import { useState, useEffect } from 'react';
import { Session, Participant } from '@/types';
import { sessionsApi, participantsApi } from '@/lib/api';
import { getSessionRowClasses } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
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
      const allParticipants = await participantsApi.getAll();

      if (isAdmin) {
        // Admin: show the same table as on main page (all sessions) and allow deletion
        const allSessions = await sessionsApi.getAll();
        // Sort newest first by sessionNumber or createdAt
        allSessions.sort((a, b) => {
          if (typeof a.sessionNumber === 'number' && typeof b.sessionNumber === 'number') {
            return b.sessionNumber - a.sessionNumber;
          }
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        setSessions(allSessions);
      } else {
        const completed = await sessionsApi.getCompleted();
        completed.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
          const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        });

        const filtered = completed.filter((s) => s.createdById === user?.id);
        setSessions(filtered);
      }

      setParticipants(allParticipants);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке данных');
      console.error('Error loading archive:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    try {
      await sessionsApi.delete(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      // restore scroll to avoid jumping to top
      setTimeout(() => window.scrollTo(0, scrollY), 0);
    } catch (err: any) {
      console.error('Error deleting session:', err);
      setError(err?.message || 'Ошибка при удалении сессии');
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
            <div className="card-base border border-gray-300 rounded-lg overflow-hidden bg-white w-full h-full flex flex-col">
              <div className="bg-white border-b border-gray-300">
                <div className="grid grid-cols-8 gap-1 px-4 py-2 text-sm font-medium text-gray-700">
                  <div className="text-start">No</div>
                  <div className="text-start">Дата начала(UTC)</div>
                  <div className="text-start">Время начала(UTC)</div>
                  <div className="text-start">Длит.</div>
                  <div className="text-start">Ключей</div>
                  <div className="text-start">Диспетчер</div>
                  <div className="text-start">Дата создания (UTC)</div>
                  <div className="text-start">Время создания (UTC)</div>
                </div>
              </div>

              <div className="overflow-x-auto overflow-y-auto flex-1">
                <div className="min-w-full">
                  {sessions.map((session, index) => {
                    const isAdminRow = isAdmin;
                    const sessionNumber = session.sessionNumber ? String(session.sessionNumber).padStart(4, '0') : String(index + 1).padStart(4, '0');
                    const rowClasses = getSessionRowClasses(session);

                    const formatDate = (dateStr: string) => {
                      const date = new Date(dateStr);
                      return date.toLocaleDateString('ru-RU', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                      });
                    };

                    const formatTime = (timeStr?: string) => timeStr || '—';

                    const formatCreatedDate = (dateStr?: string) => {
                      if (!dateStr) return '—';
                      const date = new Date(dateStr);
                      return `${date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })}`;
                    };

                    const formatCreatedTime = (dateStr?: string) => {
                      if (!dateStr) return '—';
                      const date = new Date(dateStr);
                      return `${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`;
                    };

                    const calculateDuration = (startTime: string, endTime?: string) => {
                      if (!endTime) return '—';
                      const start = startTime.split(':').map(Number);
                      const end = endTime.split(':').map(Number);
                      const startMinutes = start[0] * 60 + start[1];
                      const endMinutes = end[0] * 60 + end[1];
                      let diffMinutes = endMinutes - startMinutes;
                      if (diffMinutes < 0) diffMinutes += 24 * 60;
                      return `${diffMinutes} мин`;
                    };

                    return (
                      <div key={session.id} className={`grid grid-cols-8 gap-4 px-4 py-3 border-b border-gray-200 ${rowClasses}`}>
                        <div className="text-start text-sm">{sessionNumber}</div>
                        <div className="text-start text-sm">{formatDate(session.date)}</div>
                        <div className="text-start text-sm">{formatTime(session.startTime)}</div>
                        <div className="text-start text-sm">{calculateDuration(session.startTime || '00:00', session.endTime)}</div>
                        <div className="text-start text-sm">{participants.filter(p => p.sessionId === session.id).length}</div>
                        <div className="text-start text-sm">{session.createdByName || '—'}</div>
                        <div className="text-start text-sm">{formatCreatedDate(session.createdAt)}</div>
                        <div className="text-start text-sm flex items-center justify-between">
                          <span>{formatCreatedTime(session.createdAt)}</span>
                          {isAdminRow && (
                            <button onClick={() => handleDelete(session.id)} className="ml-2 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
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
