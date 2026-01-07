import { useState, Fragment } from 'react';
import { Session, Participant } from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatDateTime, formatDate, deleteSession, updateParticipantValidity, updateSessionComments } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, Users, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';

interface SessionsTableProps {
  sessions: Session[];
  participants: Participant[];
  onDelete?: (id: string) => void;
  onUpdate?: () => void;
  readOnly?: boolean;
}

export function SessionsTable({ sessions, participants, onDelete, onUpdate, readOnly = false }: SessionsTableProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingComments, setEditingComments] = useState<string | null>(null);
  const [commentsValue, setCommentsValue] = useState('');

  const getParticipantCount = (sessionId: string) => {
    return participants.filter(p => p.sessionId === sessionId).length;
  };

  const getSessionParticipants = (sessionId: string) => {
    return participants.filter(p => p.sessionId === sessionId);
  };

  const handleDelete = (id: string) => {
    deleteSession(id);
    setDeleteConfirm(null);
    onDelete?.(id);
  };

  const handleToggleValidity = (participantId: string, currentValidity: boolean | null) => {
    // Toggle: null -> true -> false -> true (cycle)
    let newValidity: boolean | null;
    if (currentValidity === null || currentValidity === false) {
      newValidity = true; // Mark as valid
    } else {
      newValidity = false; // Mark as invalid
    }
    updateParticipantValidity(participantId, newValidity);
    // Update data
    onUpdate?.();
  };

  const handleEditComments = (session: Session) => {
    // If editing another session, cancel previous edit
    if (editingComments && editingComments !== session.id) {
      setEditingComments(null);
      setCommentsValue('');
    }
    setEditingComments(session.id);
    setCommentsValue(session.comments || '');
  };

  const handleSaveComments = (sessionId: string) => {
    updateSessionComments(sessionId, commentsValue);
    setEditingComments(null);
    setCommentsValue('');
    // Update data to reflect changes
    onUpdate?.();
  };

  if (sessions.length === 0) {
    return (
      <div className="card-base p-8 text-center text-muted-foreground">
        Нет сессий для отображения
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card-base overflow-hidden w-full">
        <div className="overflow-x-auto -mx-1 sm:mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="table-header table-cell">Код сессии</th>
                <th className="table-header table-cell hidden sm:table-cell">Дата и время</th>
                {readOnly && <th className="table-header table-cell hidden sm:table-cell">Дата создания</th>}
                <th className="table-header table-cell">Статус</th>
                <th className="table-header table-cell text-center">Участники</th>
                {!readOnly && <th className="table-header table-cell w-20"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((session) => {
                const count = getParticipantCount(session.id);
                const isExpanded = expandedSession === session.id;
                const sessionParticipants = getSessionParticipants(session.id);
                
                return (
                  <Fragment key={session.id}>
                    <tr className="even:bg-slate-50 hover:bg-slate-50/80">
                      <td className="table-cell font-medium">
                        <div>
                          <span className="font-mono text-lg font-bold text-primary">
                            {session.sessionCode || 'N/A'}
                          </span>
                          <span className="block sm:hidden text-xs text-muted-foreground mt-0.5">
                            {formatDateTime(session.date, session.startTime || (session as any).time || '00:00', session.endTime)}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell text-muted-foreground hidden sm:table-cell">
                        {formatDateTime(session.date, session.startTime || (session as any).time || '00:00', session.endTime)}
                      </td>
                      {readOnly && (
                        <td className="table-cell text-muted-foreground hidden sm:table-cell text-sm">
                          {session.createdAt ? formatDate(session.createdAt) : '—'}
                        </td>
                      )}
                      <td className="table-cell">
                        <StatusBadge status={session.status} />
                      </td>
                      <td className="table-cell text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            // Toggle this session (don't close others)
                            setExpandedSession(isExpanded ? null : session.id);
                          }}
                          disabled={count === 0}
                        >
                          <Users className="h-4 w-4" />
                          {count}
                          {count > 0 && (
                            isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                      </td>
                      {!readOnly && (
                        <td className="table-cell">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(session.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                    {isExpanded && (
                      <tr key={`${session.id}-expanded`}>
                        <td colSpan={readOnly ? 5 : 5} className="p-0">
                          <div className="bg-slate-50 px-4 py-4 space-y-4">
                            {/* Comments Section */}
                            {!readOnly && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm font-medium">Комментарии</Label>
                                  {editingComments !== session.id && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditComments(session)}
                                    >
                                      {session.comments ? 'Редактировать' : 'Добавить'}
                                    </Button>
                                  )}
                                </div>
                                {editingComments === session.id ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={commentsValue}
                                      onChange={(e) => setCommentsValue(e.target.value)}
                                      placeholder="Введите комментарии..."
                                      className="h-[120px] w-full max-w-full resize-none overflow-y-auto overflow-x-hidden"
                                      style={{ wordBreak: 'break-word' }}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveComments(session.id)}
                                      >
                                        Сохранить
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingComments(null);
                                          setCommentsValue('');
                                        }}
                                      >
                                        Отмена
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-white rounded border border-border p-3 h-[120px] w-full max-w-full overflow-y-auto overflow-x-hidden" style={{ wordBreak: 'break-word' }}>
                                    {session.comments && session.comments.trim() ? (
                                      <p className="text-sm whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{session.comments}</p>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">Нет комментариев</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Participants Table */}
                            {count > 0 && (
                              <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">
                                  Участники ({count}):
                                </div>
                                <div className="bg-white rounded border border-border overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-slate-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Имя</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Код валидности</th>
                                        {!readOnly && (
                                          <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-24">Валидность</th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                      {sessionParticipants.map((p) => {
                                        const getValidityColor = () => {
                                          if (p.isValid === true) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
                                          if (p.isValid === false) return 'text-red-600 bg-red-50 border-red-200';
                                          return 'text-slate-600 bg-slate-50 border-slate-200';
                                        };

                                        const getValidityIcon = () => {
                                          if (p.isValid === true) return <CheckCircle2 className="h-4 w-4" />;
                                          if (p.isValid === false) return <XCircle className="h-4 w-4" />;
                                          return null;
                                        };

                                        return (
                                          <tr key={p.id} className="hover:bg-slate-50/50">
                                            <td className="px-3 py-2">{p.name}</td>
                                            <td className="px-3 py-2">
                                              <span className="font-mono">{p.validationCode}</span>
                                            </td>
                                            {!readOnly && (
                                              <td className="px-3 py-2 text-center">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleToggleValidity(p.id, p.isValid)}
                                                  className={`h-8 w-8 p-0 ${getValidityColor()}`}
                                                >
                                                  {getValidityIcon()}
                                                </Button>
                                              </td>
                                            )}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Удалить сессию?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Все зарегистрированные участники также будут удалены.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">
              Отмена
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="flex-1"
            >
              Удалить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
