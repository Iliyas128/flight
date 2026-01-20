import { useState } from 'react';
import { sessionsApi } from '@/lib/api';
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
  const [registrationStartDateTime, setRegistrationStartDateTime] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  
  // Standard closing minutes - will be configured elsewhere later
  const STANDARD_CLOSING_MINUTES = 60;

  // Helper function to extract date (YYYY-MM-DD) from datetime-local value
  const extractDate = (datetimeLocal: string): string => {
    if (!datetimeLocal) return '';
    return datetimeLocal.split('T')[0];
  };

  // Helper function to extract time (HH:MM) from datetime-local value
  const extractTime = (datetimeLocal: string): string => {
    if (!datetimeLocal) return '';
    return datetimeLocal.split('T')[1]?.substring(0, 5) || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!registrationStartDateTime || !startDateTime || !endDateTime) {
      setError('Заполните все обязательные поля');
      return;
    }

    const regStart = new Date(registrationStartDateTime);
    const sessStart = new Date(startDateTime);
    const sessEnd = new Date(endDateTime);
    
    if (regStart <= new Date()) {
      setError('Дата и время начала регистрации должны быть в будущем');
      return;
    }

    if (sessStart <= regStart) {
      setError('Время начала сессии должно быть позже времени начала регистрации');
      return;
    }

    if (sessEnd <= sessStart) {
      setError('Время окончания сессии должно быть позже начала');
      return;
    }

    // Extract date from registration start (use as main date for session)
    const date = extractDate(registrationStartDateTime);
    const registrationStartTime = extractTime(registrationStartDateTime);
    const startTime = extractTime(startDateTime);
    const endTime = extractTime(endDateTime);

    try {
      await sessionsApi.create({
        date,
        registrationStartTime,
        startTime,
        endTime,
        closingMinutes: STANDARD_CLOSING_MINUTES,
        comments: comments.trim(),
      });

      setRegistrationStartDateTime('');
      setStartDateTime('');
      setEndDateTime('');
      setComments('');
      setIsOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании сессии');
    }
  };

  const handleClose = () => {
    setRegistrationStartDateTime('');
    setStartDateTime('');
    setEndDateTime('');
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
            <Label htmlFor="registration-start-datetime">Дата и время начала регистрации *</Label>
            <Input
              id="registration-start-datetime"
              type="datetime-local"
              value={registrationStartDateTime}
              onChange={(e) => setRegistrationStartDateTime(e.target.value)}
              className="input-base"
            />
            <p className="text-xs text-muted-foreground">
              Время, когда пилоты могут начать регистрироваться
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-datetime">Дата и время начала сессии *</Label>
            <Input
              id="start-datetime"
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="input-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-datetime">Дата и время окончания сессии *</Label>
            <Input
              id="end-datetime"
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="input-base"
            />
          </div>

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
