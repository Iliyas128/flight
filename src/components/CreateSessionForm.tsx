import { useState } from 'react';
import { addSession, generateId, calculateSessionStatus, generateUniqueSessionCode } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface CreateSessionFormProps {
  onSuccess: () => void;
}

export function CreateSessionForm({ onSuccess }: CreateSessionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState('');
  const [registrationStartTime, setRegistrationStartTime] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  
  // Standard closing minutes - will be configured elsewhere later
  const STANDARD_CLOSING_MINUTES = 60;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!date || !registrationStartTime || !startTime || !endTime) {
      setError('Заполните все обязательные поля');
      return;
    }

    const registrationStartDateTime = new Date(`${date}T${registrationStartTime}`);
    const sessionStartDateTime = new Date(`${date}T${startTime}`);
    const sessionEndDateTime = new Date(`${date}T${endTime}`);
    
    if (registrationStartDateTime <= new Date()) {
      setError('Дата и время начала регистрации должны быть в будущем');
      return;
    }

    if (sessionStartDateTime <= registrationStartDateTime) {
      setError('Время начала сессии должно быть позже времени начала регистрации');
      return;
    }

    if (sessionEndDateTime <= sessionStartDateTime) {
      setError('Время окончания сессии должно быть позже начала');
      return;
    }

    // Generate unique session code automatically
    const sessionCode = generateUniqueSessionCode();

    const tempSession = {
      id: '',
      sessionCode: '',
      date,
      registrationStartTime,
      startTime,
      endTime,
      closingMinutes: STANDARD_CLOSING_MINUTES,
      comments: '',
      status: 'open' as const,
      createdAt: ''
    };
    
    const newSession = {
      id: generateId(),
      sessionCode,
      date,
      registrationStartTime,
      startTime,
      endTime,
      closingMinutes: STANDARD_CLOSING_MINUTES,
      comments: comments.trim(),
      status: calculateSessionStatus(tempSession),
      createdAt: new Date().toISOString()
    };

    addSession(newSession);

    setDate('');
    setRegistrationStartTime('');
    setStartTime('');
    setEndTime('');
    setComments('');
    setIsOpen(false);
    onSuccess();
  };

  const handleClose = () => {
    setDate('');
    setRegistrationStartTime('');
    setStartTime('');
    setEndTime('');
    setComments('');
    setError('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Создать сессию
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новая сессия</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="session-date">Дата *</Label>
            <Input
              id="session-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration-start-time">Время начала регистрации *</Label>
            <Input
              id="registration-start-time"
              type="time"
              value={registrationStartTime}
              onChange={(e) => setRegistrationStartTime(e.target.value)}
              className="input-base"
            />
            <p className="text-xs text-muted-foreground">
              Время, когда пилоты могут начать регистрироваться
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-time">Время начала сессии *</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">Время окончания сессии *</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input-base"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Регистрация закроется автоматически за 60 минут до начала сессии
          </p>
          <p className="text-xs text-muted-foreground">
            Код сессии будет сгенерирован автоматически
          </p>
          <div className="space-y-2">
            <Label htmlFor="comments">Комментарии</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Введите комментарии к сессии..."
              className="min-h-[80px] max-h-[200px] resize-y"
              rows={4}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" className="flex-1">
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
