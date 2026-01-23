import { useState } from 'react';
import { sessionsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateSessionFormProps {
  onSuccess: () => void;
}

export function CreateSessionForm({ onSuccess }: CreateSessionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [endMode, setEndMode] = useState<'duration' | 'endTime'>('duration');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Standard closing minutes - will be configured elsewhere later
  const STANDARD_CLOSING_MINUTES = 60;

  // Convert local Date to UTC parts
  const toUtcParts = (dateObj: Date) => {
    const iso = dateObj.toISOString(); // always UTC
    return {
      date: iso.slice(0, 10),
      time: iso.slice(11, 16),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!startDateTime) {
      setError('Введите дату и время начала сессии');
      return;
    }

    const sessStartLocal = new Date(startDateTime);

    if (sessStartLocal <= new Date()) {
      setError('Дата и время начала сессии должны быть в будущем');
      return;
    }

    let resolvedEndLocal: Date | null = endDateTime ? new Date(endDateTime) : null;

    if (endMode === 'duration') {
      if (!durationMinutes || durationMinutes <= 0) {
        setError('Длительность должна быть больше 0 минут');
        return;
      }
      const computedEnd = new Date(sessStartLocal.getTime() + durationMinutes * 60 * 1000);
      resolvedEndLocal = computedEnd;
    } else {
      if (!resolvedEndLocal) {
        setError('Введите дату и время окончания или выберите длительность');
        return;
      }
    }

    const sessEndLocal = resolvedEndLocal;

    if (!sessEndLocal || sessEndLocal <= sessStartLocal) {
      setError('Время окончания сессии должно быть позже начала');
      return;
    }

    // UTC parts for payload
    const startUtc = toUtcParts(sessStartLocal);
    const endUtc = sessEndLocal ? toUtcParts(sessEndLocal) : null;

    try {
      setSubmitting(true);
      const sessionData: any = {
        date: startUtc.date,
        registrationStartTime: startUtc.time,
        startTime: startUtc.time,
        closingMinutes: STANDARD_CLOSING_MINUTES,
        comments: comments.trim(),
      };

      // Only include endTime if it's provided
      if (endUtc?.time) {
        sessionData.endTime = endUtc.time;
      }

      // Debug: log the data being sent

      await sessionsApi.create(sessionData);

      setStartDateTime('');
      setEndDateTime('');
      setDurationMinutes(60);
      setEndMode('duration');
      setComments('');
      toast.success('Сессия успешно создана');
      setIsOpen(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error creating session:', err);
      // Extract error message from API response
      let errorMessage = 'Ошибка при создании сессии';
      
      // Check for Zod validation errors
      if (err.details && Array.isArray(err.details)) {
        const messages = err.details.map((d: any) => {
          if (typeof d === 'string') return d;
          return d.message || `${d.path?.join('.') || 'Поле'}: ${d.message || 'неверное значение'}`;
        });
        errorMessage = messages.join(', ');
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStartDateTime('');
    setEndDateTime('');
    setDurationMinutes(60);
    setEndMode('duration');
    setComments('');
    setError('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-sky-500 text-white hover:bg-sky-600 border-sky-500" variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Создать сессию
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новая сессия</DialogTitle>
          <DialogDescription>
            Укажите время начала и длительность или конец (UTC будет сохранён).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={endMode === 'duration' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEndMode('duration')}
              >
                Указать длительность
              </Button>
              <Button
                type="button"
                variant={endMode === 'endTime' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEndMode('endTime')}
              >
                Указать окончание
              </Button>
            </div>

            {endMode === 'duration' ? (
              <div className="space-y-2">
                <Label htmlFor="duration-minutes">Длительность сессии (мин) *</Label>
                <Input
                  id="duration-minutes"
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="input-base"
                />
                <p className="text-xs text-muted-foreground">
                  Окончание рассчитывается автоматически
                </p>
              </div>
            ) : (
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
            )}
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
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Создаём...
                </span>
              ) : (
                'Создать'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
