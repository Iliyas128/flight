import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validKeysApi, ValidKey, sessionsApi } from '@/lib/api';
import { Session } from '@/types';
import { Loader2 } from 'lucide-react';

interface ValidKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export function ValidKeysModal({ isOpen, onClose, sessionId }: ValidKeysModalProps) {
  const [keys, setKeys] = useState<ValidKey[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState('');

  useEffect(() => {
    if (isOpen && sessionId) {
      loadData();
    } else {
      setKeys([]);
      setSession(null);
      setError(null);
      setSearchKey('');
    }
  }, [isOpen, sessionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load session and keys in parallel
      const [sessionData, keysData] = await Promise.all([
        sessionsApi.getById(sessionId),
        validKeysApi.getBySession(sessionId),
      ]);
      
      setSession(sessionData);
      setKeys(keysData.keys);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    })} UTC`;
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
    return `${formatDate(dateStr)} (UTC)`;
  };

  const formatCreatedTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    return formatTime(dateStr);
  };

  // Check if search key matches any key (by first letters)
  const getSearchKeyStatus = (): 'valid' | 'invalid' | 'empty' => {
    if (!searchKey.trim()) return 'empty';
    
    const searchUpper = searchKey.toUpperCase();
    const hasMatch = keys.some(key => key.key.startsWith(searchUpper));
    
    return hasMatch ? 'valid' : 'invalid';
  };

  // Get matching keys for highlighting
  const getMatchingKeys = (): Set<string> => {
    if (!searchKey.trim()) return new Set();
    
    const searchUpper = searchKey.toUpperCase();
    const matching = keys.filter(key => key.key.startsWith(searchUpper));
    return new Set(matching.map(k => k.id));
  };

  const matchingKeyIds = getMatchingKeys();
  const searchStatus = getSearchKeyStatus();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSearchPartChange = (idx: number, val: string) => {
    let letters = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    if (letters.length > 1) {
      setSearchKey(letters.slice(0, 3));
      const nextIdx = Math.min(letters.length, 2);
      inputRefs.current[nextIdx]?.focus();
      return;
    }
    const parts = searchKey.split('');
    parts[idx] = letters;
    const next = parts.join('').slice(0, 3);
    setSearchKey(next);
    if (letters && idx < 2) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Валидные ключи сессии</DialogTitle>
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
                  <div className="text-gray-900 font-semibold">{keys.length}</div>
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

            {/* Key Search Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Поиск ключа
              </Label>
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <Input
                    key={i}
                    value={searchKey[i] || ''}
                    onChange={(e) => handleSearchPartChange(i, e.target.value)}
                    maxLength={1}
                    ref={(el) => (inputRefs.current[i] = el)}
                    className={`w-14 text-center font-mono text-lg font-bold ${
                      searchStatus === 'valid'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : searchStatus === 'invalid'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : ''
                    }`}
                  />
                ))}
              </div>
              {searchKey && (
                <p className="text-xs text-muted-foreground">
                  {searchStatus === 'valid'
                    ? `✓ Найдено ключей: ${matchingKeyIds.size}`
                    : searchStatus === 'invalid'
                    ? '✗ Ключей с таким началом не найдено'
                    : ''}
                </p>
              )}
            </div>

            {/* Keys List */}
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700">
                Список ключей и информация о пилотах, их получивших
              </div>
              {keys.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-gray-200 rounded">
                  Нет валидных ключей для этой сессии
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                  {/* Table Headers */}
                  <div className="bg-white border-b border-gray-300">
                    <div className="grid grid-cols-5 gap-4 px-4 py-2 text-sm font-medium text-gray-700">
                      <div className="text-start">№</div>
                      <div className="text-start">Ключ</div>
                      <div className="text-start">Пилот</div>
                      <div className="text-start">Дата получения</div>
                      <div className="text-start">Время получения</div>
                    </div>
                  </div>
                  
                  {/* Table Body */}
                  <div>
                    {keys.map((key, index) => {
                      const isHighlighted = matchingKeyIds.has(key.id);
                      return (
                        <div
                          key={key.id}
                          className={`grid grid-cols-5 gap-4 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 ${
                            isHighlighted ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                          }`}
                        >
                          <div className="text-start text-sm">{index + 1}</div>
                          <div className={`text-start text-sm font-mono font-semibold ${
                            isHighlighted ? 'text-emerald-700' : ''
                          }`}>{key.key}</div>
                          <div className="text-start text-sm">{key.pilotName}</div>
                          <div className="text-start text-sm">{formatDate(key.createdAt)}</div>
                          <div className="text-start text-sm">{formatTime(key.createdAt)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
