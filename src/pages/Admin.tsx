import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, sessionsApi, participantsApi } from '@/lib/api';
import { User, Session, Participant } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SessionsTable } from '@/components/SessionsTable';
import { Shield, Plus, Trash2, LogOut, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Admin = () => {
  const { isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [dispatchers, setDispatchers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [newDispatcher, setNewDispatcher] = useState({
    username: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  const loadData = async () => {
    try {
      const [dispatchersData, sessionsData, participantsData] = await Promise.all([
        authApi.getDispatchers(),
        sessionsApi.getAll('all'),
        participantsApi.getAll(),
      ]);
      setDispatchers(dispatchersData);
      sessionsData.sort((a, b) => {
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdB - createdA;
      });
      setSessions(sessionsData);
      setParticipants(participantsData);
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispatcher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newDispatcher.username || !newDispatcher.password || !newDispatcher.name) {
      setError('Заполните все поля');
      return;
    }

    if (newDispatcher.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    try {
      const created = await authApi.createDispatcher(
        newDispatcher.username,
        newDispatcher.password,
        newDispatcher.name
      );
      toast.success(`Диспетчер создан. Пароль: ${created.password}`);
      setNewDispatcher({ username: '', password: '', name: '' });
      setShowCreateDialog(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании диспетчера');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту сессию из архива?')) {
      return;
    }

    try {
      await sessionsApi.delete(sessionId);
      toast.success('Сессия удалена из архива');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при удалении сессии');
    }
  };

  const togglePasswordVisibility = (dispatcherId: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [dispatcherId]: !prev[dispatcherId],
    }));
  };

  const formatCreatedAt = (value?: string) => {
    if (!value) return '—';
    const d = new Date(value);
    const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  };

  const formatStatusRu = (status: Session['status']) => {
    switch (status) {
      case 'open':
        return 'Открыта';
      case 'closing':
        return 'Скоро закрывается';
      case 'closed':
        return 'Закрыта';
      case 'completed':
        return 'Завершена';
      default:
        return status;
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="page-container py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Панель администратора</span>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  {user?.name || 'Администратор'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/')}>
                  ← Вернуться к записи
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="page-container py-6">
        <div className="mb-6">
          <h1 className="page-title mb-1">Управление системой</h1>
          <p className="text-sm text-muted-foreground">
            Управление диспетчерами и архивом сессий
          </p>
        </div>

        {/* Dispatchers Section */}
        <div className="card-base p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Диспетчеры</h2>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать диспетчера
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Загрузка...</p>
          ) : dispatchers.length === 0 ? (
            <p className="text-muted-foreground">Нет диспетчеров</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Логин</TableHead>
                  <TableHead>Имя диспетчера</TableHead>
                  <TableHead>Пароль</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispatchers.map((dispatcher) => (
                  <TableRow key={dispatcher.id}>
                    <TableCell>{dispatcher.username}</TableCell>
                    <TableCell>{dispatcher.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {showPassword[dispatcher.id] ? (dispatcher.plainPassword || '—') : '••••••••'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePasswordVisibility(dispatcher.id)}
                      >
                        {showPassword[dispatcher.id] ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Скрыть пароль
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Показать пароль
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Archive Section */}
        <div className="card-base p-6">
          <h2 className="text-xl font-semibold mb-4">Все сессии</h2>

          {loading ? (
            <p className="text-muted-foreground">Загрузка...</p>
          ) : sessions.length === 0 ? (
            <p className="text-muted-foreground">Сессий нет</p>
          ) : (
            <SessionsTable 
              sessions={sessions}
              participants={participants}
              onUpdate={loadData}
              onDelete={handleDeleteSession}
              readOnly={false}
              allowValidityToggle={false}
              showCommentsSection={false}
            />
          )}
        </div>

        {/* Create Dispatcher Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать диспетчера</DialogTitle>
              <DialogDescription>
                Создайте учетную запись диспетчера. Пароль будет показан после создания.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDispatcher} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя диспетчера</Label>
                <Input
                  id="name"
                  value={newDispatcher.name}
                  onChange={(e) => setNewDispatcher({ ...newDispatcher, name: e.target.value })}
                  placeholder="Введите имя диспетчера"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Логин</Label>
                <Input
                  id="username"
                  value={newDispatcher.username}
                  onChange={(e) => setNewDispatcher({ ...newDispatcher, username: e.target.value })}
                  placeholder="Введите имя пользователя (мин. 3 символа)"
                  required
                  minLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={newDispatcher.password}
                  onChange={(e) => setNewDispatcher({ ...newDispatcher, password: e.target.value })}
                  placeholder="Введите пароль (мин. 6 символов)"
                  required
                  minLength={6}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                  Отмена
                </Button>
                <Button type="submit" className="flex-1">
                  Создать
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Admin;
