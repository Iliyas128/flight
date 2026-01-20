import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Archive, Menu, X, Plane, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { path: '/dispatcher', label: 'Управление', icon: LayoutDashboard },
  { path: '/dispatcher/archive', label: 'Архив', icon: Archive },
];

export function DispatcherHeader() {
  const { user, logout, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="page-container">
        <div className="grid grid-cols-3 items-center h-14">
          {/* Left: Logo (desktop) or empty (mobile) */}
          <div className="flex items-center justify-start">
            <Link to="/dispatcher" className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Plane className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">
                Диспетчер
              </span>
            </Link>
            <Plane className="h-5 w-5 text-primary md:hidden" />
          </div>

          {/* Center: Role name (mobile) or Navigation (desktop) */}
          <div className="flex items-center justify-center">
            {/* Mobile: Show role name */}
            <span className="font-semibold text-foreground text-center md:hidden">
              {user?.name || 'Диспетчер'}
            </span>
            
            {/* Desktop: Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Back button and menu */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/'}
              className="text-muted-foreground hover:text-foreground md:hidden"
            >
              ← Назад
            </Button>
            <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-2 w-full
                          ${isActive ? 'bg-accent font-medium' : ''}
                        `}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 w-full"
                      >
                        <Shield className="h-4 w-4" />
                        Админ
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full"
                  >
                    ← Вернуться к записи
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Desktop: User menu */}
            <div className="hidden md:flex items-center gap-3">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Админ
                  </Button>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {user?.name || 'Пользователь'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/">← Вернуться к записи</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


