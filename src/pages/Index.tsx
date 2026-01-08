import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Session, FilterType } from '@/types';
import { getUpcomingSessions, getSessionParticipants } from '@/lib/storage';
import { SessionCard } from '@/components/SessionCard';
import { FilterTabs } from '@/components/FilterTabs';
import { Plane, Settings } from 'lucide-react';

const Index = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  const loadSessions = () => {
    const upcoming = getUpcomingSessions();
    upcoming.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime || a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.startTime || b.time || '00:00'}`);
      return dateA.getTime() - dateB.getTime();
    });
    setSessions(upcoming);
  };

  useEffect(() => {
    loadSessions();
    // Refresh every minute to update statuses
    const interval = setInterval(loadSessions, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    // "Открытые" включает и open, и closing (они все еще открыты для записи)
    if (filter === 'open') return session.status === 'open' || session.status === 'closing';
    if (filter === 'closing') return session.status === 'closing';
    if (filter === 'upcoming') return session.status === 'upcoming';
    return true;
  });

  const counts = {
    all: sessions.length,
    open: sessions.filter(s => s.status === 'open' || s.status === 'closing').length,
    closing: sessions.filter(s => s.status === 'closing').length,
    upcoming: sessions.filter(s => s.status === 'upcoming').length
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="page-container py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Запись на сессии</span>
          </div>
          <Link 
            to="/dispatcher"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Диспетчер</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="page-container">
        <div className="mb-6">
          <h1 className="page-title mb-1">Предстоящие сессии</h1>
          <p className="text-sm text-muted-foreground">
            Выберите сессию для записи
          </p>
        </div>

        <div className="mb-4">
          <FilterTabs 
            activeFilter={filter} 
            onChange={setFilter}
            counts={counts}
          />
        </div>

        {filteredSessions.length > 0 ? (
          <div className="space-y-3">
            {filteredSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                participantCount={getSessionParticipants(session.id).length}
                onRegistrationComplete={loadSessions}
              />
            ))}
          </div>
        ) : (
          <div className="card-base p-8 text-center">
            <p className="text-muted-foreground">
              {filter === 'all' && 'Нет предстоящих сессий'}
              {filter === 'open' && 'Нет сессий со статусом "Открыта"'}
              {filter === 'closing' && 'Нет сессий со статусом "Скоро закрывается"'}
              {filter === 'upcoming' && 'Нет сессий, которые скоро откроются'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
