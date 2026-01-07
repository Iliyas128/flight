import { useState } from 'react';
import { addSession, generateId, calculateSessionStatus } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface CreateSessionFormProps {
  onSuccess: () => void;
}

export function CreateSessionForm({ onSuccess }: CreateSessionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [closingMinutes, setClosingMinutes] = useState('60');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !date || !time) {
      setError('Заполните все обязательные поля');
      return;
    }

    const sessionDateTime = new Date(`${date}T${time}`);
    if (sessionDateTime <= new Date()) {
      setError('Дата и время должны быть в будущем');
      return;
    }

    const minutes = parseInt(closingMinutes) || 60;
    if (minutes < 0) {
      setError('Время закрытия не может быть отрицательным');
      return;
    }

    const newSession = {
      id: generateId(),
      name: name.trim(),
      date,
      time,
      closingMinutes: minutes,
      status: calculateSessionStatus({ date, time, closingMinutes: minutes } as any),
      createdAt: new Date().toISOString()
    };

    addSession(newSession);

    setName('');
    setDate('');
    setTime('');
    setClosingMinutes('60');
    setIsOpen(false);
    onSuccess();
  };

  const handleClose = () => {
    setName('');
    setDate('');
    setTime('');
    setClosingMinutes('60');
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
            <Label htmlFor="session-name">Название сессии *</Label>
            <Input
              id="session-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Утренний брифинг"
              className="input-base"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="session-time">Время *</Label>
              <Input
                id="session-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input-base"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="closing-minutes">Закрытие записи за (мин)</Label>
            <Input
              id="closing-minutes"
              type="number"
              min="0"
              value={closingMinutes}
              onChange={(e) => setClosingMinutes(e.target.value)}
              placeholder="60"
              className="input-base"
            />
            <p className="text-xs text-muted-foreground">
              Запись закроется за указанное количество минут до начала
            </p>
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
