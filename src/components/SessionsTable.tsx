import { useState } from 'react';
import { Session, Participant } from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatDateTime, deleteSession } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react';

interface SessionsTableProps {
  sessions: Session[];
  participants: Participant[];
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

export function SessionsTable({ sessions, participants, onDelete, readOnly = false }: SessionsTableProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  if (sessions.length === 0) {
    return (
      <div className="card-base p-8 text-center text-muted-foreground">
        Нет сессий для отображения
      </div>
    );
  }

  return (
    <div className="card-base overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header table-cell">Название</th>
              <th className="table-header table-cell hidden sm:table-cell">Дата и время</th>
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
                <>
                  <tr key={session.id} className="even:bg-slate-50 hover:bg-slate-50/80">
                    <td className="table-cell font-medium">
                      <div>
                        {session.name}
                        <span className="block sm:hidden text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(session.date, session.time)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-muted-foreground hidden sm:table-cell">
                      {formatDateTime(session.date, session.time)}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={session.status} />
                    </td>
                    <td className="table-cell text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => setExpandedSession(isExpanded ? null : session.id)}
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
                  {isExpanded && count > 0 && (
                    <tr key={`${session.id}-expanded`}>
                      <td colSpan={readOnly ? 4 : 5} className="p-0">
                        <div className="bg-slate-100 px-4 py-3">
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Участники сессии:
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {sessionParticipants.map((p) => (
                              <div 
                                key={p.id}
                                className="bg-white rounded px-3 py-2 text-sm border border-border"
                              >
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-muted-foreground">{p.email}</div>
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary text-xs font-mono rounded">
                                    {p.code}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
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
