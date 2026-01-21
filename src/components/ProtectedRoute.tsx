import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: 'dispatcher' | 'admin';
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, isDispatcher, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }


  if (requireRole === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireRole === 'dispatcher' && !isDispatcher) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
