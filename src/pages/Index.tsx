import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Session } from '@/types';
import { sessionsApi, validKeysApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from '@/components/LoginModal';
import { ValidKeysModal } from '@/components/ValidKeysModal';
import { CheckKeyModal } from '@/components/CheckKeyModal';
import { CreateSessionForm } from '@/components/CreateSessionForm';
import { Plane, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const { user, isDispatcher, isAdmin, logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validKeysCounts, setValidKeysCounts] = useState<Record<string, number>>({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showValidKeysModal, setShowValidKeysModal] = useState(false);
  const [showCheckKeyModal, setShowCheckKeyModal] = useState(false);

  const loadSessions = async () => {
    try {
      setError(null);
      const upcoming = await sessionsApi.getUpcoming();

      // Показываем только те, что ещё доступны для регистрации (open/closing) — статус считается на бэке в UTC
      const visible = upcoming.filter(
        (session) => session.status === 'open' || session.status === 'closing'
      );

      // Sort by creation date (oldest first) to maintain consistent session numbers
      visible.sort((a, b) => {
        const aStart = new Date(`${a.date}T${a.startTime || '00:00'}Z`).getTime();
        const bStart = new Date(`${b.date}T${b.startTime || '00:00'}Z`).getTime();
        return aStart - bStart;
      });
      setSessions(visible);

      // Load valid keys counts for each session
      const keysCounts: Record<string, number> = {};
      await Promise.all(
        visible.map(async (session) => {
          try {
            const validKeys = await validKeysApi.getBySession(session.id);
            keysCounts[session.id] = validKeys.count;
          } catch (err) {
            keysCounts[session.id] = 0;
          }
        })
      );
      setValidKeysCounts(keysCounts);

      // Drop selection if it no longer exists (session ушла из списка)
      setSelectedSessionId((prev) => (prev && visible.some((s) => s.id === prev) ? prev : null));
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке сессий');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // Refresh more often to react to start times approaching
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  // Listen for messages from bot window when key is saved
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle both message formats from bot
      if (event.data === 'bot-key-saved' || event.data?.type === 'KEY_SAVED') {
        // Reload sessions to update key counts
        loadSessions();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const selectedSession = selectedSessionId ? sessions.find(s => s.id === selectedSessionId) : null;
  const hasSelection = selectedSessionId !== null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr || '—';
  };

  const formatCreatedDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    })}`;
  };

  const formatCreatedTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return `${date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    })}`;
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return '—';
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    const diffMinutes = endMinutes - startMinutes;
    return `${diffMinutes} мин`;
  };

  const handleGenerateKey = () => {
    if (!selectedSession) return;
    
    // Use sessionNumber from backend if available, otherwise use index-based number
    const sessionIndex = sessions.findIndex(s => s.id === selectedSession.id);
    const sessionNumber = selectedSession.sessionNumber 
      ? String(selectedSession.sessionNumber).padStart(4, '0')
      : String(sessionIndex + 1).padStart(4, '0');
    const duration = calculateDuration(selectedSession.startTime || '00:00', selectedSession.endTime);
    const keysCount = validKeysCounts[selectedSession.id] || 0;
    
    // Build URL for bot site
    const botUrl = import.meta.env.VITE_BOT_SITE_URL || 'http://localhost:8081';
    const params = new URLSearchParams({
      sessionNumber,
      date: selectedSession.date,
      startTime: selectedSession.startTime || '',
      duration,
      dispatcher: selectedSession.createdByName || '—',
      keysCount: String(keysCount),
      validKeys: '', // Will be fetched by bot if needed
      sessionId: selectedSession.id, // Pass session ID for saving
    });
    
    window.open(`${botUrl}?${params.toString()}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="page-container py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Plane className="h-5 w-5 text-primary" />
              
              {/* Green buttons - available to all users, become green when row is selected */}
              <Button
                variant="outline"
                size="sm"
                className={hasSelection ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500' : 'bg-white border-gray-300 text-gray-700'}
                disabled={!hasSelection}
                onClick={handleGenerateKey}
              >
                Генерировать ключ
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={hasSelection ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500' : 'bg-white border-gray-300 text-gray-700'}
                disabled={!hasSelection}
                onClick={() => setShowCheckKeyModal(true)}
              >
                Проверить ключ
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Blue buttons - only for dispatcher (not admin), next to user name */}
              {isDispatcher && !isAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-sky-500 text-white hover:bg-sky-600 border-sky-500"
                    disabled={!hasSelection}
                    onClick={() => setShowValidKeysModal(true)}
                  >
                    Валидные ключи
                  </Button>
                  <CreateSessionForm onSuccess={loadSessions} />
                </>
              )}

              {/* User name button or Anonymous */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-sky-500 text-white hover:bg-sky-600 border-sky-500"
                    >
                      {user.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">Панель администратора</Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && <DropdownMenuSeparator />}
                    <DropdownMenuItem onClick={() => {
                      logout();
                      window.location.href = '/';
                    }}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2"
                >
                  Аноним
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Main content */}
      <main className="page-container">
        {/* Sessions Table */}
        {loading ? (
          <div className="card-base p-8 text-center">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : error ? (
          <div className="card-base p-8 text-center">
            <p className="text-destructive">{error}</p>
            <button onClick={loadSessions} className="mt-4 text-primary hover:underline">
              Попробовать снова
            </button>
          </div>
        ) : (
          <div className="card-base border border-gray-300 rounded-lg overflow-hidden bg-white">
            {/* Table Headers */}
            <div className="bg-white border-b border-gray-300">
              <div className="grid grid-cols-8 gap-1 px-6 py-2 text-sm font-medium text-gray-700">
                <div className="text-start">No</div>
                <div className="text-start">Дата начала</div>
                <div className="text-start">Время начала</div>
                <div className="text-start">Длит.</div>
                <div className="text-start">Ключей</div>
                <div className="text-start">Диспетчер</div>
                <div className="text-start">Дата создания (UTC)</div>
                <div className="text-start">Время создания (UTC)</div>
              </div>
            </div>
            
            {/* Table Body with Scrollbar */}
            <div className="overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
              {sessions.length > 0 ? (
                <div className="min-w-full">
                    {sessions.map((session, index) => {
                      const isSelected = selectedSessionId === session.id;
                      const sessionNumber = session.sessionNumber 
                        ? String(session.sessionNumber).padStart(4, '0')
                        : String(index + 1).padStart(4, '0');

                      // Цветовая логика по времени начала/окончания (UTC)
                      const now = new Date();
                      const startUtc = new Date(`${session.date}T${session.startTime || '00:00'}Z`).getTime();
                      const endUtc = session.endTime
                        ? new Date(`${session.date}T${session.endTime}Z`).getTime()
                        : startUtc + 2 * 60 * 60 * 1000;
                      const diffHours = (startUtc - now.getTime()) / (1000 * 60 * 60);

                      let color = 'bg-blue-50 border-blue-200'; // default >2h
                      if (diffHours <= 2 && diffHours > 0) {
                        color = 'bg-yellow-50 border-yellow-200';
                      } else if (now.getTime() >= startUtc && now.getTime() < endUtc) {
                        color = 'bg-emerald-50 border-emerald-200';
                      } else if (now.getTime() >= endUtc) {
                        color = 'bg-red-50 border-red-200';
                      }

                      return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`grid grid-cols-8 gap-4 px-4 py-3 border-b cursor-pointer hover:opacity-80 ${color} ${
                          isSelected ? 'border-l-4 border-l-emerald-500' : 'border-gray-200'
                        }`}
                      >
                        <div className="text-start text-sm">{sessionNumber}</div>
                        <div className="text-start text-sm">{formatDate(session.date)}</div>
                        <div className="text-start text-sm">{formatTime(session.startTime || '—')}</div>
                        <div className="text-start text-sm">{calculateDuration(session.startTime || '00:00', session.endTime)}</div>
                        <div className="text-start text-sm">{validKeysCounts[session.id] || 0}</div>
                        <div className="text-start text-sm">{session.createdByName || '—'}</div>
                        <div className="text-start text-sm">{formatCreatedDate(session.createdAt)}</div>
                        <div className="text-start text-sm">{formatCreatedTime(session.createdAt)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Нет предстоящих сессий
                </div>
              )}
            </div>
          </div>
        )}

        {/* Valid Keys Modal */}
        {selectedSession && (
          <ValidKeysModal
            isOpen={showValidKeysModal}
            onClose={() => setShowValidKeysModal(false)}
            sessionId={selectedSession.id}
          />
        )}

        {/* Check Key Modal */}
        {selectedSession && (
          <CheckKeyModal
            isOpen={showCheckKeyModal}
            onClose={() => setShowCheckKeyModal(false)}
            sessionId={selectedSession.id}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
