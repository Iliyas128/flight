import { useState } from 'react';
import { Session } from '@/types';
import { addParticipant, generateCode, generateId } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegistrationModalProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegistrationModal({ session, isOpen, onClose, onSuccess }: RegistrationModalProps) {
  const [name, setName] = useState('');
  const [validationCode, setValidationCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !validationCode.trim()) {
      setError('Заполните все поля');
      return;
    }

    // Validate: 3 Latin letters, case-insensitive
    const codeRegex = /^[A-Za-z]{3}$/;
    if (!codeRegex.test(validationCode)) {
      setError('Код валидности должен состоять из 3 латинских букв');
      return;
    }

    addParticipant({
      id: generateId(),
      sessionId: session.id,
      name: name.trim(),
      validationCode: validationCode.trim().toUpperCase(),
      code: '', // No code for pilots
      isValid: null, // Will be checked by dispatcher later
      registeredAt: new Date().toISOString()
    });

    // Close modal and reset form
    setName('');
    setValidationCode('');
    onClose();
    onSuccess();
  };

  const handleClose = () => {
    setName('');
    setValidationCode('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
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
            <Label htmlFor="validation-code">Код валидности *</Label>
            <Input
              id="validation-code"
              type="text"
              value={validationCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
                setValidationCode(value);
              }}
              placeholder="ABC"
              maxLength={3}
              className="input-base font-mono text-center text-lg tracking-widest"
            />
            <p className="text-xs text-muted-foreground">
              3 латинские буквы
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
              Записаться
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
