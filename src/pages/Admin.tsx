import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, sessionsApi } from '@/lib/api';
import { User, Session } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Plus, Trash2, LogOut, Eye, EyeOff, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/StatusBadge';

const Admin = () => {
  const { isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [dispatchers, setDispatchers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [newDispatcher, setNewDispatcher] = useState({
    username: '',
    password: '',
    name: '',
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dispatchersData, sessionsData] = await Promise.all([
        authApi.getDispatchers(),
        sessionsApi.getAll(), // Все сессии (активные + архив)
      ]);
      setDispatchers(dispatchersData);
      setSessions(sessionsData);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      toast.error(err.message || 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const handleCreateDispatcher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDispatcher.username || !newDispatcher.password || !newDispatcher.name) {
      toast.error('Заполните все поля');
      return;
    }

    if (newDispatcher.password.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      const created = await authApi.createDispatcher(
        newDispatcher.username,
        newDispatcher.password,
        newDispatcher.name
      );
      toast.success(`Диспетчер ${created.name} создан. Пароль: ${created.password}`);
      setNewDispatcher({ username: '', password: '', name: '' });
      setShowCreateDialog(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при создании диспетчера');
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

  const calculateDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return '—';
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60; // переход через полночь
    return `${diff} мин`;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="page-container">
          <div className="grid grid-cols-3 items-center h-14">
            {/* Left: Logo */}
            <div className="flex items-center justify-start">
              <div className="hidden md:flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Администратор</span>
              </div>
              <Shield className="h-5 w-5 text-primary md:hidden" />
            </div>

            {/* Center: Title (mobile) */}
            <div className="flex items-center justify-center">
              <span className="font-semibold text-foreground text-center md:hidden">
                Панель администратора
              </span>
            </div>

            {/* Right: Back button and menu */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground md:hidden"
              >
                ← Вернуться к записи
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <button
                      onClick={() => navigate('/')}
                      className="w-full text-left"
                    >
                      ← Вернуться к записи
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Desktop: User menu */}
              <div className="hidden md:flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {user?.name || 'Администратор'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <button onClick={() => navigate('/')} className="w-full text-left">
                        ← Вернуться к записи
                      </button>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="page-container py-6">
        <div className="space-y-8">
          

          {/* Dispatchers Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Диспетчеры</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Создавайте учетные записи диспетчеров и предоставляйте им пароли для входа
                </p>
              </div>
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
              <div className="card-base overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Логин</TableHead>
                      <TableHead>Имя диспетчера</TableHead>
                      <TableHead>Пароль</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatchers.map((dispatcher) => (
                      <TableRow key={dispatcher.id}>
                        <TableCell className="font-medium">{dispatcher.username}</TableCell>
                        <TableCell>{dispatcher.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {showPassword[dispatcher.id!]
                                ? (dispatcher as any).plainPassword || '••••••••'
                                : '••••••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => togglePasswordVisibility(dispatcher.id!)}
                            >
                              {showPassword[dispatcher.id!] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Archive Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Архив сессий</h2>

            {loading ? (
              <p className="text-muted-foreground">Загрузка...</p>
            ) : sessions.length === 0 ? (
              <p className="text-muted-foreground">Нет завершенных сессий</p>
            ) : (
              <div className="card-base overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Номер сессии</TableHead>
                      <TableHead>Время</TableHead>
                      <TableHead>Время полёта</TableHead>
                      <TableHead>Дата создания (UTC)</TableHead>
                      <TableHead>Создатель</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => {
                      const startUtc = new Date(`${session.date}T${session.startTime || '00:00'}Z`).getTime();
                      const endUtc = session.endTime
                        ? new Date(`${session.date}T${session.endTime}Z`).getTime()
                        : startUtc + 2 * 60 * 60 * 1000;
                      const now = Date.now();
                      const diffHours = (startUtc - now) / (1000 * 60 * 60);

                      let rowColor = '';
                      if (diffHours > 2) {
                        rowColor = 'bg-blue-50';
                      } else if (diffHours <= 2 && diffHours > 0) {
                        rowColor = 'bg-yellow-50';
                      } else if (now >= startUtc && now < endUtc) {
                        rowColor = 'bg-emerald-50';
                      } else if (now >= endUtc) {
                        rowColor = 'bg-red-50';
                      }

                      return (
                        <TableRow key={session.id} className={rowColor}>
                          <TableCell className="font-medium">
                            <span className="font-mono text-lg font-bold text-primary">
                              {session.sessionNumber
                                ? String(session.sessionNumber).padStart(4, '0')
                                : session.sessionCode || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {session.startTime || '—'} {session.endTime ? `- ${session.endTime}` : ''}
                          </TableCell>
                          <TableCell>
                            {calculateDuration(session.startTime, session.endTime)}
                          </TableCell>
                          <TableCell>
                            {session.createdAt
                              ? `${new Date(session.createdAt).toLocaleString('ru-RU', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'UTC',
                                })} UTC`
                              : '—'}
                          </TableCell>
                          <TableCell>{session.createdByName || '—'}</TableCell>
                          <TableCell>
                            <StatusBadge status={session.status} />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Dispatcher Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Создать диспетчера</DialogTitle>
            <DialogDescription>
              Создайте новую учетную запись диспетчера. Пароль будет показан после создания.
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
                placeholder="Введите логин"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword.create ? 'text' : 'password'}
                  value={newDispatcher.password}
                  onChange={(e) => setNewDispatcher({ ...newDispatcher, password: e.target.value })}
                  placeholder="Минимум 6 символов"
                  required
                  minLength={6}
                  className="pr-10 no-reveal"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setShowPassword((prev) => ({ ...prev, create: !prev.create }))
                  }
                  aria-label={showPassword.create ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword.create ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
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
    </div>
  );
};

export default Admin;
