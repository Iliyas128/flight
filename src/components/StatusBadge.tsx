import { SessionStatus } from '@/types';

interface StatusBadgeProps {
  status: SessionStatus;
}

const statusLabels: Record<SessionStatus, string> = {
  upcoming: 'Скоро откроется',
  open: 'Открыта',
  closing: 'Скоро закрывается',
  closed: 'Закрыта',
  completed: 'Завершена'
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const baseClass = 'status-badge';
  const statusClass = `status-${status}`;
  
  return (
    <span className={`${baseClass} ${statusClass}`}>
      {statusLabels[status]}
    </span>
  );
}
