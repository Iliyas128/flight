import { useState } from 'react';
import { Session } from '@/types';
import { isEmailRegistered, addParticipant, generateCode, generateId } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Copy, Check } from 'lucide-react';

interface RegistrationModalProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegistrationModal({ session, isOpen, onClose, onSuccess }: RegistrationModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Заполните все поля');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Введите корректный email');
      return;
    }

    if (isEmailRegistered(session.id, email)) {
      setError('Этот email уже зарегистрирован на данную сессию');
      return;
    }

    const code = generateCode();
    addParticipant({
      id: generateId(),
      sessionId: session.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      code,
      registeredAt: new Date().toISOString()
    });

    setGeneratedCode(code);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setError('');
    setGeneratedCode('');
    setCopied(false);
    onClose();
    if (generatedCode) {
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {generatedCode ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Регистрация успешна
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Вы успешно зарегистрировались на сессию «{session.name}».
                Сохраните ваш персональный код:
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-lg p-4 text-center">
                  <span className="text-3xl font-mono font-bold tracking-widest text-primary">
                    {generatedCode}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Предъявите этот код при посещении сессии
              </p>
              <Button onClick={handleClose} className="w-full">
                Закрыть
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Запись на сессию</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите ваше имя"
                  className="input-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="input-base"
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
                  Записаться
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
