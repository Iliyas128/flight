import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { validKeysApi, sessionsApi } from '@/lib/api';
import { Session } from '@/types';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface CheckKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export function CheckKeyModal({ isOpen, onClose, sessionId }: CheckKeyModalProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [validKeys, setValidKeys] = useState<string[]>([]);
  const [inputKey, setInputKey] = useState('');
  const [checkResult, setCheckResult] = useState<'valid' | 'invalid' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadData();
    } else {
      setSession(null);
      setValidKeys([]);
      setInputKey('');
      setCheckResult(null);
      setError(null);
    }
  }, [isOpen, sessionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load session and valid keys in parallel
      const [sessionData, keysData] = await Promise.all([
        sessionsApi.getById(sessionId),
        validKeysApi.getBySession(sessionId),
      ]);
      
      setSession(sessionData);
      // Handle both array and object with keys property
      const keysArray = Array.isArray(keysData) ? keysData : (keysData.keys || []);
      setValidKeys(keysArray.map((k: any) => k.key.toUpperCase()));
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckKey = () => {
    if (!inputKey.trim()) {
      setCheckResult(null);
      return;
    }

    const keyUpper = inputKey.toUpperCase().trim();
    const isValid = validKeys.includes(keyUpper);
    setCheckResult(isValid ? 'valid' : 'invalid');
  };

  const handleKeyPartChange = (idx: number, val: string) => {
    let letters = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    if (letters.length > 1) {
      const next = letters.slice(0, 3);
      setInputKey(next);
      setCheckResult(null);
      const focusIdx = Math.min(next.length, 2);
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    const parts = inputKey.split('');
    parts[idx] = letters;
    const next = parts.join('').slice(0, 3);
    setInputKey(next);
    setCheckResult(null);
    if (letters && idx < 2) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyInputKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !inputKey[idx] && idx > 0) {
      const parts = inputKey.split('');
      parts[idx - 1] = '';
      setInputKey(parts.join(''));
      inputRefs.current[idx - 1]?.focus();
      setCheckResult(null);
      e.preventDefault();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return '—';
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60; // учитывать переход через полночь
    return `${diffMinutes} мин`;
  };

  const formatCreatedDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return formatDate(dateStr);
  };

  const formatCreatedTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    return formatTime(dateStr);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Проверка ключа</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        ) : !session ? (
          <div className="p-8 text-center text-muted-foreground">
            Сессия не найдена
          </div>
        ) : (
          <div className="space-y-4">
            {/* Session Information Header */}
            <div className="bg-sky-100 border border-sky-300 rounded-lg p-3">
              <div className="grid grid-cols-8 gap-3 text-sm">
                <div className="bg-white border border-gray-300 rounded px-2 py-1">
                  <div className="font-medium text-gray-700 text-xs">№</div>
                  <div className="text-gray-900 font-semibold">
                    {session.sessionNumber ? String(session.sessionNumber).padStart(4, '0') : '—'}
                  </div>
                </div>
                <div className="bg-white border border-gray-300 rounded px-2 py-1">
                  <div className="font-medium text-gray-700 text-xs">Дата начала</div>
                  <div className="text-gray-900 font-semibold">{formatDate(session.date)}</div>
                </div>
                <div className="bg-white border border-gray-300 rounded px-2 py-1">
                  <div className="font-medium text-gray-700 text-xs">Время начала</div>
                  <div className="text-gray-900 font-semibold">{session.startTime || '—'}</div>
                </div>
                <div className="bg-white border border-gray-300 rounded px-2 py-1">
                  <div className="font-medium text-gray-700 text-xs">Длит.</div>
                  <div className="text-gray-900 font-semibold">{calculateDuration(session.startTime || '00:00', session.endTime)}</div>
                </div>
                <div className="bg-white border border-gray-300 rounded px-2 py-1">
                  <div className="font-medium text-gray-700 text-xs">Ключей</div>
                  <div className="text-gray-900 font-semibold">{validKeys.length}</div>
                </div>
                <div className="bg-white border border-gray-300 rounded px-2 py-1">
                  <div className="font-medium text-gray-700 text-xs">Диспетчер</div>
                  <div className="text-gray-900 font-semibold">{session.createdByName || '—'}</div>
                </div>
                <div className="bg-white border border-gray-300 rounded px-2 py-1">
                  <div className="font-medium text-gray-700 text-xs">Дата создания</div>
                  <div className="text-gray-900 font-semibold">{formatCreatedDate(session.createdAt)}</div>
                </div>
                <div className="bg-white border border-gray-300 rounded px-2 py-1">
                  <div className="font-medium text-gray-700 text-xs">Время создания</div>
                  <div className="text-gray-900 font-semibold">{formatCreatedTime(session.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Key Input Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">
                    Введите ключ для проверки
                  </Label>
                  <div className="text-xs text-muted-foreground mb-2">
                    Это окно, в котором показан проверяемый ключ. Ключ надо ввести с клавиатуры.
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <Input
                        key={i}
                        value={inputKey[i] || ''}
                        onChange={(e) => handleKeyPartChange(i, e.target.value)}
                        maxLength={1}
                        ref={(el) => (inputRefs.current[i] = el)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCheckKey();
                      handleKeyInputKeyDown(i, e);
                    }}
                        className="w-16 text-center font-mono text-lg font-bold"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleCheckKey}
                    disabled={!inputKey.trim() || inputKey.length !== 3}
                    className="bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    Проверить
                  </Button>
                </div>
              </div>

              {/* Check Result */}
              {checkResult !== null && (
                <div className={`p-4 rounded-lg border-2 ${
                  checkResult === 'valid' 
                    ? 'bg-green-50 border-green-500 text-green-700' 
                    : 'bg-red-50 border-red-500 text-red-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {checkResult === 'valid' ? (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-semibold">Ключ валидный</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" />
                        <span className="font-semibold">Невалидный ключ</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Info Text */}
              <div className="text-xs text-muted-foreground p-3 bg-gray-50 rounded border border-dashed border-gray-300">
                Это информация о сессии, для которой проверяется ключ.
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
